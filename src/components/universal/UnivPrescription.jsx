import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Pill, Plus, Activity, Download, CheckCircle2, MoreHorizontal, User, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivPrescription() {
  const companyId = useCompanyId();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchPrescriptions();
      const channel = supabase.channel('rx_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_prescriptions', filter: `company_id=eq.${companyId}` }, () => {
          fetchPrescriptions();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_prescriptions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setPrescriptions(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddRx = async () => {
    const newRx = {
      company_id: companyId,
      patient_id: 'temp-patient-id',
      doctor_id: 'temp-doctor-id',
      medication: 'New Medication',
      dosage: '10mg',
      frequency: 'Daily',
      duration: '30 Days',
      status: 'Active'
    };
    try {
      const { error } = await supabase.from('univ_prescriptions').insert(newRx);
      if (error) throw error;
      toast.success('Prescription created');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to create prescription');
    }
  };

  const filtered = prescriptions.filter(p => 
    `${p.patient_name} ${p.medication} ${p.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Prescriptions</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage e-prescriptions and medication tracking.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddRx} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> New Rx
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search medications, patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Patient / Prescriber</th>
                <th className="p-4 font-semibold">Medication</th>
                <th className="p-4 font-semibold">Sig (Instructions)</th>
                <th className="p-4 font-semibold">Duration</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={p.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {p.patient_name || 'Patient'}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Stethoscope className="w-3 h-3" /> {p.doctor_name || 'Doctor'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-foreground flex items-center gap-2">
                       <Pill className="w-4 h-4 text-purple-500" /> {p.medication}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <span className="font-semibold text-foreground">{p.dosage}</span> — {p.frequency}
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {p.duration}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      p.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {p.status === 'Active' && <Activity className="w-3 h-3" />}
                      {p.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><Download className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
