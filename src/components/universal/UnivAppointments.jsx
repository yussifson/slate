import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivAppointments() {
  const companyId = useCompanyId();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchAppointments();
      const channel = supabase.channel('appt_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_appointments', filter: `company_id=eq.${companyId}` }, () => {
          fetchAppointments();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_appointments')
        .select('*')
        .eq('company_id', companyId)
        .order('start_time', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setAppointments(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        // Fallback mockup data
        const today = new Date();
        setAppointments([
          { id: '1', title: 'Consultation', attendee_name: 'Sarah Connor', start_time: new Date(today.setHours(10, 0, 0)).toISOString(), end_time: new Date(today.setHours(11, 0, 0)).toISOString(), status: 'Scheduled', location: 'Zoom Room' },
          { id: '2', title: 'Follow-up', attendee_name: 'Kyle Reese', start_time: new Date(today.setHours(14, 30, 0)).toISOString(), end_time: new Date(today.setHours(15, 0, 0)).toISOString(), status: 'Completed', location: 'Office 4B' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async () => {
    const today = new Date();
    const newAppt = {
      company_id: companyId,
      title: 'New Appointment',
      attendee_name: 'Client Name',
      start_time: new Date(today.setHours(12, 0, 0)).toISOString(),
      end_time: new Date(today.setHours(13, 0, 0)).toISOString(),
      status: 'Scheduled'
    };
    try {
      const { error } = await supabase.from('univ_appointments').insert(newAppt);
      if (error) throw error;
      toast.success('Appointment created');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to create appointment');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden border border-border shadow-sm">
      {/* Calendar Header */}
      <div className="p-5 border-b border-border bg-card flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Schedule</h2>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button className="p-1.5 hover:bg-background rounded-md text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-semibold px-3">Today</span>
            <button className="p-1.5 hover:bg-background rounded-md text-slate-500 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button onClick={handleAddAppointment} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Book Slot
          </button>
        </div>
      </div>

      {/* Calendar View (List style for generic component) */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
        <div className="max-w-4xl mx-auto space-y-4">
          {appointments.map((appt) => {
            const startDate = new Date(appt.start_time);
            const endDate = new Date(appt.end_time);
            const isPast = endDate < new Date();
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={appt.id} 
                className={`bg-card border rounded-2xl p-5 flex items-center justify-between transition-shadow hover:shadow-md ${isPast ? 'border-border/50 opacity-70' : 'border-primary/20 shadow-sm'}`}
              >
                <div className="flex gap-5 items-center">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-muted/50 border border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{startDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-xl font-black text-foreground">{startDate.getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                      {appt.title} 
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-md font-bold ${appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {appt.status}
                      </span>
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {appt.attendee_name}</div>
                      {appt.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {appt.location}</div>}
                    </div>
                  </div>
                </div>
                <div>
                  <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {appointments.length === 0 && (
            <div className="text-center p-12 bg-card border border-border border-dashed rounded-2xl">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700">No appointments found</h3>
              <p className="text-slate-500 mt-1 text-sm">Your schedule is clear.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
