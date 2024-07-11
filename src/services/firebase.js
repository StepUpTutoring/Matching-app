// src/services/firebase.js
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
import { getFunctions, httpsCallable } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // eslint-disable-next-line no-restricted-globals -- CI env var is set by GitHub Actions workflow suggested by firebase team https://github.com/firebase/firebase-js-sdk/issues/7824#issuecomment-1882011196
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

// Function to fetch all tutors
export const fetchTutors = async () => {
    try {
        const tutorsQuery = query(collection(db, 'people'), where('role', '==', 'tutor'));
        const querySnapshot = await getDocs(tutorsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching tutors:", error);
        throw error;
    }
};

// Function to fetch all students
export const fetchStudents = async () => {
    try {
        const studentsQuery = query(collection(db, 'people'), where('role', '==', 'student'));
        const querySnapshot = await getDocs(studentsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

// Function to listen for real-time updates to tutors
export const subscribeTutors = (callback) => {
    const tutorsQuery = query(collection(db, 'people'), where('role', '==', 'tutor'));
    return onSnapshot(tutorsQuery, (querySnapshot) => {
        const tutors = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(tutors);
    });
};

// Function to listen for real-time updates to students
export const subscribeStudents = (callback) => {
    const studentsQuery = query(collection(db, 'people'), where('role', '==', 'student'));
    return onSnapshot(studentsQuery, (querySnapshot) => {
        const students = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(students);
    });
};

// Function to create a new match
export const createMatch = async (matchData) => {
    try {
        const docRef = await addDoc(collection(db, 'matches'), matchData);
        console.log("Match created with ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error creating match:", error);
        throw error;
    }
};