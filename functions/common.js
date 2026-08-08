'use strict';

/**
 * Shared helpers for Kormiis Cloud Functions.
 *
 * The app stores every "table" (employees, leave_requests, attendance_logs,
 * ...) as a single Firestore document under:
 *   companies/{companyId}/snapshots/{table}   ->  { data, lastUpdated }
 *
 * All rules logic runs server-side in plain JavaScript. No external AI.
 */

const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

const db = () => admin.firestore();
const timestamp = () => admin.firestore.Timestamp.now();

// Bangladesh is UTC+6, no DST.
const TZ_OFFSET_MIN = 6 * 60;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function banglaNow() {
  const d = new Date(Date.now() + TZ_OFFSET_MIN * 60 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function monthKeyOf(y, m) {
  return `${y}-${pad2(m)}`;
}

function addMonths(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return monthKeyOf(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

function lastMonthKey() {
  const n = banglaNow();
  return addMonths(monthKeyOf(n.year, n.month), -1);
}

function prevMonthKey(ym) {
  return addMonths(ym, -1);
}

// [start, end) UTC instants; start = midnight Asia/Dhaka on the 1st of ym.
function monthRangeUtc(ym) {
  const [y, m] = ym.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - TZ_OFFSET_MIN * 60 * 1000);
  const end = new Date(Date.UTC(y, m, 1) - TZ_OFFSET_MIN * 60 * 1000);
  return { start, end };
}

function dateStrOf(t) {
  const d = new Date(t.getTime() + TZ_OFFSET_MIN * 60 * 1000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function datesInMonth(ym) {
  const { start, end } = monthRangeUtc(ym);
  const out = [];
  for (let t = start; t < end; t = new Date(t.getTime() + 86400000)) {
    out.push(dateStrOf(t));
  }
  return out;
}

// The last `days` calendar days (Asia/Dhaka) ending today, oldest first.
function recentDatesWindow(days) {
  const n = banglaNow();
  const todayMidnight = new Date(Date.UTC(n.year, n.month - 1, n.day) - TZ_OFFSET_MIN * 60 * 1000);
  const out = [];
  for (let i = days - 1; i >= 1; i--) {
    out.push(dateStrOf(new Date(todayMidnight.getTime() - i * 86400000)));
  }
  return out;
}

// Day of week of a 'YYYY-MM-DD' string: 0=Sunday ... 6=Saturday.
function dowOfDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

function parseTimeToMinutes(v) {
  if (v == null) return null;
  if (typeof v === 'number') {
    if (v > 100000) {
      const d = new Date(v);
      return d.getHours() * 60 + d.getMinutes();
    }
    return v;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s || s === '--' || s === '-' || s.toLowerCase() === 'n/a') return null;
    const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([APap][Mm])?$/);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const ap = m[3] && m[3].toUpperCase();
      if (ap === 'PM' && h < 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return h * 60 + min;
    }
    const t = Date.parse(s);
    if (!isNaN(t)) {
      const d = new Date(t);
      return d.getHours() * 60 + d.getMinutes();
    }
  }
  return null;
}

// --- Snapshot access -------------------------------------------------------

async function getSnapshot(companyId, table, fallback = null) {
  const snap = await db().doc(`companies/${companyId}/snapshots/${table}`).get();
  if (snap.exists && snap.data().data !== undefined) return snap.data().data;
  return fallback;
}

async function setSnapshot(companyId, table, data) {
  await db().doc(`companies/${companyId}/snapshots/${table}`).set(
    { data, lastUpdated: timestamp() },
    { merge: true }
  );
}

async function updateSnapshot(companyId, table, updater, fallback = null) {
  const current = await getSnapshot(companyId, table, fallback);
  const next = await updater(current);
  await setSnapshot(companyId, table, next);
  return next;
}

// --- Companies & auth ------------------------------------------------------

async function listCompanyIds() {
  const snap = await db().collection('companies').get();
  return snap.docs.map((d) => d.id);
}

async function getUser(uid) {
  if (!uid) return null;
  const snap = await db().doc(`users/${uid}`).get();
  return snap.exists ? snap.data() : null;
}

// Workspace owner -> their own uid; member -> linked company uid.
async function getCompanyIdForUid(uid) {
  const u = await getUser(uid);
  return u && u.companyUid ? u.companyUid : null;
}

async function isAdmin(uid) {
  const u = await getUser(uid);
  if (!u) return false;
  return u.companyUid === uid || ['Admin', 'HR'].includes(u.role);
}

function assertAuth(context) {
  if (!context || !context.auth || !context.auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  return context.auth.uid;
}

// Returns { companyId, user } for the caller; throws if the caller is not HR.
async function requireAdmin(context) {
  const uid = assertAuth(context);
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) {
    throw new HttpsError('failed-precondition', 'Account is not linked to a company.');
  }
  if (!(await isAdmin(uid))) {
    throw new HttpsError('permission-denied', 'Admin/HR access required.');
  }
  const user = await getUser(uid);
  return { uid, companyId, user };
}

// Lightweight HR feed. Appends to companies/{id}/snapshots/hr_alerts.
function notifyHR(companyId, title, message, ref = null) {
  return updateSnapshot(
    companyId,
    'hr_alerts',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      const entry = {
        id: `hr-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        title,
        message,
        ref,
        read: false,
        createdAt: new Date().toISOString(),
      };
      return [entry, ...list].slice(0, 200);
    },
    []
  );
}

function iso(ts) {
  if (!ts) return null;
  if (typeof ts === 'object' && typeof ts.toDate === 'function') return ts.toDate().toISOString();
  if (typeof ts === 'object' && ts.seconds != null) return new Date(ts.seconds * 1000).toISOString();
  return new Date(ts).toISOString();
}

module.exports = {
  admin,
  onCall,
  HttpsError,
  db,
  timestamp,
  banglaNow,
  addMonths,
  lastMonthKey,
  prevMonthKey,
  monthRangeUtc,
  dateStrOf,
  datesInMonth,
  recentDatesWindow,
  dowOfDate,
  parseTimeToMinutes,
  getSnapshot,
  setSnapshot,
  updateSnapshot,
  listCompanyIds,
  getUser,
  getCompanyIdForUid,
  isAdmin,
  assertAuth,
  requireAdmin,
  notifyHR,
  iso,
};
