import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../src/api/supabaseClient.js';
import { BusinessBlueprintEngine } from '../src/services/BusinessBlueprintEngine.js';
import { UnifiedActionCenterService } from '../src/services/UnifiedActionCenterService.js';
import { CapabilityService } from '../src/services/CapabilityService.js';

describe('Slate V2 Phase 7 - Business Blueprint Engine & Unified Action Center', () => {
  const originalFrom = supabase.from;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Business Blueprint Engine', () => {
    it('interprets business profile and recommends capabilities and governance policies', async () => {
      supabase.from = vi.fn((table) => {
        if (table === 'business_blueprints') {
          return {
            insert: vi.fn().mockImplementation((record) => ({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'bp-proposal-1', ...record },
                  error: null
                })
              })
            }))
          };
        }
        return originalFrom(table);
      });

      const proposal = await BusinessBlueprintEngine.generateBlueprintProposal('comp-alpha', {
        business_name: 'Alpha Engineering Labs',
        industry_category: 'technology',
        needs_invoicing: true,
        needs_crm: true,
        needs_documents: true
      });

      expect(proposal.business_name).toBe('Alpha Engineering Labs');
      expect(proposal.status).toBe('draft');
      expect(proposal.recommended_capabilities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'core_foundation' }),
          expect.objectContaining({ id: 'finance' }),
          expect.objectContaining({ id: 'crm' }),
          expect.objectContaining({ id: 'documents' })
        ])
      );
      expect(proposal.approval_requirements).toHaveLength(2);
    });

    it('provisions an approved blueprint without granting unreviewed permissions', async () => {
      const mockBlueprint = {
        id: 'bp-456',
        company_id: 'comp-alpha',
        recommended_capabilities: [
          { id: 'core_foundation', reason: 'Core' },
          { id: 'finance', reason: 'Billing' }
        ],
        approval_requirements: [
          {
            key: 'finance_large_expense',
            name: 'Major Expense Policy',
            module: 'finance',
            threshold_amount: 5000,
            approval_type: 'single',
            approver_roles: ['admin']
          }
        ]
      };

      vi.spyOn(CapabilityService, 'activateCapability').mockResolvedValue({ success: true });

      supabase.from = vi.fn((table) => {
        if (table === 'business_blueprints') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockBlueprint, error: null })
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'act-100', status: 'approved' }, error: null })
                  })
                }),
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'act-100', status: 'approved' }, error: null })
                })
              })
            })
          };
        }
        if (table === 'capability_provisioning_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        if (table === 'approval_policies') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return originalFrom(table);
      });

      const res = await BusinessBlueprintEngine.provisionApprovedBlueprint(
        'comp-alpha',
        'bp-456',
        'user-admin-1'
      );

      expect(res.success).toBe(true);
      expect(res.provisionedCapabilities).toEqual(['core_foundation', 'finance']);
      expect(res.policiesInstalled).toBe(1);
    });
  });

  describe('Unified Action Center & Human Decision Engine', () => {
    it('creates an action item linked to an origin module and priority', async () => {
      supabase.from = vi.fn((table) => {
        if (table === 'unified_action_items') {
          return {
            insert: vi.fn().mockImplementation((record) => ({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'act-invoice-101', ...record },
                  error: null
                })
              })
            }))
          };
        }
        return originalFrom(table);
      });

      const action = await UnifiedActionCenterService.createActionItem({
        companyId: 'comp-alpha',
        originModule: 'finance',
        actionType: 'invoice_approval',
        title: 'Approve Vendor Invoice #9021',
        amount: 8500.00,
        currency: 'USD',
        priority: 'high'
      });

      expect(action.title).toBe('Approve Vendor Invoice #9021');
      expect(action.status).toBe('pending');
      expect(action.amount).toBe(8500.00);
    });

    it('records a human decision and audits approval history', async () => {
      const mockItem = {
        id: 'act-100',
        company_id: 'comp-alpha',
        status: 'pending',
        workflow_execution_id: null
      };

      supabase.from = vi.fn((table) => {
        if (table === 'unified_action_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockItem, error: null })
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'act-100', status: 'approved' }, error: null })
                  })
                }),
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'act-100', status: 'approved' }, error: null })
                })
              })
            })
          };
        }
        if (table === 'action_decisions') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return originalFrom(table);
      });

      const decisionRes = await UnifiedActionCenterService.recordDecision({
        companyId: 'comp-alpha',
        actionItemId: 'act-100',
        decision: 'approved',
        reason: 'Budget allocation verified against Q4 budget.',
        decidedByUserId: 'user-cfo-9'
      });

      expect(decisionRes.success).toBe(true);
      expect(decisionRes.newStatus).toBe('approved');
    });

    it('prevents modifying an already approved or rejected action item', async () => {
      const finalizedItem = {
        id: 'act-finalized',
        company_id: 'comp-alpha',
        status: 'approved'
      };

      supabase.from = vi.fn((table) => {
        if (table === 'unified_action_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: finalizedItem, error: null })
                })
              })
            })
          };
        }
        return originalFrom(table);
      });

      await expect(
        UnifiedActionCenterService.recordDecision({
          companyId: 'comp-alpha',
          actionItemId: 'act-finalized',
          decision: 'rejected',
          decidedByUserId: 'user-1'
        })
      ).rejects.toThrow(/Action item cannot be updated from status: approved/);
    });
  });
});
