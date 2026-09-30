import { SupplierAdapter } from '../core/SupplierAdapter';
import { ProductAdapter } from '../core/ProductAdapter';
import { TransactionAdapter } from '../core/TransactionAdapter';
import { Inventory } from './Inventory';

/**
 * Purchasing Capability
 * Read-composition layer composing SupplierAdapter, ProductAdapter, TransactionAdapter, and Inventory.
 * Provides spend-by-supplier analytics and actionable reorder recommendations
 * directly reusing Inventory's low-stock signal without duplicating threshold logic.
 */
export const Purchasing = {
  /**
   * Get purchasing and supplier spend overview.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<{ totalSuppliers: number, totalSpend: number, spendBySupplier: object, activeSuppliersCount: number }>}
   */
  async getPurchasingOverview(companyId, options = {}) {
    const emptyOverview = {
      totalSuppliers: 0,
      totalSpend: 0,
      spendBySupplier: {},
      activeSuppliersCount: 0
    };

    if (!companyId) return emptyOverview;

    try {
      const [suppliers, transactions] = await Promise.all([
        SupplierAdapter.getSuppliers(companyId, options),
        TransactionAdapter.getTransactions(companyId, options)
      ]);

      const totalSuppliers = (suppliers || []).length;
      const activeSuppliersCount = (suppliers || []).filter(s => (s.status || 'active').toLowerCase() === 'active').length;

      // Filter expense/purchase transactions
      const expenseTransactions = (transactions || []).filter(t => t.type === 'expense');

      const spendBySupplier = {};
      let totalSpend = 0;

      expenseTransactions.forEach(t => {
        const amount = Number(t.amount) || 0;
        totalSpend += amount;

        const vendorName = t.metadata?.vendor || t.metadata?.payee || t.metadata?.category || 'General Vendor';
        if (!spendBySupplier[vendorName]) {
          spendBySupplier[vendorName] = {
            totalSpend: 0,
            transactionCount: 0
          };
        }
        spendBySupplier[vendorName].totalSpend = Number((spendBySupplier[vendorName].totalSpend + amount).toFixed(2));
        spendBySupplier[vendorName].transactionCount += 1;
      });

      return {
        totalSuppliers,
        activeSuppliersCount,
        totalSpend: Number(totalSpend.toFixed(2)),
        spendBySupplier
      };
    } catch (err) {
      console.warn('[Purchasing] Failed to compute purchasing overview:', err);
      return emptyOverview;
    }
  },

  /**
   * Get reorder recommendations grouped by supplier, directly reusing Inventory's low-stock logic.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<{ recommendations: Array<{ supplierName: string, itemsToReorder: Array, estimatedCost: number }>, unassignedItems: Array, totalEstimatedReorderSpend: number }>}
   */
  async getReorderRecommendations(companyId, options = {}) {
    if (!companyId) return { recommendations: [], unassignedItems: [], totalEstimatedReorderSpend: 0 };

    try {
      // Direct reuse of Inventory capability's threshold-checked low-stock signal
      const lowStockAlerts = await Inventory.getLowStockAlerts(companyId, options);

      const supplierMap = new Map();
      const unassignedItems = [];
      let totalEstimatedReorderSpend = 0;

      lowStockAlerts.forEach(item => {
        const unitCost = item.cost > 0 ? item.cost : item.price;
        const reorderCost = item.deficit * unitCost;
        totalEstimatedReorderSpend += reorderCost;

        const itemSummary = {
          id: item.id,
          name: item.name,
          sku: item.sku,
          stockQuantity: item.stockQuantity,
          reorderThreshold: item.reorderThreshold,
          thresholdSource: item.thresholdSource,
          deficit: item.deficit,
          unitCost,
          estimatedCost: Number(reorderCost.toFixed(2))
        };

        const supplierName = item.supplier;
        if (supplierName) {
          if (!supplierMap.has(supplierName)) {
            supplierMap.set(supplierName, []);
          }
          supplierMap.get(supplierName).push(itemSummary);
        } else {
          unassignedItems.push(itemSummary);
        }
      });

      const recommendations = Array.from(supplierMap.entries()).map(([supplierName, itemsToReorder]) => {
        const estimatedCost = itemsToReorder.reduce((sum, it) => sum + it.estimatedCost, 0);
        return {
          supplierName,
          itemsToReorder,
          estimatedCost: Number(estimatedCost.toFixed(2))
        };
      });

      return {
        recommendations,
        unassignedItems,
        totalEstimatedReorderSpend: Number(totalEstimatedReorderSpend.toFixed(2))
      };
    } catch (err) {
      console.warn('[Purchasing] Failed to compute reorder recommendations:', err);
      return { recommendations: [], unassignedItems: [], totalEstimatedReorderSpend: 0 };
    }
  }
};

export default Purchasing;
