/**
 * OmniCore Business Automation Layer (Phase 9 & Phase B)
 */
import { AutomationEngine, logAutomationAuditRecord, isAutomationEnabled } from './AutomationEngine.js';
import { AutomationScheduler } from './AutomationScheduler.js';
import { OverdueInvoiceRule } from './rules/OverdueInvoiceRule.js';
import { LowStockAlertRule } from './rules/LowStockAlertRule.js';
import { CustomerOnboardingRule } from './rules/CustomerOnboardingRule.js';

export {
  AutomationEngine,
  AutomationScheduler,
  OverdueInvoiceRule,
  LowStockAlertRule,
  CustomerOnboardingRule,
  logAutomationAuditRecord,
  isAutomationEnabled
};

export const BusinessAutomation = {
  layer: 'BusinessAutomation',
  version: '2.0.0-automation',
  Engine: AutomationEngine,
  Scheduler: AutomationScheduler,
  rules: [
    OverdueInvoiceRule,
    LowStockAlertRule,
    CustomerOnboardingRule
  ],
  evaluateRules: (companyId, options) => AutomationEngine.evaluateRules(companyId, options),
  executeRules: (companyId, options) => AutomationEngine.executeRules(companyId, options),
  runScheduledAutomation: (companyId, options) => AutomationScheduler.runScheduledAutomation(companyId, options),
  isAutomationEnabled: (companyId, options) => isAutomationEnabled(companyId, options)
};

export default BusinessAutomation;
