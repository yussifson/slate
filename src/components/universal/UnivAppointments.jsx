import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, 
 Plus, Search, User, Filter, MoreHorizontal, Video, MapPin, Edit3, Trash2
} from 'lucide-react';

const STATUS_COLORS = {
 Scheduled: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800',
 Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800',
 Cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800',
 'No Show': 'bg-slate-100 text-slate-700 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40'
};

export default function UnivAppointments({
 title = 'Appointments',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'appointments';
 const targetTable = tableName || 'industry_records';

 const [currentDate, setCurrentDate] = useState(new Date());
 const [view, setView] = useState('list'); // list, calendar
 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingApt, setEditingApt] = useState(null);

 const [formState, setFormState] = useState({
 title: '',
 client_name: '',
 staff_name: '',
 date: new Date().toISOString().split('T')[0],
 time: '10:00',
 duration: 60,
 status: 'Scheduled',
 type: 'In-Person',
 notes: ''
});

 const { data: appointments = [], isLoading} = useQuery({
 queryKey: ['appointments', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_appts`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}))
 .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
},
 enabled: !!effectiveCompanyId
});

 const filteredAppointments = useMemo(() => {
 let filtered = appointments;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(a => 
 (a.title || '').toLowerCase().includes(q) || 
 (a.client_name || '').toLowerCase().includes(q) ||
 (a.staff_name || '').toLowerCase().includes(q)
 );
}
 return filtered;
}, [appointments, searchQuery]);

 const saveMutation = useMutation({
 mutationFn: async (aptData) => {
 const isNew = !aptData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_appts`, data: aptData};
} else {
 payload = { ...aptData, company_id: effectiveCompanyId};
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
 const updatePayload = targetTable === 'industry_records' ? { data: aptData} : aptData;
 await (async () => { const _payload = updatePayload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, aptData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['appointments', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Appointment saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['appointments', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Appointment deleted.'});
}
});

 const handleSave = (e) => {
 e.preventDefault();
 if (!formState.client_name || !formState.date || !formState.time) return;
 saveMutation.mutate(formState);
};

 const openNewModal = () => {
 setEditingApt(null);
 setFormState({
 title: 'Consultation',
 client_name: '',
 staff_name: '',
 date: new Date().toISOString().split('T')[0],
 time: '10:00',
 duration: 60,
 status: 'Scheduled',
 type: 'In-Person',
 notes: ''
});
 setIsModalOpen(true);
};

 const openEditModal = (apt) => {
 setEditingApt(apt);
 setFormState({ ...apt});
 setIsModalOpen(true);
};

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-5 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight tracking-[-0.02em]">{title}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage staff schedules and client bookings.</p>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex bg-muted p-1 rounded-xl">
 <button 
 onClick={() => setView('list')}
 className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", view === 'list' ? "bg-background text-foreground " : "text-[#71717a] dark:text-gray-400")}
 >
 List
 </button>
 <button 
 onClick={() => setView('calendar')}
 className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", view === 'calendar' ? "bg-background text-foreground " : "text-[#71717a] dark:text-gray-400")}
 >
 Calendar
 </button>
 </div>
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> New Appointment
 </button>
 </div>
 </div>
 
 {/* Filters bar */}
 {view === 'list' && (
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text" 
 placeholder="Search appointments..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:border-primary "
 />
 </div>
 <button className="h-10 px-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors ">
 <Filter className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> Filter
 </button>
 </div>
 )}
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10">
 
 {view === 'list' && (
 <div className="max-w-6xl mx-auto space-y-4">
 {filteredAppointments.length === 0 ? (
 <div className="text-center py-20 text-[#71717a] dark:text-gray-400">
 <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-semibold text-foreground">No appointments found</h3>
 <p className="text-sm mt-1">Create a new appointment to get started.</p>
 </div>
 ) : (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <table className="w-full text-sm text-left">
 <thead className="bg-muted/50 border-b border-primary/40 text-xs uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4 font-semibold">Client & Service</th>
 <th className="px-6 py-4 font-semibold">Date & Time</th>
 <th className="px-6 py-4 font-semibold">Staff</th>
 <th className="px-6 py-4 font-semibold">Status</th>
 <th className="px-6 py-4 text-right font-semibold">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredAppointments.map(apt => (
 <tr key={apt.id} className="hover:bg-muted/30 transition-colors group">
 <td className="px-6 py-4">
 <div className="font-semibold text-foreground">{apt.client_name}</div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 flex items-center gap-2 tracking-[0.04em]">
 {apt.type === 'Virtual' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
 {apt.title}
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="font-semibold text-foreground">{new Date(apt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 flex items-center gap-2 tracking-[0.04em]">
 <Clock className="w-3 h-3" /> {apt.time} ({apt.duration}m)
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary">
 {apt.staff_name?.charAt(0) || '?'}
 </div>
 <span className="font-medium">{apt.staff_name || 'Unassigned'}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={cn("px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border", STATUS_COLORS[apt.status] || STATUS_COLORS['Scheduled'])}>
 {apt.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(apt)} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-primary rounded-xl hover:bg-primary/10">
 <Edit3 className="w-4 h-4" />
 </button>
 <button onClick={() => { if(window.confirm('Delete appointment?')) deleteMutation.mutate(apt.id);}} className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30">
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
 )}

 {view === 'calendar' && (
 <div className="max-w-6xl mx-auto bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-8 text-center text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
 <h3 className="text-xl font-semibold text-foreground mb-2">Calendar View</h3>
 <p>Full calendar grid implementation goes here. Switch to List view to manage appointments.</p>
 </div>
 )}

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
 className="relative w-full max-w-lg bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="px-6 py-4 border-b border-primary/40 flex items-center justify-between bg-muted/20">
 <h2 className="text-lg font-semibold text-foreground">{editingApt ? 'Edit Appointment' : 'New Appointment'}</h2>
 <button onClick={() => setIsModalOpen(false)} className="text-[#71717a] dark:text-gray-400 hover:text-foreground"><MoreHorizontal className="w-5 h-5" /></button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="apt-form" onSubmit={handleSave} className="space-y-5">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Client Name *</label>
 <input required type="text" value={formState.client_name} onChange={e => setFormState({...formState, client_name: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Service Title</label>
 <input type="text" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Staff Member</label>
 <input type="text" value={formState.staff_name} onChange={e => setFormState({...formState, staff_name: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Date *</label>
 <input required type="date" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Time *</label>
 <input required type="time" value={formState.time} onChange={e => setFormState({...formState, time: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Duration (mins)</label>
 <input type="number" value={formState.duration} onChange={e => setFormState({...formState, duration: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Type</label>
 <select value={formState.type} onChange={e => setFormState({...formState, type: e.target.value})} className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>In-Person</option>
 <option>Virtual</option>
 <option>Phone</option>
 </select>
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label>
 <div className="flex gap-2">
 {Object.keys(STATUS_COLORS).map(s => (
 <button 
 key={s} type="button"
 onClick={() => setFormState({...formState, status: s})}
 className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border", formState.status === s ? STATUS_COLORS[s] : "bg-background text-[#71717a] dark:text-gray-400 border-primary/40")}
 >
 {s}
 </button>
 ))}
 </div>
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Notes</label>
 <textarea value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full h-24 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>
 </div>
 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="apt-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Saving...' : 'Save Appointment'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
