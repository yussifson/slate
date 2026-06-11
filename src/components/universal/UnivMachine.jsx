import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, MonitorSpeaker, Plus, Activity, AlertTriangle, Settings, MoreHorizontal, Edit2, Trash2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { machine_name: '', serial_number: '', location: '', status: 'Operational', last_maintenance: '', next_maintenance: '' };
const STATUS_COLORS = {
  Operational: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
  Offline: 'bg-red-50 text-red-700 border-red-200'
};

export default function UnivMachine() {
  const companyId = useCompanyId();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (companyId) {
      fetchMachines();
      const channel = supabase.channel('machines_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_machines', filter: `company_id=eq.${companyId}` }, () => {
          fetchMachines();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_machines')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('machine_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setMachines(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        company_id: companyId,
        machine_name: form.machine_name,
        serial_number: form.serial_number || null,
        location: form.location || null,
        status: form.status,
        last_maintenance: form.last_maintenance || null,
        next_maintenance: form.next_maintenance || null
      };

      if (editingId) {
        const { error } = await supabase.from('univ_machines').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Machine updated');
      } else {
        const { error } = await supabase.from('univ_machines').insert(payload);
        if (error) throw error;
        toast.success('Machine added');
      }
      closeModal();
      fetchMachines();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save machine');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('univ_machines').delete().eq('id', id);
      if (error) throw error;
      toast.success('Machine deleted');
      fetchMachines();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete machine');
    }
  };

  const openModal = (machine = null) => {
    setForm(machine ? { ...machine } : EMPTY_FORM);
    setEditingId(machine?.id || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const filtered = machines.filter(m => 
    `${m.machine_name} ${m.serial_number} ${m.status} ${m.location}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Machine Maintenance</h2>
           <p className="text-sm text-muted-foreground mt-1">Track equipment status, serial numbers, and maintenance schedules.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Machine
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((m, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={m.id} 
                  className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm flex flex-col h-full group"
                >
                  <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <MonitorSpeaker className="w-5 h-5 text-primary" /> <span className="line-clamp-1">{m.machine_name}</span>
                      </h3>
                      {m.serial_number && (
                        <code className="text-xs font-mono font-bold bg-muted px-1.5 py-0.5 rounded border border-border mt-2 inline-block">
                          {m.serial_number}
                        </code>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
                      m.status === 'Operational' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      m.status === 'Maintenance' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {m.status === 'Operational' && <Activity className="w-3 h-3" />}
                      {m.status === 'Maintenance' && <Settings className="w-3 h-3" />}
                      {m.status === 'Offline' && <AlertTriangle className="w-3 h-3" />}
                      {m.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-foreground">{m.location || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Maint.</span>
                      <span className="font-medium text-foreground">{m.last_maintenance || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Maint.</span>
                      <span className="font-bold text-orange-600 dark:text-orange-500">{m.next_maintenance || '—'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => openModal(m)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                     </button>
                     <button onClick={() => handleDelete(m.id)} className="p-1.5 bg-red-50 rounded-md text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <MonitorSpeaker className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No machines found.</p>
             </div>
           )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Machine' : 'Add Machine'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Machine Name *</label>
                  <input required type="text" value={form.machine_name} onChange={e => setForm({...form, machine_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Serial Number</label>
                  <input type="text" value={form.serial_number || ''} onChange={e => setForm({...form, serial_number: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Location</label>
                  <input type="text" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Last Maintenance Date</label>
                  <input type="date" value={form.last_maintenance || ''} onChange={e => setForm({...form, last_maintenance: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Next Maintenance Date</label>
                  <input type="date" value={form.next_maintenance || ''} onChange={e => setForm({...form, next_maintenance: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
