'use strict';

/**
 * Kormiis Cloud Functions — rule-based HR automation.
 *
 * No external AI. All logic is plain JavaScript over Firestore.
 *
 * Scheduled jobs:
 *   - scheduledBurnoutAnalysis       (1st of each month, Asia/Dhaka)
 *   - scheduledComplianceCheck       (nightly, Asia/Dhaka)
 *   - scheduledPerformanceCalculation(1st of each month, Asia/Dhaka)
 *
 * Deploy: firebase deploy --only functions
 */

const { admin } = require('./common');

admin.initializeApp();

const burnout = require('./burnout');
const gigs = require('./gigs');
const compliance = require('./compliance');
const lifeEvents = require('./lifeEvents');
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

  // Feature 3
  scheduledComplianceCheck: compliance.scheduledComplianceCheck,
  complianceLeaveTrigger: compliance.complianceLeaveTrigger,
  getComplianceAlerts: compliance.getComplianceAlerts,
  resolveAlert: compliance.resolveAlert,
  getComplianceRules: compliance.getComplianceRules,
  updateComplianceRule: compliance.updateComplianceRule,
  addFestivalDate: compliance.addFestivalDate,
  removeFestivalDate: compliance.removeFestivalDate,

  // Feature 4
  leaveLifeEventTrigger: lifeEvents.leaveLifeEventTrigger,
  profileLifeEventTrigger: lifeEvents.profileLifeEventTrigger,
  getLifeEvents: lifeEvents.getLifeEvents,
  getMyLifeEvents: lifeEvents.getMyLifeEvents,
  completeLifeEventTask: lifeEvents.completeLifeEventTask,

  // Feature 5
  scheduledPerformanceCalculation: performance.scheduledPerformanceCalculation,
  calculateMonthlyPerformance: performance.calculateMonthlyPerformance,
  getPerformanceScores: performance.getPerformanceScores,
  getMyScore: performance.getMyScore,
  getPerformanceTrends: performance.getPerformanceTrends,
};
