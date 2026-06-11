import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Trash2, Edit2, Loader2, XCircle, Search, CalendarClock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TABLE = 'univ_productionschedules';
const STATUS_COLORS = {"Scheduled":"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400","In Progress":"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400","Completed":"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400","Halted":"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400","Cancelled":"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"};
const EMPTY = {"job_name":"","product_name":"","machine_line":"","planned_start":"","planned_end":"","quantity_ordered":"","quantity_produced":"","operator":"","status":"Scheduled"};

export default function UnivProductionSchedule() {
  const companyId = useCompanyId();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE)
      .select('*').eq('company_id', companyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[ProductionSchedule] fetch error:', error.message);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setModal(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); setForm({ ...EMPTY }); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, company_id: companyId };
    const { error } = editId
      ? await supabase.from(TABLE).update(payload).eq('id', editId)
      : await supabase.from(TABLE).insert(payload);
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    toast.success(editId ? 'Record updated!' : 'Record added!');
    closeModal();
    fetchData();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Deleted');
    fetchData();
  };

  const filtered = records.filter(r =>
    Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase())
  );

  
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
    <div className="h-full flex flex-col gap-6 p-6 bg-background overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary"><CalendarClock className="w-6 h-6" /></span>
            Production Schedule
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-0.5">Schedule and track production runs and shifts.</p>
        </div>
        <div className="flex items-center gap-2">

        <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button
          onClick={openAdd}
          className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/30"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search production schedule..."
          className="w-full h-10 pl-9 pr-4 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-shadow"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-border bg-muted/40 sticky top-0 z-10">
              <tr><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Job Name</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Product Name</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Machine Line</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Planned Start</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Quantity Ordered</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap"></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{r.job_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.product_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.machine_line}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.planned_start}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.quantity_ordered}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-700'}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(r)} className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center text-muted-foreground">
                    <CalendarClock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No production schedule records yet.</p>
                    <p className="text-xs mt-1">Click "Add Record" to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Bar */}
      {!loading && records.length > 0 && (
        <div className="flex gap-4 shrink-0 flex-wrap">
          {Object.entries(
            records.reduce((acc, r) => {
              const s = r.status || 'Unknown';
              acc[s] = (acc[s] || 0) + 1;
              return acc;
            }, {})
          ).map(([s, count]) => (
            <div key={s} className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${STATUS_COLORS[s] || 'bg-slate-100 text-slate-600'}`}>
              <span>{s}</span>
              <span className="bg-white/40 rounded-full px-1.5">{count}</span>
            </div>
          ))}
          <div className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold text-muted-foreground flex items-center gap-2">
            Total <span className="text-foreground">{records.length}</span>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-primary" />
                  {editId ? 'Edit Record' : 'Add Production Schedule'}
                </h2>
                <button onClick={closeModal} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-5 grid grid-cols-2 gap-4 overflow-y-auto flex-1">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Job / Order Name</label>
                <input required type="text" value={form.job_name || ''} onChange={e => setForm(p => ({ ...p, job_name: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Product Name</label>
                <input  type="text" value={form.product_name || ''} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Machine / Line</label>
                <input  type="text" value={form.machine_line || ''} onChange={e => setForm(p => ({ ...p, machine_line: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Planned Start</label>
                <input  type="datetime-local" value={form.planned_start || ''} onChange={e => setForm(p => ({ ...p, planned_start: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Planned End</label>
                <input  type="datetime-local" value={form.planned_end || ''} onChange={e => setForm(p => ({ ...p, planned_end: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Quantity Ordered</label>
                <input  type="number" value={form.quantity_ordered || ''} onChange={e => setForm(p => ({ ...p, quantity_ordered: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Quantity Produced</label>
                <input  type="number" value={form.quantity_produced || ''} onChange={e => setForm(p => ({ ...p, quantity_produced: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Operator / Supervisor</label>
                <input  type="text" value={form.operator || ''} onChange={e => setForm(p => ({ ...p, operator: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">
                  {["Scheduled","In Progress","Completed","Halted","Cancelled"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
                <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-border shrink-0">
                  <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="h-10 px-6 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editId ? 'Update' : 'Add Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
