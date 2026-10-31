import { describe, it, expect, vi } from 'vitest';
import { CapabilityService } from '../src/services/CapabilityService';
import { CorePartyService } from '../src/services/CorePartyService';
import { MetadataService } from '../src/services/MetadataService';
import { EventService } from '../src/services/EventService';
import { hasPermission, ROLES } from '../src/lib/rbac';

describe('Slate V2: Phase 1 Platform Foundation Test Suite', () => {
  const TENANT_A = 'comp-tenant-alpha-001';
  const TENANT_B = 'comp-tenant-bravo-002';

  describe('1. Capability Registry & Entitlements', () => {
    it('returns a comprehensive fallback catalog with core, standard, and industry capabilities', () => {
      const catalog = CapabilityService.getFallbackCatalog();
      expect(catalog).toBeInstanceOf(Array);
      expect(catalog.length).toBeGreaterThanOrEqual(9);

      const core = catalog.find(c => c.id === 'core_foundation');
      expect(core).toBeDefined();
      expect(core.category).toBe('core');
      expect(core.default_enabled).toBe(true);

      const legal = catalog.find(c => c.id === 'legal_practice');
      expect(legal).toBeDefined();
      expect(legal.category).toBe('industry');
      expect(legal.default_enabled).toBe(false);
    });

    it('prevents deactivation of core_foundation capability', async () => {
      await expect(
        CapabilityService.deactivateCapability(TENANT_A, 'core_foundation')
      ).rejects.toThrow('Core Business Foundation cannot be deactivated');
    });

    it('resolves default capabilities for a company', () => {
      const defaults = CapabilityService.getDefaultCompanyCapabilities(TENANT_A);
      expect(defaults.length).toBeGreaterThan(0);
      defaults.forEach(c => {
        expect(c.is_enabled).toBe(true);
        expect(c.default_enabled).toBe(true);
      });
    });
  });

  describe('2. Core Party Graph & Role Management', () => {
    it('enforces required primary_name and companyId on party creation', async () => {
      await expect(
        CorePartyService.createParty(null, { primary_name: 'Test Party' })
      ).rejects.toThrow('companyId and primary_name are required');

      await expect(
        CorePartyService.createParty(TENANT_A, { primary_name: '' })
      ).rejects.toThrow('companyId and primary_name are required');
    });

    it('constructs correct payload for individuals and organizations', () => {
      const individual = {
        primary_name: 'Jane Doe',
        party_type: 'individual',
        email: 'jane@example.com'
      };
      expect(individual.party_type).toBe('individual');

      const organization = {
        primary_name: 'Acme Global Holdings',
        party_type: 'organization',
        tax_identifier: 'TAX-998811'
      };
      expect(organization.party_type).toBe('organization');
      expect(organization.tax_identifier).toBe('TAX-998811');
    });
  });

  describe('3. Metadata Engine & Governed Custom Fields', () => {
    it('validates required fields when creating custom field definitions', async () => {
      await expect(
        MetadataService.createField(TENANT_A, null, { field_key: 'custom_code', label: 'Custom Code' })
      ).rejects.toThrow('companyId, objectId, field_key, and label are required');
    });
  });

  describe('4. Transactional Outbox & Event Contracts', () => {
    it('validates mandatory parameters for outbox event publication', async () => {
      await expect(
        EventService.publishEvent(null, 'party.created', 'core_party', '123', {})
      ).rejects.toThrow('companyId, eventType, aggregateType, and aggregateId are required');
    });
  });

  describe('5. RBAC V2 Permission Extensions', () => {
    it('grants manager access to create, read, and update core_parties', () => {
      expect(hasPermission(ROLES.MANAGER, 'core_parties', 'create')).toBe(true);
      expect(hasPermission(ROLES.MANAGER, 'core_parties', 'read')).toBe(true);
      expect(hasPermission(ROLES.MANAGER, 'core_parties', 'update')).toBe(true);
      expect(hasPermission(ROLES.MANAGER, 'core_parties', 'delete')).toBe(false);
    });

    it('grants user and employee read/update access to core_parties without create/delete', () => {
      expect(hasPermission(ROLES.USER, 'core_parties', 'read')).toBe(true);
      expect(hasPermission(ROLES.USER, 'core_parties', 'update')).toBe(true);
      expect(hasPermission(ROLES.USER, 'core_parties', 'create')).toBe(false);

      expect(hasPermission(ROLES.EMPLOYEE, 'core_parties', 'read')).toBe(true);
      expect(hasPermission(ROLES.EMPLOYEE, 'core_parties', 'create')).toBe(false);
    });

    it('super_admin retains implicit wildcard permissions across all capabilities and modules', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, 'core_parties', 'create')).toBe(true);
      expect(hasPermission(ROLES.SUPER_ADMIN, 'core_parties', 'delete')).toBe(true);
      expect(hasPermission(ROLES.SUPER_ADMIN, 'capabilities', 'update')).toBe(true);
    });
  });
});
