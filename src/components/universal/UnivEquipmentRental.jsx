import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';

import { supabase} from "@/api/supabaseClient";
import { motion} from 'framer-motion';
import { Truck, Plus, Edit2, Trash2, Save, X, RefreshCw} from 'lucide-react';

const UnivEquipmentRental = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [isEditing, setIsEditing] = useState(false);
 const [editId, setEditId] = useState(null);
 const [formData, setFormData] = useState({equipment_name: '', vendor: '', start_date: '', end_date: ''});

 const tableName = 'univ_equipmentrentals';

 useEffect(() => {
 fetchData();
}, []);

 const fetchData = async () => {
 setLoading(true);
 const __res = await powerSync.execute(`SELECT * FROM WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const records = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) {
 console.error('Error fetching data:', error);
} else {
 setData(records || []);
}
 setLoading(false);
};

 const handleInputChange = (e) => {
 const { name, value} = e.target;
 setFormData((prev) => ({ ...prev, [name]: value}));
};

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (editId) {
 await (async () => { const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editId]);})();
 const error = null; const data = [];
 if (error) console.error('Error updating:', error);
} else {
 const { error} = await (async () => {
 const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) console.error('Error inserting:', error);
}
 setFormData({equipment_name: '', vendor: '', start_date: '', end_date: ''});
 setIsEditing(false);
 setEditId(null);
 fetchData();
};

 const handleEdit = (record) => {
 setFormData({equipment_name: record.equipment_name || '', vendor: record.vendor || '', start_date: record.start_date || '', end_date: record.end_date || ''});
 setEditId(record.id);
 setIsEditing(true);
};

 const handleDelete = async (id) => {
 await powerSync.execute(`DELETE FROM WHERE id = ?`, [id]);
 const error = null;
 if (error) console.error('Error deleting:', error);
 else fetchData();
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
 <div className="p-6 max-w-6xl mx-auto bg-background min-h-screen font-sans ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div 
 initial={{ opacity: 0, y: -20}}
 animate={{ opacity: 1, y: 0}}
 className="flex items-center justify-between mb-8 bg-card p-6 rounded-2xl border border-primary/40"
 >
 <div className="view-header flex items-center gap-4">
 <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
 <Truck size={28} />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-foreground">Equipment Rental</h1>
 <p className="text-muted-foreground text-sm mt-1">Manage and track equipment rental records</p>
 </div>
 </div>
 <div className="flex items-center gap-2">

 
 <div className="flex bg-muted p-1 rounded-lg border border-primary/40 mr-2 hidden sm:flex">
 {["Default","Grid","Calendar","Dashboard"].map(v => (
 <button 
 key={v} 
 onClick={() => setView(v)} 
 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
 >
 {v}
 </button>
 ))}
 </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button
 onClick={() => { setIsEditing(true); setEditId(null); setFormData({equipment_name: '', vendor: '', start_date: '', end_date: ''});}}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors "
 >
 <Plus size={18} />
 <span>New Record</span>
 </button>
 </div>
 </motion.div>

 {isEditing && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 className="mb-8 bg-card p-6 rounded-2xl border border-primary/40"
 >
 <h2 className="text-lg font-semibold text-foreground mb-4">
 {editId ? 'Edit Record' : 'Create New Record'}
 </h2>
 <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
 
 <div className="flex flex-col gap-1">
 <label className="text-sm font-medium text-muted-foreground">Equipment Name</label>
 <input
 type="text"
 name="equipment_name"
 value={formData.equipment_name}
 onChange={handleInputChange}
 className="p-2.5 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 placeholder="Enter equipment name"
 required
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-sm font-medium text-muted-foreground">Vendor</label>
 <input
 type="text"
 name="vendor"
 value={formData.vendor}
 onChange={handleInputChange}
 className="p-2.5 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 placeholder="Enter vendor"
 required
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-sm font-medium text-muted-foreground">Start Date</label>
 <input
 type="date"
 name="start_date"
 value={formData.start_date}
 onChange={handleInputChange}
 className="p-2.5 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 placeholder="Enter start date"
 required
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-sm font-medium text-muted-foreground">End Date</label>
 <input
 type="date"
 name="end_date"
 value={formData.end_date}
 onChange={handleInputChange}
 className="p-2.5 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 placeholder="Enter end date"
 required
 />
 </div>
 <div className="col-span-full flex justify-end gap-3 mt-4">
 <button
 type="button"
 onClick={() => { setIsEditing(false); setEditId(null); setFormData({equipment_name: '', vendor: '', start_date: '', end_date: ''});}}
 className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
 >
 <X size={18} /> Cancel
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 "
 >
 <Save size={18} /> Save Record
 </button>
 </div>
 </form>
 </motion.div>
 )}

 <div className="bg-card rounded-2xl border border-primary/40 overflow-hidden">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-background/50">
 <h3 className="font-semibold text-foreground">Recent Records</h3>
 <button onClick={fetchData} className="text-muted-foreground hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
 <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
 </button>
 </div>
 
 {loading ? (
 <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
 <RefreshCw size={32} className="animate-spin mb-3 text-blue-500" />
 <p>Loading data...</p>
 </div>
 ) : data.length === 0 ? (
 <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
 <Truck size={48} className="mb-4 text-slate-300 stroke-[1.5]" />
 <p className="text-lg">No records found</p>
 <p className="text-sm mt-1">Click 'New Record' to get started</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-background text-muted-foreground text-sm uppercase tracking-wider">
 <th className="p-4 font-medium">Equipment Name</th><th className="p-4 font-medium">Vendor</th><th className="p-4 font-medium">Start Date</th><th className="p-4 font-medium">End Date</th>
 <th className="p-4 font-medium rounded-tr-xl">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {data.map((record) => (
 <motion.tr 
 initial={{ opacity: 0}}
 animate={{ opacity: 1}}
 key={record.id} 
 className="hover:bg-background/80 transition-colors group"
 >
 
 <td className="p-4 text-foreground">{record.equipment_name}</td>
 <td className="p-4 text-foreground">{record.vendor}</td>
 <td className="p-4 text-foreground">{record.start_date}</td>
 <td className="p-4 text-foreground">{record.end_date}</td>
 <td className="p-4">
 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={() => handleEdit(record)}
 className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
 title="Edit"
 >
 <Edit2 size={16} />
 </button>
 <button
 onClick={() => handleDelete(record.id)}
 className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
 title="Delete"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
};

export default UnivEquipmentRental;
