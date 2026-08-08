'use strict';

/**
 * Feature 4 — Life-Event-Aware Workflow Automation.
 *
 * Firestore triggers detect marriage / child birth / bereavement from leave
 * requests and profile changes, then auto-generate HR follow-up tasks and
 * (for marriage) add leave quota.
 */

const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const {
  onCall,
  HttpsError,
  timestamp,
  getSnapshot,
  setSnapshot,
  updateSnapshot,
  requireAdmin,
  notifyHR,
} = require('./common');

const TASKS = {
  marriage: [
    'Send a congratulatory message to the employee.',
    'Update insurance nominee details.',
    'Add a marriage gift/welcome card.',
    'Offer pre-marriage/paid marriage leave options.',
  ],
  child_birth: [
    'Provide the parental leave policy document.',
    'Update insurance and add the dependent.',
    'Offer flexible working arrangements if requested.',
  ],
  bereavement: [
    'Send condolences to the employee.',
    'Adjust the employee workload temporarily.',
    'Provide bereavement leave policy information.',
  ],
  relocation: [
    'Update the employee address on file.',
    'Review shift timing if the new location is far.',
  ],
};

async function addTask(companyId, eventId, taskDescription) {
  await updateSnapshot(
    companyId,
    'life_event_tasks',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      return [
        {
          id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          eventId,
          taskDescription,
          status: 'pending',
          dueDate: timestamp(),
          createdAt: timestamp(),
        },
        ...list,
      ];
    },
    []
  );
}

async function processLifeEvent(companyId, event) {
  const { employeeId, eventType, eventDate, detectedFrom } = event;

  const existing = (await getSnapshot(companyId, 'life_events', [])) || [];
  const dupKey = `${employeeId}|${eventType}|${eventDate}`;
  if (existing.some((e) => e.dupKey === dupKey)) return null;

  const actionsTaken = [...TASKS[eventType]];
  const lifeEvent = {
    id: `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    dupKey,
    employeeId,
    eventType,
    eventDate,
    detectedFrom,
    actionsTaken,
    createdAt: timestamp(),
  };

  await updateSnapshot(companyId, 'life_events', async (cur) => [lifeEvent, ...cur], []);
  for (const action of actionsTaken) {
    await addTask(companyId, lifeEvent.id, action);
  }

  // Marriage: auto-add 3 days of marriage leave quota.
  if (eventType === 'marriage') {
    await updateSnapshot(companyId, 'leave_balances', async (current) => {
      const balances = typeof current === 'object' && current !== null ? current : {};
      const empBal = balances[employeeId] || {};
      const prev = empBal.Marriage || {};
      empBal.Marriage = {
        used: typeof prev === 'object' && prev.used != null ? prev.used : 0,
        limit: (typeof prev === 'object' && prev.limit != null ? prev.limit : 0) + 3,
      };
      return { ...balances, [employeeId]: empBal };
    }, {});
  }

  await notifyHR(
    companyId,
    `Life Event: ${eventType.replace('_', ' ')}`,
    `A life event (${eventType}) was detected for employee ${employeeId}. Follow-up tasks were generated.`,
    { table: 'life_events', id: lifeEvent.id }
  );

  return lifeEvent;
}

// --- Trigger: leave requests (wedding / paternity / bereavement) ------------

exports.leaveLifeEventTrigger = onDocumentWritten(
  'companies/{companyId}/snapshots/leave_requests',
  async (event) => {
    const companyId = event.params.companyId;
    const before = event.data.before && event.data.before.data() ? event.data.before.data().data || [] : [];
    const after = event.data.after && event.data.after.data() ? event.data.after.data().data || [] : [];
    const beforeIds = new Set(before.map((l) => l.id));
    const newlyAdded = after.filter((l) => l.id && !beforeIds.has(l.id) && l.status === 'Approved');

    for (const l of newlyAdded) {
      const type = String(l.leaveType || '').toLowerCase();
      let eventType = null;
      if (type.includes('wedding') || type.includes('marriage')) eventType = 'marriage';
      else if (type.includes('paternity') || type.includes('child')) eventType = 'child_birth';
      else if (type.includes('bereavement') || type.includes('compassionate') || type.includes('funeral')) eventType = 'bereavement';
      if (!eventType) continue;
      try {
        await processLifeEvent(companyId, {
          employeeId: l.employeeId,
          eventType,
          eventDate: (l.startDate || '').slice(0, 10),
          detectedFrom: 'leave_request',
        });
      } catch (e) {
        console.error(`[lifeEvents] leave trigger failed for ${companyId}:`, e);
      }
    }
  }
);

// --- Trigger: employees (marital status / dependents change) ----------------

exports.profileLifeEventTrigger = onDocumentWritten(
  'companies/{companyId}/snapshots/employees',
  async (event) => {
    const companyId = event.params.companyId;
    const before = event.data.before && event.data.before.data() ? event.data.before.data().data || [] : [];
    const after = event.data.after && event.data.after.data() ? event.data.after.data().data || [] : [];
    const beforeMap = new Map(before.map((e) => [e.id, e]));
    const todayStr = new Date().toISOString().slice(0, 10);

    for (const emp of after) {
      const oldEmp = beforeMap.get(emp.id);
      if (!oldEmp) continue;
      const oldStatus = String(oldEmp.maritalStatus || '').toLowerCase();
      const newStatus = String(emp.maritalStatus || '').toLowerCase();
      const oldDep = Array.isArray(oldEmp.dependents) ? oldEmp.dependents.length : 0;
      const newDep = Array.isArray(emp.dependents) ? emp.dependents.length : 0;

      if (oldStatus !== 'married' && newStatus === 'married') {
        try {
          await processLifeEvent(companyId, {
            employeeId: emp.id,
            eventType: 'marriage',
            eventDate: todayStr,
            detectedFrom: 'profile_update',
          });
        } catch (e) {
          console.error(`[lifeEvents] profile trigger failed for ${companyId}:`, e);
        }
      }
      if (newDep > oldDep) {
        try {
          await processLifeEvent(companyId, {
            employeeId: emp.id,
            eventType: 'child_birth',
            eventDate: todayStr,
            detectedFrom: 'profile_update',
          });
        } catch (e) {
          console.error(`[lifeEvents] profile trigger failed for ${companyId}:`, e);
        }
      }
    }
  }
);

// --- Callables --------------------------------------------------------------

function decorate(events, tasks, employees) {
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const taskByEvent = (eventId) =>
    tasks
      .filter((t) => t.eventId === eventId)
      .sort((a, b) => (a.createdAt && b.createdAt ? b.createdAt.seconds - a.createdAt.seconds : 0));
  return events
    .slice()
    .sort((a, b) => (a.createdAt && b.createdAt ? b.createdAt.seconds - a.createdAt.seconds : 0))
    .map((e) => ({
      id: e.id,
      employeeId: e.employeeId,
      employeeName: (empMap.get(e.employeeId) || {}).name || e.employeeId,
      eventType: e.eventType,
      eventDate: e.eventDate,
      detectedFrom: e.detectedFrom,
      actionsTaken: e.actionsTaken || [],
      tasks: taskByEvent(e.id),
      pendingTasks: taskByEvent(e.id).filter((t) => t.status === 'pending').length,
      createdAt: e.createdAt ? (e.createdAt.seconds ? new Date(e.createdAt.seconds * 1000).toISOString() : null) : null,
    }));
}

exports.getLifeEvents = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const events = (await getSnapshot(companyId, 'life_events', [])) || [];
  const tasks = (await getSnapshot(companyId, 'life_event_tasks', [])) || [];
  const employees = (await getSnapshot(companyId, 'employees', [])) || [];
  return {
    pendingCount: events.filter((e) => {
      const t = tasks.filter((x) => x.eventId === e.id && x.status === 'pending');
      return t.length > 0;
    }).length,
    events: decorate(events, tasks, employees),
  };
});

exports.getMyLifeEvents = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const { getUser, getCompanyIdForUid } = require('./common');
  const companyId = await getCompanyIdForUid(uid);
  if (!companyId) throw new HttpsError('failed-precondition', 'Account is not linked to a company.');
  const me = await getUser(uid);
  const myEmployeeId = (me && me.employeeId) || uid;
  const events = (await getSnapshot(companyId, 'life_events', [])) || [];
  const tasks = (await getSnapshot(companyId, 'life_event_tasks', [])) || [];
  const employees = (await getSnapshot(companyId, 'employees', [])) || [];
  const mine = events.filter((e) => e.employeeId === myEmployeeId);
  return { events: decorate(mine, tasks, employees) };
});

exports.completeLifeEventTask = onCall(async (request) => {
  const { companyId } = await requireAdmin(request);
  const taskId = request.data && request.data.taskId;
  if (!taskId) throw new HttpsError('invalid-argument', 'Missing taskId.');
  await updateSnapshot(
    companyId,
    'life_event_tasks',
    async (current) => {
      const list = Array.isArray(current) ? current : [];
      return list.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t));
    },
    []
  );
  return { ok: true };
});
