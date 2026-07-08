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

const CARD = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6';
const HEAD = 'text-lg font-bold text-white flex items-center gap-2 mb-5';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'slate' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'review', label: 'In Review', color: 'amber' },
  { id: 'done', label: 'Done', color: 'emerald' },
];

const SEV_COLORS = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const PRI_COLORS = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-slate-400',
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
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'radial-gradient(ellipse at top right, #0d1f3c 0%, #0a0f1e 60%, #000 100%)' }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl"><Code className="w-7 h-7 text-blue-400" /></div>
            Product & Engineering
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Sprint Board · Bug Tracker · Sprint Management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSprintModal(true)} variant="outline" className="border-white/10 text-white hover:bg-white/10 gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-400" /> New Sprint
          </Button>
          <Button onClick={() => setBugModal(true)} variant="outline" className="border-white/10 text-white hover:bg-white/10 gap-2 text-sm">
            <Bug className="w-4 h-4 text-red-400" /> Report Bug
          </Button>
          <Button onClick={() => setTaskModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm">
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
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`${text ? 'text-base' : 'text-3xl'} font-black text-${color}-400 truncate`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
        {[['kanban','Sprint Board'], ['bugs','Bug Tracker'], ['sprints','Sprints']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      {tab === 'kanban' && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id}
                className={`bg-white/3 rounded-2xl border-2 transition-all min-h-[300px] ${dragOver === col.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, col.id)}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{col.label}</h3>
                  <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {colTasks.map(task => (
                    <div key={task.id}
                      draggable
                      onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 cursor-grab active:cursor-grabbing group transition-all">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-white flex-1 min-w-0 pr-2 leading-snug">{task.title}</p>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {task.description && <p className="text-xs text-slate-500 mt-1 truncate">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-semibold capitalize ${PRI_COLORS[task.priority] || 'text-slate-400'}`}>{task.priority}</span>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-600 text-xs">Drop tasks here</div>
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
          <div className={HEAD}><Bug className="w-5 h-5 text-red-400" /> Bug Tracker</div>
          {bugs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No bugs reported. 🎉 Codebase is clean!</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="pb-3 pr-4">Bug</th><th className="pb-3 pr-4">Severity</th><th className="pb-3 pr-4">Product</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bugs.map(bug => (
                  <tr key={bug.id} className="group">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-white">{bug.title}</p>
                      {bug.description && <p className="text-xs text-slate-500 truncate max-w-xs">{bug.description}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold capitalize ${SEV_COLORS[bug.severity] || 'bg-white/5 text-slate-400 border-white/10'}`}>{bug.severity}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300 text-xs">{bug.product}</td>
                    <td className="py-3 pr-4">
                      <select value={bug.status} onChange={e => updateBugStatus(bug.id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white">
                        <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <button onClick={() => deleteBug(bug.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
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
            <div className="col-span-3 text-center py-16 text-slate-500">No sprints yet. Create your first sprint.</div>
          ) : sprints.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
            const done = sprintTasks.filter(t => t.status === 'done').length;
            const prog = sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0;
            return (
              <div key={sprint.id} className={`${CARD}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{sprint.title}</h3>
                    {sprint.goal && <p className="text-xs text-slate-400 mt-0.5">{sprint.goal}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sprint.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>{sprint.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {sprint.start_date && sprint.end_date ? `${sprint.start_date} → ${sprint.end_date}` : 'Dates not set'}
                </div>
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>{done}/{sprintTasks.length} tasks done</span><span>{prog}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${prog}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <Dialog open={taskModal} onOpenChange={setTaskModal}>
        <DialogContent className="bg-[#0f172a] border border-white/10 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300">Title *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Task name" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} /></div>
            <div><Label className="text-slate-300">Description</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Details" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Priority</Label>
                <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div><Label className="text-slate-300">Status</Label>
                <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                  <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                </select>
              </div>
            </div>
            <div><Label className="text-slate-300">Sprint</Label>
              <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm" value={taskForm.sprint_id} onChange={e => setTaskForm({...taskForm, sprint_id: e.target.value})}>
                <option value="">No Sprint</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button onClick={submitTask} className="bg-blue-600 hover:bg-blue-700 text-white">Create Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bug Modal */}
      <Dialog open={bugModal} onOpenChange={setBugModal}>
        <DialogContent className="bg-[#0f172a] border border-white/10 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Report Bug</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300">Bug Title *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Describe the bug" value={bugForm.title} onChange={e => setBugForm({...bugForm, title: e.target.value})} /></div>
            <div><Label className="text-slate-300">Steps to Reproduce</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="What causes this?" value={bugForm.description} onChange={e => setBugForm({...bugForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Severity</Label>
                <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm" value={bugForm.severity} onChange={e => setBugForm({...bugForm, severity: e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div><Label className="text-slate-300">Product</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Slate, API, etc." value={bugForm.product} onChange={e => setBugForm({...bugForm, product: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitBug} className="bg-red-600 hover:bg-red-700 text-white">Report Bug</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sprint Modal */}
      <Dialog open={sprintModal} onOpenChange={setSprintModal}>
        <DialogContent className="bg-[#0f172a] border border-white/10 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Create Sprint</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300">Sprint Name *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Sprint 12" value={sprintForm.title} onChange={e => setSprintForm({...sprintForm, title: e.target.value})} /></div>
            <div><Label className="text-slate-300">Sprint Goal</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="What's the goal?" value={sprintForm.goal} onChange={e => setSprintForm({...sprintForm, goal: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Start Date</Label><Input type="date" className="bg-white/5 border-white/10 text-white mt-1" value={sprintForm.start_date} onChange={e => setSprintForm({...sprintForm, start_date: e.target.value})} /></div>
              <div><Label className="text-slate-300">End Date</Label><Input type="date" className="bg-white/5 border-white/10 text-white mt-1" value={sprintForm.end_date} onChange={e => setSprintForm({...sprintForm, end_date: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitSprint} className="bg-amber-600 hover:bg-amber-700 text-white">Start Sprint</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
