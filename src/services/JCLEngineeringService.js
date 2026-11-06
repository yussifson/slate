import { supabase } from '@/api/supabaseClient';

const ensure = (error, context) => {
  if (error) throw new Error(`${context}: ${error.message}`);
};

const scoped = (table, companyId) => supabase.from(table).select('*').eq('company_id', companyId).order('created_at', { ascending: false });

export const JCLEngineeringService = {
  async dashboard(companyId, filters = {}) {
    if (!companyId) return { assignments: [], requirements: [], drawings: [], submissions: [], reports: [], issues: [], changes: [], stats: {} };
    const [assignments, requirements, drawings, submissions, reports, issues, changes] = await Promise.all([
      scoped('jcl_engineering_assignments', companyId),
      scoped('jcl_technical_requirements', companyId),
      scoped('jcl_drawings', companyId),
      scoped('jcl_technical_submissions', companyId),
      scoped('jcl_technical_reports', companyId),
      scoped('jcl_technical_issues', companyId),
      scoped('jcl_design_changes', companyId)
    ]);
    [assignments, requirements, drawings, submissions, reports, issues, changes].forEach((result, index) => ensure(result.error, `Unable to load engineering register ${index + 1}`));
    const projectId = filters.projectId && filters.projectId !== 'all' ? filters.projectId : null;
    const filterRows = (rows) => projectId ? rows.data.filter((row) => row.project_id === projectId) : (rows.data || []);
    const data = {
      assignments: filterRows(assignments), requirements: filterRows(requirements), drawings: filterRows(drawings),
      submissions: filterRows(submissions), reports: filterRows(reports), issues: filterRows(issues), changes: filterRows(changes)
    };
    const active = data.assignments.filter((row) => ['assigned', 'in_progress', 'submitted', 'under_review'].includes(row.status));
    const openIssues = data.issues.filter((row) => !['resolved', 'verified', 'closed'].includes(row.status));
    return { ...data, stats: {
      assignments: data.assignments.length,
      activeProjects: new Set(active.map((row) => row.project_id).filter(Boolean)).size,
      pendingSubmissions: data.submissions.filter((row) => ['submitted', 'under_review'].includes(row.status)).length,
      drawingsAwaitingReview: data.drawings.filter((row) => ['submitted_for_review', 'under_review'].includes(row.review_status)).length,
      drawingsAwaitingApproval: data.drawings.filter((row) => data.drawings && ['pending_approval'].includes(row.approval_status)).length,
      approvedRevisions: data.drawings.filter((row) => row.approval_status === 'approved').length,
      rejectedSubmissions: data.submissions.filter((row) => row.status === 'rejected').length,
      openIssues: openIssues.length,
      overdueReviews: data.submissions.filter((row) => row.required_response_date && new Date(row.required_response_date) < new Date() && !['approved', 'closed'].includes(row.status)).length
    }};
  },

  async createAssignment(companyId, actorId, payload) {
    const { data, error } = await supabase.from('jcl_engineering_assignments').insert({
      company_id: companyId, created_by: actorId, assignment_reference: payload.assignment_reference || `ENG-${Date.now().toString().slice(-8)}`,
      project_id: payload.project_id || null, discipline: payload.discipline, title: payload.title.trim(), description: payload.description || null,
      scope_of_responsibility: payload.scope_of_responsibility || null, assigned_engineer_id: payload.assigned_engineer_id || null,
      assigned_team_id: payload.assigned_team_id || null, start_date: payload.start_date || null, target_completion_date: payload.target_completion_date || null,
      priority: payload.priority || 'medium', status: payload.status || 'draft', expected_deliverables: payload.expected_deliverables || null,
      notes: payload.notes || null
    }).select().single();
    ensure(error, 'Unable to create engineering assignment');
    return data;
  },

  async createRequirement(companyId, actorId, payload) {
    const { data, error } = await supabase.from('jcl_technical_requirements').insert({
      company_id: companyId, created_by: actorId, requirement_reference: payload.requirement_reference || `TR-${Date.now().toString().slice(-8)}`,
      project_id: payload.project_id || null, assignment_id: payload.assignment_id || null, discipline: payload.discipline,
      title: payload.title.trim(), description: payload.description || null, specification: payload.specification || null,
      source_reference: payload.source_reference || null, responsible_person_id: payload.responsible_person_id || null,
      priority: payload.priority || 'medium', verification_criteria: payload.verification_criteria || null,
      status: payload.status || 'open', required_date: payload.required_date || null
    }).select().single();
    ensure(error, 'Unable to create technical requirement');
    return data;
  },

  async updateStatus(table, id, companyId, status) {
    const { data, error } = await supabase.from(table).update({ status, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', companyId).select().single();
    ensure(error, 'Unable to update engineering record');
    return data;
  }
};
