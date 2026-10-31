import { describe, it, expect, vi } from 'vitest';
import { CorePartyService } from '../src/services/CorePartyService';
import { EventService } from '../src/services/EventService';
import { MetadataService } from '../src/services/MetadataService';
import { hasPermission, ROLES } from '../src/lib/rbac';
import { supabase } from '../src/api/supabaseClient';

describe('SLATE V2: Security, Tenant Isolation & Data Integrity Suite', () => {
  const TENANT_ALPHA = 'comp-tenant-alpha-001';
  const TENANT_BRAVO = 'comp-tenant-bravo-002';
  const PARTY_ALPHA_ID = 'party-alpha-uuid-111';
  const PARTY_BRAVO_ID = 'party-bravo-uuid-222';

  describe('A. Cross-Tenant Relationship Isolation & Enforcement', () => {
    it('prevents creating a relationship if either party belongs to another company', async () => {
      // Mock supabase to return only 1 verified party when 2 are queried across different tenants
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: PARTY_ALPHA_ID }], // Only 1 party belongs to TENANT_ALPHA
            error: null
          })
        })
      });

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_parties') return { select: mockSelect };
        return originalFrom(table);
      });

      await expect(
        CorePartyService.addRelationship(
          TENANT_ALPHA,
          PARTY_ALPHA_ID,
          PARTY_BRAVO_ID,
          'employed_by'
        )
      ).rejects.toThrow(/Cross-tenant security violation/i);

      supabase.from = originalFrom;
    });

    it('rejects self-referential relationships on the same party', async () => {
      await expect(
        CorePartyService.addRelationship(
          TENANT_ALPHA,
          PARTY_ALPHA_ID,
          PARTY_ALPHA_ID,
          'subsidiary_of'
        )
      ).rejects.toThrow(/Cannot create self-referential relationship/i);
    });

    it('prevents adding a role to a party that belongs to a different tenant', async () => {
      // Mock party lookup returning null (not owned by tenant)
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found' }
      });
      const mockEqCompany = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqCompany });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_parties') return { select: mockSelect };
        return originalFrom(table);
      });

      await expect(
        CorePartyService.addRole(TENANT_ALPHA, PARTY_BRAVO_ID, 'vendor')
      ).rejects.toThrow(/Cross-tenant security violation/i);

      supabase.from = originalFrom;
    });
  });

  describe('B. Transactional Outbox Idempotency & Tenant Scoping', () => {
    it('generates deterministic idempotency keys containing company_id and aggregate identifiers', async () => {
      let insertedPayload = null;
      const mockInsert = vi.fn((payload) => {
        insertedPayload = payload;
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'evt-1', ...payload }, error: null })
          })
        };
      });

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'platform_events') return { insert: mockInsert };
        return originalFrom(table);
      });

      const result = await EventService.publishEvent(
        TENANT_ALPHA,
        'invoice.finalized',
        'invoice',
        'inv-9001',
        { total: 5000 }
      );

      expect(insertedPayload).toBeDefined();
      expect(insertedPayload.company_id).toBe(TENANT_ALPHA);
      expect(insertedPayload.aggregate_type).toBe('invoice');
      expect(insertedPayload.aggregate_id).toBe('inv-9001');
      expect(insertedPayload.idempotency_key).toContain(TENANT_ALPHA);
      expect(insertedPayload.idempotency_key).toContain('inv-9001');

      supabase.from = originalFrom;
    });

    it('gracefully handles duplicate idempotency key collisions without throwing fatal errors', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' }
          })
        })
      });

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'platform_events') return { insert: mockInsert };
        return originalFrom(table);
      });

      const result = await EventService.publishEvent(
        TENANT_ALPHA,
        'invoice.finalized',
        'invoice',
        'inv-9001',
        { total: 5000 },
        'existing-unique-key'
      );

      expect(result.skipped).toBe(true);
      expect(result.idempotency_key).toBe('existing-unique-key');

      supabase.from = originalFrom;
    });
  });

  describe('C. Metadata Engine Type Validation & Tenant Scoping', () => {
    it('validates supported field types', async () => {
      await expect(
        MetadataService.createField(TENANT_ALPHA, 'obj-123', {
          field_key: 'custom_tax_code',
          label: 'Tax Code',
          field_type: 'invalid_unsupported_type'
        })
      ).rejects.toThrow();
    });
  });
});
