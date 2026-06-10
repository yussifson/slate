import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, CalendarDays, Plus, Clock, MapPin, CheckCircle2, AlertCircle, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivCourtCalendar() {
  const companyId = useCompanyId();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchEvents();
      const channel = supabase.channel('court_calendar_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_court_calendar', filter: `company_id=eq.${companyId}` }, () => {
          fetchEvents();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_court_calendar')
        .select('*')
        .eq('company_id', companyId)
        .order('event_date', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setEvents(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setEvents([
          { id: '1', event_title: 'Pre-Trial Hearing vs. Acme', event_type: 'Hearing', event_date: new Date(Date.now() + 86400000 * 2).toISOString(), location: 'Room 302, District Court', status: 'Scheduled' },
          { id: '2', event_title: 'Motion to Dismiss Deadline', event_type: 'Deadline', event_date: new Date(Date.now() + 86400000 * 5).toISOString(), location: 'Online Portal', status: 'Scheduled' },
          { id: '3', event_title: 'Initial Deposition - Smith', event_type: 'Deposition', event_date: new Date(Date.now() - 86400000).toISOString(), location: 'Law Office Branch A', status: 'Completed' }
        ]);
      }
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
      const { error } = await supabase.from('univ_court_calendar').insert(newEvent);
      if (error) throw error;
      toast.success('Event added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add event');
    }
  };

  const filtered = events.filter(e => 
    `${e.event_title} ${e.event_type} ${e.location}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Court Calendar</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage hearings, trials, depositions, and filing deadlines.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddEvent} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search calendar events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                className="bg-background border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors shadow-sm group flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-5">
                  <div className="flex flex-col items-center justify-center bg-muted w-16 h-16 rounded-xl border border-border">
                     <span className="text-xs font-bold text-primary uppercase tracking-widest">{new Date(e.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                     <span className="text-xl font-black text-foreground leading-none mt-1">{new Date(e.event_date).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-1">{e.event_title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                       <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(e.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                    e.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    e.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {e.status}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{e.event_type}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No court calendar events found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
