import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Calendar, Plus, Search, Trash2, Edit2, Loader2, XCircle, Clock, User, CheckCircle2, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { title: '', client_name: '', client_email: '', client_phone: '', date: '', time: '', duration_minutes: 60, location: '', notes: '', status: 'Scheduled' };
const STATUS_COLORS = { Scheduled: 'bg-blue-50 text-blue-700 border-blue-200', Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200', Cancelled: 'bg-red-50 text-red-700 border-red-200', 'No Show': 'bg-muted text-muted-foreground border-border' };

export default function UnivAppointments() {
  const companyId = useCompanyId();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (companyId) {
      fetchRecords();
      const channel = supabase.channel('appt_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_appointments', filter: `company_id=eq.${companyId}` }, fetchRecords)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('univ_appointments').select('*').eq('company_id', companyId).order('date', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        client_name: form.client_name || null,
        client_email: form.client_email || null,
        client_phone: form.client_phone || null,
        date: form.date || null,
        time: form.time || null,
        duration_minutes: Number(form.duration_minutes) || 0,
        location: form.location || null,
        notes: form.notes || null,
        status: form.status,
        company_id: companyId
      };

      if (editingId) {
        const { error } = await supabase.from('univ_appointments').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Appointment updated!');
      } else {
        const { error } = await supabase.from('univ_appointments').insert(payload);
        if (error) throw error;
        toast.success('Appointment scheduled!');
      }
      closeModal();
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const remove = async (id) => {
    try {
      const { error } = await supabase.from('univ_appointments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted');
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('univ_appointments').update({ status }).eq('id', id);
      if (error) throw error;
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = records.filter(r => `${r.title} ${r.client_name} ${r.status}`.toLowerCase().includes(search.toLowerCase()));
  const today = new Date().toISOString().split('T')[0];

  
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
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><Calendar className="w-7 h-7 text-primary" /> Appointments</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Schedule and manage all client appointments.</p>
        </div>
        <div className="flex items-center gap-2">

        <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"><Plus className="w-4 h-4" /> New Appointment</button>
      </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total', value: records.length, color: 'text-foreground', bg: 'bg-card' },
          { label: "Today", value: records.filter(r => r.date === today).length, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
          { label: 'Completed', value: records.filter(r => r.status === 'Completed').length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Cancelled', value: records.filter(r => r.status === 'Cancelled').length, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
        ].map((k, i) => <div key={i} className={`border p-4 rounded-2xl shadow-sm ${k.bg}`}><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p><p className={`text-2xl font-black ${k.color}`}>{k.value}</p></div>)}
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, client..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" /></div>
        <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm gap-1">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground'}`}><List className="w-4 h-4" />List</button>
          <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground'}`}><LayoutGrid className="w-4 h-4" />Grid</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {filtered.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base text-foreground">{r.title}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-md ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><User className="w-4 h-4 text-primary" />{r.client_name || '—'}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="w-4 h-4 text-primary" />{r.date} {r.time && `at ${r.time}`}</div>
                {r.duration_minutes && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4 text-primary" />{r.duration_minutes} minutes</div>}
                <div className="flex justify-end gap-1 mt-auto pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(r.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl"><Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No appointments found.</p></div>}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>{['Title', 'Client', 'Date & Time', 'Duration', 'Status', 'Actions'].map(h => <th key={h} className="p-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-4 font-bold text-foreground">{r.title}</td>
                    <td className="p-4"><p className="font-medium">{r.client_name || '—'}</p><p className="text-xs text-muted-foreground">{r.client_email}</p></td>
                    <td className="p-4 text-muted-foreground">{r.date} {r.time && <span className="font-mono text-xs">@ {r.time}</span>}</td>
                    <td className="p-4 text-muted-foreground">{r.duration_minutes ? `${r.duration_minutes} min` : '—'}</td>
                    <td className="p-4">
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none ${STATUS_COLORS[r.status]}`}>
                        {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(r.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No appointments found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black">{editingId ? 'Edit Appointment' : 'Schedule Appointment'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Title *</label><input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client Name</label><input type="text" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client Email</label><input type="email" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client Phone</label><input type="tel" value={form.client_phone} onChange={e => setForm({...form, client_phone: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Date *</label><input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Time</label><input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Duration (minutes)</label><input type="number" min="15" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value) || 0})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Location</label><input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Office, Zoom, etc." className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label><textarea rows="3" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId ? 'Update' : 'Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
