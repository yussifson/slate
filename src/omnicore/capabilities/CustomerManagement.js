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
  }
};

export default CustomerManagement;
