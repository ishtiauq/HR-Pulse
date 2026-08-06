import { db, doc, setDoc, getDoc, collection, getDocs, writeBatch } from './firebase.js';

/**
 * Uploads a read-only snapshot of the employee directory to Firestore.
 * This allows employees to authenticate from their personal devices
 * without having access to the Admin's Google Drive.
 */
export const syncEmployeeSnapshot = async (adminUid, employees) => {
  if (!db || !adminUid) return;
  const snapshotRef = doc(db, 'companies', adminUid, 'snapshots', 'employees');
  
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
  const snapshotRef = doc(db, 'companies', adminUid, 'snapshots', 'employees');
  
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
 * Allows an employee to submit a clock-in/out record to the Firebase mailbox
 * when they are operating from a personal device.
 */
export const submitAttendanceToMailbox = async (adminUid, attendanceLog) => {
  if (!db || !adminUid) throw new Error('Firebase not connected or missing Admin ID.');
  
  const logRef = doc(collection(db, 'companies', adminUid, 'attendance_mailbox'));
  await setDoc(logRef, {
    ...attendanceLog,
    _submittedAt: new Date().toISOString()
  });
};

/**
 * Flushes all pending attendance logs from the Firebase mailbox so they can be
 * saved to the Admin's Google Drive. Deletes them from Firebase once retrieved.
 */
export const flushAttendanceMailbox = async (adminUid) => {
  if (!db || !adminUid) return [];
  
  const mailboxRef = collection(db, 'companies', adminUid, 'attendance_mailbox');
  const snap = await getDocs(mailboxRef);
  
  if (snap.empty) return [];
  
  const logs = [];
  const batch = writeBatch(db);
  
  snap.forEach(docSnap => {
    const data = docSnap.data();
    delete data._submittedAt; // Remove metadata
    logs.push(data);
    batch.delete(docSnap.ref); // Queue deletion
  });
  
  await batch.commit();
  console.log(`Flushed ${logs.length} attendance records from mailbox.`);
  return logs;
};

/**
 * Submits a new device registration to the Firebase mailbox for the Admin to process.
 */
export const submitDeviceToMailbox = async (adminUid, deviceData) => {
  if (!db || !adminUid) throw new Error('Firebase not connected or missing Admin ID.');
  
  const deviceRef = doc(collection(db, 'companies', adminUid, 'device_mailbox'));
  await setDoc(deviceRef, {
    ...deviceData,
    _submittedAt: new Date().toISOString()
  });
};

/**
 * Flushes all pending device registrations from the Firebase mailbox so they can be
 * saved to the Admin's Google Drive. Deletes them from Firebase once retrieved.
 */
export const flushDeviceMailbox = async (adminUid) => {
  if (!db || !adminUid) return [];
  
  const mailboxRef = collection(db, 'companies', adminUid, 'device_mailbox');
  const snap = await getDocs(mailboxRef);
  
  if (snap.empty) return [];
  
  const devices = [];
  const batch = writeBatch(db);
  
  snap.forEach(docSnap => {
    const data = docSnap.data();
    delete data._submittedAt; // Remove metadata
    devices.push(data);
    batch.delete(docSnap.ref); // Queue deletion
  });
  
  await batch.commit();
  console.log(`Flushed ${devices.length} device registrations from mailbox.`);
  return devices;
};
