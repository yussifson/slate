import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Video, Calendar, Clock, CheckCircle2, User, Phone, MoreHorizontal, FileText, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivTelemedicine() {
  const companyId = useCompanyId();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchAppointments();
      const channel = supabase.channel('telemed_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_telemedicine', filter: `company_id=eq.${companyId}` }, () => {
          fetchAppointments();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_telemedicine')
        .select('*')
        .eq('company_id', companyId)
        .order('scheduled_time', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setAppointments(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    const newApt = {
      company_id: companyId,
      patient_id: 'temp-patient-id',
      doctor_id: 'temp-doctor-id',
      scheduled_time: new Date(Date.now() + 86400000).toISOString(),
      meeting_link: 'https://meet.slate.com/' + Math.random().toString(36).substring(2, 10),
      status: 'Scheduled'
    };
    try {
      const { error } = await supabase.from('univ_telemedicine').insert(newApt);
      if (error) throw error;
      toast.success('Consultation scheduled');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to schedule');
    }
  };

  const filtered = appointments.filter(a => 
    `${a.patient_name} ${a.doctor_name} ${a.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Telemedicine</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage remote consultations and video meetings.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSchedule} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Schedule Visit
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search patients, doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-4">
           {filtered.map((a, idx) => (
             <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={a.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
             >
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                     a.status === 'Ongoing' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                     a.status === 'Completed' ? 'bg-slate-100 text-slate-500' :
                     'bg-primary/10 text-primary'
                   }`}>
                      <Video className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="font-bold text-foreground text-lg">{a.patient_name || 'Patient'}</h3>
                     <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                       <User className="w-3.5 h-3.5" /> {a.doctor_name || 'Doctor'}
                     </p>
                   </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 justify-end">
                      <Calendar className="w-4 h-4 text-primary" /> {new Date(a.scheduled_time).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 justify-end">
                      <Clock className="w-3.5 h-3.5" /> {new Date(a.scheduled_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  
                  <div className="w-px h-10 bg-border hidden md:block"></div>
                  
                  <div className="flex flex-col items-end gap-2 w-32">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border w-fit ${
                      a.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      a.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {a.status}
                    </span>
                    {a.status !== 'Completed' && a.meeting_link && (
                      <button className="text-xs font-semibold text-primary hover:underline" onClick={() => window.open(a.meeting_link, '_blank')}>
                        Join Call
                      </button>
                    )}
                  </div>
                </div>
             </motion.div>
           ))}

           {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No consultations scheduled.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
