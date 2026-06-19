import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, MonitorSpeaker, Plus, Activity, AlertTriangle, Settings, MoreHorizontal, Edit2, Trash2, XCircle, Loader2} from 'lucide-react';
import { toast} from 'react-hot-toast';

const EMPTY_FORM = { machine_name: '', serial_number: '', location: '', status: 'Operational', last_maintenance: '', next_maintenance: ''};
const STATUS_COLORS = {
 Operational: 'bg-emerald-50 text-emerald-700 border-emerald-200',
 Maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
 Offline: 'bg-red-50 text-red-700 border-red-200'
};

export default function UnivMachine() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [machines, setMachines] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [form, setForm] = useState(EMPTY_FORM);

 useEffect(() => {
 if (companyId) {
 fetchMachines();
 const channel = supabase.channel('machines_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_machines', filter: `company_id=eq.${companyId}`}, () => {
 fetchMachines();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchMachines = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_machines WHERE company_id = ? ORDER BY machine_name ASC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setMachines(data || []);
} catch (err) {
 console.error(err);
} finally {
 setLoading(false);
}
};

 const handleSave = async (e) => {
 e.preventDefault();
 try {
 const payload = {
 company_id: companyId,
 machine_name: form.machine_name,
 serial_number: form.serial_number || null,
 location: form.location || null,
 status: form.status,
 last_maintenance: form.last_maintenance || null,
 next_maintenance: form.next_maintenance || null
};

 if (editingId) {
 await (async () => { const _payload = payload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_machines SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]);})();
 const error = null; const data = [];
 if (error) throw error;
 toast.success('Machine updated');
} else {
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_machines (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Machine added');
}
 closeModal();
 fetchMachines();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to save machine');
}
};

 const handleDelete = async (id) => {
 try {
 await powerSync.execute(`DELETE FROM univ_machines WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
 toast.success('Machine deleted');
 fetchMachines();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to delete machine');
}
};

 const openModal = (machine = null) => {
 setForm(machine ? { ...machine} : EMPTY_FORM);
 setEditingId(machine?.id || null);
 setIsModalOpen(true);
};

 const closeModal = () => {
 setIsModalOpen(false);
 setEditingId(null);
 setForm(EMPTY_FORM);
};

 const filtered = machines.filter(m => 
 `${m.machine_name} ${m.serial_number} ${m.status} ${m.location}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 
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
 <div className="flex flex-col h-full bg-background overflow-hidden p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Machine Maintenance</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Track equipment status, serial numbers, and maintenance schedules.</p>
 </div>
 <div className="flex gap-3">
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> Add Machine
 </button>
 </div>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search machines..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar p-6">
 {loading ? (
 <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filtered.map((m, idx) => (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 transition={{ delay: idx * 0.05}}
 key={m.id} 
 className="bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-5 hover:border-primary/40 transition-colors flex flex-col h-full group"
 >
 <div className="flex justify-between items-start mb-4 border-b border-primary/40 pb-4">
 <div>
 <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
 <MonitorSpeaker className="w-5 h-5 text-primary" /> <span className="line-clamp-1">{m.machine_name}</span>
 </h3>
 {m.serial_number && (
 <code className="text-xs font-mono font-semibold bg-muted px-1.5 py-0.5 rounded-md border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mt-2 inline-block tracking-[0.04em]">
 {m.serial_number}
 </code>
 )}
 </div>
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border-[0.5px] border-black/9 dark:border-white/8 flex items-center gap-2 ${
 m.status === 'Operational' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 m.status === 'Maintenance' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
 'bg-red-50 text-red-700 border-red-200'
}`}>
 {m.status === 'Operational' && <Activity className="w-3 h-3" />}
 {m.status === 'Maintenance' && <Settings className="w-3 h-3" />}
 {m.status === 'Offline' && <AlertTriangle className="w-3 h-3" />}
 {m.status}
 </span>
 </div>

 <div className="space-y-3 mb-4 flex-1">
 <div className="flex justify-between text-sm">
 <span className="text-[#71717a] dark:text-gray-400">Location</span>
 <span className="font-medium text-foreground">{m.location || '—'}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-[#71717a] dark:text-gray-400">Last Maint.</span>
 <span className="font-medium text-foreground">{m.last_maintenance || '—'}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-[#71717a] dark:text-gray-400">Next Maint.</span>
 <span className="font-semibold text-orange-600 dark:text-orange-500">{m.next_maintenance || '—'}</span>
 </div>
 </div>

 <div className="pt-4 border-t border-primary/40 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openModal(m)} className="p-1.5 bg-muted rounded-lg text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors">
 <Edit2 className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(m.id)} className="p-1.5 bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </motion.div>
 ))}
 </div>
 )}

 {!loading && filtered.length === 0 && (
 <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
 <MonitorSpeaker className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p>No machines found.</p>
 </div>
 )}
 </div>
 </div>

 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
 <div className="bg-card w-full max-w-lg rounded-2xl flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 flex justify-between items-center shrink-0">
 <h2 className="text-xl font-semibold">{editingId ? 'Edit Machine' : 'Add Machine'}</h2>
 <button onClick={closeModal} className="p-2 bg-muted rounded-full text-[#71717a] dark:text-gray-400"><XCircle className="w-5 h-5" /></button>
 </div>
 <form onSubmit={handleSave} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Machine Name *</label>
 <input required type="text" value={form.machine_name} onChange={e => setForm({...form, machine_name: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Serial Number</label>
 <input type="text" value={form.serial_number || ''} onChange={e => setForm({...form, serial_number: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Location</label>
 <input type="text" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label>
 <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
 {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Last Maintenance Date</label>
 <input type="date" value={form.last_maintenance || ''} onChange={e => setForm({...form, last_maintenance: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Next Maintenance Date</label>
 <input type="date" value={form.next_maintenance || ''} onChange={e => setForm({...form, next_maintenance: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-primary/40">
 <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
 <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold ">{editingId ? 'Update' : 'Add'}</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
