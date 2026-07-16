/**
 * HR Pulse ZKTeco ADMS Device Push Middleware
 * ===========================================
 * This server receives HTTP POST messages sent directly by ZKTeco biometric
 * devices supporting the ADMS/Push protocol. It parses check-in logs and
 * synchronizes them directly with the Google Drive database.
 * 
 * Run server locally or deploy to server hosting:
 *    npm init -y
 *    npm install express body-parser googleapis
 *    node adms_receiver.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.text({ type: '*/*', limit: '10mb' }));

// Google Drive Authorization Scopes
const SCOPES = ['https://www.googleapis.com/auth/drive.appdata'];

// Load google service accounts or oauth credentials
let oauth2Client;
try {
  const content = fs.readFileSync('credentials.json');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  
  if (fs.existsSync('token.json')) {
    const token = fs.readFileSync('token.json');
    oauth2Client.setCredentials(JSON.parse(token));
  }
} catch (e) {
  console.log("Warning: Google API Credentials not fully configured. Run sync script first to authenticate.");
}

async function getDriveService() {
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Helper to load current database file from Google Drive app folder
async function loadDriveDatabase(drive) {
  try {
    const res = await drive.files.list({
      q: "name='attendance.json'",
      spaces: 'appDataFolder',
      fields: "files(id, name)"
    });
    const files = res.data.files;
    if (files.length === 0) return { fileId: null, data: { leaves: [], balances: {}, dailyLogs: {} } };

    const fileId = files[0].id;
    const media = await drive.files.get({ fileId, alt: 'media' });
    return { fileId, data: media.data };
  } catch (err) {
    console.error("Error reading database from Drive:", err);
    return { fileId: null, data: { leaves: [], balances: {}, dailyLogs: {} } };
  }
}

// Helper to save updated database file back to Drive
async function saveDriveDatabase(drive, fileId, data) {
  try {
    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2)
    };
    if (fileId) {
      await drive.files.update({ fileId, media: media });
    } else {
      const fileMetadata = {
        name: 'attendance.json',
        parents: ['appDataFolder']
      };
      await drive.files.create({ resource: fileMetadata, media: media });
    }
    console.log("Successfully pushed biometric updates to Google Drive.");
  } catch (err) {
    console.error("Error updating database on Drive:", err);
  }
}

/**
 * 1. ZKTeco Device Handshake
 * Initial request sent by ZKTeco device: GET /iclock/cdata?SN=...
 */
app.get('/iclock/cdata', (req, res) => {
  const sn = req.query.SN;
  console.log(`ZKTeco device handshake request from SN: ${sn}`);
  
  // Return standard ADMS server parameters: Registry code, Sync Interval (in minutes), etc.
  const response = [
    "GET OPTION FROM: SN",
    "RegistryCode=DefaultCode",
    "ErrorDelay=60",
    "Delay=30",
    "TransTimes=00:00;14:00",
    "TransInterval=5",
    "Realtime=1",
    "Encrypt=0"
  ].join("\r\n");
  
  res.send(response);
});

/**
 * 2. ZKTeco Real-time Log Push
 * Sent by device when check-ins occur: POST /iclock/cdata?SN=...&table=ATTLOG
 */
app.post('/iclock/cdata', async (req, res) => {
  const sn = req.query.SN;
  const table = req.query.table;
  console.log(`Received push data from SN: ${sn}, target: ${table}`);

  if (table === 'ATTLOG') {
    const rawData = req.body;
    // ZKTeco ADMS Attlog format: Each line represents a check-in:
    // e.g. "102\t2026-07-16 09:05:22\t0\t0\t0\t0"
    const lines = rawData.split(/\r?\n/);
    const punches = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const pin = parts[0];       // e.g. "102"
        const timestamp = parts[1] + " " + parts[2]; // "2026-07-16 09:05:22"
        punches.append({
          employeeId: `EMP-${pin}`,
          timestamp: timestamp.replace(" ", "T"), // ISO mapping
          type: parts[3] === '1' ? 'check_out' : 'check_in'
        });
      }
    });

    if (punches.length > 0 && oauth2Client) {
      const drive = await getDriveService();
      const { fileId, data } = await loadDriveDatabase(drive);
      
      const dailyLogs = data.dailyLogs || {};
      
      punches.forEach(p => {
        const dt = new Date(p.timestamp);
        const dateKey = p.timestamp.split('T')[0]; // "2026-07-16"
        const hours = dt.getHours();
        const minutes = dt.getMinutes();
        const modifier = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const timeStr = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${modifier}`;
        
        if (!dailyLogs[dateKey]) dailyLogs[dateKey] = {};
        if (!dailyLogs[dateKey][p.employeeId]) {
          dailyLogs[dateKey][p.employeeId] = {
            status: 'Present',
            checkIn: '--',
            checkOut: '--',
            hours: '0.0'
          };
        }
        
        const entry = dailyLogs[dateKey][p.employeeId];
        if (p.type === 'check_in' || entry.checkIn === '--') {
          entry.checkIn = timeStr;
          // Check if late (past 09:15 AM)
          if (hours > 9 || (hours === 9 && minutes > 15)) {
            entry.status = 'Late';
          } else {
            entry.status = 'Present';
          }
        } else {
          entry.checkOut = timeStr;
        }

        // Calculate total hours
        if (entry.checkIn !== '--' && entry.checkOut !== '--') {
          const toHours = (tStr) => {
            const [time, mod] = tStr.split(' ');
            let [h, m] = time.split(':').map(Number);
            if (mod === 'PM' && h !== 12) h += 12;
            if (mod === 'AM' && h === 12) h = 0;
            return h + m / 60;
          };
          const duration = toHours(entry.checkOut) - toHours(entry.checkIn);
          entry.hours = duration > 0 ? duration.toFixed(1) : '0.0';
        }

        dailyLogs[dateKey][p.employeeId] = entry;
      });

      data.dailyLogs = dailyLogs;
      await saveDriveDatabase(drive, fileId, data);
    }
  }

  // ADMS demands response confirmation OK
  res.send("OK");
});

// Port listener
app.listen(PORT, () => {
  console.log(`ZKTeco ADMS middleware server listening on port ${PORT}`);
});
