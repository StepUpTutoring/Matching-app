import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    addDoc,
    limit
} from 'firebase/firestore';

import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'
import Airtable from 'airtable';

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
const db = getFirestore(app)
const functions = getFunctions(app)

const processPersonData = (data) => {
    const processedData = {
      id: data.id,
      name: `${data['First Name']} ${data['Last Name']}`,
      availability: data.Availability ? data.Availability.split(', ') : [],
      language: data.Language || (data['Does tutor speak Spanish?'] === "I don't speak any other languages" ? "English" : "Spanish"),
      liveScan: data['Background Check'] === "Live Scan" ? "Yes" : "No",
      waitingDays: data['Days waiting for a match'] || calculateWaitingDays(data['Applied Date']),
      // Include all other fields
      ...Object.keys(data).reduce((acc, key) => {
        if (!['id', 'First Name', 'Last Name', 'Availability', 'Language', 'Background Check', 'Days waiting for a match'].includes(key)) {
          acc[key] = data[key];
        }
        return acc;
      }, {})
    };

  // Add specific fields for students
  if (data['Student ID']) {
    processedData.studentId = data['Student ID'];
    processedData.guardianName = `${data['Guardian First Name']} ${data['Guardian Last Name']}`;
    processedData.guardianPhone = data["Guardian's Phone"];
    processedData.schoolText = data['School text'];
    processedData.districtText = data['District Text'];
    processedData.programType = data['Program Type'];
  }

  // Add specific fields for tutors
  if (data['Tutor ID']) {
    processedData.tutorId = data['Tutor ID'];
    processedData.linkedinBio = data['Linkedin Resume Short Bio'];
    processedData.numStudentsToMatch = data['Number of students to match'];
    processedData.totalDesiredStudents = data['Total Desired Students'];
    processedData.typeOfTutor = data['type of tutor'];
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
            where('Status', 'in', ['Ready to Tutor', 'Needs Rematch', 'Matched'])
        );
        const querySnapshot = await getDocs(tutorsQuery);
        const tutors = querySnapshot.docs.map(doc => processPersonData({ id: doc.id, ...doc.data() }));
        console.log('Processed tutors:', tutors);
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
            where('Status', 'in', ['Needs a Match', 'Needs Rematch'])
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
        where('Status', 'in', ['Ready to Tutor', 'Needs Rematch', 'Matched'])
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
  
          // Find the student record
          const studentRecords = await base('Students').select({
              filterByFormula: `{ID} = '${studentId}'`
          }).firstPage();
  
          if (studentRecords.length === 0) {
              throw new Error(`Student with ID ${studentId} not found`);
          }
  
          const studentRecord = studentRecords[0];
  
          // Update the student record
          const updatedStudentRecord = await base('Students').update([
              {
                  id: studentRecord.id,
                  fields: {
                      'Tutors': [...(studentRecord.fields['Tutors'] || []), tutorId],
                      'Status': 'Matched'
                  }
              }
          ]);
  
          console.log("Match created for student:", updatedStudentRecord[0].id);
          return updatedStudentRecord[0].id;
      } catch (error) {
          console.error("Error creating match:", error);
          throw error;
      }
  };

export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider()
        const { user } = await signInWithPopup(auth, provider)
        return { uid: user.uid, displayName: user.displayName }
    } catch (error) {
        if (error.code !== 'auth/cancelled-popup-request') {
            console.error(error)
        }
        return null
    }
}

export async function logout() {
    await auth.signOut()
}
