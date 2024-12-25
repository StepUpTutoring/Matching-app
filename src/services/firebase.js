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
    // Only include essential fields and fields with values
    const processedData = {
      id: data.id,
      name: `${data['First Name']} ${data['Last Name']}`,
      Status: data.Status,
      availability: data.Availability ? data.Availability.split(', ') : [],
      language: data.Language || (data['Does tutor speak Spanish?'] === "I don't speak any other languages" ? "English" : "Spanish"),
      liveScan: data['Background Check'] === "Live Scan" ? "Yes" : "No",
      waitingDays: data['Days waiting for a match'] || calculateWaitingDays(data['Applied Date'])
    };

  // Add specific fields for students if they have values
  if (data['Student ID']) {
    const studentFields = {
      studentId: data['Student ID'],
      firstName: data['First Name'],
      lastName: data['Last Name'],
      grade: data['Grade'],
      subjects: data['Subjects'] && data['Subject'],
      guardianName: data['Guardian First Name'] && data['Guardian Last Name'] ? 
        `${data['Guardian First Name']} ${data['Guardian Last Name']}` : null,
      guardianPhone: data["Guardian's Phone"],
      schoolText: data['School text'],
      programType: data['Program Type'],
      // Additional fields
      appliedDate: data['Applied Date'],
      backgroundCheck: data['Background Check'],
      districtText: data['District Text'],
      tutorPreferences: data['Do you have any preferences for the tutor your student will be matched with?'],
      firstMatchedDate: data['First Matched Date'],
      gender: data['Gender'],
      guardianEmail: data["Guardian's Email"],
      language: data['Language'],
      lastStatusChange: data['Last Status Change'],
      studentLanguage: data['Student Language']
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
    const tutorFields = {
      tutorId: data['Tutor ID'],
      backgroundCheck: data['Background Check'],
      collegeInfo: data['College University and Graduation Year'],
      gender: data['Gender'],
      daysWaitingForMatch: data['Days waiting for a match'],
      speaksSpanish: data['Does tutor speak Spanish?'],
      email: data['Email'],
      firstName: data['First Name'],
      lastName: data['Last Name'],
      lastMatch: data['Last match'],
      linkedInResume: data['LinkedIn Resume Short Bio'],
      numStudentsToMatch: data['Number of students to match'],
      phone: data['Phone'],
      primaryGuardian: data['Primary Guardian'],
      availabilityUrl: data['Regenerate short url for Availability'],
      status: data['Status'],
      totalDesiredStudents: data['Total Desired Students'],
      typeOfTutor: data['Type of tutor']
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
            limit(200)  // Match subscription limit
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
        limit(200)
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
          console.log("Student ID to search for:", studentId);
          console.log("Student ID type:", typeof studentId);
          console.log("Tutor ID:", tutorId);

          // Find the student record
          // Try different variations of the student ID format
          const formattedId = studentId.replace('-', ''); // Try without hyphen
          console.log("Trying variations of student ID:", {
              original: studentId,
              withoutHyphen: formattedId
          });

          // Try multiple formulas to find the student
          const formulas = [
              `{Student ID} = '${studentId}'`,
              `{Student ID} = '${formattedId}'`,
              `LOWER({Student ID}) = LOWER('${studentId}')`,
              `LOWER({Student ID}) = LOWER('${formattedId}')`,
              `OR(SEARCH('${studentId}', {Student ID}), SEARCH('${formattedId}', {Student ID}))`
          ];

          let studentRecords = [];
          for (const formula of formulas) {
              console.log("Trying formula:", formula);
              studentRecords = await base('tblDl10LdUIb0kiWr').select({
                  filterByFormula: formula
              }).firstPage();
              
              if (studentRecords.length > 0) {
                  console.log("Found student with formula:", formula);
                  break;
              }
          }

          console.log("Full Airtable response:", JSON.stringify({
              recordsFound: studentRecords.length,
              records: studentRecords.map(record => ({
                  id: record.id,
                  fields: record.fields
              }))
          }, null, 2));

          console.log("Airtable response:", {
              recordsFound: studentRecords.length,
              firstRecord: studentRecords[0] ? {
                  id: studentRecords[0].id,
                  fields: studentRecords[0].fields
              } : null
          });
  
          if (studentRecords.length === 0) {
              throw new Error(`Student with ID ${studentId} not found`);
          }
  
          const studentRecord = studentRecords[0];
  
          // Update the student record
          const updatedStudentRecord = await base('tblDl10LdUIb0kiWr').update([
              {
                  id: studentRecord.id,
                  fields: {
                      'Tutors': [...(studentRecord.fields['Tutors'] || []), tutorId],
                      'Status': 'Matched',
                      'Assigned Meeting Slots': matchData.proposedTime || ''
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
