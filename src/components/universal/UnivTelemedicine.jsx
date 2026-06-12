import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Video, Calendar, Clock, CheckCircle2, User, Phone, MoreHorizontal, FileText, Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivTelemedicine() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState(null);
  const [form, setForm] = useState({
    patient_name: '',
    doctor_name: '',
    scheduled_time: '',
    meeting_link: '',
    status: 'Scheduled',
    notes: ''
  });

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
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('scheduled_time', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingApt(null);
    setForm({
      patient_name: '',
      doctor_name: '',
      scheduled_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      meeting_link: 'https://meet.slate.com/' + Math.random().toString(36).substring(2, 10),
      status: 'Scheduled',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (apt) => {
    setEditingApt(apt);
    let pName = '';
    let dName = '';
    let actualNotes = '';
    try {
      const parsed = JSON.parse(apt.notes);
      pName = parsed.patient_name || '';
      dName = parsed.doctor_name || '';
      actualNotes = parsed.notes || '';
    } catch (e) {
      actualNotes = apt.notes || '';
    }

    setForm({
      patient_name: pName,
      doctor_name: dName,
      scheduled_time: apt.scheduled_time ? new Date(apt.scheduled_time).toISOString().slice(0, 16) : '',
      meeting_link: apt.meeting_link || '',
      status: apt.status || 'Scheduled',
      notes: actualNotes
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patient_name.trim()) {
      toast.error('Patient Name is required');
      return;
    }
    
    // Serialize patient and doctor name in notes field to preserve text data
    const notesPayload = JSON.stringify({
      patient_name: form.patient_name.trim(),
      doctor_name: form.doctor_name.trim(),
      notes: form.notes.trim()
    });

    const payload = {
      company_id: companyId,
      patient_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID as required
      doctor_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID as required
      scheduled_time: form.scheduled_time ? new Date(form.scheduled_time).toISOString() : new Date().toISOString(),
      meeting_link: form.meeting_link.trim() || null,
      status: form.status,
      notes: notesPayload
    };

    try {
      if (editingApt) {
        const { error } = await supabase
          .from('univ_telemedicine')
          .update(payload)
          .eq('id', editingApt.id);
        if (error) throw error;
        toast.success('Consultation updated');
      } else {
        const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_telemedicine (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
        if (error) throw error;
        toast.success('Consultation scheduled');
      }
      setIsModalOpen(false);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this consultation?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_telemedicine WHERE id = ?`, [id]);
      const error = null;
      if (error) throw error;
      toast.success('Consultation deleted');
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  // Helper to parse notes field
  const getParsedData = (apt) => {
    try {
      const parsed = JSON.parse(apt.notes);
      return {
        patient_name: parsed.patient_name || 'Patient',
        doctor_name: parsed.doctor_name || 'Doctor',
        notes: parsed.notes || ''
      };
    } catch (e) {
      return {
        patient_name: 'Patient',
        doctor_name: 'Doctor',
        notes: apt.notes || ''
      };
    }
  };

  const filtered = appointments.filter(a => {
    const parsed = getParsedData(a);
    return `${parsed.patient_name} ${parsed.doctor_name} ${a.status}`.toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Telemedicine</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage remote consultations and video meetings.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Schedule Visit
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
              placeholder="Search patients, doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-4">
           {filtered.map((a, idx) => {
             const parsed = getParsedData(a);
             return (
              <motion.div 
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 key={a.id} 
                 className="bg-background border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                 onClick={() => handleOpenEdit(a)}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      a.status === 'Ongoing' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                      a.status === 'Completed' ? 'bg-muted text-muted-foreground' :
                      'bg-primary/10 text-primary'
                    }`}>
                       <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{parsed.patient_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5" /> {parsed.doctor_name}
                      </p>
                      {parsed.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                          "{parsed.notes}"
                        </p>
                      )}
                    </div>
                 </div>

                 <div className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
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
                       a.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                       'bg-background text-foreground border-border'
                     }`}>
                       {a.status}
                     </span>
                     <div className="flex items-center gap-2 mt-1">
                       {a.status !== 'Completed' && a.meeting_link && (
                         <button className="text-xs font-semibold text-primary hover:underline" onClick={() => window.open(a.meeting_link, '_blank')}>
                           Join Call
                         </button>
                       )}
                       <button onClick={() => handleOpenEdit(a)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                         Edit
                       </button>
                       <button onClick={() => handleDelete(a.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">
                         Cancel
                       </button>
                     </div>
                   </div>
                 </div>
              </motion.div>
             );
           })}

           {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No consultations scheduled.</p>
             </div>
           )}
        </div>
      </div>

      {/* Telemedicine Visit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-foreground mb-4">
              {editingApt ? 'Edit Consultation' : 'Schedule Telemedicine Visit'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Patient Name *</label>
                <input 
                  type="text" 
                  value={form.patient_name}
                  onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Doctor Name</label>
                <input 
                  type="text" 
                  value={form.doctor_name}
                  onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                  placeholder="e.g. Dr. Smith"
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Scheduled Date & Time *</label>
                <input 
                  type="datetime-local" 
                  value={form.scheduled_time}
                  onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                  required
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Meeting Link</label>
                <input 
                  type="url" 
                  value={form.meeting_link}
                  onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                  placeholder="https://meet.jit.si/..."
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status</label>
                  <select 
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Clinical Notes</label>
                <textarea 
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Symptoms, observations, and details..."
                  rows="3"
                  className="w-full p-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-muted/50 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
