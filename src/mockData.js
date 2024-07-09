// src/mockData.js

const generateAvailability = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [];
  for (let i = 0; i < 3; i++) {
    const day = days[Math.floor(Math.random() * days.length)];
    const startHour = Math.floor(Math.random() * 8) + 9; // 9 AM to 4 PM
    const endHour = startHour + Math.floor(Math.random() * 3) + 1; // 1 to 3 hours long
    slots.push(`${day} ${startHour}:00-${endHour}:00`);
  }
  return slots;
};

export const mockStudents = [
  { id: '1', name: 'Alice Johnson', availability: generateAvailability(), language: 'English', liveScan: true, waitingDays: 5 },
  { id: '2', name: 'Bob Smith', availability: generateAvailability(), language: 'Spanish', liveScan: false, waitingDays: 10 },
  { id: '3', name: 'Charlie Brown', availability: generateAvailability(), language: 'English', liveScan: true, waitingDays: 3 },
  { id: '4', name: 'Diana Prince', availability: generateAvailability(), language: 'French', liveScan: true, waitingDays: 7 },
  { id: '5', name: 'Ethan Hunt', availability: generateAvailability(), language: 'English', liveScan: false, waitingDays: 15 },
];

export const mockTutors = [
  { id: '1', name: 'Frank Castle', availability: generateAvailability(), language: 'English', liveScan: true, waitingDays: 2 },
  { id: '2', name: 'Gina Davis', availability: generateAvailability(), language: 'Spanish', liveScan: true, waitingDays: 8 },
  { id: '3', name: 'Harry Potter', availability: generateAvailability(), language: 'English', liveScan: false, waitingDays: 12 },
  { id: '4', name: 'Irene Adler', availability: generateAvailability(), language: 'French', liveScan: true, waitingDays: 6 },
  { id: '5', name: 'Jack Sparrow', availability: generateAvailability(), language: 'English', liveScan: true, waitingDays: 4 },
];