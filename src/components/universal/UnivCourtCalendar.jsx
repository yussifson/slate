import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, CalendarDays, Plus, Clock, MapPin, CheckCircle2, AlertCircle, MoreHorizontal} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivCourtCalendar() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [events, setEvents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (companyId) {
 fetchEvents();
 const channel = supabase.channel('court_calendar_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_court_calendar', filter: `company_id=eq.${companyId}`}, () => {
 fetchEvents();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchEvents = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_court_calendar WHERE company_id = ? ORDER BY event_date ASC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setEvents(data || []);
} catch (err) {
 // Mock data removed for production empty states
} finally {
 setLoading(false);
}
};

 const handleAddEvent = async () => {
 const newEvent = {
 company_id: companyId,
 event_title: 'New Court Event',
 event_type: 'Hearing',
 event_date: new Date(Date.now() + 86400000 * 7).toISOString(),
 location: 'TBD',
 status: 'Scheduled'
};
 try {
 const { error} = await (async () => {
 const _payload = newEvent;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_court_calendar (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Event added');
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to save');
}
};

 const filtered = events.filter(e => 
 `${e.event_title} ${e.event_type} ${e.location}`.toLowerCase().includes(searchTerm.toLowerCase())
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
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Court Calendar</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage hearings, trials, depositions, and filing deadlines.</p>
 </div>
 <div className="flex gap-3">
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={handleAddEvent} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> Schedule Event
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
 placeholder="Search calendar events..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar p-6">
 <div className="space-y-4">
 {filtered.map((e, idx) => (
 <motion.div 
 initial={{ opacity: 0, x: -10}}
 animate={{ opacity: 1, x: 0}}
 transition={{ delay: idx * 0.05}}
 key={e.id} 
 className="bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 hover:border-primary/40 transition-colors group flex items-center justify-between gap-4"
 >
 <div className="flex items-center gap-5">
 <div className="flex flex-col items-center justify-center bg-muted w-16 h-16 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <span className="text-xs font-semibold text-primary uppercase tracking-widest tracking-[0.04em]">{new Date(e.event_date).toLocaleDateString('en-US', { month: 'short'})}</span>
 <span className="text-xl font-black text-foreground leading-none mt-1">{new Date(e.event_date).getDate()}</span>
 </div>
 <div>
 <h3 className="font-semibold text-foreground text-lg mb-1">{e.event_title}</h3>
 <div className="flex items-center gap-4 text-sm text-[#71717a] dark:text-gray-400">
 <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(e.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
 <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col items-end gap-2">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border-[0.5px] border-black/9 dark:border-white/8 flex items-center gap-2 w-fit ${
 e.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 e.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
 'bg-background text-foreground border-primary/40'
}`}>
 {e.status}
 </span>
 <span className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{e.event_type}</span>
 </div>
 </motion.div>
 ))}
 </div>

 {filtered.length === 0 && (
 <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
 <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p>No court calendar events found.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
