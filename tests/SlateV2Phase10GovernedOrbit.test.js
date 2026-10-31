import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GovernedOrbitToolRegistry, GovernedOrbitExecutionGate, TOOL_CATEGORIES } from '../src/services/GovernedOrbitService.js';
import { UnifiedActionCenterService } from '../src/services/UnifiedActionCenterService.js';
import { BusinessExceptionService } from '../src/services/BusinessExceptionService.js';

describe('Slate V2 Phase 10 - Governed Orbit & Production Hardening Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Governed Tool Registry & Deny-by-Default', () => {
    it('strictly rejects unregistered or invented tool calls', async () => {
      await expect(
        GovernedOrbitExecutionGate.executeToolCall({
          companyId: 'comp-omega',
          userId: 'user-01',
          toolId: 'unregistered_exploit_tool',
          params: {}
        })
      ).rejects.toThrow(/Security Violation: Tool 'unregistered_exploit_tool' is not registered/);
    });

    it('denies tool execution if caller lacks required RBAC permissions', async () => {
      // User with 'guest' role attempts to issue/update an invoice via financial tool
      await expect(
        GovernedOrbitExecutionGate.executeToolCall({
          companyId: 'comp-omega',
          userId: 'guest-user',
          userRole: 'guest',
          toolId: 'authorize_financial_transaction',
          params: { amount: 2000 }
        })
      ).rejects.toThrow(/Permission Denied: Role 'guest' lacks permission/);
    });
  });

  describe('Action Planning Previews & Human-in-the-Loop Gating', () => {
    it('routes sensitive actions to Unified Action Center without executing directly', async () => {
      vi.spyOn(UnifiedActionCenterService, 'createActionItem').mockResolvedValue({
        id: 'act-orbit-preview-123',
        status: 'pending'
      });

      const res = await GovernedOrbitExecutionGate.executeToolCall({
        companyId: 'comp-omega',
        userId: 'admin-user',
        userRole: 'admin',
        toolId: 'authorize_financial_transaction',
        params: {
          title: 'Disburse Supplier Payment',
          amount: 14500,
          currency: 'USD'
        },
        humanApprovalGranted: false // Crucial: Not yet confirmed by human
      });

      expect(res.governanceStatus).toBe('APPROVAL_REQUIRED');
      expect(res.actionPreview).toBeDefined();
      expect(res.actionPreview.financialImpact).toBe('$14500 USD');
      expect(res.details.status).toBe('pending_approval');
      expect(res.details.action_item_id).toBe('act-orbit-preview-123');
    });

    it('executes read-only tools immediately for authorized users', async () => {
      vi.spyOn(BusinessExceptionService, 'getOpenExceptions').mockResolvedValue([
        { id: 'exc-1', title: 'Overdue Invoice' }
      ]);

      const res = await GovernedOrbitExecutionGate.executeToolCall({
        companyId: 'comp-omega',
        userId: 'admin-user',
        userRole: 'admin',
        toolId: 'get_operational_exceptions',
        params: {}
      });

      expect(res.governanceStatus).toBe('EXECUTED');
      expect(res.output).toHaveLength(1);
    });
  });
});
