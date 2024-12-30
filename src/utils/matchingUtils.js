// Time utilities
const timeUtils = {
  parseTime: (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  formatTime: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  addHours: (time, hoursToAdd) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (hoursToAdd * 60);
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  }
};

// Meeting slot utilities
const slotUtils = {
  parseSlot: (slot) => {
    if (!slot) return null;
    const [day, timeRange] = slot.split(' ');
    if (!timeRange) return null;
    const [start, end] = timeRange.split('-').map(timeUtils.parseTime);
    return { day, start, end };
  },

  formatSlot: (day, start, end) => 
    `${day} ${timeUtils.formatTime(start)}-${timeUtils.formatTime(end)}`,

  hasMinimumDuration: (start, end, minMinutes = 60) => 
    (end - start) >= minMinutes
};

// Constants
const CONSTANTS = {
  MIN_SLOT_DURATION: 60,
  MAX_WAITING_DAYS: 30,
  AVG_WAITING_DAYS: 7,
  MAX_SCORE_POINTS: 3,
  DAY_ORDER: {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4
  }
};

const findOverlappingSlots = (slots1, slots2) => {
  const overlappingSlots = [];
  let totalOverlapHours = 0;
  const overlappingDays = new Set();

  slots1.forEach(slot1 => {
    const parsed1 = slotUtils.parseSlot(slot1);
    if (!parsed1) return;

    slots2.forEach(slot2 => {
      const parsed2 = slotUtils.parseSlot(slot2);
      if (!parsed2 || parsed1.day !== parsed2.day) return;

      const overlapStart = Math.max(parsed1.start, parsed2.start);
      const overlapEnd = Math.min(parsed1.end, parsed2.end);
      const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

      if (overlapMinutes >= CONSTANTS.MIN_SLOT_DURATION) {
        overlappingDays.add(parsed1.day);
        overlappingSlots.push({
          day: parsed1.day,
          time: `${timeUtils.formatTime(overlapStart)}-${timeUtils.formatTime(overlapEnd)}`,
          overlap: overlapMinutes
        });
        totalOverlapHours += overlapMinutes / 60;
      }
    });
  });

  return {
    overlappingSlots,
    totalOverlapHours: Math.round(totalOverlapHours * 10) / 10,
    overlappingDays: overlappingDays.size
  };
};

const generateProposedMeetings = (overlappingSlots) => {
  if (overlappingSlots.length < 2) return [];

  const sortedSlots = [...overlappingSlots].sort((a, b) => 
    CONSTANTS.DAY_ORDER[a.day] - CONSTANTS.DAY_ORDER[b.day]
  );

  // Find slots at least one day apart
  let firstSlot = sortedSlots[0];
  let secondSlot = sortedSlots.find(slot => 
    Math.abs(CONSTANTS.DAY_ORDER[slot.day] - CONSTANTS.DAY_ORDER[firstSlot.day]) > 1
  ) || sortedSlots[1];

  if (!firstSlot || !secondSlot) return [];

  return [firstSlot, secondSlot].map(slot => ({
    day: slot.day,
    time: `${slot.time.split('-')[0]}-${timeUtils.addHours(slot.time.split('-')[0], 1)}`
  }));
};

export const calculateDetailedOverlap = (person1, person2) => {
  if (!person1 || !person2 || !person1.availability || !person2.availability) {
    return { overlappingSlots: [], totalOverlapHours: 0, overlappingDays: 0 };
  }

  // Availability is already filtered for tutors in firebase.js
  const availability1 = person1.availability;
  const availability2 = person2.availability;

  const overlap = findOverlappingSlots(availability1, availability2);
  const proposedMeetings = generateProposedMeetings(overlap.overlappingSlots);

  return { ...overlap, proposedMeetings };
};

const calculateScores = (person1, person2, overlappingDays, totalOverlapHours, weights) => {
  const { waitingTimeWeight, tQualityWeight } = weights;
  const remainingWeight = 1 - waitingTimeWeight - tQualityWeight;
  
  // Calculate overlap scores
  const daysScore = overlappingDays * (remainingWeight / 2);
  const hoursScore = (totalOverlapHours / 5) * (remainingWeight / 2);
  
  // Calculate waiting score
  const avgWaitingTime = ((person1.waitingDays || 0) + (person2.waitingDays || 0)) / 2;
  const normalizedWaitingScore = Math.min(avgWaitingTime / CONSTANTS.MAX_WAITING_DAYS, 1) * CONSTANTS.MAX_SCORE_POINTS;
  const waitingScore = normalizedWaitingScore * waitingTimeWeight;
  
  // Calculate quality score
  const tQuality = person2.TQuality || 0;
  const normalizedTQualityScore = (tQuality / 100) * CONSTANTS.MAX_SCORE_POINTS;
  const tQualityScore = normalizedTQualityScore * tQualityWeight;
  
  return {
    daysScore,
    hoursScore,
    waitingScore,
    tQualityScore,
    total: daysScore + hoursScore + waitingScore + tQualityScore
  };
};

export const calculateMatrixValue = (person1, person2, waitingTimeWeight, tQualityWeight = 0, minOverlapThreshold = 2) => {
  if (!person1 || !person2) return 0;

  const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(person1, person2);
  
  if (overlappingDays < minOverlapThreshold) return -1000;
  
  const scores = calculateScores(person1, person2, overlappingDays, totalOverlapHours, {
    waitingTimeWeight,
    tQualityWeight
  });

  return scores.total;
};
