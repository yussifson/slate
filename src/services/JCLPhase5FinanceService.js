import { supabase } from '@/api/supabaseClient';
import { getCompanyProjects, ensureValidProjectId } from '@/services/ProjectLookupService';

const monetary = value => Number(value || 0);

function assertCompany(companyId) {
  if (!companyId) throw new Error('A company is required.');
}

export const JCLPhase5FinanceService = {
  async getPortfolioSummary(companyId) {
    assertCompany(companyId);
    try {
      const { data, error } = await supabase
        .from('jcl_project_finance_summary')
        .select('project_id, project_code, project_name, approved_budget, actual_cost, committed_cost, approved_variations, pending_variations, submitted_claims, certified_claims, retention_balance, forecast_final_cost, forecast_variance')
        .eq('company_id', companyId)
        .order('project_name');
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('[JCLPhase5FinanceService] summary fetch warning:', err);
    }

    // Dynamic fallback: compute summary from budgets, variations, and claims
    try {
      const projects = await this.listProjects(companyId);
      const [budgets, variations, claims] = await Promise.all([
        this.listBudgets(companyId).catch(() => []),
        this.listVariations(companyId).catch(() => []),
        this.listClaims(companyId).catch(() => [])
      ]);

      if (projects.length === 0 && budgets.length === 0 && variations.length === 0 && claims.length === 0) {
        return [];
      }

      // Group by project
      const summaryMap = new Map();
      projects.forEach(p => {
        summaryMap.set(p.id, {
          project_id: p.id,
          project_code: p.project_code || 'PRJ',
          project_name: p.name || 'Unnamed Project',
          approved_budget: 0,
          actual_cost: 0,
          committed_cost: 0,
          approved_variations: 0,
          pending_variations: 0,
          submitted_claims: 0,
          certified_claims: 0,
          retention_balance: 0,
          forecast_final_cost: 0,
          forecast_variance: 0
        });
      });

      budgets.forEach(b => {
        const item = summaryMap.get(b.project_id) || {
          project_id: b.project_id,
          project_code: 'BUD',
          project_name: b.title || 'Project Budget',
          approved_budget: 0, actual_cost: 0, committed_cost: 0, approved_variations: 0,
          pending_variations: 0, submitted_claims: 0, certified_claims: 0, retention_balance: 0,
          forecast_final_cost: 0, forecast_variance: 0
        };
        const linesTotal = (b.jcl_project_budget_lines || []).reduce((sum, l) => sum + (Number(l.total_amount) || (Number(l.quantity || 1) * Number(l.unit_rate || 0))), 0);
        item.approved_budget += linesTotal || Number(b.total_amount || 0);
        summaryMap.set(b.project_id, item);
      });

      variations.forEach(v => {
        const item = summaryMap.get(v.project_id);
        if (item) {
          const impact = Number(v.cost_impact || v.proposed_value_adjustment || 0);
          item.committed_cost += impact;
          item.pending_variations += impact;
        }
      });

      claims.forEach(c => {
        const item = summaryMap.get(c.project_id);
        if (item) {
          const amt = Number(c.current_claim_amount || 0);
          item.certified_claims += amt;
          item.actual_cost += amt;
        }
      });

      const result = Array.from(summaryMap.values()).map(row => {
        row.forecast_final_cost = row.actual_cost + row.committed_cost;
        row.forecast_variance = row.approved_budget - row.forecast_final_cost;
        return row;
      });

      return result.filter(r => r.approved_budget > 0 || r.actual_cost > 0 || r.committed_cost > 0 || r.certified_claims > 0 || projects.some(p => p.id === r.project_id));
    } catch (fallbackErr) {
      console.warn('[JCLPhase5FinanceService] summary computation failed:', fallbackErr);
      return [];
    }
  },

  async listProjects(companyId) {
    assertCompany(companyId);
    try {
      const allProjects = await getCompanyProjects(companyId);
      if (allProjects && allProjects.length > 0) {
        return allProjects;
      }
    } catch (err) {
      console.warn('[JCLPhase5FinanceService] getCompanyProjects caught:', err);
    }

    try {
      const { data, error } = await supabase
        .from('ops_projects')
        .select('id, project_code, name, status, priority, project_type')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data || [];
    } catch (_) {
      return [];
    }
  },

  async listBudgets(companyId, projectId) {
    assertCompany(companyId);
    const budgets = [];
    try {
      let query = supabase
        .from('jcl_project_budgets')
        .select('id, project_id, budget_reference, title, version, currency, approval_status, review_status, effective_date, notes, created_at, jcl_project_budget_lines(id, cost_code, description, category, quantity, unit_of_measure, unit_rate, total_amount)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        budgets.push(...data);
      }
    } catch (err) {
      console.warn('[JCLPhase5FinanceService] listBudgets Supabase query failed:', err);
    }

    // Also load from industry_records mirror
    try {
      let indQuery = supabase
        .from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('record_type', 'project_budget');
      const { data: indData } = await indQuery;
      if (Array.isArray(indData)) {
        indData.forEach(row => {
          const parsed = typeof row.data === 'string' ? JSON.parse(row.data || '{}') : (row.data || {});
          if (!budgets.some(b => b.id === row.id)) {
            if (!projectId || parsed.project_id === projectId) {
              budgets.push({
                id: row.id,
                project_id: parsed.project_id,
                budget_reference: parsed.budget_reference || `BUD-${row.id.slice(-4)}`,
                title: parsed.title,
                version: parsed.version || 1,
                currency: parsed.currency || 'GHS',
                approval_status: parsed.approval_status || 'draft',
                review_status: parsed.review_status || 'draft',
                notes: parsed.notes,
                created_at: parsed.created_at || row.created_at,
                jcl_project_budget_lines: parsed.lines || []
              });
            }
          }
        });
      }
    } catch (_) {}

    return budgets;
  },

  async listVariations(companyId, projectId) {
    assertCompany(companyId);
    const variations = [];
    try {
      let query = supabase.from('jcl_project_variations').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        variations.push(...data);
      }
    } catch (_) {}

    // Also check industry_records
    try {
      const { data: indData } = await supabase
        .from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('record_type', 'project_variation');
      if (Array.isArray(indData)) {
        indData.forEach(row => {
          const parsed = typeof row.data === 'string' ? JSON.parse(row.data || '{}') : (row.data || {});
          if (!variations.some(v => v.id === row.id)) {
            if (!projectId || parsed.project_id === projectId) {
              variations.push({
                id: row.id,
                ...parsed,
                created_at: parsed.created_at || row.created_at
              });
            }
          }
        });
      }
    } catch (_) {}

    return variations;
  },

  async listClaims(companyId, projectId) {
    assertCompany(companyId);
    const claims = [];
    try {
      let query = supabase.from('jcl_progress_claims').select('*').eq('company_id', companyId).order('claim_date', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        claims.push(...data);
      }
    } catch (_) {}

    // Also check industry_records
    try {
      const { data: indData } = await supabase
        .from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('record_type', 'project_claim');
      if (Array.isArray(indData)) {
        indData.forEach(row => {
          const parsed = typeof row.data === 'string' ? JSON.parse(row.data || '{}') : (row.data || {});
          if (!claims.some(c => c.id === row.id)) {
            if (!projectId || parsed.project_id === projectId) {
              claims.push({
                id: row.id,
                ...parsed,
                created_at: parsed.created_at || row.created_at
              });
            }
          }
        });
      }
    } catch (_) {}

    return claims;
  },

  async createBudget({ companyId, projectId, budget, lines }) {
    assertCompany(companyId);
    const validProjectId = await ensureValidProjectId(companyId, projectId);
    if (!validProjectId || !budget?.title) throw new Error('A project and budget title are required.');
    const budgetLines = Array.isArray(lines) && lines.length > 0 ? lines : [
      { cost_code: 'GEN-01', description: 'General Budget Allocation', category: 'General', quantity: 1, unit_rate: monetary(budget.amount || 0) }
    ];

    const budgetId = crypto.randomUUID();
    const budgetRef = budget.budget_reference || `BUD-${Date.now().toString().slice(-6)}`;

    // Try primary table first
    let primarySucceeded = false;
    try {
      const { data: budgetRow, error: budgetError } = await supabase.from('jcl_project_budgets').insert({
        id: budgetId,
        company_id: companyId,
        project_id: validProjectId,
        budget_reference: budgetRef,
        title: budget.title,
        version: Number(budget.version || 1),
        currency: budget.currency || 'GHS',
        notes: budget.notes || null,
        approval_status: 'draft',
        review_status: 'draft'
      }).select('id').single();

      if (!budgetError && budgetRow?.id) {
        primarySucceeded = true;
        try {
          await supabase.from('jcl_project_budget_lines').insert(budgetLines.map(line => ({
            company_id: companyId,
            budget_id: budgetRow.id,
            cost_code: line.cost_code || 'GEN-01',
            description: line.description || 'Line item',
            category: line.category || 'General',
            quantity: monetary(line.quantity || 1),
            unit_of_measure: line.unit_of_measure || null,
            unit_rate: monetary(line.unit_rate || 0)
          })));
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[JCLPhase5FinanceService] primary budget insert failed, falling back to industry_records:', e);
    }

    // Mirror to industry_records so web and mobile sync 100% reliably
    try {
      await supabase.from('industry_records').insert({
        id: budgetId,
        company_id: companyId,
        industry: 'real_estate_finance',
        record_type: 'project_budget',
        search_text: `${budgetRef} ${budget.title}`,
        data: {
          id: budgetId,
          project_id: validProjectId,
          budget_reference: budgetRef,
          title: budget.title,
          version: Number(budget.version || 1),
          currency: budget.currency || 'GHS',
          notes: budget.notes || '',
          approval_status: 'draft',
          review_status: 'draft',
          total_amount: budgetLines.reduce((s, l) => s + (monetary(l.quantity || 1) * monetary(l.unit_rate || 0)), 0),
          lines: budgetLines,
          created_at: new Date().toISOString()
        }
      });
    } catch (indErr) {
      console.warn('[JCLPhase5FinanceService] industry_records budget mirror caught:', indErr);
      if (!primarySucceeded) throw indErr;
    }

    return budgetId;
  },

  async createVariation({ companyId, projectId, variation }) {
    assertCompany(companyId);
    const validProjectId = await ensureValidProjectId(companyId, projectId);
    const varId = crypto.randomUUID();
    const varRef = variation.variation_reference || `VAR-${Date.now().toString().slice(-6)}`;
    const costVal = monetary(variation.cost_impact || variation.proposed_value_adjustment);

    let insertedData = null;
    try {
      const { data, error } = await supabase.from('jcl_project_variations').insert({
        id: varId,
        company_id: companyId,
        project_id: validProjectId,
        variation_reference: varRef,
        title: variation.title,
        description: variation.description || null,
        reason: variation.reason || null,
        variation_type: variation.variation_type || 'other',
        proposed_value_adjustment: costVal,
        cost_impact: costVal,
        schedule_impact_days: Number(variation.schedule_impact_days || 0),
        approval_status: 'draft'
      }).select().single();
      if (!error && data) insertedData = data;
    } catch (err) {
      console.warn('[JCLPhase5FinanceService] primary variation insert caught:', err);
    }

    // Always mirror to industry_records for cross-platform sync
    try {
      const indPayload = {
        id: varId,
        company_id: companyId,
        industry: 'real_estate_finance',
        record_type: 'project_variation',
        search_text: `${varRef} ${variation.title}`,
        data: {
          id: varId,
          company_id: companyId,
          project_id: validProjectId,
          variation_reference: varRef,
          title: variation.title,
          description: variation.description || '',
          reason: variation.reason || '',
          variation_type: variation.variation_type || 'other',
          proposed_value_adjustment: costVal,
          cost_impact: costVal,
          schedule_impact_days: Number(variation.schedule_impact_days || 0),
          approval_status: 'draft',
          created_at: new Date().toISOString()
        }
      };
      await supabase.from('industry_records').insert(indPayload);
      if (!insertedData) insertedData = indPayload.data;
    } catch (indErr) {
      console.warn('[JCLPhase5FinanceService] industry_records variation mirror caught:', indErr);
      if (!insertedData) throw indErr;
    }

    return insertedData;
  },

  async createClaim({ companyId, projectId, claim }) {
    assertCompany(companyId);
    const validProjectId = await ensureValidProjectId(companyId, projectId);
    const claimId = crypto.randomUUID();
    const claimRef = claim.claim_reference || `CLM-${Date.now().toString().slice(-6)}`;
    const claimAmt = monetary(claim.current_claim_amount);

    let insertedData = null;
    try {
      const { data, error } = await supabase.from('jcl_progress_claims').insert({
        id: claimId,
        company_id: companyId,
        project_id: validProjectId,
        client_id: claim.client_id || null,
        claim_reference: claimRef,
        claim_period_start: claim.claim_period_start || null,
        claim_period_end: claim.claim_period_end || null,
        description: claim.description || null,
        current_claim_amount: claimAmt,
        retention_amount: monetary(claim.retention_amount),
        tax_amount: monetary(claim.tax_amount),
        other_deductions: monetary(claim.other_deductions),
        approval_status: 'draft'
      }).select().single();
      if (!error && data) insertedData = data;
    } catch (err) {
      console.warn('[JCLPhase5FinanceService] primary claim insert caught:', err);
    }

    // Mirror to industry_records
    try {
      const indPayload = {
        id: claimId,
        company_id: companyId,
        industry: 'real_estate_finance',
        record_type: 'project_claim',
        search_text: `${claimRef} ${claim.description || ''}`,
        data: {
          id: claimId,
          company_id: companyId,
          project_id: validProjectId,
          claim_reference: claimRef,
          description: claim.description || '',
          current_claim_amount: claimAmt,
          retention_amount: monetary(claim.retention_amount),
          tax_amount: monetary(claim.tax_amount),
          other_deductions: monetary(claim.other_deductions),
          approval_status: 'draft',
          created_at: new Date().toISOString()
        }
      };
      await supabase.from('industry_records').insert(indPayload);
      if (!insertedData) insertedData = indPayload.data;
    } catch (indErr) {
      console.warn('[JCLPhase5FinanceService] industry_records claim mirror caught:', indErr);
      if (!insertedData) throw indErr;
    }

    return insertedData;
  }
};

