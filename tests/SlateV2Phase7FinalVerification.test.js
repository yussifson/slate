import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../src/api/supabaseClient.js';
import { BusinessBlueprintEngine } from '../src/services/BusinessBlueprintEngine.js';
import { UnifiedActionCenterService } from '../src/services/UnifiedActionCenterService.js';
import { CapabilityService } from '../src/services/CapabilityService.js';

describe('Slate V2 Phase 7 Final Verification - Governance, Security & Policy Enforcement', () => {
  const originalFrom = supabase.from;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Approval Policy Enforcement & Separation of Duties', () => {
    it('blocks a user from approving their own financial or sensitive action request', async () => {
      const mockItem = {
        id: 'act-expense-99',
        company_id: 'comp-omega',
        requesting_user_id: 'user-requester-7',
        assigned_role: 'manager',
        status: 'pending',
        amount: 3200
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
            })
          };
        }
        return originalFrom(table);
      });

      await expect(
        UnifiedActionCenterService.recordDecision({
          companyId: 'comp-omega',
          actionItemId: 'act-expense-99',
          decision: 'approved',
          decidedByUserId: 'user-requester-7' // Same as requester!
        })
      ).rejects.toThrow(/Separation of duties violation: Requester cannot approve their own action item/);
    });

    it('blocks approving an action that has expired past its expires_at timestamp', async () => {
      const expiredItem = {
        id: 'act-expired-10',
        company_id: 'comp-omega',
        requesting_user_id: 'user-vendor',
        expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        status: 'pending'
      };

      supabase.from = vi.fn((table) => {
        if (table === 'unified_action_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: expiredItem, error: null })
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          };
        }
        return originalFrom(table);
      });

      await expect(
        UnifiedActionCenterService.recordDecision({
          companyId: 'comp-omega',
          actionItemId: 'act-expired-10',
          decision: 'approved',
          decidedByUserId: 'user-cfo-1'
        })
      ).rejects.toThrow(/Cannot approve an expired action item/);
    });

    it('blocks users without the required approver role from approving the action', async () => {
      const roleGatedItem = {
        id: 'act-legal-contract',
        company_id: 'comp-omega',
        assigned_role: 'legal_counsel',
        status: 'pending'
      };

      supabase.from = vi.fn((table) => {
        if (table === 'unified_action_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: roleGatedItem, error: null })
                })
              })
            })
          };
        }
        return originalFrom(table);
      });

      await expect(
        UnifiedActionCenterService.recordDecision({
          companyId: 'comp-omega',
          actionItemId: 'act-legal-contract',
          decision: 'approved',
          decidedByUserId: 'user-sales-agent',
          decidedByUserRole: 'sales_rep' // Not legal_counsel
        })
      ).rejects.toThrow(/Unauthorized: Action requires role 'legal_counsel', user has 'sales_rep'/);
    });
  });

  describe('Provisioning Partial Failure Detection & Audit Logging', () => {
    it('captures partial capability provisioning failures and records failure audit log', async () => {
      const mockBlueprint = {
        id: 'bp-multi-cap',
        company_id: 'comp-omega',
        recommended_capabilities: [
          { id: 'core_foundation', reason: 'Core' },
          { id: 'custom_unavailable', reason: 'Unavailable extension' }
        ],
        approval_requirements: []
      };

      // Mock first succeeds, second fails
      vi.spyOn(CapabilityService, 'activateCapability').mockImplementation(async (_, capId) => {
        if (capId === 'custom_unavailable') {
          throw new Error('Capability not found or dependency unsatisfied');
        }
        return { success: true };
      });

      const loggedRecords = [];
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
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          };
        }
        if (table === 'capability_provisioning_logs') {
          return {
            insert: vi.fn().mockImplementation((rec) => {
              loggedRecords.push(rec);
              return Promise.resolve({ error: null });
            })
          };
        }
        return originalFrom(table);
      });

      const res = await BusinessBlueprintEngine.provisionApprovedBlueprint(
        'comp-omega',
        'bp-multi-cap',
        'admin-user-01'
      );

      expect(res.success).toBe(false);
      expect(res.provisionedCapabilities).toEqual(['core_foundation']);
      expect(res.provisioningErrors).toHaveLength(1);
      expect(res.provisioningErrors[0].capability_id).toBe('custom_unavailable');
      expect(loggedRecords).toHaveLength(2);
      expect(loggedRecords[0].status).toBe('success');
      expect(loggedRecords[1].status).toBe('failed');
    });
  });
});
