/**
 * OmniCore Business Intelligence, Health & Action Center Layer (Phases 6–8)
 */
import { BusinessIntelligence } from './BusinessIntelligence.js';
import { BusinessHealth } from './BusinessHealth.js';
import { ActionCenter } from './ActionCenter.js';

BusinessIntelligence.evaluateHealth = (companyId, options) => BusinessHealth.evaluateHealth(companyId, options);
BusinessIntelligence.Health = BusinessHealth;
BusinessIntelligence.ActionCenter = ActionCenter;

export {
  BusinessIntelligence,
  BusinessHealth,
  ActionCenter
};

export const BusinessIntelligenceLayer = BusinessIntelligence;
export default BusinessIntelligence;
