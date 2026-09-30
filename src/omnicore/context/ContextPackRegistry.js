/**
 * OmniCore Context Pack Registry
 * 
 * Central registry for managing and retrieving industry context packs.
 */
import { RetailContextPack } from './RetailContextPack.js';
import { PharmacyContextPack } from './PharmacyContextPack.js';
import { LawFirmContextPack } from './LawFirmContextPack.js';
import { HotelContextPack } from './HotelContextPack.js';
import { createContextPack } from './createContextPack.js';

const registry = new Map();

// Register starter packs
registry.set('retail', RetailContextPack);
registry.set('pharmacy', PharmacyContextPack);
registry.set('law', LawFirmContextPack);
registry.set('hotel', HotelContextPack);

export const ContextPackRegistry = {
  /**
   * Retrieve a context pack for a given industry key.
   * If a custom pack is not registered, dynamically falls back to generating a default pack using industries.js.
   */
  getContextPack(industryKey) {
    if (!industryKey) return null;
    const normalizedKey = industryKey.toLowerCase();
    if (registry.has(normalizedKey)) {
      return registry.get(normalizedKey);
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
    return registry.has(industryKey.toLowerCase());
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
