import { powerSync } from '@/api/PowerSyncConnector';
import { base44 } from '@/api/base44Client';

/**
 * TransactionAdapter
 * Normalized read/write adapter for the 'Transaction' primitive.
 * Primary sources: journal_entries, expenses, univ_retail_sales.
 * Note: univ_re_trust_transactions, univ_re_offers, and industry_records for 'financial_transaction' are intentionally deferred.
 */
export const TransactionAdapter = {
  /**
   * Fetch normalized financial transaction records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<NormalizedTransaction>>}
   */
  async getTransactions(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch double-entry accounting transactions from 'journal_entries'
    try {
      const journalEntries = await base44.entities.JournalEntry.filter({ company_id: companyId });
      (journalEntries || []).forEach(je => {
        normalized.push({
          id: je.id,
          sourceTable: 'journal_entries',
          companyId: je.company_id,
          type: je.type || 'journal_entry',
          amount: Number(je.amount || je.debit || je.credit || 0),
          currency: je.currency || 'USD',
          date: je.entry_date || je.created_at,
          description: je.description || je.memo || 'Journal Transaction',
          status: je.status || 'posted',
          metadata: { accountId: je.account_id, referenceNumber: je.reference_number }
        });
      });
    } catch (err) {
      console.warn('[TransactionAdapter] Fetch from journal_entries failed:', err);
    }

    // 2. Fetch expense transactions from 'expenses'
    try {
      const expenses = await base44.entities.Expense.filter({ company_id: companyId });
      (expenses || []).forEach(exp => {
        normalized.push({
          id: exp.id,
          sourceTable: 'expenses',
          companyId: exp.company_id,
          type: 'expense',
          amount: Number(exp.amount || 0),
          currency: exp.currency || 'USD',
          date: exp.date || exp.created_at,
          description: exp.description || `Expense to ${exp.vendor || 'Vendor'}`,
          status: exp.status || 'approved',
          metadata: { vendor: exp.vendor, category: exp.category }
        });
      });
    } catch (err) {
      console.warn('[TransactionAdapter] Fetch from expenses failed:', err);
    }

    // 3. Fetch POS retail sales transactions from 'univ_retail_sales'
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_sales WHERE company_id = ?', [companyId]);
      const retailSales = res?.rows?._array || [];
      retailSales.forEach(s => {
        normalized.push({
          id: s.id,
          sourceTable: 'univ_retail_sales',
          companyId: s.company_id,
          type: 'sale',
          amount: Number(s.total_amount || 0),
          currency: 'USD',
          date: s.created_at,
          description: `Retail POS Sale #${s.receipt_number || s.id}`,
          status: s.status || 'completed',
          metadata: { paymentMethod: s.payment_method, registerId: s.register_id }
        });
      });
    } catch (err) {
      // Table may not exist or query fallback
    }

    return normalized;
  },

  /**
   * Create a financial transaction record using existing base44 ORM write path (inherits RBAC enforcement).
   */
  async createTransaction(companyId, transactionData) {
    if (!companyId) throw new Error('Missing companyId');
    return base44.entities.JournalEntry.create({
      company_id: companyId,
      description: transactionData.description || 'General Transaction',
      amount: transactionData.amount || 0,
      entry_date: transactionData.date || new Date().toISOString(),
      status: transactionData.status || 'posted'
    });
  }
};
