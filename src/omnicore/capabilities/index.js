import { CustomerManagement } from './CustomerManagement';
import { Sales } from './Sales';
import { Finance } from './Finance';
import { Inventory } from './Inventory';
import { HR } from './HR';
import { Purchasing } from './Purchasing';
import { Documents } from './Documents';
import { Scheduling } from './Scheduling';
import { Analytics } from './Analytics';

/**
 * OmniCore Business Capabilities Layer Module
 */
export const BusinessCapabilities = {
  initialized: true,
  layer: 'BusinessCapabilities',
  capabilities: {
    CustomerManagement,
    Sales,
    Finance,
    Inventory,
    HR,
    Purchasing,
    Documents,
    Scheduling,
    Analytics
  }
};

export {
  CustomerManagement,
  Sales,
  Finance,
  Inventory,
  HR,
  Purchasing,
  Documents,
  Scheduling,
  Analytics
};
export default BusinessCapabilities;
