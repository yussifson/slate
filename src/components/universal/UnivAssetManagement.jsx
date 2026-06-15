import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 Package, Search, Plus, Filter, Edit3, Trash2, Tag, 
 MapPin, Wrench, MoreHorizontal, AlertCircle, DollarSign,
 TrendingDown, CheckCircle2, QrCode
} from 'lucide-react';

const ASSET_STATUS = {
 'Active': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800',
 'In Maintenance': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800',
 'Retired': 'bg-slate-100 text-slate-700 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40',
 'Lost': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800'
};

export default function UnivAssetManagement({
 title = 'Asset Management',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'assets';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingAsset, setEditingAsset] = useState(null);

 const [formState, setFormState] = useState({
 name: '',
 asset_tag: '',
 category: 'Hardware',
 status: 'Active',
 location: '',
 purchase_date: '',
 purchase_price: 0,
 current_value: 0,
 assigned_to: '',
 notes: ''
});

 const { data: assets = [], isLoading} = useQuery({
 queryKey: ['assets', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_assets`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}))
 .sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || ''));
},
 enabled: !!effectiveCompanyId
});

 const filteredAssets = useMemo(() => {
 let filtered = assets;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(a => 
 (a.name || '').toLowerCase().includes(q) || 
 (a.asset_tag || '').toLowerCase().includes(q) ||
 (a.location || '').toLowerCase().includes(q)
 );
}
 return filtered;
}, [assets, searchQuery]);

 const saveMutation = useMutation({
 mutationFn: async (assetData) => {
 const isNew = !assetData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_assets`, data: assetData};
} else {
 payload = { ...assetData, company_id: effectiveCompanyId};
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
 const updatePayload = targetTable === 'industry_records' ? { data: assetData} : assetData;
 await (async () => { const _payload = updatePayload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, assetData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['assets', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Asset saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['assets', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Asset deleted.'});
}
});

 const handleSave = (e) => {
 e.preventDefault();
 if (!formState.name || !formState.asset_tag) return;
 saveMutation.mutate(formState);
};

 const openNewModal = () => {
 setEditingAsset(null);
 setFormState({
 name: '',
 asset_tag: `AST-${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`,
 category: 'Hardware',
 status: 'Active',
 location: '',
 purchase_date: new Date().toISOString().split('T')[0],
 purchase_price: 0,
 current_value: 0,
 assigned_to: '',
 notes: ''
});
 setIsModalOpen(true);
};

 const openEditModal = (asset) => {
 setEditingAsset(asset);
 setFormState({ ...asset});
 setIsModalOpen(true);
};

 // Stats
 const totalAssets = assets.length;
 const activeAssets = assets.filter(a => a.status === 'Active').length;
 const inMaintenance = assets.filter(a => a.status === 'In Maintenance').length;
 const totalValue = assets.reduce((acc, a) => acc + (Number(a.current_value) || 0), 0);

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-6 shrink-0">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
 <Package className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Track physical assets, locations, and depreciation.</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Add Asset
 </button>
 </div>
 </div>

 {/* Stats Row */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
 <div className="bg-muted/30 border border-primary/40 rounded-xl p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-2">
 <Package className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Total Assets</span>
 </div>
 <div className="text-2xl font-bold text-foreground">{totalAssets}</div>
 </div>
 <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4">
 <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
 <CheckCircle2 className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Active</span>
 </div>
 <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{activeAssets}</div>
 </div>
 <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl p-4">
 <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
 <Wrench className="w-4 h-4" /> <span className="text-xs font-bold uppercase">In Maintenance</span>
 </div>
 <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{inMaintenance}</div>
 </div>
 <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
 <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
 <DollarSign className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Total Value</span>
 </div>
 <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">${totalValue.toLocaleString()}</div>
 </div>
 </div>
 
 {/* Filters bar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search by name, tag, or location..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-4 bg-background border border-primary/40 rounded-lg text-sm focus:outline-none focus:border-primary "
 />
 </div>
 <button className="h-10 px-4 bg-background border border-primary/40 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors ">
 <Filter className="w-4 h-4 text-muted-foreground" /> Filter
 </button>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10">
 <div className="max-w-7xl mx-auto space-y-4">
 {filteredAssets.length === 0 ? (
 <div className="text-center py-20 text-muted-foreground">
 <QrCode className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-bold text-foreground">No assets found</h3>
 <p className="text-sm mt-1">Add your first asset to the inventory.</p>
 </div>
 ) : (
 <div className="bg-card border border-primary/40 rounded-2xl overflow-hidden">
 <table className="w-full text-sm text-left">
 <thead className="bg-muted/50 border-b border-primary/40 text-xs uppercase tracking-wider text-muted-foreground">
 <tr>
 <th className="px-6 py-4 font-semibold">Asset Details</th>
 <th className="px-6 py-4 font-semibold">Location / Assignment</th>
 <th className="px-6 py-4 font-semibold">Value</th>
 <th className="px-6 py-4 font-semibold">Status</th>
 <th className="px-6 py-4 text-right font-semibold">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredAssets.map(asset => (
 <tr key={asset.id} className="hover:bg-muted/30 transition-colors group">
 <td className="px-6 py-4">
 <div className="font-bold text-foreground flex items-center gap-2">
 {asset.name}
 </div>
 <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
 <span className="flex items-center gap-1 font-mono bg-muted px-1.5 py-0.5 rounded text-foreground"><QrCode className="w-3 h-3" /> {asset.asset_tag}</span>
 <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {asset.category}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="font-semibold text-foreground flex items-center gap-1">
 <MapPin className="w-3 h-3 text-muted-foreground" /> {asset.location || 'Unspecified'}
 </div>
 {asset.assigned_to && (
 <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
 Assigned to: <span className="font-medium text-foreground">{asset.assigned_to}</span>
 </div>
 )}
 </td>
 <td className="px-6 py-4">
 <div className="font-bold text-foreground">${Number(asset.current_value).toLocaleString()}</div>
 {Number(asset.purchase_price) > Number(asset.current_value) && (
 <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
 <TrendingDown className="w-3 h-3 text-red-500" /> 
 from ${Number(asset.purchase_price).toLocaleString()}
 </div>
 )}
 </td>
 <td className="px-6 py-4">
 <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border", ASSET_STATUS[asset.status] || ASSET_STATUS['Active'])}>
 {asset.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(asset)} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10">
 <Edit3 className="w-4 h-4" />
 </button>
 <button onClick={() => { if(window.confirm('Delete asset?')) deleteMutation.mutate(asset.id);}} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
 <Trash2 className="w-4 h-4" />
 </button>
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
 className="relative w-full max-w-2xl bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <div className="px-6 py-4 border-b border-primary/40 flex items-center justify-between bg-muted/20">
 <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
 <Package className="w-5 h-5 text-primary" />
 {editingAsset ? 'Edit Asset' : 'New Asset'}
 </h2>
 <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-5 h-5" /></button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="asset-form" onSubmit={handleSave} className="space-y-6">
 
 {/* Basic Info */}
 <div className="space-y-4">
 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-primary/40 pb-2">Basic Info</h3>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Asset Name *</label>
 <input required type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Asset Tag *</label>
 <input required type="text" value={formState.asset_tag} onChange={e => setFormState({...formState, asset_tag: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm font-mono focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Category</label>
 <select value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Hardware</option>
 <option>Software License</option>
 <option>Vehicle</option>
 <option>Furniture</option>
 <option>Machinery</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Status</label>
 <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Active</option>
 <option>In Maintenance</option>
 <option>Retired</option>
 <option>Lost</option>
 </select>
 </div>
 </div>
 </div>

 {/* Location & Assignment */}
 <div className="space-y-4">
 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-primary/40 pb-2">Location & Assignment</h3>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Location</label>
 <input type="text" placeholder="e.g. Server Room A, HQ" value={formState.location} onChange={e => setFormState({...formState, location: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Assigned To</label>
 <input type="text" placeholder="e.g. John Doe" value={formState.assigned_to} onChange={e => setFormState({...formState, assigned_to: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>
 </div>

 {/* Financial Info */}
 <div className="space-y-4">
 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-primary/40 pb-2">Financial Info</h3>
 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Purchase Date</label>
 <input type="date" value={formState.purchase_date} onChange={e => setFormState({...formState, purchase_date: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Purchase Price ($)</label>
 <input type="number" min="0" step="0.01" value={formState.purchase_price} onChange={e => setFormState({...formState, purchase_price: parseFloat(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Current Value ($)</label>
 <input type="number" min="0" step="0.01" value={formState.current_value} onChange={e => setFormState({...formState, current_value: parseFloat(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Notes</label>
 <textarea value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full h-20 p-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>

 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="asset-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Saving...' : 'Save Asset'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
