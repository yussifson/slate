import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 ShieldCheck, Plus, Search, Filter, AlertTriangle, 
 CheckCircle2, FileText, FileSignature, 
 Calendar, AlertCircle, Edit3, Trash2
} from 'lucide-react';

export default function UnivCompliance({
 title = 'Compliance Tracker',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'compliance';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingItem, setEditingItem] = useState(null);

 const [formState, setFormState] = useState({
 title: '',
 category: 'Certification',
 framework: 'ISO 27001',
 status: 'Compliant',
 last_audit_date: '',
 next_audit_date: '',
 owner: '',
 notes: ''
});

 const { data: complianceItems = [], isLoading} = useQuery({
 queryKey: ['compliance', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_items`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const filteredItems = useMemo(() => {
 let filtered = complianceItems;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(i => 
 (i.title || '').toLowerCase().includes(q) || 
 (i.framework || '').toLowerCase().includes(q) ||
 (i.category || '').toLowerCase().includes(q)
 );
}
 return filtered.sort((a, b) => {
 // Sort Non-Compliant first, then expiring soon
 if (a.status !== b.status) {
 if (a.status === 'Non-Compliant') return -1;
 if (b.status === 'Non-Compliant') return 1;
 if (a.status === 'In Progress') return -1;
 if (b.status === 'In Progress') return 1;
}
 return new Date(a.next_audit_date || '9999-12-31') - new Date(b.next_audit_date || '9999-12-31');
});
}, [complianceItems, searchQuery]);

 const saveMutation = useMutation({
 mutationFn: async (itemData) => {
 const isNew = !itemData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_items`, data: itemData};
} else {
 payload = { ...itemData, company_id: effectiveCompanyId};
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
 const updatePayload = targetTable === 'industry_records' ? { data: itemData} : itemData;
 await (async () => { const _payload = updatePayload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, itemData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['compliance', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Compliance item saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['compliance', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Item deleted.'});
}
});

 const handleSave = (e) => {
 e.preventDefault();
 if (!formState.title) return;
 saveMutation.mutate(formState);
};

 const openNewModal = () => {
 setEditingItem(null);
 setFormState({
 title: '',
 category: 'Certification',
 framework: 'ISO 27001',
 status: 'Compliant',
 last_audit_date: '',
 next_audit_date: '',
 owner: '',
 notes: ''
});
 setIsModalOpen(true);
};

 const openEditModal = (item) => {
 setEditingItem(item);
 setFormState({ ...item});
 setIsModalOpen(true);
};

 const today = new Date();
 const getStatusColor = (status, nextAudit) => {
 if (status === 'Non-Compliant') return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
 if (status === 'In Progress') return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
 
 // Check if audit is within 30 days
 if (nextAudit) {
 const auditDate = new Date(nextAudit);
 const diffTime = Math.abs(auditDate - today);
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
 if (auditDate > today && diffDays <= 30) {
 return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
}
}
 
 return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
};

 // Stats
 const compliantCount = complianceItems.filter(i => i.status === 'Compliant').length;
 const nonCompliantCount = complianceItems.filter(i => i.status === 'Non-Compliant').length;
 const inProgressCount = complianceItems.filter(i => i.status === 'In Progress').length;
 
 const complianceRate = complianceItems.length > 0 ? (compliantCount / complianceItems.length) * 100 : 100;

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2 tracking-[-0.02em]">
 <ShieldCheck className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Track regulatory adherence, certifications, and audits.</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Add Item
 </button>
 </div>
 </div>

 {/* Global Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl p-4 flex flex-col justify-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Compliance Rate</div>
 <div className="flex items-center gap-2">
 <div className="text-2xl font-semibold text-foreground tracking-[-0.02em]">{complianceRate.toFixed(0)}%</div>
 {complianceRate === 100 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
 </div>
 <div className="w-full h-1.5 bg-muted rounded-md-full mt-2 overflow-hidden">
 <div className={cn("h-full transition-all", complianceRate === 100 ? "bg-emerald-500/10" : complianceRate > 80 ? "bg-amber-500" : "bg-red-500/10")} style={{ width: `${complianceRate}%`}}></div>
 </div>
 </div>
 
 <div className="bg-emerald-50 dark:bg-emerald-900/10 border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 dark:border-emerald-800 rounded-md-xl p-4 flex flex-col justify-center">
 <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 tracking-[0.04em]">Compliant</div>
 <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300 tracking-[-0.02em]">{compliantCount}</div>
 </div>
 
 <div className="bg-amber-50 dark:bg-amber-900/10 border-[0.5px] border-black/9 dark:border-white/8 border-amber-100 dark:border-amber-800 rounded-md-xl p-4 flex flex-col justify-center">
 <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 tracking-[0.04em]">In Progress</div>
 <div className="text-2xl font-semibold text-amber-700 dark:text-amber-300 tracking-[-0.02em]">{inProgressCount}</div>
 </div>

 <div className="bg-red-50 dark:bg-red-900/10 border-[0.5px] border-black/9 dark:border-white/8 border-red-100 dark:border-red-800 rounded-md-xl p-4 flex flex-col justify-center">
 <div className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1 tracking-[0.04em]">Non-Compliant</div>
 <div className="text-2xl font-semibold text-red-700 dark:text-red-300 tracking-[-0.02em]">{nonCompliantCount}</div>
 </div>
 </div>
 
 {/* Toolbar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text" 
 placeholder="Search compliance items..."
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
 {filteredItems.length === 0 ? (
 <div className="text-center py-20 text-[#71717a] dark:text-gray-400">
 <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-semibold text-foreground">No compliance items</h3>
 <p className="text-sm mt-1">Start tracking policies and certifications.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
 {filteredItems.map(item => {
 const colorClass = getStatusColor(item.status, item.next_audit_date);
 const isWarning = colorClass.includes('orange');

 return (
 <div key={item.id} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-6 transition- group relative flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-start mb-4">
 <div>
 <span className={cn("px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border-[0.5px] border-black/9 dark:border-white/8 mb-2 inline-block", colorClass)}>
 {isWarning ? 'Audit Approaching' : item.status}
 </span>
 <h3 className="text-lg font-semibold text-foreground line-clamp-1">{item.title}</h3>
 <div className="text-xs text-[#71717a] dark:text-gray-400 mt-1 flex items-center gap-2 tracking-[0.04em]">
 <span className="font-semibold px-1.5 py-0.5 bg-muted rounded-md">{item.framework}</span>
 <span>•</span>
 <span>{item.category}</span>
 </div>
 </div>
 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(item)} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-primary rounded-md hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>
 <button onClick={() => { if(window.confirm('Delete item?')) deleteMutation.mutate(item.id);}} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>

 <div className="space-y-3 flex-1 mb-6">
 <div className="flex items-center gap-3 text-sm text-foreground">
 <Calendar className="w-4 h-4 text-[#71717a] dark:text-gray-400 shrink-0" />
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Last Audit</div>
 <div className="font-medium">{item.last_audit_date ? new Date(item.last_audit_date).toLocaleDateString() : 'N/A'}</div>
 </div>
 </div>
 <div className="flex items-center gap-3 text-sm text-foreground">
 <AlertCircle className={cn("w-4 h-4 shrink-0", isWarning ? "text-orange-500" : "text-[#71717a] dark:text-gray-400")} />
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Next Audit</div>
 <div className={cn("font-medium", isWarning && "text-orange-600 dark:text-orange-400")}>{item.next_audit_date ? new Date(item.next_audit_date).toLocaleDateString() : 'Not scheduled'}</div>
 </div>
 </div>
 </div>

 <div className="pt-4 border-t border-primary/40 flex items-center justify-between text-sm">
 <div className="text-[#71717a] dark:text-gray-400">Owner</div>
 <div className="font-medium text-foreground">{item.owner || 'Unassigned'}</div>
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
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20}}
 animate={{ opacity: 1, scale: 1, y: 0}}
 exit={{ opacity: 0, scale: 0.95, y: 20}}
 className="relative w-full max-w-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl overflow-hidden flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="px-6 py-4 border-b border-primary/40 flex items-center justify-between bg-muted/20">
 <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
 <ShieldCheck className="w-5 h-5 text-primary" />
 {editingItem ? 'Edit Compliance Item' : 'New Compliance Item'}
 </h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="compliance-form" onSubmit={handleSave} className="space-y-6">
 
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Item Title *</label>
 <input required type="text" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} placeholder="e.g. SOC 2 Type II, GDPR Privacy Policy" className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Category</label>
 <select value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Certification</option>
 <option>Internal Policy</option>
 <option>Regulatory Requirement</option>
 <option>Training Matrix</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Framework / Standard</label>
 <input type="text" value={formState.framework} onChange={e => setFormState({...formState, framework: e.target.value})} placeholder="e.g. ISO 27001, HIPAA" className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label>
 <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Compliant</option>
 <option>In Progress</option>
 <option>Non-Compliant</option>
 <option>Not Applicable</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Owner / Responsible</label>
 <input type="text" value={formState.owner} onChange={e => setFormState({...formState, owner: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Last Audit Date</label>
 <input type="date" value={formState.last_audit_date} onChange={e => setFormState({...formState, last_audit_date: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Next Audit Due</label>
 <input type="date" value={formState.next_audit_date} onChange={e => setFormState({...formState, next_audit_date: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Notes / Remediation Plan</label>
 <textarea value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full h-24 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>

 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="compliance-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Saving...' : 'Save Item'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
