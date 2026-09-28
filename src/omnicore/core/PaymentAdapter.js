import { powerSync } from '@/api/PowerSyncConnector';
import { base44 } from '@/api/base44Client';

/**
 * PaymentAdapter
 * Normalized read/write adapter for the 'Payment' primitive.
 * Primary sources: subscription_invoices, retainers, univ_retail_sales.
 * Note: univ_re_rent_payments, univ_re_commission_payouts, and industry_records for 'payment_entry' are intentionally deferred.
 */
export const PaymentAdapter = {
  /**
   * Fetch normalized payment records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<NormalizedPayment>>}
   */
  async getPayments(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch subscription invoice payments from 'subscription_invoices'
    try {
      const subInvoices = await base44.entities.SubscriptionInvoice.filter({ company_id: companyId });
      (subInvoices || []).forEach(si => {
        normalized.push({
          id: si.id,
          sourceTable: 'subscription_invoices',
          companyId: si.company_id,
          customerId: null,
          amount: Number(si.amount_paid || si.amount || 0),
          paymentMethod: si.payment_method || 'stripe',
          status: si.status || 'paid',
          paymentDate: si.paid_at || si.created_at,
          referenceNumber: si.stripe_invoice_id || si.id,
          metadata: { plan: si.plan_key }
        });
      });
    } catch (err) {
      console.warn('[PaymentAdapter] Fetch from subscription_invoices failed:', err);
    }

    // 2. Fetch client retainer payments from 'retainers'
    try {
      const retainers = await base44.entities.Retainer.filter({ company_id: companyId });
      (retainers || []).forEach(ret => {
        normalized.push({
          id: ret.id,
          sourceTable: 'retainers',
          companyId: ret.company_id,
          customerId: ret.client_id || null,
          amount: Number(ret.amount || 0),
          paymentMethod: ret.payment_method || 'bank_transfer',
          status: ret.status || 'paid',
          paymentDate: ret.created_at,
          referenceNumber: ret.id,
          metadata: { caseId: ret.case_id, notes: ret.notes }
        });
      });
    } catch (err) {
      console.warn('[PaymentAdapter] Fetch from retainers failed:', err);
    }

    // 3. Fetch POS retail tender payments from 'univ_retail_sales'
    try {
      const res = await powerSync.execute(
        'SELECT id, company_id, customer_id, total_amount, payment_method, status, created_at FROM univ_retail_sales WHERE company_id = ?',
        [companyId]
      );
      const retailSales = res?.rows?._array || [];
      retailSales.forEach(s => {
        normalized.push({
          id: `pay-${s.id}`,
          sourceTable: 'univ_retail_sales',
          companyId: s.company_id,
          customerId: s.customer_id || null,
          amount: Number(s.total_amount || 0),
          paymentMethod: s.payment_method || 'cash',
          status: s.status || 'completed',
          paymentDate: s.created_at,
          referenceNumber: s.id,
          metadata: { saleId: s.id }
        });
      });
    } catch (err) {
      // Table may not exist or query fallback
    }

    return normalized;
  },

  /**
   * Create a payment record.
   * Note: Direct general payment creation via base44 ORM is not supported; use invoice/retainer APIs.
   */
  async createPayment(companyId, paymentData) {
    if (!companyId) throw new Error('Missing companyId');
    throw new Error('[PaymentAdapter] Direct general payment creation via base44 ORM is not implemented; payments must be recorded via invoice or transaction APIs.');
  }
};
