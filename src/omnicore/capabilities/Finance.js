import { TransactionAdapter } from '../core/TransactionAdapter';
import { InvoiceAdapter } from '../core/InvoiceAdapter';
import { PaymentAdapter } from '../core/PaymentAdapter';
import { SupplierAdapter } from '../core/SupplierAdapter';
import { CustomerAdapter } from '../core/CustomerAdapter';

/**
 * Finance Capability
 * Read-composition layer composing Transaction, Invoice, Payment, and Supplier adapters
 * to present financial summaries, outstanding invoice metrics, revenue vs. expense comparisons, and cash flow projections.
 */
export const Finance = {
  /**
   * Get complete financial summary for a company.
   *
   * @param {string} companyId - Target tenant company identifier
   * @param {object} options - Optional filtering parameters
   * @returns {Promise<{ outstandingInvoices: { totalAmount: number, count: number }, revenueVsExpense: { totalRevenue: number, totalExpenses: number, netIncome: number }, cashFlow: { moneyIn: number, moneyOut: number, netCashFlow: number } }>}
   */
  async getFinancialSummary(companyId, options = {}) {
    const emptySummary = {
      outstandingInvoices: { totalAmount: 0, count: 0 },
      revenueVsExpense: { totalRevenue: 0, totalExpenses: 0, netIncome: 0 },
      cashFlow: { moneyIn: 0, moneyOut: 0, netCashFlow: 0 }
    };

    if (!companyId) return emptySummary;

    try {
      const [invoices, payments, transactions, suppliers] = await Promise.all([
        InvoiceAdapter.getInvoices(companyId),
        PaymentAdapter.getPayments(companyId),
        TransactionAdapter.getTransactions(companyId),
        SupplierAdapter.getSuppliers(companyId)
      ]);

      const isInPeriod = (dateStr) => {
        if (!options.startDate && !options.endDate) return true;
        if (!dateStr) return true;
        const d = new Date(dateStr).getTime();
        if (isNaN(d)) return true;
        if (options.startDate && d < new Date(options.startDate).getTime()) return false;
        if (options.endDate && d > new Date(options.endDate).getTime()) return false;
        return true;
      };

      // 1. Compute Outstanding Invoices Metrics
      const unpaidInvoices = (invoices || []).filter(inv => {
        const s = (inv.status || '').toLowerCase();
        const dateMatch = isInPeriod(inv.issueDate || inv.createdAt || inv.created_at);
        return s !== 'paid' && s !== 'cancelled' && s !== 'void' && dateMatch;
      });

      const outstandingTotal = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
      const outstandingCount = unpaidInvoices.length;

      // 2. Compute Revenue Metrics
      const invoiceRevenue = (invoices || [])
        .filter(inv => (inv.status || '').toLowerCase() === 'paid' && isInPeriod(inv.issueDate || inv.createdAt || inv.created_at))
        .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

      const paymentRevenue = (payments || [])
        .filter(p => ((p.status || '').toLowerCase() === 'paid' || (p.status || '').toLowerCase() === 'completed') && isInPeriod(p.paymentDate || p.createdAt || p.created_at))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const salesRevenue = (transactions || [])
        .filter(tx => tx.type === 'sale' && isInPeriod(tx.date || tx.createdAt || tx.created_at))
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      const totalRevenue = invoiceRevenue + paymentRevenue + salesRevenue;

      // 3. Compute Expense Metrics
      const totalExpenses = (transactions || [])
        .filter(tx => tx.type === 'expense' && isInPeriod(tx.date || tx.createdAt || tx.created_at))
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      const netIncome = totalRevenue - totalExpenses;

      // 4. Compute Cash Flow Metrics
      const moneyIn = paymentRevenue + invoiceRevenue;
      const moneyOut = totalExpenses;
      const netCashFlow = moneyIn - moneyOut;

      return {
        outstandingInvoices: {
          totalAmount: outstandingTotal,
          count: outstandingCount
        },
        revenueVsExpense: {
          totalRevenue,
          totalExpenses,
          netIncome
        },
        cashFlow: {
          moneyIn,
          moneyOut,
          netCashFlow
        }
      };
    } catch (err) {
      console.warn('[Finance Capability] Failed to generate financial summary:', err);
      return emptySummary;
    }
  },

  /**
   * Get list of individual outstanding / unpaid invoices with customer information.
   *
   * @param {string} companyId - Target tenant company identifier
   * @returns {Promise<Array>} List of outstanding invoice objects
   */
  async getOutstandingInvoices(companyId) {
    if (!companyId) return [];
    try {
      const [invoices, customers] = await Promise.all([
        InvoiceAdapter.getInvoices(companyId),
        CustomerAdapter.getCustomers(companyId)
      ]);

      const unpaid = (invoices || []).filter(inv => {
        const s = (inv.status || '').toLowerCase();
        return s !== 'paid' && s !== 'cancelled' && s !== 'void';
      });

      return unpaid.map(inv => {
        const cust = (customers || []).find(c => c.id === inv.customerId);
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || inv.id,
          customerId: inv.customerId,
          customerName: cust ? cust.name : (inv.customerName || 'Unknown Customer'),
          customerEmail: cust ? cust.email : (inv.customerEmail || null),
          totalAmount: Number(inv.totalAmount) || 0,
          status: inv.status || 'unpaid',
          dueDate: inv.dueDate || null,
          issueDate: inv.issueDate || inv.createdAt || inv.created_at || null
        };
      });
    } catch (err) {
      console.warn('[Finance Capability] Failed to get outstanding invoices:', err);
      return [];
    }
  }
};

export default Finance;
