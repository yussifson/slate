import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OutboxDispatcher } from '../src/lib/workflow/outboxDispatcher.js';
import { WorkflowRuntime } from '../src/lib/workflow/workflowRuntime.js';

describe('Slate V2 Phase 6 - Workflow Engine & Event Infrastructure', () => {
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
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }))
    };

    mockInngest = {
      send: vi.fn().mockResolvedValue({ id: 'inngest-evt-001' })
    };
  });

  describe('OutboxDispatcher', () => {
    it('enqueues a business event into platform_events with idempotency key', async () => {
      const dispatcher = new OutboxDispatcher({ supabase: mockSupabase });
      const result = await dispatcher.enqueueEvent({
        companyId: 'company-abc',
        eventType: 'invoice.issued',
        aggregateType: 'invoice',
        aggregateId: 'inv-999',
        payload: { amount: 1500, currency: 'USD' }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('platform_events');
      expect(result.duplicate).toBe(false);
      expect(result.event.event_type).toBe('invoice.issued');
      expect(result.event.idempotency_key).toBeDefined();
    });

    it('rejects event enqueue if missing required metadata', async () => {
      const dispatcher = new OutboxDispatcher({ supabase: mockSupabase });
      await expect(
        dispatcher.enqueueEvent({
          companyId: null,
          eventType: 'invoice.issued'
        })
      ).rejects.toThrow(/Missing required event parameters/);
    });

    it('dispatches pending events to Inngest and marks them completed', async () => {
      const pendingEvents = [
        {
          id: 'evt-1',
          company_id: 'company-abc',
          event_type: 'client.created',
          aggregate_type: 'client',
          aggregate_id: 'c-101',
          payload: { name: 'Acme Corp' },
          retry_count: 0
        }
      ];

      mockSupabase.from = vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: pendingEvents, error: null }),
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: pendingEvents[0], error: null })
              })
            }),
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: pendingEvents[0], error: null })
            })
          })
        }))
      }));

      const dispatcher = new OutboxDispatcher({
        supabase: mockSupabase,
        inngestSender: mockInngest
      });

      const res = await dispatcher.dispatchPendingEvents(10);
      expect(mockInngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'slate/client.created',
          data: expect.objectContaining({ company_id: 'company-abc', name: 'Acme Corp' })
        })
      );
      expect(res.processed).toBe(1);
      expect(res.failed).toBe(0);
    });
  });

  describe('WorkflowRuntime', () => {
    it('executes a multi-step workflow with actions and step interpolation', async () => {
      const runtime = new WorkflowRuntime({ supabase: mockSupabase });

      const workflowDefinition = {
        id: 'wf-1',
        company_id: 'comp-100',
        is_active: true,
        steps: [
          {
            id: 'step_1',
            name: 'Send Welcome Notification',
            step_type: 'action',
            action_type: 'notification_send',
            config: {
              channel: 'in_app',
              message: 'Welcome {{ party_name }} to our platform!'
            }
          },
          {
            id: 'step_2',
            name: 'Assign Onboarding Task',
            step_type: 'action',
            action_type: 'task_create',
            config: {
              title: 'Complete onboarding for {{ party_name }}'
            }
          }
        ]
      };

      mockSupabase.from = vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: workflowDefinition, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockImplementation((payload) => ({
          select: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: 'exec-888', ...payload }, error: null })
          }))
        })),
        update: vi.fn().mockReturnThis()
      }));

      const result = await runtime.executeWorkflow({
        workflowId: 'wf-1',
        companyId: 'comp-100',
        inputPayload: { party_name: 'Stark Industries', party_id: 'p-50' }
      });

      expect(result.status).toBe('completed');
      expect(result.stepsCompleted).toBe(2);
      expect(result.output.step_1.message).toBe('Welcome Stark Industries to our platform!');
      expect(result.output.step_2.title).toBe('Complete onboarding for Stark Industries');
    });

    it('evaluates conditions and skips steps when condition does not match', async () => {
      const runtime = new WorkflowRuntime({ supabase: mockSupabase });

      const workflowDefinition = {
        id: 'wf-conditions',
        company_id: 'comp-100',
        is_active: true,
        steps: [
          {
            id: 'conditional_step',
            name: 'High Value Alert',
            step_type: 'action',
            action_type: 'notification_send',
            condition: {
              field: 'amount',
              operator: '>=',
              value: 10000
            },
            config: {
              message: 'High value deal triggered'
            }
          }
        ]
      };

      mockSupabase.from = vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: workflowDefinition, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockImplementation((payload) => ({
          select: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: 'exec-999', ...payload }, error: null })
          }))
        })),
        update: vi.fn().mockReturnThis()
      }));

      const result = await runtime.executeWorkflow({
        workflowId: 'wf-conditions',
        companyId: 'comp-100',
        inputPayload: { amount: 500 } // Below condition threshold
      });

      expect(result.status).toBe('completed');
      expect(result.stepsCompleted).toBe(0);
      expect(result.output.conditional_step).toBeUndefined();
    });

    it('executes parallel steps concurrently and aggregates outputs', async () => {
      const runtime = new WorkflowRuntime({ supabase: mockSupabase });

      const workflowDefinition = {
        id: 'wf-parallel',
        company_id: 'comp-100',
        is_active: true,
        steps: [
          {
            id: 'parallel_step',
            name: 'Execute Parallel Broadcast',
            step_type: 'parallel',
            sub_steps: [
              {
                action_type: 'notification_send',
                config: { message: 'Parallel message 1' }
              },
              {
                action_type: 'notification_send',
                config: { message: 'Parallel message 2' }
              }
            ]
          }
        ]
      };

      mockSupabase.from = vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: workflowDefinition, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockImplementation((payload) => ({
          select: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: 'exec-parallel', ...payload }, error: null })
          }))
        })),
        update: vi.fn().mockReturnThis()
      }));

      const result = await runtime.executeWorkflow({
        workflowId: 'wf-parallel',
        companyId: 'comp-100',
        inputPayload: {}
      });

      expect(result.status).toBe('completed');
      expect(result.output.parallel_step).toHaveLength(2);
      expect(result.output.parallel_step[0].delivered).toBe(true);
      expect(result.output.parallel_step[1].delivered).toBe(true);
    });

    it('enforces strict tenant isolation and prevents cross-tenant execution', async () => {
      const runtime = new WorkflowRuntime({ supabase: mockSupabase });

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(
        runtime.executeWorkflow({
          workflowId: 'wf-other-tenant',
          companyId: 'tenant-a',
          inputPayload: {}
        })
      ).rejects.toThrow(/not found or tenant unauthorized/);
    });
  });
});
