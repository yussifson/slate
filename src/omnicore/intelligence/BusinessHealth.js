/**
 * OmniCore Business Health Engine (Phase 7)
 * 
 * Computes transparent, traceable per-dimension health indicators (Sales, Finance, Customers)
 * strictly derived from real mathematical Business Intelligence outputs.
 * 
 * Rejects unbacked/hallucinated aggregate AI scores — every status is directly backed by
 * concrete arithmetic and cited numbers.
 */
import { BusinessIntelligence } from './BusinessIntelligence.js';

export const BusinessHealth = {
  /**
   * Evaluate health across Sales, Finance, and Customer dimensions for a tenant company.
   * 
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<object>} Complete Business Health evaluation
   */
  async evaluateHealth(companyId, options = {}) {
    if (!companyId) {
      return {
        overallStatus: 'attention',
        dimensions: {
          sales: { status: 'attention', reason: 'Sales: attention — no company identifier provided.', metrics: {} },
          finance: { status: 'attention', reason: 'Finance: attention — no company identifier provided.', metrics: {} },
          customers: { status: 'attention', reason: 'Customers: attention — no company identifier provided.', metrics: {} }
        },
        traceableReasons: ['No company identifier provided for health evaluation.'],
        metadata: {
          layer: 'BusinessHealth',
          version: '2.0.0-health',
          evaluatedAt: new Date().toISOString()
        }
      };
    }

    const { revenueTrend, outstandingTrend, customerActivity } = 
      await BusinessIntelligence.getUnifiedInsights(companyId, options);

    // ── 1. SALES DIMENSION ──────────────────────────────────────────
    let salesStatus = 'healthy';
    let salesReason = '';

    if (revenueTrend.currentRevenue === 0 && revenueTrend.priorRevenue === 0) {
      salesStatus = 'attention';
      salesReason = `Sales: attention — no recorded revenue in current or prior ${revenueTrend.periodDays} days.`;
    } else if (revenueTrend.percentageChange >= 0) {
      salesStatus = 'healthy';
      salesReason = `Sales: healthy — revenue ${revenueTrend.percentageChange === 0 ? 'held stable at' : 'increased ' + revenueTrend.percentageChange + '% to'} $${revenueTrend.currentRevenue.toLocaleString()} over the last ${revenueTrend.periodDays} days.`;
    } else if (revenueTrend.percentageChange >= -15.0) {
      salesStatus = 'attention';
      salesReason = `Sales: attention — revenue declined ${Math.abs(revenueTrend.percentageChange)}% ($${revenueTrend.currentRevenue.toLocaleString()} vs $${revenueTrend.priorRevenue.toLocaleString()}) over the last ${revenueTrend.periodDays} days.`;
    } else {
      salesStatus = 'at-risk';
      salesReason = `Sales: at-risk — revenue dropped ${Math.abs(revenueTrend.percentageChange)}% ($${revenueTrend.currentRevenue.toLocaleString()} vs $${revenueTrend.priorRevenue.toLocaleString()}) over the last ${revenueTrend.periodDays} days.`;
    }

    const salesDimension = {
      status: salesStatus,
      reason: salesReason,
      metrics: {
        currentRevenue: revenueTrend.currentRevenue,
        priorRevenue: revenueTrend.priorRevenue,
        percentageChange: revenueTrend.percentageChange,
        periodDays: revenueTrend.periodDays
      }
    };

    // ── 2. FINANCE DIMENSION ────────────────────────────────────────
    let financeStatus = 'healthy';
    let financeReason = '';

    if (outstandingTrend.currentTotal === 0 && outstandingTrend.priorTotal === 0) {
      financeStatus = 'healthy';
      financeReason = `Finance: healthy — $0 outstanding unpaid invoices over the last ${outstandingTrend.periodDays} days.`;
    } else if (outstandingTrend.percentageChange <= 10.0) {
      financeStatus = 'healthy';
      const changeDesc = outstandingTrend.percentageChange <= 0
        ? `outstanding invoices decreased ${Math.abs(outstandingTrend.percentageChange)}% ($${outstandingTrend.currentTotal.toLocaleString()})`
        : `outstanding invoices increased marginally by ${outstandingTrend.percentageChange}% ($${outstandingTrend.currentTotal.toLocaleString()})`;
      financeReason = `Finance: healthy — ${changeDesc} over the last ${outstandingTrend.periodDays} days.`;
    } else if (outstandingTrend.percentageChange <= 30.0) {
      financeStatus = 'attention';
      financeReason = `Finance: attention — outstanding invoices increased ${outstandingTrend.percentageChange}% ($${outstandingTrend.currentTotal.toLocaleString()} across ${outstandingTrend.currentCount} invoices vs $${outstandingTrend.priorTotal.toLocaleString()}) over the last ${outstandingTrend.periodDays} days.`;
    } else {
      financeStatus = 'at-risk';
      financeReason = `Finance: at-risk — outstanding invoices surged ${outstandingTrend.percentageChange}% ($${outstandingTrend.currentTotal.toLocaleString()} across ${outstandingTrend.currentCount} invoices vs $${outstandingTrend.priorTotal.toLocaleString()}) over the last ${outstandingTrend.periodDays} days.`;
    }

    const financeDimension = {
      status: financeStatus,
      reason: financeReason,
      metrics: {
        currentOutstanding: outstandingTrend.currentTotal,
        priorOutstanding: outstandingTrend.priorTotal,
        percentageChange: outstandingTrend.percentageChange,
        invoiceCount: outstandingTrend.currentCount
      }
    };

    // ── 3. CUSTOMERS DIMENSION ──────────────────────────────────────
    let customerStatus = 'healthy';
    let customerReason = '';

    if (customerActivity.totalCustomers === 0) {
      customerStatus = 'healthy';
      customerReason = `Customers: healthy — fresh organization workspace ready for onboarding.`;
    } else if (customerActivity.inactivePercentage <= 20.0) {
      customerStatus = 'healthy';
      customerReason = `Customers: healthy — ${customerActivity.inactiveCount} out of ${customerActivity.totalCustomers} customers (${customerActivity.inactivePercentage}%) inactive over the last ${customerActivity.inactivityDaysThreshold} days.`;
    } else if (customerActivity.inactivePercentage <= 40.0) {
      customerStatus = 'attention';
      customerReason = `Customers: attention — ${customerActivity.inactiveCount} out of ${customerActivity.totalCustomers} customers (${customerActivity.inactivePercentage}%) have had no activity in the last ${customerActivity.inactivityDaysThreshold} days.`;
    } else {
      customerStatus = 'at-risk';
      customerReason = `Customers: at-risk — ${customerActivity.inactiveCount} out of ${customerActivity.totalCustomers} customers (${customerActivity.inactivePercentage}%) have lapsed into inactivity over the last ${customerActivity.inactivityDaysThreshold} days.`;
    }

    const customersDimension = {
      status: customerStatus,
      reason: customerReason,
      metrics: {
        totalCustomers: customerActivity.totalCustomers,
        activeCount: customerActivity.activeCount,
        inactiveCount: customerActivity.inactiveCount,
        inactivePercentage: customerActivity.inactivePercentage,
        inactivityThresholdDays: customerActivity.inactivityDaysThreshold
      }
    };

    // ── 4. OVERALL ROLLUP (Derived with 100% Traceability) ───────────
    const statusValues = [salesStatus, financeStatus, customerStatus];
    let overallStatus = 'healthy';
    if (statusValues.includes('at-risk')) {
      overallStatus = 'at-risk';
    } else if (statusValues.includes('attention')) {
      overallStatus = 'attention';
    }

    const traceableReasons = [salesReason, financeReason, customerReason];

    return {
      overallStatus,
      dimensions: {
        sales: salesDimension,
        finance: financeDimension,
        customers: customersDimension
      },
      traceableReasons,
      metadata: {
        layer: 'BusinessHealth',
        version: '2.0.0-health',
        evaluatedAt: new Date().toISOString()
      }
    };
  }
};

export default BusinessHealth;
