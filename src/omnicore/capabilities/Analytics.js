import { Sales } from './Sales';
import { Purchasing } from './Purchasing';
import { TaskAdapter } from '../core/TaskAdapter';
import { EmployeeAdapter } from '../core/EmployeeAdapter';
import { ProductAdapter } from '../core/ProductAdapter';

/**
 * Analytics Capability
 * Pure read-composition layer synthesizing business metrics across Sales, Purchasing,
 * Operations (Tasks), and Personnel (Employees).
 *
 * Direct reuse note:
 * Supplier spend analytics directly invokes Purchasing.getPurchasingOverview without duplicating
 * transaction aggregation or expense filtering logic.
 */
export const Analytics = {
  /**
   * Get top performing products and product revenue insights.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<object>}
   */
  async getTopProductsByRevenue(companyId, options = {}) {
    const emptyResult = {
      totalProducts: 0,
      rankedProducts: []
    };

    if (!companyId) return emptyResult;

    try {
      const [salesOverview, products] = await Promise.all([
        Sales.getSalesOverview(companyId, options),
        ProductAdapter.getProducts(companyId, options)
      ]);

      const productMap = new Map();
      (products || []).forEach(p => {
        productMap.set(p.id, {
          id: p.id,
          name: p.name,
          sku: p.sku || null,
          price: Number(p.price || 0),
          category: p.category || null,
          stockQuantity: p.stockQuantity ?? null,
          revenueGenerated: 0,
          salesCount: 0
        });
      });

      // Aggregate transaction product items if available
      const txs = salesOverview?.recentTransactions || [];
      txs.forEach(tx => {
        // If transaction has direct product reference
        if (tx.productId && productMap.has(tx.productId)) {
          const item = productMap.get(tx.productId);
          item.revenueGenerated += Number(tx.amount || 0);
          item.salesCount += 1;
        }
      });

      const rankedProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenueGenerated - a.revenueGenerated || b.price - a.price);

      return {
        totalProducts: productMap.size,
        rankedProducts
      };
    } catch (err) {
      console.warn('[Analytics Capability] Failed to compute top products by revenue:', err);
      return emptyResult;
    }
  },

  /**
   * Get distribution of operational workload across all employees.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<object>}
   */
  async getEmployeeWorkloadDistribution(companyId, options = {}) {
    const emptyResult = {
      totalEmployees: 0,
      totalActiveTasks: 0,
      averageTasksPerEmployee: 0,
      distribution: []
    };

    if (!companyId) return emptyResult;

    try {
      const [tasks, employees] = await Promise.all([
        TaskAdapter.getTasks(companyId, options),
        EmployeeAdapter.getEmployees(companyId, options)
      ]);

      if (!employees || employees.length === 0) return emptyResult;

      const now = new Date();
      const distribution = employees.map(emp => {
        const empKeys = new Set([
          String(emp.id).toLowerCase(),
          (emp.email || '').toLowerCase(),
          (emp.name || '').toLowerCase(),
          String(emp.userId || '').toLowerCase()
        ]);

        const empTasks = (tasks || []).filter(t => {
          const assignedTo = (t.assignedTo || '').toLowerCase();
          const createdBy = (t.createdBy || '').toLowerCase();
          const metaAssigned = (t.metadata?.assigned_to || t.metadata?.assignedTo || '').toLowerCase();
          const metaEmail = (t.metadata?.user_email || t.metadata?.userEmail || '').toLowerCase();
          const metaUserId = (t.metadata?.user_id || t.metadata?.userId || '').toLowerCase();

          return (
            (assignedTo && empKeys.has(assignedTo)) ||
            (createdBy && empKeys.has(createdBy)) ||
            (metaAssigned && empKeys.has(metaAssigned)) ||
            (metaEmail && empKeys.has(metaEmail)) ||
            (metaUserId && empKeys.has(metaUserId))
          );
        });

        let activeCount = 0;
        let completedCount = 0;
        let overdueCount = 0;
        let workloadScore = 0;

        empTasks.forEach(t => {
          const status = (t.status || 'open').toLowerCase();
          const isDone = ['completed', 'done', 'closed', 'resolved'].includes(status);
          if (isDone) {
            completedCount++;
          } else {
            activeCount++;
            const prio = (t.priority || 'medium').toLowerCase();
            const weight = prio === 'high' || prio === 'urgent' ? 3 : prio === 'low' ? 1 : 2;
            workloadScore += weight;

            if (t.dueDate) {
              const due = new Date(t.dueDate);
              if (!isNaN(due.getTime()) && due < now) {
                overdueCount++;
              }
            }
          }
        });

        return {
          employeeId: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          department: emp.department,
          activeTasks: activeCount,
          completedTasks: completedCount,
          overdueTasks: overdueCount,
          workloadScore
        };
      });

      const totalActiveTasks = distribution.reduce((sum, d) => sum + d.activeTasks, 0);
      const averageTasksPerEmployee = distribution.length > 0 ? Number((totalActiveTasks / distribution.length).toFixed(2)) : 0;

      // Sort by workload score descending
      distribution.sort((a, b) => b.workloadScore - a.workloadScore);

      return {
        totalEmployees: distribution.length,
        totalActiveTasks,
        averageTasksPerEmployee,
        distribution
      };
    } catch (err) {
      console.warn('[Analytics Capability] Failed to compute employee workload distribution:', err);
      return emptyResult;
    }
  },

  /**
   * Get supplier spend analytics directly reusing the Purchasing capability.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<object>}
   */
  async getSupplierSpendAnalytics(companyId, options = {}) {
    const emptyResult = {
      totalSpend: 0,
      totalSuppliers: 0,
      activeSuppliersCount: 0,
      topSuppliersBySpend: [],
      spendBySupplier: {}
    };

    if (!companyId) return emptyResult;

    try {
      // Direct reuse of Purchasing capability overview
      const purchasingOverview = await Purchasing.getPurchasingOverview(companyId, options);

      const spendMap = purchasingOverview?.spendBySupplier || {};
      const topSuppliersBySpend = Object.entries(spendMap)
        .map(([supplierName, data]) => ({
          supplierName,
          totalSpend: data.totalSpend || 0,
          transactionCount: data.transactionCount || 0
        }))
        .sort((a, b) => b.totalSpend - a.totalSpend);

      return {
        totalSpend: purchasingOverview?.totalSpend || 0,
        totalSuppliers: purchasingOverview?.totalSuppliers || 0,
        activeSuppliersCount: purchasingOverview?.activeSuppliersCount || 0,
        topSuppliersBySpend,
        spendBySupplier: spendMap
      };
    } catch (err) {
      console.warn('[Analytics Capability] Failed to compute supplier spend analytics:', err);
      return emptyResult;
    }
  },

  /**
   * Get synthesized cross-capability executive summary for leadership.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<object>}
   */
  async getExecutiveSummary(companyId, options = {}) {
    const emptySummary = {
      revenue: 0,
      supplierSpend: 0,
      netOperatingMargin: 0,
      headcount: 0,
      totalTasks: 0,
      taskCompletionRate: 0,
      topCustomer: null,
      topSupplier: null
    };

    if (!companyId) return emptySummary;

    try {
      const [salesOverview, purchasingOverview, tasks, employees] = await Promise.all([
        Sales.getSalesOverview(companyId, options),
        Purchasing.getPurchasingOverview(companyId, options),
        TaskAdapter.getTasks(companyId, options),
        EmployeeAdapter.getEmployees(companyId, options)
      ]);

      const revenue = Number(salesOverview?.totalRevenue || 0);
      const supplierSpend = Number(purchasingOverview?.totalSpend || 0);
      const netOperatingMargin = Number((revenue - supplierSpend).toFixed(2));
      const headcount = (employees || []).length;

      const totalTasks = (tasks || []).length;
      const completedTasks = (tasks || []).filter(t => {
        const s = (t.status || '').toLowerCase();
        return ['completed', 'done', 'closed', 'resolved'].includes(s);
      }).length;

      const taskCompletionRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

      const topCustomer = salesOverview?.topCustomers?.[0] || null;

      const spendMap = purchasingOverview?.spendBySupplier || {};
      let topSupplier = null;
      let maxSupplierSpend = 0;
      Object.entries(spendMap).forEach(([sName, sData]) => {
        if (sData.totalSpend > maxSupplierSpend) {
          maxSupplierSpend = sData.totalSpend;
          topSupplier = { supplierName: sName, totalSpend: sData.totalSpend };
        }
      });

      return {
        revenue,
        supplierSpend,
        netOperatingMargin,
        headcount,
        totalTasks,
        taskCompletionRate,
        topCustomer,
        topSupplier
      };
    } catch (err) {
      console.warn('[Analytics Capability] Failed to compute executive summary:', err);
      return emptySummary;
    }
  }
};

export default Analytics;
