import { CustomerAdapter } from '../core/CustomerAdapter';
import { TaskAdapter } from '../core/TaskAdapter';
import { InvoiceAdapter } from '../core/InvoiceAdapter';

/**
 * CustomerManagement Capability
 * Read-composition layer that composes CustomerAdapter, TaskAdapter, and InvoiceAdapter
 * to present a unified Customer Profile with associated tasks, invoices, and financial summary metrics.
 */
export const CustomerManagement = {
  /**
   * Get complete customer profile composed from core adapters.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {string} customerId - Target customer identifier
   * @returns {Promise<{ customer: object|null, tasks: Array, invoices: Array, summary: { openTaskCount: number, totalInvoiced: number, totalOutstanding: number } }>}
   */
  async getCustomerProfile(companyId, customerId) {
    const emptyProfile = {
      customer: null,
      tasks: [],
      invoices: [],
      summary: {
        openTaskCount: 0,
        totalInvoiced: 0,
        totalOutstanding: 0
      }
    };

    if (!companyId || !customerId) {
      return emptyProfile;
    }

    try {
      // 1. Fetch customer via CustomerAdapter
      const allCustomers = await CustomerAdapter.getCustomers(companyId);
      const customer = (allCustomers || []).find(c => c.id === customerId) || null;

      // If customer does not exist under this tenant, return empty profile safely
      if (!customer) {
        return emptyProfile;
      }

      // 2. Fetch tasks via TaskAdapter and filter for customer association
      const allTasks = await TaskAdapter.getTasks(companyId);
      const customerTasks = (allTasks || []).filter(t => 
        t.customerId === customerId ||
        t.metadata?.customerId === customerId ||
        t.metadata?.clientId === customerId ||
        t.metadata?.client_id === customerId
      );

      // 3. Fetch invoices via InvoiceAdapter and filter by customerId
      const allInvoices = await InvoiceAdapter.getInvoices(companyId);
      const customerInvoices = (allInvoices || []).filter(inv => inv.customerId === customerId);

      // 4. Compute summary metrics safely from real adapter data
      const openTaskCount = customerTasks.filter(t => {
        const s = (t.status || '').toLowerCase();
        return s !== 'completed' && s !== 'done' && s !== 'closed';
      }).length;

      const totalInvoiced = customerInvoices.reduce((sum, inv) => {
        const amount = Number(inv.totalAmount) || 0;
        return sum + amount;
      }, 0);

      const totalOutstanding = customerInvoices.reduce((sum, inv) => {
        const status = (inv.status || '').toLowerCase();
        if (status !== 'paid' && status !== 'cancelled' && status !== 'void') {
          const amount = Number(inv.totalAmount) || 0;
          return sum + amount;
        }
        return sum;
      }, 0);

      return {
        customer,
        tasks: customerTasks,
        invoices: customerInvoices,
        summary: {
          openTaskCount,
          totalInvoiced,
          totalOutstanding
        }
      };
    } catch (err) {
      console.warn('[CustomerManagement] Failed to compose customer profile:', err);
      return emptyProfile;
    }
  },

  /**
   * Get all customers for a tenant company.
   *
   * @param {string} companyId - Tenant company identifier
   * @returns {Promise<Array>} List of customers
   */
  async getCustomers(companyId) {
    if (!companyId) return [];
    try {
      return await CustomerAdapter.getCustomers(companyId);
    } catch (err) {
      console.warn('[CustomerManagement] Failed to fetch customers:', err);
      return [];
    }
  },

  /**
   * Get all customers with their composed activity profiles for inactivity and health analysis.
   *
   * @param {string} companyId - Tenant company identifier
   * @returns {Promise<Array>} List of composed customer activity objects
   */
  async getCustomerActivityList(companyId) {
    if (!companyId) return [];
    try {
      const [customers, invoices, tasks] = await Promise.all([
        CustomerAdapter.getCustomers(companyId),
        InvoiceAdapter.getInvoices(companyId),
        TaskAdapter.getTasks(companyId)
      ]);

      return (customers || []).map(c => {
        const cInvoices = (invoices || []).filter(inv => inv.customerId === c.id);
        const cTasks = (tasks || []).filter(t => 
          t.customerId === c.id ||
          t.metadata?.customerId === c.id ||
          t.metadata?.clientId === c.id ||
          t.metadata?.client_id === c.id
        );

        // Find most recent activity date among invoices, tasks, or customer record
        const activityDates = [
          c.created_at || c.createdAt,
          ...cInvoices.map(i => i.issueDate || i.created_at || i.createdAt),
          ...cTasks.map(t => t.updated_at || t.created_at || t.createdAt)
        ].filter(Boolean).map(d => new Date(d).getTime()).filter(t => !isNaN(t));

        const lastActivityTimestamp = activityDates.length > 0 ? Math.max(...activityDates) : null;
        const totalSpent = cInvoices
          .filter(i => (i.status || '').toLowerCase() === 'paid')
          .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

        return {
          id: c.id,
          name: c.name || 'Unknown Customer',
          email: c.email || null,
          phone: c.phone || null,
          lastActivityDate: lastActivityTimestamp ? new Date(lastActivityTimestamp).toISOString() : null,
          invoiceCount: cInvoices.length,
          taskCount: cTasks.length,
          totalSpent
        };
      });
    } catch (err) {
      console.warn('[CustomerManagement] Failed to fetch customer activity list:', err);
      return [];
    }
  }
};

export default CustomerManagement;
