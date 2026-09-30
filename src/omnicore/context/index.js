/**
 * OmniCore Business Context Layer (Phase 4 & Phase C)
 * 
 * Provides industry-specific context packs combining terminology,
 * capability relevance, and domain-specific metadata.
 */
import { createContextPack } from './createContextPack.js';
import { RetailContextPack } from './RetailContextPack.js';
import { PharmacyContextPack } from './PharmacyContextPack.js';
import { LawFirmContextPack } from './LawFirmContextPack.js';
import { HotelContextPack } from './HotelContextPack.js';
import { RealEstateContextPack } from './RealEstateContextPack.js';
import { HospitalContextPack } from './HospitalContextPack.js';
import { UniversityContextPack } from './UniversityContextPack.js';
import { LogisticsContextPack } from './LogisticsContextPack.js';
import { InsuranceContextPack } from './InsuranceContextPack.js';
import { ReligiousOrgContextPack } from './ReligiousOrgContextPack.js';
import { ContextPackRegistry } from './ContextPackRegistry.js';

export {
  createContextPack,
  RetailContextPack,
  PharmacyContextPack,
  LawFirmContextPack,
  HotelContextPack,
  RealEstateContextPack,
  HospitalContextPack,
  UniversityContextPack,
  LogisticsContextPack,
  InsuranceContextPack,
  ReligiousOrgContextPack,
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
    hotel: HotelContextPack,
    real_estate: RealEstateContextPack,
    hospital: HospitalContextPack,
    university: UniversityContextPack,
    logistics: LogisticsContextPack,
    insurance: InsuranceContextPack,
    religion: ReligiousOrgContextPack
  },
  registry: ContextPackRegistry
};

export default BusinessContext;
