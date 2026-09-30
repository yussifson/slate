import { EmployeeAdapter } from '../core/EmployeeAdapter';
import { TaskAdapter } from '../core/TaskAdapter';

/**
 * HR Capability
 * Read-composition layer composing EmployeeAdapter and TaskAdapter.
 * Presents employee directory metrics, department/role distributions,
 * payroll insights, and employee-specific onboarding and operational tasks.
 */
export const HR = {
  /**
   * Get complete HR and headcount overview.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<{ totalHeadcount: number, activeHeadcount: number, departmentBreakdown: object, roleBreakdown: object, totalPayrollSalary: number, averageSalary: number }>}
   */
  async getHROverview(companyId, options = {}) {
    const emptyOverview = {
      totalHeadcount: 0,
      activeHeadcount: 0,
      departmentBreakdown: {},
      roleBreakdown: {},
      totalPayrollSalary: 0,
      averageSalary: 0
    };

    if (!companyId) return emptyOverview;

    try {
      const employees = await EmployeeAdapter.getEmployees(companyId, options);
      if (!employees || employees.length === 0) return emptyOverview;

      const totalHeadcount = employees.length;
      let activeHeadcount = 0;
      const departmentBreakdown = {};
      const roleBreakdown = {};
      let totalPayrollSalary = 0;
      let salariedCount = 0;

      employees.forEach(emp => {
        const status = (emp.status || 'active').toLowerCase();
        if (status === 'active') activeHeadcount++;

        const dept = emp.department || 'general';
        departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;

        const role = emp.role || 'employee';
        roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;

        if (emp.salary != null && Number(emp.salary) > 0) {
          totalPayrollSalary += Number(emp.salary);
          salariedCount++;
        }
      });

      const averageSalary = salariedCount > 0 ? Number((totalPayrollSalary / salariedCount).toFixed(2)) : 0;

      return {
        totalHeadcount,
        activeHeadcount,
        departmentBreakdown,
        roleBreakdown,
        totalPayrollSalary: Number(totalPayrollSalary.toFixed(2)),
        averageSalary
      };
    } catch (err) {
      console.warn('[HR] Failed to compute HR overview:', err);
      return emptyOverview;
    }
  },

  /**
   * Get list of all employees in directory.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array>} Normalized employee records
   */
  async getEmployeeDirectory(companyId, options = {}) {
    if (!companyId) return [];
    try {
      return await EmployeeAdapter.getEmployees(companyId, options);
    } catch (err) {
      console.warn('[HR] Failed to fetch employee directory:', err);
      return [];
    }
  },

  /**
   * Get operational and onboarding tasks assigned to a specific employee.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {string} employeeIdentifier - Employee ID, user_id, or email
   * @param {object} options - Optional query parameters
   * @returns {Promise<{ employeeIdentifier: string, totalTasks: number, openTasks: number, completedTasks: number, tasks: Array }>}
   */
  async getEmployeeTasks(companyId, employeeIdentifier, options = {}) {
    const emptyResult = {
      employeeIdentifier: employeeIdentifier || null,
      totalTasks: 0,
      openTasks: 0,
      completedTasks: 0,
      tasks: []
    };

    if (!companyId || !employeeIdentifier) return emptyResult;

    try {
      const allTasks = await TaskAdapter.getTasks(companyId, options);
      const target = String(employeeIdentifier).toLowerCase();

      const employeeTasks = (allTasks || []).filter(t => {
        const assignedTo = (t.assignedTo || '').toLowerCase();
        const createdBy = (t.createdBy || '').toLowerCase();
        const metaAssigned = (t.metadata?.assigned_to || t.metadata?.assignedTo || '').toLowerCase();
        const metaEmail = (t.metadata?.user_email || t.metadata?.userEmail || '').toLowerCase();
        const metaUserId = (t.metadata?.user_id || t.metadata?.userId || '').toLowerCase();

        return (
          assignedTo === target ||
          createdBy === target ||
          metaAssigned === target ||
          metaEmail === target ||
          metaUserId === target
        );
      });

      let openTasks = 0;
      let completedTasks = 0;

      employeeTasks.forEach(t => {
        const s = (t.status || '').toLowerCase();
        if (s === 'completed' || s === 'done' || s === 'closed') {
          completedTasks++;
        } else {
          openTasks++;
        }
      });

      return {
        employeeIdentifier,
        totalTasks: employeeTasks.length,
        openTasks,
        completedTasks,
        tasks: employeeTasks
      };
    } catch (err) {
      console.warn('[HR] Failed to fetch employee tasks:', err);
      return emptyResult;
    }
  }
};

export default HR;
