'use strict';

/**
 * Feature 1 — Proactive Burnout & Disengagement Detector.
 *
 * Scheduled on the 1st of each month (Asia/Dhaka). Computes a well-being risk
 * score for every active employee from existing attendance + leave data and
 * alerts HR when the score crosses the threshold.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const {
  onCall,
  HttpsError,
  timestamp,
  lastMonthKey,
  prevMonthKey,
  datesInMonth,
  recentDatesWindow,
  dowOfDate,
  parseTimeToMinutes,
  getSnapshot,
  setSnapshot,
  updateSnapshot,
  listCompanyIds,
  requireAdmin,
  notifyHR,
  iso,
} = require('./common');

const EXPECTED_START_MIN = 9 * 60; // scheduled start 09:00
const RISK_THRESHOLD = 50;

function isActiveEmployee(emp) {
  const s = String(emp.status || 'Active').toLowerCase();
  return s !== 'inactive' && s !== 'terminated';
}

function computeRisk(emp, leaves, logs, loginActivity, ym) {
  const empLeaves = leaves.filter(
    (l) => l.employeeId === emp.id && l.status === 'Approved' && l.startDate
  );

  // Approved sick leaves whose start date is a Monday(1) or Friday(5) in month.
  const monthRange = datesInMonth(ym);
  const mondayFridaySickCount = empLeaves.filter((l) => {
    const type = String(l.leaveType || '').toLowerCase();
    if (!type.includes('sick')) return false;
    if (!monthRange.includes(l.startDate)) return false;
    const dow = dowOfDate(l.startDate);
    return dow === 1 || dow === 5;
  }).length;

  // Average lateness over the trailing 28 days (only positive lateness counts,
  // averaged over the days on which a check-in was recorded).
  const windowDates = recentDatesWindow(28);
  let lateTotal = 0;
  let lateDays = 0;
  for (const d of windowDates) {
    const log = logs[d] && logs[d][emp.id];
    if (!log) continue;
    const checkIn = parseTimeToMinutes(log.checkIn);
    if (checkIn == null) continue;
    lateDays += 1;
    if (checkIn > EXPECTED_START_MIN) lateTotal += checkIn - EXPECTED_START_MIN;
  }
  const averageLateMinutes = lateDays > 0 ? Math.round((lateTotal / lateDays) * 10) / 10 : 0;

  // Unauthorized absences: explicit 'Absent' status not covered by an approved leave.
  const coveredByLeave = (dateStr) =>
    empLeaves.some((l) => {
      const s = new Date(`${l.startDate}T00:00:00Z`).getTime();
      const e = l.endDate ? new Date(`${l.endDate}T00:00:00Z`).getTime() : s;
      const t = new Date(`${dateStr}T00:00:00Z`).getTime();
      return t >= s && t <= e;
    });
  let unauthorizedAbsenceCount = 0;
  for (const d of monthRange) {
    const log = logs[d] && logs[d][emp.id];
    if (log && String(log.status || '').toLowerCase() === 'absent' && !coveredByLeave(d)) {
      unauthorizedAbsenceCount += 1;
    }
  }

  // Self-service login drop > 50% vs previous month (tracked per user uid).
  let loginDropFlag = false;
  if (emp.uid && loginActivity) {
    const cur = (loginActivity[ym] || {})[emp.uid] || 0;
    const prev = (loginActivity[prevMonthKey(ym)] || {})[emp.uid] || 0;
    loginDropFlag = prev > 0 && cur < prev * 0.5;
  }

  const riskScore = Math.min(
    100,
    Math.round(
      mondayFridaySickCount * 15 + averageLateMinutes * 2 + unauthorizedAbsenceCount * 20 + (loginDropFlag ? 30 : 0)
    )
  );

  return {
    mondayFridaySickCount,
    averageLateMinutes,
    unauthorizedAbsenceCount,
    loginDropFlag,
    riskScore,
  };
}

async function runBurnoutAnalysis(companyId, ym) {
  const employees = (await getSnapshot(companyId, 'employees', [])) || [];
  const leaves = (await getSnapshot(companyId, 'leave_requests', [])) || [];
  const logs = (await getSnapshot(companyId, 'attendance_logs', {})) || {};
  const loginActivity = (await getSnapshot(companyId, 'login_activity', {})) || {};

  const active = employees.filter(isActiveEmployee);
  let existing = (await getSnapshot(companyId, 'burnout_risks', [])) || [];
  existing = existing.filter((r) => r.yearMonth !== ym);

  const newRisks = active.map((emp) => {
    const r = computeRisk(emp, leaves, logs, loginActivity, ym);
    return {
      id: `${emp.id}-${ym}`,
      employeeId: emp.id,
      yearMonth: ym,
      mondayFridaySickCount: r.mondayFridaySickCount,
      averageLateMinutes: r.averageLateMinutes,
      unauthorizedAbsenceCount: r.unauthorizedAbsenceCount,
      loginDropFlag: r.loginDropFlag,
      riskScore: r.riskScore,
      alertSent: false,
      createdAt: timestamp(),
    };
  });

  for (const entry of newRisks) {
    if (entry.riskScore > RISK_THRESHOLD) {
      const emp = active.find((e) => e.id === entry.employeeId);
      await notifyHR(
        companyId,
        'Well-being Alert',
        `${emp ? emp.name : entry.employeeId} scored ${entry.riskScore}/100 on the well-being risk index for ${ym}. Review workload and schedule a check-in.`,
        { table: 'burnout_risks', id: entry.id }
      );
    }
  }

  await setSnapshot(companyId, 'burnout_risks', [...existing, ...newRisks]);
  return newRisks;
}

exports.scheduledBurnoutAnalysis = onSchedule(
  { schedule: '0 0 1 * *', timeZone: 'Asia/Dhaka' },
  async () => {
    const ym = lastMonthKey();
    const companies = await listCompanyIds();
    for (const companyId of companies) {
      try {
        await runBurnoutAnalysis(companyId, ym);
        console.log(`[burnout] ${companyId} analyzed for ${ym}`);
      } catch (e) {
        console.error(`[burnout] failed for ${companyId}:`, e);
      }
    }
  }
);

exports.getBurnoutRisks = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const ym = request.data && request.data.month ? request.data.month : lastMonthKey();
  const threshold =
    request.data && typeof request.data.threshold === 'number' ? request.data.threshold : RISK_THRESHOLD;

  const risks = (await getSnapshot(companyId, 'burnout_risks', [])) || [];
  const employees = (await getSnapshot(companyId, 'employees', [])) || [];
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const flagged = risks
    .filter((r) => r.yearMonth === ym && r.riskScore > threshold)
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: (empMap.get(r.employeeId) || {}).name || r.employeeId,
      department: (empMap.get(r.employeeId) || {}).department || '',
      mondayFridaySickCount: r.mondayFridaySickCount || 0,
      averageLateMinutes: r.averageLateMinutes || 0,
      unauthorizedAbsenceCount: r.unauthorizedAbsenceCount || 0,
      loginDropFlag: !!r.loginDropFlag,
      riskScore: r.riskScore,
      alertSent: !!r.alertSent,
      createdAt: iso(r.createdAt),
    }));

  return { month: ym, threshold, highRiskCount: flagged.length, risks: flagged };
});

exports.acknowledgeRiskAlert = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const docId = request.data && request.data.docId;
  if (!docId) throw new HttpsError('invalid-argument', 'Missing docId.');

  await updateSnapshot(
    companyId,
    'burnout_risks',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      return list.map((r) => (r.id === docId ? { ...r, alertSent: true } : r));
    },
    []
  );
  return { ok: true };
});

// Exposed so the monthly "run now" UI trigger can reuse the logic.
exports.runBurnoutAnalysisNow = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const ym = (request.data && request.data.month) || lastMonthKey();
  const risks = await runBurnoutAnalysis(companyId, ym);
  return { month: ym, analyzed: risks.length };
});