import { Sales } from './Sales.js';
import { Finance } from './Finance.js';
import { Analytics } from './Analytics.js';
import { Purchasing } from './Purchasing.js';
import { HR } from './HR.js';
import { Inventory } from './Inventory.js';
import { Scheduling } from './Scheduling.js';
import { CustomerManagement } from './CustomerManagement.js';

/**
 * Reporting Capability (Phase B)
 * Pure read-composition layer synthesizing comprehensive, exportable business reports
 * across Sales, Finance, Purchasing, Inventory, HR, Operations, and Customers.
 */
export const Reporting = {
  layer: 'BusinessCapabilities',
  capability: 'Reporting',
  version: '2.0.0-reporting',

  /**
   * Generate weekly cross-departmental operations report.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async getWeeklyOperationsReport(companyId, options = {}) {
    const emptyReport = {
      reportType: 'weekly_operations',
      companyId: companyId || null,
      generatedAt: new Date().toISOString(),
      summary: {
        revenue: 0,
        supplierSpend: 0,
        netOperatingMargin: 0,
        activeHeadcount: 0,
        totalTasksScheduled: 0,
        completedTasks: 0,
        taskCompletionRate: 0,
        lowStockItemsCount: 0
      },
      details: {
        sales: null,
        purchasing: null,
        inventoryAlerts: [],
        schedule: null,
        hr: null
      }
    };

    if (!companyId) return emptyReport;

    try {
      const [sales, purchasing, inventoryAlerts, schedule, hr] = await Promise.all([
        Sales.getSalesOverview(companyId, options).catch(() => null),
        Purchasing.getPurchasingOverview(companyId, options).catch(() => null),
        Inventory.getLowStockAlerts(companyId, options).catch(() => []),
        Scheduling.getScheduleOverview(companyId, options).catch(() => null),
        HR.getHROverview(companyId, options).catch(() => null)
      ]);

      const revenue = Number(sales?.totalRevenue || 0);
      const supplierSpend = Number(purchasing?.totalSpend || 0);
      const netOperatingMargin = Number((revenue - supplierSpend).toFixed(2));
      const activeHeadcount = Number(hr?.activeHeadcount || 0);
      const totalTasksScheduled = Number(schedule?.totalScheduled || 0);
      const completedTasks = Number(schedule?.completedScheduled || 0);
      const taskCompletionRate = totalTasksScheduled > 0 ? Number(((completedTasks / totalTasksScheduled) * 100).toFixed(1)) : 0;
      const lowStockItemsCount = (inventoryAlerts || []).length;

      return {
        reportType: 'weekly_operations',
        companyId,
        generatedAt: new Date().toISOString(),
        summary: {
          revenue,
          supplierSpend,
          netOperatingMargin,
          activeHeadcount,
          totalTasksScheduled,
          completedTasks,
          taskCompletionRate,
          lowStockItemsCount
        },
        details: {
          sales,
          purchasing,
          inventoryAlerts,
          schedule,
          hr
        }
      };
    } catch (err) {
      console.warn('[Reporting] Failed to generate weekly operations report:', err);
      return emptyReport;
    }
  },

  /**
   * Generate executive financial performance report.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async getFinancialExecutiveReport(companyId, options = {}) {
    const emptyReport = {
      reportType: 'financial_executive',
      companyId: companyId || null,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMarginPercent: 0,
        totalAccountsReceivable: 0,
        topRevenueCustomers: [],
        topSpendSuppliers: []
      }
    };

    if (!companyId) return emptyReport;

    try {
      const [finance, sales, purchasing, analytics] = await Promise.all([
        Finance.getFinancialSummary(companyId, options).catch(() => null),
        Sales.getSalesOverview(companyId, options).catch(() => null),
        Purchasing.getPurchasingOverview(companyId, options).catch(() => null),
        Analytics.getSupplierSpendAnalytics(companyId, options).catch(() => null)
      ]);

      const totalRevenue = Number(sales?.totalRevenue || finance?.totalRevenue || 0);
      const totalExpenses = Number(purchasing?.totalSpend || finance?.totalExpenses || 0);
      const netProfit = Number((totalRevenue - totalExpenses).toFixed(2));
      const profitMarginPercent = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
      const totalAccountsReceivable = Number(finance?.totalAccountsReceivable || 0);

      const topRevenueCustomers = sales?.topCustomers || [];
      const topSpendSuppliers = analytics?.topSuppliersBySpend || [];

      return {
        reportType: 'financial_executive',
        companyId,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMarginPercent,
          totalAccountsReceivable,
          topRevenueCustomers,
          topSpendSuppliers
        }
      };
    } catch (err) {
      console.warn('[Reporting] Failed to generate financial executive report:', err);
      return emptyReport;
    }
  },

  /**
   * Generate customer portfolio & health report.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async getCustomerHealthReport(companyId, options = {}) {
    const emptyReport = {
      reportType: 'customer_health',
      companyId: companyId || null,
      generatedAt: new Date().toISOString(),
      summary: {
        totalCustomers: 0,
        activeCustomersCount: 0,
        topSpenders: [],
        totalRevenue: 0
      }
    };

    if (!companyId) return emptyReport;

    try {
      const [customersOverview, sales] = await Promise.all([
        CustomerManagement.getCustomersOverview(companyId, options).catch(() => null),
        Sales.getSalesOverview(companyId, options).catch(() => null)
      ]);

      const totalCustomers = Number(customersOverview?.totalCustomers || 0);
      const activeCustomersCount = Number(customersOverview?.activeCustomersCount || 0);
      const topSpenders = sales?.topCustomers || [];
      const totalRevenue = Number(sales?.totalRevenue || 0);

      return {
        reportType: 'customer_health',
        companyId,
        generatedAt: new Date().toISOString(),
        summary: {
          totalCustomers,
          activeCustomersCount,
          topSpenders,
          totalRevenue
        }
      };
    } catch (err) {
      console.warn('[Reporting] Failed to generate customer health report:', err);
      return emptyReport;
    }
  },

  /**
   * Generate inventory valuation & stock health report.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async getInventoryValuationReport(companyId, options = {}) {
    const emptyReport = {
      reportType: 'inventory_valuation',
      companyId: companyId || null,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalSKUs: 0,
        totalStockUnits: 0,
        inventoryValuation: 0,
        lowStockSKUsCount: 0,
        totalReorderDeficitUnits: 0,
        estimatedReorderSpend: 0
      }
    };

    if (!companyId) return emptyReport;

    try {
      const [invOverview, lowStockAlerts, reorders] = await Promise.all([
        Inventory.getInventoryOverview(companyId, options).catch(() => null),
        Inventory.getLowStockAlerts(companyId, options).catch(() => []),
        Purchasing.getReorderRecommendations(companyId, options).catch(() => null)
      ]);

      const totalSKUs = Number(invOverview?.totalItems || 0);
      const totalStockUnits = Number(invOverview?.totalStockUnits || 0);
      const inventoryValuation = Number(invOverview?.totalInventoryValue || 0);
      const lowStockSKUsCount = (lowStockAlerts || []).length;
      const totalReorderDeficitUnits = (lowStockAlerts || []).reduce((sum, it) => sum + (Number(it.deficit) || 0), 0);
      const estimatedReorderSpend = Number(reorders?.totalEstimatedReorderSpend || 0);

      return {
        reportType: 'inventory_valuation',
        companyId,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalSKUs,
          totalStockUnits,
          inventoryValuation,
          lowStockSKUsCount,
          totalReorderDeficitUnits,
          estimatedReorderSpend
        }
      };
    } catch (err) {
      console.warn('[Reporting] Failed to generate inventory valuation report:', err);
      return emptyReport;
    }
  },

  /**
   * Format structured report data into standard RFC 4180 CSV string.
   *
   * @param {string} reportType - Report type identifier
   * @param {object|Array} reportData - Data payload to convert
   * @returns {string} CSV string payload
   */
  generateCSVExport(reportType, reportData) {
    if (!reportData) return '';

    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const toCSV = (headers, rows) => {
      const headerLine = headers.map(h => escapeCell(h)).join(',');
      const bodyLines = rows.map(row => row.map(cell => escapeCell(cell)).join(','));
      return [headerLine, ...bodyLines].join('\n');
    };

    if (reportType === 'weekly_operations') {
      const s = reportData.summary || {};
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Report Type', 'Weekly Operations'],
        ['Company ID', reportData.companyId || 'N/A'],
        ['Generated At', reportData.generatedAt || new Date().toISOString()],
        ['Total Revenue', s.revenue || 0],
        ['Supplier Spend', s.supplierSpend || 0],
        ['Net Operating Margin', s.netOperatingMargin || 0],
        ['Active Headcount', s.activeHeadcount || 0],
        ['Total Tasks Scheduled', s.totalTasksScheduled || 0],
        ['Completed Tasks', s.completedTasks || 0],
        ['Task Completion Rate (%)', s.taskCompletionRate || 0],
        ['Low Stock Items Count', s.lowStockItemsCount || 0]
      ];
      return toCSV(headers, rows);
    }

    if (reportType === 'financial_executive') {
      const m = reportData.metrics || {};
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Report Type', 'Financial Executive Summary'],
        ['Company ID', reportData.companyId || 'N/A'],
        ['Generated At', reportData.generatedAt || new Date().toISOString()],
        ['Total Revenue', m.totalRevenue || 0],
        ['Total Expenses', m.totalExpenses || 0],
        ['Net Profit', m.netProfit || 0],
        ['Profit Margin (%)', m.profitMarginPercent || 0],
        ['Accounts Receivable', m.totalAccountsReceivable || 0]
      ];
      return toCSV(headers, rows);
    }

    if (reportType === 'inventory_valuation') {
      const m = reportData.metrics || {};
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Report Type', 'Inventory Valuation'],
        ['Company ID', reportData.companyId || 'N/A'],
        ['Generated At', reportData.generatedAt || new Date().toISOString()],
        ['Total SKUs', m.totalSKUs || 0],
        ['Total Stock Units', m.totalStockUnits || 0],
        ['Inventory Valuation', m.inventoryValuation || 0],
        ['Low Stock SKUs Count', m.lowStockSKUsCount || 0],
        ['Total Reorder Deficit Units', m.totalReorderDeficitUnits || 0],
        ['Estimated Reorder Spend', m.estimatedReorderSpend || 0]
      ];
      return toCSV(headers, rows);
    }

    if (reportType === 'customer_health') {
      const s = reportData.summary || {};
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Report Type', 'Customer Health'],
        ['Company ID', reportData.companyId || 'N/A'],
        ['Generated At', reportData.generatedAt || new Date().toISOString()],
        ['Total Customers', s.totalCustomers || 0],
        ['Active Customers', s.activeCustomersCount || 0],
        ['Total Sales Revenue', s.totalRevenue || 0]
      ];
      return toCSV(headers, rows);
    }

    // Generic tabular array fallback
    if (Array.isArray(reportData) && reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      const rows = reportData.map(item => headers.map(h => item[h]));
      return toCSV(headers, rows);
    }

    return '';
  }
};

export default Reporting;
