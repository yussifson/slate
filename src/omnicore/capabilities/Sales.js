import { CustomerAdapter } from '../core/CustomerAdapter';
import { ProductAdapter } from '../core/ProductAdapter';
import { TransactionAdapter } from '../core/TransactionAdapter';
import { PaymentAdapter } from '../core/PaymentAdapter';
import { CustomerManagement } from './CustomerManagement';

/**
 * Sales Capability
 * Read-composition layer composing Customer, Product, Transaction, and Payment adapters
 * to present sales overviews, top customer rankings, and customer sales profiles.
 */
export const Sales = {
  /**
   * Get high-level sales overview for a company.
   *
   * @param {string} companyId - Target tenant company identifier
   * @param {object} options - Optional parameters (e.g. period)
   * @returns {Promise<{ totalRevenue: number, totalTransactions: number, recentTransactions: Array, topCustomers: Array }>}
   */
  async getSalesOverview(companyId, options = {}) {
    const emptyOverview = {
      totalRevenue: 0,
      totalTransactions: 0,
      recentTransactions: [],
      topCustomers: []
    };

    if (!companyId) return emptyOverview;

    try {
      const [customers, products, transactions, payments] = await Promise.all([
        CustomerAdapter.getCustomers(companyId),
        ProductAdapter.getProducts(companyId),
        TransactionAdapter.getTransactions(companyId),
        PaymentAdapter.getPayments(companyId)
      ]);

      // Combine sales transactions and payments into unified sales feed
      const salesFeed = [];

      const isInPeriod = (dateStr) => {
        if (!options.startDate && !options.endDate) return true;
        if (!dateStr) return true;
        const d = new Date(dateStr).getTime();
        if (isNaN(d)) return true;
        if (options.startDate && d < new Date(options.startDate).getTime()) return false;
        if (options.endDate && d > new Date(options.endDate).getTime()) return false;
        return true;
      };

      (transactions || []).forEach(tx => {
        if ((tx.type === 'sale' || tx.type === 'journal_entry') && isInPeriod(tx.date || tx.createdAt || tx.created_at)) {
          salesFeed.push({
            id: tx.id,
            type: tx.type,
            amount: Number(tx.amount || 0),
            date: tx.date || tx.createdAt || tx.created_at,
            description: tx.description,
            customerId: tx.metadata?.customerId || tx.metadata?.clientId || null
          });
        }
      });

      (payments || []).forEach(p => {
        if (isInPeriod(p.paymentDate || p.createdAt || p.created_at)) {
          salesFeed.push({
            id: p.id,
            type: 'payment',
            amount: Number(p.amount || 0),
            date: p.paymentDate || p.createdAt || p.created_at,
            description: `Payment via ${p.paymentMethod}`,
            customerId: p.customerId || null
          });
        }
      });

      // Sort recent transactions descending by date
      salesFeed.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      const totalRevenue = salesFeed.reduce((sum, item) => sum + item.amount, 0);
      const totalTransactions = salesFeed.length;

      // Group revenue by customer
      const customerMap = new Map();
      salesFeed.forEach(item => {
        if (item.customerId) {
          const current = customerMap.get(item.customerId) || { totalSpent: 0, transactionCount: 0 };
          current.totalSpent += item.amount;
          current.transactionCount += 1;
          customerMap.set(item.customerId, current);
        }
      });

      const topCustomers = Array.from(customerMap.entries())
        .map(([cId, stats]) => {
          const cObj = (customers || []).find(c => c.id === cId);
          return {
            customerId: cId,
            name: cObj ? cObj.name : 'Unknown Customer',
            email: cObj ? cObj.email : null,
            totalSpent: stats.totalSpent,
            transactionCount: stats.transactionCount
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent);

      return {
        totalRevenue,
        totalTransactions,
        recentTransactions: salesFeed.slice(0, 10),
        topCustomers: topCustomers.slice(0, 5)
      };
    } catch (err) {
      console.warn('[Sales Capability] Failed to generate sales overview:', err);
      return emptyOverview;
    }
  },

  /**
   * Get detailed per-customer sales view.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {string} customerId - Target customer identifier
   * @returns {Promise<{ customerProfile: object|null, customerTransactions: Array, customerPayments: Array, summary: { totalSpent: number, transactionCount: number } }>}
   */
  async getCustomerSalesView(companyId, customerId) {
    if (!companyId || !customerId) {
      return {
        customerProfile: null,
        customerTransactions: [],
        customerPayments: [],
        summary: { totalSpent: 0, transactionCount: 0 }
      };
    }

    try {
      const [profile, allTransactions, allPayments] = await Promise.all([
        CustomerManagement.getCustomerProfile(companyId, customerId),
        TransactionAdapter.getTransactions(companyId),
        PaymentAdapter.getPayments(companyId)
      ]);

      const customerTransactions = (allTransactions || []).filter(tx => 
        tx.metadata?.customerId === customerId || tx.metadata?.clientId === customerId
      );

      const customerPayments = (allPayments || []).filter(p => p.customerId === customerId);

      const totalSpent = customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                         customerTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      const transactionCount = customerTransactions.length + customerPayments.length;

      return {
        customerProfile: profile.customer,
        customerTransactions,
        customerPayments,
        summary: {
          totalSpent,
          transactionCount
        }
      };
    } catch (err) {
      console.warn('[Sales Capability] Failed to generate customer sales view:', err);
      return {
        customerProfile: null,
        customerTransactions: [],
        customerPayments: [],
        summary: { totalSpent: 0, transactionCount: 0 }
      };
    }
  }
};

export default Sales;
