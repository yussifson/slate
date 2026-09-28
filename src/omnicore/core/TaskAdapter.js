import { powerSync } from '@/api/PowerSyncConnector';
import { base44 } from '@/api/base44Client';

/**
 * TaskAdapter
 * Normalized read/write adapter for the 'Task' primitive.
 * Maps across: tasks, univ_erp_onboarding, univ_re_maintenance_requests.
 * Note: industry_records support for 'action_item' is intentionally deferred to a future phase.
 */
export const TaskAdapter = {
  /**
   * Fetch normalized task records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @returns {Promise<Array<NormalizedTask>>}
   */
  async getTasks(companyId) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch from shared 'tasks' table
    try {
      const tasks = await base44.entities.Task.filter({ company_id: companyId });
      (tasks || []).forEach(t => {
        normalized.push({
          id: t.id,
          sourceTable: 'tasks',
          companyId: t.company_id,
          title: t.title || t.name || 'Untitled Task',
          description: t.description || null,
          status: t.status || 'todo',
          priority: t.priority || 'medium',
          dueDate: t.due_date || null,
          assignedTo: t.assigned_to || null,
          metadata: { caseId: t.case_id, category: t.category }
        });
      });
    } catch (err) {
      console.warn('[TaskAdapter] Fetch from tasks table failed:', err);
    }

    // 2. Fetch from 'univ_erp_onboarding' tasks if present
    try {
      const res = await powerSync.execute('SELECT * FROM univ_erp_onboarding WHERE company_id = ?', [companyId]);
      const onboardingTasks = res?.rows?._array || [];
      onboardingTasks.forEach(t => {
        normalized.push({
          id: t.id,
          sourceTable: 'univ_erp_onboarding',
          companyId: t.company_id,
          title: t.task_name || 'Onboarding Task',
          description: `Onboarding task for employee ${t.employee_id || ''}`,
          status: t.status || 'pending',
          priority: 'medium',
          dueDate: t.due_date || null,
          assignedTo: t.assigned_to || null,
          metadata: { department: t.department, employeeId: t.employee_id }
        });
      });
    } catch (err) {
      // Table may not exist
    }

    return normalized;
  },

  /**
   * Create a task using existing base44 ORM write path.
   */
  async createTask(companyId, taskData) {
    return base44.entities.Task.create({
      company_id: companyId,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      due_date: taskData.dueDate || null,
      assigned_to: taskData.assignedTo || null
    });
  }
};
