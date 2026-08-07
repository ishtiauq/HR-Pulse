import { db, storage, doc, setDoc, getDoc, collection, getDocs, writeBatch, onSnapshot, serverTimestamp } from './firebase.js';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, getBytes } from 'firebase/storage';

/**
 * Subscribes to a specific table's snapshot in Firebase.
 * Returns an unsubscribe function.
 */
export const subscribeToTable = (adminUid, tableName, onDataCallback) => {
  if (!db || !adminUid) return () => {};
  const tableRef = doc(db, 'companies', adminUid, 'snapshots', tableName);
  
  return onSnapshot(tableRef, (snapshot) => {
    if (snapshot.exists() && snapshot.data().data) {
      onDataCallback(snapshot.data().data, snapshot.data().lastUpdated || null);
    } else {
      onDataCallback(null, null);
    }
  }, (error) => {
    console.error(`Error subscribing to ${tableName}:`, error);
  });
};

/**
 * Writes an entire table's snapshot to Firebase.
 */
export const writeToTable = async (adminUid, tableName, data) => {
  if (!db || !adminUid) throw new Error('Firebase not connected or missing Admin ID.');
  const tableRef = doc(db, 'companies', adminUid, 'snapshots', tableName);
  await setDoc(tableRef, {
    data,
    lastUpdated: serverTimestamp()
  });
};

/**
 * Uploads a read-only snapshot of the employee directory to Firestore.
 * This allows employees to authenticate from their personal devices
 */
export const syncEmployeeSnapshot = async (adminUid, employees) => {
  if (!db || !adminUid) return;
  const snapshotRef = doc(db, 'companies', adminUid, 'auth', 'employees');
  
  // Extract only the minimal fields necessary for login to maintain privacy
  const snapshotData = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    passwordHash: emp.passwordHash || emp.password,
    role: emp.role || 'Employee',
    department: emp.department || '',
    avatar: emp.avatar || '',
    devices: emp.devices || []
  }));

  try {
    await setDoc(snapshotRef, { data: snapshotData, lastUpdated: new Date().toISOString() });
    console.log('Employee snapshot synced to Firebase bridge.');
  } catch (error) {
    console.error('Failed to sync employee snapshot:', error);
  }
};

/**
 * Fetches the employee snapshot from Firestore for employee login verification.
 */
export const fetchEmployeeSnapshot = async (adminUid) => {
  if (!db || !adminUid) return [];
  const snapshotRef = doc(db, 'companies', adminUid, 'auth', 'employees');
  
  try {
    const snap = await getDoc(snapshotRef);
    if (snap.exists() && snap.data().data) {
      return snap.data().data;
    }
  } catch (error) {
    console.error('Failed to fetch employee snapshot:', error);
  }
  return [];
};

/**
 * Uploads a file to Firebase Storage temporarily for the File Bridge.
 */
export const uploadToFirebaseStorage = async (adminUid, file, path) => {
  if (!storage) throw new Error('Firebase Storage is not initialized.');
  const storageRef = ref(storage, `companies/${adminUid}/pending_uploads/${path}`);
  const snapshot = await uploadBytesResumable(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

/**
 * Downloads a file from Firebase Storage as a Blob
 */
export const downloadFromFirebaseStorage = async (adminUid, path) => {
  if (!storage) throw new Error('Firebase Storage is not initialized.');
  const storageRef = ref(storage, `companies/${adminUid}/pending_uploads/${path}`);
  const arrayBuffer = await getBytes(storageRef);
  return new Blob([arrayBuffer]);
};

/**
 * Deletes a file from Firebase Storage after it has been safely synced to Google Drive.
 */
export const deleteFromFirebaseStorage = async (adminUid, path) => {
  if (!storage) return;
  const storageRef = ref(storage, `companies/${adminUid}/pending_uploads/${path}`);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Failed to delete file from Firebase Storage:', error);
  }
};
