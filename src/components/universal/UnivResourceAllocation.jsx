import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 Users, Plus, Search, Filter, CalendarDays, 
 Briefcase, Activity, CheckCircle2, UserCircle,
 MoreHorizontal, Edit3, Trash2
} from 'lucide-react';

export default function UnivResourceAllocation({
 title = 'Resource Allocation',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'resources';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingResource, setEditingResource] = useState(null);

 const [formState, setFormState] = useState({
 name: '',
 role: 'Developer',
 department: 'Engineering',
 status: 'Available', // Available, Assigned, Overbooked, Off
 current_project: '',
 capacity_percentage: 100, // 0-100
 utilization_percentage: 0, // 0-100
 notes: ''
});

 const { data: resources = [], isLoading} = useQuery({
 queryKey: ['resources', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_resources`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const filteredResources = useMemo(() => {
 let filtered = resources;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(r => 
 (r.name || '').toLowerCase().includes(q) || 
 (r.role || '').toLowerCase().includes(q) ||
 (r.department || '').toLowerCase().includes(q)
 );
}
 return filtered.sort((a, b) => (b.utilization_percentage || 0) - (a.utilization_percentage || 0));
}, [resources, searchQuery]);

 const saveMutation = useMutation({
 mutationFn: async (resourceData) => {
 // Auto-calculate status based on utilization
 let finalStatus = resourceData.status;
 if (resourceData.status !== 'Off') {
 if (resourceData.utilization_percentage === 0) finalStatus = 'Available';
 else if (resourceData.utilization_percentage > 100) finalStatus = 'Overbooked';
 else finalStatus = 'Assigned';
}

 const payloadData = { ...resourceData, status: finalStatus};

 const isNew = !payloadData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_resources`, data: payloadData};
} else {
 payload = { ...payloadData, company_id: effectiveCompanyId};
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
 const updatePayload = targetTable === 'industry_records' ? { data: payloadData} : payloadData;
 await (async () => { const _p = updatePayload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, payloadData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['resources', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Resource saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['resources', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Resource deleted.'});
}
});

 const handleSave = (e) => {
 e.preventDefault();
 if (!formState.name) return;
 saveMutation.mutate(formState);
};

 const openNewModal = () => {
 setEditingResource(null);
 setFormState({
 name: '',
 role: 'Developer',
 department: 'Engineering',
 status: 'Available',
 current_project: '',
 capacity_percentage: 100,
 utilization_percentage: 0,
 notes: ''
});
 setIsModalOpen(true);
};

 const openEditModal = (resource) => {
 setEditingResource(resource);
 setFormState({ ...resource});
 setIsModalOpen(true);
};

 const getStatusStyle = (status) => {
 if (status === 'Available') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800';
 if (status === 'Assigned') return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800';
 if (status === 'Overbooked') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800';
 if (status === 'Off') return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
 return 'bg-muted text-muted-foreground';
};

 // Stats
 const totalResources = resources.length;
 const available = resources.filter(r => r.status === 'Available').length;
 const overbooked = resources.filter(r => r.status === 'Overbooked').length;
 const avgUtilization = totalResources > 0 ? (resources.reduce((acc, r) => acc + (Number(r.utilization_percentage) || 0), 0) / totalResources).toFixed(0) : 0;

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-border bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
 <Users className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Manage staff capacity, utilization, and project assignments.</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Add Resource
 </button>
 </div>
 </div>

 {/* Global Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
 <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Avg Utilization</div>
 <div className="flex items-center gap-2">
 <div className="text-2xl font-bold text-foreground">{avgUtilization}%</div>
 <Activity className={cn("w-5 h-5", avgUtilization > 100 ? "text-red-500" : avgUtilization > 80 ? "text-emerald-500" : "text-blue-500")} />
 </div>
 <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
 <div className={cn("h-full transition-all", avgUtilization > 100 ? "bg-red-500" : avgUtilization > 80 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${Math.min(avgUtilization, 100)}%`}}></div>
 </div>
 </div>
 <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 flex flex-col justify-center">
 <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Available</div>
 <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{available} <span className="text-sm font-medium opacity-70">people</span></div>
 </div>
 <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl p-4 flex flex-col justify-center">
 <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">Overbooked</div>
 <div className="text-2xl font-bold text-red-700 dark:text-red-300">{overbooked} <span className="text-sm font-medium opacity-70">people</span></div>
 </div>
 <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Headcount</div>
 <div className="text-2xl font-bold text-foreground">{totalResources}</div>
 </div>
 </div>
 
 {/* Toolbar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search by name, role, department..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 <button className="h-10 px-4 bg-background border border-border rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors ">
 <Filter className="w-4 h-4 text-muted-foreground" /> Filter
 </button>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10 custom-scrollbar">
 <div className="max-w-7xl mx-auto space-y-4">
 {filteredResources.length === 0 ? (
 <div className="text-center py-20 text-muted-foreground">
 <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-bold text-foreground">No resources found</h3>
 <p className="text-sm mt-1">Add team members to track their capacity.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {filteredResources.map(resource => {
 const util = Number(resource.utilization_percentage) || 0;
 const isOverbooked = util > 100;
 
 return (
 <div key={resource.id} className={cn("bg-card border rounded-2xl p-6 transition- group relative flex flex-col", isOverbooked ? "border-red-200 dark:border-red-800" : "border-border")}>
 <div className="flex justify-between items-start mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
 {resource.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <h3 className="text-base font-bold text-foreground line-clamp-1">{resource.name}</h3>
 <span className="text-xs text-muted-foreground">{resource.role}</span>
 </div>
 </div>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(resource)} className="p-1 text-muted-foreground hover:text-primary"><Edit3 className="w-4 h-4" /></button>
 <button onClick={() => { if(window.confirm('Delete resource?')) deleteMutation.mutate(resource.id);}} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>

 <div className="space-y-3 flex-1 mb-6">
 <div className="text-xs font-semibold px-2 py-0.5 bg-muted rounded-md inline-block mb-1">{resource.department}</div>
 <div className="flex items-center gap-2 text-sm text-foreground">
 <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
 <span className="truncate">{resource.current_project || 'No Active Project'}</span>
 </div>
 </div>

 <div className="pt-4 border-t border-border">
 <div className="flex justify-between items-end mb-2">
 <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border", getStatusStyle(resource.status))}>
 {resource.status}
 </span>
 <span className={cn("text-lg font-black", isOverbooked ? "text-red-500" : "text-foreground")}>{util}%</span>
 </div>
 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
 <div className={cn("h-full transition-all", isOverbooked ? "bg-red-500" : util > 80 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${Math.min(util, 100)}%`}}></div>
 </div>
 </div>
 </div>
 )
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
 className="relative w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
 <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
 <Users className="w-5 h-5 text-primary" />
 {editingResource ? 'Edit Resource' : 'New Resource'}
 </h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="resource-form" onSubmit={handleSave} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Full Name *</label>
 <input required type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Role</label>
 <input type="text" value={formState.role} onChange={e => setFormState({...formState, role: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Department</label>
 <input type="text" value={formState.department} onChange={e => setFormState({...formState, department: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Current Project</label>
 <input type="text" value={formState.current_project} onChange={e => setFormState({...formState, current_project: e.target.value})} placeholder="e.g. Website Redesign" className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Total Capacity (%)</label>
 <input type="number" min="0" max="100" value={formState.capacity_percentage} onChange={e => setFormState({...formState, capacity_percentage: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Current Utilization (%)</label>
 <input type="number" min="0" value={formState.utilization_percentage} onChange={e => setFormState({...formState, utilization_percentage: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Availability Override</label>
 <div className="flex items-center gap-4">
 <label className="flex items-center gap-2 text-sm">
 <input type="checkbox" checked={formState.status === 'Off'} onChange={e => setFormState({...formState, status: e.target.checked ? 'Off' : 'Available'})} className="rounded border-border text-primary focus:ring-primary" />
 Currently OOO / Off
 </label>
 </div>
 <p className="text-xs text-muted-foreground mt-1">Status will auto-calculate based on utilization unless set to Off.</p>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Notes</label>
 <textarea value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full h-24 p-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>

 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="resource-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Saving...' : 'Save Resource'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
