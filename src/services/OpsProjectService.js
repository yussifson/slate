/**
 * Slate V2: Projects, Operations & Team Management Service (Phase 5)
 * 
 * Manages:
 * 1. Projects & Milestone tracking (Kanban, List, Progress calculations)
 * 2. Team and People Management (Core Party identity, role in team, department)
 * 3. Operational Work Orders (service requests, execution checklists)
 * 4. Issue and Incident Escalations
 * 5. Business Command Center KPI aggregation (Role-adaptive workloads, deadlines)
 */
import { supabase } from '../api/supabaseClient';
import { EventService } from './EventService';

export const OpsProjectService = {
  // ==========================================================================
  // 1. PROJECTS & MILESTONES
  // ==========================================================================

  /**
   * List projects with team, lead party, and client party details
   */
  async listProjects(companyId, filters = {}) {
    if (!companyId) return [];

    let query = supabase
      .from('ops_projects')
      .select(`
        *,
        client_party:core_parties!client_party_id (id, primary_name),
        lead_party:core_parties!lead_party_id (id, primary_name),
        ops_teams (id, name, department),
        ops_project_milestones (*)
      `)
      .eq('company_id', companyId);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    if (filters.teamId) {
      query = query.eq('team_id', filters.teamId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('[OpsProjectService] Error listing projects:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Create a project
   */
  async createProject(companyId, projectData, actorId = null) {
    if (!companyId || !projectData.name) {
      throw new Error('company_id and project name are required.');
    }

    const projectCode = projectData.project_code || `PRJ-${Date.now().toString().slice(-6)}`;
    const payload = {
      company_id: companyId,
      project_code: projectCode,
      name: projectData.name.trim(),
      description: projectData.description || null,
      status: projectData.status || 'planned',
      priority: projectData.priority || 'medium',
      client_party_id: projectData.client_party_id || null,
      opportunity_id: projectData.opportunity_id || null,
      lead_party_id: projectData.lead_party_id || null,
      team_id: projectData.team_id || null,
      start_date: projectData.start_date || null,
      target_end_date: projectData.target_end_date || null,
      budget_amount: Number(projectData.budget_amount) || 0,
      currency: projectData.currency || 'USD',
      progress_percentage: 0,
      created_by: actorId
    };

    const { data, error } = await supabase
      .from('ops_projects')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await EventService.publishEvent(
      companyId,
      'OPS_PROJECT_CREATED',
      'ops_project',
      data.id,
      { project_code: data.project_code, name: data.name, client_party_id: data.client_party_id }
    );

    return data;
  },

  /**
   * Update project status & re-calculate progress
   */
  async updateProjectStatus(companyId, projectId, status, actorId = null) {
    const updatePayload = {
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'completed') {
      updatePayload.actual_end_date = new Date().toISOString().split('T')[0];
      updatePayload.progress_percentage = 100;
    }

    const { data, error } = await supabase
      .from('ops_projects')
      .update(updatePayload)
      .eq('id', projectId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;

    await EventService.publishEvent(
      companyId,
      'OPS_PROJECT_STATUS_CHANGED',
      'ops_project',
      projectId,
      { status }
    );

    return data;
  },

  // ==========================================================================
  // 2. PROJECT TASKS
  // ==========================================================================

  /**
   * List tasks for a project or tenant
   */
  async listTasks(companyId, filters = {}) {
    if (!companyId) return [];

    let query = supabase
      .from('ops_project_tasks')
      .select(`
        *,
        ops_projects (id, name, project_code),
        assigned_party:core_parties!assigned_to_party_id (id, primary_name)
      `)
      .eq('company_id', companyId);

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters.assignedPartyId) {
      query = query.eq('assigned_to_party_id', filters.assignedPartyId);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('[OpsProjectService] Error listing tasks:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Create a project task
   */
  async createTask(companyId, taskData, actorId = null) {
    if (!companyId || !taskData.title) {
      throw new Error('company_id and title are required for a task.');
    }

    const payload = {
      company_id: companyId,
      project_id: taskData.project_id || null,
      milestone_id: taskData.milestone_id || null,
      title: taskData.title.trim(),
      description: taskData.description || null,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      assigned_to_party_id: taskData.assigned_to_party_id || null,
      estimated_hours: Number(taskData.estimated_hours) || 0,
      start_date: taskData.start_date || null,
      due_date: taskData.due_date || null,
      created_by: actorId
    };

    const { data, error } = await supabase
      .from('ops_project_tasks')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await EventService.publishEvent(
      companyId,
      'OPS_TASK_CREATED',
      'ops_task',
      data.id,
      { title: data.title, project_id: data.project_id, assigned_to: data.assigned_to_party_id }
    );

    return data;
  },

  /**
   * Complete a task
   */
  async completeTask(companyId, taskId, actorId = null) {
    const { data, error } = await supabase
      .from('ops_project_tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;

    await EventService.publishEvent(
      companyId,
      'OPS_TASK_COMPLETED',
      'ops_task',
      taskId,
      { completed_by: actorId }
    );

    return data;
  },

  // ==========================================================================
  // 3. TEAMS & PEOPLE
  // ==========================================================================

  /**
   * List organizational teams with their members
   */
  async listTeams(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
      .from('ops_teams')
      .select(`
        *,
        lead_party:core_parties!lead_party_id (id, primary_name, email),
        ops_team_members (
          id, role_in_team,
          member_party:core_parties!party_id (id, primary_name, email, phone)
        )
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.warn('[OpsProjectService] Error listing teams:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Create a team
   */
  async createTeam(companyId, teamData) {
    if (!companyId || !teamData.name) {
      throw new Error('company_id and team name are required.');
    }

    const { data, error } = await supabase
      .from('ops_teams')
      .insert({
        company_id: companyId,
        name: teamData.name.trim(),
        department: teamData.department || 'Operations',
        lead_party_id: teamData.lead_party_id || null,
        description: teamData.description || null,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================================================
  // 4. OPERATIONAL WORK ORDERS & ISSUES
  // ==========================================================================

  /**
   * List work orders
   */
  async listWorkOrders(companyId, filters = {}) {
    if (!companyId) return [];

    let query = supabase
      .from('ops_work_orders')
      .select(`
        *,
        client_party:core_parties!client_party_id (id, primary_name),
        assigned_party:core_parties!assigned_party_id (id, primary_name),
        ops_teams (id, name)
      `)
      .eq('company_id', companyId);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('[OpsProjectService] Error listing work orders:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Create a work order
   */
  async createWorkOrder(companyId, orderData, actorId = null) {
    if (!companyId || !orderData.title) {
      throw new Error('company_id and title are required for a work order.');
    }

    const orderNumber = orderData.order_number || `WO-${Date.now().toString().slice(-6)}`;
    const payload = {
      company_id: companyId,
      order_number: orderNumber,
      title: orderData.title.trim(),
      description: orderData.description || null,
      work_order_type: orderData.work_order_type || 'service',
      status: 'submitted',
      priority: orderData.priority || 'medium',
      client_party_id: orderData.client_party_id || null,
      assigned_team_id: orderData.assigned_team_id || null,
      assigned_party_id: orderData.assigned_party_id || null,
      checklist: orderData.checklist || [],
      created_by: actorId
    };

    const { data, error } = await supabase
      .from('ops_work_orders')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await EventService.publishEvent(
      companyId,
      'OPS_WORK_ORDER_CREATED',
      'ops_work_order',
      data.id,
      { order_number: data.order_number, title: data.title }
    );

    return data;
  },

  // ==========================================================================
  // 5. BUSINESS COMMAND CENTER AGGREGATIONS
  // ==========================================================================

  /**
   * Aggregate high-level operational intelligence for Command Center
   */
  async getCommandCenterMetrics(companyId, userPartyId = null) {
    if (!companyId) return null;

    const [projects, tasks, workOrders, issues] = await Promise.all([
      this.listProjects(companyId),
      this.listTasks(companyId),
      this.listWorkOrders(companyId),
      supabase.from('ops_issues').select('*').eq('company_id', companyId)
    ]);

    const issuesData = issues.data || [];

    // Calculations
    const activeProjects = projects.filter(p => p.status === 'in_progress');
    const totalProjects = projects.length;
    const completedTasks = tasks.filter(t => t.status === 'done');
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
    const criticalIssues = issuesData.filter(i => i.status !== 'closed' && (i.severity === 'high' || i.severity === 'critical'));

    // My Work Filtering
    const myTasks = userPartyId ? tasks.filter(t => t.assigned_to_party_id === userPartyId && t.status !== 'done') : [];

    return {
      activeProjectsCount: activeProjects.length,
      totalProjectsCount: totalProjects,
      pendingTasksCount: pendingTasks.length,
      completedTasksCount: completedTasks.length,
      taskCompletionRate: totalProjects > 0 && tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 100,
      overdueTasksCount: overdueTasks.length,
      activeWorkOrdersCount: workOrders.filter(w => w.status !== 'completed' && w.status !== 'cancelled').length,
      criticalIssuesCount: criticalIssues.length,
      myWork: myTasks,
      attentionRequired: [
        ...overdueTasks.map(t => ({ type: 'overdue_task', label: `Overdue Task: ${t.title}`, id: t.id, severity: 'warning' })),
        ...criticalIssues.map(i => ({ type: 'critical_issue', label: `Incident: ${i.title}`, id: i.id, severity: 'critical' }))
      ]
    };
  }
};
