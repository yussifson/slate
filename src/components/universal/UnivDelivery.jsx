import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import {Plus, Trash2, Edit2, XCircle, Search, Package, MapPin, CheckCircle2, Clock, Truck, User} from "lucide-react";
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { OrbitLoader } from "@/components/ui/orbit-loader";

const TABLE = 'univ_deliveries';
const EMPTY = { tracking_number: "", recipient_name: "", delivery_address: "", status: "Pending" };

const STATUS_COLORS = {
  "Pending": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
  "In Transit": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
  "Out for Delivery": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200",
  "Delivered": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
  "Failed": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
  "Returned": "bg-muted text-muted-foreground border-muted-foreground/20"
};

const STATUS_ICONS = {
  "Pending": <Clock className="w-3.5 h-3.5" />,
  "In Transit": <Truck className="w-3.5 h-3.5" />,
  "Out for Delivery": <Truck className="w-3.5 h-3.5" />,
  "Delivered": <CheckCircle2 className="w-3.5 h-3.5" />,
  "Failed": <XCircle className="w-3.5 h-3.5" />,
  "Returned": <Package className="w-3.5 h-3.5" />
};

export default function UnivDelivery() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM ${TABLE} WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      setRecords(data || []);
    } catch (e) {
      if (e.message && e.message.includes('no such table')) {
        // Ignore schema migration lag
      } else {
        console.error('[Delivery] fetch error:', e);
      }
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchData();
    if (companyId) {
      const ch = supabase.channel('delivery_ch').on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `company_id=eq.${companyId}` }, fetchData).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [fetchData, companyId]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setModal(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); setForm({ ...EMPTY }); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tracking_number) return toast.error('Tracking Number is required');
    if (!form.recipient_name) return toast.error('Recipient Name is required');

    setSaving(true);
    const payload = { ...form, company_id: companyId };

    try {
      if (editId) {
        const _keys = Object.keys(payload);
        const _vals = Object.values(payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE ${TABLE} SET ${_keys.map(k => k + ' = ?').join(', ')} WHERE id = ?`, [..._vals, editId]);
        toast.success('Delivery updated!');
      } else {
        const _payload = { ...payload, id: crypto.randomUUID() };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _plhdr = _keys.map(() => '?').join(', ');
        await powerSync.execute(`INSERT INTO ${TABLE} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
        toast.success('Delivery created!');
      }
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Save failed: ' + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await powerSync.execute(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
      toast.success('Delivery deleted');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const filtered = records.filter(r => {
    return `${r.tracking_number} ${r.recipient_name} ${r.delivery_address} ${r.status}`.toLowerCase().includes(search.toLowerCase());
  });

  const handleExport = () => {
    const exportData = filtered;
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k] || '').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'deliveries_export.csv'; a.click();
  };

  return (
    <div className={`h-full flex flex-col gap-6 p-6 bg-background overflow-auto ${view !== 'Default' ? 'hide-default' : ''}`}>
      {/* Header */}
      <div className="view-header flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary"><Package className="w-6 h-6" /></span>
            Delivery Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-0.5">Track shipments, deliveries, and last-mile logistics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 transition-all active:scale-95">
            Export CSV
          </button>
          <button onClick={openAdd} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add Delivery
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 shrink-0 justify-between items-start sm:items-center">
        <div className="relative w-full max-w-sm shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deliveries..." className="w-full h-11 pl-9 pr-4 bg-card border border-primary/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all" />
        </div>

        {!loading && records.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {Object.entries(
              records.reduce((acc, r) => {
                const s = r.status || 'Unknown';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {})
            ).map(([s, count]) => (
              <div key={s} className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${STATUS_COLORS[s] || 'bg-muted text-muted-foreground border-muted'}`}>
                {STATUS_ICONS[s] || <Package className="w-3.5 h-3.5" />}
                <span>{s}</span>
                <span className="bg-background/50 rounded px-1.5 py-0.5">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><OrbitLoader size="md" /></div>
      ) : (
        <div className="flex-1 overflow-auto rounded-2xl border border-primary/40 bg-card custom-scrollbar">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-primary/40 bg-muted/40 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Tracking #</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Recipient</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Address</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <motion.tr key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-b border-primary/40 hover:bg-muted/20 transition-colors group align-middle">
                  <td className="px-4 py-4">
                    <p className="font-mono font-bold text-primary text-xs border border-primary/20 bg-primary/5 px-2 py-1 rounded w-fit uppercase">{r.tracking_number}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> {r.recipient_name || '—'}</p>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> {r.delivery_address || '—'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 w-fit ${STATUS_COLORS[r.status] || 'bg-muted text-foreground'}`}>
                      {STATUS_ICONS[r.status] || <Package className="w-3.5 h-3.5" />} {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(r)} className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-20 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No deliveries found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-2xl rounded-2xl flex flex-col border shadow-2xl max-h-[90vh]">
            <div className="p-5 border-b flex justify-between items-center bg-muted/20 shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> {editId ? 'Edit Delivery' : 'Create Delivery'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors"><XCircle className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Tracking Number *</label>
                  <input required type="text" value={form.tracking_number} onChange={e => setForm({ ...form, tracking_number: e.target.value })} placeholder="e.g. TRK-00123-A" className="w-full h-11 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm font-mono uppercase" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Recipient Name *</label>
                  <input required type="text" value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} placeholder="e.g. Jane Smith" className="w-full h-11 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Delivery Address</label>
                <input type="text" value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })} placeholder="e.g. 123 Main St, Suite 4B, Auckland" className="w-full h-11 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-11 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm cursor-pointer">
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-5 border-t shrink-0">
                <button type="button" onClick={closeModal} className="h-11 px-6 bg-muted rounded-xl text-sm font-bold hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-11 px-6 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
                  {saving && <OrbitLoader size="sm" />}
                  {editId ? 'Save Changes' : 'Create Delivery'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
