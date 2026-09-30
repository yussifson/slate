/**
 * OmniCore Business Intelligence Layer (Phase 6)
 * 
 * Composes Sales, Finance, and CustomerManagement capabilities to compute
 * real mathematical business trends and signals without hardcoded placeholder values.
 * 
 * Composition-only, tenant-scoped, and read-only.
 */
import { Sales } from '../capabilities/Sales.js';
import { Finance } from '../capabilities/Finance.js';
import { CustomerManagement } from '../capabilities/CustomerManagement.js';

export const BusinessIntelligence = {
  layer: 'BusinessIntelligence',
  version: '2.0.0-intelligence',

  /**
   * Compute Revenue Trend comparing current period vs prior period.
   * 
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @param {number} [options.periodDays=30] - Number of days in each period
   * @param {Date|string} [options.referenceDate] - Baseline date for period boundaries
   * @returns {Promise<object>} Revenue trend analysis
   */
  async getRevenueTrend(companyId, options = {}) {
    const periodDays = Number(options.periodDays) || 30;
    const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
    const nowMs = now.getTime();
    const periodMs = periodDays * 86400000;

    const currentEnd = now.toISOString();
    const currentStart = new Date(nowMs - periodMs).toISOString();
    const priorEnd = currentStart;
    const priorStart = new Date(nowMs - 2 * periodMs).toISOString();

    if (!companyId) {
      return {
        metric: 'revenue_trend',
        currentRevenue: 0,
        priorRevenue: 0,
        absoluteChange: 0,
        percentageChange: 0,
        direction: 'flat',
        periodDays,
        periods: {
          current: { start: currentStart, end: currentEnd },
          prior: { start: priorStart, end: priorEnd }
        },
        explanation: `No company identifier provided for revenue trend calculation.`
      };
    }

    try {
      const [currentFin, priorFin] = await Promise.all([
        Finance.getFinancialSummary(companyId, { startDate: currentStart, endDate: currentEnd }),
        Finance.getFinancialSummary(companyId, { startDate: priorStart, endDate: priorEnd })
      ]);

      const currentRevenue = Number(currentFin?.revenueVsExpense?.totalRevenue || 0);
      const priorRevenue = Number(priorFin?.revenueVsExpense?.totalRevenue || 0);
      const absoluteChange = currentRevenue - priorRevenue;

      let percentageChange = 0;
      if (priorRevenue > 0) {
        percentageChange = Number((((currentRevenue - priorRevenue) / priorRevenue) * 100).toFixed(1));
      } else if (priorRevenue === 0 && currentRevenue > 0) {
        percentageChange = 100.0;
      } else {
        percentageChange = 0.0;
      }

      let direction = 'flat';
      if (percentageChange > 0) direction = 'up';
      else if (percentageChange < 0) direction = 'down';

      let explanation = '';
      if (direction === 'up') {
        explanation = `Revenue increased ${Math.abs(percentageChange)}% ($${currentRevenue.toLocaleString()} vs $${priorRevenue.toLocaleString()}) compared to the prior ${periodDays} days.`;
      } else if (direction === 'down') {
        explanation = `Revenue decreased ${Math.abs(percentageChange)}% ($${currentRevenue.toLocaleString()} vs $${priorRevenue.toLocaleString()}) compared to the prior ${periodDays} days.`;
      } else if (currentRevenue > 0) {
        explanation = `Revenue remained flat at $${currentRevenue.toLocaleString()} compared to the prior ${periodDays} days.`;
      } else {
        explanation = `Revenue remained at $0 with no recorded transactions in the last ${periodDays} days.`;
      }

      return {
        metric: 'revenue_trend',
        currentRevenue,
        priorRevenue,
        absoluteChange,
        percentageChange,
        direction,
        periodDays,
        periods: {
          current: { start: currentStart, end: currentEnd },
          prior: { start: priorStart, end: priorEnd }
        },
        explanation
      };
    } catch (err) {
      console.warn('[BusinessIntelligence] Failed to compute revenue trend:', err);
      return {
        metric: 'revenue_trend',
        currentRevenue: 0,
        priorRevenue: 0,
        absoluteChange: 0,
        percentageChange: 0,
        direction: 'flat',
        periodDays,
        periods: {
          current: { start: currentStart, end: currentEnd },
          prior: { start: priorStart, end: priorEnd }
        },
        explanation: `Unable to compute revenue trend due to data processing error.`
      };
    }
  },

  /**
   * Compute Outstanding Invoices Trend comparing current period vs prior period.
   * 
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @param {number} [options.periodDays=30] - Number of days in each period
   * @param {Date|string} [options.referenceDate] - Baseline date
   * @returns {Promise<object>} Outstanding invoices trend analysis
   */
  async getOutstandingInvoicesTrend(companyId, options = {}) {
    const periodDays = Number(options.periodDays) || 30;
    const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
    const nowMs = now.getTime();
    const periodMs = periodDays * 86400000;

    const currentEnd = now.toISOString();
    const currentStart = new Date(nowMs - periodMs).toISOString();
    const priorEnd = currentStart;
    const priorStart = new Date(nowMs - 2 * periodMs).toISOString();

    if (!companyId) {
      return {
        metric: 'outstanding_invoices_trend',
        currentTotal: 0,
        currentCount: 0,
        priorTotal: 0,
        priorCount: 0,
        amountChange: 0,
        percentageChange: 0,
        countChange: 0,
        periodDays,
        explanation: `No company identifier provided for outstanding invoices trend.`
      };
    }

    try {
      const [currentFin, priorFin] = await Promise.all([
        Finance.getFinancialSummary(companyId, { startDate: currentStart, endDate: currentEnd }),
        Finance.getFinancialSummary(companyId, { startDate: priorStart, endDate: priorEnd })
      ]);

      const currentTotal = Number(currentFin?.outstandingInvoices?.totalAmount || 0);
      const currentCount = Number(currentFin?.outstandingInvoices?.count || 0);
      const priorTotal = Number(priorFin?.outstandingInvoices?.totalAmount || 0);
      const priorCount = Number(priorFin?.outstandingInvoices?.count || 0);

      const amountChange = currentTotal - priorTotal;
      const countChange = currentCount - priorCount;

      let percentageChange = 0;
      if (priorTotal > 0) {
        percentageChange = Number((((currentTotal - priorTotal) / priorTotal) * 100).toFixed(1));
      } else if (priorTotal === 0 && currentTotal > 0) {
        percentageChange = 100.0;
      } else {
        percentageChange = 0.0;
      }

      let explanation = '';
      if (amountChange > 0) {
        explanation = `Outstanding invoices increased ${Math.abs(percentageChange)}% ($${currentTotal.toLocaleString()} across ${currentCount} invoices vs $${priorTotal.toLocaleString()} across ${priorCount} invoices) compared to the prior ${periodDays} days.`;
      } else if (amountChange < 0) {
        explanation = `Outstanding invoices decreased ${Math.abs(percentageChange)}% ($${currentTotal.toLocaleString()} across ${currentCount} invoices vs $${priorTotal.toLocaleString()} across ${priorCount} invoices) compared to the prior ${periodDays} days.`;
      } else if (currentTotal > 0) {
        explanation = `Outstanding invoices remained unchanged at $${currentTotal.toLocaleString()} across ${currentCount} invoices.`;
      } else {
        explanation = `No outstanding unpaid invoices in the current or prior ${periodDays} days.`;
      }

      return {
        metric: 'outstanding_invoices_trend',
        currentTotal,
        currentCount,
        priorTotal,
        priorCount,
        amountChange,
        percentageChange,
        countChange,
        periodDays,
        explanation
      };
    } catch (err) {
      console.warn('[BusinessIntelligence] Failed to compute outstanding invoices trend:', err);
      return {
        metric: 'outstanding_invoices_trend',
        currentTotal: 0,
        currentCount: 0,
        priorTotal: 0,
        priorCount: 0,
        amountChange: 0,
        percentageChange: 0,
        countChange: 0,
        periodDays,
        explanation: `Unable to compute outstanding invoices trend due to data processing error.`
      };
    }
  },

  /**
   * Compute Customer Activity Signals (inactive customers detection).
   * 
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @param {number} [options.inactivityDays=60] - Days threshold for marking inactivity
   * @param {Date|string} [options.referenceDate] - Baseline date
   * @returns {Promise<object>} Customer activity signal analysis
   */
  async getCustomerActivitySignals(companyId, options = {}) {
    const inactivityDays = Number(options.inactivityDays) || 60;
    const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
    const refTime = now.getTime();
    const cutoffTime = refTime - inactivityDays * 86400000;

    if (!companyId) {
      return {
        metric: 'customer_activity_signal',
        totalCustomers: 0,
        activeCount: 0,
        inactiveCount: 0,
        inactivePercentage: 0,
        inactivityDaysThreshold: inactivityDays,
        inactiveCustomers: [],
        explanation: `No company identifier provided for customer activity analysis.`
      };
    }

    try {
      const customerActivities = await CustomerManagement.getCustomerActivityList(companyId);
      const totalCustomers = (customerActivities || []).length;

      const evaluated = (customerActivities || []).map(c => {
        const lastActTime = c.lastActivityDate ? new Date(c.lastActivityDate).getTime() : 0;
        const daysSinceLastActivity = lastActTime > 0 ? Math.floor((refTime - lastActTime) / 86400000) : null;
        const isInactive = !lastActTime || lastActTime < cutoffTime;

        return {
          customerId: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          lastActivityDate: c.lastActivityDate,
          daysSinceLastActivity,
          totalSpent: c.totalSpent,
          isInactive
        };
      });

      const inactiveCustomers = evaluated.filter(c => c.isInactive);
      const inactiveCount = inactiveCustomers.length;
      const activeCount = totalCustomers - inactiveCount;
      const inactivePercentage = totalCustomers > 0
        ? Number(((inactiveCount / totalCustomers) * 100).toFixed(1))
        : 0.0;

      let explanation = '';
      if (totalCustomers === 0) {
        explanation = `No customers recorded for this organization.`;
      } else if (inactiveCount === 0) {
        explanation = `All ${totalCustomers} customers have been active in the last ${inactivityDays} days.`;
      } else {
        explanation = `${inactiveCount} out of ${totalCustomers} customers (${inactivePercentage}%) have had no transaction or invoice activity in the last ${inactivityDays} days.`;
      }

      return {
        metric: 'customer_activity_signal',
        totalCustomers,
        activeCount,
        inactiveCount,
        inactivePercentage,
        inactivityDaysThreshold: inactivityDays,
        inactiveCustomers,
        explanation
      };
    } catch (err) {
      console.warn('[BusinessIntelligence] Failed to compute customer activity signal:', err);
      return {
        metric: 'customer_activity_signal',
        totalCustomers: 0,
        activeCount: 0,
        inactiveCount: 0,
        inactivePercentage: 0,
        inactivityDaysThreshold: inactivityDays,
        inactiveCustomers: [],
        explanation: `Unable to compute customer activity signals due to data processing error.`
      };
    }
  },

  /**
   * Get all unified intelligence insights composed for a company.
   * 
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<{ revenueTrend: object, outstandingTrend: object, customerActivity: object, insights: Array }>}
   */
  async getUnifiedInsights(companyId, options = {}) {
    const [revenueTrend, outstandingTrend, customerActivity] = await Promise.all([
      this.getRevenueTrend(companyId, options),
      this.getOutstandingInvoicesTrend(companyId, options),
      this.getCustomerActivitySignals(companyId, options)
    ]);

    const insights = [
      {
        id: 'insight-rev-trend',
        type: 'revenue',
        title: 'Revenue Trajectory',
        direction: revenueTrend.direction,
        value: revenueTrend.percentageChange,
        explanation: revenueTrend.explanation
      },
      {
        id: 'insight-outstanding-invoices',
        type: 'invoices',
        title: 'Outstanding Receivables',
        direction: outstandingTrend.amountChange > 0 ? 'up' : outstandingTrend.amountChange < 0 ? 'down' : 'flat',
        value: outstandingTrend.percentageChange,
        explanation: outstandingTrend.explanation
      },
      {
        id: 'insight-customer-activity',
        type: 'customers',
        title: 'Customer Retention & Activity',
        direction: customerActivity.inactivePercentage > 20 ? 'attention' : 'healthy',
        value: customerActivity.inactivePercentage,
        explanation: customerActivity.explanation
      }
    ];

    return {
      revenueTrend,
      outstandingTrend,
      customerActivity,
      insights
    };
  }
};

export default BusinessIntelligence;
