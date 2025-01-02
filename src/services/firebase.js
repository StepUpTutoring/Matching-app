import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    limit
} from 'firebase/firestore';

import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, signInWithPopup, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'
import Airtable from 'airtable';

// Array normalization utility
const normalizeArray = (arr, validator = (item) => item && typeof item === 'string') => {
  if (!arr) return [];
  const array = Array.isArray(arr) ? arr : [arr];
  return array.filter(validator);
};

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
  }
};

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

const filterAvailableSlots = (availability, assignedMeetings) => {
  if (!assignedMeetings) return availability;

  const meetings = normalizeArray(assignedMeetings);
  const availableSlots = [];

  availability.forEach(slot => {
    const parsedSlot = slotUtils.parseSlot(slot);
    if (!parsedSlot) return;
    const { day, start: slotStart, end: slotEnd } = parsedSlot;

    // Get meetings for this day
    const dayMeetings = meetings
      .map(meeting => slotUtils.parseSlot(meeting))
      .filter(m => m && m.day === day)
      .sort((a, b) => a.start - b.start);

    if (dayMeetings.length === 0) {
      availableSlots.push(slot);
      return;
    }

    // Check time before first meeting
    if (slotStart < dayMeetings[0].start && 
        slotUtils.hasMinimumDuration(slotStart, dayMeetings[0].start)) {
      availableSlots.push(slotUtils.formatSlot(day, slotStart, dayMeetings[0].start));
    }

    // Check gaps between meetings
    for (let i = 0; i < dayMeetings.length - 1; i++) {
      const gapStart = dayMeetings[i].end;
      const gapEnd = dayMeetings[i + 1].start;
      if (slotUtils.hasMinimumDuration(gapStart, gapEnd)) {
        availableSlots.push(slotUtils.formatSlot(day, gapStart, gapEnd));
      }
    }

    // Check time after last meeting
    const lastMeeting = dayMeetings[dayMeetings.length - 1];
    if (lastMeeting.end < slotEnd && 
        slotUtils.hasMinimumDuration(lastMeeting.end, slotEnd)) {
      availableSlots.push(slotUtils.formatSlot(day, lastMeeting.end, slotEnd));
    }
  });

  return availableSlots;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence)
const db = getFirestore(app)
const functions = getFunctions(app)

const processPersonData = (data) => {
    // Only include essential fields and fields with values
    const processedData = {
      id: data.id,
      name: `${data['First Name']} ${data['Last Name']}`,
      Status: data.Status,
      availability: data.Availability ? data.Availability.split(', ') : [],
      language: data['Student Language'] || (data['Does tutor speak Spanish?'] && data['Does tutor speak Spanish?'].toLowerCase().includes('spanish') && !data['Does tutor speak Spanish?'].includes("Yes, but I am not fluent in Spanish") ? "Spanish" : "English"),
      liveScan: data['Background Check'] === "Live Scan",
      waitingDays: calculateWaitingDays(data['Last Status Change']),
      gender: data['Gender'] || '',
      programType: data['type of tutor'] ||  data['Program Type'] || '',
      type: data['Tutor ID'] ? 'tutor' : 'student'
    };

  if (data['Student ID']) {
    const studentFields = {
      tutorPreferences: data['Do you have any preferences for the tutor your student will be matched with?'],
      subjects: data['Subjects'] || data['Subject'] || data['Subject(s)'],
        grade: data['Grade'],
        appliedDate: data['Applied Date'],
        gender: data['Gender'],
      studentId: data['Student ID'],
      firstName: data['First Name'],
      lastName: data['Last Name'],
      guardianName: data['Guardian First Name'] && data['Guardian Last Name'] ? 
        `${data['Guardian First Name']} ${data['Guardian Last Name']}` : null,
      guardianPhone: data["Guardian's Phone"],
      schoolText: data['School text'],
      // Additional fields
      backgroundCheck: data['Background Check'],
      districtText: data['District Text'],
      firstMatchedDate: data['First Matched Date'],
      guardianEmail: data["Guardian's Email"],
      lastStatusChange: data['Last Status Change'],
      guardianLanguage: data['Language'],
      recordID: data['Raw Record ID']
    };

    // Only add fields that have values
    Object.entries(studentFields).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        processedData[key] = value;
      }
    });
  }

  // Add specific fields for tutors if they have values
  if (data['Tutor ID']) {
    const rawAvailability = data.Availability ? data.Availability.split(', ') : [];
    const assignedMeetings = data['Assigned Meeting Slots'] ? data['Assigned Meeting Slots'].split(', ') : [];
    const normalizedAvailability = normalizeArray(rawAvailability);
    const filteredAvailability = filterAvailableSlots(normalizedAvailability, assignedMeetings);
    
    const tutorFields = {
      rawAvailability,
      availability: filteredAvailability,
      assignedMeetings,
      numberOfStudents: parseInt(Array.isArray(data['Students synced']) ? data['Students synced'].length : 
                       (data['Students synced']?.split(',')?.length || 0), 10),
      totalDesiredStudents: data['Total Desired Students'],
      collegeInfo: data['College University and Graduation Year'],
      gender: data['Gender'],
      daysWaitingForMatch: data['Days waiting for a match'],
      linkedInResume: data['LinkedIn Resume Short Bio'],
      speaksSpanish: data['Does tutor speak Spanish?'],
      TQuality: data['Tutor Quality'],
      email: data['Email'],
      tutorId: data['Tutor ID'],
      firstName: data['First Name'],
      lastName: data['Last Name'],
      lastMatch: data['Last match'],
      numStudentsToMatch: data['Number of students to match'],
      phone: data['Phone'],
      primaryGuardian: data['Primary Guardian'],
      backgroundCheck: data['Background Check'],
      status: data['Status'],
      lastStatusChange: data['Last Status Change'],
      matchedStudents: data['Students synced'],
      recordID: data['Raw Record ID']
    };

    // Only add fields that have values
    Object.entries(tutorFields).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        processedData[key] = value;
      }
    });
  }

  return processedData;
};

const calculateWaitingDays = (appliedDate) => {
  if (!appliedDate) return '';
  const applied = new Date(appliedDate);
  const today = new Date();
  const diffTime = Math.abs(today - applied);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays.toString();
};
export const fetchTutors = async () => {
    try {
        const tutorsQuery = query(
            collection(db, 'tutors'),
            where('Status', 'in', ['Ready to Tutor', 'Needs Rematch', 'Matched']),
        );
        const querySnapshot = await getDocs(tutorsQuery);
        const tutors = querySnapshot.docs.map(doc => processPersonData({ id: doc.id, ...doc.data() }));
        return tutors;
    } catch (error) {
        console.error("Error fetching tutors:", error);
        throw error;
    }
};

export const fetchStudents = async () => {
    try {
        const studentsQuery = query(
            collection(db, 'students'),
            where('Status', 'in', ['Needs a Match', 'Needs Rematch']),
            limit(100)  // Add limit to match the subscription query
        );
        const querySnapshot = await getDocs(studentsQuery);
        const students = querySnapshot.docs.map(doc => processPersonData({ id: doc.id, ...doc.data() }));
        console.log('Processed students:', students);
        return students;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

export const subscribeTutors = (callback) => {
    const tutorsQuery = query(
        collection(db, 'tutors'),
        where('Status', 'in', ['Ready to Tutor', 'Needs Rematch', 'Matched']),
    );
    return onSnapshot(tutorsQuery, (querySnapshot) => {
        const tutors = querySnapshot.docs.map(doc => processPersonData({ id: doc.id, ...doc.data() }));
        callback(tutors);
    });
};

export const subscribeStudents = (callback) => {
    const studentsQuery = query(
      collection(db, 'students'),
      limit(100),
      where('Status', 'in', ['Needs a Match', 'Needs Rematch'])
    );
    return onSnapshot(studentsQuery, (querySnapshot) => {
      const students = querySnapshot.docs.map((doc) =>
        processPersonData({ id: doc.id, ...doc.data() })
      );
      callback(students);
    });
  };
  
  const base = new Airtable({apiKey: import.meta.env.VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN}).base(import.meta.env.VITE_AIRTABLE_BASE_ID);
  
export const createMatch = async (matchData) => {
    try {
        const { studentId, tutorId } = matchData;
        console.log("Match Data:", JSON.stringify(matchData, null, 2));
        console.log("Student Record ID:", studentId);
        console.log("Tutor Record ID:", tutorId);
        
        if (!studentId) {
            throw new Error("Student Record ID is required");
        }
        
        const updateFields = {
            "Tutors": tutorId ? [tutorId] : [],
            "Status": "Matched",
            "Assigned Meeting Slots": matchData.proposedTime || '',
        };
                
        // Update the student record directly using the Raw Record ID
        const updateData = [{
            "id": studentId,
            "fields": updateFields
        }];

        // Update both Airtable and Firebase
        const [updatedStudentRecord] = await Promise.all([
            base('tblDl10LdUIb0kiWr').update(updateData),
            // Update Firebase student record
            getDocs(query(collection(db, 'students'), where('Raw Record ID', '==', studentId)))
                .then(querySnapshot => {
                    if (!querySnapshot.empty) {
                        const studentDoc = querySnapshot.docs[0];
                        return updateDoc(doc(db, 'students', studentDoc.id), {
                            Status: 'Matched',
                            'Last Status Change': new Date().toISOString(),
                            'Assigned Meeting Slots': matchData.proposedTime || ''
                        });
                    }
                }),
            // Update Firebase tutor record
            getDocs(query(collection(db, 'tutors'), where('Raw Record ID', '==', tutorId)))
                .then(async querySnapshot => {
                    if (!querySnapshot.empty) {
                        const tutorDoc = querySnapshot.docs[0];
                        const tutorData = tutorDoc.data();
                        
                        // Handle Assigned Meeting Slots
                        let existingSlots = tutorData['Assigned Meeting Slots'] || '';
                        // Convert to array if it's a string
                        if (typeof existingSlots === 'string') {
                            existingSlots = existingSlots.split(', ').map(slot => slot.trim()).filter(Boolean);
                        }
                        const newSlot = matchData.proposedTime;
                        if (newSlot) {
                            existingSlots.push(newSlot);
                        }
                        // Join with proper formatting
                        const formattedSlots = existingSlots.join(', ');

                        // Handle Students synced
                        let existingStudents = tutorData['Students synced'] || [];
                        // Convert to array if it's a string
                        if (typeof existingStudents === 'string') {
                            existingStudents = existingStudents.split(',').map(id => id.trim()).filter(Boolean);
                        }
                        const studentDocId = (await getDocs(query(collection(db, 'students'), where('Raw Record ID', '==', studentId)))).docs[0].id;
                        if (!existingStudents.includes(studentDocId)) {
                            existingStudents.push(studentDocId);
                        }

                        return updateDoc(doc(db, 'tutors', tutorDoc.id), {
                            'Assigned Meeting Slots': formattedSlots,
                            'Students synced': existingStudents,
                            'Last Status Change': new Date().toISOString()
                        });
                    }
                })
        ]);

        return updatedStudentRecord[0].id;
    } catch (error) {
        console.error("Error creating match:", error);
        throw error;
    }
};

export async function loginWithPassword(email, password) {
    try {
        // Only allow specific credentials
        if (email === 'tutorsupport@stepuptutoring.org' && password === 'stepup123!') {
            const { user } = await signInWithEmailAndPassword(auth, email, password);
            return { uid: user.uid, displayName: user.email }; // Match Google login return structure
        }
        return null;
    } catch (error) {
        console.error("Login error:", error);
        if (error.code === 'auth/invalid-persistence-type' ||
            error.code === 'auth/persistence-error') {
            console.error('Persistence error:', error);
        }
        throw error;
    }
}

export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider()
        const { user } = await signInWithPopup(auth, provider)
        return { uid: user.uid, displayName: user.displayName }
    } catch (error) {
        // Silently handle expected popup closures
        if (error.code === 'auth/popup-closed-by-user' || 
            error.code === 'auth/cancelled-popup-request') {
            return null
        }
        // Handle persistence errors
        if (error.code === 'auth/invalid-persistence-type' ||
            error.code === 'auth/persistence-error') {
            console.error('Persistence error:', error);
        }
        // Log unexpected errors
        console.error('Unexpected auth error:', error)
        return null
    }
}

export async function logout() {
    await auth.signOut()
}
