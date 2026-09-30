import { base44 } from '@/api/base44Client';

/**
 * EmployeeAdapter
 * Normalized read/write adapter for the 'Employee/Staff' primitive.
 * Primary sources: staff_records and profiles.
 * Write target: base44.entities.StaffRecord.create (tenant-scoped, RBAC-respecting).
 */
export const EmployeeAdapter = {
  /**
   * Fetch normalized employee/staff records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<NormalizedEmployee>>}
   */
  async getEmployees(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];
    const seenUserIds = new Set();
    const seenEmails = new Set();

    // 1. Fetch from 'staff_records' table (primary detailed HR/staff entity)
    try {
      const staffRecords = await base44.entities.StaffRecord.filter({ company_id: companyId });
      (staffRecords || []).forEach(sr => {
        if (sr.user_id) seenUserIds.add(sr.user_id);
        if (sr.user_email) seenEmails.add(sr.user_email.toLowerCase());

        normalized.push({
          id: sr.id,
          sourceTable: 'staff_records',
          companyId: sr.company_id,
          userId: sr.user_id || null,
          name: sr.full_name || 'Staff Member',
          email: sr.user_email || null,
          phone: sr.phone || null,
          role: sr.role || 'employee',
          department: sr.department || 'general',
          status: sr.status || 'active',
          hireDate: sr.hire_date || null,
          salary: sr.salary != null ? Number(sr.salary) : null,
          currency: sr.currency || 'USD',
          leaveBalance: sr.leave_balance != null ? Number(sr.leave_balance) : null,
          metadata: {
            barNumber: sr.bar_number || null
          }
        });
      });
    } catch (err) {
      console.warn('[EmployeeAdapter] Fetch from staff_records failed:', err);
    }

    // 2. Fetch from 'profiles' table to capture platform users in the tenant not yet in staff_records
    try {
      const profiles = await base44.entities.Profile.filter({ company_id: companyId });
      (profiles || []).forEach(p => {
        const emailLower = (p.email || '').toLowerCase();
        if ((p.id && seenUserIds.has(p.id)) || (emailLower && seenEmails.has(emailLower))) {
          return; // Skip duplicate already represented by staff_records
        }

        normalized.push({
          id: p.id,
          sourceTable: 'profiles',
          companyId: p.company_id,
          userId: p.id,
          name: p.email ? p.email.split('@')[0] : 'User Profile',
          email: p.email || null,
          phone: p.phone || null,
          role: p.role || 'user',
          department: p.department || 'general',
          status: 'active',
          hireDate: null,
          salary: null,
          currency: 'USD',
          leaveBalance: null,
          metadata: {
            avatarUrl: p.avatar_url || null,
            barNumber: p.bar_number || null,
            companyName: p.company_name || null
          }
        });
      });
    } catch (err) {
      console.warn('[EmployeeAdapter] Fetch from profiles failed:', err);
    }

    return normalized;
  },

  /**
   * Create an employee record in staff_records.
   *
   * @param {string} companyId - Target company_id
   * @param {object} employeeData - Employee details
   * @returns {Promise<object>} Created record
   */
  async createEmployee(companyId, employeeData) {
    if (!companyId) throw new Error('Missing companyId');
    if (!employeeData || !employeeData.name) {
      throw new Error('Employee name is required');
    }

    return base44.entities.StaffRecord.create({
      company_id: companyId,
      full_name: employeeData.name,
      user_email: employeeData.email || null,
      phone: employeeData.phone || null,
      role: employeeData.role || 'employee',
      department: employeeData.department || 'general',
      status: employeeData.status || 'active',
      hire_date: employeeData.hireDate || null,
      salary: employeeData.salary != null ? Number(employeeData.salary) : null,
      currency: employeeData.currency || 'USD',
      leave_balance: employeeData.leaveBalance != null ? Number(employeeData.leaveBalance) : 0,
      bar_number: employeeData.barNumber || null
    });
  }
};
