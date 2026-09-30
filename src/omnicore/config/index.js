/**
 * OmniCore Business Configuration Layer (Phase 5)
 */
import {
  BusinessProfileResolver,
  resolveBusinessProfile,
  resolveBusinessProfileSync,
  fetchPlatformFeatureFlags
} from './BusinessProfileResolver.js';

export {
  BusinessProfileResolver,
  resolveBusinessProfile,
  resolveBusinessProfileSync,
  fetchPlatformFeatureFlags
};

export const BusinessConfiguration = {
  layer: 'BusinessConfiguration',
  version: '2.0.0-config',
  Resolver: BusinessProfileResolver,
  resolve: resolveBusinessProfile,
  resolveSync: resolveBusinessProfileSync,
  fetchFeatureFlags: fetchPlatformFeatureFlags
};

export default BusinessConfiguration;
