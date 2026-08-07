import { auth, db, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateEmail, updatePassword, deleteUser, signOut, doc, setDoc, getDocFromServer, serverTimestamp, RecaptchaVerifier, signInWithPhoneNumber } from './firebase.js';

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
      createdAt: serverTimestamp(),
    });
    return { isNewUser: true, data: null };
  }
  
  return { isNewUser: false, data: userSnap.data() };
};

/**
 * Returns the company + employee linkage for an authenticated user.
 * Reads users/{uid}; workspace owners have companyUid === uid, teammates
 * have it set at provisioning time.
 */
export const getCompanyForUser = async (uid) => {
  if (!db || !uid) return null;
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDocFromServer(userRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      companyUid: data.companyUid || null,
      employeeId: data.employeeId || null,
      role: data.role || null,
      fullName: data.fullName || data.name || null,
      department: data.department || null,
      avatar: data.avatar || null,
    };
  } catch (error) {
    console.error('Failed to read user doc:', error);
    return null;
  }
};

/**
 * Creates a real Firebase Auth account for a teammate and links it to the
 * admin's company. Teammates sign in with email + password (no company ID).
 */
export const provisionEmployeeAccount = async ({ email, password, name, role, companyUid, employeeId, department, avatar }) => {
  if (!auth) throw new Error('Firebase not configured');
  if (!email || !password) throw new Error('Email and password are required to create a teammate account.');
  if (!companyUid) throw new Error('Missing company ID — cannot provision teammate account.');

  const result = await createUserWithEmailAndPassword(auth, email, password);
  const uid = result.user.uid;

  if (db) {
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      fullName: name || '',
      companyUid,
      employeeId,
      role: role || 'Teammate',
      department: department || '',
      avatar: avatar || '',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'companies', companyUid, 'members', uid), {
      employeeId: employeeId || '',
      email,
      name: name || '',
      role: role || 'Teammate',
      registeredAt: serverTimestamp(),
    }, { merge: true });
  }
  return { uid };
};

/**
 * Updates a teammate's Firebase Auth email/password.
 * Firestore linkage is updated by the caller (employee record).
 */
export const updateEmployeeAuthAccount = async (uid, { email, password }) => {
  if (!auth) throw new Error('Firebase not configured');
  const account = auth.currentUser?.uid === uid ? auth.currentUser : null;
  if (!account) throw new Error('Cannot update this account from the current session.');
  if (email && email !== account.email) await updateEmail(account, email);
  if (password) await updatePassword(account, password);
};

/**
 * Attempts to delete a teammate's Firebase Auth account. Client SDK can only
 * delete the currently signed-in user; deleting arbitrary users requires a
 * Cloud Function. Returns true if deleted, false if it must be deferred.
 */
export const deleteEmployeeAccount = async (uid) => {
  if (!auth) return false;
  if (auth.currentUser?.uid !== uid) return false;
  try {
    await deleteUser(auth.currentUser);
    return true;
  } catch {
    return false;
  }
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
