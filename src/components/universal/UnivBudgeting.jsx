import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 Wallet, Plus, Search, Filter, TrendingUp, TrendingDown,
 DollarSign, PieChart, Activity, MoreHorizontal, Edit3, Trash2,
 Building2, CalendarDays, AlertCircle
} from 'lucide-react';

export default function UnivBudgeting({
 title = 'Budgeting & Finance',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'budgeting';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingBudget, setEditingBudget] = useState(null);

 const [formState, setFormState] = useState({
 department: '',
 category: 'Operations',
 period: new Date().getFullYear().toString(),
 allocated_amount: 0,
 spent_amount: 0,
 status: 'Active',
 notes: ''
});

 const { data: budgets = [], isLoading} = useQuery({
 queryKey: ['budgets', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_budgets`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const filteredBudgets = useMemo(() => {
 let filtered = budgets;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(b => 
 (b.department || '').toLowerCase().includes(q) || 
 (b.category || '').toLowerCase().includes(q)
 );
}
 return filtered.sort((a, b) => b.allocated_amount - a.allocated_amount);
}, [budgets, searchQuery]);

 const saveMutation = useMutation({
 mutationFn: async (budgetData) => {
 const isNew = !budgetData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_budgets`, data: budgetData};
} else {
 payload = { ...budgetData, company_id: effectiveCompanyId};
}

 if (isNew) {
 const { error} = await (async () => {
 const _p = payload;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO ${targetTable} (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
} else {
 const updatePayload = targetTable === 'industry_records' ? { data: budgetData} : budgetData;
 await (async () => { const _p = updatePayload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, budgetData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['budgets', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Budget saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['budgets', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Budget deleted.'});
}
});

 const handleSave = (e) => {
 e.preventDefault();
 if (!formState.department || !formState.allocated_amount) return;
 saveMutation.mutate(formState);
};

 const openNewModal = () => {
 setEditingBudget(null);
 setFormState({
 department: '',
 category: 'Operations',
 period: new Date().getFullYear().toString(),
 allocated_amount: 0,
 spent_amount: 0,
 status: 'Active',
 notes: ''
});
 setIsModalOpen(true);
};

 const openEditModal = (budget) => {
 setEditingBudget(budget);
 setFormState({ ...budget});
 setIsModalOpen(true);
};

 // Analytics
 const totalAllocated = budgets.reduce((acc, b) => acc + (Number(b.allocated_amount) || 0), 0);
 const totalSpent = budgets.reduce((acc, b) => acc + (Number(b.spent_amount) || 0), 0);
 const totalRemaining = totalAllocated - totalSpent;
 const overallUsagePct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
 <Wallet className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Track departmental budgets, spending, and allocations.</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> New Budget
 </button>
 </div>
 </div>

 {/* Global Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
 <div className="bg-card border border-primary/40 rounded-xl p-4 ">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <DollarSign className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Total Allocated</span>
 </div>
 <div className="text-2xl font-bold text-foreground">${totalAllocated.toLocaleString()}</div>
 </div>
 <div className="bg-card border border-primary/40 rounded-xl p-4 ">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <TrendingUp className="w-4 h-4 text-red-500" /> <span className="text-xs font-bold uppercase tracking-wider">Total Spent</span>
 </div>
 <div className="text-2xl font-bold text-foreground">${totalSpent.toLocaleString()}</div>
 </div>
 <div className="bg-card border border-primary/40 rounded-xl p-4 ">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <Wallet className="w-4 h-4 text-emerald-500" /> <span className="text-xs font-bold uppercase tracking-wider">Remaining</span>
 </div>
 <div className="text-2xl font-bold text-foreground">${totalRemaining.toLocaleString()}</div>
 </div>
 <div className="bg-card border border-primary/40 rounded-xl p-4 flex flex-col justify-center">
 <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
 <span>Overall Usage</span>
 <span className={overallUsagePct > 90 ? "text-red-500" : "text-emerald-500"}>{overallUsagePct.toFixed(1)}%</span>
 </div>
 <div className="h-2.5 bg-muted rounded-full overflow-hidden">
 <div 
 className={cn("h-full transition-all duration-500", overallUsagePct > 90 ? "bg-red-500" : overallUsagePct > 75 ? "bg-amber-500" : "bg-emerald-500")}
 style={{ width: `${Math.min(overallUsagePct, 100)}%`}}
 />
 </div>
 </div>
 </div>
 
 {/* Toolbar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search departments..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-primary/40 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 <button className="h-10 px-4 bg-background border border-primary/40 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors ">
 <Filter className="w-4 h-4 text-muted-foreground" /> Filter
 </button>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10 custom-scrollbar">
 <div className="max-w-7xl mx-auto">
 {filteredBudgets.length === 0 ? (
 <div className="text-center py-20 text-muted-foreground">
 <PieChart className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-bold text-foreground">No budgets found</h3>
 <p className="text-sm mt-1">Create a budget allocation to get started.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {filteredBudgets.map(budget => {
 const allocated = Number(budget.allocated_amount) || 0;
 const spent = Number(budget.spent_amount) || 0;
 const remaining = allocated - spent;
 const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
 const isOver = pct > 100;
 const isWarning = pct > 85 && !isOver;

 return (
 <div key={budget.id} className="bg-card border border-primary/40 rounded-2xl p-6 transition- group relative overflow-hidden">
 {/* Background Progress Bar */}
 <div 
 className={cn("absolute inset-0 opacity-[0.03] pointer-events-none transition-all duration-1000", isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500")} 
 style={{ width: `${Math.min(pct, 100)}%`}} 
 />

 <div className="flex items-start justify-between mb-4 relative z-10">
 <div>
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 {budget.department}
 {isOver && <AlertCircle className="w-4 h-4 text-red-500" />}
 </h3>
 <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
 <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {budget.category}</span>
 <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> FY {budget.period}</span>
 </div>
 </div>
 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(budget)} className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10">
 <Edit3 className="w-4 h-4" />
 </button>
 <button onClick={() => { if(window.confirm('Delete budget?')) deleteMutation.mutate(budget.id);}} className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/30">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>

 <div className="space-y-4 relative z-10">
 <div className="flex justify-between items-end">
 <div>
 <div className="text-2xl font-black text-foreground">${spent.toLocaleString()}</div>
 <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Spent of ${allocated.toLocaleString()}</div>
 </div>
 <div className="text-right">
 <div className={cn("text-lg font-bold", isOver ? "text-red-500" : "text-emerald-500")}>
 {isOver ? `-$${Math.abs(remaining).toLocaleString()}` : `$${remaining.toLocaleString()}`}
 </div>
 <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Remaining</div>
 </div>
 </div>

 <div className="relative">
 <div className="h-3 bg-muted rounded-full overflow-hidden">
 <div 
 className={cn("h-full transition-all duration-1000", isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500")}
 style={{ width: `${Math.min(pct, 100)}%`}}
 />
 </div>
 <div className="absolute right-0 top-4 text-[10px] font-bold text-muted-foreground">{pct.toFixed(1)}% Used</div>
 </div>
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 </div>

 {/* Edit/New Modal */}
 <AnimatePresence>
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20}}
 animate={{ opacity: 1, scale: 1, y: 0}}
 exit={{ opacity: 0, scale: 0.95, y: 20}}
 className="relative w-full max-w-lg bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <div className="px-6 py-4 border-b border-primary/40 flex items-center justify-between bg-muted/20">
 <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
 <Wallet className="w-5 h-5 text-primary" />
 {editingBudget ? 'Edit Budget' : 'New Budget'}
 </h2>
 <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-5 h-5" /></button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="budget-form" onSubmit={handleSave} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Department / Team *</label>
 <input required type="text" value={formState.department} onChange={e => setFormState({...formState, department: e.target.value})} placeholder="e.g. Engineering, Marketing" className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Category</label>
 <select value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Operations</option>
 <option>Payroll</option>
 <option>Marketing</option>
 <option>Capital Expenditure</option>
 <option>R&D</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Financial Period</label>
 <input type="text" value={formState.period} onChange={e => setFormState({...formState, period: e.target.value})} placeholder="e.g. 2024, Q3 2024" className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Allocated Amount ($) *</label>
 <input required type="number" min="0" step="0.01" value={formState.allocated_amount} onChange={e => setFormState({...formState, allocated_amount: parseFloat(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm font-mono focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Spent Amount ($)</label>
 <input type="number" min="0" step="0.01" value={formState.spent_amount} onChange={e => setFormState({...formState, spent_amount: parseFloat(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm font-mono focus:border-primary focus:outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Notes</label>
 <textarea value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full h-24 p-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>
 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="budget-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Saving...' : 'Save Budget'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
