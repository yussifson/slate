import React, { useState } from 'react';
import { Code, Bug, Plus, MoreVertical, X, ChevronRight, Zap, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CARD = 'bg-card border border-border rounded-2xl p-6 shadow-sm';
const HEAD = 'text-lg font-bold text-foreground flex items-center gap-2 mb-5';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'slate' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'review', label: 'In Review', color: 'amber' },
  { id: 'done', label: 'Done', color: 'emerald' },
];

const SEV_COLORS = {
  critical: 'bg-primary/10 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-primary/10 text-amber-400 border-amber-500/30',
  low: 'bg-slate-500/20 text-muted-foreground border-slate-500/30',
};

const PRI_COLORS = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-muted-foreground',
};

export default function OptavelProductEng() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('kanban');
  const [taskModal, setTaskModal] = useState(false);
  const [bugModal, setBugModal] = useState(false);
  const [sprintModal, setSprintModal] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', sprint_id: '' });
  const [bugForm, setBugForm] = useState({ title: '', description: '', severity: 'medium', status: 'open', product: 'Slate' });
  const [sprintForm, setSprintForm] = useState({ title: '', goal: '', start_date: '', end_date: '' });

  const { data: tasks = [] } = useQuery({
    queryKey: ['optavel_tasks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_tasks WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: bugs = [] } = useQuery({
    queryKey: ['optavel_bugs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_bugs WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['optavel_sprints', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_sprints WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const submitTask = async () => {
    if (!taskForm.title) return toast.error('Title is required');
    await powerSync.execute(
      `INSERT INTO optavel_tasks (id, company_id, title, description, status, priority, assignee_id, sprint_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, taskForm.title, taskForm.description, taskForm.status, taskForm.priority, user.id, taskForm.sprint_id, new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Task created!');
    setTaskModal(false);
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', sprint_id: '' });
    queryClient.invalidateQueries(['optavel_tasks']);
  };

  const submitBug = async () => {
    if (!bugForm.title) return toast.error('Title is required');
    await powerSync.execute(
      `INSERT INTO optavel_bugs (id, company_id, title, description, severity, status, product, reporter_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, bugForm.title, bugForm.description, bugForm.severity, bugForm.status, bugForm.product, user.id, new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Bug reported!');
    setBugModal(false);
    setBugForm({ title: '', description: '', severity: 'medium', status: 'open', product: 'Slate' });
    queryClient.invalidateQueries(['optavel_bugs']);
  };

  const submitSprint = async () => {
    if (!sprintForm.title) return toast.error('Title is required');
    await powerSync.execute(
      `INSERT INTO optavel_sprints (id, company_id, title, goal, status, start_date, end_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, sprintForm.title, sprintForm.goal, 'active', sprintForm.start_date, sprintForm.end_date, new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Sprint started!');
    setSprintModal(false);
    setSprintForm({ title: '', goal: '', start_date: '', end_date: '' });
    queryClient.invalidateQueries(['optavel_sprints']);
  };

  const moveTask = async (taskId, newStatus) => {
    await powerSync.execute(`UPDATE optavel_tasks SET status=?, updated_at=? WHERE id=?`, [newStatus, new Date().toISOString(), taskId]);
    queryClient.invalidateQueries(['optavel_tasks']);
  };

  const deleteTask = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_tasks WHERE id=?`, [id]);
    queryClient.invalidateQueries(['optavel_tasks']);
  };

  const deleteBug = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_bugs WHERE id=?`, [id]);
    queryClient.invalidateQueries(['optavel_bugs']);
  };

  const updateBugStatus = async (id, status) => {
    await powerSync.execute(`UPDATE optavel_bugs SET status=?, updated_at=? WHERE id=?`, [status, new Date().toISOString(), id]);
    queryClient.invalidateQueries(['optavel_bugs']);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    if (dragging) moveTask(dragging, colId);
    setDragging(null); setDragOver(null);
  };

  const openBugs = bugs.filter(b => b.status === 'open').length;
  const activeSprint = sprints.find(s => s.status === 'active');

  return (
    <div className="min-h-screen p-6 md:p-8 bg-background text-foreground" >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><Code className="w-7 h-7 text-primary" /></div>
            Product & Engineering
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Sprint Board · Bug Tracker · Sprint Management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSprintModal(true)} variant="outline" className="border-border text-foreground hover:bg-muted/80 gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-400" /> New Sprint
          </Button>
          <Button onClick={() => setBugModal(true)} variant="outline" className="border-border text-foreground hover:bg-muted/80 gap-2 text-sm">
            <Bug className="w-4 h-4 text-red-400" /> Report Bug
          </Button>
          <Button onClick={() => setTaskModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tasks', val: tasks.length, color: 'blue' },
          { label: 'In Progress', val: tasks.filter(t => t.status === 'in_progress').length, color: 'amber' },
          { label: 'Open Bugs', val: openBugs, color: 'red' },
          { label: 'Active Sprint', val: activeSprint ? activeSprint.title : 'None', color: 'emerald', text: true },
        ].map(({ label, val, color, text }) => (
          <div key={label} className={`${CARD}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`${text ? 'text-base' : 'text-3xl'} font-black text-${color}-400 truncate`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit border border-border">
        {[['kanban','Sprint Board'], ['bugs','Bug Tracker'], ['sprints','Sprints']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-blue-600 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      {tab === 'kanban' && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            const colGradient = col.color === 'slate' ? 'from-slate-400 to-slate-500' : 
                               col.color === 'blue' ? 'from-blue-400 to-blue-500' : 
                               col.color === 'amber' ? 'from-amber-400 to-amber-500' : 
                               'from-emerald-400 to-emerald-500';
            return (
              <div key={col.id}
                className={`bg-card/30 backdrop-blur-md rounded-2xl border transition-all min-h-[400px] shadow-sm relative overflow-hidden flex flex-col ${dragOver === col.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/60 hover:border-border/80'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, col.id)}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colGradient}`} />
                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/40">
                  <h3 className="font-bold text-foreground text-sm tracking-wide">{col.label}</h3>
                  <span className="text-xs bg-background/80 backdrop-blur-sm text-foreground px-2.5 py-0.5 rounded-full font-semibold shadow-inner border border-border/50">{colTasks.length}</span>
                </div>
                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map(task => (
                    <div key={task.id}
                      draggable
                      onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      className="p-3.5 bg-card hover:bg-muted/60 rounded-xl border border-border/60 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-all relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-foreground flex-1 min-w-0 pr-2 leading-snug">{task.title}</p>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all shrink-0 bg-background/50 rounded-md p-1 backdrop-blur-sm">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${PRI_COLORS[task.priority] ? PRI_COLORS[task.priority].replace('text-', 'bg-').replace('-400', '-500/10 text-').concat('400') : 'bg-muted text-muted-foreground'}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-border/40 rounded-xl m-2 bg-muted/20">
                      <span className="text-muted-foreground/60 text-xs font-medium">Drop tasks here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bug Tracker */}
      {tab === 'bugs' && (
        <div className={CARD}>
          <div className={HEAD}><Bug className="w-5 h-5 text-primary" /> Bug Tracker</div>
          {bugs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No bugs reported. 🎉 Codebase is clean!</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="pb-3 pr-4">Bug</th><th className="pb-3 pr-4">Severity</th><th className="pb-3 pr-4">Product</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bugs.map(bug => (
                  <tr key={bug.id} className="group">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-foreground">{bug.title}</p>
                      {bug.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{bug.description}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold capitalize ${SEV_COLORS[bug.severity] || 'bg-muted text-muted-foreground border-border'}`}>{bug.severity}</span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">{bug.product}</td>
                    <td className="py-3 pr-4">
                      <select value={bug.status} onChange={e => updateBugStatus(bug.id, e.target.value)}
                        className="bg-muted border border-border rounded-md px-2 py-1 text-xs text-foreground">
                        <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <button onClick={() => deleteBug(bug.id)} className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sprints */}
      {tab === 'sprints' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sprints.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-muted-foreground">No sprints yet. Create your first sprint.</div>
          ) : sprints.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
            const done = sprintTasks.filter(t => t.status === 'done').length;
            const prog = sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0;
            return (
              <div key={sprint.id} className={`${CARD}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{sprint.title}</h3>
                    {sprint.goal && <p className="text-xs text-muted-foreground mt-0.5">{sprint.goal}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sprint.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{sprint.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {sprint.start_date && sprint.end_date ? `${sprint.start_date} → ${sprint.end_date}` : 'Dates not set'}
                </div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{done}/{sprintTasks.length} tasks done</span><span>{prog}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${prog}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <Dialog open={taskModal} onOpenChange={setTaskModal}>
        <DialogContent className="bg-background border border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Title *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Task name" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} /></div>
            <div><Label className="text-muted-foreground">Description</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Details" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Priority</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div><Label className="text-muted-foreground">Status</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                  <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                </select>
              </div>
            </div>
            <div><Label className="text-muted-foreground">Sprint</Label>
              <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={taskForm.sprint_id} onChange={e => setTaskForm({...taskForm, sprint_id: e.target.value})}>
                <option value="">No Sprint</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button onClick={submitTask} className="bg-primary hover:bg-primary/90 text-primary-foreground">Create Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bug Modal */}
      <Dialog open={bugModal} onOpenChange={setBugModal}>
        <DialogContent className="bg-background border border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Report Bug</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Bug Title *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Describe the bug" value={bugForm.title} onChange={e => setBugForm({...bugForm, title: e.target.value})} /></div>
            <div><Label className="text-muted-foreground">Steps to Reproduce</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="What causes this?" value={bugForm.description} onChange={e => setBugForm({...bugForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Severity</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={bugForm.severity} onChange={e => setBugForm({...bugForm, severity: e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div><Label className="text-muted-foreground">Product</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Slate, API, etc." value={bugForm.product} onChange={e => setBugForm({...bugForm, product: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitBug} className="bg-primary hover:bg-primary/90 text-primary-foreground">Report Bug</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sprint Modal */}
      <Dialog open={sprintModal} onOpenChange={setSprintModal}>
        <DialogContent className="bg-background border border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Create Sprint</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Sprint Name *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="e.g. Sprint 12" value={sprintForm.title} onChange={e => setSprintForm({...sprintForm, title: e.target.value})} /></div>
            <div><Label className="text-muted-foreground">Sprint Goal</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="What's the goal?" value={sprintForm.goal} onChange={e => setSprintForm({...sprintForm, goal: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Start Date</Label><Input type="date" className="bg-muted border-border text-foreground mt-1" value={sprintForm.start_date} onChange={e => setSprintForm({...sprintForm, start_date: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">End Date</Label><Input type="date" className="bg-muted border-border text-foreground mt-1" value={sprintForm.end_date} onChange={e => setSprintForm({...sprintForm, end_date: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitSprint} className="bg-primary hover:bg-primary/90 text-primary-foreground">Start Sprint</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
