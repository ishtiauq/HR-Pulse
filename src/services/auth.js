import { auth, db, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, doc, setDoc, getDoc, getDocFromServer, serverTimestamp, RecaptchaVerifier, signInWithPhoneNumber } from './firebase.js';

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

// Tries popup sign-in first (works on all browsers). Falls back to
// redirect-based sign-in only when the popup is blocked (e.g. strict popup
// blockers). Redirect is deprecated on Chrome, so it's only a last resort.
export const loginWithGoogle = async () => {
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, mode: 'popup' };
  } catch (err) {
    if (err.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      return { user: null, mode: 'redirect' };
    }
    throw err;
  }
};

export const getGoogleRedirectResult = async () => {
  if (!auth) return null;
  const result = await getRedirectResult(auth);
  return result?.user || null;
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
