import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
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
 const { toast} = useToast();
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

 const { data: goals = [], isLoading} = useQuery({
 queryKey: ['goals', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_goals`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
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
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_goals`, data: goalData};
} else {
 payload = { ...goalData, company_id: effectiveCompanyId};
}

 if (isNew) {
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO ${targetTable} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
} else {
 const updatePayload = targetTable === 'industry_records' ? { data: goalData} : goalData;
 await (async () => { const _payload = updatePayload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, goalData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['goals', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Goal saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['goals', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Goal deleted.'});
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
 setFormState({ ...goal});
 setIsModalOpen(true);
};

 const getStatusColor = (status) => {
 if (status === 'On Track') return 'bg-emerald-500/10';
 if (status === 'At Risk') return 'bg-amber-500';
 if (status === 'Off Track') return 'bg-red-500/10';
 if (status === 'Completed') return 'bg-blue-500/10';
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
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2 tracking-[-0.02em]">
 <Target className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Track OKRs, strategic objectives, and individual performance.</p>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex bg-muted p-1 rounded-xl">
 <button onClick={() => setView('grid')} className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", view === 'grid' ? "bg-background text-foreground" : "text-[#71717a] dark:text-gray-400")}><LayoutGrid className="w-4 h-4" /></button>
 <button onClick={() => setView('list')} className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", view === 'list' ? "bg-background text-foreground" : "text-[#71717a] dark:text-gray-400")}><List className="w-4 h-4" /></button>
 </div>
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Add Goal
 </button>
 </div>
 </div>

 {/* Global Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Total Goals</div>
 <div className="text-2xl font-semibold text-foreground tracking-[-0.02em]">{totalGoals}</div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-4 flex flex-col justify-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Avg Progress</div>
 <div className="flex items-center gap-2">
 <div className="text-2xl font-semibold text-foreground tracking-[-0.02em]">{avgProgress}%</div>
 <TrendingUp className="w-5 h-5 text-emerald-500" />
 </div>
 <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
 <div className="h-full bg-emerald-500/10 transition-all" style={{ width: `${avgProgress}%`}}></div>
 </div>
 </div>
 <div className="bg-blue-50 dark:bg-blue-900/10 border-[0.5px] border-black/9 dark:border-white/8 border-blue-100 dark:border-blue-800 rounded-xl p-4">
 <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 tracking-[0.04em]">Completed</div>
 <div className="text-2xl font-semibold text-blue-700 dark:text-blue-300 tracking-[-0.02em]">{completedGoals}</div>
 </div>
 <div className="bg-amber-50 dark:bg-amber-900/10 border-[0.5px] border-black/9 dark:border-white/8 border-amber-100 dark:border-amber-800 rounded-xl p-4">
 <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 tracking-[0.04em]">Needs Attention</div>
 <div className="text-2xl font-semibold text-amber-700 dark:text-amber-300 tracking-[-0.02em]">{atRiskGoals}</div>
 </div>
 </div>
 
 {/* Toolbar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text" 
 placeholder="Search goals or owners..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-4 bg-muted/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 <button className="h-10 px-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors ">
 <Filter className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> Filter
 </button>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10 custom-scrollbar">
 <div className="max-w-7xl mx-auto space-y-4">
 {filteredGoals.length === 0 ? (
 <div className="text-center py-20 text-[#71717a] dark:text-gray-400">
 <Crosshair className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-semibold text-foreground">No goals set</h3>
 <p className="text-sm mt-1">Define your first OKR or goal.</p>
 </div>
 ) : view === 'grid' ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredGoals.map(goal => (
 <div key={goal.id} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-6 transition- group relative flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-start mb-4">
 <div>
 <div className="flex items-center gap-2 mb-2">
 <span className={cn("w-2 h-2 rounded-full", getStatusColor(goal.status))} />
 <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{goal.type}</span>
 </div>
 <h3 className="text-lg font-semibold text-foreground line-clamp-2">{goal.title}</h3>
 </div>
 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
 <button onClick={() => openEditModal(goal)} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-primary rounded-md hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>
 <button onClick={() => { if(window.confirm('Delete goal?')) deleteMutation.mutate(goal.id);}} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>

 <div className="space-y-4 flex-1">
 <div className="text-sm text-[#71717a] dark:text-gray-400 line-clamp-2">{goal.description || 'No description provided.'}</div>
 <div className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2 text-foreground font-medium"><Users className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> {goal.owner || 'Unassigned'}</div>
 <div className="flex items-center gap-2 text-[#71717a] dark:text-gray-400"><Flag className="w-4 h-4" /> {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No date'}</div>
 </div>
 </div>

 <div className="pt-6 mt-4 border-t border-primary/40">
 <div className="flex justify-between items-end mb-2">
 <span className="text-xs font-semibold uppercase text-[#71717a] dark:text-gray-400 tracking-wider tracking-[0.04em]">{goal.status}</span>
 <span className="text-lg font-black text-foreground">{goal.progress}%</span>
 </div>
 <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
 <div className={cn("h-full transition-all", getStatusColor(goal.status))} style={{ width: `${Math.min(goal.progress, 100)}%`}}></div>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <table className="w-full text-sm text-left">
 <thead className="bg-muted/50 border-b border-primary/40 text-xs uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
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
 <div className="font-semibold text-foreground">{goal.title}</div>
 </div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 tracking-[0.04em]">
 <span className="font-semibold">{goal.type}</span> • <span className="truncate max-w-[200px]">{goal.description}</span>
 </div>
 </td>
 <td className="px-6 py-4 font-medium text-foreground">{goal.owner || '-'}</td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'}</td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex-1">
 <div className={cn("h-full transition-all", getStatusColor(goal.status))} style={{ width: `${Math.min(goal.progress, 100)}%`}}></div>
 </div>
 <span className="font-semibold text-xs tracking-[0.04em]">{goal.progress}%</span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(goal)} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-primary rounded-md hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>
 <button onClick={() => { if(window.confirm('Delete goal?')) deleteMutation.mutate(goal.id);}} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
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
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20}}
 animate={{ opacity: 1, scale: 1, y: 0}}
 exit={{ opacity: 0, scale: 0.95, y: 20}}
 className="relative w-full max-w-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="px-6 py-4 border-b border-primary/40 flex items-center justify-between bg-muted/20">
 <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
 <Target className="w-5 h-5 text-primary" />
 {editingGoal ? 'Edit Goal' : 'New Goal'}
 </h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="goal-form" onSubmit={handleSave} className="space-y-6">
 
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Goal Title / OKR *</label>
 <input required type="text" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Type</label>
 <select value={formState.type} onChange={e => setFormState({...formState, type: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Company</option>
 <option>Team</option>
 <option>Individual</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Owner</label>
 <input type="text" value={formState.owner} onChange={e => setFormState({...formState, owner: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label>
 <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>On Track</option>
 <option>At Risk</option>
 <option>Off Track</option>
 <option>Completed</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Deadline</label>
 <input type="date" value={formState.deadline} onChange={e => setFormState({...formState, deadline: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div className="bg-muted/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5">
 <div className="flex justify-between items-end mb-3">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Progress (%)</label>
 <span className="text-2xl font-black text-foreground tracking-[-0.02em]">{formState.progress}%</span>
 </div>
 <input type="range" min="0" max="100" value={formState.progress} onChange={e => setFormState({...formState, progress: parseInt(e.target.value)})} className="w-full accent-primary" />
 </div>

 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Description / Key Results</label>
 <textarea value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full h-24 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>

 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="goal-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
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
