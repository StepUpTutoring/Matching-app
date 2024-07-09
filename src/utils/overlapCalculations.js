export const calculateDetailedOverlap = (person1, person2) => {
  const overlappingSlots = [];
  let totalOverlapHours = 0;
  const overlappingDays = new Set();

  const parseTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  person1.availability.forEach(slot1 => {
    const [day1, timeRange1] = slot1.split(' ');
    const [start1, end1] = timeRange1.split('-').map(parseTime);

    person2.availability.forEach(slot2 => {
      const [day2, timeRange2] = slot2.split(' ');
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
  const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(person1, person2);
  const remainingWeight = 1 - waitingTimeWeight;
  const daysScore = overlappingDays * (remainingWeight / 2);
  const hoursScore = (totalOverlapHours / 5) * (remainingWeight / 2);
  
  const maxWaitingDays = 30; // Assume 30 days is the maximum waiting time
  const waitingScore = ((person1.waitingDays + person2.waitingDays) / (2 * maxWaitingDays)) * waitingTimeWeight;
  
  return daysScore + hoursScore + waitingScore;
};