/**
 * OmniCore Orbit Bridge (Phase 10)
 * 
 * Secure, role-gated read bridge exposing OmniCore business layers to Orbit AI Assistant.
 * 
 * Safety invariants:
 * 1. Every read operation evaluates `OrbitAccessGate` prior to calling any underlying capability.
 * 2. On authorization failure, returns a safe denial response without executing the capability.
 * 3. Pure read / dry-run bridge — does NOT import or expose any write/execution methods.
 */
import { OrbitAccessGate } from './OrbitAccessGate.js';
import { BusinessProfileResolver } from '../config/BusinessProfileResolver.js';
import { Sales } from '../capabilities/Sales.js';
import { Finance } from '../capabilities/Finance.js';
import { CustomerManagement } from '../capabilities/CustomerManagement.js';
import { BusinessIntelligence } from '../intelligence/BusinessIntelligence.js';
import { BusinessHealth } from '../intelligence/BusinessHealth.js';
import { ActionCenter } from '../intelligence/ActionCenter.js';
import { AutomationEngine } from '../automation/AutomationEngine.js';

export const OrbitBridge = {
  layer: 'OrbitBridge',
  version: '2.0.0-bridge',

  /**
   * Get Business Profile (Industry, Context Pack, Capabilities, Feature Flags).
   * Gated under category: 'business_profile' (mapped to module: 'settings').
   */
  async getBusinessProfile(companyId, role, options = {}) {
    const gate = OrbitAccessGate.canRead(role, 'business_profile');
    if (!gate.authorized) {
      return {
        authorized: false,
        error: gate.reason,
        category: 'business_profile',
        data: null
      };
    }

    const data = await BusinessProfileResolver.resolve(companyId, options);
    return {
      authorized: true,
      category: 'business_profile',
      data
    };
  },

  /**
   * Get Sales Overview (Total revenue, transactions feed, top customers).
   * Gated under category: 'sales' (mapped to module: 'billing').
   */
  async getSalesOverview(companyId, role, options = {}) {
    const gate = OrbitAccessGate.canRead(role, 'sales');
    if (!gate.authorized) {
      return {
        authorized: false,
        error: gate.reason,
        category: 'sales',
        data: null
      };
    }

    const data = await Sales.getSalesOverview(companyId, options);
    return {
      authorized: true,
      category: 'sales',
      data
    };
  },

  /**
   * Get Financial Summary (Revenue vs expenses, outstanding receivables, cash flow).
   * Gated under category: 'finance' (mapped to module: 'billing').
   */
  async getFinancialSummary(companyId, role, options = {}) {
    const gate = OrbitAccessGate.canRead(role, 'finance');
    if (!gate.authorized) {
      return {
        authorized: false,
        error: gate.reason,
        category: 'finance',
        data: null
      };
    }

    const data = await Finance.getFinancialSummary(companyId, options);
    return {
      authorized: true,
      category: 'finance',
      data
    };
  },

  /**
   * Get Customer Profile (Customer details, open tasks, associated invoices).
   * Gated under category: 'customers' (mapped to module: 'clients').
   */
  async getCustomerProfile(companyId, role, customerId) {
    const gate = OrbitAccessGate.canRead(role, 'customers');
    if (!gate.authorized) {
      return {
        authorized: false,
        error: gate.reason,
        category: 'customers',
        data: null
      };
    }

    const data = await CustomerManagement.getCustomerProfile(companyId, customerId);
    return {
      authorized: true,
      category: 'customers',
      data
    };
  },

  /**
   * Get Business Health Indicators (Per-dimension health status & traceable reasons).
   * Gated under category: 'business_health' (mapped to module: 'billing').
   */
  async getBusinessHealth(companyId, role, options = {}) {
    const gate = OrbitAccessGate.canRead(role, 'business_health');
    if (!gate.authorized) {
      return {
        authorized: false,
        error: gate.reason,
        category: 'business_health',
        data: null
      };
    }

    const data = await BusinessHealth.evaluateHealth(companyId, options);
    return {
      authorized: true,
      category: 'business_health',
      data
    };
  },

  /**
   * Get Action Center Feed (Itemized overdue invoices, inactive accounts, health alerts).
   * Gated under category: 'action_center' (mapped to module: 'billing').
   */
  async getActionCenterFeed(companyId, role, options = {}) {
    const gate = OrbitAccessGate.canRead(role, 'action_center');
    if (!gate.authorized) {
      return {
        authorized: false,
        error: gate.reason,
        category: 'action_center',
        data: null
      };
    }

    const data = await ActionCenter.getActionCenterFeed(companyId, options);
    return {
      authorized: true,
      category: 'action_center',
      data
    };
  },

  /**
   * Get Unified Business Intelligence Insights (Revenue trend, receivables trend, customer activity).
   * Gated under category: 'intelligence' (mapped to module: 'billing').
   */
  async getIntelligenceInsights(companyId, role, options = {}) {
    const gate = OrbitAccessGate.canRead(role, 'intelligence');
    if (!gate.authorized) {
      return {
        authorized: false,
        error: gate.reason,
        category: 'intelligence',
        data: null
      };
    }

    const data = await BusinessIntelligence.getUnifiedInsights(companyId, options);
    return {
      authorized: true,
      category: 'intelligence',
      data
    };
  },

  /**
   * Evaluate Automation Rules (DRY-RUN only, reports what would trigger without executing).
   * Gated under category: 'automation' (mapped to module: 'settings').
   */
  async evaluateAutomationRules(companyId, role, options = {}) {
    const gate = OrbitAccessGate.canRead(role, 'automation');
    if (!gate.authorized) {
      return {
        authorized: false,
        error: gate.reason,
        category: 'automation',
        data: null
      };
    }

    const data = await AutomationEngine.evaluateRules(companyId, options);
    return {
      authorized: true,
      category: 'automation',
      data
    };
  }
};

export default OrbitBridge;
