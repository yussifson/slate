import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { DollarSign, Plus, Trash2, Edit2, Loader2, XCircle, Search, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TABLE = 'univ_agentcommissions';
const EMPTY = { agent_name: '', sale_amount: '', commission_rate: '', commission_amount: '', sale_date: '', status: 'Pending', notes: '' };
const STATUSES = ['Pending', 'Approved', 'Paid', 'Disputed'];
const STATUS_COLORS = { Pending: 'bg-amber-100 text-amber-700', Approved: 'bg-blue-100 text-blue-700', Paid: 'bg-emerald-100 text-emerald-700', Disputed: 'bg-red-100 text-red-700' };

export default function UnivAgentCommission() {
  const companyId = useCompanyId();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { if (companyId) fetch(); }, [companyId]);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(TABLE).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, company_id: companyId, sale_amount: parseFloat(form.sale_amount) || 0, commission_rate: parseFloat(form.commission_rate) || 0, commission_amount: parseFloat(form.commission_amount) || 0 };
    const { error } = editId ? await supabase.from(TABLE).update(payload).eq('id', editId) : await supabase.from(TABLE).insert(payload);
    if (error) { toast.error('Failed to save'); return; }
    toast.success(editId ? 'Updated!' : 'Added!');
    closeModal(); fetch();
  };

  const remove = async (id) => {
    await supabase.from(TABLE).delete().eq('id', id);
    toast.success('Deleted'); fetch();
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY); setEditId(r?.id || null); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); setForm(EMPTY); };

  const filtered = records.filter(r => `${r.agent_name} ${r.status}`.toLowerCase().includes(search.toLowerCase()));
  const totalCommissions = records.reduce((s, r) => s + (parseFloat(r.commission_amount) || 0), 0);
  const paid = records.filter(r => r.status === 'Paid').reduce((s, r) => s + (parseFloat(r.commission_amount) || 0), 0);

  
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
    <div className="h-full flex flex-col gap-6 p-6 bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2"><TrendingUp className="w-7 h-7 text-primary" />Agent Commissions</h1>
          <p className="text-sm text-muted-foreground mt-1">{records.length} commission records · ${totalCommissions.toFixed(2)} total</p>
        </div>
        <div className="flex items-center gap-2">

        <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4" />Add Commission</button>
      </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total', value: totalCommissions, color: 'text-primary' }, { label: 'Paid Out', value: paid, color: 'text-emerald-600' }, { label: 'Pending', value: totalCommissions - paid, color: 'text-amber-600' }].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>${s.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." className="w-full h-10 pl-9 pr-4 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" /></div>

      {loading ? <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <div className="flex-1 overflow-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40"><tr>{['Agent', 'Sale Amount', 'Rate %', 'Commission', 'Date', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(r => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold">{r.agent_name}</td>
                  <td className="px-4 py-3">${parseFloat(r.sale_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{r.commission_rate}%</td>
                  <td className="px-4 py-3 font-bold text-primary">${parseFloat(r.commission_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.sale_date}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-lg hover:bg-muted/80"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => remove(r.id)} className="p-1.5 bg-red-50 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                </motion.tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No commission records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-lg rounded-2xl shadow-2xl">
              <div className="p-5 border-b border-border flex justify-between items-center"><h2 className="text-xl font-black">{editId ? 'Edit Commission' : 'Add Commission'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full"><XCircle className="w-5 h-5 text-muted-foreground" /></button></div>
              <form onSubmit={save} className="p-5 grid grid-cols-2 gap-4">
                {[['agent_name', 'Agent Name', 'text', 'full'], ['sale_amount', 'Sale Amount ($)', 'number', ''], ['commission_rate', 'Commission Rate (%)', 'number', ''], ['commission_amount', 'Commission Amount ($)', 'number', ''], ['sale_date', 'Sale Date', 'date', ''], ['notes', 'Notes', 'text', 'full']].map(([k, l, t, span]) => (
                  <div key={k} className={span === 'full' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">{l}</label>
                    <input required={k === 'agent_name'} type={t} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
                <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold">{editId ? 'Update' : 'Add'}</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
