/**
 * OmniCore Action Center (Phase 8 & Phase B)
 * 
 * Transforms Business Intelligence, Finance receivables, Business Health,
 * Inventory alerts, and Operational deadlines into a concrete, itemized list of actionable recommendations.
 * 
 * Composition-only, tenant-scoped, and recommendation-only (zero writes/execution).
 */
import { Finance } from '../capabilities/Finance.js';
import { CustomerManagement } from '../capabilities/CustomerManagement.js';
import { Inventory } from '../capabilities/Inventory.js';
import { Scheduling } from '../capabilities/Scheduling.js';
import { BusinessIntelligence } from './BusinessIntelligence.js';
import { BusinessHealth } from './BusinessHealth.js';

const HEALTH_RECOMMENDATIONS = {
  sales: 'Review sales pipeline, discount strategy, and recent deal velocities.',
  finance: 'Audit outstanding receivables, follow up on aging accounts, and review cash flow.',
  customers: 'Initiate targeted customer re-engagement campaign and review churn drivers.'
};

export const ActionCenter = {
  layer: 'ActionCenter',
  version: '2.0.0-actions',

  /**
   * Get individual overdue invoice action items.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @param {Date|string} [options.referenceDate] - Baseline reference date
   * @returns {Promise<Array>} List of overdue invoice action items
   */
  async getOverdueInvoiceActions(companyId, options = {}) {
    if (!companyId) return [];

    try {
      const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
      const nowMs = now.getTime();

      const unpaidInvoices = await Finance.getOutstandingInvoices(companyId);

      const overdueItems = [];

      (unpaidInvoices || []).forEach(inv => {
        let daysOverdue = 0;
        if (inv.dueDate) {
          const dueMs = new Date(inv.dueDate).getTime();
          if (!isNaN(dueMs) && nowMs > dueMs) {
            daysOverdue = Math.floor((nowMs - dueMs) / 86400000);
          }
        } else if (inv.issueDate) {
          // Default 30-day net terms fallback if no explicit dueDate
          const issueMs = new Date(inv.issueDate).getTime();
          if (!isNaN(issueMs)) {
            const ageDays = Math.floor((nowMs - issueMs) / 86400000);
            if (ageDays > 30) {
              daysOverdue = ageDays - 30;
            }
          }
        }

        if (daysOverdue > 0) {
          const priority = daysOverdue >= 30 ? 'high' : daysOverdue >= 14 ? 'medium' : 'low';
          overdueItems.push({
            id: `action-inv-${inv.id}`,
            category: 'invoices',
            priority,
            title: `Overdue Invoice #${inv.invoiceNumber}`,
            backingData: {
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber,
              customerId: inv.customerId,
              customerName: inv.customerName,
              customerEmail: inv.customerEmail,
              amount: inv.totalAmount,
              dueDate: inv.dueDate,
              daysOverdue
            },
            explanation: `Invoice #${inv.invoiceNumber} for ${inv.customerName} ($${inv.totalAmount.toLocaleString()}) is ${daysOverdue} days overdue.`,
            recommendedAction: `Send payment reminder to ${inv.customerName} for $${inv.totalAmount.toLocaleString()} (Invoice #${inv.invoiceNumber}).`
          });
        }
      });

      // Sort by days overdue descending (most urgent first)
      return overdueItems.sort((a, b) => b.backingData.daysOverdue - a.backingData.daysOverdue);
    } catch (err) {
      console.warn('[ActionCenter] Failed to get overdue invoice actions:', err);
      return [];
    }
  },

  /**
   * Get customer follow-up action items for dormant / inactive accounts.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @param {number} [options.inactivityDays=60] - Days threshold for inactivity
   * @param {Date|string} [options.referenceDate] - Baseline date
   * @returns {Promise<Array>} List of customer follow-up action items
   */
  async getCustomerFollowUpActions(companyId, options = {}) {
    if (!companyId) return [];

    try {
      const signals = await BusinessIntelligence.getCustomerActivitySignals(companyId, options);
      const inactive = signals.inactiveCustomers || [];

      return inactive.map(c => {
        const priority = (c.daysSinceLastActivity && c.daysSinceLastActivity >= 90) ? 'high' : 'medium';
        const contactInfo = c.email || c.phone || 'no direct contact on file';
        const daysText = c.daysSinceLastActivity ? `${c.daysSinceLastActivity} days` : `over ${signals.inactivityDaysThreshold || 60} days`;

        return {
          id: `action-cust-${c.customerId}`,
          category: 'customers',
          priority,
          title: `Re-engage Inactive Customer: ${c.name}`,
          backingData: {
            customerId: c.customerId,
            customerName: c.name,
            customerEmail: c.email,
            phone: c.phone,
            lastActivityDate: c.lastActivityDate,
            daysInactive: c.daysSinceLastActivity,
            totalHistoricalSpent: c.totalSpent || 0
          },
          explanation: `${c.name} has had no recorded transaction or invoice activity for ${daysText} (total historical spend: $${(c.totalSpent || 0).toLocaleString()}).`,
          recommendedAction: `Reach out to ${c.name} (${contactInfo}) with a personalized check-in or re-engagement offer.`
        };
      });
    } catch (err) {
      console.warn('[ActionCenter] Failed to get customer follow-up actions:', err);
      return [];
    }
  },

  /**
   * Get health-driven alerts for dimensions requiring attention or at-risk.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<Array>} List of health alert action items
   */
  async getHealthAlertActions(companyId, options = {}) {
    if (!companyId) return [];

    try {
      const health = await BusinessHealth.evaluateHealth(companyId, options);
      const dimensions = health.dimensions || {};
      const alerts = [];

      Object.entries(dimensions).forEach(([dimKey, dimData]) => {
        if (dimData.status === 'attention' || dimData.status === 'at-risk') {
          const priority = dimData.status === 'at-risk' ? 'high' : 'medium';
          alerts.push({
            id: `action-health-${dimKey}`,
            category: 'health',
            priority,
            title: `${dimKey.toUpperCase()} Dimension Alert: ${dimData.status.toUpperCase()}`,
            backingData: {
              dimension: dimKey,
              status: dimData.status,
              metrics: dimData.metrics || {}
            },
            explanation: dimData.reason,
            recommendedAction: HEALTH_RECOMMENDATIONS[dimKey] || `Review and optimize ${dimKey} operations.`
          });
        }
      });

      return alerts;
    } catch (err) {
      console.warn('[ActionCenter] Failed to get health alert actions:', err);
      return [];
    }
  },

  /**
   * Get low-stock inventory replenishment action items.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<Array>} List of low-stock replenishment action items
   */
  async getLowStockAlertActions(companyId, options = {}) {
    if (!companyId) return [];

    try {
      const alerts = await Inventory.getLowStockAlerts(companyId, options);
      return (alerts || []).map(item => {
        const stock = Number(item.stockQuantity ?? 0);
        const threshold = Number(item.reorderThreshold ?? 10);
        const deficit = Number(item.deficit ?? (threshold - stock));
        const priority = stock <= 0 ? 'high' : deficit >= 10 ? 'high' : 'medium';

        return {
          id: `action-stock-${item.id}`,
          category: 'inventory',
          priority,
          title: `Low Stock: ${item.name}`,
          backingData: {
            productId: item.id,
            name: item.name,
            sku: item.sku,
            stockQuantity: stock,
            reorderThreshold: threshold,
            deficit,
            supplier: item.supplier
          },
          explanation: `${item.name} is below reorder threshold (${stock} units left, threshold: ${threshold}, deficit: ${deficit} units).`,
          recommendedAction: `Reorder ${deficit} units of ${item.name} from supplier ${item.supplier || 'unassigned'}.`
        };
      });
    } catch (err) {
      console.warn('[ActionCenter] Failed to get low-stock alert actions:', err);
      return [];
    }
  },

  /**
   * Get operational deadline and task urgency action items.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<Array>} List of deadline action items
   */
  async getUpcomingDeadlineActions(companyId, options = {}) {
    if (!companyId) return [];

    try {
      const deadlines = await Scheduling.getUpcomingDeadlines(companyId, { limit: 10, ...options });
      return (deadlines || []).map(task => {
        const priority = (task.priority === 'urgent' || task.priority === 'high') ? 'high' : 'medium';

        return {
          id: `action-task-${task.id}`,
          category: 'operations',
          priority,
          title: `Approaching Deadline: ${task.title}`,
          backingData: {
            taskId: task.id,
            title: task.title,
            dueDate: task.dueDate,
            assignedTo: task.assignedTo,
            priority: task.priority
          },
          explanation: `Task "${task.title}" is scheduled due on ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon'} (assigned to: ${task.assignedTo || 'unassigned'}).`,
          recommendedAction: `Follow up with assignee ${task.assignedTo || 'team'} to ensure timely completion.`
        };
      });
    } catch (err) {
      console.warn('[ActionCenter] Failed to get upcoming deadline actions:', err);
      return [];
    }
  },

  /**
   * Get complete Action Center feed composed for a tenant company.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<object>} Unified Action Center report
   */
  async getActionCenterFeed(companyId, options = {}) {
    if (!companyId) {
      return {
        companyId: null,
        summary: {
          totalActions: 0,
          highPriorityCount: 0,
          mediumPriorityCount: 0,
          lowPriorityCount: 0,
          categories: { invoices: 0, customers: 0, health: 0, inventory: 0, operations: 0 }
        },
        actions: [],
        metadata: {
          layer: 'ActionCenter',
          version: '2.0.0-actions',
          generatedAt: new Date().toISOString()
        }
      };
    }

    const [invoices, customers, health, inventory, operations] = await Promise.all([
      this.getOverdueInvoiceActions(companyId, options),
      this.getCustomerFollowUpActions(companyId, options),
      this.getHealthAlertActions(companyId, options),
      this.getLowStockAlertActions(companyId, options),
      this.getUpcomingDeadlineActions(companyId, options)
    ]);

    const allActions = [...invoices, ...customers, ...health, ...inventory, ...operations];

    // Priority rank: high (3) > medium (2) > low (1)
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    allActions.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

    const highPriorityCount = allActions.filter(a => a.priority === 'high').length;
    const mediumPriorityCount = allActions.filter(a => a.priority === 'medium').length;
    const lowPriorityCount = allActions.filter(a => a.priority === 'low').length;

    return {
      companyId,
      summary: {
        totalActions: allActions.length,
        highPriorityCount,
        mediumPriorityCount,
        lowPriorityCount,
        categories: {
          invoices: invoices.length,
          customers: customers.length,
          health: health.length,
          inventory: inventory.length,
          operations: operations.length
        }
      },
      actions: allActions,
      metadata: {
        layer: 'ActionCenter',
        version: '2.0.0-actions',
        generatedAt: new Date().toISOString()
      }
    };
  }
};

export default ActionCenter;
