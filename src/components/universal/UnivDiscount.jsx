import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Trash2, Edit2, Loader2, XCircle, Search, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TABLE = 'univ_discounts';
const EMPTY = {"discount_name":"","code":"","discount_type":"","value":"","min_purchase":"","expiry_date":"","usage_limit":"","status":"Active"};
const STATUS_COLORS = {"Active":"bg-emerald-100 text-emerald-700","Expired":"bg-blue-100 text-blue-700","Disabled":"bg-amber-100 text-amber-700"};

export default function UnivDiscount() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { if (companyId) fetchData(); }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(TABLE).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, company_id: companyId };
    const { error } = editId
      ? await supabase.from(TABLE).update(payload).eq('id', editId)
      : await supabase.from(TABLE).insert(payload);
    if (error) { toast.error('Failed to save: ' + error.message); return; }
    toast.success(editId ? 'Updated!' : 'Record added!');
    closeModal(); fetchData();
  };

  const remove = async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (!error) { toast.success('Deleted!'); fetchData(); }
    else toast.error('Failed to delete');
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY); setEditId(r?.id || null); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); setForm(EMPTY); };
  const filtered = records.filter(r => Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase()));

  
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
    <div className="h-full flex flex-col gap-6 p-6 bg-background overflow-auto ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Tag className="w-7 h-7 text-primary" />Discount Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{records.length} records</p>
        </div>
        <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm">
          <Plus className="w-4 h-4" />Add Record
        </button>
      </div>
      </div>

      <div className="relative max-w-sm flex-shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search discount manager..." className="w-full h-10 pl-9 pr-4 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="flex-1 overflow-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-border bg-muted/40 sticky top-0">
              <tr><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Discount Name</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Code</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Discount Type</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Value</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Expiry Date</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase"></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold">{r['discount_name']}</td><td className="px-4 py-3 text-muted-foreground">{r['code']}</td><td className="px-4 py-3 text-muted-foreground">{r['discount_type']}</td><td className="px-4 py-3 text-muted-foreground">{r['value']}</td><td className="px-4 py-3 text-muted-foreground">{r['expiry_date']}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[r['status']] || 'bg-muted text-foreground'}`}>{r['status']}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-lg hover:bg-muted/80"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(r.id)} className="p-1.5 bg-red-50 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">No discount manager records yet. Add your first one!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black">{editId ? 'Edit Record' : 'Add Discount Manager'}</h2>
                <button onClick={closeModal} className="p-2 bg-muted rounded-full"><XCircle className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={save} className="p-5 grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Discount Name</label>
                <input required type="text" value={form['discount_name']} onChange={e => setForm({ ...form, 'discount_name': e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Code</label>
                <input  type="text" value={form['code']} onChange={e => setForm({ ...form, 'code': e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Type</label>
                <select value={form['discount_type']} onChange={e => setForm({ ...form, 'discount_type': e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">
                  {["Percentage","Fixed Amount"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Value</label>
                <input  type="number" value={form['value']} onChange={e => setForm({ ...form, 'value': e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Min Purchase ($)</label>
                <input  type="number" value={form['min_purchase']} onChange={e => setForm({ ...form, 'min_purchase': e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Expiry Date</label>
                <input  type="date" value={form['expiry_date']} onChange={e => setForm({ ...form, 'expiry_date': e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Usage Limit</label>
                <input  type="number" value={form['usage_limit']} onChange={e => setForm({ ...form, 'usage_limit': e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Status</label>
                <select value={form['status']} onChange={e => setForm({ ...form, 'status': e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">
                  {["Active","Expired","Disabled"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
                <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-border">
                  <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                  <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold">{editId ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
