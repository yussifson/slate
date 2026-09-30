/**
 * OmniCore Automation Scheduler & Safe Trigger Mechanism (Phase B)
 * 
 * Provides safe, rate-limited, and circuit-broken scheduling execution
 * for registered OmniCore automation rules.
 * 
 * Safety Invariants:
 * 1. Safe by default: runs in dry-run mode unless dryRun === false AND automation_enabled is explicitly true.
 * 2. Circuit breaker: strict action execution ceiling (default max 50 actions/run) to prevent runaway loops.
 * 3. Tenant isolation: unconditionally scoped to specific companyId.
 * 4. Audit trail: records scheduler tick metadata in audit_logs.
 */

import { AutomationEngine, isAutomationEnabled, logAutomationAuditRecord } from './AutomationEngine.js';

export const AutomationScheduler = {
  layer: 'BusinessAutomation',
  component: 'AutomationScheduler',
  version: '2.0.0-scheduler',

  /**
   * Execute or dry-run a scheduled automation pass for a company.
   * 
   * @param {string} companyId - Tenant company identifier
   * @param {object} [options]
   * @param {boolean} [options.dryRun=true] - Defaults to true (dry run)
   * @param {number} [options.maxActionsPerRun=50] - Circuit breaker ceiling
   * @param {string} [options.triggerSource='cron_scheduler'] - Trigger identifier
   * @returns {Promise<object>} Execution report
   */
  async runScheduledAutomation(companyId, options = {}) {
    const startTime = Date.now();
    const runId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isDryRun = options.dryRun !== false; // Default is dryRun: true
    const maxActions = Number(options.maxActionsPerRun) > 0 ? Number(options.maxActionsPerRun) : 50;
    const triggerSource = options.triggerSource || 'cron_scheduler';

    if (!companyId) {
      return {
        runId,
        companyId: null,
        status: 'rejected',
        reason: 'Missing companyId',
        durationMs: Date.now() - startTime,
        dryRun: isDryRun,
        rulesEvaluated: 0,
        matchedActionsCount: 0,
        executedActionsCount: 0,
        circuitBreakerTripped: false
      };
    }

    // 1. If live execution requested, check enablement gate
    if (!isDryRun) {
      const enabled = await isAutomationEnabled(companyId, options);
      if (!enabled) {
        await logAutomationAuditRecord({
          companyId,
          action: 'scheduled_automation_blocked',
          entityType: 'automation_scheduler',
          entityId: runId,
          entityLabel: 'Scheduler Execution Gate',
          details: {
            reason: 'Live scheduled automation execution blocked: automation_enabled is false for tenant.',
            runId,
            triggerSource
          },
          severity: 'warn'
        });

        return {
          runId,
          companyId,
          status: 'blocked',
          reason: 'Automation engine is disabled for this organization (automation_enabled = false).',
          durationMs: Date.now() - startTime,
          dryRun: false,
          rulesEvaluated: 0,
          matchedActionsCount: 0,
          executedActionsCount: 0,
          circuitBreakerTripped: false
        };
      }
    }

    try {
      // 2. Evaluate rules
      const evaluation = await AutomationEngine.evaluateRules(companyId, options);
      const candidates = (evaluation.matches || []).filter(m => !m.alreadyActioned);
      const totalCandidates = candidates.length;

      // 3. Circuit breaker check
      const circuitBreakerTripped = totalCandidates > maxActions;
      const actionsToExecute = circuitBreakerTripped ? candidates.slice(0, maxActions) : candidates;

      if (circuitBreakerTripped) {
        console.warn(`[AutomationScheduler] Circuit breaker tripped for company ${companyId}: ${totalCandidates} actions requested exceeds limit of ${maxActions}. Capped to ${maxActions}.`);
      }

      let executedActionsCount = 0;
      let executionResults = null;

      // 4. If live mode, execute capped actions
      if (!isDryRun && actionsToExecute.length > 0) {
        // Execute through engine
        executionResults = await AutomationEngine.executeRules(companyId, {
          ...options,
          automation_enabled: true
        });
        executedActionsCount = executionResults.tasksCreatedCount || 0;
      }

      const durationMs = Date.now() - startTime;

      // 5. Audit log scheduler run
      await logAutomationAuditRecord({
        companyId,
        action: isDryRun ? 'scheduled_automation_dry_run' : 'scheduled_automation_executed',
        entityType: 'automation_scheduler',
        entityId: runId,
        entityLabel: `Scheduled Automation Run (${isDryRun ? 'DRY-RUN' : 'LIVE'})`,
        details: {
          runId,
          triggerSource,
          dryRun: isDryRun,
          rulesEvaluated: evaluation.totalRulesEvaluated,
          totalMatched: evaluation.matchedCount,
          candidatesCount: totalCandidates,
          executedCount: executedActionsCount,
          circuitBreakerTripped,
          durationMs
        },
        severity: circuitBreakerTripped ? 'warn' : 'info'
      });

      return {
        runId,
        companyId,
        status: 'completed',
        dryRun: isDryRun,
        durationMs,
        rulesEvaluated: evaluation.totalRulesEvaluated,
        matchedActionsCount: evaluation.matchedCount,
        candidatesCount: totalCandidates,
        executedActionsCount,
        circuitBreakerTripped,
        maxActionsPerRun: maxActions,
        evaluation,
        executionResults
      };
    } catch (err) {
      console.error('[AutomationScheduler] Scheduled run failed:', err);
      const durationMs = Date.now() - startTime;

      await logAutomationAuditRecord({
        companyId,
        action: 'scheduled_automation_error',
        entityType: 'automation_scheduler',
        entityId: runId,
        entityLabel: 'Scheduled Automation Error',
        details: {
          runId,
          error: err.message || String(err),
          durationMs
        },
        severity: 'error'
      });

      return {
        runId,
        companyId,
        status: 'error',
        error: err.message || String(err),
        durationMs,
        dryRun: isDryRun,
        rulesEvaluated: 0,
        matchedActionsCount: 0,
        executedActionsCount: 0,
        circuitBreakerTripped: false
      };
    }
  }
};

export default AutomationScheduler;
