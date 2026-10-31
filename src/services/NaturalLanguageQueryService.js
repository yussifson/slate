/**
 * Slate V2: Natural Language Business Query Interpreter
 * 
 * Safe query parsing layer designed for Orbit AI integration.
 * Enforces strictly allowlisted query operations, deterministic calculations,
 * and zero execution of arbitrary AI-generated SQL strings.
 */

import { UniversalSearchService } from './UniversalSearchService.js';
import { BusinessExceptionService } from './BusinessExceptionService.js';
import { UnifiedActionCenterService } from './UnifiedActionCenterService.js';

export const NaturalLanguageQueryService = {
  /**
   * Interpret an authorized natural-language prompt into structured operations
   */
  async executeNaturalLanguageQuery(companyId, promptText, callingUser = null) {
    if (!companyId || !promptText || !promptText.trim()) {
      throw new Error('companyId and promptText are required for query execution.');
    }

    const cleanPrompt = promptText.trim().toLowerCase();

    // 1. Intent: Approvals Waiting / Pending Actions
    if (cleanPrompt.includes('approval') || cleanPrompt.includes('waiting for me') || cleanPrompt.includes('action item')) {
      const pendingActions = await UnifiedActionCenterService.getActionItems(companyId, { status: 'pending' });
      return {
        intent: 'PENDING_APPROVALS',
        summary: `Found ${pendingActions.length} pending action item(s) requiring review.`,
        data: pendingActions,
        provenance: 'unified_action_items'
      };
    }

    // 2. Intent: Operational Exceptions / Bottlenecks
    if (cleanPrompt.includes('exception') || cleanPrompt.includes('risk') || cleanPrompt.includes('need attention') || cleanPrompt.includes('falling behind')) {
      const exceptions = await BusinessExceptionService.getOpenExceptions(companyId);
      return {
        intent: 'BUSINESS_EXCEPTIONS',
        summary: `Detected ${exceptions.length} open business exception(s) across operations.`,
        data: exceptions,
        provenance: 'business_exceptions'
      };
    }

    // 3. Intent: Process Health & Metrics
    if (cleanPrompt.includes('health') || cleanPrompt.includes('performance') || cleanPrompt.includes('score')) {
      const health = await BusinessExceptionService.getProcessHealthMetrics(companyId);
      return {
        intent: 'PROCESS_HEALTH',
        summary: `Current operational health score is ${health.healthScore}/100 (${health.statusGrade}).`,
        data: health,
        provenance: 'workflow_executions & business_exceptions'
      };
    }

    // 4. Default: Cross-Domain Universal Search Fallback
    const searchResults = await UniversalSearchService.search(companyId, promptText);
    return {
      intent: 'UNIVERSAL_SEARCH',
      summary: `Found ${searchResults.total} record(s) matching "${promptText}".`,
      data: searchResults.results,
      provenance: 'cross_domain_catalog'
    };
  }
};
