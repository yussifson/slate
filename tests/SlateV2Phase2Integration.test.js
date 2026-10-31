import { describe, it, expect, vi } from 'vitest';
import { IdentityResolutionService, MATCH_OUTCOMES } from '../src/services/IdentityResolutionService';
import { CorePartyService } from '../src/services/CorePartyService';
import { supabase } from '../src/api/supabaseClient';

describe('SLATE V2: Phase 2 Identity Resolution & Data Integration Suite', () => {
  const TENANT_A = 'comp-tenant-alpha-001';
  const TENANT_B = 'comp-tenant-bravo-002';

  describe('1. Identity Resolution & Mapping', () => {
    it('creates a new Core Party and mapping when no match exists', async () => {
      const mockRecord = {
        id: 'client-101',
        name: 'Sterling Partners LLC',
        email: 'billing@sterling.com',
        phone: '+1 555 123 4567',
        type: 'corporate'
      };

      // Mock no existing mapping & no email match
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEqId = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEqTable = vi.fn().mockReturnValue({ eq: mockEqId });
      const mockEqComp = vi.fn().mockReturnValue({ eq: mockEqTable });

      const mockIlike = vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
      const mockEqCompParties = vi.fn().mockReturnValue({ ilike: mockIlike });

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_party_mappings') {
          return {
            select: vi.fn().mockReturnValue({ eq: mockEqComp }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'map-1', source_record_id: 'client-101' },
                  error: null
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'map-1', source_record_id: 'client-101' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnValue({ eq: mockEqCompParties }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'party-new-1',
                    primary_name: mockRecord.name,
                    party_type: 'organization',
                    email: mockRecord.email
                  },
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
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'act-1' }, error: null })
              })
            })
          };
        }
        if (table === 'clients') {
          return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }) };
        }
        return originalFrom(table);
      });

      const result = await IdentityResolutionService.resolveAndLink(
        TENANT_A,
        'clients',
        mockRecord,
        'client',
        'user-admin-1'
      );

      expect(result.status).toBe(MATCH_OUTCOMES.NEW_PARTY_CREATED);
      expect(result.party.primary_name).toBe('Sterling Partners LLC');
      expect(result.party.party_type).toBe('organization');

      supabase.from = originalFrom;
    });

    it('links to an existing Core Party when email match is detected in the same tenant', async () => {
      const mockRecord = {
        id: 'lead-202',
        full_name: 'Dr. Jane Smith',
        email: 'dr.smith@apexhealth.org',
        phone: '+1 555 987 6543'
      };

      const existingParty = {
        id: 'party-existing-44',
        company_id: TENANT_A,
        primary_name: 'Dr. Jane Smith',
        email: 'dr.smith@apexhealth.org',
        party_type: 'individual'
      };

      // Mock no mapping, but email match exists
      const mockSelectMapping = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
      });

      const mockSelectParties = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({ data: [existingParty], error: null }),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingParty, error: null })
          })
        })
      });

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_party_mappings') {
          return {
            select: mockSelectMapping,
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'map-2' }, error: null })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'map-2' }, error: null })
              })
            })
          };
        }
        if (table === 'core_parties') {
          return {
            select: mockSelectParties
          };
        }
        if (table === 'core_party_roles') {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'role-1' }, error: null })
              })
            })
          };
        }
        if (table === 'core_party_activities') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'act-2' }, error: null })
              })
            })
          };
        }
        if (table === 'leads') {
          return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }) };
        }
        return originalFrom(table);
      });

      const result = await IdentityResolutionService.resolveAndLink(
        TENANT_A,
        'leads',
        mockRecord,
        'client',
        'user-admin-1'
      );

      expect(result.status).toBe(MATCH_OUTCOMES.HIGH_CONFIDENCE_MATCH);
      expect(result.party.id).toBe('party-existing-44');

      supabase.from = originalFrom;
    });

    it('enforces company boundaries during resolution', async () => {
      await expect(
        IdentityResolutionService.resolveAndLink(null, 'clients', { id: '1' }, 'client')
      ).rejects.toThrow('companyId, sourceTable, and record.id are required');
    });
  });

  describe('2. Party Activity Log & History', () => {
    it('records activity entries with actor, summary, and tenant isolation', async () => {
      let loggedActivity = null;
      const mockInsert = vi.fn((payload) => {
        loggedActivity = payload;
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'act-10', ...payload }, error: null })
          })
        };
      });

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'core_party_activities') return { insert: mockInsert };
        return originalFrom(table);
      });

      const res = await IdentityResolutionService.recordActivity(
        TENANT_A,
        'party-uuid-99',
        'actor-uuid-1',
        'Contract Signed: Annual Retainer',
        'domain_action',
        { contract_id: 'ctr-500' }
      );

      expect(loggedActivity).toBeDefined();
      expect(loggedActivity.company_id).toBe(TENANT_A);
      expect(loggedActivity.party_id).toBe('party-uuid-99');
      expect(loggedActivity.summary).toBe('Contract Signed: Annual Retainer');

      supabase.from = originalFrom;
    });
  });
});
