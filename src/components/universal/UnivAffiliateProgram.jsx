import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';

import { supabase} from "@/api/supabaseClient";
import { motion, AnimatePresence} from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Share2, Link, DollarSign, MousePointerClick} from 'lucide-react';

export default function UnivAffiliateProgram() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [isEditing, setIsEditing] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [formData, setFormData] = useState({
 affiliate_name: '',
 tracking_link: '',
 click_count: '',
 conversion_count: '',
 payout_amount: ''
});

 useEffect(() => {
 fetchData();
}, []);

 const fetchData = async () => {
 setLoading(true);
 const __res = await powerSync.execute(`SELECT * FROM univ_affiliateprogram WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const records = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (!error && records) setData(records);
 setLoading(false);
};

 const handleSave = async () => {
 if (editingId) {
 await (async () => { const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_affiliateprogram SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]);})();
 const error = null; const data = [];
} else {
 await (async () => {
 const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_affiliateprogram (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
}
 setFormData({ affiliate_name: '', tracking_link: '', click_count: '', conversion_count: '', payout_amount: ''});
 setIsEditing(false);
 setEditingId(null);
 fetchData();
};

 const handleEdit = (item) => {
 setFormData({
 affiliate_name: item.affiliate_name || '',
 tracking_link: item.tracking_link || '',
 click_count: item.click_count || '',
 conversion_count: item.conversion_count || '',
 payout_amount: item.payout_amount || ''
});
 setEditingId(item.id);
 setIsEditing(true);
};

 const handleDelete = async (id) => {
 await powerSync.execute(`DELETE FROM univ_affiliateprogram WHERE id = ?`, [id]);
 fetchData();
};

 
 const handleExport = () => {
 const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
 if (!exportData || exportData.length === 0) return alert('No data to export');
 const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
 const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'export.csv'; a.click();
};

 return (
 <div className="p-6 max-w-6xl mx-auto bg-background min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3 tracking-[-0.02em]">
 <Share2 className="text-indigo-500 w-8 h-8" />
 Affiliate Program
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-2">Manage partners, track links, and monitor payouts.</p>
 </div>
 {!isEditing && (
 <div className="flex items-center gap-2">

 
 <div className="flex bg-muted p-1 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mr-2 hidden sm:flex">
 {["Default","Grid","Calendar","Dashboard"].map(v => (
 <button 
 key={v} 
 onClick={() => setView(v)} 
 className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${view === v ? 'bg-background text-foreground' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}
 >
 {v}
 </button>
 ))}
 </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-md-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button
 onClick={() => setIsEditing(true)}
 className="flex items-center gap-2 bg-indigo-500/10 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors"
 >
 <Plus className="w-5 h-5" />
 Add Affiliate
 </button>
 </div>
 )}
 </div>

 <AnimatePresence>
 {isEditing && (
 <motion.div
 initial={{ opacity: 0, height: 0}}
 animate={{ opacity: 1, height: 'auto'}}
 exit={{ opacity: 0, height: 0}}
 className="bg-card p-6 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mb-8 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <h2 className="text-xl font-semibold mb-4 text-foreground">
 {editingId ? 'Edit Affiliate' : 'New Affiliate Partner'}
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2">
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Affiliate Name</label>
 <input
 type="text"
 className="w-full px-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.affiliate_name}
 onChange={(e) => setFormData({ ...formData, affiliate_name: e.target.value})}
 placeholder="e.g. Tech Blogger Pro"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Tracking Link</label>
 <div className="relative">
 <Link className="absolute left-3 top-2.5 w-5 h-5 text-[#71717a] dark:text-gray-400" />
 <input
 type="text"
 className="w-full pl-10 pr-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.tracking_link}
 onChange={(e) => setFormData({ ...formData, tracking_link: e.target.value})}
 placeholder="?ref=bloggerpro"
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Clicks</label>
 <div className="relative">
 <MousePointerClick className="absolute left-3 top-2.5 w-5 h-5 text-[#71717a] dark:text-gray-400" />
 <input
 type="number"
 className="w-full pl-10 pr-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.click_count}
 onChange={(e) => setFormData({ ...formData, click_count: e.target.value})}
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Conversions</label>
 <input
 type="number"
 className="w-full px-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.conversion_count}
 onChange={(e) => setFormData({ ...formData, conversion_count: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Total Payout ($)</label>
 <div className="relative">
 <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-[#71717a] dark:text-gray-400" />
 <input
 type="number"
 step="0.01"
 className="w-full pl-10 pr-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.payout_amount}
 onChange={(e) => setFormData({ ...formData, payout_amount: e.target.value})}
 />
 </div>
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <button
 onClick={() => {
 setIsEditing(false);
 setEditingId(null);
 setFormData({ affiliate_name: '', tracking_link: '', click_count: '', conversion_count: '', payout_amount: ''});
}}
 className="flex items-center gap-2 px-4 py-2 text-[#71717a] dark:text-gray-400 hover:bg-muted rounded-xl transition-colors"
 >
 <X className="w-4 h-4" /> Cancel
 </button>
 <button
 onClick={handleSave}
 className="flex items-center gap-2 bg-indigo-500/10 text-white px-6 py-2 rounded-xl hover:bg-indigo-600 transition-colors"
 >
 <Save className="w-4 h-4" /> Save
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {loading ? (
 <div className="flex justify-center py-12">
 <div className="animate-spin rounded-md-full h-10 w-10 border-b-2 border-indigo-500"></div>
 </div>
 ) : (
 <div className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted border-b border-primary/40 text-sm font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
 <th className="p-4">Affiliate Partner</th>
 <th className="p-4 text-center">Performance (Clicks / Conv)</th>
 <th className="p-4 text-right">Total Payout</th>
 <th className="p-4 text-center">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {data.map((item) => (
 <tr key={item.id} className="hover:bg-background transition-colors">
 <td className="p-4">
 <div className="font-semibold text-foreground text-base">{item.affiliate_name || 'Unnamed Affiliate'}</div>
 <div className="text-sm text-indigo-500 font-mono flex items-center gap-2 mt-1">
 <Link className="w-3 h-3" /> {item.tracking_link || 'No link setup'}
 </div>
 </td>
 <td className="p-4">
 <div className="flex items-center justify-center gap-4">
 <div className="text-center">
 <span className="block font-semibold text-foreground">{Number(item.click_count).toLocaleString() || 0}</span>
 <span className="text-[10px] text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Clicks</span>
 </div>
 <div className="text-slate-300">|</div>
 <div className="text-center">
 <span className="block font-semibold text-emerald-600">{Number(item.conversion_count).toLocaleString() || 0}</span>
 <span className="text-[10px] text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Conv.</span>
 </div>
 </div>
 </td>
 <td className="p-4 text-right">
 <span className="font-black text-foreground text-lg">
 ${Number(item.payout_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}
 </span>
 </td>
 <td className="p-4 text-center">
 <div className="flex justify-center gap-2">
 <button onClick={() => handleEdit(item)} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-indigo-600 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg hover:bg-indigo-50 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Edit2 className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(item.id)} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-rose-600 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg hover:bg-rose-50 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {data.length === 0 && !isEditing && (
 <div className="py-16 text-center">
 <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
 <p className="text-[#71717a] dark:text-gray-400">No active affiliate programs.</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
