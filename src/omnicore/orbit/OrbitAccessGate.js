/**
 * OmniCore Orbit Access Gate (Phase 10)
 * 
 * Enforces role-based read permissions for Orbit AI Assistant queries
 * by strictly evaluating the existing `src/lib/rbac.js` read matrix.
 * 
 * Fails closed (deny) on unknown roles or unmapped categories.
 */
import { hasPermission } from '../../lib/rbac.js';

export const CATEGORY_MODULE_MAP = {
  customers: 'clients',
  sales: 'sales',
  finance: 'finance',
  business_profile: 'settings',
  business_health: 'business_health',
  action_center: 'action_center',
  intelligence: 'intelligence',
  automation: 'settings'
};

export const OrbitAccessGate = {
  layer: 'OrbitAccessGate',
  version: '2.0.0-gate',

  /**
   * Evaluate whether a user role has read permission for an Orbit category.
   *
   * @param {string} role - User role identifier (e.g. 'company_admin', 'lawyer', 'user', 'guest')
   * @param {string} category - Target Orbit category (e.g. 'customers', 'sales', 'finance', 'business_profile')
   * @returns {{ authorized: boolean, reason?: string, category: string, module: string|null }}
   */
  canRead(role, category) {
    if (!role || typeof role !== 'string') {
      return {
        authorized: false,
        reason: 'Access denied: Missing or invalid role identifier.',
        category: category || null,
        module: null
      };
    }

    if (!category || typeof category !== 'string') {
      return {
        authorized: false,
        reason: 'Access denied: Missing or invalid target category.',
        category: null,
        module: null
      };
    }

    const normalizedCategory = category.toLowerCase().trim();
    const mappedModule = CATEGORY_MODULE_MAP[normalizedCategory];

    // Fail closed if category is not explicitly mapped
    if (!mappedModule) {
      return {
        authorized: false,
        reason: `Access denied: Unmapped category '${category}'. Failing closed.`,
        category: normalizedCategory,
        module: null
      };
    }

    // Check existing rbac.js permission matrix for 'read' action
    const isPermitted = hasPermission(role, mappedModule, 'read');

    if (!isPermitted) {
      return {
        authorized: false,
        reason: `Access denied: Role '${role}' does not have read permissions for '${mappedModule}' (${normalizedCategory}).`,
        category: normalizedCategory,
        module: mappedModule
      };
    }

    return {
      authorized: true,
      category: normalizedCategory,
      module: mappedModule
    };
  }
};

export default OrbitAccessGate;
