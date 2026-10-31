import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpsProjectService } from '../src/services/OpsProjectService';
import { supabase } from '../src/api/supabaseClient';
import { EventService } from '../src/services/EventService';

vi.mock('../src/api/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('../src/services/EventService', () => ({
  EventService: {
    publishEvent: vi.fn().mockResolvedValue({ id: 'evt-ops-1' })
  }
}));

describe('Slate V2: Phase 5 — Projects, People, Operations & Command Center', () => {
  const mockCompanyId = 'comp-ops-test-999';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Project Management', () => {
    it('creates a project with auto-generated code and publishes an event', async () => {
      const mockProject = {
        id: 'prj-101',
        company_id: mockCompanyId,
        project_code: 'PRJ-8888',
        name: 'Enterprise Transformation',
        budget_amount: 50000,
        status: 'planned'
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'ops_projects') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProject, error: null })
              })
            })
          };
        }
        return {};
      });

      const prj = await OpsProjectService.createProject(mockCompanyId, {
        name: 'Enterprise Transformation',
        budget_amount: 50000
      });

      expect(prj.id).toBe('prj-101');
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        mockCompanyId,
        'OPS_PROJECT_CREATED',
        'ops_project',
        'prj-101',
        expect.objectContaining({ name: 'Enterprise Transformation' })
      );
    });

    it('updates project status and automatically sets 100% progress when completed', async () => {
      const updatedProject = {
        id: 'prj-101',
        status: 'completed',
        progress_percentage: 100
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'ops_projects') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedProject, error: null })
              })
            })
          };
        }
        return {};
      });

      const res = await OpsProjectService.updateProjectStatus(mockCompanyId, 'prj-101', 'completed');
      expect(res.status).toBe('completed');
      expect(res.progress_percentage).toBe(100);
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        mockCompanyId,
        'OPS_PROJECT_STATUS_CHANGED',
        'ops_project',
        'prj-101',
        expect.objectContaining({ status: 'completed' })
      );
    });
  });

  describe('Operations & Work Orders', () => {
    it('creates an operational work order and publishes event', async () => {
      const mockWO = {
        id: 'wo-500',
        company_id: mockCompanyId,
        order_number: 'WO-1234',
        title: 'Emergency Server Maintenance',
        status: 'submitted'
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'ops_work_orders') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockWO, error: null })
              })
            })
          };
        }
        return {};
      });

      const wo = await OpsProjectService.createWorkOrder(mockCompanyId, {
        title: 'Emergency Server Maintenance'
      });

      expect(wo.id).toBe('wo-500');
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        mockCompanyId,
        'OPS_WORK_ORDER_CREATED',
        'ops_work_order',
        'wo-500',
        expect.objectContaining({ title: 'Emergency Server Maintenance' })
      );
    });
  });

  describe('Business Command Center Metrics', () => {
    it('accurately aggregates operational health, overdue tasks and attention items', async () => {
      const mockProjects = [
        { id: 'p1', status: 'in_progress' },
        { id: 'p2', status: 'planned' }
      ];
      const mockTasks = [
        { id: 't1', title: 'Overdue Review', status: 'todo', due_date: '2020-01-01', assigned_to_party_id: 'user-p1' },
        { id: 't2', title: 'Active Coding', status: 'done', due_date: '2099-01-01', assigned_to_party_id: 'user-p1' }
      ];
      const mockWorkOrders = [
        { id: 'w1', status: 'in_progress' }
      ];
      const mockIssues = [
        { id: 'i1', title: 'Network Outage', severity: 'critical', status: 'open' }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'ops_projects') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProjects, error: null })
          };
        }
        if (table === 'ops_project_tasks') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockTasks, error: null })
          };
        }
        if (table === 'ops_work_orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockWorkOrders, error: null })
          };
        }
        if (table === 'ops_issues') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockIssues, error: null })
          };
        }
        return {};
      });

      const metrics = await OpsProjectService.getCommandCenterMetrics(mockCompanyId, 'user-p1');

      expect(metrics.activeProjectsCount).toBe(1);
      expect(metrics.totalProjectsCount).toBe(2);
      expect(metrics.pendingTasksCount).toBe(1);
      expect(metrics.completedTasksCount).toBe(1);
      expect(metrics.overdueTasksCount).toBe(1);
      expect(metrics.criticalIssuesCount).toBe(1);
      expect(metrics.myWork.length).toBe(1);
      expect(metrics.attentionRequired.length).toBe(2);
    });
  });
});
