import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, Sparkles, CheckCircle2, Clock, AlertTriangle, Plus, Brush, MoreHorizontal} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivHousekeeping() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [tasks, setTasks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [form, setForm] = useState({
 room_id: '',
 task_type: 'Routine Cleaning',
 status: 'Pending',
 priority: 'Medium',
 notes: ''
});

 useEffect(() => {
 if (companyId) {
 fetchTasks();
 const channel = supabase.channel('housekeeping_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_housekeeping', filter: `company_id=eq.${companyId}`}, () => {
 fetchTasks();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchTasks = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_housekeeping WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setTasks(data || []);
} catch (err) {
 // Mock data removed for production empty states
} finally {
 setLoading(false);
}
};

 const handleSave = async (e) => {
 e.preventDefault();
 try {
 const payload = { ...form, company_id: companyId};
 if (editingId) {
 const { error} = await (async () => { const _p = payload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_housekeeping SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editingId]); return { error: null};})();
 if (error) throw error;
 toast.success('Task updated');
} else {
 const { error} = await (async () => {
 const _p = { ...payload, id: crypto.randomUUID()};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_housekeeping (${_k.join(', ')}) VALUES (${_pl})`, _v);
 return { error: null};
})();
 if (error) throw error;
 toast.success('Task created');
}
 setIsModalOpen(false);
 setEditingId(null);
 setForm({ room_id: '', task_type: 'Routine Cleaning', status: 'Pending', priority: 'Medium', notes: ''});
 fetchTasks();
} catch (err) {
 toast.error('Failed to save task');
}
};

 const openModal = (t = null) => {
 if (t) {
 setEditingId(t.id);
 setForm({
 room_id: t.room_id || '',
 task_type: t.task_type || 'Routine Cleaning',
 status: t.status || 'Pending',
 priority: t.priority || 'Medium',
 notes: t.notes || ''
});
} else {
 setEditingId(null);
 setForm({ room_id: '', task_type: 'Routine Cleaning', status: 'Pending', priority: 'Medium', notes: ''});
}
 setIsModalOpen(true);
};

 const handleDelete = async (id) => {
 if (!window.confirm('Delete this task?')) return;
 try {
 await powerSync.execute(`DELETE FROM univ_housekeeping WHERE id = ?`, [id]);
 toast.success('Deleted');
 fetchTasks();
} catch(err) { toast.error('Failed to delete');}
};
 const filtered = tasks.filter(t => 
 `${t.room_id} ${t.task_type} ${t.status}`.toLowerCase().includes(searchTerm.toLowerCase())
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
 <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-bold text-foreground tracking-tight">Housekeeping</h2>
 <p className="text-sm text-muted-foreground mt-1">Manage cleaning schedules and maintenance requests.</p>
 </div>
 <div className="flex gap-3">
 <div className="flex items-center gap-2">

 
 <div className="flex bg-muted p-1 rounded-lg border border-primary/40 mr-2 hidden sm:flex">
 {["Default","Grid","Kanban","Dashboard"].map(v => (
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

 <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> Add Task
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 shrink-0">
 <button className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
 <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Sparkles className="w-5 h-5" /></div>
 <div>
 <h3 className="font-bold text-foreground text-lg">{tasks.length}</h3>
 <p className="text-xs text-muted-foreground">Total Tasks</p>
 </div>
 </button>
 <button className="bg-card border border-emerald-200 -emerald-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-left">
 <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
 <div>
 <h3 className="font-bold text-emerald-700 text-lg">{tasks.filter(t => t.status === 'Completed').length}</h3>
 <p className="text-xs text-emerald-600/70">Completed</p>
 </div>
 </button>
 <button className="bg-card border border-orange-200 -orange-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left">
 <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock className="w-5 h-5" /></div>
 <div>
 <h3 className="font-bold text-orange-700 text-lg">{tasks.filter(t => t.status === 'In Progress').length}</h3>
 <p className="text-xs text-orange-600/70">In Progress</p>
 </div>
 </button>
 <button className="bg-card border border-red-200 -red-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-left">
 <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
 <div>
 <h3 className="font-bold text-red-700 text-lg">{tasks.filter(t => t.status === 'Pending').length}</h3>
 <p className="text-xs text-red-600/70">Pending</p>
 </div>
 </button>
 </div>

 <div className="flex-1 bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text"
 placeholder="Search tasks..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
 <tr>
 <th className="p-4 font-semibold">Room</th>
 <th className="p-4 font-semibold">Task Type</th>
 <th className="p-4 font-semibold">Priority</th>
 <th className="p-4 font-semibold">Status</th>
 <th className="p-4 font-semibold">Notes</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((t, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={t.id} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => openModal(t)}
 >
 <td className="p-4 font-bold text-foreground">
 Room {t.notes?.includes('Room: ') ? t.notes.split('Room: ')[1] : (t.room_id?.replace('R-', '') || 'Unknown')}
 </td>
 <td className="p-4 font-semibold text-foreground flex items-center gap-2">
 <Brush className="w-4 h-4 text-primary" /> {t.task_type}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border w-fit ${
 t.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 
 t.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
 'bg-background text-foreground border-primary/40'
}`}>
 {t.priority}
 </span>
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
 t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 t.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
 'bg-background text-foreground border-primary/40'
}`}>
 {t.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
 {t.status === 'In Progress' && <Clock className="w-3 h-3" />}
 {t.status}
 </span>
 </td>
 <td className="p-4 text-muted-foreground text-xs truncate max-w-[200px]">
 {t.notes || '—'}
 </td>
 <td className="p-4 text-right">
 <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} className="bg-background border border-primary/40 rounded-2xl w-full max-w-md overflow-hidden">
 <div className="flex justify-between items-center p-4 border-b border-primary/40 bg-muted/30">
 <h3 className="font-bold text-foreground">{editingId ? 'Edit Task' : 'New Task'}</h3>
 <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><AlertTriangle className="w-5 h-5 hidden"/>Close</button>
 </div>
 <form onSubmit={handleSave} className="p-4 space-y-4">
 <div>
 <label className="block text-xs font-medium text-muted-foreground mb-1">Room ID</label>
 <input required value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value})} className="w-full p-2 bg-background border border-primary/40 rounded-lg text-sm" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-muted-foreground mb-1">Task Type</label>
 <select value={form.task_type} onChange={e => setForm({...form, task_type: e.target.value})} className="w-full p-2 bg-background border border-primary/40 rounded-lg text-sm">
 <option>Routine Cleaning</option>
 <option>Deep Cleaning</option>
 <option>Maintenance Request</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
 <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 bg-background border border-primary/40 rounded-lg text-sm">
 <option>Pending</option>
 <option>In Progress</option>
 <option>Completed</option>
 </select>
 </div>
 </div>
 <div>
 <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
 <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full p-2 bg-background border border-primary/40 rounded-lg text-sm">
 <option>Low</option>
 <option>Medium</option>
 <option>High</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
 <textarea rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2 bg-background border border-primary/40 rounded-lg text-sm" />
 </div>
 <div className="flex justify-between gap-2 pt-4">
 {editingId ? <button type="button" onClick={() => handleDelete(editingId)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl">Delete</button> : <div/>}
 <div className="flex gap-2">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
 <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl">Save Task</button>
 </div>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </div>
 );
}