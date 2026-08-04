import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { getAnalytics } from "firebase/analytics";

// Firebase Console থেকে পাওয়া আপনার সংগৃহীত ডাটা
const firebaseConfig = {
  apiKey: "AIzaSyBv2826_CAwRn35IvdGuqN3DirrcYWgtQc",
  authDomain: "kormiis-90df0.firebaseapp.com",
  projectId: "kormiis-90df0",
  storageBucket: "kormiis-90df0.firebasestorage.app",
  messagingSenderId: "222964022668",
  appId: "1:222964022668:web:ae35326ec4ea48ea846aa9",
  measurementId: "G-DYX3H81N8Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth & Firestore Exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
