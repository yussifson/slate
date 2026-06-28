import React, { useState } from 'react';
import { 
  BarChart2, Zap, AlertTriangle, ChevronRight, Target, Globe, 
  Activity, TrendingUp, TrendingDown, Plus, Briefcase, CheckCircle, 
  ListTodo, DollarSign, XCircle
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useIntelligence } from '@/hooks/useIntelligence';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OptavelCommandCenter() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  // --- Modal States ---
  const [modalOpen, setModalOpen] = useState(null); // 'okr', 'decision', 'task', 'deal'
  
  // Form States
  const [okrForm, setOkrForm] = useState({ title: '', target: 100 });
  const [decisionForm, setDecisionForm] = useState({ title: '' });
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium' });
  const [dealForm, setDealForm] = useState({ lead: '', value: '' });

  // --- Data Fetching ---
  const { data: pipelineData } = useQuery({
    queryKey: ['optavel_pipeline', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const res = await powerSync.execute(
        `SELECT SUM(value) as total FROM optavel_deal_rooms WHERE company_id = ? AND stage != 'closed_won' AND stage != 'closed_lost'`,
        [companyId]
      );
      return res.rows.item(0).total || 0;
    },
    enabled: !!companyId
  });

  const { data: mrrData } = useQuery({
    queryKey: ['optavel_mrr', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const res = await powerSync.execute(
        `SELECT SUM(total_amount) as total FROM univ_invoice WHERE company_id = ? AND status = 'paid'`,
        [companyId]
      );
      return (res.rows.item(0).total || 0) / 12; 
    },
    enabled: !!companyId
  });

  const { data: okrs = [] } = useQuery({
    queryKey: ['optavel_okrs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_okrs WHERE company_id = ? ORDER BY progress DESC LIMIT 4`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['optavel_decisions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_decisions WHERE company_id = ? ORDER BY created_at DESC LIMIT 3`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['optavel_tasks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_tasks WHERE company_id = ? AND status != 'done' ORDER BY created_at DESC LIMIT 4`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { insights = [], isRunning } = useIntelligence('optavel');

  // --- Mutations ---
  const submitOkr = async () => {
    if (!okrForm.title) return toast.error('Title is required');
    await powerSync.execute(
      `INSERT INTO optavel_okrs (id, company_id, objective, progress, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), companyId, okrForm.title, 0, 'on_track', new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('OKR Created!');
    setModalOpen(null);
    setOkrForm({ title: '', target: 100 });
    queryClient.invalidateQueries(['optavel_okrs']);
  };

  const submitDecision = async () => {
    if (!decisionForm.title) return toast.error('Title is required');
    await powerSync.execute(
      `INSERT INTO optavel_decisions (id, company_id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), companyId, decisionForm.title, 'approved', new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Decision Logged!');
    setModalOpen(null);
    setDecisionForm({ title: '' });
    queryClient.invalidateQueries(['optavel_decisions']);
  };

  const submitTask = async () => {
    if (!taskForm.title) return toast.error('Title is required');
    await powerSync.execute(
      `INSERT INTO optavel_tasks (id, company_id, title, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), companyId, taskForm.title, 'todo', taskForm.priority, new Date().toISOString()]
    );
    toast.success('Task Added!');
    setModalOpen(null);
    setTaskForm({ title: '', priority: 'medium' });
    queryClient.invalidateQueries(['optavel_tasks']);
  };

  const submitDeal = async () => {
    if (!dealForm.lead || !dealForm.value) return toast.error('Lead and Value required');
    await powerSync.execute(
      `INSERT INTO optavel_deal_rooms (id, company_id, lead_name, value, stage, probability, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), companyId, dealForm.lead, parseFloat(dealForm.value), 'prospecting', 20, new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Deal Room Created!');
    setModalOpen(null);
    setDealForm({ lead: '', value: '' });
    queryClient.invalidateQueries(['optavel_pipeline']);
  };

  const updateDecisionStatus = async (id, status) => {
    await powerSync.execute(`UPDATE optavel_decisions SET status = ? WHERE id = ?`, [status, id]);
    queryClient.invalidateQueries(['optavel_decisions']);
  };

  const completeTask = async (id) => {
    await powerSync.execute(`UPDATE optavel_tasks SET status = 'done' WHERE id = ?`, [id]);
    toast.success('Task marked complete');
    queryClient.invalidateQueries(['optavel_tasks']);
  };

  const stats = [
    { label: 'Live MRR', val: `$${(mrrData || 0).toLocaleString()}`, trend: '+12%', color: 'from-emerald-400 to-teal-500', icon: DollarSign },
    { label: 'Pipeline Value', val: `$${(pipelineData || 0).toLocaleString()}`, trend: '+5%', color: 'from-blue-400 to-indigo-500', icon: Briefcase },
    { label: 'Active Goals', val: okrs.length.toString(), trend: 'On Track', color: 'from-purple-400 to-pink-500', icon: Target },
    { label: 'Pending Tasks', val: tasks.length.toString(), trend: 'Active', color: 'from-amber-400 to-orange-500', icon: ListTodo },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020817] text-slate-800 dark:text-slate-100 p-6 md:p-8 font-sans animate-in fade-in duration-500">
      
      {/* Header & Quick Actions */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 flex items-center gap-4 mb-3">
            <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-xl shadow-emerald-500/10 border border-slate-100 dark:border-white/10">
              <Globe className="w-8 h-8 text-emerald-500" />
            </div>
            Optavel OS
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Your unified command center for global operations.</p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 p-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Button onClick={() => setModalOpen('okr')} variant="ghost" className="hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 gap-2 font-semibold">
            <Target className="w-4 h-4" /> Add Goal
          </Button>
          <Button onClick={() => setModalOpen('decision')} variant="ghost" className="hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 gap-2 font-semibold">
            <CheckCircle className="w-4 h-4" /> Log Decision
          </Button>
          <Button onClick={() => setModalOpen('task')} variant="ghost" className="hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 gap-2 font-semibold">
            <ListTodo className="w-4 h-4" /> New Task
          </Button>
          <Button onClick={() => setModalOpen('deal')} variant="ghost" className="hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 gap-2 font-semibold">
            <Briefcase className="w-4 h-4" /> Add Deal
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
        {stats.map((stat, i) => (
          <div key={i} className="group relative bg-white dark:bg-[#0F172A] rounded-3xl p-6 shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className={`absolute -right-6 -top-6 w-24 h-24 opacity-10 dark:opacity-5 rounded-full blur-2xl bg-gradient-to-br ${stat.color} group-hover:opacity-20 transition-opacity`}></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <stat.icon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stat.val}</h3>
              <Badge trend={stat.trend} isUp={true} />
            </div>
          </div>
        ))}
      </div>

      {/* Main OS Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Objectives & Decisions */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* OKRs Section */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Target className="w-6 h-6" />
                </div>
                Company Objectives
              </h2>
              <Button onClick={() => setModalOpen('okr')} variant="outline" size="sm" className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20">
                <Plus className="w-4 h-4" /> Add Goal
              </Button>
            </div>
            
            <div className="space-y-4">
              {okrs.length === 0 ? (
                <EmptyState icon={Target} title="No Active OKRs" desc="Set top-level company goals to track progress." />
              ) : (
                okrs.map(okr => (
                  <div key={okr.id} className="p-5 bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#1E293B]/80 border border-slate-200 dark:border-white/5 rounded-2xl transition-colors cursor-pointer">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{okr.objective}</h4>
                        <p className="text-sm font-medium text-slate-500 capitalize">{okr.status.replace('_', ' ')}</p>
                      </div>
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">
                        {okr.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000" style={{ width: `${okr.progress}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sprints & Tasks & Decisions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Decisions */}
            <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500" /> Executive Log
                </h3>
              </div>
              <div className="space-y-3">
                {decisions.length === 0 ? (
                   <EmptyState icon={CheckCircle} title="No Decisions" desc="Log strategic choices." minimal />
                ) : decisions.map(d => (
                  <div key={d.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{d.title}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block ${d.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateDecisionStatus(d.id, 'approved')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => updateDecisionStatus(d.id, 'rejected')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"><XCircle className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Tasks */}
            <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-purple-500" /> Active Tasks
                </h3>
              </div>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                   <EmptyState icon={ListTodo} title="Inbox Zero" desc="No pending tasks." minimal />
                ) : tasks.map(t => (
                  <div key={t.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
                    <div>
                      <p className="font-semibold text-sm">{t.title}</p>
                      <span className={`text-xs font-medium capitalize mt-1 inline-block ${t.priority === 'high' ? 'text-red-500' : 'text-slate-500'}`}>{t.priority} Priority</span>
                    </div>
                    <button onClick={() => completeTask(t.id)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Intelligence */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 dark:from-[#0B1120] dark:to-black rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-slate-800 dark:border-white/5 h-fit">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            Intelligence
          </h2>
          
          <div className="space-y-4 relative z-10">
            {isRunning && (
              <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <Activity className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">Analyzing global operations...</span>
              </div>
            )}
            
            {insights.map(alert => (
              <div key={alert.id} className="group p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors backdrop-blur-sm">
                <div className="flex gap-4">
                  <div className={`p-2 rounded-xl h-fit ${alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base mb-1">{alert.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{alert.description || alert.body}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {insights.length === 0 && !isRunning && (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Activity className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Systems Optimal</h3>
                <p className="text-slate-400 text-sm">No operational anomalies detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      <Dialog open={modalOpen === 'okr'} onOpenChange={o => !o && setModalOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Company Objective</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objective Title</Label>
              <Input placeholder="e.g. Expand to European Market" value={okrForm.title} onChange={e => setOkrForm({...okrForm, title: e.target.value})} />
            </div>
          </div>
          <DialogFooter><Button onClick={submitOkr} className="bg-emerald-600 hover:bg-emerald-700 text-white">Create Goal</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen === 'decision'} onOpenChange={o => !o && setModalOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Strategic Decision</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Decision Summary</Label>
              <Input placeholder="e.g. Approve Q3 Marketing Budget" value={decisionForm.title} onChange={e => setDecisionForm({...decisionForm, title: e.target.value})} />
            </div>
          </div>
          <DialogFooter><Button onClick={submitDecision} className="bg-blue-600 hover:bg-blue-700 text-white">Log Decision</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen === 'task'} onOpenChange={o => !o && setModalOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Engineering Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Description</Label>
              <Input placeholder="e.g. Optimize Database Indexes" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
            </div>
          </div>
          <DialogFooter><Button onClick={submitTask} className="bg-purple-600 hover:bg-purple-700 text-white">Add Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen === 'deal'} onOpenChange={o => !o && setModalOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Deal Room</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lead / Client Name</Label>
              <Input placeholder="e.g. Acme Corp" value={dealForm.lead} onChange={e => setDealForm({...dealForm, lead: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Estimated Value ($)</Label>
              <Input type="number" placeholder="50000" value={dealForm.value} onChange={e => setDealForm({...dealForm, value: e.target.value})} />
            </div>
          </div>
          <DialogFooter><Button onClick={submitDeal} className="bg-amber-600 hover:bg-amber-700 text-white">Create Deal Room</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, minimal = false }) {
  return (
    <div className={`text-center ${minimal ? 'py-6' : 'py-12'} px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50`}>
      <div className={`${minimal ? 'w-10 h-10 mb-2' : 'w-16 h-16 mb-4'} bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto`}>
        <Icon className={`${minimal ? 'w-5 h-5' : 'w-8 h-8'} text-slate-400 dark:text-slate-500`} />
      </div>
      <h3 className={`${minimal ? 'text-sm' : 'text-lg'} font-bold text-slate-700 dark:text-slate-300 mb-1`}>{title}</h3>
      <p className={`${minimal ? 'text-xs' : 'text-sm'} text-slate-500`}>{desc}</p>
    </div>
  );
}

function Badge({ trend, isUp }) {
  return (
    <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl ${isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10'}`}>
      {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      {trend}
    </div>
  );
}
