import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pill, Plus, Activity, Download, CheckCircle2, MoreHorizontal, User, Stethoscope, Edit2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  patient_id: '',
  doctor_id: '',
  medication: '',
  dosage: '',
  frequency: '',
  duration: '',
  status: 'Active',
  new_patient_first: '',
  new_patient_last: ''
};

export default function UnivPrescription() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [useExistingPatient, setUseExistingPatient] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchPrescriptions();
      fetchPatients();
      const rxChannel = supabase.channel('rx_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_prescriptions', filter: `company_id=eq.${companyId}` }, () => {
          fetchPrescriptions();
        }).subscribe();
      const patientChannel = supabase.channel('pt_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_patients', filter: `company_id=eq.${companyId}` }, () => {
          fetchPatients();
        }).subscribe();
      return () => {
        supabase.removeChannel(rxChannel);
        supabase.removeChannel(patientChannel);
      };
    }
  }, [companyId]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('univ_patients')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('first_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_prescriptions')
        .select(`
          *,
          patient:univ_patients(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setPrescriptions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rx = null) => {
    if (rx) {
      setEditingId(rx.id);
      setForm({
        patient_id: rx.patient_id || '',
        doctor_id: rx.doctor_id || '',
        medication: rx.medication || '',
        dosage: rx.dosage || '',
        frequency: rx.frequency || '',
        duration: rx.duration || '',
        status: rx.status || 'Active',
        new_patient_first: '',
        new_patient_last: ''
      });
      setUseExistingPatient(true);
    } else {
      setEditingId(null);
      setForm({
        ...EMPTY_FORM,
        patient_id: patients[0]?.id || ''
      });
      setUseExistingPatient(patients.length > 0);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let finalPatientId = form.patient_id;

      // Create new patient first if toggled
      if (!useExistingPatient) {
        if (!form.new_patient_first.trim() || !form.new_patient_last.trim()) {
          toast.error('Patient first name and last name are required');
          return;
        }
        const { data: newPt, error: ptError } = await supabase
          .from('univ_patients')
          .insert({
            company_id: companyId,
            first_name: form.new_patient_first.trim(),
            last_name: form.new_patient_last.trim(),
            patient_number: `P-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'Active'
          })
          .select('id')
          .single();

        if (ptError) throw ptError;
        finalPatientId = newPt.id;
      }

      if (!finalPatientId) {
        toast.error('A patient must be selected or created');
        return;
      }

      const payload = {
        company_id: companyId,
        patient_id: finalPatientId,
        doctor_id: form.doctor_id || '00000000-0000-0000-0000-000000000000',
        medication: form.medication.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency.trim(),
        duration: form.duration.trim(),
        status: form.status
      };

      if (editingId) {
        const { error } = await supabase
          .from('univ_prescriptions')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Prescription updated');
      } else {
        const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_prescriptions (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
        if (error) throw error;
        toast.success('Prescription created');
      }

      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      fetchPrescriptions();
      fetchPatients();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save prescription');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_prescriptions WHERE id = ?`, [id]);
      const error = null;
      if (error) throw error;
      toast.success('Prescription deleted');
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = prescriptions.filter(p => {
    const patientName = p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : '';
    return `${patientName} ${p.medication} ${p.status}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  
  const handleExport = () => {
    const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Prescriptions</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage e-prescriptions and medication tracking.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> New Rx
          </button>
      </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
              {filtered.map((p, idx) => {
                const patientName = p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : 'Unknown Patient';
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={p.id} 
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {patientName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Stethoscope className="w-3 h-3" /> Dr. ID: {p.doctor_id?.slice(0, 8) || 'N/A'}</div>
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
                        'bg-background text-foreground border-border'
                      }`}>
                        {p.status === 'Active' && <Activity className="w-3 h-3" />}
                        {p.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(p)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Pill className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No prescriptions found.</p>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">{editingId ? 'Edit Prescription' : 'New Prescription'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-4 space-y-4">
                
                {/* Patient selection toggle */}
                {!editingId && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-muted-foreground">Patient</label>
                      <button 
                        type="button" 
                        onClick={() => setUseExistingPatient(!useExistingPatient)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        {useExistingPatient ? '+ New Patient' : 'Select Existing'}
                      </button>
                    </div>

                    {useExistingPatient ? (
                      <select 
                        required
                        value={form.patient_id} 
                        onChange={e => setForm({...form, patient_id: e.target.value})}
                        className="w-full p-2 bg-background border border-border rounded-lg text-sm"
                      >
                        <option value="" disabled>-- Select Patient --</option>
                        {patients.map(pt => (
                          <option key={pt.id} value={pt.id}>
                            {pt.first_name} {pt.last_name} ({pt.patient_number})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <input 
                          type="text" 
                          placeholder="First Name" 
                          required
                          value={form.new_patient_first}
                          onChange={e => setForm({...form, new_patient_first: e.target.value})}
                          className="w-full p-2 bg-background border border-border rounded-lg text-sm" 
                        />
                        <input 
                          type="text" 
                          placeholder="Last Name" 
                          required
                          value={form.new_patient_last}
                          onChange={e => setForm({...form, new_patient_last: e.target.value})}
                          className="w-full p-2 bg-background border border-border rounded-lg text-sm" 
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Medication</label>
                  <input required value={form.medication} onChange={e => setForm({...form, medication: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="e.g. Amoxicillin" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Dosage</label>
                    <input required value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="e.g. 500mg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Frequency</label>
                    <input required value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="e.g. Twice Daily" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Duration</label>
                    <input required value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="e.g. 7 Days" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm">
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Doctor ID (UUID - Optional)</label>
                  <input value={form.doctor_id} onChange={e => setForm({...form, doctor_id: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm font-mono" placeholder="Optional Doctor UUID" />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
