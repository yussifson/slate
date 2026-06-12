import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useMemo } from 'react';

import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Target, Plus, Search, Filter, TrendingUp, 
  CheckCircle2, Users, Edit3, Trash2, Crosshair, 
  Flag, LayoutGrid, List
} from 'lucide-react';

export default function UnivGoalTracker({
  title = 'Goal & OKR Tracker',
  companyId,
  pageName,
  tableName
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hookCompanyId = useCompanyId();
  const effectiveCompanyId = companyId || hookCompanyId;
  const effectivePageName = pageName || 'goals';
  const targetTable = tableName || 'industry_records';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [view, setView] = useState('grid'); // grid, list

  const [formState, setFormState] = useState({
    title: '',
    type: 'Company', // Company, Team, Individual
    owner: '',
    progress: 0,
    status: 'On Track', // On Track, At Risk, Off Track, Completed
    deadline: '',
    description: ''
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', effectiveCompanyId, effectivePageName],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
      if (targetTable === 'industry_records') {
        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_goals`);
      }
      const { data, error } = await query;
      if (error && error.code !== '42P01') throw error;
      return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r) }));
    },
    enabled: !!effectiveCompanyId
  });

  const filteredGoals = useMemo(() => {
    let filtered = goals;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        (g.title || '').toLowerCase().includes(q) || 
        (g.owner || '').toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31'));
  }, [goals, searchQuery]);

  const saveMutation = useMutation({
    mutationFn: async (goalData) => {
      const isNew = !goalData.id;
      let payload;
      if (targetTable === 'industry_records') {
        payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_goals`, data: goalData };
      } else {
        payload = { ...goalData, company_id: effectiveCompanyId };
      }

      if (isNew) {
        const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO targetTable (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
        if (error) throw error;
      } else {
        const updatePayload = targetTable === 'industry_records' ? { data: goalData } : goalData;
        await (async () => { const _p = updatePayload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE targetTable SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, goalData.id]); })();
      const error = null; const data = [];
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals', effectiveCompanyId, effectivePageName]);
      setIsModalOpen(false);
      toast({ title: 'Goal saved successfully.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute(`DELETE FROM targetTable WHERE id = ?`, [id]);
      const error = null;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals', effectiveCompanyId, effectivePageName]);
      toast({ title: 'Goal deleted.' });
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!formState.title) return;
    saveMutation.mutate(formState);
  };

  const openNewModal = () => {
    setEditingGoal(null);
    setFormState({
      title: '',
      type: 'Company',
      owner: '',
      progress: 0,
      status: 'On Track',
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setFormState({ ...goal });
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    if (status === 'On Track') return 'bg-emerald-500';
    if (status === 'At Risk') return 'bg-amber-500';
    if (status === 'Off Track') return 'bg-red-500';
    if (status === 'Completed') return 'bg-blue-500';
    return 'bg-slate-500';
  };

  // Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'Completed').length;
  const atRiskGoals = goals.filter(g => g.status === 'At Risk' || g.status === 'Off Track').length;
  const avgProgress = totalGoals > 0 ? (goals.reduce((acc, g) => acc + (Number(g.progress) || 0), 0) / totalGoals).toFixed(0) : 0;

  return (
    <div className="flex flex-col h-full bg-background font-sans">
      
      {/* Header */}
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" /> {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Track OKRs, strategic objectives, and individual performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted p-1 rounded-lg">
              <button onClick={() => setView('grid')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", view === 'grid' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setView('list')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", view === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}><List className="w-4 h-4" /></button>
            </div>
            <button 
              onClick={openNewModal}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Goals</div>
            <div className="text-2xl font-bold text-foreground">{totalGoals}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-center">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Avg Progress</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-foreground">{avgProgress}%</div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${avgProgress}%` }}></div>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Completed</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{completedGoals}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Needs Attention</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{atRiskGoals}</div>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search goals or owners..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="h-10 px-4 bg-background border border-border rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground" /> Filter
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Crosshair className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-foreground">No goals set</h3>
              <p className="text-sm mt-1">Define your first OKR or goal.</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map(goal => (
                <div key={goal.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("w-2 h-2 rounded-full", getStatusColor(goal.status))} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{goal.type}</span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground line-clamp-2">{goal.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <button onClick={() => openEditModal(goal)} className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => { if(window.confirm('Delete goal?')) deleteMutation.mutate(goal.id); }} className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="text-sm text-muted-foreground line-clamp-2">{goal.description || 'No description provided.'}</div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-foreground font-medium"><Users className="w-4 h-4 text-muted-foreground" /> {goal.owner || 'Unassigned'}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Flag className="w-4 h-4" /> {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No date'}</div>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-border">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{goal.status}</span>
                      <span className="text-lg font-black text-foreground">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all", getStatusColor(goal.status))} style={{ width: `${Math.min(goal.progress, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Goal & Description</th>
                    <th className="px-6 py-4 font-semibold">Owner</th>
                    <th className="px-6 py-4 font-semibold">Deadline</th>
                    <th className="px-6 py-4 font-semibold w-48">Progress</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredGoals.map(goal => (
                    <tr key={goal.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("w-2 h-2 rounded-full", getStatusColor(goal.status))} />
                          <div className="font-bold text-foreground">{goal.title}</div>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-semibold">{goal.type}</span> • <span className="truncate max-w-[200px]">{goal.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{goal.owner || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex-1">
                            <div className={cn("h-full transition-all", getStatusColor(goal.status))} style={{ width: `${Math.min(goal.progress, 100)}%` }}></div>
                          </div>
                          <span className="font-bold text-xs">{goal.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(goal)} className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => { if(window.confirm('Delete goal?')) deleteMutation.mutate(goal.id); }} className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit/New Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {editingGoal ? 'Edit Goal' : 'New Goal'}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="goal-form" onSubmit={handleSave} className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Goal Title / OKR *</label>
                      <input required type="text" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Type</label>
                      <select value={formState.type} onChange={e => setFormState({...formState, type: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none">
                        <option>Company</option>
                        <option>Team</option>
                        <option>Individual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Owner</label>
                      <input type="text" value={formState.owner} onChange={e => setFormState({...formState, owner: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Status</label>
                      <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none">
                        <option>On Track</option>
                        <option>At Risk</option>
                        <option>Off Track</option>
                        <option>Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Deadline</label>
                      <input type="date" value={formState.deadline} onChange={e => setFormState({...formState, deadline: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-xl p-5">
                    <div className="flex justify-between items-end mb-3">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase">Progress (%)</label>
                      <span className="text-2xl font-black text-foreground">{formState.progress}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={formState.progress} onChange={e => setFormState({...formState, progress: parseInt(e.target.value)})} className="w-full accent-primary" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Description / Key Results</label>
                    <textarea value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full h-24 p-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none resize-none" />
                  </div>

                </form>
              </div>
              
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" form="goal-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
