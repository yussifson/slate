import { supabase } from '@/api/supabaseClient';

const money = (value) => Math.round(Number(value || 0) * 100) / 100;
const requireMoney = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative amount.`);
  return money(parsed);
};

const scoped = (table, companyId) => supabase.from(table).select('*').eq('company_id', companyId);

export const JCLFinanceService = {
  async getDashboard(companyId, projectId = null) {
    if (!companyId) return null;
    const [budgets, variations, claims, forecasts, retentions, commitments, bills] = await Promise.all([
      scoped('jcl_project_budgets', companyId).order('created_at', { ascending: false }),
      scoped('jcl_project_variations', companyId).order('created_at', { ascending: false }),
      scoped('jcl_progress_claims', companyId).order('claim_date', { ascending: false }),
      scoped('jcl_cost_forecasts', companyId).order('updated_at', { ascending: false }),
      scoped('jcl_retention_ledger', companyId).order('created_at', { ascending: false }),
      scoped('jcl_project_commitments', companyId).order('created_at', { ascending: false }),
      scoped('fin_supplier_bills', companyId).order('due_date', { ascending: true })
    ]);
    const firstError = [budgets, variations, claims, forecasts, retentions, commitments, bills].find((result) => result.error);
    if (firstError) throw firstError.error;
    const filter = (rows) => projectId ? rows.filter((row) => row.project_id === projectId) : rows;
    const budgetRows = filter(budgets.data || []);
    const variationRows = filter(variations.data || []);
    const claimRows = filter(claims.data || []);
    const commitmentRows = filter(commitments.data || []);
    const billRows = filter(bills.data || []);
    const approvedBudgets = budgetRows.filter((row) => row.approval_status === 'approved');
    const approvedVariations = variationRows.filter((row) => row.status === 'approved' || row.client_acceptance_status === 'accepted');
    const actualCosts = billRows.reduce((sum, bill) => sum + money(bill.amount_paid), 0);
    const committedCosts = commitmentRows.filter((row) => row.status !== 'cancelled').reduce((sum, row) => sum + money(row.outstanding_amount), 0);
    const currentBudget = approvedBudgets.reduce((sum, row) => sum + money(row.current_approved_amount), 0);
    const variationValue = approvedVariations.reduce((sum, row) => sum + money(row.cost_impact), 0);
    const certifiedClaims = claimRows.filter((row) => ['approved', 'partially_certified', 'invoiced', 'partially_paid', 'paid'].includes(row.status));
    const collectedRevenue = claimRows.reduce((sum, row) => sum + money(row.amount_paid), 0);
    const forecast = filter(forecasts.data || []).find((row) => row.is_current) || null;
    const forecastFinalCost = forecast ? money(forecast.forecast_final_cost) : money(actualCosts + committedCosts);
    const contractValue = claimRows.reduce((sum, row) => sum + money(row.contract_value), 0);
    return {
      budgets: budgetRows, variations: variationRows, claims: claimRows, forecasts: filter(forecasts.data || []), retentions: filter(retentions.data || []), commitments: commitmentRows, bills: billRows,
      metrics: { originalBudget: money(budgetRows.reduce((sum, row) => sum + money(row.original_amount), 0)), currentBudget, pendingChanges: variationRows.filter((row) => !['approved', 'rejected', 'cancelled'].includes(row.status)).reduce((sum, row) => sum + money(row.cost_impact), 0), approvedVariations: variationValue, committedCosts, actualCosts, remainingBudget: money(currentBudget - actualCosts - committedCosts), forecastFinalCost, forecastVariance: money(currentBudget - forecastFinalCost), submittedClaims: claimRows.filter((row) => ['draft', 'submitted', 'under_review'].includes(row.status)).reduce((sum, row) => sum + money(row.current_claim_amount), 0), certifiedClaims: certifiedClaims.reduce((sum, row) => sum + money(row.certified_amount), 0), outstandingReceivables: claimRows.reduce((sum, row) => sum + money(row.net_amount_due) - money(row.amount_paid), 0), retentionBalance: filter(retentions.data || []).filter((row) => row.status !== 'released').reduce((sum, row) => sum + money(row.retained_amount) - money(row.released_amount), 0), forecastGrossProfit: money(contractValue - forecastFinalCost), forecastGrossMargin: contractValue ? money(((contractValue - forecastFinalCost) / contractValue) * 100) : 0 }
    };
  },

  async listProjects(companyId) {
    const { data, error } = await supabase.from('ops_projects').select('id, project_code, name, status, currency, budget_amount').eq('company_id', companyId).order('name');
    if (error) throw error;
    return data || [];
  },
  async listBudgets(companyId, projectId = null) { let q = scoped('jcl_project_budgets', companyId).order('version', { ascending: false }); if (projectId) q = q.eq('project_id', projectId); const { data, error } = await q; if (error) throw error; return data || []; },
  async createBudget(companyId, payload, actorId) {
    const original = requireMoney(payload.original_amount, 'Original budget');
    const { data, error } = await supabase.from('jcl_project_budgets').insert({ company_id: companyId, project_id: payload.project_id || null, budget_reference: payload.budget_reference || `BUD-${Date.now().toString().slice(-6)}`, title: payload.title.trim(), version: Number(payload.version || 1), currency: payload.currency || 'USD', preparation_date: payload.preparation_date || new Date().toISOString().slice(0, 10), prepared_by: actorId, original_amount: original, current_approved_amount: original, review_status: 'draft', approval_status: 'draft', notes: payload.notes || null }).select().single();
    if (error) throw error; return data;
  },
  async listVariations(companyId, projectId = null) { let q = scoped('jcl_project_variations', companyId).order('created_at', { ascending: false }); if (projectId) q = q.eq('project_id', projectId); const { data, error } = await q; if (error) throw error; return data || []; },
  async createVariation(companyId, payload, actorId) { const impact = requireMoney(payload.cost_impact, 'Cost impact'); const { data, error } = await supabase.from('jcl_project_variations').insert({ company_id: companyId, project_id: payload.project_id || null, variation_reference: payload.variation_reference || `VAR-${Date.now().toString().slice(-6)}`, title: payload.title.trim(), description: payload.description || null, variation_type: payload.variation_type || 'other', requested_by: actorId, request_date: new Date().toISOString().slice(0, 10), cost_impact: impact, schedule_impact_days: Number(payload.schedule_impact_days || 0), status: 'draft', approval_status: 'not_submitted', client_acceptance_status: 'not_submitted' }).select().single(); if (error) throw error; return data; },
  async listClaims(companyId, projectId = null) { let q = scoped('jcl_progress_claims', companyId).order('claim_date', { ascending: false }); if (projectId) q = q.eq('project_id', projectId); const { data, error } = await q; if (error) throw error; return data || []; },
  async createClaim(companyId, payload, actorId) { const amount = requireMoney(payload.current_claim_amount, 'Claim amount'); const retention = requireMoney(payload.retention_deduction, 'Retention deduction'); const deductions = requireMoney(payload.other_deductions, 'Other deductions'); const tax = requireMoney(payload.tax_amount, 'Tax'); const net = money(amount - retention - deductions + tax); if (net < 0) throw new Error('Deductions cannot exceed the submitted claim amount.'); const { data, error } = await supabase.from('jcl_progress_claims').insert({ company_id: companyId, project_id: payload.project_id || null, claim_reference: payload.claim_reference || `CLM-${Date.now().toString().slice(-6)}`, claim_period: payload.claim_period || null, claim_date: new Date().toISOString().slice(0, 10), description: payload.description || null, current_claim_amount: amount, certified_amount: 0, retention_deduction: retention, other_deductions: deductions, tax_amount: tax, net_amount_due: net, amount_paid: 0, status: 'draft', created_by: actorId }).select().single(); if (error) throw error; return data; },
  async createForecast(companyId, payload, actorId) { const estimated = requireMoney(payload.estimated_cost_to_complete, 'Estimated cost to complete'); const actual = requireMoney(payload.actual_costs, 'Actual costs'); const committed = requireMoney(payload.remaining_commitments, 'Remaining commitments'); const { data, error } = await supabase.from('jcl_cost_forecasts').insert({ company_id: companyId, project_id: payload.project_id || null, forecast_reference: payload.forecast_reference || `FC-${Date.now().toString().slice(-6)}`, actual_costs: actual, remaining_commitments: committed, estimated_uncommitted_cost: estimated, forecast_final_cost: money(actual + committed + estimated), assumption_notes: payload.assumption_notes || null, prepared_by: actorId, is_current: true }).select().single(); if (error) throw error; return data; },
  async recordRetention(companyId, payload, actorId) { const retained = requireMoney(payload.retained_amount, 'Retained amount'); const { data, error } = await supabase.from('jcl_retention_ledger').insert({ company_id: companyId, project_id: payload.project_id || null, source_type: payload.source_type || 'client_claim', source_id: payload.source_id || null, retention_basis: payload.retention_basis || null, retention_percentage: payload.retention_percentage === '' ? null : Number(payload.retention_percentage), retained_amount: retained, released_amount: 0, status: 'held', expected_release_date: payload.expected_release_date || null, created_by: actorId }).select().single(); if (error) throw error; return data; }
};

export { money };
