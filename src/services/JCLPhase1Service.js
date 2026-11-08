import { supabase } from '@/api/supabaseClient';
import { powerSync } from '@/api/PowerSyncConnector';

const makeNumber = (prefix) => `${prefix}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

const attachClients = (rows, clients) => rows.map((row) => {
  const client = clients.find((item) => item.id === row.client_id);
  return { ...row, client: client ? { id: client.id, primary_name: client.name, ...client } : null };
});

export const JCLPhase1Service = {
  async listClients(companyId) {
    if (!companyId) return [];

    try {
      const result = await powerSync.execute(
        'SELECT id, name, email, phone, type, city FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC',
        [String(companyId)]
      );
      const clients = result?.rows?._array || Array.from(result?.rows || []);
      if (clients.length > 0) return clients;
    } catch (_error) {
      // Fall back to Supabase when the local replica is not ready yet.
    }

    const { data, error } = await supabase
      .from('univ_re_clients')
      .select('id, name, email, phone, type, city')
      .eq('company_id', String(companyId))
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async listEngagements(companyId) {
    if (!companyId) return [];
    const [engagementResponse, clients] = await Promise.all([
      supabase.from('jcl_engagements').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      this.listClients(companyId),
    ]);
    if (engagementResponse.error) throw engagementResponse.error;
    return attachClients(engagementResponse.data || [], clients);
  },

  async createEngagement(companyId, actorId, payload) {
    const { data, error } = await supabase.from('jcl_engagements').insert({
      company_id: companyId,
      created_by: actorId || null,
      engagement_number: payload.engagement_number || makeNumber('ENG'),
      client_id: payload.client_party_id,
      title: payload.title.trim(),
      description: payload.description || null,
      engagement_type: payload.engagement_type,
      status: payload.status || 'draft',
      priority: payload.priority || 'medium',
      site_address: payload.site_address || null,
      date_received: payload.date_received || new Date().toISOString().slice(0, 10),
      budget_min: payload.budget_min ? Number(payload.budget_min) : null,
      budget_max: payload.budget_max ? Number(payload.budget_max) : null,
      expected_start_date: payload.expected_start_date || null,
      expected_completion_date: payload.expected_completion_date || null,
      internal_notes: payload.internal_notes || null,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async saveRequirements(companyId, actorId, engagementId, payload) {
    const { data, error } = await supabase.from('jcl_engagement_requirements').upsert({
      company_id: companyId,
      engagement_id: engagementId,
      created_by: actorId || null,
      objectives: payload.objectives || null,
      requested_scope: payload.requested_scope || null,
      constraints: payload.constraints || null,
      budget_expectations: payload.budget_expectations || null,
      desired_timeline: payload.desired_timeline || null,
      technical_requirements: payload.technical_requirements || null,
      site_details: { address: payload.site_address || '' },
      expected_deliverables: payload.expected_deliverables || [],
      outstanding_questions: payload.outstanding_questions || [],
    }, { onConflict: 'company_id,engagement_id' }).select().single();
    if (error) throw error;
    return data;
  },

  async convertToProject(companyId, actorId, engagement) {
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
              project_code: ce.engagement_number?.replace('ENG', 'PRJ') || `PRJ-${ce.id.slice(-4)}`,
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
