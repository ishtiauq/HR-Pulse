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
 * Reads a table's snapshot from Firebase.
 * Returns null if the table doesn't exist yet.
 */
export const fetchTableFromFirestore = async (adminUid, tableName) => {
  if (!db || !adminUid) return null;
  const tableRef = doc(db, 'companies', adminUid, 'snapshots', tableName);
  try {
    const snap = await getDoc(tableRef);
    if (snap.exists() && snap.data().data) return snap.data().data;
  } catch (error) {
    console.error(`Failed to fetch ${tableName} from Firestore:`, error);
  }
  return null;
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
 * Deletes a file from Firebase Storage.
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
