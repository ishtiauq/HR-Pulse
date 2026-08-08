import { getApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

const functions = getFunctions(getApp(), 'asia-south1')

function friendlyError(e) {
  const code = String(e?.code || '')
  const raw = String(e?.message || '')
  const details = e?.details?.message
  const low = raw.toLowerCase()

  // A callable endpoint that 404s with a non-JSON body (function not deployed
  // yet, or deployed to the wrong region) surfaces as 'internal' + "Response
  // is not valid JSON object." Catch it before the generic internal branch.
  if (code.includes('not-found') || low.includes('does not exist') || low.includes('function of cloud function') || low.includes('not valid json')) {
    return 'Backend Cloud Functions are not deployed yet (region asia-south1). Run `firebase deploy --only functions` from the project root, then reload.'
  }
  if (code.includes('unavailable') || code.includes('network') || low.includes('unavailable') || low.includes('network')) {
    return 'Backend functions are unreachable. Check your connection.'
  }
  if (code.includes('permission-denied') || low.includes('permission')) {
    return 'You do not have permission to do this.'
  }
  if (code === 'internal' || low.includes('internal') || low.includes('request to')) {
    return 'Something went wrong on the backend. Please try again.'
  }
  if (details && typeof details === 'string') return details
  return raw || 'Request failed'
}

function wrap(name) {
  const fn = httpsCallable(functions, name)
  return async (data) => {
    try {
      const res = await fn(data)
      return res.data
    } catch (e) {
      throw new Error(friendlyError(e))
    }
  }
}

export const burnoutApi = {
  getBurnoutRisks: wrap('getBurnoutRisks'),
  acknowledgeRiskAlert: wrap('acknowledgeRiskAlert'),
  runNow: wrap('runBurnoutAnalysisNow'),
}

export const gigApi = {
  createGig: wrap('createGig'),
  getOpenGigs: wrap('getOpenGigs'),
  applyForGig: wrap('applyForGig'),
  assignGig: wrap('assignGig'),
  completeGig: wrap('completeGig'),
  getMySkills: wrap('getMySkills'),
  addSkill: wrap('addSkill'),
  removeSkill: wrap('removeSkill'),
}

export const performanceApi = {
  calculate: wrap('calculateMonthlyPerformance'),
  getScores: wrap('getPerformanceScores'),
  getMyScore: wrap('getMyScore'),
  getTrends: wrap('getPerformanceTrends'),
}

export const currentMonthKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const lastMonthKey = () => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Records a login event per Firebase uid into the company's login_activity
 * snapshot. Used by the burnout detector to measure login-frequency drops.
 */
export async function recordLoginActivity(companyId, uid) {
  if (!db || !companyId || !uid) return
  const ref = doc(db, 'companies', companyId, 'snapshots', 'login_activity')
  const monthKey = currentMonthKey()
  try {
    const snap = await getDoc(ref)
    const data = snap.exists() && snap.data().data ? snap.data().data : {}
    const month = data[monthKey] || {}
    await setDoc(
      ref,
      { data: { ...data, [monthKey]: { ...month, [uid]: (month[uid] || 0) + 1 } }, lastUpdated: new Date() },
      { merge: true }
    )
  } catch (e) {
    console.error('recordLoginActivity failed:', e)
  }
}
