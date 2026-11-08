import { supabase } from '@/api/supabaseClient';
import { powerSync } from '@/api/PowerSyncConnector';

/**
 * Universal Project fetcher that safely looks up projects across tables
 * (local PowerSync ops_projects, supabase ops_projects, univ_projects, jcl_engagements, and univ_re_properties)
 * so any project or converted engagement appears in all dropdowns
 * (Engineering, BOQ, Procurement, Drawings, Budgets, etc.)
 */
export async function getCompanyProjects(companyId) {
  if (!companyId) return [];

  const projects = [];

  // Helper to safely append deduplicated project
  const addProject = (p) => {
    if (!p || !p.id) return;
    if (!projects.some(existing => existing.id === p.id || existing.name === p.name)) {
      projects.push(p);
    }
  };

  // 1. Try local PowerSync replica first for ops_projects
  try {
    const res = await powerSync.execute(
      'SELECT id, name, project_code, status, budget_amount, created_at FROM ops_projects WHERE company_id = ? ORDER BY name ASC',
      [String(companyId)]
    );
    const rows = res?.rows?._array || Array.from(res?.rows || []);
    rows.forEach(p => {
      addProject({
        id: p.id,
        name: p.name,
        project_code: p.project_code || `PRJ-${p.id.slice(-4)}`,
        status: p.status || 'active',
        source: 'local_ops'
      });
    });
  } catch (err) {
    // Fall back to Supabase
  }

  // 2. Try Supabase ops_projects (if online / not yet synced locally)
  try {
    const { data, error } = await supabase
      .from('ops_projects')
      .select('id, name, project_code, status, budget_amount, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(p => {
        addProject({
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

  // 3. Try jcl_engagements (converted or active delivery projects)
  try {
    const { data, error } = await supabase
      .from('jcl_engagements')
      .select('id, title, engagement_number, status, budget_max, created_at')
      .eq('company_id', companyId)
      .order('title', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(e => {
        addProject({
          id: e.id,
          name: e.title,
          project_code: e.engagement_number || `ENG-${e.id.slice(-4)}`,
          status: e.status || 'active',
          source: 'engagement'
        });
      });
    }
  } catch (err) {
    console.warn('[ProjectLookupService] jcl_engagements lookup caught:', err);
  }

  // 4. Try univ_projects
  try {
    const { data, error } = await supabase
      .from('univ_projects')
      .select('id, name, project_code, status, budget, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(p => {
        addProject({
          id: p.id,
          name: p.name,
          project_code: p.project_code || `PRJ-${p.id.slice(-4)}`,
          status: p.status || 'active',
          source: 'univ'
        });
      });
    }
  } catch (err) {
    console.warn('[ProjectLookupService] univ_projects lookup caught:', err);
  }

  // 5. Try univ_re_properties (Properties as project contexts in Real Estate)
  try {
    const { data, error } = await supabase
      .from('univ_re_properties')
      .select('id, address, property_type, status, price, created_at')
      .eq('company_id', companyId)
      .order('address', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(prop => {
        const title = prop.address || prop.property_type || `Property ${prop.id.slice(-4)}`;
        addProject({
          id: prop.id,
          name: title,
          project_code: `PROP-${prop.id.slice(-4)}`,
          status: prop.status || 'active',
          source: 'property'
        });
      });
    }
  } catch (err) {
    console.warn('[ProjectLookupService] univ_re_properties lookup caught:', err);
  }

  return projects;
}

/**
 * Ensures a valid project ID exists for tables requiring non-null project_id.
 * If provided projectId is valid, verifies it exists in ops_projects; if not in ops_projects,
 * mirrors/provisions it into ops_projects so foreign key constraints (e.g. jcl_purchase_requisitions_project_id_fkey) are satisfied.
 * Otherwise returns the first active project or automatically provisions a General Operations project.
 */
export async function ensureValidProjectId(companyId, providedId) {
  if (providedId && String(providedId).trim() !== '' && providedId !== 'unassigned') {
    // Check if it already exists in ops_projects to satisfy the foreign key
    try {
      const { data: existingOps } = await supabase
        .from('ops_projects')
        .select('id')
        .eq('id', providedId)
        .maybeSingle();

      if (existingOps?.id) return existingOps.id;

      // If not in ops_projects, find its details from projects lookup and mirror it to ops_projects
      const allProjects = await getCompanyProjects(companyId);
      const match = allProjects.find(p => p.id === providedId);

      const mirrorPayload = {
        id: providedId,
        company_id: companyId,
        name: match?.name || `Project ${String(providedId).slice(-6)}`,
        project_code: match?.project_code || `PRJ-${String(providedId).slice(-4)}`,
        status: match?.status || 'active',
        description: 'Auto-synchronized project mirror for operations and procurement.'
      };

      await supabase.from('ops_projects').upsert(mirrorPayload);
      return providedId;
    } catch (e) {
      console.warn('[ProjectLookupService] ops_projects mirroring caught:', e);
      return providedId;
    }
  }

  const existing = await getCompanyProjects(companyId);
  if (existing.length > 0 && existing[0]?.id) {
    const firstId = existing[0].id;
    try {
      const { data: checkFirst } = await supabase
        .from('ops_projects')
        .select('id')
        .eq('id', firstId)
        .maybeSingle();

      if (!checkFirst?.id) {
        await supabase.from('ops_projects').upsert({
          id: firstId,
          company_id: companyId,
          name: existing[0].name || 'Project',
          project_code: existing[0].project_code || 'PRJ-01',
          status: 'active'
        });
      }
    } catch (_) {}
    return firstId;
  }

  // Provision a default ops_project
  try {
    const defId = crypto.randomUUID();
    const { data, error } = await supabase.from('ops_projects').insert({
      id: defId,
      company_id: companyId,
      name: 'General Company Operations',
      project_code: 'GEN-OPS-01',
      status: 'active',
      description: 'Default project container for general procurement and site operations.'
    }).select().single();
    if (!error && data?.id) return data.id;
  } catch (e) {
    console.warn('[ProjectLookupService] Default project provisioning caught:', e);
  }
  return providedId || null;
}
