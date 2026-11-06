import { supabase } from '@/api/supabaseClient';

const scoped = (table, companyId) => supabase.from(table).select('*').eq('company_id', companyId).order('created_at', { ascending: false });

export const JCLProjectOperationsService = {
  async list(companyId) {
    if (!companyId) return { projects: [], packages: [], tasks: [], diary: [], reports: [], allocations: [], issues: [], inspections: [], activity: [] };
    const tables = ['ops_projects', 'ops_work_packages', 'ops_project_tasks', 'ops_site_diary', 'ops_daily_reports', 'ops_resource_allocations', 'ops_project_issues', 'ops_site_inspections', 'ops_project_activity'];
    const results = await Promise.all(tables.map((table) => scoped(table, companyId)));
    return Object.fromEntries(tables.map((table, index) => [table.replace('ops_', ''), results[index].data || []]));
  },
  async create(table, companyId, payload) {
    const { data, error } = await supabase.from(table).insert({ ...payload, company_id: companyId }).select().single();
    if (error) throw error;
    return data;
  },
  async update(table, id, companyId, payload) {
    const { data, error } = await supabase.from(table).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', companyId).select().single();
    if (error) throw error;
    return data;
  },
};

export const calculateProjectProgress = (projectId, packages, tasks) => {
  const projectPackages = packages.filter((item) => item.project_id === projectId);
  const projectTasks = tasks.filter((item) => item.project_id === projectId);
  if (projectPackages.length) return Math.round(projectPackages.reduce((sum, item) => sum + (item.status === 'completed' ? 100 : item.status === 'in_progress' ? 50 : 0), 0) / projectPackages.length);
  if (projectTasks.length) return Math.round(projectTasks.filter((item) => item.status === 'done').length / projectTasks.length * 100);
  return 0;
};
