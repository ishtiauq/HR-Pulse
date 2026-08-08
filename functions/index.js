'use strict';

/**
 * Kormiis Cloud Functions — rule-based HR automation.
 *
 * No external AI. All logic is plain JavaScript over Firestore.
 *
 * Scheduled jobs:
 *   - scheduledBurnoutAnalysis       (1st of each month, Asia/Dhaka)
 *   - scheduledPerformanceCalculation(1st of each month, Asia/Dhaka)
 *
 * Deploy: firebase deploy --only functions
 */

const { admin } = require('./common');
const { setGlobalOptions } = require('firebase-functions/v2');

// The frontend (src/services/hr.js) creates its callable client with this
// region. Without setting it here the SDK would default to us-central1 and
// every call from the app would 404.
setGlobalOptions({ region: 'asia-south1' });

admin.initializeApp();

const burnout = require('./burnout');
const gigs = require('./gigs');
const performance = require('./performance');

module.exports = {
  // Feature 1
  scheduledBurnoutAnalysis: burnout.scheduledBurnoutAnalysis,
  getBurnoutRisks: burnout.getBurnoutRisks,
  acknowledgeRiskAlert: burnout.acknowledgeRiskAlert,
  runBurnoutAnalysisNow: burnout.runBurnoutAnalysisNow,

  // Feature 2
  createGig: gigs.createGig,
  getOpenGigs: gigs.getOpenGigs,
  applyForGig: gigs.applyForGig,
  assignGig: gigs.assignGig,
  completeGig: gigs.completeGig,
  getMySkills: gigs.getMySkills,
  addSkill: gigs.addSkill,
  removeSkill: gigs.removeSkill,

  // Feature 5
  scheduledPerformanceCalculation: performance.scheduledPerformanceCalculation,
  calculateMonthlyPerformance: performance.calculateMonthlyPerformance,
  getPerformanceScores: performance.getPerformanceScores,
  getMyScore: performance.getMyScore,
  getPerformanceTrends: performance.getPerformanceTrends,
};
