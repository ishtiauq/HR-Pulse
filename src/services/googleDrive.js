/**
 * Helper Service for Google Identity Services and Google Drive REST API v3
 */

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

/**
 * Fetch Google User profile info using the access token
 */
export async function fetchUserProfile(token) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return await res.json();
}

/**
 * Search for a file in the appDataFolder by name
 * Returns the file metadata (including id) if found, otherwise null
 */
export async function findAppDataFile(filename, token) {
  const query = encodeURIComponent(`name='${filename}' and 'appDataFolder' in parents and trashed=false`);
  const url = `${DRIVE_FILES_URL}?q=${query}&spaces=appDataFolder&fields=files(id,name)`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to search Google Drive: ${res.statusText}`);
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0] : null;
}

/**
 * Fetch file contents by file ID
 */
export async function downloadAppDataFile(fileId, token) {
  const url = `${DRIVE_FILES_URL}/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to read file from Drive: ${res.statusText}`);
  return await res.json();
}

/**
 * Create a new file in appDataFolder
 */
export async function createAppDataFile(filename, content, token) {
  const metadata = {
    name: filename,
    parents: ['appDataFolder']
  };

  const boundary = 'hr_pulse_multipart_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(content) +
    closeDelimiter;

  const res = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: body
  });

  if (!res.ok) throw new Error(`Failed to create file on Drive: ${res.statusText}`);
  return await res.json();
}

/**
 * Update an existing file's content
 */
export async function updateAppDataFile(fileId, content, token) {
  const url = `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify(content)
  });

  if (!res.ok) throw new Error(`Failed to update file on Drive: ${res.statusText}`);
  return await res.json();
}

/**
 * High-level Sync function:
 * Loads database content if it exists; otherwise, creates it with default data.
 */
export async function loadOrInitializeDatabase(filename, defaultContent, token) {
  const file = await findAppDataFile(filename, token);
  if (file) {
    // File exists, download and return content along with the fileId
    const data = await downloadAppDataFile(file.id, token);
    return { data, fileId: file.id };
  } else {
    // File doesn't exist, create it with default data
    const newFile = await createAppDataFile(filename, defaultContent, token);
    return { data: defaultContent, fileId: newFile.id };
  }
}
