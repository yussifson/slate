// src/lib/clipadPricing.js

export const PLAN_LIMITS = {
  free: {
    maxParticipants: 10,
    maxVideoRecordingsPerMonth: 10,
    maxTeamSpaces: 5,
    maxAsyncVideoDurationSeconds: 15 * 60, // 15 minutes limit on free
    hasAdvancedAI: false,
    hasAdvancedAnalytics: false,
    hasSmartFollowUps: false,
    hasCustomIntegrations: false,
    hasSLA: false,
    hasBrandedRooms: false,
    hasComplianceRecording: false,
  },
  pro: {
    maxParticipants: 300,
    maxVideoRecordingsPerMonth: Infinity,
    maxTeamSpaces: Infinity,
    maxAsyncVideoDurationSeconds: 60 * 60, // 1 hour
    hasAdvancedAI: true,
    hasAdvancedAnalytics: true,
    hasSmartFollowUps: true,
    hasCustomIntegrations: false,
    hasSLA: false,
    hasBrandedRooms: false,
    hasComplianceRecording: false,
  },
  enterprise: {
    maxParticipants: Infinity,
    maxVideoRecordingsPerMonth: Infinity,
    maxTeamSpaces: Infinity,
    maxAsyncVideoDurationSeconds: Infinity,
    hasAdvancedAI: true,
    hasAdvancedAnalytics: true,
    hasSmartFollowUps: true,
    hasCustomIntegrations: true,
    hasSLA: true,
    hasBrandedRooms: true,
    hasComplianceRecording: true,
  }
};

/**
 * Returns the current plan for a user.
 * For now, this reads from user.user_metadata.clipad_plan or defaults to 'free'
 */
export function getUserPlan(user) {
  return user?.user_metadata?.clipad_plan || 'free'; // 'free', 'pro', 'enterprise'
}

export function getPlanLimits(user) {
  const plan = getUserPlan(user);
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function hasFeature(user, featureKey) {
  const limits = getPlanLimits(user);
  return limits[featureKey] === true;
}

export function getLimit(user, limitKey) {
  const limits = getPlanLimits(user);
  return limits[limitKey];
}
