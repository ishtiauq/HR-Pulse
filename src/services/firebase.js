import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocFromServer, serverTimestamp, initializeFirestore, persistentLocalCache, collection, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app, auth, db, storage;

try {
  // Only initialize if the API key is present
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    storage = getStorage(app);
    db = initializeFirestore(app, { 
      localCache: persistentLocalCache(),
      experimentalForceLongPolling: true
    });
  } else {
    console.warn('Firebase configuration missing. Please add VITE_FIREBASE_* environment variables to your .env file.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, db, storage, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, RecaptchaVerifier, signInWithPhoneNumber, doc, setDoc, getDoc, getDocFromServer, serverTimestamp, collection, getDocs, writeBatch, onSnapshot };
