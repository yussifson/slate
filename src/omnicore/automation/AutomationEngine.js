/**
 * OmniCore Automation Engine (Phase 9)
 * 
 * WHEN / IF / THEN rule evaluation & execution engine.
 * 
 * Safety invariants:
 * 1. Off by default: gated behind `automation_enabled = false` in platform_config / company settings.
 * 2. Dry-run by default: evaluateRules() never writes. Execution is a separate explicit function executeRules().
 * 3. RBAC preserved: writes route through TaskAdapter.createTask() -> base44 ORM with enforcePermission.
 * 4. Audit logged: every attempt (success, failure, or blocked) is logged to audit_logs table.
 * 5. Idempotent: checks for existing open follow-up tasks to prevent duplicates.
 * 6. Per-rule enable/disable control.
 */
import { ActionCenter } from '../intelligence/ActionCenter.js';
import { TaskAdapter } from '../core/TaskAdapter.js';
import { CustomerAdapter } from '../core/CustomerAdapter.js';
import { Inventory } from '../capabilities/Inventory.js';
import { OverdueInvoiceRule } from './rules/OverdueInvoiceRule.js';
import { LowStockAlertRule } from './rules/LowStockAlertRule.js';
import { CustomerOnboardingRule } from './rules/CustomerOnboardingRule.js';
import { supabase } from '../../api/supabaseClient.js';

const REGISTERED_RULES = [
  OverdueInvoiceRule,
  LowStockAlertRule,
  CustomerOnboardingRule
];

/**
 * Record an audit log entry in the existing audit_logs table.
 */
export async function logAutomationAuditRecord({
  companyId,
  action,
  entityType = 'automation_rule',
  entityId = 'rule_overdue_invoice_followup',
  entityLabel = 'Overdue Invoice Follow-up',
  details = {},
  severity = 'info'
}) {
  const payload = {
    company_id: companyId || null,
    action: action || 'automation_event',
    entity_type: entityType,
    entity_id: String(entityId || ''),
    entity_label: entityLabel,
    details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
    severity,
    created_at: new Date().toISOString()
  };

  try {
    if (supabase && typeof supabase.from === 'function') {
      await supabase.from('audit_logs').insert(payload);
    }
  } catch (err) {
    console.warn('[AutomationEngine] Failed to write audit_log record:', err);
  }

  return payload;
}

/**
 * Check if the automation engine is enabled for a given tenant.
 * Defaults strictly to FALSE.
 */
export async function isAutomationEnabled(companyId, options = {}) {
  // Explicit option override (e.g. In tests or explicit caller context)
  if (typeof options.automation_enabled === 'boolean') {
    return options.automation_enabled;
  }

  if (!companyId) return false;

  try {
    if (supabase && typeof supabase.from === 'function') {
      // 1. Check platform_config table for global or company-specific automation_enabled flag
      const { data, error } = await supabase
        .from('platform_config')
        .select('key, value')
        .in('key', ['automation_enabled', `automation_enabled_${companyId}`]);

      if (!error && data && data.length > 0) {
        const companySpecific = data.find(d => d.key === `automation_enabled_${companyId}`);
        if (companySpecific) return Boolean(companySpecific.value);

        const globalFlag = data.find(d => d.key === 'automation_enabled');
        if (globalFlag) return Boolean(globalFlag.value);
      }
    }
  } catch (err) {
    // Offline or unconfigured fallback
  }

  return false;
}

export const AutomationEngine = {
  layer: 'BusinessAutomation',
  version: '2.0.0-automation',
  rules: REGISTERED_RULES,

  /**
   * Evaluate automation rules in DRY-RUN mode.
   * Reports what would happen without performing any writes.
   * 
   * @param {string} companyId - Target tenant company identifier
   * @param {object} [options]
   * @returns {Promise<object>} Dry-run evaluation results
   */
  async evaluateRules(companyId, options = {}) {
    if (!companyId) {
      return {
        mode: 'dry_run',
        companyId: null,
        totalRulesEvaluated: 0,
        matchedCount: 0,
        wouldCreateCount: 0,
        alreadyActionedCount: 0,
        matches: [],
        summary: 'No company identifier provided.'
      };
    }

    try {
      const safeFetch = async (fn) => {
        try {
          const res = await fn();
          return Array.isArray(res) ? res : [];
        } catch {
          return [];
        }
      };

      const [overdueInvoices, existingTasks, lowStockAlerts, customers] = await Promise.all([
        safeFetch(() => ActionCenter.getOverdueInvoiceActions(companyId, options)),
        safeFetch(() => TaskAdapter.getTasks(companyId)),
        safeFetch(() => Inventory.getLowStockAlerts(companyId, options)),
        safeFetch(() => CustomerAdapter.getCustomers(companyId, options))
      ]);

      const activeRules = REGISTERED_RULES.filter(r => {
        if (options.disabledRules && options.disabledRules.includes(r.id)) return false;
        if (options.enabledRules && !options.enabledRules.includes(r.id)) return false;
        return r.enabled !== false;
      });

      const allMatches = [];

      for (const rule of activeRules) {
        const matches = rule.evaluate({
          companyId,
          overdueInvoices,
          lowStockAlerts,
          customers,
          existingTasks,
          options
        });
        allMatches.push(...matches);
      }

      const wouldCreate = allMatches.filter(m => !m.alreadyActioned);
      const alreadyActioned = allMatches.filter(m => m.alreadyActioned);

      return {
        mode: 'dry_run',
        companyId,
        totalRulesEvaluated: activeRules.length,
        matchedCount: allMatches.length,
        wouldCreateCount: wouldCreate.length,
        alreadyActionedCount: alreadyActioned.length,
        matches: allMatches,
        summary: `Evaluated ${activeRules.length} rule(s): ${wouldCreate.length} task(s) would be created (${alreadyActioned.length} already actioned/skipped).`
      };
    } catch (err) {
      console.warn('[AutomationEngine] Dry-run evaluation failed:', err);
      return {
        mode: 'dry_run',
        companyId,
        totalRulesEvaluated: 0,
        matchedCount: 0,
        wouldCreateCount: 0,
        alreadyActionedCount: 0,
        matches: [],
        summary: 'Evaluation failed due to an error.'
      };
    }
  },

  /**
   * Explicitly execute automation rules and perform writes.
   * Strictly gated behind `automation_enabled = true`.
   * 
   * @param {string} companyId - Target tenant company identifier
   * @param {object} [options]
   * @returns {Promise<object>} Execution results with audit log records
   */
  async executeRules(companyId, options = {}) {
    if (!companyId) {
      return {
        success: false,
        executed: false,
        blocked: true,
        reason: 'Missing company identifier',
        executions: [],
        auditLogs: []
      };
    }

    // ── 1. SAFETY GATE: Gated behind automation_enabled (defaults to false) ──
    const enabled = await isAutomationEnabled(companyId, options);
    if (!enabled) {
      const blockedAudit = await logAutomationAuditRecord({
        companyId,
        action: 'automation_execution_blocked',
        entityType: 'automation_engine',
        entityId: 'gating_check',
        entityLabel: 'Automation Gating',
        details: {
          reason: 'Automation execution blocked: automation_enabled is false or not configured for tenant.',
          attemptedAt: new Date().toISOString()
        },
        severity: 'warn'
      });

      return {
        success: false,
        executed: false,
        blocked: true,
        reason: 'Automation engine is disabled for this organization (automation_enabled = false).',
        executions: [],
        auditLogs: [blockedAudit]
      };
    }

    // ── 2. EVALUATION & IDEMPOTENCY CHECK ─────────────────────────────────────
    const evaluation = await this.evaluateRules(companyId, options);
    const candidates = evaluation.matches.filter(m => !m.alreadyActioned);

    const executions = [];
    const auditLogs = [];

    // ── 3. EXECUTION WITH RBAC & AUDIT LOGGING ────────────────────────────────
    for (const match of candidates) {
      try {
        // Task creation goes through existing TaskAdapter with RBAC check
        const createdTask = await TaskAdapter.createTask(companyId, match.candidateTask);

        const auditEntry = await logAutomationAuditRecord({
          companyId,
          action: 'automation_rule_executed',
          entityType: 'task',
          entityId: createdTask?.id || match.triggerData?.invoiceId || 'new_task',
          entityLabel: match.ruleName,
          details: {
            ruleId: match.ruleId,
            trigger: match.trigger,
            triggerData: match.triggerData,
            actionTaken: 'created_followup_task',
            createdTaskId: createdTask?.id || null,
            taskTitle: match.candidateTask.title,
            status: 'success'
          },
          severity: 'info'
        });

        executions.push({
          ruleId: match.ruleId,
          triggerData: match.triggerData,
          status: 'success',
          createdTask,
          auditEntry
        });
        auditLogs.push(auditEntry);
      } catch (err) {
        console.error('[AutomationEngine] Task creation failed:', err);

        const errorAudit = await logAutomationAuditRecord({
          companyId,
          action: 'automation_rule_failed',
          entityType: 'task',
          entityId: match.triggerData?.invoiceId || 'unknown',
          entityLabel: match.ruleName,
          details: {
            ruleId: match.ruleId,
            triggerData: match.triggerData,
            error: err.message || String(err),
            status: 'failed'
          },
          severity: 'error'
        });

        executions.push({
          ruleId: match.ruleId,
          triggerData: match.triggerData,
          status: 'failed',
          error: err.message || String(err),
          auditEntry: errorAudit
        });
        auditLogs.push(errorAudit);
      }
    }

    return {
      success: true,
      executed: true,
      blocked: false,
      totalMatched: evaluation.matchedCount,
      tasksCreatedCount: executions.filter(e => e.status === 'success').length,
      skippedAlreadyActionedCount: evaluation.alreadyActionedCount,
      executions,
      auditLogs
    };
  }
};

export default AutomationEngine;
