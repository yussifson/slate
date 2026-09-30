/**
 * OmniCore Business Context Layer (Phase 4)
 * 
 * Provides industry-specific context packs combining terminology,
 * capability relevance, and domain-specific metadata.
 */
import { createContextPack } from './createContextPack.js';
import { RetailContextPack } from './RetailContextPack.js';
import { PharmacyContextPack } from './PharmacyContextPack.js';
import { LawFirmContextPack } from './LawFirmContextPack.js';
import { HotelContextPack } from './HotelContextPack.js';
import { ContextPackRegistry } from './ContextPackRegistry.js';

export {
  createContextPack,
  RetailContextPack,
  PharmacyContextPack,
  LawFirmContextPack,
  HotelContextPack,
  ContextPackRegistry
};

export const BusinessContext = {
  initialized: true,
  layer: 'BusinessContext',
  version: '2.0.0-context',
  createContextPack,
  getContextPack: (key) => ContextPackRegistry.getContextPack(key),
  registerContextPack: (pack) => ContextPackRegistry.register(pack),
  listAvailablePacks: () => ContextPackRegistry.list(),
  packs: {
    retail: RetailContextPack,
    pharmacy: PharmacyContextPack,
    law: LawFirmContextPack,
    hotel: HotelContextPack
  },
  registry: ContextPackRegistry
};

export default BusinessContext;
