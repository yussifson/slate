import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 Briefcase, Plus, Search, Filter, Star, 
 FileText, CreditCard, Building2, UserCircle, 
 MapPin, Globe, CheckCircle2, AlertCircle, Edit3, Trash2
} from 'lucide-react';

export default function UnivVendorManagement({
 title = 'Vendor Management',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'vendors';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingVendor, setEditingVendor] = useState(null);

 const [formState, setFormState] = useState({
 name: '',
 category: 'Software/IT',
 contact_name: '',
 email: '',
 phone: '',
 status: 'Active',
 rating: 3,
 contract_expiry: '',
 total_spend: 0,
 notes: ''
});

 const { data: vendors = [], isLoading} = useQuery({
 queryKey: ['vendors', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_vendors`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const filteredVendors = useMemo(() => {
 let filtered = vendors;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(v => 
 (v.name || '').toLowerCase().includes(q) || 
 (v.category || '').toLowerCase().includes(q) ||
 (v.contact_name || '').toLowerCase().includes(q)
 );
}
 return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
}, [vendors, searchQuery]);

 const saveMutation = useMutation({
 mutationFn: async (vendorData) => {
 const isNew = !vendorData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_vendors`, data: vendorData};
} else {
 payload = { ...vendorData, company_id: effectiveCompanyId};
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
 const updatePayload = targetTable === 'industry_records' ? { data: vendorData} : vendorData;
 await (async () => { const _payload = updatePayload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, vendorData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['vendors', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Vendor saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['vendors', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Vendor deleted.'});
}
});

 const handleSave = (e) => {
 e.preventDefault();
 if (!formState.name) return;
 saveMutation.mutate(formState);
};

 const openNewModal = () => {
 setEditingVendor(null);
 setFormState({
 name: '',
 category: 'Software/IT',
 contact_name: '',
 email: '',
 phone: '',
 status: 'Active',
 rating: 3,
 contract_expiry: '',
 total_spend: 0,
 notes: ''
});
 setIsModalOpen(true);
};

 const openEditModal = (vendor) => {
 setEditingVendor(vendor);
 setFormState({ ...vendor});
 setIsModalOpen(true);
};

 // Stats
 const activeVendors = vendors.filter(v => v.status === 'Active').length;
 const totalSpend = vendors.reduce((acc, v) => acc + (Number(v.total_spend) || 0), 0);
 const avgRating = vendors.length > 0 ? (vendors.reduce((acc, v) => acc + (Number(v.rating) || 0), 0) / vendors.length).toFixed(1) : 0;
 
 // Contracts expiring in next 30 days
 const today = new Date();
 const thirtyDaysFromNow = new Date(today);
 thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
 
 const expiringContracts = vendors.filter(v => {
 if (!v.contract_expiry) return false;
 const exp = new Date(v.contract_expiry);
 return exp > today && exp <= thirtyDaysFromNow;
}).length;

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
 <Building2 className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Manage vendor relationships, contracts, and performance.</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Add Vendor
 </button>
 </div>
 </div>

 {/* Global Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
 <div className="bg-card border border-primary/40 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
 <Briefcase className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Vendors</div>
 <div className="text-xl font-bold text-foreground">{activeVendors}</div>
 </div>
 </div>
 <div className="bg-card border border-primary/40 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
 <CreditCard className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Spend</div>
 <div className="text-xl font-bold text-foreground">${totalSpend.toLocaleString()}</div>
 </div>
 </div>
 <div className="bg-card border border-primary/40 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
 <Star className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Rating</div>
 <div className="text-xl font-bold text-foreground flex items-center gap-1">{avgRating} <Star className="w-4 h-4 fill-amber-500 text-amber-500" /></div>
 </div>
 </div>
 <div className="bg-card border border-primary/40 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
 <FileText className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiring SOON</div>
 <div className="text-xl font-bold text-foreground flex items-center gap-2">
 {expiringContracts} {expiringContracts > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
 </div>
 </div>
 </div>
 </div>
 
 {/* Toolbar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search vendors..."
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
 <div className="max-w-7xl mx-auto space-y-4">
 {filteredVendors.length === 0 ? (
 <div className="text-center py-20 text-muted-foreground">
 <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-bold text-foreground">No vendors found</h3>
 <p className="text-sm mt-1">Add a vendor to start managing relationships.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredVendors.map(vendor => {
 const rating = Number(vendor.rating) || 0;
 let expWarning = false;
 if (vendor.contract_expiry) {
 const exp = new Date(vendor.contract_expiry);
 if (exp > today && exp <= thirtyDaysFromNow) expWarning = true;
}

 return (
 <div key={vendor.id} className="bg-card border border-primary/40 rounded-2xl p-6 transition- group relative flex flex-col">
 <div className="flex justify-between items-start mb-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg shrink-0">
 {vendor.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <h3 className="text-lg font-bold text-foreground line-clamp-1">{vendor.name}</h3>
 <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 bg-muted rounded-md">{vendor.category}</span>
 </div>
 </div>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(vendor)} className="p-1 text-muted-foreground hover:text-primary"><Edit3 className="w-4 h-4" /></button>
 <button onClick={() => { if(window.confirm('Delete vendor?')) deleteMutation.mutate(vendor.id);}} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>

 <div className="space-y-3 flex-1 mb-6">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <UserCircle className="w-4 h-4 text-muted-foreground shrink-0" />
 <span className="truncate">{vendor.contact_name || 'No contact'}</span>
 </div>
 <div className="flex items-center gap-2 text-sm text-foreground">
 <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
 <span className="truncate">{vendor.email || 'No email'}</span>
 </div>
 <div className="flex items-center gap-2 text-sm text-foreground">
 <FileText className={cn("w-4 h-4 shrink-0", expWarning ? "text-red-500" : "text-muted-foreground")} />
 <span className={cn(expWarning && "text-red-500 font-semibold")}>
 {vendor.contract_expiry ? `Exp: ${new Date(vendor.contract_expiry).toLocaleDateString()}` : 'No contract date'}
 </span>
 </div>
 </div>

 <div className="pt-4 border-t border-primary/40 flex items-center justify-between">
 <div className="flex items-center">
 {[1,2,3,4,5].map(star => (
 <Star key={star} className={cn("w-4 h-4", star <= rating ? "fill-amber-500 text-amber-500" : "fill-muted text-muted")} />
 ))}
 </div>
 <span className={cn("px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border", vendor.status === 'Active' ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800" : "bg-slate-100 text-slate-700 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40")}>
 {vendor.status}
 </span>
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
 className="relative w-full max-w-2xl bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <div className="px-6 py-4 border-b border-primary/40 flex items-center justify-between bg-muted/20">
 <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
 <Building2 className="w-5 h-5 text-primary" />
 {editingVendor ? 'Edit Vendor' : 'New Vendor'}
 </h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="vendor-form" onSubmit={handleSave} className="space-y-6">
 
 <div className="space-y-4">
 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-primary/40 pb-2">Company Info</h3>
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Company Name *</label>
 <input required type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Category</label>
 <select value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Software/IT</option>
 <option>Hardware Provider</option>
 <option>Facilities Management</option>
 <option>Professional Services</option>
 <option>Marketing Agency</option>
 <option>Logistics</option>
 <option>Other</option>
 </select>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-primary/40 pb-2">Contact Info</h3>
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Primary Contact</label>
 <input type="text" value={formState.contact_name} onChange={e => setFormState({...formState, contact_name: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Email</label>
 <input type="email" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div className="col-span-2 sm:col-span-1">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Phone</label>
 <input type="tel" value={formState.phone} onChange={e => setFormState({...formState, phone: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-primary/40 pb-2">Contract & Performance</h3>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Status</label>
 <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Active</option>
 <option>Inactive</option>
 <option>Under Review</option>
 <option>Terminated</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Contract Expiry</label>
 <input type="date" value={formState.contract_expiry} onChange={e => setFormState({...formState, contract_expiry: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Total Spend ($)</label>
 <input type="number" min="0" step="0.01" value={formState.total_spend} onChange={e => setFormState({...formState, total_spend: parseFloat(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Performance Rating (1-5)</label>
 <input type="number" min="1" max="5" value={formState.rating} onChange={e => setFormState({...formState, rating: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Notes / Assessment</label>
 <textarea value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full h-24 p-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>
 </div>
 </div>

 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="vendor-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Saving...' : 'Save Vendor'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
