/**
 * OmniCore Business Automation Layer (Phase 9)
 */
import { AutomationEngine, logAutomationAuditRecord, isAutomationEnabled } from './AutomationEngine.js';
import { OverdueInvoiceRule } from './rules/OverdueInvoiceRule.js';

export {
  AutomationEngine,
  OverdueInvoiceRule,
  logAutomationAuditRecord,
  isAutomationEnabled
};

export const BusinessAutomation = {
  layer: 'BusinessAutomation',
  version: '2.0.0-automation',
  Engine: AutomationEngine,
  rules: [OverdueInvoiceRule],
  evaluateRules: (companyId, options) => AutomationEngine.evaluateRules(companyId, options),
  executeRules: (companyId, options) => AutomationEngine.executeRules(companyId, options),
  isAutomationEnabled: (companyId, options) => isAutomationEnabled(companyId, options)
};

export default BusinessAutomation;
