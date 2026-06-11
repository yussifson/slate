import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Bed, Plus, CheckCircle2, User, MoreHorizontal, Activity, AlertCircle, X, Trash2, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivWard() {
  const companyId = useCompanyId();
  const [wards, setWards] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [form, setForm] = useState({
    ward_name: '',
    bed_number: '',
    status: 'Available',
    patient_id: '',
    admission_date: '',
    expected_discharge: ''
  });

  useEffect(() => {
    if (companyId) {
      fetchWards();
      fetchPatients();
      const channel = supabase.channel('wards_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_wards', filter: `company_id=eq.${companyId}` }, () => {
          fetchWards();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchWards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_wards')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('ward_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setWards(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch wards');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('univ_patients')
        .select('id, first_name, last_name')
        .eq('company_id', companyId);
      if (error && error.code !== '42P01') throw error;
      setPatients(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingWard(null);
    setForm({
      ward_name: 'General Ward A',
      bed_number: `GWA-${Math.floor(10 + Math.random() * 90)}`,
      status: 'Available',
      patient_id: '',
      admission_date: '',
      expected_discharge: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ward) => {
    setEditingWard(ward);
    setForm({
      ward_name: ward.ward_name || '',
      bed_number: ward.bed_number || '',
      status: ward.status || 'Available',
      patient_id: ward.patient_id || '',
      admission_date: ward.admission_date ? new Date(ward.admission_date).toISOString().slice(0, 16) : '',
      expected_discharge: ward.expected_discharge ? new Date(ward.expected_discharge).toISOString().slice(0, 16) : ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.ward_name.trim() || !form.bed_number.trim()) {
      toast.error('Ward Name and Bed Number are required');
      return;
    }

    const payload = {
      company_id: companyId,
      ward_name: form.ward_name.trim(),
      bed_number: form.bed_number.trim(),
      status: form.status,
      patient_id: form.status === 'Occupied' && form.patient_id ? form.patient_id : null,
      admission_date: form.admission_date ? new Date(form.admission_date).toISOString() : null,
      expected_discharge: form.expected_discharge ? new Date(form.expected_discharge).toISOString() : null
    };

    try {
      if (editingWard) {
        const { error } = await supabase
          .from('univ_wards')
          .update(payload)
          .eq('id', editingWard.id);
        if (error) throw error;
        toast.success('Bed updated');
      } else {
        const { error } = await supabase
          .from('univ_wards')
          .insert(payload);
        if (error) throw error;
        toast.success('Bed added');
      }
      setIsModalOpen(false);
      fetchWards();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;
    try {
      const { error } = await supabase
        .from('univ_wards')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Bed deleted');
      fetchWards();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  const getPatientName = (patientId) => {
    if (!patientId) return '—';
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : patientId;
  };

  const filtered = wards.filter(w => 
    `${w.ward_name} ${w.bed_number} ${w.status} ${getPatientName(w.patient_id)}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Wards & Beds</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage bed availability and patient admissions.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Bed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Beds</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{wards.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Bed className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Available</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{wards.filter(w => w.status === 'Available').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Occupied</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{wards.filter(w => w.status === 'Occupied').length}</h3>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-xl"><Activity className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search wards, beds, patients..."
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
                <th className="p-4 font-semibold">Ward & Bed</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Admission Date</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((w, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={w.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => handleOpenEdit(w)}
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                       <Bed className="w-4 h-4 text-primary" /> {w.bed_number}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{w.ward_name}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      w.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      w.status === 'Occupied' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {w.status === 'Available' && <CheckCircle2 className="w-3 h-3" />}
                      {w.status === 'Occupied' && <Activity className="w-3 h-3" />}
                      {w.status === 'Maintenance' && <AlertCircle className="w-3 h-3" />}
                      {w.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {w.patient_id ? (
                      <span className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {getPatientName(w.patient_id)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {w.admission_date ? new Date(w.admission_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleOpenEdit(w)} className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(w.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-muted-foreground">
                    <Bed className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                    No ward/bed details found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ward Bed Form Modal */}
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
              {editingWard ? 'Edit Bed Details' : 'Add New Bed'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Ward Name *</label>
                <input 
                  type="text" 
                  value={form.ward_name}
                  onChange={(e) => setForm({ ...form, ward_name: e.target.value })}
                  placeholder="e.g. ICU Wing"
                  required
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Bed Number *</label>
                <input 
                  type="text" 
                  value={form.bed_number}
                  onChange={(e) => setForm({ ...form, bed_number: e.target.value })}
                  placeholder="e.g. Bed-104"
                  required
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status</label>
                  <select 
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                {form.status === 'Occupied' && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Select Patient</label>
                    <select 
                      value={form.patient_id}
                      onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                      className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    >
                      <option value="">-- None --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Admission Date</label>
                  <input 
                    type="datetime-local" 
                    value={form.admission_date}
                    onChange={(e) => setForm({ ...form, admission_date: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Expected Discharge</label>
                  <input 
                    type="datetime-local" 
                    value={form.expected_discharge}
                    onChange={(e) => setForm({ ...form, expected_discharge: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
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
