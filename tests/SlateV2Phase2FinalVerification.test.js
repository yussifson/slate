import { describe, it, expect, vi } from 'vitest';
import { IdentityResolutionService, MATCH_OUTCOMES } from '../src/services/IdentityResolutionService';
import { CorePartyService } from '../src/services/CorePartyService';
import { supabase } from '../src/api/supabaseClient';

describe('SLATE V2: Phase 2 Final Identity & Security Verification Suite', () => {
  const TENANT_ALPHA = 'comp-tenant-alpha-001';
  const TENANT_BRAVO = 'comp-tenant-bravo-002';

  describe('1. Identity Matching Safety & Ambiguity Handling', () => {
    it('returns EXISTING_MAPPING when trusted mapping is already established', async () => {
      const mockRecord = { id: 'client-99', name: 'Alpha Tech', email: 'contact@alpha.com' };
      const existingMapping = {
        id: 'map-existing-1',
        company_id: TENANT_ALPHA,
        party_id: 'party-11',
        source_table: 'clients',
        source_record_id: 'client-99',
        core_parties: { id: 'party-11', primary_name: 'Alpha Tech' }
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: existingMapping, error: null });
      const mockEqId = vi.fn().mockReturnValue({ maybeSingle: mockSingle });
      const mockEqTable = vi.fn().mockReturnValue({ eq: mockEqId });
      const mockEqComp = vi.fn().mockReturnValue({ eq: mockEqTable });

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_party_mappings') return { select: vi.fn().mockReturnValue({ eq: mockEqComp }) };
        if (table === 'core_party_roles') {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) })
            })
          };
        }
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'party-11' }, error: null }) })
              })
            })
          };
        }
        return originalFrom(table);
      });

      const res = await IdentityResolutionService.resolveAndLink(
        TENANT_ALPHA,
        'clients',
        mockRecord,
        'client'
      );

      expect(res.status).toBe(MATCH_OUTCOMES.EXISTING_MAPPING);
      expect(res.party.id).toBe('party-11');

      supabase.from = originalFrom;
    });

    it('detects shared email addresses and flags AMBIGUOUS_REVIEW_REQUIRED instead of merging', async () => {
      const mockRecord = { id: 'lead-88', name: 'Sarah Connor', email: 'info@sharedorg.com' };

      // Return 2 distinct parties sharing info@sharedorg.com
      const mockParties = [
        { id: 'p-1', primary_name: 'John Connor', email: 'info@sharedorg.com' },
        { id: 'p-2', primary_name: 'Kyle Reese', email: 'info@sharedorg.com' }
      ];

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_party_mappings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })
                })
              })
            })
          };
        }
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockResolvedValue({ data: mockParties, error: null })
              })
            })
          };
        }
        return originalFrom(table);
      });

      const res = await IdentityResolutionService.resolveAndLink(
        TENANT_ALPHA,
        'leads',
        mockRecord,
        'client'
      );

      expect(res.status).toBe(MATCH_OUTCOMES.AMBIGUOUS_REVIEW_REQUIRED);
      expect(res.party).toBeNull();
      expect(res.reason).toContain('Shared email detected');
      expect(res.candidateParties.length).toBe(2);

      supabase.from = originalFrom;
    });

    it('detects significant name divergence on single email match and flags AMBIGUOUS_REVIEW_REQUIRED', async () => {
      const mockRecord = { id: 'client-77', name: 'Acme Logistics Inc', email: 'admin@acme.com' };
      const matchedParty = { id: 'p-3', primary_name: 'Robert Vance', email: 'admin@acme.com' };

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_party_mappings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })
                })
              })
            })
          };
        }
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockResolvedValue({ data: [matchedParty], error: null })
              })
            })
          };
        }
        return originalFrom(table);
      });

      const res = await IdentityResolutionService.resolveAndLink(
        TENANT_ALPHA,
        'clients',
        mockRecord,
        'client'
      );

      expect(res.status).toBe(MATCH_OUTCOMES.AMBIGUOUS_REVIEW_REQUIRED);
      expect(res.party).toBeNull();
      expect(res.reason).toContain('Name divergence detected');

      supabase.from = originalFrom;
    });
  });

  describe('2. Concurrency & Idempotent Mapping Safety', () => {
    it('handles concurrent identical requests safely via upsert with conflict key', async () => {
      const mockRecord = { id: 'staff-404', name: 'David Miller', email: 'david@company.com' };

      let upsertCallCount = 0;
      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_party_mappings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })
                })
              })
            }),
            upsert: vi.fn((payload, opts) => {
              upsertCallCount++;
              expect(opts.onConflict).toBe('company_id,source_table,source_record_id');
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'map-id-99', ...payload }, error: null })
                })
              };
            })
          };
        }
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'party-david-1', primary_name: 'David Miller' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'core_party_roles') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === 'core_party_activities') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) })
            })
          };
        }
        return originalFrom(table);
      });

      // Execute two simultaneous resolution calls
      const [res1, res2] = await Promise.all([
        IdentityResolutionService.resolveAndLink(TENANT_ALPHA, 'staff_records', mockRecord, 'employee'),
        IdentityResolutionService.resolveAndLink(TENANT_ALPHA, 'staff_records', mockRecord, 'employee')
      ]);

      expect(res1.status).toBe(MATCH_OUTCOMES.NEW_PARTY_CREATED);
      expect(res2.status).toBe(MATCH_OUTCOMES.NEW_PARTY_CREATED);
      expect(upsertCallCount).toBe(2);

      supabase.from = originalFrom;
    });
  });

  describe('3. Real Estate Tenant Legacy Coverage', () => {
    it('resolves real estate tenants (univ_re_clients) to Core Party with tenant role', async () => {
      const mockReClient = {
        id: 're-client-12',
        name: 'Highline Media Group',
        email: 'leases@highline.com',
        type: 'corporate'
      };

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_party_mappings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })
                })
              })
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'map-re-1' }, error: null })
              })
            })
          };
        }
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'party-re-1', primary_name: 'Highline Media Group', party_type: 'organization' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'core_party_roles') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === 'core_party_activities') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) })
            })
          };
        }
        return originalFrom(table);
      });

      const res = await IdentityResolutionService.resolveAndLink(
        TENANT_ALPHA,
        'univ_re_clients',
        mockReClient,
        'tenant'
      );

      expect(res.status).toBe(MATCH_OUTCOMES.NEW_PARTY_CREATED);
      expect(res.party.primary_name).toBe('Highline Media Group');
      expect(res.mapping).toBeDefined();

      supabase.from = originalFrom;
    });
  });
});
