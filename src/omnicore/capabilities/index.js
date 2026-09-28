import { CustomerManagement } from './CustomerManagement';
import { Sales } from './Sales';
import { Finance } from './Finance';

/**
 * OmniCore Business Capabilities Layer Module
 */
export const BusinessCapabilities = {
  initialized: true,
  layer: 'BusinessCapabilities',
  capabilities: {
    CustomerManagement,
    Sales,
    Finance
  }
};

export { CustomerManagement, Sales, Finance };
export default BusinessCapabilities;
