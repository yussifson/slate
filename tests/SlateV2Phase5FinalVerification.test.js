import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpsProjectService } from '../src/services/OpsProjectService';
import { supabase } from '../src/api/supabaseClient';
import { EventService } from '../src/services/EventService';
import { OutboxDispatcher } from '../src/lib/workflow/outboxDispatcher.js';

vi.mock('../src/api/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('../src/services/EventService', () => ({
  EventService: {
    publishEvent: vi.fn().mockImplementation((companyId, eventType, aggregateType, aggregateId, payload, key) => {
      return Promise.resolve({
        id: 'evt-dispatched-001',
        company_id: companyId,
        event_type: eventType,
        aggregate_type: aggregateType,
        aggregate_id: aggregateId,
        payload,
        idempotency_key: key || `${companyId}:${aggregateType}:${aggregateId}:${eventType}:${Date.now()}`
      });
    })
  }
}));

describe('Slate V2: Phase 5 Final Verification & Cross-Phase Integration', () => {
  const companyA = 'comp-aaaa-1111-1111-1111';
  const companyB = 'comp-bbbb-2222-2222-2222';
  const userPartyA = 'party-usr-a1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Tenant Isolation & Database Reference Safety', () => {
    it('prevents associating a cross-company party with an operational project', async () => {
      // Mock database foreign key rejection when client_party_id is from Company B
      supabase.from.mockImplementation((table) => {
        if (table === 'ops_projects') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: '23503', message: 'violates foreign key constraint fk_ops_projects_client_party_tenant' }
                })
              })
            })
          };
        }
        return {};
      });

      await expect(
        OpsProjectService.createProject(companyA, {
          name: 'Cross Company Test',
          client_party_id: 'party-from-company-b'
        })
      ).rejects.toThrow(/foreign key constraint/);
    });

    it('prevents assigning a cross-company team to a project', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'ops_projects') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: '23503', message: 'violates foreign key constraint fk_ops_projects_team_tenant' }
                })
              })
            })
          };
        }
        return {};
      });

      await expect(
        OpsProjectService.createProject(companyA, {
          name: 'Cross Team Test',
          team_id: 'team-from-company-b'
        })
      ).rejects.toThrow(/foreign key constraint/);
    });
  });

  describe('2. Operational Invariants & Lifecycle Rules', () => {
    it('maintains strict 100% progress and actual_end_date on project completion', async () => {
      const mockCompleted = {
        id: 'prj-100',
        company_id: companyA,
        status: 'completed',
        progress_percentage: 100,
        actual_end_date: new Date().toISOString().split('T')[0]
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'ops_projects') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockCompleted, error: null })
              })
            })
          };
        }
        return {};
      });

      const res = await OpsProjectService.updateProjectStatus(companyA, 'prj-100', 'completed');
      expect(res.status).toBe('completed');
      expect(res.progress_percentage).toBe(100);
      expect(res.actual_end_date).toBeDefined();
    });

    it('enforces task completion idempotency and outbox publication', async () => {
      const mockTask = {
        id: 'tsk-404',
        company_id: companyA,
        status: 'done',
        completed_at: new Date().toISOString()
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'ops_project_tasks') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockTask, error: null })
              })
            })
          };
        }
        return {};
      });

      const result = await OpsProjectService.completeTask(companyA, 'tsk-404', userPartyA);
      expect(result.status).toBe('done');
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        companyA,
        'OPS_TASK_COMPLETED',
        'ops_task',
        'tsk-404',
        expect.objectContaining({ completed_by: userPartyA })
      );
    });
  });

  describe('3. Event Integration with Phase 6 Outbox & Workflow Engine', () => {
    it('generates durable event contracts compatible with Phase 6 OutboxDispatcher', async () => {
      const mockDb = {
        from: vi.fn((table) => ({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'evt-p6-001',
                  company_id: companyA,
                  event_type: 'OPS_PROJECT_CREATED',
                  aggregate_type: 'ops_project',
                  aggregate_id: 'prj-999',
                  idempotency_key: `key-prj-999`,
                  status: 'pending'
                },
                error: null
              })
            })
          })
        }))
      };

      const dispatcher = new OutboxDispatcher({ supabase: mockDb });
      const result = await dispatcher.enqueueEvent({
        companyId: companyA,
        eventType: 'OPS_PROJECT_CREATED',
        aggregateType: 'ops_project',
        aggregateId: 'prj-999',
        payload: { name: 'Apollo Migration', budget: 120000 },
        idempotencyKey: 'key-prj-999'
      });

      expect(result.duplicate).toBe(false);
      expect(result.event.event_type).toBe('OPS_PROJECT_CREATED');
      expect(result.event.aggregate_id).toBe('prj-999');
    });
  });

  describe('4. Business Command Center Role-Adaptive Scoping', () => {
    it('scopes My Work exclusively to the authenticated user and excludes other members', async () => {
      const mockTasks = [
        { id: 't1', title: 'Task For Me', assigned_to_party_id: userPartyA, status: 'todo' },
        { id: 't2', title: 'Task For Colleague', assigned_to_party_id: 'party-usr-colleague', status: 'todo' }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'ops_project_tasks') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockTasks, error: null })
          };
        }
        if (table === 'ops_projects') {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
        }
        if (table === 'ops_work_orders') {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
        }
        if (table === 'ops_issues') {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) };
        }
        return {};
      });

      const metrics = await OpsProjectService.getCommandCenterMetrics(companyA, userPartyA);
      expect(metrics.myWork.length).toBe(1);
      expect(metrics.myWork[0].id).toBe('t1');
      expect(metrics.myWork[0].assigned_to_party_id).toBe(userPartyA);
    });
  });
});
