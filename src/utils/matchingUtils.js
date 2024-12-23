export const calculateDetailedOverlap = (person1, person2) => {
  if (!person1 || !person2 || !person1.availability || !person2.availability) {
    return { overlappingSlots: [], totalOverlapHours: 0, overlappingDays: 0 };
  }

  const overlappingSlots = [];
  let totalOverlapHours = 0;
  const overlappingDays = new Set();

  const parseTime = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Ensure availability is always an array and filter out null/undefined values
  const normalizeAvailability = (availability) => {
    if (!availability) return [];
    const availArray = Array.isArray(availability) ? availability : [availability];
    return availArray.filter(slot => slot && typeof slot === 'string');
  };

  const availability1 = normalizeAvailability(person1.availability);
  const availability2 = normalizeAvailability(person2.availability);

  availability1.forEach(slot1 => {
    if (!slot1) return;
    const [day1, timeRange1] = slot1.split(' ');
    if (!timeRange1) return;
    const [start1, end1] = timeRange1.split('-').map(parseTime);

    availability2.forEach(slot2 => {
      if (!slot2) return;
      const [day2, timeRange2] = slot2.split(' ');
      if (!timeRange2) return;
      const [start2, end2] = timeRange2.split('-').map(parseTime);

      if (day1 === day2) {
        const overlapStart = Math.max(start1, start2);
        const overlapEnd = Math.min(end1, end2);
        const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

        if (overlapMinutes >= 60) {
          overlappingDays.add(day1);
          const overlapTimeRange = `${formatTime(overlapStart)}-${formatTime(overlapEnd)}`;
          overlappingSlots.push({ 
            day: day1, 
            time: overlapTimeRange, 
            overlap: overlapMinutes 
          });
          totalOverlapHours += overlapMinutes / 60;
        }
      }
    });
  });

  // Generate proposed meeting times
  const proposedMeetings = generateProposedMeetings(overlappingSlots);

  return { 
    overlappingSlots, 
    totalOverlapHours: Math.round(totalOverlapHours * 10) / 10,
    overlappingDays: overlappingDays.size,
    proposedMeetings
  };
};

const generateProposedMeetings = (overlappingSlots) => {
  if (overlappingSlots.length < 2) {
    return [];
  }

  // Sort slots by day of week to ensure proper spacing
  const dayOrder = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4
  };

  const sortedSlots = [...overlappingSlots].sort((a, b) => 
    dayOrder[a.day] - dayOrder[b.day]
  );

  // Try to find slots at least one day apart
  let firstSlot = null;
  let secondSlot = null;

  for (let i = 0; i < sortedSlots.length; i++) {
    if (!firstSlot) {
      firstSlot = sortedSlots[i];
      continue;
    }

    // Check if this slot is at least one day apart from the first slot
    if (Math.abs(dayOrder[sortedSlots[i].day] - dayOrder[firstSlot.day]) > 1) {
      secondSlot = sortedSlots[i];
      break;
    }
  }

  // If we couldn't find slots more than one day apart, take the first two available slots
  if (!secondSlot && sortedSlots.length >= 2) {
    firstSlot = sortedSlots[0];
    secondSlot = sortedSlots[1];
  }

  if (!firstSlot || !secondSlot) {
    return [];
  }

  // For each slot, propose a meeting time at the start of the overlap period
  const proposedMeetings = [
    {
      day: firstSlot.day,
      time: firstSlot.time.split('-')[0]  // Take the start time of the overlap
    },
    {
      day: secondSlot.day,
      time: secondSlot.time.split('-')[0]  // Take the start time of the overlap
    }
  ];

  return proposedMeetings;
};

export const calculateMatrixValue = (person1, person2, waitingTimeWeight, tQualityWeight = 0.2) => {
  if (!person1 || !person2) return 0;

  const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(person1, person2);
  
  // Calculate remaining weight after accounting for both waiting time and t-quality
  const remainingWeight = 1 - waitingTimeWeight - tQualityWeight;
  
  // Split remaining weight between days and hours scores
  const daysScore = overlappingDays * (remainingWeight / 2);
  const hoursScore = (totalOverlapHours / 5) * (remainingWeight / 2);
  
  // Calculate waiting time score
  const maxWaitingDays = 30; // Assume 30 days is the maximum waiting time
  const waitingScore = ((person1.waitingDays || 0) + (person2.waitingDays || 0)) / (2 * maxWaitingDays) * waitingTimeWeight;
  
  // Calculate T-quality score (assuming T-quality is a value between 0-100)
  const tQualityScore = (person2['T-quality'] || 0) / 100 * tQualityWeight;
  
  return daysScore + hoursScore + waitingScore + tQualityScore;
};
