import { auth, db, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, doc, setDoc, getDoc, getDocFromServer, serverTimestamp, RecaptchaVerifier, signInWithPhoneNumber } from './firebase.js';

/**
 * Ensures a user document exists in Firestore. 
 * If it's a new user, creates the document.
 */
export const checkAndCreateUserDoc = async (user) => {
  if (!db) return { isNewUser: true }; // Fallback if Firebase not configured
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDocFromServer(userRef);
  
  if (!userSnap.exists()) {
    // New user, create initial document
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      fullName: user.displayName || '',
      companyName: '', // To be filled in profile setup
      driveConnected: false,
      createdAt: serverTimestamp(),
    });
    return { isNewUser: true, data: null };
  }
  
  return { isNewUser: false, data: userSnap.data() };
};

export const updateProfileData = async (uid, fullName, companyName) => {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { fullName, companyName }, { merge: true });
};

export const updateDriveConnectionStatus = async (uid, status = true) => {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { driveConnected: status }, { merge: true });
};

export const loginWithGoogle = async () => {
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const loginWithEmail = async (email, password) => {
  if (!auth) throw new Error('Firebase not configured');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const registerWithEmail = async (email, password) => {
  if (!auth) throw new Error('Firebase not configured');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const logoutUser = async () => {
  if (auth) {
    await signOut(auth);
  }
};

// --- Phone Authentication ---

export const setupRecaptcha = (containerId) => {
  if (!auth) throw new Error('Firebase not configured');
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: (response) => {
      // reCAPTCHA solved
    }
  });
};

export const requestPhoneOtp = async (phoneNumber, appVerifier) => {
  if (!auth) throw new Error('Firebase not configured');
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  return confirmationResult;
};

export const verifyPhoneOtp = async (confirmationResult, otpCode) => {
  if (!confirmationResult) throw new Error('No OTP request found');
  const result = await confirmationResult.confirm(otpCode);
  return result.user;
};
