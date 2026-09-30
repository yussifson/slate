/**
 * OmniCore Orbit Pilot Gate
 * 
 * Manages the pilot allowlist and gates Orbit AI Assistant access to OmniCore read functions.
 * 
 * Enforces:
 * 1. Global feature flags (omnicore_enabled, slate_v2_enabled).
 * 2. Strict company_id allowlist verification against platform_config.
 * 3. Read-only methods (getBusinessProfile, getSalesOverview, getFinancialSummary,
 *    getCustomerProfile, getBusinessHealth, getActionCenterFeed, getIntelligenceInsights).
 * 4. Zero exposure to Automation execution or write paths.
 */
import { supabase } from '../../api/supabaseClient';
import { OrbitBridge } from './OrbitBridge';
import { fetchPlatformFeatureFlags } from '../config/BusinessProfileResolver';

const DEFAULT_PILOT_CONFIG = {
  omnicore_enabled: false,
  slate_v2_enabled: false,
  pilot_companies: []
};

/**
 * Fetch pilot configuration from platform_config table.
 */
export async function fetchPilotConfig() {
  try {
    if (!supabase || typeof supabase.from !== 'function') {
      return { ...DEFAULT_PILOT_CONFIG };
    }

    const { data, error } = await supabase
      .from('platform_config')
      .select('key, value')
      .in('key', ['omnicore_enabled', 'slate_v2_enabled', 'omnicore_pilot_companies', 'feature_flags']);

    if (!error && data) {
      const config = { ...DEFAULT_PILOT_CONFIG };
      data.forEach(item => {
        if (item.key === 'feature_flags' && typeof item.value === 'object' && item.value !== null) {
          if (item.value.omnicore_enabled !== undefined) config.omnicore_enabled = Boolean(item.value.omnicore_enabled);
          if (item.value.slate_v2_enabled !== undefined) config.slate_v2_enabled = Boolean(item.value.slate_v2_enabled);
          if (Array.isArray(item.value.pilot_companies)) config.pilot_companies = item.value.pilot_companies;
          if (Array.isArray(item.value.omnicore_pilot_companies)) config.pilot_companies = item.value.omnicore_pilot_companies;
        } else if (item.key === 'omnicore_enabled') {
          config.omnicore_enabled = Boolean(item.value);
        } else if (item.key === 'slate_v2_enabled') {
          config.slate_v2_enabled = Boolean(item.value);
        } else if (item.key === 'omnicore_pilot_companies') {
          if (Array.isArray(item.value)) {
            config.pilot_companies = item.value;
          } else if (typeof item.value === 'string') {
            try {
              const parsed = JSON.parse(item.value);
              if (Array.isArray(parsed)) config.pilot_companies = parsed;
              else config.pilot_companies = [item.value];
            } catch (e) {
              config.pilot_companies = [item.value];
            }
          }
        }
      });
      return config;
    }
  } catch (err) {
    // Graceful offline fallback
  }

  return { ...DEFAULT_PILOT_CONFIG };
}

/**
 * Verify whether a company is authorized for the OmniCore Orbit pilot.
 * 
 * @param {string} companyId - Target tenant company identifier
 * @param {object} [options] - Optional overrides for testing/configuration
 * @returns {Promise<boolean>} True if enabled, false otherwise
 */
export async function isPilotCompanyActive(companyId, options = {}) {
  if (!companyId || typeof companyId !== 'string') return false;

  const config = options.pilotConfig || await fetchPilotConfig();

  const isEnabledGlobally = Boolean(config.omnicore_enabled && config.slate_v2_enabled);
  if (!isEnabledGlobally) return false;

  const allowedCompanies = Array.isArray(config.pilot_companies) ? config.pilot_companies : [];
  const normalizedTarget = companyId.trim().toLowerCase();

  return allowedCompanies.some(id => String(id).trim().toLowerCase() === normalizedTarget);
}

/**
 * Synchronous pilot check when configuration has already been preloaded into memory/context.
 */
export function isPilotCompanyActiveSync(companyId, pilotConfig = {}) {
  if (!companyId || typeof companyId !== 'string') return false;

  const isEnabledGlobally = Boolean(pilotConfig.omnicore_enabled && pilotConfig.slate_v2_enabled);
  if (!isEnabledGlobally) return false;

  const allowedCompanies = Array.isArray(pilotConfig.pilot_companies) ? pilotConfig.pilot_companies : [];
  const normalizedTarget = companyId.trim().toLowerCase();

  return allowedCompanies.some(id => String(id).trim().toLowerCase() === normalizedTarget);
}

/**
 * Secure pilot dispatcher for Orbit AI Assistant.
 * Routes read queries to OrbitBridge only if the company is in the pilot allowlist.
 */
export const OrbitPilotGate = {
  fetchPilotConfig,
  isPilotCompanyActive,
  isPilotCompanyActiveSync,

  /**
   * Execute an Orbit read query against OmniCore layers.
   * 
   * @param {string} companyId - Tenant company identifier
   * @param {string} role - User role string (e.g. 'company_admin', 'lawyer', 'user', 'guest')
   * @param {object} query - Query parameters { category: string, options?: object, customerId?: string }
   * @param {object} [gateOptions] - Optional gate options/overrides
   * @returns {Promise<{ authorized: boolean, data?: any, error?: string, category?: string }>}
   */
  async executeQuery(companyId, role, query = {}, gateOptions = {}) {
    if (!companyId || !role) {
      return {
        authorized: false,
        error: 'Missing companyId or user role for Orbit query.',
        data: null
      };
    }

    // 1. Verify pilot allowlist
    const isPilot = await isPilotCompanyActive(companyId, gateOptions);
    if (!isPilot) {
      return {
        authorized: false,
        error: 'OmniCore Orbit features are not enabled for this company.',
        data: null
      };
    }

    const category = (query.category || '').toLowerCase().trim();
    const options = query.options || {};

    // 2. Dispatch to read-only OrbitBridge methods
    switch (category) {
      case 'sales':
        return OrbitBridge.getSalesOverview(companyId, role, options);

      case 'finance':
        return OrbitBridge.getFinancialSummary(companyId, role, options);

      case 'customers':
      case 'clients':
        return OrbitBridge.getCustomerProfile(companyId, role, query.customerId || options.customerId);

      case 'business_health':
      case 'health':
        return OrbitBridge.getBusinessHealth(companyId, role, options);

      case 'action_center':
      case 'actions':
        return OrbitBridge.getActionCenterFeed(companyId, role, options);

      case 'intelligence':
      case 'insights':
        return OrbitBridge.getIntelligenceInsights(companyId, role, options);

      case 'business_profile':
      case 'profile':
      case 'settings':
        return OrbitBridge.getBusinessProfile(companyId, role, options);

      default:
        return {
          authorized: false,
          error: `Unrecognized or disallowed Orbit category: '${category}'. Allowed read categories: sales, finance, customers, business_health, action_center, intelligence, business_profile.`,
          data: null
        };
    }
  }
};

export default OrbitPilotGate;
