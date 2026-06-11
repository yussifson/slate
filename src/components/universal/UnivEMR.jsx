import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, FileText, Calendar, Plus, Stethoscope, Clock, Download, MoreHorizontal, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivEMR() {
  const companyId = useCompanyId();
  const [emrRecords, setEmrRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchEMR();
      const channel = supabase.channel('emr_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_emr', filter: `company_id=eq.${companyId}` }, () => {
          fetchEMR();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchEMR = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_emr')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('visit_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setEmrRecords(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddEncounter = async () => {
    const newRecord = {
      company_id: companyId,
      patient_id: '00000000-0000-0000-0000-000000000000',
      doctor_id: '00000000-0000-0000-0000-000000000000',
      visit_date: new Date().toISOString(),
      diagnosis: 'Routine Checkup',
      symptoms: 'None',
      treatment_plan: 'Continue healthy diet',
      notes: 'temp-patient-id, temp-doctor-id'
    };
    try {
      const { error } = await supabase.from('univ_emr').insert(newRecord);
      if (error) throw error;
      toast.success('Encounter added');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = emrRecords.filter(r => 
    `${r.patient_name} ${r.diagnosis} ${r.doctor_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Electronic Medical Records</h2>
           <p className="text-sm text-muted-foreground mt-1">Clinical encounters, diagnoses, and treatment plans.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddEncounter} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> New Encounter
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search EMR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-4">
           {filtered.map((r, idx) => (
             <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={r.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors shadow-sm group"
             >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                         {r.patient_name || 'Unknown Patient'} 
                         <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                           {new Date(r.visit_date).toLocaleDateString()}
                         </span>
                       </h3>
                       <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                         <Stethoscope className="w-3.5 h-3.5" /> Attending: {r.doctor_name || 'Doctor'}
                       </p>
                     </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors bg-muted rounded-lg"><Download className="w-4 h-4" /></button>
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors bg-muted rounded-lg"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                   <div>
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Diagnosis</p>
                     <p className="text-sm font-semibold text-foreground">{r.diagnosis || '—'}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Symptoms</p>
                     <p className="text-sm text-foreground">{r.symptoms || '—'}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Treatment Plan</p>
                     <p className="text-sm text-foreground">{r.treatment_plan || '—'}</p>
                   </div>
                </div>
             </motion.div>
           ))}

           {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No medical records found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
