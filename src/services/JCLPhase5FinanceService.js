import { supabase } from '@/api/supabaseClient';

const monetary = value => Number(value || 0);

function assertCompany(companyId) {
  if (!companyId) throw new Error('A company is required.');
}

export const JCLPhase5FinanceService = {
  async getPortfolioSummary(companyId) {
    assertCompany(companyId);
    const { data, error } = await supabase
      .from('jcl_project_finance_summary')
      .select('project_id, project_code, project_name, approved_budget, actual_cost, committed_cost, approved_variations, pending_variations, submitted_claims, certified_claims, retention_balance, forecast_final_cost, forecast_variance')
      .eq('company_id', companyId)
      .order('project_name');
    if (error) throw error;
    return data || [];
  },

  async listProjects(companyId) {
    assertCompany(companyId);
    const { data, error } = await supabase
      .from('ops_projects')
      .select('id, project_code, name, status, priority, project_type')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async listBudgets(companyId, projectId) {
    assertCompany(companyId);
    let query = supabase
      .from('jcl_project_budgets')
      .select('id, project_id, budget_reference, title, version, currency, approval_status, review_status, effective_date, notes, created_at, jcl_project_budget_lines(id, cost_code, description, category, quantity, unit_of_measure, unit_rate, total_amount)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listVariations(companyId, projectId) {
    assertCompany(companyId);
    let query = supabase.from('jcl_project_variations').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listClaims(companyId, projectId) {
    assertCompany(companyId);
    let query = supabase.from('jcl_progress_claims').select('*').eq('company_id', companyId).order('claim_date', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createBudget({ companyId, projectId, budget, lines }) {
    assertCompany(companyId);
    if (!projectId || !budget?.title || !Array.isArray(lines) || lines.length === 0) throw new Error('Project, budget title and at least one budget line are required.');
    const { data: budgetRow, error: budgetError } = await supabase.from('jcl_project_budgets').insert({
      company_id: companyId,
      project_id: projectId,
      budget_reference: budget.budget_reference || `BUD-${Date.now()}`,
      title: budget.title,
      version: Number(budget.version || 1),
      currency: budget.currency || 'GHS',
      notes: budget.notes || null,
      approval_status: 'draft',
      review_status: 'draft'
    }).select('id').single();
    if (budgetError) throw budgetError;
    const { error: lineError } = await supabase.from('jcl_project_budget_lines').insert(lines.map(line => ({
      company_id: companyId,
      budget_id: budgetRow.id,
      cost_code: line.cost_code,
      description: line.description,
      category: line.category,
      quantity: monetary(line.quantity || 1),
      unit_of_measure: line.unit_of_measure || null,
      unit_rate: monetary(line.unit_rate)
    })));
    if (lineError) {
      await supabase.from('jcl_project_budgets').delete().eq('id', budgetRow.id).eq('company_id', companyId);
      throw lineError;
    }
    return budgetRow.id;
  },

  async createVariation({ companyId, projectId, variation }) {
    assertCompany(companyId);
    const { data, error } = await supabase.from('jcl_project_variations').insert({
      company_id: companyId,
      project_id: projectId,
      variation_reference: variation.variation_reference || `VAR-${Date.now()}`,
      title: variation.title,
      description: variation.description || null,
      reason: variation.reason || null,
      variation_type: variation.variation_type || 'other',
      proposed_value_adjustment: monetary(variation.proposed_value_adjustment),
      cost_impact: monetary(variation.cost_impact),
      schedule_impact_days: Number(variation.schedule_impact_days || 0),
      approval_status: 'draft'
    }).select().single();
    if (error) throw error;
    return data;
  },

  async createClaim({ companyId, projectId, claim }) {
    assertCompany(companyId);
    const { data, error } = await supabase.from('jcl_progress_claims').insert({
      company_id: companyId,
      project_id: projectId,
      client_id: claim.client_id || null,
      claim_reference: claim.claim_reference || `CLM-${Date.now()}`,
      claim_period_start: claim.claim_period_start || null,
      claim_period_end: claim.claim_period_end || null,
      description: claim.description || null,
      current_claim_amount: monetary(claim.current_claim_amount),
      retention_amount: monetary(claim.retention_amount),
      tax_amount: monetary(claim.tax_amount),
      other_deductions: monetary(claim.other_deductions),
      approval_status: 'draft'
    }).select().single();
    if (error) throw error;
    return data;
  }
};
