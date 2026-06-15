import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 CalendarDays, Plus, Search, Filter, MapPin, 
 Users, CheckCircle2, Video, Edit3, Trash2,
 CalendarClock, Globe
} from 'lucide-react';

export default function UnivEventManagement({
 title = 'Event Management',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'events';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingEvent, setEditingEvent] = useState(null);

 const [formState, setFormState] = useState({
 title: '',
 type: 'Internal', // Internal, External, Webinar, Conference
 status: 'Upcoming', // Upcoming, Ongoing, Completed, Cancelled
 date: '',
 time: '',
 location: '',
 attendees: 0,
 max_attendees: 100,
 description: ''
});

 const { data: events = [], isLoading} = useQuery({
 queryKey: ['events', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_events`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const filteredEvents = useMemo(() => {
 let filtered = events;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(e => 
 (e.title || '').toLowerCase().includes(q) || 
 (e.type || '').toLowerCase().includes(q) ||
 (e.location || '').toLowerCase().includes(q)
 );
}
 return filtered.sort((a, b) => new Date(a.date || '9999-12-31') - new Date(b.date || '9999-12-31'));
}, [events, searchQuery]);

 const saveMutation = useMutation({
 mutationFn: async (eventData) => {
 const isNew = !eventData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_events`, data: eventData};
} else {
 payload = { ...eventData, company_id: effectiveCompanyId};
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
 const updatePayload = targetTable === 'industry_records' ? { data: eventData} : eventData;
 await (async () => { const _payload = updatePayload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, eventData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['events', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Event saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['events', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Event deleted.'});
}
});

 const handleSave = (e) => {
 e.preventDefault();
 if (!formState.title) return;
 saveMutation.mutate(formState);
};

 const openNewModal = () => {
 setEditingEvent(null);
 setFormState({
 title: '',
 type: 'Internal',
 status: 'Upcoming',
 date: new Date().toISOString().split('T')[0],
 time: '12:00',
 location: 'Main Conference Room',
 attendees: 0,
 max_attendees: 50,
 description: ''
});
 setIsModalOpen(true);
};

 const openEditModal = (event) => {
 setEditingEvent(event);
 setFormState({ ...event});
 setIsModalOpen(true);
};

 const getStatusStyle = (status) => {
 if (status === 'Upcoming') return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800';
 if (status === 'Ongoing') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800';
 if (status === 'Completed') return 'bg-slate-100 text-slate-700 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40';
 if (status === 'Cancelled') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800';
 return 'bg-muted text-muted-foreground';
};

 const getTypeIcon = (type) => {
 if (type === 'Webinar') return <Video className="w-4 h-4" />;
 if (type === 'External' || type === 'Conference') return <Globe className="w-4 h-4" />;
 return <Users className="w-4 h-4" />;
};

 // Stats
 const upcomingCount = events.filter(e => e.status === 'Upcoming').length;
 const totalAttendees = events.reduce((acc, e) => acc + (Number(e.attendees) || 0), 0);

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
 <CalendarDays className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Plan and manage internal events, webinars, and conferences.</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Create Event
 </button>
 </div>
 </div>

 {/* Global Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
 <div className="bg-card border border-primary/40 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
 <CalendarDays className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Events</div>
 <div className="text-xl font-bold text-foreground">{events.length}</div>
 </div>
 </div>
 <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
 <CalendarClock className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Upcoming</div>
 <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{upcomingCount}</div>
 </div>
 </div>
 <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Attendees</div>
 <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{totalAttendees}</div>
 </div>
 </div>
 </div>
 
 {/* Toolbar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search events or locations..."
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
 {filteredEvents.length === 0 ? (
 <div className="text-center py-20 text-muted-foreground">
 <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-bold text-foreground">No events scheduled</h3>
 <p className="text-sm mt-1">Plan your first company event or webinar.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredEvents.map(event => {
 const isFull = event.attendees >= event.max_attendees && event.max_attendees > 0;

 return (
 <div key={event.id} className="bg-card border border-primary/40 rounded-2xl p-6 transition- group relative flex flex-col">
 <div className="flex justify-between items-start mb-4">
 <div>
 <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border mb-2 inline-block", getStatusStyle(event.status))}>
 {event.status}
 </span>
 <h3 className="text-lg font-bold text-foreground line-clamp-1">{event.title}</h3>
 <div className="text-xs font-semibold text-muted-foreground mt-1 flex items-center gap-1.5">
 {getTypeIcon(event.type)} {event.type}
 </div>
 </div>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(event)} className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>
 <button onClick={() => { if(window.confirm('Delete event?')) deleteMutation.mutate(event.id);}} className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>

 <div className="space-y-3 flex-1 mb-6">
 <div className="flex items-center gap-3 text-sm text-foreground">
 <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0" />
 <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
 </div>
 <div className="flex items-center gap-3 text-sm text-foreground">
 <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
 <span className="truncate">{event.location}</span>
 </div>
 </div>

 <div className="pt-4 border-t border-primary/40">
 <div className="flex justify-between items-end mb-2">
 <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Attendance</span>
 <span className={cn("text-sm font-bold", isFull ? "text-red-500" : "text-foreground")}>
 {event.attendees} / {event.max_attendees}
 </span>
 </div>
 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
 <div className={cn("h-full transition-all", isFull ? "bg-red-500" : "bg-primary")} style={{ width: `${Math.min((event.attendees / (event.max_attendees || 1)) * 100, 100)}%`}}></div>
 </div>
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
 <CalendarDays className="w-5 h-5 text-primary" />
 {editingEvent ? 'Edit Event' : 'New Event'}
 </h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="event-form" onSubmit={handleSave} className="space-y-6">
 
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Event Title *</label>
 <input required type="text" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Type</label>
 <select value={formState.type} onChange={e => setFormState({...formState, type: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Internal</option>
 <option>External</option>
 <option>Webinar</option>
 <option>Conference</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Status</label>
 <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Upcoming</option>
 <option>Ongoing</option>
 <option>Completed</option>
 <option>Cancelled</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Date</label>
 <input type="date" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Time</label>
 <input type="time" value={formState.time} onChange={e => setFormState({...formState, time: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Location / Link</label>
 <input type="text" value={formState.location} onChange={e => setFormState({...formState, location: e.target.value})} placeholder="Room name or Zoom link" className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Current Attendees</label>
 <input type="number" min="0" value={formState.attendees} onChange={e => setFormState({...formState, attendees: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Max Capacity</label>
 <input type="number" min="1" value={formState.max_attendees} onChange={e => setFormState({...formState, max_attendees: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Description</label>
 <textarea value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full h-24 p-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>

 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="event-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Saving...' : 'Save Event'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
