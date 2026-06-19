import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import {Briefcase, Plus, Search, Trash2, Edit2, XCircle, Calendar, User, CheckCircle2, Clock, AlertCircle} from "lucide-react";
import { toast} from 'react-hot-toast';
import { OrbitLoader } from "@/components/ui/orbit-loader";

const EMPTY_FORM = { name: '', description: '', client_name: '', status: 'Active', priority: 'Medium', start_date: '', due_date: '', budget: '', assigned_to: '', progress: 0};
const STATUS_COLORS = { Active: 'bg-blue-50 text-blue-700 border-blue-200', Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200', 'On Hold': 'bg-amber-50 text-amber-700 border-amber-200', Cancelled: 'bg-red-50 text-red-700 border-red-200', Planning: 'bg-violet-50 text-violet-700 border-violet-200'};
const PRIORITY_COLORS = { Low: 'bg-muted text-[#71717a] dark:text-gray-400', Medium: 'bg-amber-50 text-amber-700', High: 'bg-orange-50 text-orange-700', Urgent: 'bg-red-50 text-red-700'};

export default function UnivProject() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [records, setRecords] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('All');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [selected, setSelected] = useState(null);
 const [form, setForm] = useState(EMPTY_FORM);

 useEffect(() => {
 if (companyId) {
 fetch();
 const ch = supabase.channel('projects_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_projects', filter: `company_id=eq.${companyId}`}, fetch).subscribe();
 return () => supabase.removeChannel(ch);
}
}, [companyId]);

 const fetch = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_projects WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setRecords(data || []);
} catch (e) { console.error(e);} finally { setLoading(false);}
};

 const save = async (e) => {
 e.preventDefault();
 try {
 if (editingId) {
 await (async () => { const _payload = form; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_projects SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]);})();
 const error = null; const data = [];
 if (error) throw error;
 toast.success('Project updated!');
} else {
 const { error} = await (async () => {
 const _payload = { ...form, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_projects (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Project created!');
}
 closeModal(); fetch();
} catch (err) { toast.error('Failed to save');}
};

 const remove = async (id) => {
 await powerSync.execute(`DELETE FROM univ_projects WHERE id = ?`, [id]);
 const error = null;
 if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetch(); setSelected(null);}
};

 const openModal = (r = null) => { setForm(r ? { ...r} : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true);};
 const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM);};
 const filtered = records.filter(r => {
 const m = `${r.name} ${r.client_name} ${r.description}`.toLowerCase().includes(search.toLowerCase());
 return m && (statusFilter === 'All' || r.status === statusFilter);
});

 
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
 <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
 <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2 tracking-[-0.02em]"><Briefcase className="w-7 h-7 text-primary" />Projects</h1><p className="text-[#71717a] dark:text-gray-400 text-sm font-medium mt-1">{records.length} projects • {records.filter(r=>r.status==='Active').length} active</p></div>
 <div className="flex items-center gap-2">

 
 <div className="flex bg-muted p-1 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mr-2 hidden sm:flex">
 {["Default","Timeline","Kanban"].map(v => (
 <button 
 key={v} 
 onClick={() => setView(v)} 
 className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${view === v ? 'bg-background text-foreground' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}
 >
 {v}
 </button>
 ))}
 </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 "><Plus className="w-4 h-4" />New Project</button>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
 {Object.keys(STATUS_COLORS).map(s => <div key={s} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-2xl  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{s}</p><p className="text-2xl font-black text-foreground tracking-[-0.02em]">{records.filter(r=>r.status===s).length}</p></div>)}
 </div>

 <div className="flex flex-col sm:flex-row gap-3 shrink-0">
 <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full h-11 pl-10 pr-4 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" /></div>
 <div className="flex gap-2 shrink-0">
 {['All',...Object.keys(STATUS_COLORS)].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-semibold border-[0.5px] border-black/9 dark:border-white/8 transition-all whitespace-nowrap ${statusFilter===s?'bg-primary text-white border-primary':'bg-card border-primary/40 text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}>{s}</button>)}
 </div>
 </div>

 <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
 {loading ? <div className="flex h-40 items-center justify-center"><OrbitLoader size="md" /></div>
 : view === 'Timeline' ? (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-6 overflow-x-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="font-semibold text-lg mb-4">Project Gantt Timeline</h3>
 <div className="min-w-[800px]">
 {filtered.map((r, i) => {
 const sDate = r.start_date ? new Date(r.start_date).getTime() : Date.now();
 const dDate = r.due_date ? new Date(r.due_date).getTime() : sDate + 86400000 * 7;
 const duration = Math.max(1, (dDate - sDate) / (86400000));
 // Simple mock scale: 1 day = 10px
 const width = Math.max(100, duration * 10);
 const progress = r.progress || Math.floor(Math.random() * 100);
 
 return (
 <div key={r.id} className="flex items-center gap-4 mb-4" onClick={() => setSelected(r)}>
 <div className="w-48 shrink-0 font-medium text-sm truncate">{r.name}</div>
 <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden group cursor-pointer hover:bg-muted/80">
 <div className={`absolute top-0 bottom-0 left-0 rounded-full flex items-center px-3 text-xs font-semibold text-white transition-all ${r.status === 'Completed' ? 'bg-emerald-500/10' : 'bg-primary'}`} style={{ width: `${Math.min(100, Math.max(10, width/10))}%`, left: `${(i%5)*5}%`}}>
 <div className="absolute left-0 top-0 bottom-0 bg-primary/20" style={{ width: `${progress}%`}}></div>
 <span className="relative z-10">{progress}%</span>
 </div>
 </div>
 </div>
 );
})}
 {filtered.length === 0 && <div className="py-10 text-center text-[#71717a] dark:text-gray-400">No timeline data available.</div>}
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
 {filtered.map(r => {
 const progress = r.progress || Math.floor(Math.random() * 100);
 return (
 <div key={r.id} onClick={() => setSelected(r)} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-5 transition-all group cursor-pointer flex flex-col gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-start">
 <h3 className="font-semibold text-base text-foreground leading-tight">{r.name}</h3>
 <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase border-[0.5px] border-black/9 dark:border-white/8 rounded-lg shrink-0 ml-2 ${STATUS_COLORS[r.status]}`}>{r.status}</span>
 </div>
 {r.description && <p className="text-sm text-[#71717a] dark:text-gray-400 line-clamp-2">{r.description}</p>}
 
 {/* Progress Bar */}
 <div className="mt-1">
 <div className="flex justify-between text-[10px] font-semibold text-[#71717a] dark:text-gray-400 mb-1 uppercase tracking-wider tracking-[0.04em]">
 <span>Progress</span><span>{progress}%</span>
 </div>
 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
 <div className={`h-full ${progress === 100 ? 'bg-emerald-500/10' : 'bg-primary'}`} style={{ width: `${progress}%`}}></div>
 </div>
 </div>

 <div className="flex flex-wrap gap-2 text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">
 {r.client_name && <span className="flex items-center gap-2"><User className="w-3 h-3 text-primary" />{r.client_name}</span>}
 {r.due_date && <span className="flex items-center gap-2"><Calendar className="w-3 h-3 text-primary" />Due {r.due_date}</span>}
 {r.assigned_to && <span className="flex items-center gap-2"><User className="w-3 h-3 text-primary" />{r.assigned_to}</span>}
 </div>
 {r.priority && <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg w-fit ${PRIORITY_COLORS[r.priority]}`}>{r.priority} Priority</span>}
 <div className="flex justify-end gap-2 pt-3 border-t border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={e=>{e.stopPropagation();openModal(r);}} className="p-1.5 bg-muted rounded-lg text-[#71717a] dark:text-gray-400 hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
 <button onClick={e=>{e.stopPropagation();remove(r.id);}} className="p-1.5 bg-red-50 rounded-lg text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 </div>
 )})}
 {filtered.length === 0 && <div className="col-span-full py-20 text-center text-[#71717a] dark:text-gray-400 border-2 border-dashed border-primary/40 rounded-2xl"><Briefcase className="w-12 h-12 mx-auto text-[#71717a] dark:text-gray-400/30 mb-3" /><p className="font-medium">No projects found.</p></div>}
 </div>
 )}
 </div>

 {selected && (
 <div className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm" onClick={() => setSelected(null)}>
 <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-primary/40 flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" onClick={e => e.stopPropagation()}>
 <div className="p-5 border-b border-primary/40 flex justify-between items-center"><h3 className="font-black text-lg">Project Details</h3><button onClick={() => setSelected(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-[#71717a] dark:text-gray-400" /></button></div>
 <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-3">
 <h2 className="font-black text-xl text-foreground">{selected.name}</h2>
 <span className={`px-3 py-1 text-[11px] font-semibold uppercase border-[0.5px] border-black/9 dark:border-white/8 rounded-full inline-block ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
 {selected.description && <p className="text-sm text-[#71717a] dark:text-gray-400">{selected.description}</p>}
 {[{label:'Client',value:selected.client_name},{label:'Assigned To',value:selected.assigned_to},{label:'Start Date',value:selected.start_date},{label:'Due Date',value:selected.due_date},{label:'Budget',value:selected.budget?`$${Number(selected.budget).toLocaleString()}`:null},{label:'Priority',value:selected.priority}].map((f,i)=>f.value?(<div key={i} className="p-3 bg-muted/40 rounded-xl"><p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{f.label}</p><p className="text-sm font-medium">{f.value}</p></div>):null)}
 </div>
 <div className="p-5 border-t border-primary/40 flex gap-2">
 <button onClick={()=>{openModal(selected);setSelected(null);}} className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Edit2 className="w-3.5 h-3.5"/>Edit</button>
 <button onClick={()=>remove(selected.id)} className="flex-1 h-9 bg-red-50 text-red-600 border-[0.5px] border-black/9 dark:border-white/8 border-red-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5"/>Delete</button>
 </div>
 </div>
 </div>
 )}

 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
 <div className="bg-card w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Project':'New Project'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-[#71717a] dark:text-gray-400"><XCircle className="w-5 h-5" /></button></div>
 <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2"><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Project Name *</label><input required type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Client</label><input type="text" value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Assigned To</label><input type="text" value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(PRIORITY_COLORS).map(p=><option key={p}>{p}</option>)}</select></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Start Date</label><input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Budget ($)</label><input type="number" min="0" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Progress (%)</label><input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div className="col-span-2"><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Description</label><textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full p-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none"/></div>
 </div>
 <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-primary/40"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold ">{editingId?'Update':'Create Project'}</button></div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
