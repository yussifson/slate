/**
 * OmniCore Action Center (Phase 8)
 * 
 * Transforms Business Intelligence, Finance receivables, and Business Health
 * indicators into a concrete, itemized list of actionable recommendations.
 * 
 * Composition-only, tenant-scoped, and recommendation-only (zero writes/execution).
 */
import { Finance } from '../capabilities/Finance.js';
import { CustomerManagement } from '../capabilities/CustomerManagement.js';
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
          categories: { invoices: 0, customers: 0, health: 0 }
        },
        actions: [],
        metadata: {
          layer: 'ActionCenter',
          version: '2.0.0-actions',
          generatedAt: new Date().toISOString()
        }
      };
    }

    const [invoices, customers, health] = await Promise.all([
      this.getOverdueInvoiceActions(companyId, options),
      this.getCustomerFollowUpActions(companyId, options),
      this.getHealthAlertActions(companyId, options)
    ]);

    const allActions = [...invoices, ...customers, ...health];

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
          health: health.length
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
