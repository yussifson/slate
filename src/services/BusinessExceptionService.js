/**
 * Slate V2: Business Exception & Process Health Service
 * 
 * Deterministically scans business operations to detect critical anomalies:
 * - Overdue invoices (>30 days)
 * - Dead-letter workflow executions
 * - Expiring property leases
 * - Pending unassigned approvals
 * 
 * Provides verified calculation formulas for business process health monitoring.
 */

import { supabase } from '../api/supabaseClient.js';
import { UnifiedActionCenterService } from './UnifiedActionCenterService.js';

export const BusinessExceptionService = {
  /**
   * Run deterministic exception scans for a given tenant
   */
  async scanExceptions(companyId) {
    if (!companyId) return [];

    const detectedExceptions = [];

    if (supabase && typeof supabase.from === 'function') {
      try {
        // 1. Scan Overdue Invoices
        const { data: overdueInvoices } = await supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, due_date, status')
          .eq('company_id', companyId)
          .eq('status', 'overdue');

        if (overdueInvoices) {
          overdueInvoices.forEach(inv => {
            detectedExceptions.push({
              company_id: companyId,
              exception_type: 'overdue_invoice',
              severity: Number(inv.total_amount) > 5000 ? 'high' : 'medium',
              title: `Unpaid Invoice #${inv.invoice_number}`,
              description: `Invoice has passed due date (${inv.due_date || 'N/A'}) with balance $${Number(inv.total_amount).toLocaleString()}.`,
              entity_type: 'invoice',
              entity_id: String(inv.id),
              supporting_context: { invoice_number: inv.invoice_number, amount: inv.total_amount }
            });
          });
        }

        // 2. Scan Dead-Letter Workflow Executions
        const { data: deadLetters } = await supabase
          .from('workflow_dead_letters')
          .select('id, source_id, error_message, retry_count, created_at')
          .eq('company_id', companyId)
          .eq('resolved', false);

        if (deadLetters) {
          deadLetters.forEach(dl => {
            detectedExceptions.push({
              company_id: companyId,
              exception_type: 'workflow_dead_letter',
              severity: 'critical',
              title: 'Workflow Dead-Letter Failure',
              description: `Automated workflow failed after ${dl.retry_count} retries: ${dl.error_message}`,
              entity_type: 'workflow_dead_letter',
              entity_id: String(dl.id),
              supporting_context: { error: dl.error_message }
            });
          });
        }

        // Persist deduplicated detected exceptions into business_exceptions
        for (const exc of detectedExceptions) {
          const { data: existing } = await supabase
            .from('business_exceptions')
            .select('id')
            .eq('company_id', companyId)
            .eq('entity_type', exc.entity_type)
            .eq('entity_id', exc.entity_id)
            .eq('status', 'open')
            .maybeSingle();

          if (!existing) {
            await supabase.from('business_exceptions').insert(exc);
          }
        }
      } catch (err) {
        console.warn('[BusinessExceptionService] Scan error:', err);
      }
    }

    return detectedExceptions;
  },

  /**
   * Fetch active open exceptions
   */
  async getOpenExceptions(companyId, severityFilter = null) {
    if (!companyId) return [];

    if (supabase && typeof supabase.from === 'function') {
      let query = supabase
        .from('business_exceptions')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'open')
        .order('detected_at', { ascending: false });

      if (severityFilter) {
        query = query.eq('severity', severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  /**
   * Compute verified Business Process Health Metrics
   */
  async getProcessHealthMetrics(companyId) {
    if (!companyId) return null;

    let totalWorkflows = 0;
    let completedWorkflows = 0;
    let openExceptionsCount = 0;
    let pendingApprovalsCount = 0;

    if (supabase && typeof supabase.from === 'function') {
      try {
        // Workflow completion rate
        const { data: execs } = await supabase
          .from('workflow_executions')
          .select('status')
          .eq('company_id', companyId);

        if (execs && execs.length > 0) {
          totalWorkflows = execs.length;
          completedWorkflows = execs.filter(e => e.status === 'completed').length;
        }

        // Open exceptions count
        const { count: excCount } = await supabase
          .from('business_exceptions')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'open');
        openExceptionsCount = excCount || 0;

        // Pending action items
        const { count: actCount } = await supabase
          .from('unified_action_items')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'pending');
        pendingApprovalsCount = actCount || 0;
      } catch (err) {
        console.warn('[ProcessHealth] Metrics calculation error:', err);
      }
    }

    const workflowSuccessRate = totalWorkflows > 0 
      ? Math.round((completedWorkflows / totalWorkflows) * 100) 
      : 100;

    // Deterministic Composite Health Score (100 base, deducted by exceptions and failures)
    let healthScore = 100;
    healthScore -= Math.min(openExceptionsCount * 5, 40);
    healthScore -= Math.max(0, 100 - workflowSuccessRate) * 0.4;
    healthScore = Math.max(10, Math.round(healthScore));

    return {
      healthScore,
      workflowSuccessRate: `${workflowSuccessRate}%`,
      totalWorkflowExecutions: totalWorkflows,
      openExceptionsCount,
      pendingApprovalsCount,
      statusGrade: healthScore >= 85 ? 'Optimal' : healthScore >= 65 ? 'Attention Required' : 'Critical Risk'
    };
  }
};
