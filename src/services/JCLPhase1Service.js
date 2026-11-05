import { supabase } from '@/api/supabaseClient';

const makeNumber = (prefix) => `${prefix}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

export const JCLPhase1Service = {
  async listEngagements(companyId) {
    if (!companyId) return [];
    const { data, error } = await supabase
      .from('jcl_engagements')
      .select('*, client:core_parties!client_party_id(id, primary_name), responsible:core_parties!responsible_party_id(id, primary_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async listClients(companyId) {
    if (!companyId) return [];
    const { data, error } = await supabase
      .from('core_parties')
      .select('id, primary_name, email, phone')
      .eq('company_id', companyId)
      .order('primary_name');
    if (error) throw error;
    return data || [];
  },

  async createEngagement(companyId, actorId, payload) {
    const { data, error } = await supabase.from('jcl_engagements').insert({
      company_id: companyId,
      created_by: actorId || null,
      engagement_number: payload.engagement_number || makeNumber('ENG'),
      client_party_id: payload.client_party_id,
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
      client_party_id: engagement.client_party_id,
      lead_party_id: engagement.lead_party_id,
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
    const { data, error } = await supabase.from('ops_projects')
      .select('id, project_code, name, status, priority, project_type, site_address, budget_amount, progress_percentage, start_date, target_end_date, engagement_id, client:core_parties!client_party_id(primary_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
