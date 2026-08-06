import { db } from './firebase.js';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

/**
 * Firebase Firestore Database Service
 * Replaces the old Google Drive / LocalStorage implementation.
 */

// Helper to determine company ID. 
// For Admins, it's their uid. For Employees, it's their hrToken (which we will set to the Admin's uid).
const getCompanyId = (token) => {
  if (!token) return 'default_company';
  return token; 
};

/**
 * Reads a table (document) from Firestore.
 */
export async function readTable(tableName, token, bgSyncCallback = null) {
  if (!db) return null;
  const companyId = getCompanyId(token);
  const docRef = doc(db, `companies/${companyId}/tables/${tableName}`);
  
  try {
    const docSnap = await getDoc(docRef);
    
    // Set up background sync listener if provided
    if (bgSyncCallback) {
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
          const data = snapshot.data().data;
          bgSyncCallback(tableName, data);
        }
      });
    }

    if (docSnap.exists()) {
      return docSnap.data().data;
    }
    return null;
  } catch (error) {
    console.error(`Error reading table ${tableName}:`, error);
    return null;
  }
}

/**
 * Writes a table (document) to Firestore.
 */
export async function writeTable(tableName, data, meta, token) {
  if (!db) return { updatedData: data, offline: true };
  const companyId = getCompanyId(token);
  const docRef = doc(db, `companies/${companyId}/tables/${tableName}`);
  
  try {
    await setDoc(docRef, {
      data,
      updatedAt: serverTimestamp(),
      schema_version: meta?.schema_version || "1.0"
    });
    return { updatedData: data, conflicts: [], offline: false };
  } catch (error) {
    console.error(`Error writing table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Reads metadata (simulating the old _meta.json)
 */
export async function readMeta(token) {
  if (!db) return null;
  const companyId = getCompanyId(token);
  const docRef = doc(db, `companies/${companyId}`);
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().meta || { schema_version: "1.0", last_sync: new Date().toISOString(), files: {} };
    }
    return null; // Will trigger rebuild in useAppData
  } catch (error) {
    console.error("Error reading meta:", error);
    return null;
  }
}

/**
 * Dummy function to replace the old backup mechanism.
 * Firestore handles its own replication and backups.
 */
export async function checkAndRunAutoBackup(token) {
  // No-op for Firestore
  return true;
}

export async function flushPendingWrites(token, metaManifest, conflictCallback, successCallback) {
  // Firestore handles offline writes automatically.
  if (successCallback) successCallback(0);
}

export async function clearLocalCache() {
  localStorage.clear();
  return true;
}

export async function createBackup() {
  return true;
}

export async function listBackups() {
  return [];
}

export async function restoreBackup() {
  return true;
}

export async function fetchUserProfile(token) {
  return {
    name: 'Admin',
    email: '',
    picture: ''
  };
}
