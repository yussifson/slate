import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { ShoppingCart, Plus, Search, Trash2, Edit2, Loader2, XCircle, FileText, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = { Draft: 'bg-muted text-muted-foreground border-border', Pending: 'bg-amber-50 text-amber-700 border-amber-200', Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200', 'PO Created': 'bg-blue-50 text-blue-700 border-blue-200', Canceled: 'bg-red-50 text-red-700 border-red-200' };
const WORKFLOW_STAGES = ['Draft', 'Pending', 'Approved', 'PO Created'];
const EMPTY_FORM = { po_number: '', supplier: '', total_amount: 0, status: 'Draft', order_date: new Date().toISOString().split('T')[0], expected_date: '' };

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
      const ch = supabase.channel('procurement_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_procurement', filter: `company_id=eq.${companyId}` }, fetchRecords).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('univ_procurement').select('*').eq('company_id', companyId).order('order_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setRecords(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
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
        const { error } = await supabase.from('univ_procurement').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Updated!');
      } else {
        const { error } = await supabase.from('univ_procurement').insert(payload);
        if (error) throw error;
        toast.success('PO added!');
      }
      closeModal(); fetchRecords();
    } catch (err) { console.error(err); toast.error(err.message || 'Failed to save'); }
  };

  const deleteRecord = async (id) => {
    const { error } = await supabase.from('univ_procurement').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchRecords(); }
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('univ_procurement').update({ status }).eq('id', id);
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
      setForm({ ...EMPTY_FORM, po_number: `PO-${Math.floor(Math.random()*10000)}` });
    }
    setEditingId(r?.id || null); 
    setIsModalOpen(true); 
  };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = records.filter(r => {
    return `${r.po_number} ${r.supplier} ${r.status}`.toLowerCase().includes(search.toLowerCase());
  });

  
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
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><ShoppingCart className="w-7 h-7 text-primary" /> Procurement</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage purchase orders and supplier requests.</p>
        </div>
        <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"><Plus className="w-4 h-4" /> Create PO</button>
      </div>
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search POs or suppliers..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
              <tr>
                {['PO Number', 'Supplier', 'Amount', 'Order Date', 'Expected', 'Status', 'Actions'].map((h, i) => (
                  <th key={i} className="p-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No purchase orders found.</td></tr>
              ) : (
                filtered.map(r => {
                  return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"><FileText className="w-4 h-4" /></div><span className="font-bold text-foreground">{r.po_number}</span></div></td>
                    <td className="p-4 text-foreground font-medium">{r.supplier}</td>
                    <td className="p-4 font-black">${Number(r.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{r.order_date || '—'}</td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{r.expected_date || '—'}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className={`px-2 py-0.5 w-max rounded-full text-[10px] font-bold uppercase tracking-wider border outline-none cursor-pointer ${STATUS_COLORS[r.status] || 'bg-muted text-muted-foreground'}`}>
                          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {WORKFLOW_STAGES.indexOf(r.status) >= 0 && WORKFLOW_STAGES.indexOf(r.status) < WORKFLOW_STAGES.length - 1 && (
                          <button onClick={() => advanceWorkflow(r)} className="text-[10px] font-bold text-primary hover:underline text-left mt-1">
                            Approve &rarr; {WORKFLOW_STAGES[WORKFLOW_STAGES.indexOf(r.status) + 1]}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteRecord(r.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" /> {editingId ? 'Edit PO' : 'Create PO'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveRecord} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">PO Number *</label><input required type="text" value={form.po_number} onChange={e => setForm({...form, po_number: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm font-mono" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Supplier *</label><div className="relative"><Truck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input required type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Total Amount *</label><input required type="number" step="0.01" value={form.total_amount} onChange={e => setForm({...form, total_amount: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Order Date</label><input type="date" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Expected Date</label><input type="date" value={form.expected_date} onChange={e => setForm({...form, expected_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
              </div>
              
              <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">{editingId ? 'Update' : 'Save PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
