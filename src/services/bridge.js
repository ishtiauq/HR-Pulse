import { db, doc, setDoc, getDoc, collection, getDocs, writeBatch, onSnapshot, serverTimestamp } from './firebase.js';

/**
 * Subscribes to a specific table's snapshot in Firebase.
 * Returns an unsubscribe function.
 */
export const subscribeToTable = (adminUid, tableName, onDataCallback) => {
  if (!db || !adminUid) return () => {};
  const tableRef = doc(db, 'companies', adminUid, 'snapshots', tableName);
  
  return onSnapshot(tableRef, (snapshot) => {
    if (snapshot.exists() && snapshot.data().data) {
      onDataCallback(snapshot.data().data);
    } else {
      onDataCallback(null);
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
  const snapshotRef = doc(db, 'companies', adminUid, 'snapshots', 'employees_auth');
  
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
  const snapshotRef = doc(db, 'companies', adminUid, 'snapshots', 'employees_auth');
  
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
