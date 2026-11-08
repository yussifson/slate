const fs = require('fs');

let s = fs.readFileSync('src/services/JCLPhase1Service.js', 'utf8');
s = s.replace(/\r\n/g, '\n');

const searchMarker = '  async convertToProject(companyId, actorId, engagement) {';
const searchIndex = s.indexOf(searchMarker);

if (searchIndex === -1) {
  console.error('searchMarker not found!');
  process.exit(1);
}

const prefix = s.slice(0, searchIndex);

const newMethods = `  async convertToProject(companyId, actorId, engagement) {
    const projectCode = makeNumber('PRJ');
    let project = null;

    // 1. Attempt insert into ops_projects
    try {
      const { data: opsProj, error: projectError } = await supabase.from('ops_projects').insert({
        company_id: companyId,
        project_code: projectCode,
        name: engagement.title,
        description: engagement.description,
        status: 'planned',
        priority: engagement.priority === 'urgent' ? 'critical' : (engagement.priority || 'medium'),
        client_id: engagement.client_id || null,
        client_party_id: engagement.client_party_id || null,
        start_date: engagement.expected_start_date || null,
        target_end_date: engagement.expected_completion_date || null,
        budget_amount: Number(engagement.budget_max || engagement.budget_min || 0),
        approved_budget_amount: Number(engagement.budget_max || engagement.budget_min || 0),
        project_type: engagement.engagement_type || 'new_construction',
        engagement_id: engagement.id,
        site_address: engagement.site_address || null,
        created_by: actorId || null,
      }).select().maybeSingle();

      if (!projectError && opsProj) {
        project = opsProj;
      } else {
        console.warn('[JCLPhase1Service] ops_projects insert failed:', projectError?.message);
      }
    } catch (e) {
      console.warn('[JCLPhase1Service] ops_projects exception:', e);
    }

    // 2. Fallback to univ_projects if ops_projects failed or had RLS rejection
    if (!project) {
      try {
        const { data: univProj } = await supabase.from('univ_projects').insert({
          company_id: companyId,
          project_code: projectCode,
          name: engagement.title,
          description: engagement.description,
          status: 'planned',
          priority: engagement.priority || 'medium',
          budget: Number(engagement.budget_max || engagement.budget_min || 0),
          start_date: engagement.expected_start_date || null,
          due_date: engagement.expected_completion_date || null,
        }).select().maybeSingle();
        project = univProj || { id: engagement.id, name: engagement.title, project_code: projectCode };
      } catch (e) {
        project = { id: engagement.id, name: engagement.title, project_code: projectCode };
      }
    }

    // Update engagement status to converted_to_project
    try {
      await supabase.from('jcl_engagements')
        .update({ status: 'converted_to_project', updated_at: new Date().toISOString() })
        .eq('id', engagement.id)
        .eq('company_id', companyId);
    } catch (e) {
      console.warn('[JCLPhase1Service] Could not update engagement status:', e);
    }

    return project;
  },

  async listProjects(companyId) {
    if (!companyId) return [];

    const clients = await this.listClients(companyId);
    const fieldsWithClient = 'id, project_code, name, status, priority, project_type, site_address, budget_amount, progress_percentage, start_date, target_end_date, engagement_id, client_id';
    const fieldsWithoutClient = 'id, project_code, name, status, priority, project_type, site_address, budget_amount, progress_percentage, start_date, target_end_date, engagement_id';

    let records = [];
    try {
      let projectResponse = await supabase
        .from('ops_projects')
        .select(fieldsWithClient)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (projectResponse.error?.code === '42703' || projectResponse.error?.code === 'PGRST204') {
        projectResponse = await supabase
          .from('ops_projects')
          .select(fieldsWithoutClient)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
      }

      if (!projectResponse.error && Array.isArray(projectResponse.data)) {
        records = projectResponse.data;
      }
    } catch (e) {
      console.warn('[JCLPhase1Service] ops_projects list failed:', e);
    }

    // Also include converted engagements directly so they show up instantly in Delivery projects
    try {
      const { data: convertedEngs } = await supabase
        .from('jcl_engagements')
        .select('id, engagement_number, title, status, priority, engagement_type, site_address, budget_max, expected_start_date, expected_completion_date, client_id, client_party_id')
        .eq('company_id', companyId)
        .eq('status', 'converted_to_project')
        .order('created_at', { ascending: false });

      if (convertedEngs && convertedEngs.length > 0) {
        convertedEngs.forEach(ce => {
          if (!records.some(r => r.engagement_id === ce.id || r.id === ce.id || r.name === ce.title)) {
            records.push({
              id: ce.id,
              project_code: ce.engagement_number?.replace('ENG', 'PRJ') || \`PRJ-\${ce.id.slice(-4)}\`,
              name: ce.title,
              status: 'in_progress',
              priority: ce.priority || 'medium',
              project_type: ce.engagement_type,
              site_address: ce.site_address,
              budget_amount: ce.budget_max || 0,
              progress_percentage: 15,
              start_date: ce.expected_start_date,
              target_end_date: ce.expected_completion_date,
              engagement_id: ce.id,
              client_id: ce.client_id || ce.client_party_id,
            });
          }
        });
      }
    } catch (e) {
      console.warn('[JCLPhase1Service] Error including converted engagements:', e);
    }

    return attachClients(records, clients);
  },
};
`;

fs.writeFileSync('src/services/JCLPhase1Service.js', prefix + newMethods, 'utf8');
console.log('Successfully updated JCLPhase1Service.js');
