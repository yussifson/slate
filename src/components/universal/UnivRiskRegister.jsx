import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Trash2, Edit2, Loader2, XCircle, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TABLE = 'univ_riskregisters';
const STATUS_COLORS = {"Open":"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400","Mitigated":"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400","Accepted":"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400","Closed":"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"};
const EMPTY = {"risk_title":"","category":"","likelihood":"","impact":"","risk_score":"","owner":"","mitigation_plan":"","review_date":"","status":"Open"};

export default function UnivRiskRegister() {
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
      console.error('[RiskRegister] fetch error:', error.message);
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

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-background overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary"><AlertTriangle className="w-6 h-6" /></span>
            Risk Register
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-0.5">Track, assess, and mitigate organizational risks.</p>
        </div>
        <button
          onClick={openAdd}
          className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/30"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search risk register..."
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
              <tr><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Risk Title</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Category</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Likelihood</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Impact</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Risk Score</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Owner</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap"></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{r.risk_title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.likelihood}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.impact}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.risk_score}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.owner}</td>
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
                  <td colSpan={8} className="px-4 py-20 text-center text-muted-foreground">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No risk register records yet.</p>
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
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  {editId ? 'Edit Record' : 'Add Risk Register'}
                </h2>
                <button onClick={closeModal} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-5 grid grid-cols-2 gap-4 overflow-y-auto flex-1">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Risk Title</label>
                <input required type="text" value={form.risk_title || ''} onChange={e => setForm(p => ({ ...p, risk_title: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">
                  {["Operational","Financial","Legal","Strategic","IT","Other"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Likelihood (1-5)</label>
                <input  type="number" value={form.likelihood || ''} onChange={e => setForm(p => ({ ...p, likelihood: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Impact (1-5)</label>
                <input  type="number" value={form.impact || ''} onChange={e => setForm(p => ({ ...p, impact: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Risk Score</label>
                <input  type="number" value={form.risk_score || ''} onChange={e => setForm(p => ({ ...p, risk_score: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Risk Owner</label>
                <input  type="text" value={form.owner || ''} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Mitigation Plan</label>
                <input  type="text" value={form.mitigation_plan || ''} onChange={e => setForm(p => ({ ...p, mitigation_plan: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div className="">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Review Date</label>
                <input  type="date" value={form.review_date || ''} onChange={e => setForm(p => ({ ...p, review_date: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">
                  {["Open","Mitigated","Accepted","Closed"].map(s => <option key={s}>{s}</option>)}
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
