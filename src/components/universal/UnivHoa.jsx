import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Home, Plus, Trash2, Edit2, Loader2, XCircle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TABLE = 'univ_hoas';
const EMPTY = { community_name: '', unit_number: '', owner_name: '', dues_amount: '', due_date: '', status: 'Unpaid', violation_notes: '' };
const STATUSES = ['Unpaid', 'Paid', 'Overdue', 'Waived'];
const STATUS_COLORS = { Unpaid: 'bg-amber-100 text-amber-700', Paid: 'bg-emerald-100 text-emerald-700', Overdue: 'bg-red-100 text-red-700', Waived: 'bg-slate-100 text-slate-600' };

export default function UnivHoa() {
  const companyId = useCompanyId();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { if (companyId) fetchData(); }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from(TABLE).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, company_id: companyId, dues_amount: parseFloat(form.dues_amount) || 0 };
    const { error } = editId ? await supabase.from(TABLE).update(payload).eq('id', editId) : await supabase.from(TABLE).insert(payload);
    if (error) { toast.error('Failed to save'); return; }
    toast.success(editId ? 'Updated!' : 'Record added!');
    closeModal(); fetchData();
  };

  const remove = async (id) => { await supabase.from(TABLE).delete().eq('id', id); toast.success('Deleted'); fetchData(); };
  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY); setEditId(r?.id || null); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); setForm(EMPTY); };

  const filtered = records.filter(r => `${r.community_name} ${r.owner_name} ${r.unit_number}`.toLowerCase().includes(search.toLowerCase()));
  const totalDues = records.reduce((s, r) => s + (parseFloat(r.dues_amount) || 0), 0);
  const paid = records.filter(r => r.status === 'Paid').reduce((s, r) => s + (parseFloat(r.dues_amount) || 0), 0);

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-background">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-foreground flex items-center gap-2"><Home className="w-7 h-7 text-primary" />HOA Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{records.length} units · ${totalDues.toFixed(2)} total dues</p></div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4" />Add Unit</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Dues', value: totalDues, color: 'text-primary' }, { label: 'Collected', value: paid, color: 'text-emerald-600' }, { label: 'Outstanding', value: totalDues - paid, color: 'text-red-600' }].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground uppercase">{s.label}</p><p className={`text-2xl font-black mt-1 ${s.color}`}>${s.value.toFixed(2)}</p></div>
        ))}
      </div>
      <div className="relative max-w-sm"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search units or owners..." className="w-full h-10 pl-9 pr-4 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" /></div>
      {loading ? <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <div className="flex-1 overflow-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm"><thead className="border-b border-border bg-muted/40"><tr>{['Community', 'Unit #', 'Owner', 'Dues', 'Due Date', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody>{filtered.map(r => (
              <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-4 py-3 font-semibold">{r.community_name}</td><td className="px-4 py-3">{r.unit_number}</td><td className="px-4 py-3">{r.owner_name}</td>
                <td className="px-4 py-3 font-bold text-primary">${parseFloat(r.dues_amount || 0).toFixed(2)}</td><td className="px-4 py-3 text-muted-foreground">{r.due_date}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-lg hover:bg-muted/80"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => remove(r.id)} className="p-1.5 bg-red-50 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
              </motion.tr>
            ))}{!filtered.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No HOA records yet.</td></tr>}</tbody>
          </table>
        </div>
      )}
      <AnimatePresence>{modal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card w-full max-w-lg rounded-2xl shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center"><h2 className="text-xl font-black">{editId ? 'Edit Unit' : 'Add HOA Unit'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full"><XCircle className="w-5 h-5 text-muted-foreground" /></button></div>
            <form onSubmit={save} className="p-5 grid grid-cols-2 gap-4">
              {[['community_name', 'Community Name', 'text', 'full'], ['unit_number', 'Unit Number', 'text', ''], ['owner_name', 'Owner Name', 'text', ''], ['dues_amount', 'Dues Amount ($)', 'number', ''], ['due_date', 'Due Date', 'date', ''], ['violation_notes', 'Violation Notes', 'text', 'full']].map(([k, l, t, span]) => (
                <div key={k} className={span === 'full' ? 'col-span-2' : ''}><label className="block text-xs font-bold text-muted-foreground uppercase mb-1">{l}</label><input type={t} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" /></div>
              ))}
              <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold">{editId ? 'Update' : 'Add'}</button></div>
            </form>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
