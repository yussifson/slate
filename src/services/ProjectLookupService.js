import { supabase } from '@/api/supabaseClient';

/**
 * Universal Project fetcher that safely looks up projects across tables
 * (ops_projects, univ_projects, and jcl_engagements)
 * so any project or converted engagement appears in all dropdowns
 * (Engineering, BOQ, Procurement, Drawings, Budgets, etc.)
 */
export async function getCompanyProjects(companyId) {
  if (!companyId) return [];

  const projects = [];

  // 1. Try ops_projects
  try {
    const { data, error } = await supabase
      .from('ops_projects')
      .select('id, name, project_code, status, budget_amount, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(p => {
        projects.push({
          id: p.id,
          name: p.name,
          project_code: p.project_code || `PRJ-${p.id.slice(-4)}`,
          status: p.status || 'active',
          source: 'ops'
        });
      });
    }
  } catch (err) {
    console.warn('[ProjectLookupService] ops_projects lookup caught:', err);
  }

  // 2. Try jcl_engagements (converted or active delivery projects)
  try {
    const { data, error } = await supabase
      .from('jcl_engagements')
      .select('id, title, engagement_number, status, budget_max, created_at')
      .eq('company_id', companyId)
      .order('title', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(e => {
        if (!projects.some(p => p.id === e.id || p.name === e.title)) {
          projects.push({
            id: e.id,
            name: e.title,
            project_code: e.engagement_number || `ENG-${e.id.slice(-4)}`,
            status: e.status || 'active',
            source: 'engagement'
          });
        }
      });
    }
  } catch (err) {
    console.warn('[ProjectLookupService] jcl_engagements lookup caught:', err);
  }

  // 3. Try univ_projects
  try {
    const { data, error } = await supabase
      .from('univ_projects')
      .select('id, name, project_code, status, budget, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(p => {
        if (!projects.some(existing => existing.id === p.id || existing.name === p.name)) {
          projects.push({
            id: p.id,
            name: p.name,
            project_code: p.project_code || `PRJ-${p.id.slice(-4)}`,
            status: p.status || 'active',
            source: 'univ'
          });
        }
      });
    }
  } catch (err) {
    console.warn('[ProjectLookupService] univ_projects lookup caught:', err);
  }

  return projects;
}
