import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { FileText, Plus, Search, Trash2, Edit2, Loader2, XCircle, Send, Download, Clock, CreditCard, AlertCircle, CheckCircle2, Eye, Link} from 'lucide-react';
import { toast} from 'react-hot-toast';
import { jsPDF} from 'jspdf';

const EMPTY_FORM = { 
  client_name: '', 
  client_email: '', 
  invoice_number: '', 
  amount: '0', 
  currency: 'USD', 
  status: 'Draft', 
  due_date: '', 
  issue_date: '', 
  notes: '',
  items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }]
};
const STATUS_COLORS = { Draft: 'bg-muted text-foreground border-primary/40', Sent: 'bg-blue-50 text-blue-700 border-blue-200', Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200', Overdue: 'bg-red-50 text-red-700 border-red-200', Cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200'};

export default function UnivInvoice() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [invoices, setInvoices] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('All');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [viewingInvoice, setViewingInvoice] = useState(null);
 const [form, setForm] = useState(EMPTY_FORM);

 useEffect(() => {
 if (companyId) {
 fetchInvoices();
 const ch = supabase.channel('inv_ch2').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_invoices', filter: `company_id=eq.${companyId}`}, fetchInvoices).subscribe();
 return () => supabase.removeChannel(ch);
}
}, [companyId]);

 const fetchInvoices = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_invoices WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setInvoices(data || []);
} catch (e) { console.error(e);} finally { setLoading(false);}
};

 const save = async (e) => {
 e.preventDefault();
 const payload = { ...form, invoice_number: form.invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}`};
 try {
 if (editingId) {
 await (async () => { const _payload = payload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_invoices SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]);})();
 const error = null; const data = [];
 if (error) throw error;
 toast.success('Invoice updated!');
} else {
 const { error} = await (async () => {
 const _payload = { ...payload, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_invoices (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Invoice created!');
}
 closeModal(); fetchInvoices();
} catch (err) { toast.error('Failed to save invoice');}
};

 const remove = async (id) => {
 await powerSync.execute(`DELETE FROM univ_invoices WHERE id = ?`, [id]);
 const error = null;
 if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchInvoices(); setViewingInvoice(null);}
};

 const updateStatus = async (id, status) => {
 await (async () => { const _payload = { status}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_invoices SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, id]);})();
 const error = null; const data = [];
 fetchInvoices();
};

 const openModal = (inv = null) => {
    if (inv) {
      let parsedItems = [{ description: 'Main Service / Line Item', quantity: 1, unit_price: Number(inv.amount) || 0, amount: Number(inv.amount) || 0 }];
      let cleanedNotes = inv.notes || '';
      try {
        if (cleanedNotes.includes('<!--ITEMS_JSON:')) {
          const match = cleanedNotes.match(/<!--ITEMS_JSON:(.*?)-->/);
          if (match && match[1]) {
            parsedItems = JSON.parse(match[1]);
            cleanedNotes = cleanedNotes.replace(/<!--ITEMS_JSON:.*?-->/, '').trim();
          }
        }
      } catch(e) {}
      setForm({ ...inv, notes: cleanedNotes, items: parsedItems });
    } else {
      setForm(EMPTY_FORM);
    }
    setEditingId(inv?.id || null);
    setIsModalOpen(true);
  };
 const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM);};
 const filtered = invoices.filter(i => `${i.invoice_number} ${i.client_name} ${i.client_email}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || i.status === statusFilter));

 const totalPaid = invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+Number(i.amount),0);
 const totalOutstanding = invoices.filter(i=>i.status==='Sent').reduce((s,i)=>s+Number(i.amount),0);
 const totalOverdue = invoices.filter(i=>i.status==='Overdue').reduce((s,i)=>s+Number(i.amount),0);

 
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

 const handleDownloadPDF = (inv) => {
 const doc = new jsPDF();
 doc.setFontSize(20);
 doc.text(`INVOICE: ${inv.invoice_number}`, 14, 22);
 doc.setFontSize(12);
 doc.text(`Client: ${inv.client_name}`, 14, 35);
 doc.text(`Email: ${inv.client_email || 'N/A'}`, 14, 42);
 doc.text(`Amount: $${Number(inv.amount || 0).toLocaleString()} ${inv.currency}`, 14, 49);
 doc.text(`Issue Date: ${inv.issue_date || 'N/A'}`, 14, 56);
 doc.text(`Due Date: ${inv.due_date || 'N/A'}`, 14, 63);
 doc.text(`Status: ${inv.status}`, 14, 70);
 if (inv.notes) {
 doc.text(`Notes: ${inv.notes}`, 14, 80);
}
 doc.save(`${inv.invoice_number}.pdf`);
};

 const handleCopyPaymentLink = (inv) => {
 const link = `https://pay.airflake.com/inv/${inv.id}`;
 navigator.clipboard.writeText(link);
 toast.success('Payment link copied to clipboard!');
};

 return (
 <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
 <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2 tracking-[-0.02em]"><FileText className="w-7 h-7 text-primary"/>Invoices</h1><p className="text-[#71717a] dark:text-gray-400 text-sm font-medium mt-1">Create, send and track invoices.</p></div>
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={()=>openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 "><Plus className="w-4 h-4"/>Create Invoice</button>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
 {[
 {label:'Total',value:invoices.length,icon:<FileText className="w-5 h-5"/>,ib:'bg-primary/10 text-primary'},
 {label:'Paid',value:`$${totalPaid.toLocaleString()}`,icon:<CheckCircle2 className="w-5 h-5"/>,ib:'bg-emerald-100 text-emerald-600'},
 {label:'Outstanding',value:`$${totalOutstanding.toLocaleString()}`,icon:<Clock className="w-5 h-5"/>,ib:'bg-amber-100 text-amber-600'},
 {label:'Overdue',value:`$${totalOverdue.toLocaleString()}`,icon:<AlertCircle className="w-5 h-5"/>,ib:'bg-red-100 text-red-600'},
 ].map((k,i)=>(
 <div key={i} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-2xl flex items-center gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.ib}`}>{k.icon}</div>
 <div><p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{k.label}</p><p className="text-lg font-black text-foreground">{k.value}</p></div>
 </div>
 ))}
 </div>

 <div className="flex flex-col sm:flex-row gap-3 shrink-0">
 <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400"/><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by client, invoice number..." className="w-full h-11 pl-10 pr-4 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"/></div>
 <div className="flex gap-2 shrink-0">
 {['All',...Object.keys(STATUS_COLORS)].map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-semibold border-[0.5px] border-black/9 dark:border-white/8 transition-all whitespace-nowrap ${statusFilter===s?'bg-primary text-white border-primary':'bg-card border-primary/40 text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}>{s}</button>)}
 </div>
 </div>

 <div className="flex-1 overflow-auto min-h-0 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl flex flex-col custom-scrollbar hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="grid grid-cols-12 gap-2 p-4 border-b border-primary/40 bg-muted/50 text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider shrink-0 tracking-[0.04em]">
 <div className="col-span-3">Client</div><div className="col-span-2">Invoice #</div><div className="col-span-2 text-right">Amount</div><div className="col-span-2">Due Date</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Actions</div>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
 : filtered.length===0 ? <div className="p-12 text-center text-[#71717a] dark:text-gray-400"><FileText className="w-12 h-12 mx-auto text-[#71717a] dark:text-gray-400/30 mb-3"/><p className="font-medium">No invoices found.</p></div>
 : filtered.map(inv=>(
 <div key={inv.id} className="grid grid-cols-12 gap-2 p-4 border-b border-primary/40 hover:bg-muted/30 transition-colors items-center group">
 <div className="col-span-3"><p className="font-semibold text-sm text-foreground">{inv.client_name}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{inv.client_email}</p></div>
 <div className="col-span-2 text-sm font-mono font-semibold text-foreground">{inv.invoice_number}</div>
 <div className="col-span-2 text-right font-black text-foreground">${Number(inv.amount||0).toLocaleString()} <span className="text-xs font-normal text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{inv.currency}</span></div>
 <div className="col-span-2 text-sm text-[#71717a] dark:text-gray-400">{inv.due_date||'—'}</div>
 <div className="col-span-2">
 <select value={inv.status} onChange={e=>updateStatus(inv.id,e.target.value)} className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-lg border-[0.5px] border-black/9 dark:border-white/8 cursor-pointer focus:outline-none ${STATUS_COLORS[inv.status]||'bg-muted border-primary/40'}`}>
 {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
 </select>
 </div>
 <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={()=>setViewingInvoice(inv)} className="p-1.5 bg-muted rounded-lg text-[#71717a] dark:text-gray-400 hover:text-primary"><Eye className="w-3.5 h-3.5"/></button>
 <button onClick={()=>openModal(inv)} className="p-1.5 bg-muted rounded-lg text-[#71717a] dark:text-gray-400 hover:text-primary"><Edit2 className="w-3.5 h-3.5"/></button>
 <button onClick={()=>remove(inv.id)} className="p-1.5 bg-red-50 rounded-lg text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
 </div>
 </div>
 ))}
 </div>
 </div>

 {viewingInvoice&&(
 <div className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setViewingInvoice(null)}>
 <div className="bg-card w-full max-w-md rounded-2xl p-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" onClick={e=>e.stopPropagation()}>
 <div className="flex justify-between items-center mb-4"><h3 className="font-black text-lg">Invoice Preview</h3><button onClick={()=>setViewingInvoice(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-[#71717a] dark:text-gray-400"/></button></div>
 <div className="space-y-3 text-sm">
 <div className="flex justify-between border-b border-primary/40 pb-3"><span className="text-[#71717a] dark:text-gray-400 font-semibold">Invoice #</span><span className="font-black font-mono">{viewingInvoice.invoice_number}</span></div>
 {[{label:'Client',value:viewingInvoice.client_name},{label:'Email',value:viewingInvoice.client_email},{label:'Issue Date',value:viewingInvoice.issue_date},{label:'Due Date',value:viewingInvoice.due_date}].map((f,i)=>f.value?<div key={i} className="flex justify-between"><span className="text-[#71717a] dark:text-gray-400">{f.label}</span><span className="font-semibold">{f.value}</span></div>:null)}
 <div className="flex justify-between"><span className="text-[#71717a] dark:text-gray-400">Status</span><span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${STATUS_COLORS[viewingInvoice.status]}`}>{viewingInvoice.status}</span></div>
 <div className="flex justify-between border-t border-primary/40 pt-3 mt-3"><span className="text-[#71717a] dark:text-gray-400 font-semibold">Amount</span><span className="text-xl font-black text-primary">${Number(viewingInvoice.amount||0).toLocaleString()} {viewingInvoice.currency}</span></div>
 {viewingInvoice.notes&&<div className="bg-muted/50 rounded-xl p-3 text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{viewingInvoice.notes}</div>}
 </div>
 <div className="flex gap-2 mt-5">
 <button onClick={()=>{handleCopyPaymentLink(viewingInvoice)}} className="flex-1 h-9 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-100"><Link className="w-3.5 h-3.5"/>Pay Link</button>
 <button onClick={()=>{openModal(viewingInvoice);setViewingInvoice(null);}} className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Edit2 className="w-3.5 h-3.5"/>Edit</button>
 <button onClick={()=>{handleDownloadPDF(viewingInvoice)}} className="flex-1 h-9 bg-muted rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Download className="w-3.5 h-3.5"/>PDF</button>
 </div>
 </div>
 </div>
 )}

 {isModalOpen&&(
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
 <div className="bg-card w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Invoice':'Create Invoice'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-[#71717a] dark:text-gray-400"><XCircle className="w-5 h-5"/></button></div>
 <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
 <div className="grid grid-cols-2 gap-4">
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Client Name *</label><input required type="text" value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Client Email</label><input type="email" value={form.client_email} onChange={e=>setForm({...form,client_email:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Invoice Number</label><input type="text" value={form.invoice_number} onChange={e=>setForm({...form,invoice_number:e.target.value})} placeholder="Auto-generated if blank" className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 
<div className="col-span-2 pt-2">
  <div className="flex justify-between items-center mb-2">
    <label className="text-xs font-bold uppercase tracking-wider text-primary">Invoice Line Items</label>
    <button
      type="button"
      onClick={() => setForm(f => ({ ...f, items: [...(f.items || []), { description: '', quantity: 1, unit_price: 0, amount: 0 }] }))}
      className="text-xs px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg flex items-center gap-1 transition-colors"
    >
      <Plus className="w-3 h-3" /> Add Item
    </button>
  </div>
  <div className="space-y-2 border border-border/80 rounded-xl p-3 bg-muted/20">
    {(form.items || []).map((lineItem, idx) => {
      const lineTotal = (Number(lineItem.quantity || 0) * Number(lineItem.unit_price || 0));
      return (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-card p-2 rounded-lg border border-border/60">
          <div className="col-span-5">
            <input
              placeholder="Item description / service..."
              required
              value={lineItem.description}
              onChange={(e) => {
                const val = e.target.value;
                setForm(f => {
                  const updated = [...(f.items || [])];
                  updated[idx] = { ...updated[idx], description: val };
                  return { ...f, items: updated };
                });
              }}
              className="w-full h-9 px-2.5 bg-background border border-border rounded-lg text-xs"
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              min="1"
              step="any"
              placeholder="Qty"
              required
              value={lineItem.quantity}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                setForm(f => {
                  const updated = [...(f.items || [])];
                  updated[idx] = { ...updated[idx], quantity: val, amount: val * Number(updated[idx].unit_price || 0) };
                  const newTotal = updated.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
                  return { ...f, items: updated, amount: String(newTotal.toFixed(2)) };
                });
              }}
              className="w-full h-9 px-2 bg-background border border-border rounded-lg text-xs text-right font-mono"
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              step="0.01"
              placeholder="Unit Rate"
              required
              value={lineItem.unit_price}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                setForm(f => {
                  const updated = [...(f.items || [])];
                  updated[idx] = { ...updated[idx], unit_price: val, amount: (Number(updated[idx].quantity || 0)) * val };
                  const newTotal = updated.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
                  return { ...f, items: updated, amount: String(newTotal.toFixed(2)) };
                });
              }}
              className="w-full h-9 px-2 bg-background border border-border rounded-lg text-xs text-right font-mono"
            />
          </div>
          <div className="col-span-2 text-right font-mono font-bold text-xs text-emerald-600">
            ${lineTotal.toFixed(2)}
          </div>
          <div className="col-span-1 flex justify-end">
            <button
              type="button"
              disabled={(form.items || []).length <= 1}
              onClick={() => {
                setForm(f => {
                  const updated = (f.items || []).filter((_, i) => i !== idx);
                  const newTotal = updated.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
                  return { ...f, items: updated, amount: String(newTotal.toFixed(2)) };
                });
              }}
              className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    })}
    <div className="flex justify-between items-center pt-2 px-1 text-xs font-semibold">
      <span className="text-muted-foreground">Total Computed Invoice Amount:</span>
      <span className="font-mono font-bold text-sm text-primary">
        ${((form.items || []).reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  </div>
</div>
<div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Total Amount ({form.currency}) *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm font-mono font-bold text-emerald-600"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Currency</label><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{['USD','EUR','GBP','GHS','NGN','KES','ZAR','CAD','AUD'].map(c=><option key={c}>{c}</option>)}</select></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Issue Date</label><input type="date" value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div className="col-span-2"><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Notes</label><textarea rows="3" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full p-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none"/></div>
 </div>
 <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-primary/40"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold ">{editingId?'Update Invoice':'Create Invoice'}</button></div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
