/**
 * Slate V2 Human-in-the-Loop Approval & Action Center Service
 * 
 * Manages pending business approvals across Finance, Contracts, HR, and Workflows.
 * Resumes paused workflow executions when human decisions are submitted.
 */

import { supabase } from '../api/supabaseClient.js';
import { WorkflowRuntime } from '../lib/workflow/workflowRuntime.js';

export const UnifiedActionCenterService = {
  /**
   * Fetch action items for a given tenant with optional status filtering.
   */
  async getActionItems(companyId, filter = {}) {
    if (!companyId) return [];

    if (supabase && typeof supabase.from === 'function') {
      let query = supabase
        .from('unified_action_items')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.assignedUserId) {
        query = query.eq('assigned_user_id', filter.assignedUserId);
      }
      if (filter.originModule) {
        query = query.eq('origin_module', filter.originModule);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    return [];
  },

  /**
   * Create an action item (e.g. from an automated workflow pause or module escalation).
   */
  async createActionItem({
    companyId,
    policyId = null,
    workflowExecutionId = null,
    workflowStepId = null,
    originModule,
    actionType,
    title,
    description = '',
    priority = 'medium',
    amount = null,
    currency = 'USD',
    requestingUserId = null,
    assignedRole = 'admin',
    assignedUserId = null,
    supportingContext = {},
    dueDate = null
  }) {
    if (!companyId || !originModule || !actionType || !title) {
      throw new Error('companyId, originModule, actionType, and title are required to create an action item.');
    }

    const record = {
      company_id: companyId,
      policy_id: policyId,
      workflow_execution_id: workflowExecutionId,
      workflow_step_id: workflowStepId,
      origin_module: originModule,
      action_type: actionType,
      title,
      description,
      priority,
      amount,
      currency,
      requesting_user_id: requestingUserId,
      assigned_role: assignedRole,
      assigned_user_id: assignedUserId,
      status: 'pending',
      supporting_context: supportingContext,
      due_date: dueDate,
      created_at: new Date().toISOString()
    };

    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('unified_action_items')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return { id: `mock-action-${Date.now()}`, ...record };
  },

  /**
   * Record a human decision (approved, rejected, info_requested, escalated).
   * Validates authorization, verifies expiration, enforces separation of duties (no self-approval if policy prohibits),
   * atomically updates status via conditional update WHERE status IN ('pending', 'info_requested'),
   * creates an audit record in action_decisions, and resumes workflow execution if applicable.
   */
  async recordDecision({
    companyId,
    actionItemId,
    decision, // 'approved', 'rejected', 'info_requested', 'escalated'
    reason = '',
    decidedByUserId,
    decidedByUserRole = null
  }) {
    if (!companyId || !actionItemId || !decision || !decidedByUserId) {
      throw new Error('companyId, actionItemId, decision, and decidedByUserId are required.');
    }

    // 1. Fetch current action item
    let item = null;
    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('unified_action_items')
        .select('*')
        .eq('id', actionItemId)
        .eq('company_id', companyId)
        .single();

      if (error || !data) {
        throw new Error('Action item not found or unauthorized.');
      }
      item = data;
    } else {
      item = {
        id: actionItemId,
        company_id: companyId,
        status: 'pending',
        workflow_execution_id: null
      };
    }

    if (item.status !== 'pending' && item.status !== 'info_requested') {
      throw new Error(`Action item cannot be updated from status: ${item.status}`);
    }

    // A. Check Expiration: Expired actions cannot be approved
    if (item.expires_at && new Date(item.expires_at).getTime() < Date.now()) {
      if (supabase && typeof supabase.from === 'function') {
        await supabase
          .from('unified_action_items')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', actionItemId);
      }
      throw new Error('Cannot approve an expired action item. Requires reopening by administrator.');
    }

    // B. Separation of Duties: Requester cannot approve their own financial/sensitive request
    if (decision === 'approved' && item.requesting_user_id && item.requesting_user_id === decidedByUserId) {
      throw new Error('Separation of duties violation: Requester cannot approve their own action item.');
    }

    // C. Approver Role Authorization Check (if action assigned to specific role)
    if (item.assigned_role && decidedByUserRole && decidedByUserRole !== 'super_admin' && decidedByUserRole !== 'admin') {
      if (item.assigned_role !== decidedByUserRole) {
        throw new Error(`Unauthorized: Action requires role '${item.assigned_role}', user has '${decidedByUserRole}'.`);
      }
    }

    const previousStatus = item.status;
    const nextStatus = decision;

    // 2. Concurrency-Safe Atomic Status Transition
    if (supabase && typeof supabase.from === 'function') {
      const { data: updated, error: updateError } = await supabase
        .from('unified_action_items')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionItemId)
        .in('status', ['pending', 'info_requested'])
        .select()
        .maybeSingle();

      if (updateError || !updated) {
        throw new Error('Action item status conflict: already updated or processed by another reviewer.');
      }

      // 3. Insert decision audit record into action_decisions
      const { error: decError } = await supabase
        .from('action_decisions')
        .insert({
          action_item_id: actionItemId,
          company_id: companyId,
          decision,
          reason,
          decided_by: decidedByUserId,
          previous_status: previousStatus,
          metadata: { timestamp: new Date().toISOString() }
        });

      if (decError) throw decError;
    }

    // 4. If this action was gating a paused workflow execution and decision is 'approved', resume it
    let workflowResumeResult = null;
    if (item.workflow_execution_id && decision === 'approved') {
      const runtime = new WorkflowRuntime({ supabase });
      workflowResumeResult = await runtime.executeWorkflow({
        workflowId: item.supporting_context?.workflow_id,
        companyId,
        resumeExecutionId: item.workflow_execution_id,
        inputPayload: {
          ...item.supporting_context,
          approval_granted: true,
          approved_by: decidedByUserId
        }
      });
    }

    return {
      success: true,
      actionItemId,
      previousStatus,
      newStatus: nextStatus,
      workflowResumed: Boolean(workflowResumeResult),
      workflowResumeResult
    };
  }
};
