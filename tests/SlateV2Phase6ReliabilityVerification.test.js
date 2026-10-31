import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OutboxDispatcher } from '../src/lib/workflow/outboxDispatcher.js';
import { WorkflowRuntime } from '../src/lib/workflow/workflowRuntime.js';

describe('Slate V2 Phase 6 - Reliability, Idempotency & Concurrency Verification', () => {
  let mockSupabase;
  let mockInngest;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn((table) => ({
        insert: vi.fn().mockImplementation((payload) => ({
          select: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: 'evt-123', ...payload }, error: null })
          }))
        })),
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
        })),
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockImplementation(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'evt-claimed' }, error: null })
          }))
        }))
      }))
    };

    mockInngest = {
      send: vi.fn().mockResolvedValue({ id: 'inngest-evt-001' })
    };
  });

  describe('Outbox Concurrency & Claim Collision Safety', () => {
    it('skips event dispatch if another worker has claimed the event (optimistic status locking)', async () => {
      const pendingEvents = [
        {
          id: 'evt-competing',
          company_id: 'comp-10',
          event_type: 'payment.received',
          aggregate_type: 'invoice',
          aggregate_id: 'inv-44',
          payload: { amount: 500 }
        }
      ];

      // Simulate conflict: the update query finds 0 rows because another dispatcher changed status to 'processing'
      mockSupabase.from = vi.fn((table) => {
        if (table === 'platform_events') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: pendingEvents, error: null }),
            update: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) // Conflict!
                  })
                })
              })
            }))
          };
        }
        return {};
      });

      const dispatcher = new OutboxDispatcher({
        supabase: mockSupabase,
        inngestSender: mockInngest
      });

      const res = await dispatcher.dispatchPendingEvents(10);
      expect(mockInngest.send).not.toHaveBeenCalled();
      expect(res.processed).toBe(0);
    });
  });

  describe('Step-Level Idempotency & Resumed Recovery', () => {
    it('resumes a failed workflow without repeating already completed steps', async () => {
      const runtime = new WorkflowRuntime({ supabase: mockSupabase });
      const sensitiveStep1Mock = vi.fn().mockResolvedValue({ chargeId: 'ch_123', status: 'paid' });
      const step2Mock = vi.fn().mockResolvedValue({ taskCreated: true });

      runtime.registerActionHandler('charge_card', sensitiveStep1Mock);
      runtime.registerActionHandler('create_receipt_task', step2Mock);

      const workflowDefinition = {
        id: 'wf-billing-recovery',
        company_id: 'tenant-omega',
        is_active: true,
        steps: [
          {
            id: 'step_charge',
            name: 'Charge Payment Card',
            step_type: 'action',
            action_type: 'charge_card'
          },
          {
            id: 'step_receipt',
            name: 'Create Receipt Task',
            step_type: 'action',
            action_type: 'create_receipt_task'
          }
        ]
      };

      // Mock database returning the existing execution and that step_charge was ALREADY completed
      mockSupabase.from = vi.fn((table) => {
        if (table === 'workflow_definitions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: workflowDefinition, error: null })
          };
        }
        if (table === 'workflow_executions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'exec-failed-billing',
                workflow_id: 'wf-billing-recovery',
                company_id: 'tenant-omega',
                status: 'failed'
              },
              error: null
            }),
            update: vi.fn().mockReturnThis()
          };
        }
        if (table === 'workflow_step_executions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col, val) => {
              if (col === 'execution_id') return { eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    step_id: 'step_charge',
                    status: 'completed',
                    output_data: { chargeId: 'ch_123', status: 'paid' }
                  }
                ],
                error: null
              })};
              return { eq: vi.fn().mockReturnThis() };
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      });

      const result = await runtime.executeWorkflow({
        workflowId: 'wf-billing-recovery',
        companyId: 'tenant-omega',
        resumeExecutionId: 'exec-failed-billing',
        inputPayload: {}
      });

      expect(result.status).toBe('completed');
      // Crucial Safety Invariant: The already-completed sensitive step must NOT be invoked again!
      expect(sensitiveStep1Mock).not.toHaveBeenCalled();
      // The pending/failed step must be invoked
      expect(step2Mock).toHaveBeenCalledTimes(1);
      expect(result.output.step_charge).toEqual({ chargeId: 'ch_123', status: 'paid' });
    });
  });

  describe('Tenant Boundary & Cross-Tenant Data Isolation', () => {
    it('blocks attempting to resume or access an execution belonging to a different tenant', async () => {
      const runtime = new WorkflowRuntime({ supabase: mockSupabase });

      mockSupabase.from = vi.fn((table) => {
        if (table === 'workflow_definitions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'wf-1', company_id: 'tenant-attacker', steps: [] },
              error: null
            })
          };
        }
        if (table === 'workflow_executions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null, // Cross tenant query fails because company_id does not match
              error: { message: 'Row not found' }
            }),
            update: vi.fn().mockReturnThis()
          };
        }
        return {};
      });

      // The execution was created by another tenant, so querying with resumeExecutionId returns null
      const res = await runtime.executeWorkflow({
        workflowId: 'wf-1',
        companyId: 'tenant-attacker',
        resumeExecutionId: 'exec-victim-tenant',
        inputPayload: { _mockSteps: [] }
      });

      expect(res.executionId).not.toBe('exec-victim-tenant');
    });
  });

  describe('Event Idempotency Semantics & Lifecycle Repeatability', () => {
    it('Case 1: deduplicates duplicate submissions having the exact same idempotency key', async () => {
      const existingRecord = {
        id: 'evt-existing-1',
        company_id: 'tenant-alpha',
        event_type: 'invoice.issued',
        aggregate_type: 'invoice',
        aggregate_id: 'inv-100',
        idempotency_key: 'idem-key-duplicate-test',
        status: 'pending'
      };

      const customSupabase = {
        from: vi.fn((table) => ({
          insert: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockImplementation(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key value violates unique constraint' }
              })
            }))
          })),
          select: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: existingRecord, error: null })
          }))
        }))
      };

      const dispatcher = new OutboxDispatcher({ supabase: customSupabase });
      const res = await dispatcher.enqueueEvent({
        companyId: 'tenant-alpha',
        eventType: 'invoice.issued',
        aggregateType: 'invoice',
        aggregateId: 'inv-100',
        idempotencyKey: 'idem-key-duplicate-test'
      });

      expect(res.duplicate).toBe(true);
      expect(res.event.id).toBe('evt-existing-1');
    });

    it('Case 2: retry of an outbox record retains its original event identity across failures', async () => {
      let statusUpdates = [];
      const pendingEvents = [
        {
          id: 'evt-retry-stable-id',
          company_id: 'tenant-beta',
          event_type: 'order.placed',
          aggregate_type: 'order',
          aggregate_id: 'ord-55',
          idempotency_key: 'stable-key-55',
          retry_count: 0,
          payload: { orderId: 'ord-55' }
        }
      ];

      const customSupabase = {
        from: vi.fn((table) => {
          if (table === 'platform_events') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: pendingEvents, error: null }),
              update: vi.fn().mockImplementation((fields) => {
                statusUpdates.push(fields);
                return {
                  eq: vi.fn().mockReturnThis(),
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: { ...pendingEvents[0], ...fields }, error: null })
                  })
                };
              })
            };
          }
          return {};
        })
      };

      const failingInngest = {
        send: vi.fn().mockRejectedValue(new Error('Network transient timeout'))
      };

      const dispatcher = new OutboxDispatcher({
        supabase: customSupabase,
        inngestSender: failingInngest,
        maxRetries: 3
      });

      const res = await dispatcher.dispatchPendingEvents(1);
      expect(res.failed).toBe(1);
      // Retained original identity: evt.id remains 'evt-retry-stable-id', retry_count updated to 1
      const retryUpdate = statusUpdates.find(u => u.retry_count === 1);
      expect(retryUpdate).toBeDefined();
      expect(retryUpdate.status).toBe('pending');
      // Original idempotency_key was never overwritten or regenerated with a new timestamp
      expect(retryUpdate.idempotency_key).toBeUndefined();
    });

    it('Case 3: legitimate repeated business lifecycle transitions (e.g. planned -> in-progress -> on-hold -> in-progress) succeed', async () => {
      const recordsInserted = [];
      const customSupabase = {
        from: vi.fn((table) => ({
          insert: vi.fn().mockImplementation((record) => {
            recordsInserted.push(record);
            return {
              select: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: `evt-${recordsInserted.length}`, ...record }, error: null })
              }))
            };
          })
        }))
      };

      const dispatcher = new OutboxDispatcher({ supabase: customSupabase });
      const transitions = [
        { status: 'planned', transitionId: 'trans-1' },
        { status: 'in-progress', transitionId: 'trans-2' },
        { status: 'on-hold', transitionId: 'trans-3' },
        { status: 'in-progress', transitionId: 'trans-4' } // Legitimate re-entry to in-progress
      ];

      for (const t of transitions) {
        const res = await dispatcher.enqueueEvent({
          companyId: 'comp-10',
          eventType: 'project.status_changed',
          aggregateType: 'project',
          aggregateId: 'proj-999',
          payload: { status: t.status },
          // Specific transition identifier ensures repeat status does not falsely suppress
          idempotencyKey: `comp-10:project:proj-999:status_changed:${t.transitionId}`
        });
        expect(res.duplicate).toBe(false);
      }

      expect(recordsInserted).toHaveLength(4);
      // Both in-progress transitions exist with distinct transition IDs
      expect(recordsInserted[1].payload.status).toBe('in-progress');
      expect(recordsInserted[3].payload.status).toBe('in-progress');
      expect(recordsInserted[1].idempotency_key).not.toBe(recordsInserted[3].idempotency_key);
    });
  });
});
