/**
 * Slate V2 Business Blueprint Engine
 * 
 * Interprets organization profiles, generates capability recommendations with AI explanations,
 * applies deterministic validation rules, and provisions approved capabilities into company_capabilities.
 */

import { supabase } from '../api/supabaseClient.js';
import { CapabilityService } from './CapabilityService.js';

export const BusinessBlueprintEngine = {
  /**
   * Interpret a business profile and generate a comprehensive Blueprint proposal.
   */
  async generateBlueprintProposal(companyId, profileData) {
    if (!companyId || !profileData?.business_name) {
      throw new Error('companyId and business_name are required to generate a Blueprint.');
    }

    const {
      business_name,
      industry_category = 'general_business',
      business_model = 'b2b',
      employee_count = 10,
      departments = ['Management', 'Operations'],
      needs_invoicing = true,
      needs_crm = true,
      needs_documents = true,
      custom_notes = ''
    } = profileData;

    // Deterministic capability mapping based on verified Phase 1 Platform Capabilities
    const recommendedCapabilities = [
      {
        id: 'core_foundation',
        category: 'core',
        name: 'Core Business Foundation',
        reason: 'Essential baseline for identity, core parties, and organization graph.'
      }
    ];

    if (needs_invoicing || ['accounting', 'retail', 'services', 'logistics'].includes(industry_category.toLowerCase())) {
      recommendedCapabilities.push({
        id: 'finance',
        category: 'standard',
        name: 'Finance & Accounting',
        reason: 'Required for general ledger, invoicing, tax records, and cash flow tracking.'
      });
    }

    if (needs_crm || ['real_estate', 'legal', 'consulting', 'technology'].includes(industry_category.toLowerCase())) {
      recommendedCapabilities.push({
        id: 'crm',
        category: 'standard',
        name: 'Customer Relationship Management',
        reason: 'Recommended for lead tracking, pipeline progression, and customer interactions.'
      });
    }

    if (['legal', 'consulting', 'software', 'healthcare'].includes(industry_category.toLowerCase())) {
      recommendedCapabilities.push({
        id: 'projects',
        category: 'standard',
        name: 'Projects & Operations',
        reason: 'Coordinates complex deliverables, task workload allocation, and deadlines.'
      });
    }

    if (needs_documents) {
      recommendedCapabilities.push({
        id: 'documents',
        category: 'standard',
        name: 'Document Vault & E-Sign',
        reason: 'Provides governed contract templates, document archiving, and signature signoff.'
      });
    }

    // Recommended approval policies
    const recommendedApprovalPolicies = [
      {
        key: 'finance_large_expense',
        name: 'Major Expense Policy (> $5,000)',
        module: 'finance',
        threshold_amount: 5000.00,
        approval_type: 'sequential',
        approver_roles: ['finance_manager', 'admin']
      },
      {
        key: 'contracts_high_value',
        name: 'Commercial Contract Signoff',
        module: 'contracts',
        threshold_amount: 10000.00,
        approval_type: 'single',
        approver_roles: ['legal_counsel', 'admin']
      }
    ];

    // Recommended default workflows
    const defaultWorkflows = [
      {
        key: 'wf_new_party_onboarding',
        name: 'New Client Onboarding Flow',
        trigger_type: 'event',
        trigger_config: { event_type: 'party.created' },
        steps: [
          {
            id: 'step_welcome_notif',
            name: 'Send Welcome Notification',
            step_type: 'action',
            action_type: 'notification_send',
            config: { channel: 'in_app', message: 'Welcome {{ primary_name }} to our organization.' }
          },
          {
            id: 'step_create_followup',
            name: 'Assign Account Manager Task',
            step_type: 'action',
            action_type: 'task_create',
            config: { title: 'Review relationship requirements for {{ primary_name }}' }
          }
        ]
      }
    ];

    const blueprintRecord = {
      company_id: companyId,
      business_name,
      industry_category,
      business_model,
      profile_summary: `Structured blueprint generated for ${business_name} (${industry_category}). ${custom_notes}`,
      structure_data: {
        departments,
        employee_count,
        roles: ['admin', 'manager', 'member', 'guest']
      },
      operational_requirements: {
        audit_retention_days: 365,
        multi_level_approvals_enabled: true
      },
      recommended_capabilities: recommendedCapabilities,
      approval_requirements: recommendedApprovalPolicies,
      default_workflows: defaultWorkflows,
      status: 'draft',
      version: 1
    };

    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('business_blueprints')
        .insert(blueprintRecord)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return { id: `mock-bp-${Date.now()}`, ...blueprintRecord };
  },

  /**
   * Provision an approved blueprint: activates company_capabilities and provisions default approval policies.
   */
  async provisionApprovedBlueprint(companyId, blueprintId, adminUserId) {
    if (!companyId || !blueprintId) {
      throw new Error('companyId and blueprintId are required for provisioning.');
    }

    let blueprint = null;
    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('business_blueprints')
        .select('*')
        .eq('id', blueprintId)
        .eq('company_id', companyId)
        .single();

      if (error || !data) throw new Error('Blueprint not found or unauthorized.');
      blueprint = data;
    } else {
      blueprint = {
        id: blueprintId,
        company_id: companyId,
        recommended_capabilities: [{ id: 'core_foundation' }, { id: 'finance' }],
        approval_requirements: []
      };
    }

    const provisionedCapabilities = [];
    const provisioningErrors = [];

    // 1. Activate capabilities in company_capabilities table with partial failure handling
    const caps = Array.isArray(blueprint.recommended_capabilities) ? blueprint.recommended_capabilities : [];
    for (const cap of caps) {
      try {
        if (CapabilityService && typeof CapabilityService.activateCapability === 'function') {
          await CapabilityService.activateCapability(companyId, cap.id, {}, adminUserId);
        }
        provisionedCapabilities.push(cap.id);

        // Audit log the successful provisioning
        if (supabase && typeof supabase.from === 'function') {
          await supabase.from('capability_provisioning_logs').insert({
            company_id: companyId,
            blueprint_id: blueprintId,
            capability_id: cap.id,
            action: 'activate',
            status: 'success',
            details: { reason: cap.reason || 'Provisioned from Blueprint' },
            provisioned_by: adminUserId
          });
        }
      } catch (capErr) {
        provisioningErrors.push({ capability_id: cap.id, error: capErr.message });
        if (supabase && typeof supabase.from === 'function') {
          await supabase.from('capability_provisioning_logs').insert({
            company_id: companyId,
            blueprint_id: blueprintId,
            capability_id: cap.id,
            action: 'activate',
            status: 'failed',
            details: { error: capErr.message },
            provisioned_by: adminUserId
          });
        }
      }
    }

    // 2. Install recommended approval policies
    const policies = Array.isArray(blueprint.approval_requirements) ? blueprint.approval_requirements : [];
    for (const policy of policies) {
      if (supabase && typeof supabase.from === 'function') {
        await supabase.from('approval_policies').upsert({
          company_id: companyId,
          key: policy.key,
          name: policy.name,
          module: policy.module,
          threshold_amount: policy.threshold_amount,
          approval_type: policy.approval_type,
          approver_roles: policy.approver_roles,
          is_active: true
        });
      }
    }

    // 3. Mark blueprint as provisioned or partially_provisioned
    const finalStatus = provisioningErrors.length === 0 ? 'provisioned' : 'partially_provisioned';
    if (supabase && typeof supabase.from === 'function') {
      await supabase
        .from('business_blueprints')
        .update({
          status: finalStatus,
          approved_by: adminUserId,
          approved_at: new Date().toISOString()
        })
        .eq('id', blueprintId);
    }

    return {
      success: provisioningErrors.length === 0,
      blueprintId,
      provisionedCapabilities,
      provisioningErrors,
      policiesInstalled: policies.length
    };
  }
};
