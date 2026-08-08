'use strict';

/**
 * Feature 3 — Auto-Updating Labour Law Compliance Engine (Bangladesh-centric).
 *
 * Nightly scheduled checks against configurable rules + a Firestore trigger for
 * maternity leave. Alerts are stored in companies/{id}/snapshots/compliance_alerts.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const {
  onCall,
  HttpsError,
  timestamp,
  banglaNow,
  dateStrOf,
  dowOfDate,
  parseTimeToMinutes,
  getSnapshot,
  setSnapshot,
  updateSnapshot,
  listCompanyIds,
  requireAdmin,
  notifyHR,
} = require('./common');

const DEFAULT_RULES = [
  { id: 'max_daily_hours', ruleName: 'Max daily working hours (incl. overtime)', ruleType: 'working_hours', threshold: '10', description: 'Daily work hours including overtime must not exceed 10.' },
  { id: 'max_weekly_hours', ruleName: 'Max weekly working hours', ruleType: 'working_hours', threshold: '56', description: 'Weekly working hours must not exceed 56.' },
  { id: 'maternity_min_weeks', ruleName: 'Minimum maternity leave', ruleType: 'maternity', threshold: '16', description: 'Maternity leave entitlement is 16 weeks and must not be denied.' },
  { id: 'festival_bonus_days', ruleName: 'Festival bonus payment window', ruleType: 'bonus', threshold: '15', description: 'Festival bonus must be paid within 15 days before/after the official holiday.' },
  { id: 'unpaid_leave_doc_days', ruleName: 'Unpaid leave documentation', ruleType: 'leave', threshold: '7', description: 'Unpaid leave for more than 7 consecutive days requires documentation.' },
];

const DEFAULT_FESTIVALS = [
  { id: 'eid-ul-adha-2026', name: 'Eid-ul-Adha', date: '2026-05-27' },
  { id: 'durga-puja-2026', name: 'Durga Puja', date: '2026-10-19' },
];

async function ensureRulesAndFestivals(companyId) {
  let rules = (await getSnapshot(companyId, 'compliance_rules', null)) || [];
  if (rules.length === 0) {
    rules = DEFAULT_RULES;
    await setSnapshot(companyId, 'compliance_rules', rules);
  }
  let festivals = (await getSnapshot(companyId, 'festival_dates', null)) || [];
  if (festivals.length === 0) {
    festivals = DEFAULT_FESTIVALS;
    await setSnapshot(companyId, 'festival_dates', festivals);
  }
  return { rules, festivals };
}

function ruleThreshold(rules, id, fallback) {
  const r = rules.find((x) => x.id === id);
  const v = r ? Number(r.threshold) : fallback;
  return Number.isFinite(v) ? v : fallback;
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

function alertKey(ruleId, empId, bucket) {
  return `${ruleId}|${empId || 'all'}|${bucket}`;
}

async function createAlert(companyId, existing, key, ruleId, employeeId, alertMessage) {
  if (existing.has(key)) return existing;
  existing.add(key);
  await updateSnapshot(
    companyId,
    'compliance_alerts',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      if (list.some((a) => a.status === 'open' && a.key === key)) return list;
      return [
        {
          key,
          ruleId,
          employeeId: employeeId || null,
          alertMessage,
          status: 'open',
          createdAt: timestamp(),
        },
        ...list,
      ].slice(0, 300);
    },
    []
  );
  return existing;
}

async function runComplianceCheck(companyId) {
  const { rules, festivals } = await ensureRulesAndFestivals(companyId);
  const employees = (await getSnapshot(companyId, 'employees', [])) || [];
  const logs = (await getSnapshot(companyId, 'attendance_logs', {})) || {};
  const payroll = (await getSnapshot(companyId, 'payroll', {})) || {};
  const leaves = (await getSnapshot(companyId, 'leave_requests', [])) || [];

  const today = dateStrOf(new Date());
  const existing = new Set();
  const create = (key, ruleId, empId, msg) => createAlert(companyId, existing, key, ruleId, empId, msg);

  const maxDaily = ruleThreshold(rules, 'max_daily_hours', 10);
  const maxWeekly = ruleThreshold(rules, 'max_weekly_hours', 56);
  const unpaidDocDays = ruleThreshold(rules, 'unpaid_leave_doc_days', 7);

  // 1. Daily working hours.
  const dayLogs = logs[today] || {};
  for (const emp of employees) {
    const log = dayLogs[emp.id];
    if (!log) continue;
    const checkIn = parseTimeToMinutes(log.checkIn);
    const checkOut = parseTimeToMinutes(log.checkOut);
    if (checkIn == null || checkOut == null) continue;
    const hours = (checkOut - checkIn) / 60;
    const overtimeMin = Number(log.overtimeMinutes) || 0;
    const total = hours + overtimeMin / 60;
    if (total > maxDaily) {
      await create(alertKey('max_daily_hours', emp.id, today), 'max_daily_hours', emp.id,
        `${emp.name} worked ${total.toFixed(1)}h on ${today} (limit ${maxDaily}h).`);
    }
  }

  // 2. Weekly hours (only computed on Sundays for the previous week).
  if (dowOfDate(today) === 0) {
    const weekDates = [];
    for (let i = 7; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekDates.push(dateStrOf(d));
    }
    const weekKey = weekDates[0];
    for (const emp of employees) {
      let weekHours = 0;
      for (const d of weekDates) {
        const log = logs[d] && logs[d][emp.id];
        if (!log) continue;
        const cin = parseTimeToMinutes(log.checkIn);
        const cout = parseTimeToMinutes(log.checkOut);
        if (cin == null || cout == null) continue;
        weekHours += (cout - cin) / 60 + (Number(log.overtimeMinutes) || 0) / 60;
      }
      if (weekHours > maxWeekly) {
        await create(alertKey('max_weekly_hours', emp.id, weekKey), 'max_weekly_hours', emp.id,
          `${emp.name} logged ${weekHours.toFixed(1)}h in the week of ${weekKey} (limit ${maxWeekly}h).`);
      }
    }
  }

  // 3. Festival bonus: festival within the next N days, no bonus paid that month.
  const bonusWindow = ruleThreshold(rules, 'festival_bonus_days', 15);
  const nowMs = Date.now();
  for (const fest of festivals) {
    if (!fest.date) continue;
    const festMs = new Date(`${fest.date}T00:00:00Z`).getTime();
    const diff = daysBetween(nowMs, festMs);
    if (diff < 0 || diff > bonusWindow) continue;
    const monthKey = fest.date.slice(0, 7);
    const monthPayroll = Array.isArray(payroll[monthKey]) ? payroll[monthKey] : [];
    for (const emp of employees) {
      if (String(emp.status || 'Active').toLowerCase() === 'inactive') continue;
      const paid = monthPayroll.some(
        (p) =>
          p.employeeId === emp.id &&
          p.status === 'Paid' &&
          (p.type === 'bonus' || p.isBonus === true || Number(p.bonus) > 0)
      );
      if (!paid) {
        await create(alertKey('festival_bonus_days', emp.id, `${fest.id}-${monthKey}`), 'festival_bonus_days', emp.id,
          `${emp.name} has no festival bonus recorded for ${fest.name} (${fest.date}).`);
      }
    }
  }

  // 4. Unpaid leave > N consecutive days without documentation.
  for (const l of leaves) {
    const type = String(l.leaveType || '').toLowerCase();
    if (!type.includes('unpaid') && !type.includes('without pay')) continue;
    const days = Number(l.days) || 0;
    if (days <= unpaidDocDays) continue;
    if (l.documented) continue;
    await create(alertKey('unpaid_leave_doc_days', l.employeeId, l.id), 'unpaid_leave_doc_days', l.employeeId,
      `Employee ${l.employeeId} has ${days} consecutive unpaid days without documentation.`);
  }

  return true;
}

exports.scheduledComplianceCheck = onSchedule(
  { schedule: '0 0 * * *', timeZone: 'Asia/Dhaka' },
  async () => {
    const companies = await listCompanyIds();
    for (const companyId of companies) {
      try {
        await runComplianceCheck(companyId);
        console.log(`[compliance] checked ${companyId}`);
      } catch (e) {
        console.error(`[compliance] failed for ${companyId}:`, e);
      }
    }
  }
);

// --- Maternity trigger (created on a leave request). ------------------------
// The client stores leave_requests as a single snapshot document, so this is
// implemented as a document-written trigger that diffs for new maternity leaves.
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

exports.complianceLeaveTrigger = onDocumentWritten(
  'companies/{companyId}/snapshots/leave_requests',
  async (event) => {
    const companyId = event.params.companyId;
    const before = event.data.before && event.data.before.data() ? event.data.before.data().data || [] : [];
    const after = event.data.after && event.data.after.data() ? event.data.after.data().data || [] : [];
    const beforeIds = new Set(before.map((l) => l.id));
    const newlyAdded = after.filter((l) => l.id && !beforeIds.has(l.id));

    const minWeeks = ruleThreshold(await getSnapshot(companyId, 'compliance_rules', null) || DEFAULT_RULES, 'maternity_min_weeks', 16);
    for (const l of newlyAdded) {
      if (!String(l.leaveType || '').toLowerCase().includes('maternity')) continue;
      const days = Number(l.days) || 0;
      const weeks = days / 7;
      if (weeks < minWeeks) {
        await createAlert(
          companyId,
          new Set(),
          alertKey('maternity_min_weeks', l.employeeId, l.id),
          'maternity_min_weeks',
          l.employeeId,
          `Maternity leave for employee ${l.employeeId} is only ${days} days (~${weeks.toFixed(1)} weeks), below the ${minWeeks}-week entitlement. Confirm the employee is not giving up rights.`
        );
        await notifyHR(companyId, 'Maternity Compliance', `Leave of ${days} days is below the ${minWeeks}-week maternity entitlement.`, { table: 'compliance_alerts', id: l.id });
      }
    }
  }
);

// --- Callables --------------------------------------------------------------

exports.getComplianceAlerts = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const alerts = (await getSnapshot(companyId, 'compliance_alerts', [])) || [];
  const employees = (await getSnapshot(companyId, 'employees', [])) || [];
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const open = alerts
    .filter((a) => a.status === 'open')
    .sort((a, b) => (b.createdAt ? (b.createdAt.seconds || 0) : 0) - (a.createdAt ? (a.createdAt.seconds || 0) : 0))
    .map((a) => ({
      id: a.id || a.key,
      key: a.key,
      ruleId: a.ruleId,
      employeeId: a.employeeId,
      employeeName: a.employeeId ? (empMap.get(a.employeeId) || {}).name || a.employeeId : null,
      alertMessage: a.alertMessage,
      status: a.status,
      createdAt: a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000).toISOString() : null) : null,
    }));
  return { openCount: open.length, alerts: open };
});

exports.resolveAlert = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const id = request.data && request.data.alertId;
  if (!id) throw new HttpsError('invalid-argument', 'Missing alertId.');
  await updateSnapshot(
    companyId,
    'compliance_alerts',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      return list.map((a) => ((a.id === id || a.key === id) && a.status === 'open' ? { ...a, status: 'resolved' } : a));
    },
    []
  );
  return { ok: true };
});

exports.getComplianceRules = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const { rules, festivals } = await ensureRulesAndFestivals(companyId);
  return { rules, festivals };
});

exports.updateComplianceRule = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const { ruleId, threshold } = request.data || {};
  if (!ruleId || threshold === undefined) throw new HttpsError('invalid-argument', 'ruleId and threshold are required.');
  await updateSnapshot(
    companyId,
    'compliance_rules',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      return list.map((r) => (r.id === ruleId ? { ...r, threshold: String(threshold) } : r));
    },
    DEFAULT_RULES
  );
  return { ok: true };
});

exports.addFestivalDate = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const { name, date } = request.data || {};
  if (!name || !date) throw new HttpsError('invalid-argument', 'name and date are required.');
  await updateSnapshot(
    companyId,
    'festival_dates',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      if (list.some((f) => f.date === date)) return list;
      return [...list, { id: `fest-${Date.now()}`, name, date }];
    },
    DEFAULT_FESTIVALS
  );
  return { ok: true };
});

exports.removeFestivalDate = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const { id } = request.data || {};
  await updateSnapshot(
    companyId,
    'festival_dates',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      return list.filter((f) => f.id !== id);
    },
    DEFAULT_FESTIVALS
  );
  return { ok: true };
});
