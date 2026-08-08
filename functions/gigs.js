'use strict';

/**
 * Feature 2 — Internal Micro-Gig Marketplace.
 *
 * Employees list skills, post small gigs, apply, and get matched to gigs that
 * fit their secondary skills. All data lives in company snapshot tables.
 */

const {
  onCall,
  HttpsError,
  timestamp,
  getSnapshot,
  setSnapshot,
  updateSnapshot,
  getCompanyIdForUid,
  getUser,
  requireAdmin,
  iso,
} = require('./common');

function normalizeSkill(s) {
  return String(s || '').trim().toLowerCase();
}

async function getSkillsForCompany(companyId) {
  const skills = (await getSnapshot(companyId, 'employee_skills', {})) || {};
  return skills; // { employeeId: [skillName, ...] }
}

async function pushNotification(companyId, employeeId, message, ref) {
  await updateSnapshot(
    companyId,
    'notifications',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      return [
        { id: `n-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, employeeId, message, ref, read: false, createdAt: new Date().toISOString() },
        ...list,
      ].slice(0, 100);
    },
    []
  );
}

exports.createGig = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');

  const data = request.data || {};
  const title = String(data.title || '').trim();
  const description = String(data.description || '').trim();
  const skills = (Array.isArray(data.skills) ? data.skills : String(data.skills || '').split(','))
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  const requiredSkill = String(data.requiredSkill || skills[0] || '').trim();
  const estimatedHours = Math.max(0, Number(data.estimatedHours) || 0);
  if (!title || !description) {
    throw new HttpsError('invalid-argument', 'title and description are required.');
  }

  const poster = await getUser(uid);
  const posterEmployeeId = (poster && poster.employeeId) || uid;

  const gig = {
    id: `gig-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    description,
    postedBy: posterEmployeeId,
    postedByUid: uid,
    skills,
    requiredSkill,
    estimatedHours,
    status: 'open',
    assignedTo: null,
    createdAt: timestamp(),
    completedAt: null,
    notifiedTo: [],
  };

  // Auto-notify employees who list the required skill.
  const skillMap = await getSkillsForCompany(companyId);
  const want = normalizeSkill(requiredSkill);
  const matches = want ? Object.keys(skillMap).filter(
    (empId) => (skillMap[empId] || []).some((s) => normalizeSkill(s) === want)
  ) : [];
  gig.notifiedTo = matches;
  for (const empId of matches) {
    await pushNotification(companyId, empId, `A new gig "${title}" matches your skill (${requiredSkill}).`, { table: 'gigs', id: gig.id });
  }

  await updateSnapshot(companyId, 'gigs', async (current) => {
    const list = Array.isArray(current) ? current : [];
    return [gig, ...list];
  }, []);

  return { gig };
});

exports.getOpenGigs = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');

    const me = await getUser(uid);
  const myEmployeeId = (me && me.employeeId) || uid;

  const gigs = (await getSnapshot(companyId, 'gigs', [])) || [];
  const applications = (await getSnapshot(companyId, 'gig_applications', [])) || [];
  const employees = (await getSnapshot(companyId, 'employees', [])) || [];
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const skills = await getSkillsForCompany(companyId);
  const mySkills = (skills[myEmployeeId] || []).map(normalizeSkill);

  const decorate = (g) => ({
    id: g.id,
    title: g.title,
    description: g.description || '',
    postedBy: g.postedBy,
    postedByName: (empMap.get(g.postedBy) || {}).name || g.postedBy,
    skills: Array.isArray(g.skills) ? g.skills : (g.requiredSkill ? [g.requiredSkill] : []),
    requiredSkill: g.requiredSkill || '',
    estimatedHours: g.estimatedHours || 0,
    status: g.status,
    assignedTo: g.assignedTo,
    assignedToName: g.assignedTo ? (empMap.get(g.assignedTo) || {}).name || g.assignedTo : null,
    matchesMySkill: mySkills.includes(normalizeSkill(g.requiredSkill)),
    applied: applications.some((a) => a.gigId === g.id && a.applicantId === myEmployeeId && a.status !== 'rejected'),
    createdAt: iso(g.createdAt),
    completedAt: iso(g.completedAt),
  });

  const open = gigs.filter((g) => g.status === 'open').map(decorate);
  const myPosted = gigs.filter((g) => g.postedBy === myEmployeeId).map(decorate);
  const myAssigned = gigs.filter((g) => g.assignedTo === myEmployeeId).map(decorate);

  return { open, myPosted, myAssigned, myEmployeeId, skills: skills[myEmployeeId] || [] };
});

exports.applyForGig = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');

  const gigId = request.data && request.data.gigId;
  if (!gigId) throw new HttpsError('invalid-argument', 'Missing gigId.');

  const me = await getUser(uid);
  const myEmployeeId = (me && me.employeeId) || uid;

  const gigs = (await getSnapshot(companyId, 'gigs', [])) || [];
  const gig = gigs.find((g) => g.id === gigId);
  if (!gig) throw new HttpsError('not-found', 'Gig not found.');
  if (gig.status !== 'open') throw new HttpsError('failed-precondition', 'This gig is no longer open.');
  if (gig.postedBy === myEmployeeId) throw new HttpsError('failed-precondition', 'You cannot apply to your own gig.');

  const application = {
    id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    gigId,
    applicantId: myEmployeeId,
    applicantUid: uid,
    status: 'pending',
    appliedAt: timestamp(),
  };

  await updateSnapshot(companyId, 'gig_applications', async (current) => {
    const list = Array.isArray(current) ? current : [];
    const dup = list.find((a) => a.gigId === gigId && a.applicantId === myEmployeeId && a.status === 'pending');
    if (dup) return list;
    return [application, ...list];
  }, []);

  await pushNotification(companyId, gig.postedBy, `An employee applied to your gig "${gig.title}".`, { table: 'gigs', id: gigId });
  return { application };
});

exports.assignGig = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');

  const { gigId, applicantId } = request.data || {};
  if (!gigId || !applicantId) throw new HttpsError('invalid-argument', 'gigId and applicantId are required.');

  const isHr = await requireAdmin(request).then(() => true).catch(() => false);
  const me = await getUser(uid);
  const myEmployeeId = (me && me.employeeId) || uid;

  const gigs = (await getSnapshot(companyId, 'gigs', [])) || [];
  const gig = gigs.find((g) => g.id === gigId);
  if (!gig) throw new HttpsError('not-found', 'Gig not found.');
  if (!isHr && gig.postedBy !== myEmployeeId) {
    throw new HttpsError('permission-denied', 'Only the gig poster or an admin can assign.');
  }
  if (gig.status !== 'open') throw new HttpsError('failed-precondition', 'Gig is not open.');

  await setSnapshot(companyId, 'gigs', gigs.map((g) =>
    g.id === gigId ? { ...g, status: 'in_progress', assignedTo: applicantId } : g
  ));

  await updateSnapshot(companyId, 'gig_applications', async (current) => {
    const list = Array.isArray(current) ? current : [];
    return list.map((a) =>
      a.gigId === gigId
        ? { ...a, status: a.applicantId === applicantId ? 'accepted' : 'rejected' }
        : a
    );
  }, []);

  await pushNotification(companyId, applicantId, `Your application for "${gig.title}" was accepted.`, { table: 'gigs', id: gigId });
  return { gig: { ...gig, status: 'in_progress', assignedTo: applicantId } };
});

exports.completeGig = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');

  const gigId = request.data && request.data.gigId;
  if (!gigId) throw new HttpsError('invalid-argument', 'Missing gigId.');

  const isHr = await requireAdmin(request).then(() => true).catch(() => false);
  const me = await getUser(uid);
  const myEmployeeId = (me && me.employeeId) || uid;

  const gigs = (await getSnapshot(companyId, 'gigs', [])) || [];
  const gig = gigs.find((g) => g.id === gigId);
  if (!gig) throw new HttpsError('not-found', 'Gig not found.');
  if (gig.status !== 'in_progress') throw new HttpsError('failed-precondition', 'Only in-progress gigs can be completed.');
  if (!isHr && gig.assignedTo !== myEmployeeId && gig.postedBy !== myEmployeeId) {
    throw new HttpsError('permission-denied', 'Only the assignee, poster, or an admin can complete.');
  }

  const completedAt = timestamp();
  await setSnapshot(companyId, 'gigs', gigs.map((g) =>
    g.id === gigId ? { ...g, status: 'completed', completedAt } : g
  ));

  // Record contribution for the performance tracker.
  await updateSnapshot(companyId, 'gig_contributions', async (current) => {
    const list = Array.isArray(current) ? current : [];
    return [
      {
        id: `contrib-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        employeeId: gig.assignedTo,
        gigId,
        completedAt,
        yearMonth: new Date().toISOString().slice(0, 7),
      },
      ...list,
    ];
  }, []);

  return { ok: true };
});

// --- Employee skills --------------------------------------------------------

exports.getMySkills = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');
  const me = await getUser(uid);
  const myEmployeeId = (me && me.employeeId) || uid;
  const skills = await getSkillsForCompany(companyId);
  return { skills: skills[myEmployeeId] || [] };
});

exports.addSkill = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');

  const raw = (request.data && (request.data.skillName || request.data.skill)) || '';
  const skill = String(raw).trim();
  if (!skill) throw new HttpsError('invalid-argument', 'skillName is required.');

  const me = await getUser(uid);
  const myEmployeeId = (me && me.employeeId) || uid;

  const skills = await getSkillsForCompany(companyId);
  const current = skills[myEmployeeId] || [];
  if (!current.some((s) => normalizeSkill(s) === normalizeSkill(skill))) {
    skills[myEmployeeId] = [...current, skill];
    await setSnapshot(companyId, 'employee_skills', skills);
  }
  return { skills: skills[myEmployeeId] };
});

exports.removeSkill = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');

  const skill = String((request.data && (request.data.skillName || request.data.skill)) || '').trim();
  const me = await getUser(uid);
  const myEmployeeId = (me && me.employeeId) || uid;

  const skills = await getSkillsForCompany(companyId);
  skills[myEmployeeId] = (skills[myEmployeeId] || []).filter((s) => normalizeSkill(s) !== normalizeSkill(skill));
  await setSnapshot(companyId, 'employee_skills', skills);
  return { skills: skills[myEmployeeId] };
});
