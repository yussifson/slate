import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { ShoppingCart, Plus, Search, Trash2, Edit2, Loader2, XCircle, FileText, Truck} from 'lucide-react';
import { toast} from 'react-hot-toast';

const STATUS_COLORS = { Draft: 'bg-muted text-[#71717a] dark:text-gray-400 border-primary/40', Pending: 'bg-amber-50 text-amber-700 border-amber-200', Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200', 'PO Created': 'bg-blue-50 text-blue-700 border-blue-200', Canceled: 'bg-red-50 text-red-700 border-red-200'};
const WORKFLOW_STAGES = ['Draft', 'Pending', 'Approved', 'PO Created'];
const EMPTY_FORM = { po_number: '', supplier: '', total_amount: 0, status: 'Draft', order_date: new Date().toISOString().split('T')[0], expected_date: ''};

export default function UnivProcurement() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [records, setRecords] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [form, setForm] = useState(EMPTY_FORM);

 useEffect(() => {
 if (companyId) {
 fetchRecords();
 const ch = supabase.channel('procurement_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_procurement', filter: `company_id=eq.${companyId}`}, fetchRecords).subscribe();
 return () => supabase.removeChannel(ch);
}
}, [companyId]);

 const fetchRecords = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_procurement WHERE company_id = ? ORDER BY order_date DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setRecords(data || []);
} catch (e) { console.error(e);} finally { setLoading(false);}
};

 const saveRecord = async (e) => {
 e.preventDefault();
 try {
 const payload = { 
 company_id: companyId,
 po_number: form.po_number,
 supplier: form.supplier,
 total_amount: Number(form.total_amount) || 0,
 status: form.status,
 order_date: form.order_date || null,
 expected_date: form.expected_date || null
};
 
 if (editingId) {
 await (async () => { const _payload = payload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_procurement SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]);})();
 const error = null; const data = [];
 if (error) throw error;
 toast.success('Updated!');
} else {
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_procurement (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('PO added!');
}
 closeModal(); fetchRecords();
} catch (err) { console.error(err); toast.error(err.message || 'Failed to save');}
};

 const deleteRecord = async (id) => {
 await powerSync.execute(`DELETE FROM univ_procurement WHERE id = ?`, [id]);
 const error = null;
 if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchRecords();}
};

 const updateStatus = async (id, status) => {
 await (async () => { const _payload = { status}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_procurement SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, id]);})();
 const error = null; const data = [];
 if (error) toast.error('Failed to update status'); else fetchRecords();
};

 const advanceWorkflow = async (r) => {
 const currentIndex = WORKFLOW_STAGES.indexOf(r.status);
 if (currentIndex >= 0 && currentIndex < WORKFLOW_STAGES.length - 1) {
 await updateStatus(r.id, WORKFLOW_STAGES[currentIndex + 1]);
}
};

 const openModal = (r = null) => { 
 if (r) {
 setForm({
 po_number: r.po_number,
 supplier: r.supplier,
 total_amount: r.total_amount || 0,
 status: r.status,
 order_date: r.order_date || '',
 expected_date: r.expected_date || ''
});
} else {
 setForm({ ...EMPTY_FORM, po_number: `PO-${Math.floor(Math.random()*10000)}`});
}
 setEditingId(r?.id || null); 
 setIsModalOpen(true); 
};
 const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM);};

 const filtered = records.filter(r => {
 return `${r.po_number} ${r.supplier} ${r.status}`.toLowerCase().includes(search.toLowerCase());
});

 
 const handleExport = () => {
 const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
 if (!exportData || exportData.length === 0) return alert('No data to export');
 const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
 const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'export.csv'; a.click();
};

 return (
 <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
 <div>
 <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-[#005A9C]" /> Procurement</h1>
 <p className="text-muted-foreground text-xs font-medium mt-0.5">{filtered.length} commercial purchase orders & vendor requests</p>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={handleExport} className="h-9 px-3.5 bg-muted text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-muted/80 transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">Export</span>
 </button>

 <button onClick={() => openModal()} className="h-9 px-3.5 bg-[#005A9C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#00477D] transition-colors"><Plus className="w-4 h-4" /> Create PO</button>
 </div>
 </div>

 <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex gap-3 shrink-0">
 <div className="relative flex-1">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search POs or suppliers..." className="w-full h-9.5 pl-9 pr-4 bg-background border border-border/80 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-xs" />
 </div>
 </div>

 <div className="space-y-3 flex-1 min-h-0">
 {/* Mobile Native Card View (< md) */}
 <div className="md:hidden space-y-2.5 overflow-y-auto">
 {loading ? (
 <div className="p-8 text-center"><Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" /></div>
 ) : filtered.length === 0 ? (
 <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">No purchase orders found.</div>
 ) : (
 filtered.map(r => (
 <div key={r.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0 flex-1">
 <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{r.po_number}</span>
 <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{r.supplier}</h4>
 </div>
 <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[r.status] || 'bg-muted text-muted-foreground'}`}>
 {r.status}
 </span>
 </div>

 <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
 <span className="font-mono font-black text-sm text-foreground">
 ${Number(r.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
 </span>
 <span className="text-[11px] text-muted-foreground">Expected: {r.expected_date || '—'}</span>
 </div>

 <div className="flex items-center justify-between pt-1 border-t border-border/40">
 <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className="text-[11px] font-bold px-2 py-1 rounded-lg bg-muted border border-border">
 {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
 </select>

 <div className="flex items-center gap-1.5">
 <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-lg text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
 <button onClick={() => deleteRecord(r.id)} className="p-1.5 bg-rose-500/10 rounded-lg text-rose-600 hover:text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Desktop Table (>= md) */}
 <div className="hidden md:flex flex-1 bg-card border border-border/80 rounded-[22px] overflow-hidden flex-col min-h-0 shadow-xs">
 <div className="overflow-auto flex-1 custom-scrollbar">
 <table className="w-full text-xs">
 <thead className="bg-muted/50 border-b border-border/80 sticky top-0 z-10 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
 <tr>
 {['PO Number', 'Supplier', 'Amount', 'Order Date', 'Expected', 'Status', 'Actions'].map((h, i) => (
 <th key={i} className="p-3.5 text-left tracking-wider whitespace-nowrap">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-border/60">
 {loading ? (
 <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" /></td></tr>
 ) : filtered.length === 0 ? (
 <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No purchase orders found.</td></tr>
 ) : (
 filtered.map(r => (
 <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
 <td className="p-3.5"><div className="flex items-center gap-2"><span className="font-bold font-mono text-foreground">{r.po_number}</span></div></td>
 <td className="p-3.5 text-foreground font-bold">{r.supplier}</td>
 <td className="p-3.5 font-black text-foreground font-mono">${Number(r.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
 <td className="p-3.5 text-muted-foreground whitespace-nowrap">{r.order_date || '—'}</td>
 <td className="p-3.5 text-muted-foreground whitespace-nowrap">{r.expected_date || '—'}</td>
 <td className="p-3.5">
 <div className="flex flex-col gap-1">
 <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className={`px-2 py-0.5 w-max rounded-lg text-[10px] font-bold uppercase tracking-wider border outline-none cursor-pointer ${STATUS_COLORS[r.status] || 'bg-muted text-muted-foreground'}`}>
 {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 {WORKFLOW_STAGES.indexOf(r.status) >= 0 && WORKFLOW_STAGES.indexOf(r.status) < WORKFLOW_STAGES.length - 1 && (
 <button onClick={() => advanceWorkflow(r)} className="text-[10px] font-bold text-primary hover:underline text-left">
 Approve &rarr; {WORKFLOW_STAGES[WORKFLOW_STAGES.indexOf(r.status) + 1]}
 </button>
 )}
 </div>
 </td>
 <td className="p-3.5">
 <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
 <button onClick={() => deleteRecord(r.id)} className="p-1.5 bg-rose-500/10 rounded-lg text-rose-600 hover:text-rose-700 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
 <div className="bg-card w-full max-w-md rounded-2xl flex flex-col overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <h2 className="text-xl font-black text-foreground flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" /> {editingId ? 'Edit PO' : 'Create PO'}</h2>
 <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full text-[#71717a] dark:text-gray-400 transition-colors"><XCircle className="w-5 h-5" /></button>
 </div>
 <form onSubmit={saveRecord} className="p-5 flex flex-col gap-4">
 <div className="grid grid-cols-2 gap-4">
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">PO Number *</label><input required type="text" value={form.po_number} onChange={e => setForm({...form, po_number: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm font-mono" /></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Supplier *</label><div className="relative"><Truck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" /><input required type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full h-10 pl-9 pr-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div></div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Total Amount *</label><input required type="number" step="0.01" value={form.total_amount} onChange={e => setForm({...form, total_amount: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Order Date</label><input type="date" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Expected Date</label><input type="date" value={form.expected_date} onChange={e => setForm({...form, expected_date: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
 </div>
 
 <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-primary/40">
 <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
 <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">{editingId ? 'Update' : 'Save PO'}</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
