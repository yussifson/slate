import { ProductAdapter } from '../core/ProductAdapter';
import { SupplierAdapter } from '../core/SupplierAdapter';
import { TransactionAdapter } from '../core/TransactionAdapter';

/**
 * Inventory Capability
 * Read-composition layer composing ProductAdapter, SupplierAdapter, and TransactionAdapter.
 * Detects low-stock products with strict threshold provenance ('configured' vs 'default')
 * and generates supplier-linked reorder views.
 */
export const Inventory = {
  /**
   * Get high-level inventory overview metrics.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Options { defaultThreshold?: number }
   * @returns {Promise<{ totalItems: number, totalStockUnits: number, totalInventoryValue: number, lowStockCount: number, outOfStockCount: number }>}
   */
  async getInventoryOverview(companyId, options = {}) {
    const emptyOverview = {
      totalItems: 0,
      totalStockUnits: 0,
      totalInventoryValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };

    if (!companyId) return emptyOverview;

    try {
      const products = await ProductAdapter.getProducts(companyId, options);
      const inventoryProducts = (products || []).filter(p => p.stockQuantity !== null && p.stockQuantity !== undefined);

      if (inventoryProducts.length === 0) return emptyOverview;

      const lowStockAlerts = await this.getLowStockAlerts(companyId, options);

      const totalItems = inventoryProducts.length;
      let totalStockUnits = 0;
      let totalInventoryValue = 0;
      let outOfStockCount = 0;

      inventoryProducts.forEach(p => {
        const qty = Number(p.stockQuantity) || 0;
        const unitVal = Number(p.cost) > 0 ? Number(p.cost) : (Number(p.price) || 0);
        totalStockUnits += qty;
        totalInventoryValue += qty * unitVal;
        if (qty === 0) outOfStockCount++;
      });

      return {
        totalItems,
        totalStockUnits,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
        lowStockCount: lowStockAlerts.length,
        outOfStockCount
      };
    } catch (err) {
      console.warn('[Inventory] Failed to compute inventory overview:', err);
      return emptyOverview;
    }
  },

  /**
   * Get list of low stock and out-of-stock items with explicit threshold provenance.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - { defaultThreshold?: number }
   * @returns {Promise<Array<{ id: string, name: string, sku: string|null, type: string, stockQuantity: number, reorderThreshold: number, thresholdSource: 'configured'|'default', deficit: number, isOutOfStock: boolean, supplier: string|null, category: string|null, cost: number, price: number }>>}
   */
  async getLowStockAlerts(companyId, options = {}) {
    if (!companyId) return [];
    const defaultThreshold = typeof options.defaultThreshold === 'number' ? options.defaultThreshold : 10;

    try {
      const products = await ProductAdapter.getProducts(companyId, options);
      const inventoryProducts = (products || []).filter(p => p.stockQuantity !== null && p.stockQuantity !== undefined);

      const alerts = [];

      inventoryProducts.forEach(p => {
        const stockQty = Number(p.stockQuantity) || 0;
        const hasConfiguredThreshold = p.reorderThreshold !== null && p.reorderThreshold !== undefined;
        const threshold = hasConfiguredThreshold ? Number(p.reorderThreshold) : defaultThreshold;
        const thresholdSource = hasConfiguredThreshold ? 'configured' : 'default';

        if (stockQty <= threshold) {
          alerts.push({
            id: p.id,
            name: p.name || 'Unnamed Product',
            sku: p.sku || null,
            type: p.type || 'physical_good',
            stockQuantity: stockQty,
            reorderThreshold: threshold,
            thresholdSource,
            deficit: Math.max(0, threshold - stockQty),
            isOutOfStock: stockQty === 0,
            supplier: p.metadata?.supplier || null,
            category: p.metadata?.category || null,
            cost: Number(p.cost || 0),
            price: Number(p.price || 0)
          });
        }
      });

      return alerts;
    } catch (err) {
      console.warn('[Inventory] Failed to compute low stock alerts:', err);
      return [];
    }
  },

  /**
   * Get supplier-linked reorder recommendations.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<{ supplierGroups: Array<{ supplierName: string, items: Array, totalReorderCost: number }>, unassignedItems: Array }>}
   */
  async getSupplierReorderView(companyId, options = {}) {
    if (!companyId) return { supplierGroups: [], unassignedItems: [] };

    try {
      const [lowStockAlerts, suppliers] = await Promise.all([
        this.getLowStockAlerts(companyId, options),
        SupplierAdapter.getSuppliers(companyId, options)
      ]);

      const supplierMap = new Map();
      const unassignedItems = [];

      lowStockAlerts.forEach(item => {
        const supplierName = item.supplier;
        if (supplierName) {
          if (!supplierMap.has(supplierName)) {
            supplierMap.set(supplierName, []);
          }
          supplierMap.get(supplierName).push(item);
        } else {
          unassignedItems.push(item);
        }
      });

      const supplierGroups = Array.from(supplierMap.entries()).map(([supplierName, items]) => {
        const totalReorderCost = items.reduce((sum, it) => {
          const unitCost = it.cost > 0 ? it.cost : it.price;
          return sum + (it.deficit * unitCost);
        }, 0);

        return {
          supplierName,
          items,
          totalReorderCost: Number(totalReorderCost.toFixed(2))
        };
      });

      return {
        supplierGroups,
        unassignedItems
      };
    } catch (err) {
      console.warn('[Inventory] Failed to compute supplier reorder view:', err);
      return { supplierGroups: [], unassignedItems: [] };
    }
  }
};

export default Inventory;
