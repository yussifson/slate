/**
 * OmniCore Business Profile Resolver (Phase 5)
 * 
 * Ties together Business Core, Capabilities, Context Packs, and Feature Flags
 * into a single unified Business Profile for a given company.
 * 
 * Purely read-only and composition-only.
 */
import { ContextPackRegistry } from '../context/ContextPackRegistry.js';
import { supabase } from '../../api/supabaseClient.js';

const DEFAULT_FEATURE_FLAGS = {
  slate_v2_enabled: false,
  omnicore_enabled: false
};

/**
 * Helper to fetch feature flags from platform_config table
 */
export async function fetchPlatformFeatureFlags() {
  try {
    if (!supabase || typeof supabase.from !== 'function') {
      return { ...DEFAULT_FEATURE_FLAGS };
    }
    const { data, error } = await supabase
      .from('platform_config')
      .select('key, value')
      .in('key', ['feature_flags', 'slate_v2_enabled', 'omnicore_enabled']);

    if (!error && data) {
      const fetched = { ...DEFAULT_FEATURE_FLAGS };
      data.forEach(item => {
        if (item.key === 'feature_flags' && typeof item.value === 'object' && item.value !== null) {
          Object.assign(fetched, item.value);
        } else if (item.key === 'slate_v2_enabled') {
          fetched.slate_v2_enabled = Boolean(item.value);
        } else if (item.key === 'omnicore_enabled') {
          fetched.omnicore_enabled = Boolean(item.value);
        }
      });
      return fetched;
    }
  } catch (err) {
    // Graceful fallback to default flags if offline or unconfigured
  }
  return { ...DEFAULT_FEATURE_FLAGS };
}

/**
 * Resolves a complete Business Profile synchronously from in-memory company data and flags.
 * 
 * @param {object} company - Company data object (e.g. from AuthContext or DB row)
 * @param {object} [options]
 * @param {object} [options.featureFlags] - Explicit feature flags map
 * @param {object} [options.capabilityOverrides] - Company or environment-level capability overrides
 * @returns {object} Full Business Profile
 */
export function resolveBusinessProfileSync(company, options = {}) {
  const companyData = company || {};
  const companyId = companyData.id || companyData.company_id || 'default_company';
  const companyName = companyData.name || companyData.company_name || 'Organization';

  // Read industry from existing company column (industry_type is standard across Slate)
  const rawIndustry = companyData.industry_type || companyData.industry || 'general';
  const normalizedIndustry = String(rawIndustry).toLowerCase().trim();

  // Check if an explicit starter/custom context pack is registered
  const isExplicitPack = ContextPackRegistry.has(normalizedIndustry);

  // Retrieve matching context pack or dynamic fallback pack
  const contextPack = ContextPackRegistry.getContextPack(normalizedIndustry);

  // Merge capability defaults with company-level or options overrides
  const companySettings = companyData.settings || {};
  const companyCapabilityOverrides = companySettings.omnicore_capabilities ||
                                    companyData.capabilities_override ||
                                    options.capabilityOverrides ||
                                    {};

  const resolvedCapabilities = {};
  const packCapabilities = contextPack.capabilities || {};

  // Standard capability keys
  const allCapabilityKeys = new Set([
    'CustomerManagement',
    'Sales',
    'Finance',
    ...Object.keys(packCapabilities),
    ...Object.keys(companyCapabilityOverrides)
  ]);

  for (const capKey of allCapabilityKeys) {
    const defaultCap = packCapabilities[capKey] || { enabled: true, mode: 'standard' };
    const overrideCap = companyCapabilityOverrides[capKey] || {};
    
    resolvedCapabilities[capKey] = {
      ...defaultCap,
      ...overrideCap,
      enabled: overrideCap.enabled !== undefined ? Boolean(overrideCap.enabled) : Boolean(defaultCap.enabled)
    };
  }

  // Active enabled capability names
  const enabledCapabilities = Object.keys(resolvedCapabilities).filter(
    k => resolvedCapabilities[k].enabled === true
  );

  // Feature flags
  const flags = options.featureFlags ? { ...DEFAULT_FEATURE_FLAGS, ...options.featureFlags } : { ...DEFAULT_FEATURE_FLAGS };
  const isV2Active = Boolean(flags.slate_v2_enabled && flags.omnicore_enabled);

  return {
    companyId,
    companyName,
    industry: normalizedIndustry,
    isExplicitPack,
    contextPack,
    terms: contextPack.terms,
    capabilities: resolvedCapabilities,
    enabledCapabilities,
    isCapabilityEnabled: (capName) => Boolean(resolvedCapabilities[capName]?.enabled),
    featureFlags: flags,
    isV2Active,
    dashboard: contextPack.dashboard,
    industrySpecific: contextPack.industrySpecific,
    metadata: {
      layer: 'BusinessConfiguration',
      version: '2.0.0-profile',
      resolvedAt: new Date().toISOString()
    }
  };
}

/**
 * Resolves a complete Business Profile asynchronously, fetching company row and feature flags from DB if needed.
 * 
 * @param {string|object} companyInput - Company ID string OR Company data object
 * @param {object} [options]
 * @param {object} [options.featureFlags] - Explicit feature flags (skips DB flag fetch if provided)
 * @param {object} [options.capabilityOverrides] - Capability overrides
 * @returns {Promise<object>} Full Business Profile
 */
export async function resolveBusinessProfile(companyInput, options = {}) {
  let companyData = null;

  if (typeof companyInput === 'object' && companyInput !== null) {
    companyData = companyInput;
  } else if (typeof companyInput === 'string' && companyInput) {
    try {
      if (supabase && typeof supabase.from === 'function') {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyInput)
          .maybeSingle();

        if (!error && data) {
          companyData = data;
        }
      }
    } catch (err) {
      // Graceful offline fallback
    }

    if (!companyData) {
      companyData = { id: companyInput, industry_type: 'general' };
    }
  } else {
    companyData = { id: 'default_company', industry_type: 'general' };
  }

  // Resolve feature flags from options or platform_config table
  const featureFlags = options.featureFlags || await fetchPlatformFeatureFlags();

  return resolveBusinessProfileSync(companyData, {
    ...options,
    featureFlags
  });
}

export const BusinessProfileResolver = {
  resolve: resolveBusinessProfile,
  resolveSync: resolveBusinessProfileSync,
  fetchFeatureFlags: fetchPlatformFeatureFlags
};

export default BusinessProfileResolver;
