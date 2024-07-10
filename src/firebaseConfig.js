import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth'
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  getCountFromServer,
  limit,
} from 'firebase/firestore'
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