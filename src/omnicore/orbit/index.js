/**
 * OmniCore Orbit Extension Layer (Phase 10)
 */
import { OrbitAccessGate, CATEGORY_MODULE_MAP } from './OrbitAccessGate.js';
import { OrbitBridge } from './OrbitBridge.js';
import { OrbitPilotGate, fetchPilotConfig, isPilotCompanyActive, isPilotCompanyActiveSync } from './OrbitPilotGate.js';

export {
  OrbitAccessGate,
  OrbitBridge,
  OrbitPilotGate,
  CATEGORY_MODULE_MAP,
  fetchPilotConfig,
  isPilotCompanyActive,
  isPilotCompanyActiveSync
};

export const OrbitV2Extension = {
  layer: 'OrbitV2Extension',
  version: '2.0.0-orbit',
  Bridge: OrbitBridge,
  AccessGate: OrbitAccessGate,
  PilotGate: OrbitPilotGate,
  canRead: (role, category) => OrbitAccessGate.canRead(role, category),
  isPilotCompanyActive,
  executeQuery: (companyId, role, query, options) => OrbitPilotGate.executeQuery(companyId, role, query, options),
  getBusinessProfile: (companyId, role, options) => OrbitBridge.getBusinessProfile(companyId, role, options),
  getSalesOverview: (companyId, role, options) => OrbitBridge.getSalesOverview(companyId, role, options),
  getFinancialSummary: (companyId, role, options) => OrbitBridge.getFinancialSummary(companyId, role, options),
  getCustomerProfile: (companyId, role, customerId) => OrbitBridge.getCustomerProfile(companyId, role, customerId),
  getBusinessHealth: (companyId, role, options) => OrbitBridge.getBusinessHealth(companyId, role, options),
  getActionCenterFeed: (companyId, role, options) => OrbitBridge.getActionCenterFeed(companyId, role, options),
  getIntelligenceInsights: (companyId, role, options) => OrbitBridge.getIntelligenceInsights(companyId, role, options),
  evaluateAutomationRules: (companyId, role, options) => OrbitBridge.evaluateAutomationRules(companyId, role, options)
};

export default OrbitV2Extension;
