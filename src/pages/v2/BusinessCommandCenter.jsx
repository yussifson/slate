import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { OpsProjectService } from '@/services/OpsProjectService';
import { CorePartyService } from '@/services/CorePartyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Compass,
  CheckSquare,
  Users,
  Briefcase,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  FolderPlus,
  Calendar,
  Layers,
  Wrench,
  CheckCircle2
} from 'lucide-react';

export default function BusinessCommandCenter() {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);

  // Form States
  const [newProject, setNewProject] = useState({ name: '', description: '', priority: 'medium', budget_amount: '' });
  const [newTask, setNewTask] = useState({ title: '', project_id: '', priority: 'medium', due_date: '' });
  const [newWorkOrder, setNewWorkOrder] = useState({ title: '', work_order_type: 'service', priority: 'medium' });

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, prj, tsk, tm, wo, pty] = await Promise.all([
        OpsProjectService.getCommandCenterMetrics(companyId, user?.party_id),
        OpsProjectService.listProjects(companyId),
        OpsProjectService.listTasks(companyId),
        OpsProjectService.listTeams(companyId),
        OpsProjectService.listWorkOrders(companyId),
        CorePartyService.listParties(companyId)
      ]);

      setMetrics(m);
      setProjects(prj || []);
      setTasks(tsk || []);
      setTeams(tm || []);
      setWorkOrders(wo || []);
      setParties(pty || []);
    } catch (err) {
      console.warn('[BusinessCommandCenter] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name) return;
    try {
      await OpsProjectService.createProject(companyId, newProject, user?.id);
      toast({ title: 'Project Created', description: `Project ${newProject.name} is now live.` });
      setIsProjectModalOpen(false);
      setNewProject({ name: '', description: '', priority: 'medium', budget_amount: '' });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    try {
      await OpsProjectService.createTask(companyId, newTask, user?.id);
      toast({ title: 'Task Assigned', description: `Task created successfully.` });
      setIsTaskModalOpen(false);
      setNewTask({ title: '', project_id: '', priority: 'medium', due_date: '' });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await OpsProjectService.completeTask(companyId, taskId, user?.id);
      toast({ title: 'Task Completed', description: 'Updated progress and activity log.' });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--slate-v2-border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span>Business Command Center</span>
            </h1>
            <Badge variant="outline" className="text-xs bg-indigo-950/40 text-indigo-300 border-indigo-700/50">
              V2 Operations
            </Badge>
          </div>
          <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
            Real-time cross-functional coordination: projects, team capacity, work orders, and attention items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsWorkOrderModalOpen(true)}
            className="text-xs border-[var(--slate-v2-border-subtle)] bg-[var(--slate-v2-surface-1)] hover:bg-[var(--slate-v2-surface-2)] text-white"
          >
            <Wrench className="w-3.5 h-3.5 mr-1 text-amber-400" />
            New Work Order
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTaskModalOpen(true)}
            className="text-xs border-[var(--slate-v2-border-subtle)] bg-[var(--slate-v2-surface-1)] hover:bg-[var(--slate-v2-surface-2)] text-white"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1 text-sky-400" />
            New Task
          </Button>

          <Button
            size="sm"
            onClick={() => setIsProjectModalOpen(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Project
          </Button>
        </div>
      </div>

      {/* 2. Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Active Projects</span>
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-white">
              {metrics?.activeProjectsCount || 0}
            </div>
            <p className="text-[11px] text-[var(--slate-v2-text-tertiary)] mt-1">
              {metrics?.totalProjectsCount || 0} total active initiatives
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Pending Tasks</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-sky-300">
              {metrics?.pendingTasksCount || 0}
            </div>
            <p className="text-[11px] text-[var(--slate-v2-text-tertiary)] mt-1">
              {metrics?.taskCompletionRate || 0}% overall completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Work Orders</span>
              <Wrench className="w-4 h-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-amber-300">
              {metrics?.activeWorkOrdersCount || 0}
            </div>
            <p className="text-[11px] text-[var(--slate-v2-text-tertiary)] mt-1">
              Active field & service requests
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Attention Required</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-rose-300">
              {(metrics?.overdueTasksCount || 0) + (metrics?.criticalIssuesCount || 0)}
            </div>
            <p className="text-[11px] text-[var(--slate-v2-text-tertiary)] mt-1">
              {metrics?.overdueTasksCount || 0} overdue, {metrics?.criticalIssuesCount || 0} critical incidents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Command Center Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[var(--slate-v2-surface-1)] border border-[var(--slate-v2-border-subtle)]">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Compass className="w-3.5 h-3.5 mr-1.5" />
            Operational Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Briefcase className="w-3.5 h-3.5 mr-1.5" />
            Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
            Task Board ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="teams" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Teams & People ({teams.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Operational Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attention Required Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
                <CardHeader className="p-4 border-b border-[var(--slate-v2-border-subtle)]">
                  <CardTitle className="text-xs font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Attention Required & Escalations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5">
                  {(metrics?.attentionRequired || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[var(--slate-v2-surface-2)]/60 border border-[var(--slate-v2-border-subtle)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${item.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <span className="text-white font-medium">{item.label}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-800">
                        Action Needed
                      </Badge>
                    </div>
                  ))}

                  {(!metrics?.attentionRequired || metrics.attentionRequired.length === 0) && (
                    <div className="py-6 text-center text-xs text-[var(--slate-v2-text-tertiary)] flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>All systems nominal. No overdue tasks or active operational incidents.</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Work Orders Snapshot */}
              <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
                <CardHeader className="p-4 border-b border-[var(--slate-v2-border-subtle)]">
                  <CardTitle className="text-xs font-semibold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-sky-400" />
                    <span>Active Work Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--slate-v2-surface-2)] text-[var(--slate-v2-text-secondary)] border-b border-[var(--slate-v2-border-subtle)] uppercase tracking-wider font-mono">
                        <tr>
                          <th className="py-2.5 px-4">Order #</th>
                          <th className="py-2.5 px-4">Title</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--slate-v2-border-subtle)]">
                        {workOrders.slice(0, 5).map(wo => (
                          <tr key={wo.id} className="hover:bg-[var(--slate-v2-surface-2)]/50">
                            <td className="py-2.5 px-4 font-mono text-indigo-300">{wo.order_number}</td>
                            <td className="py-2.5 px-4 font-medium text-white">{wo.title}</td>
                            <td className="py-2.5 px-4 capitalize text-[var(--slate-v2-text-secondary)]">{wo.work_order_type}</td>
                            <td className="py-2.5 px-4">
                              <Badge variant="outline" className="text-[10px] text-sky-300 border-sky-800">
                                {wo.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {workOrders.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-[var(--slate-v2-text-tertiary)]">
                              No active work orders.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Load Sidebar */}
            <div className="space-y-4">
              <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
                <CardHeader className="p-4 border-b border-[var(--slate-v2-border-subtle)]">
                  <CardTitle className="text-xs font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Teams Capacity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {teams.map(team => (
                    <div key={team.id} className="p-3 rounded-lg bg-[var(--slate-v2-surface-2)]/50 border border-[var(--slate-v2-border-subtle)] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{team.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          {team.ops_team_members?.length || 0} members
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--slate-v2-text-secondary)] mt-1">
                        Dept: {team.department}
                      </div>
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <div className="py-6 text-center text-xs text-[var(--slate-v2-text-tertiary)]">
                      No operational teams created yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Projects List */}
        <TabsContent value="projects">
          <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--slate-v2-surface-2)] text-[var(--slate-v2-text-secondary)] border-b border-[var(--slate-v2-border-subtle)] uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Project Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4 text-right">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--slate-v2-border-subtle)]">
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-[var(--slate-v2-surface-2)]/50">
                        <td className="py-3 px-4 font-mono text-indigo-300">{p.project_code}</td>
                        <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-800">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 capitalize text-[var(--slate-v2-text-secondary)]">{p.priority}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ${Number(p.budget_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--slate-v2-text-tertiary)]">
                          No active projects found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Tasks Board */}
        <TabsContent value="tasks">
          <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
            <CardContent className="p-4 space-y-3">
              {tasks.map(t => (
                <div key={t.id} className="p-3 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCompleteTask(t.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        t.status === 'done' ? 'bg-emerald-600 border-emerald-500' : 'border-zinc-500 hover:border-indigo-400'
                      }`}
                    >
                      {t.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div>
                      <span className={`font-semibold ${t.status === 'done' ? 'line-through text-zinc-500' : 'text-white'}`}>
                        {t.title}
                      </span>
                      {t.ops_projects && (
                        <span className="ml-2 text-[10px] font-mono text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded">
                          {t.ops_projects.project_code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
                      {t.priority}
                    </Badge>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="py-8 text-center text-xs text-[var(--slate-v2-text-tertiary)]">
                  No tasks registered yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Teams & People */}
        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => (
              <Card key={team.id} className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
                <CardHeader className="p-4 border-b border-[var(--slate-v2-border-subtle)]">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold text-white">{team.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] text-indigo-300 border-indigo-800">
                      {team.department}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="text-[11px] text-[var(--slate-v2-text-secondary)]">
                    Lead: {team.lead_party?.primary_name || 'Unassigned'}
                  </div>
                  <div className="pt-2 border-t border-[var(--slate-v2-border-subtle)] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--slate-v2-text-tertiary)]">Members</span>
                    {(team.ops_team_members || []).map(m => (
                      <div key={m.id} className="text-xs text-white flex items-center justify-between">
                        <span>{m.member_party?.primary_name || 'Staff Member'}</span>
                        <span className="text-[10px] text-zinc-400 capitalize">{m.role_in_team}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Create Project */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">New Project Initiative</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Project Name</Label>
              <Input
                required
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enterprise Cloud Infrastructure Migration"
                className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Scope, deliverable, objectives..."
                className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Priority</Label>
                <Select
                  value={newProject.priority}
                  onValueChange={val => setNewProject({ ...newProject, priority: val })}
                >
                  <SelectTrigger className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--slate-v2-surface-2)] text-white border-[var(--slate-v2-border-subtle)]">
                    <SelectItem value="low" className="text-xs">Low</SelectItem>
                    <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                    <SelectItem value="high" className="text-xs">High</SelectItem>
                    <SelectItem value="critical" className="text-xs">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Budget ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newProject.budget_amount}
                  onChange={e => setNewProject({ ...newProject, budget_amount: e.target.value })}
                  placeholder="25000"
                  className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsProjectModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
