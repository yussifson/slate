/**
 * OmniCore Context Pack Registry (Phase 7 & Phase C)
 * 
 * Central registry for managing and retrieving industry context packs.
 */
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
import { createContextPack } from './createContextPack.js';

const registry = new Map();

// Register all 10 core vertical context packs
registry.set('retail', RetailContextPack);
registry.set('pharmacy', PharmacyContextPack);
registry.set('law', LawFirmContextPack);
registry.set('hotel', HotelContextPack);
registry.set('real_estate', RealEstateContextPack);
registry.set('hospital', HospitalContextPack);
registry.set('university', UniversityContextPack);
registry.set('logistics', LogisticsContextPack);
registry.set('insurance', InsuranceContextPack);
registry.set('religion', ReligiousOrgContextPack);

// Alias mapping for sub-industries / variants
const ALIASES = {
  'real_estate_jcl': 'real_estate',
  'school': 'university',
  'highschool': 'university',
  'vocational': 'university',
  'online': 'university'
};

export const ContextPackRegistry = {
  /**
   * Retrieve a context pack for a given industry key.
   * If a custom pack is not registered, dynamically falls back to generating a default pack using industries.js.
   */
  getContextPack(industryKey) {
    if (!industryKey) return null;
    const normalizedKey = industryKey.toLowerCase();
    const resolvedKey = ALIASES[normalizedKey] || normalizedKey;

    if (registry.has(resolvedKey)) {
      return registry.get(resolvedKey);
    }
    // Dynamic fallback generation for any industry key in industries.js
    return createContextPack({ industryKey: normalizedKey });
  },

  /**
   * Register a custom or extension context pack
   */
  register(pack) {
    if (!pack || !pack.industryKey) {
      throw new Error('ContextPackRegistry.register: pack must have an industryKey');
    }
    registry.set(pack.industryKey.toLowerCase(), pack);
    return pack;
  },

  /**
   * Check if an explicit context pack is registered
   */
  has(industryKey) {
    if (!industryKey) return false;
    const normalized = industryKey.toLowerCase();
    const resolved = ALIASES[normalized] || normalized;
    return registry.has(resolved);
  },

  /**
   * List all registered context pack keys
   */
  list() {
    return Array.from(registry.keys());
  },

  /**
   * Get all registered context pack instances
   */
  getAll() {
    return Array.from(registry.values());
  }
};

export default ContextPackRegistry;
