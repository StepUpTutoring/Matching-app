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

  const availability1 = Array.isArray(person1.availability) ? person1.availability : [person1.availability];
  const availability2 = Array.isArray(person2.availability) ? person2.availability : [person2.availability];

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

  return { 
    overlappingSlots, 
    totalOverlapHours: Math.round(totalOverlapHours * 10) / 10,
    overlappingDays: overlappingDays.size
  };
};

export const calculateMatrixValue = (person1, person2, waitingTimeWeight) => {
  if (!person1 || !person2) return 0;

  const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(person1, person2);
  const remainingWeight = 1 - waitingTimeWeight;
  const daysScore = overlappingDays * (remainingWeight / 2);
  const hoursScore = (totalOverlapHours / 5) * (remainingWeight / 2);
  
  const maxWaitingDays = 30; // Assume 30 days is the maximum waiting time
  const waitingScore = ((person1.waitingDays || 0) + (person2.waitingDays || 0)) / (2 * maxWaitingDays) * waitingTimeWeight;
  
  return daysScore + hoursScore + waitingScore;
};

export const generateMockData = (AVAILABILITY_SLOTS) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const languages = ['English', 'Spanish'];
  
  const generateTimeRange = () => {
    const startHour = Math.floor(Math.random() * 12) + 8; // 8 AM to 7 PM
    const duration = Math.floor(Math.random() * 3) + 2; // 2 to 4 hours
    const endHour = Math.min(startHour + duration, 20); // Cap at 8 PM
    const minutes = Math.random() > 0.5 ? '30' : '00';
    return `${startHour}:${minutes}-${endHour}:${minutes}`;
  };

  const generateAvailability = () => {
    const availability = new Set();
    while (availability.size < AVAILABILITY_SLOTS) {
      const day = days[Math.floor(Math.random() * days.length)];
      const timeRange = generateTimeRange();
      availability.add(`${day} ${timeRange}`);
    }
    return Array.from(availability);
  };

  const generatePerson = (name) => ({
    id: `${name.toLowerCase().replace(' ', '_')}`,
    name: name,
    availability: generateAvailability(),
    language: languages[Math.floor(Math.random() * languages.length)],
    liveScan: Math.random() < 0.9,
    waitingDays: Math.floor(Math.random() * 30) // Random number of waiting days (0-29)
  });
  
  const studentNames = ["Daniel", "Alex", "Emma", "Olivia", "Ethan", "Sophia", "Liam", "Ava", "Joe", "Justin"];
  const tutorNames = ["Jack", "Sarah", "Michael", "Emily", "David", "Jessica", "Justice", "George", "Jane", "Haripriya"];

  return {
    students: studentNames.map(name => generatePerson(name)),
    tutors: tutorNames.map(name => generatePerson(name)),
  };
};