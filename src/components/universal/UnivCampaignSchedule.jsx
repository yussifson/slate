import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';

import { supabase} from "@/api/supabaseClient";
import { motion, AnimatePresence} from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Calendar, DollarSign, Activity} from 'lucide-react';

export default function UnivCampaignSchedule() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [isEditing, setIsEditing] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [formData, setFormData] = useState({
 campaign_name: '',
 start_date: '',
 end_date: '',
 budget: '',
 status: 'Planned'
});

 useEffect(() => {
 fetchData();
}, []);

 const fetchData = async () => {
 setLoading(true);
 const __res = await powerSync.execute(`SELECT * FROM univ_campaignschedule WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const records = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (!error && records) setData(records);
 setLoading(false);
};

 const handleSave = async () => {
 if (editingId) {
 await (async () => { const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_campaignschedule SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]);})();
 const error = null; const data = [];
} else {
 await (async () => {
 const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_campaignschedule (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
}
 setFormData({ campaign_name: '', start_date: '', end_date: '', budget: '', status: 'Planned'});
 setIsEditing(false);
 setEditingId(null);
 fetchData();
};

 const handleEdit = (item) => {
 setFormData({
 campaign_name: item.campaign_name || '',
 start_date: item.start_date || '',
 end_date: item.end_date || '',
 budget: item.budget || '',
 status: item.status || 'Planned'
});
 setEditingId(item.id);
 setIsEditing(true);
};

 const handleDelete = async (id) => {
 await powerSync.execute(`DELETE FROM univ_campaignschedule WHERE id = ?`, [id]);
 fetchData();
};

 const getStatusColor = (status) => {
 switch (status) {
 case 'Active': return 'bg-green-100 text-green-800';
 case 'Completed': return 'bg-blue-100 text-blue-800';
 case 'Planned': default: return 'bg-yellow-100 text-yellow-800';
}
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
 <Calendar className="text-indigo-600 w-8 h-8" />
 Campaign Schedule
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-2">Plan and track your marketing campaigns.</p>
 </div>
 {!isEditing && (
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-md-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button
 onClick={() => setIsEditing(true)}
 className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
 >
 <Plus className="w-5 h-5" />
 New Campaign
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
 {editingId ? 'Edit Campaign' : 'Create Campaign'}
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2">
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Campaign Name</label>
 <input
 type="text"
 className="w-full px-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.campaign_name}
 onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value})}
 placeholder="e.g. Summer Sale 2024"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Status</label>
 <select
 className="w-full px-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={formData.status}
 onChange={(e) => setFormData({ ...formData, status: e.target.value})}
 >
 <option value="Planned">Planned</option>
 <option value="Active">Active</option>
 <option value="Completed">Completed</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Start Date</label>
 <input
 type="date"
 className="w-full px-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.start_date}
 onChange={(e) => setFormData({ ...formData, start_date: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">End Date</label>
 <input
 type="date"
 className="w-full px-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.end_date}
 onChange={(e) => setFormData({ ...formData, end_date: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Budget ($)</label>
 <div className="relative">
 <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-[#71717a] dark:text-gray-400" />
 <input
 type="number"
 className="w-full pl-10 pr-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 value={formData.budget}
 onChange={(e) => setFormData({ ...formData, budget: e.target.value})}
 placeholder="e.g. 5000"
 />
 </div>
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <button
 onClick={() => {
 setIsEditing(false);
 setEditingId(null);
 setFormData({ campaign_name: '', start_date: '', end_date: '', budget: '', status: 'Planned'});
}}
 className="flex items-center gap-2 px-4 py-2 text-[#71717a] dark:text-gray-400 hover:bg-muted rounded-xl transition-colors"
 >
 <X className="w-4 h-4" /> Cancel
 </button>
 <button
 onClick={handleSave}
 className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
 >
 <Save className="w-4 h-4" /> Save
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {loading ? (
 <div className="flex justify-center py-12">
 <div className="animate-spin rounded-md-full h-10 w-10 border-b-2 border-indigo-600"></div>
 </div>
 ) : (
 <div className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-background border-b border-primary/40 text-sm font-medium text-[#71717a] dark:text-gray-400">
 <th className="p-4">Campaign Info</th>
 <th className="p-4 hidden md:table-cell">Duration</th>
 <th className="p-4">Budget</th>
 <th className="p-4">Status</th>
 <th className="p-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody>
 {data.map((item) => (
 <tr key={item.id} className="border-b border-primary/40 hover:bg-background/50 transition-colors">
 <td className="p-4">
 <div className="font-semibold text-foreground">{item.campaign_name || 'Unnamed Campaign'}</div>
 </td>
 <td className="p-4 hidden md:table-cell text-sm text-[#71717a] dark:text-gray-400">
 {item.start_date} <span className="mx-1 text-[#71717a] dark:text-gray-400">→</span> {item.end_date}
 </td>
 <td className="p-4 font-medium text-foreground">
 ${Number(item.budget).toLocaleString()}
 </td>
 <td className="p-4">
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md-full text-xs font-medium ${getStatusColor(item.status)}`}>
 {item.status}
 </span>
 </td>
 <td className="p-4 text-right">
 <div className="flex justify-end gap-2">
 <button onClick={() => handleEdit(item)} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
 <Edit2 className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(item.id)} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {data.length === 0 && !isEditing && (
 <div className="py-12 text-center">
 <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
 <p className="text-[#71717a] dark:text-gray-400">No campaigns scheduled.</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
