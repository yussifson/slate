import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CalendarDays, Plus, Clock, MapPin, CheckCircle2, AlertCircle, Edit2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivCourtCalendar() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({
    event_title: '', event_type: 'Hearing', event_date: new Date().toISOString().slice(0,16), location: '', status: 'Scheduled'
  });

  useEffect(() => {
    if (companyId) {
      fetchEvents();
      const channel = supabase.channel('court_calendar_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_court_calendar', filter: `company_id=eq.${companyId}` }, () => fetchEvents())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_court_calendar WHERE company_id = ? ORDER BY event_date ASC`, [companyId]);
      setEvents(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (e = null) => {
    if (e) {
      setEditingEvent(e);
      // Ensure date is properly formatted for datetime-local input
      const d = new Date(e.event_date);
      const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
      setForm({ ...e, event_date: iso });
    } else {
      setEditingEvent(null);
      setForm({ event_title: '', event_type: 'Hearing', event_date: new Date().toISOString().slice(0,16), location: '', status: 'Scheduled' });
    }
    setIsModalOpen(true);
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    try {
      // Convert local datetime back to UTC ISO string
      const utcDate = new Date(form.event_date).toISOString();
      const payload = { ...form, event_date: utcDate };

      if (editingEvent) {
        const _keys = Object.keys(payload).filter(k => k !== 'id' && k !== 'company_id' && k !== 'created_at');
        const _set = _keys.map(k => `${k} = ?`).join(', ');
        const _vals = _keys.map(k => payload[k]);
        await powerSync.execute(`UPDATE univ_court_calendar SET ${_set} WHERE id = ?`, [..._vals, editingEvent.id]);
        toast.success('Event updated');
      } else {
        payload.id = crypto.randomUUID();
        payload.company_id = companyId;
        const _keys = Object.keys(payload);
        const _plhdr = _keys.map(()=>'?').join(', ');
        const _vals = Object.values(payload);
        await powerSync.execute(`INSERT INTO univ_court_calendar (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
        toast.success('Event added');
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to save event');
    }
  };

  const deleteEvent = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this calendar event?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_court_calendar WHERE id = ?`, [id]);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const filtered = events.filter(e => 
    `${e.event_title} ${e.event_type} ${e.location}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Court Calendar</h2>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage hearings, trials, depositions, and filing deadlines.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={e.id} 
                onClick={() => openModal(e)}
                className="bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-4 hover:border-primary/40 transition-colors group flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="flex flex-col items-center justify-center bg-muted w-16 h-16 rounded-xl border-[0.5px] border-black/9 dark:border-white/8">
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">{new Date(e.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xl font-black text-foreground leading-none mt-1">{new Date(e.event_date).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-1">{e.event_title}</h3>
                    <div className="flex items-center gap-4 text-sm text-[#71717a] dark:text-gray-400">
                      <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(e.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {e.location || 'TBD'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg ${
                      e.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                      e.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10' : 
                      'bg-muted text-foreground'
                    }`}>
                      {e.status}
                    </span>
                    <span className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider">{e.event_type}</span>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(ev) => deleteEvent(e.id, ev)} className="p-2 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No court calendar events found.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-card w-full max-w-md rounded-2xl flex flex-col shadow-xl border-[0.5px] border-black/9 dark:border-white/8">
              <div className="p-5 border-b border-border/40 flex justify-between items-center">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveEvent} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Title</label>
                  <input required value={form.event_title} onChange={e=>setForm({...form, event_title: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Type</label>
                    <select required value={form.event_type} onChange={e=>setForm({...form, event_type: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Hearing</option>
                      <option>Trial</option>
                      <option>Deposition</option>
                      <option>Deadline</option>
                      <option>Meeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Date & Time</label>
                    <input required type="datetime-local" value={form.event_date} onChange={e=>setForm({...form, event_date: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Location</label>
                    <input value={form.location} onChange={e=>setForm({...form, location: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                    <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Scheduled</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                      <option>Delayed</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Event</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
