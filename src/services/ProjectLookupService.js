import { supabase } from '@/api/supabaseClient';
import { powerSync } from '@/api/PowerSyncConnector';

/**
 * Universal Project fetcher that merges both `ops_projects` and `univ_projects`
 * so any project created anywhere on the platform immediately appears in all dropdowns
 * (Engineering, BOQ, Procurement, Drawings, Budgets, etc.)
 */
export async function getCompanyProjects(companyId) {
  if (!companyId) return [];

  const [opsRes, univRes] = await Promise.all([
    supabase
      .from('ops_projects')
      .select('id, name, project_code, status, budget_amount, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true })
      .catch(() => ({ data: [] })),
    supabase
      .from('univ_projects')
      .select('id, name, project_code, status, budget, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true })
      .catch(() => ({ data: [] }))
  ]);

  const opsList = (opsRes.data || []).map(p => ({
    id: p.id,
    name: p.name,
    project_code: p.project_code || `PRJ-${p.id.slice(-4)}`,
    status: p.status || 'active',
    source: 'ops'
  }));

  const univList = (univRes.data || []).map(p => ({
    id: p.id,
    name: p.name,
    project_code: p.project_code || `PRJ-${p.id.slice(-4)}`,
    status: p.status || 'active',
    source: 'univ'
  }));

  // Deduplicate by id or project_code
  const map = new Map();
  opsList.forEach(p => map.set(p.id, p));
  univList.forEach(p => {
    if (!map.has(p.id)) map.set(p.id, p);
  });

  return Array.from(map.values());
}
