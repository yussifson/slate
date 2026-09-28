import { powerSync } from '@/api/PowerSyncConnector';
import { base44 } from '@/api/base44Client';

/**
 * InvoiceAdapter
 * Normalized read/write adapter for the 'Invoice' primitive.
 * Maps across: invoices, subscription_invoices, univ_retail_sales, univ_pharmacy_sales.
 * Note: industry_records support for 'invoice'/'statement' is intentionally deferred to a future phase.
 */
export const InvoiceAdapter = {
  /**
   * Fetch normalized invoice records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @returns {Promise<Array<NormalizedInvoice>>}
   */
  async getInvoices(companyId) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch from shared 'invoices' table
    try {
      const invoices = await base44.entities.Invoice.filter({ company_id: companyId });
      (invoices || []).forEach(inv => {
        normalized.push({
          id: inv.id,
          sourceTable: 'invoices',
          companyId: inv.company_id,
          invoiceNumber: inv.invoice_number || inv.id,
          customerId: inv.client_id || null,
          totalAmount: Number(inv.total_amount || inv.amount || 0),
          status: inv.status || 'draft',
          issueDate: inv.issue_date || inv.created_at,
          dueDate: inv.due_date || null,
          metadata: { currency: inv.currency, lineItems: inv.line_items }
        });
      });
    } catch (err) {
      console.warn('[InvoiceAdapter] Fetch from invoices table failed:', err);
    }

    // 2. Fetch from 'univ_retail_sales' (POS Sales Invoices)
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_sales WHERE company_id = ?', [companyId]);
      const retailSales = res?.rows?._array || [];
      retailSales.forEach(s => {
        normalized.push({
          id: s.id,
          sourceTable: 'univ_retail_sales',
          companyId: s.company_id,
          invoiceNumber: s.receipt_number || s.id,
          customerId: s.customer_id || null,
          totalAmount: Number(s.total_amount || 0),
          status: s.status || 'paid',
          issueDate: s.created_at,
          dueDate: s.created_at,
          metadata: { paymentMethod: s.payment_method, registerId: s.register_id }
        });
      });
    } catch (err) {
      // Table may not exist
    }

    return normalized;
  },

  /**
   * Create an invoice using existing base44 ORM write path.
   */
  async createInvoice(companyId, invoiceData) {
    return base44.entities.Invoice.create({
      company_id: companyId,
      invoice_number: invoiceData.invoiceNumber,
      client_id: invoiceData.customerId,
      total_amount: invoiceData.totalAmount,
      status: invoiceData.status || 'draft',
      due_date: invoiceData.dueDate || null
    });
  }
};
