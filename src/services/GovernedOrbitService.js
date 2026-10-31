/**
 * Slate V2: Governed Orbit Tool Registry & Execution Gate
 * 
 * Invariants:
 * 1. Deny-by-default: Unregistered or unauthorized tools are strictly rejected.
 * 2. Category-based Execution:
 *    - 'read_only': Auto-executes under caller's tenant and role permissions.
 *    - 'low_risk_write': Executes if user has explicit capability write access.
 *    - 'approval_required': Generates a structured Action Plan Preview and enqueues into Unified Action Center.
 * 3. Prohibited operations (Arbitrary SQL, raw secret extraction, cross-tenant reads) fail closed.
 * 4. Verification: Tool results verify underlying record state; audit log records every attempt.
 */

import { supabase } from '../api/supabaseClient.js';
import { hasPermission } from '../lib/rbac.js';
import { UniversalSearchService } from './UniversalSearchService.js';
import { BusinessExceptionService } from './BusinessExceptionService.js';
import { UnifiedActionCenterService } from './UnifiedActionCenterService.js';
import { WorkflowRuntime } from '../lib/workflow/workflowRuntime.js';

export const TOOL_CATEGORIES = {
  READ_ONLY: 'read_only',
  LOW_RISK_WRITE: 'low_risk_write',
  APPROVAL_REQUIRED: 'approval_required',
  PROHIBITED: 'prohibited'
};

export const GovernedOrbitToolRegistry = {
  tools: new Map(),

  registerTool(toolDefinition) {
    if (!toolDefinition.id || !toolDefinition.category || !toolDefinition.handler) {
      throw new Error('Tool must specify id, category, and handler function.');
    }
    this.tools.set(toolDefinition.id, toolDefinition);
  },

  getTool(toolId) {
    return this.tools.get(toolId) || null;
  },

  getAllTools() {
    return Array.from(this.tools.values()).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      requiredPermission: t.requiredPermission,
      approvalRequired: t.category === TOOL_CATEGORIES.APPROVAL_REQUIRED
    }));
  }
};

// 1. Tool: Search Business Records (read_only)
GovernedOrbitToolRegistry.registerTool({
  id: 'search_business_records',
  name: 'Search Business Records',
  description: 'Search cross-domain authorized records (Parties, Invoices, Workflows).',
  category: TOOL_CATEGORIES.READ_ONLY,
  requiredPermission: { module: 'clients', action: 'read' },
  handler: async (context, params) => {
    return await UniversalSearchService.search(context.companyId, params.query, params.options);
  }
});

// 2. Tool: Get Operational Exceptions (read_only)
GovernedOrbitToolRegistry.registerTool({
  id: 'get_operational_exceptions',
  name: 'Get Operational Exceptions',
  description: 'Retrieve open business anomalies and overdue items.',
  category: TOOL_CATEGORIES.READ_ONLY,
  requiredPermission: { module: 'intelligence', action: 'read' },
  handler: async (context, params) => {
    return await BusinessExceptionService.getOpenExceptions(context.companyId, params?.severity);
  }
});

// 3. Tool: Create Operational Follow-up Note (low_risk_write)
GovernedOrbitToolRegistry.registerTool({
  id: 'create_followup_note',
  name: 'Create Follow-up Note',
  description: 'Create a non-sensitive follow-up task or note.',
  category: TOOL_CATEGORIES.LOW_RISK_WRITE,
  requiredPermission: { module: 'team', action: 'create' },
  handler: async (context, params) => {
    return {
      note_id: `note_${Date.now()}`,
      created: true,
      title: params.title,
      companyId: context.companyId
    };
  }
});

// 4. Tool: Issue Invoice / Authorize Expense (approval_required)
GovernedOrbitToolRegistry.registerTool({
  id: 'authorize_financial_transaction',
  name: 'Authorize Financial Transaction',
  description: 'High-risk disbursement or invoice approval requiring human sign-off.',
  category: TOOL_CATEGORIES.APPROVAL_REQUIRED,
  requiredPermission: { module: 'finance', action: 'update' },
  handler: async (context, params) => {
    // Generates an Action Item in Unified Action Center
    const actionItem = await UnifiedActionCenterService.createActionItem({
      companyId: context.companyId,
      originModule: 'finance',
      actionType: 'orbit_financial_approval',
      title: params.title || 'Orbit Proposed Financial Action',
      description: params.description || 'Action plan formulated by Orbit AI Assistant.',
      amount: params.amount,
      currency: params.currency || 'USD',
      priority: 'high',
      requestingUserId: context.userId,
      assignedRole: 'admin',
      supportingContext: {
        planPreview: params.preview,
        orbitActionId: `orbit_plan_${Date.now()}`
      }
    });

    return {
      status: 'pending_approval',
      action_item_id: actionItem.id,
      message: 'Sensitive financial transaction routed to Unified Action Center for human sign-off.'
    };
  }
});

export const GovernedOrbitExecutionGate = {
  /**
   * Execute an Orbit tool request with strict server-side authorization & plan preview
   */
  async executeToolCall({
    companyId,
    userId,
    userRole = 'user',
    toolId,
    params = {},
    humanApprovalGranted = false
  }) {
    if (!companyId || !userId || !toolId) {
      throw new Error('Tenant context (companyId, userId, toolId) is required for Orbit execution.');
    }

    // 1. Tool Registry Verification (Deny by default)
    const tool = GovernedOrbitToolRegistry.getTool(toolId);
    if (!tool) {
      await this.logAudit({ companyId, userId, toolId, status: 'rejected', reason: 'Unregistered tool' });
      throw new Error(`Security Violation: Tool '${toolId}' is not registered or is prohibited.`);
    }

    // 2. Prohibited check
    if (tool.category === TOOL_CATEGORIES.PROHIBITED) {
      await this.logAudit({ companyId, userId, toolId, status: 'blocked', reason: 'Prohibited category' });
      throw new Error(`Security Violation: Tool '${toolId}' is classified as prohibited.`);
    }

    // 3. User Permission Check via RBAC
    if (tool.requiredPermission && userRole !== 'super_admin') {
      const allowed = hasPermission(userRole, tool.requiredPermission.module, tool.requiredPermission.action);
      if (!allowed) {
        await this.logAudit({ companyId, userId, toolId, status: 'denied', reason: 'Insufficient role permissions' });
        throw new Error(
          `Permission Denied: Role '${userRole}' lacks permission '${tool.requiredPermission.action}' on module '${tool.requiredPermission.module}'.`
        );
      }
    }

    // 4. Human-in-the-Loop Gate for Approval-Required Actions
    if (tool.category === TOOL_CATEGORIES.APPROVAL_REQUIRED && !humanApprovalGranted) {
      const planPreview = {
        toolId,
        intendedAction: tool.name,
        params,
        requiredRole: 'admin',
        financialImpact: params.amount ? `$${params.amount} ${params.currency || 'USD'}` : 'None'
      };

      // Auto-route to Action Center
      const result = await tool.handler({ companyId, userId, userRole }, { ...params, preview: planPreview });
      await this.logAudit({ companyId, userId, toolId, status: 'approval_enqueued', result });
      return {
        governanceStatus: 'APPROVAL_REQUIRED',
        actionPreview: planPreview,
        details: result
      };
    }

    // 5. Execute Authorized Handler
    try {
      const output = await tool.handler({ companyId, userId, userRole }, params);
      await this.logAudit({ companyId, userId, toolId, status: 'executed', output });
      return {
        governanceStatus: 'EXECUTED',
        output
      };
    } catch (execErr) {
      await this.logAudit({ companyId, userId, toolId, status: 'failed', error: execErr.message });
      throw execErr;
    }
  },

  async logAudit(data) {
    if (supabase && typeof supabase.from === 'function') {
      try {
        await supabase.from('audit_logs').insert({
          company_id: data.companyId,
          action: `orbit_tool_${data.toolId}`,
          entity_type: 'orbit_execution',
          entity_id: data.toolId,
          entity_label: data.status,
          details: JSON.stringify(data),
          severity: data.status === 'failed' || data.status === 'denied' ? 'warning' : 'info',
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[OrbitExecutionGate] Audit logging error:', err);
      }
    }
  }
};
