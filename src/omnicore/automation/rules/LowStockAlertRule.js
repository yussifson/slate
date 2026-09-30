/**
 * OmniCore Low-Stock Automation Rule (Phase B)
 * 
 * WHEN inventory stock is low IF stockQuantity <= reorderThreshold
 * THEN create an itemized reorder and notification task referencing the product,
 * current stock, deficit, and supplier.
 * 
 * Pure composition, idempotent, and condition-checked.
 */

export const LowStockAlertRule = {
  id: 'rule_low_stock_reorder_task',
  name: 'Low-Stock Reorder Task',
  description: 'WHEN an item stock is low IF stockQuantity <= reorderThreshold THEN create a reorder task referencing the item, deficit, and supplier.',
  trigger: 'inventory_low_stock',
  enabled: true,

  /**
   * Evaluate rule against low stock candidates
   * 
   * @param {object} context - { companyId, lowStockAlerts, existingTasks, options }
   * @returns {Array<object>} List of evaluated rule matches
   */
  evaluate(context = {}) {
    const { lowStockAlerts = [], existingTasks = [], options = {} } = context;

    const matches = [];

    for (const item of lowStockAlerts) {
      const stock = Number(item.stockQuantity ?? 0);
      const threshold = Number(item.reorderThreshold ?? 10);
      const deficit = Number(item.deficit ?? (threshold - stock));
      const productId = String(item.id || '');
      const productName = item.name || 'Inventory Item';
      const supplierName = item.supplier || null;

      // IF condition: stockQuantity <= reorderThreshold
      if (stock <= threshold) {
        // Idempotency check: does an active / open reorder task already exist for this product?
        const alreadyActioned = (existingTasks || []).some(t => {
          const s = (t.status || '').toLowerCase();
          const isOpen = s !== 'completed' && s !== 'done' && s !== 'closed' && s !== 'cancelled';
          const matchRef = (t.metadata?.productId === productId) ||
                          (t.title && t.title.includes(productName)) ||
                          (t.metadata?.ruleId === this.id && t.metadata?.sku === item.sku);
          return isOpen && matchRef;
        });

        const priority = stock <= 0 ? 'urgent' : deficit >= 10 ? 'high' : 'medium';

        const candidateTask = {
          title: `Reorder Low-Stock Item: ${productName}`,
          description: `Automated inventory alert: ${productName} (SKU: ${item.sku || 'N/A'}) has ${stock} units remaining (threshold: ${threshold}, deficit: ${deficit} units). Supplier: ${supplierName || 'Unassigned'}.`,
          priority,
          status: 'todo',
          metadata: {
            source: 'automation_engine',
            ruleId: this.id,
            productId,
            sku: item.sku || null,
            supplier: supplierName,
            stockQuantity: stock,
            reorderThreshold: threshold,
            deficit
          }
        };

        matches.push({
          ruleId: this.id,
          ruleName: this.name,
          trigger: this.trigger,
          triggerData: {
            productId,
            productName,
            sku: item.sku,
            supplier: supplierName,
            stockQuantity: stock,
            reorderThreshold: threshold,
            deficit
          },
          conditionMet: true,
          conditionDetails: `stockQuantity (${stock}) <= reorderThreshold (${threshold})`,
          alreadyActioned,
          actionType: 'create_task',
          candidateTask,
          explanation: `${productName} is below threshold (${stock}/${threshold} units, deficit: ${deficit}). ${alreadyActioned ? 'Open reorder task already exists (skipped).' : 'Candidate reorder task will be created.'}`
        });
      }
    }

    return matches;
  }
};

export default LowStockAlertRule;
