import { TaskAdapter } from '../core/TaskAdapter';
import { EmployeeAdapter } from '../core/EmployeeAdapter';

/**
 * Scheduling Capability
 * Read-composition layer composing TaskAdapter and EmployeeAdapter.
 * Presents consolidated operational scheduling, staff workload calendars,
 * and upcoming deadline tracking.
 *
 * Scope Note:
 * This capability covers operational task scheduling and employee assignments.
 * Specialized vertical appointment bookings (e.g. clinic patient appointments,
 * hotel guest room bookings) remain in vertical-specific tables and are deferred.
 */
export const Scheduling = {
  /**
   * Get high-level schedule and deadline overview for a company.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<object>}
   */
  async getScheduleOverview(companyId, options = {}) {
    const emptyOverview = {
      totalScheduled: 0,
      activeScheduled: 0,
      completedScheduled: 0,
      upcomingCount: 0,
      overdueCount: 0,
      dueTodayCount: 0,
      assignedCount: 0,
      unassignedCount: 0,
      byStatus: {},
      byPriority: {},
      scopeNote: 'Generic scheduling composing tasks and employee assignments. Vertical-specific scheduling (e.g. hotel room reservations, clinic patient appointments) is deferred.'
    };

    if (!companyId) return emptyOverview;

    try {
      const [tasks, employees] = await Promise.all([
        TaskAdapter.getTasks(companyId, options),
        EmployeeAdapter.getEmployees(companyId, options)
      ]);

      if (!tasks || tasks.length === 0) return emptyOverview;

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      let activeScheduled = 0;
      let completedScheduled = 0;
      let upcomingCount = 0;
      let overdueCount = 0;
      let dueTodayCount = 0;
      let assignedCount = 0;
      let unassignedCount = 0;
      const byStatus = {};
      const byPriority = {};

      tasks.forEach(t => {
        const status = (t.status || 'open').toLowerCase();
        const priority = (t.priority || 'medium').toLowerCase();
        byStatus[status] = (byStatus[status] || 0) + 1;
        byPriority[priority] = (byPriority[priority] || 0) + 1;

        const isDone = ['completed', 'done', 'closed', 'resolved'].includes(status);
        if (isDone) {
          completedScheduled++;
        } else {
          activeScheduled++;
        }

        if (t.assignedTo) {
          assignedCount++;
        } else {
          unassignedCount++;
        }

        if (t.dueDate) {
          const due = new Date(t.dueDate);
          if (!isNaN(due.getTime())) {
            const dueStr = due.toISOString().slice(0, 10);
            if (!isDone) {
              if (dueStr === todayStr) {
                dueTodayCount++;
              } else if (due < now) {
                overdueCount++;
              } else {
                upcomingCount++;
              }
            }
          }
        }
      });

      return {
        totalScheduled: tasks.length,
        activeScheduled,
        completedScheduled,
        upcomingCount,
        overdueCount,
        dueTodayCount,
        assignedCount,
        unassignedCount,
        byStatus,
        byPriority,
        scopeNote: emptyOverview.scopeNote
      };
    } catch (err) {
      console.warn('[Scheduling Capability] Failed to compute schedule overview:', err);
      return emptyOverview;
    }
  },

  /**
   * Get operational schedule and workload for a specific staff member.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {string} employeeIdentifier - Employee ID, email, name, or user_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<object>}
   */
  async getStaffSchedule(companyId, employeeIdentifier, options = {}) {
    const emptyResult = {
      employee: null,
      employeeIdentifier: employeeIdentifier || null,
      totalTasks: 0,
      activeTasksCount: 0,
      completedTasksCount: 0,
      overdueTasksCount: 0,
      upcomingTasksCount: 0,
      taskLoadScore: 0,
      tasks: []
    };

    if (!companyId || !employeeIdentifier) return emptyResult;

    try {
      const [tasks, employees] = await Promise.all([
        TaskAdapter.getTasks(companyId, options),
        EmployeeAdapter.getEmployees(companyId, options)
      ]);

      const target = String(employeeIdentifier).toLowerCase().trim();
      const employee = (employees || []).find(e => 
        (e.id && String(e.id).toLowerCase() === target) ||
        (e.email && e.email.toLowerCase() === target) ||
        (e.name && e.name.toLowerCase() === target) ||
        (e.userId && String(e.userId).toLowerCase() === target)
      ) || null;

      const employeeKeys = new Set([target]);
      if (employee) {
        if (employee.id) employeeKeys.add(String(employee.id).toLowerCase());
        if (employee.email) employeeKeys.add(employee.email.toLowerCase());
        if (employee.name) employeeKeys.add(employee.name.toLowerCase());
        if (employee.userId) employeeKeys.add(String(employee.userId).toLowerCase());
      }

      const assignedTasks = (tasks || []).filter(t => {
        const assignedTo = (t.assignedTo || '').toLowerCase();
        const createdBy = (t.createdBy || '').toLowerCase();
        const metaAssigned = (t.metadata?.assigned_to || t.metadata?.assignedTo || '').toLowerCase();
        const metaEmail = (t.metadata?.user_email || t.metadata?.userEmail || '').toLowerCase();
        const metaUserId = (t.metadata?.user_id || t.metadata?.userId || '').toLowerCase();

        return (
          employeeKeys.has(assignedTo) ||
          employeeKeys.has(createdBy) ||
          employeeKeys.has(metaAssigned) ||
          employeeKeys.has(metaEmail) ||
          employeeKeys.has(metaUserId)
        );
      });

      const now = new Date();
      let activeTasksCount = 0;
      let completedTasksCount = 0;
      let overdueTasksCount = 0;
      let upcomingTasksCount = 0;
      let taskLoadScore = 0;

      assignedTasks.forEach(t => {
        const status = (t.status || 'open').toLowerCase();
        const isDone = ['completed', 'done', 'closed', 'resolved'].includes(status);

        if (isDone) {
          completedTasksCount++;
        } else {
          activeTasksCount++;
          // Weighted task load: high = 3, medium = 2, low = 1
          const prio = (t.priority || 'medium').toLowerCase();
          const weight = prio === 'high' || prio === 'urgent' ? 3 : prio === 'low' ? 1 : 2;
          taskLoadScore += weight;

          if (t.dueDate) {
            const due = new Date(t.dueDate);
            if (!isNaN(due.getTime())) {
              if (due < now) {
                overdueTasksCount++;
              } else {
                upcomingTasksCount++;
              }
            }
          }
        }
      });

      return {
        employee: employee ? {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          department: employee.department
        } : null,
        employeeIdentifier,
        totalTasks: assignedTasks.length,
        activeTasksCount,
        completedTasksCount,
        overdueTasksCount,
        upcomingTasksCount,
        taskLoadScore,
        tasks: assignedTasks
      };
    } catch (err) {
      console.warn('[Scheduling Capability] Failed to compute staff schedule:', err);
      return emptyResult;
    }
  },

  /**
   * Get upcoming deadlines sorted chronologically.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters (e.g. limit)
   * @returns {Promise<Array>} List of tasks with upcoming deadlines
   */
  async getUpcomingDeadlines(companyId, options = {}) {
    if (!companyId) return [];

    try {
      const tasks = await TaskAdapter.getTasks(companyId, options);
      const activeTasksWithDates = (tasks || [])
        .filter(t => {
          const status = (t.status || 'open').toLowerCase();
          const isDone = ['completed', 'done', 'closed', 'resolved'].includes(status);
          return !isDone && t.dueDate;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      if (options.limit && options.limit > 0) {
        return activeTasksWithDates.slice(0, options.limit);
      }
      return activeTasksWithDates;
    } catch (err) {
      console.warn('[Scheduling Capability] Failed to fetch upcoming deadlines:', err);
      return [];
    }
  }
};

export default Scheduling;
