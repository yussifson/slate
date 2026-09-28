/**
 * OmniCore Architecture V2 Namespace Index
 * Inert, flag-gated entry point for Slate V2 structural layers.
 */
import { BusinessCore } from './core';
import { BusinessCapabilities } from './capabilities';
import { BusinessContext } from './context';
import { BusinessIntelligence } from './intelligence';
import { OrbitV2Extension } from './orbit';

export const OmniCoreV2 = {
  BusinessCore,
  BusinessCapabilities,
  BusinessContext,
  BusinessIntelligence,
  OrbitV2Extension,
  version: '2.0.0-scaffold'
};

export default OmniCoreV2;
