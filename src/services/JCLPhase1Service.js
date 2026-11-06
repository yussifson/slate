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
    const { data: project, error: projectError } = await supabase.from('ops_projects').insert({
      company_id: companyId,
      project_code: projectCode,
      name: engagement.title,
      description: engagement.description,
      status: 'planned',
      priority: engagement.priority === 'urgent' ? 'critical' : engagement.priority,
      client_id: engagement.client_id,
      start_date: engagement.expected_start_date,
      target_end_date: engagement.expected_completion_date,
      budget_amount: Number(engagement.budget_max || engagement.budget_min || 0),
      approved_budget_amount: Number(engagement.budget_max || engagement.budget_min || 0),
      project_type: engagement.engagement_type,
      engagement_id: engagement.id,
      site_address: engagement.site_address,
      created_by: actorId || null,
    }).select().single();
    if (projectError) throw projectError;

    const { error: engagementError } = await supabase.from('jcl_engagements')
      .update({ status: 'converted_to_project', updated_at: new Date().toISOString() })
      .eq('id', engagement.id).eq('company_id', companyId);
    if (engagementError) throw engagementError;
    return project;
  },

  async listProjects(companyId) {
    if (!companyId) return [];
    const [projectResponse, clients] = await Promise.all([
      supabase.from('ops_projects').select('id, project_code, name, status, priority, project_type, site_address, budget_amount, progress_percentage, start_date, target_end_date, engagement_id, client_id').eq('company_id', companyId).order('created_at', { ascending: false }),
      this.listClients(companyId),
    ]);
    if (projectResponse.error) throw projectResponse.error;
    return attachClients(projectResponse.data || [], clients);
  },
};
