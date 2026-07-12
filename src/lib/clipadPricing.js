// src/lib/clipadPricing.js

export const PLAN_LIMITS = {
  free: {
    maxParticipants: 10,
    maxVideoRecordingsPerMonth: 10,
    maxStorageGB: 2,
    maxStorageGB: 2,
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
    maxStorageGB: 15,
    maxStorageGB: 15,
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
    maxStorageGB: Infinity,
    maxStorageGB: 15,
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
 * Reads user.clipad_plan which is injected in AuthContext.
 */
export function getUserPlan(user) {
  if (!user) return 'free';
  if (typeof user === 'string') return user;
  return user?.clipad_plan || 'free';
}

/**
 * Async function: fetches the real plan for a company from the DB.
 * Checks company_subscriptions first, then falls back to pricing_tag.
 * Returns 'free' | 'pro' | 'enterprise'
 */
export async function getCompanyPlan(supabase, companyId) {
  if (!companyId) return 'free';
  try {
    // 1. Try company_subscriptions (payments + admin sync)
    const { data: subData } = await supabase
      .from('company_subscriptions')
      .select('plan_id, status')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .maybeSingle();

    if (subData?.plan_id && subData.plan_id !== 'free') return subData.plan_id;

    // 2. Fallback to pricing_tag on companies table
    const { data: companyData } = await supabase
      .from('companies')
      .select('pricing_tag_id, clipad_pricing_tags(name)')
      .eq('id', companyId)
      .maybeSingle();

    if (companyData?.clipad_pricing_tags?.name) {
      const tagName = companyData.clipad_pricing_tags.name.toLowerCase();
      if (tagName.includes('enterprise')) return 'enterprise';
      if (tagName.includes('pro')) return 'pro';
    }

    return subData?.plan_id || 'free';
  } catch {
    return 'free';
  }
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
