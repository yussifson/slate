import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { FileText, Plus, Search, Trash2, Edit2, Loader2, XCircle, Send, Download, Clock, CreditCard, AlertCircle, CheckCircle2, Eye, Link } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';

const EMPTY_FORM = { client_name: '', client_email: '', invoice_number: '', amount: '', currency: 'USD', status: 'Draft', due_date: '', issue_date: '', notes: '' };
const STATUS_COLORS = { Draft: 'bg-muted text-foreground border-border', Sent: 'bg-blue-50 text-blue-700 border-blue-200', Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200', Overdue: 'bg-red-50 text-red-700 border-red-200', Cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200' };

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
      const ch = supabase.channel('inv_ch2').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_invoices', filter: `company_id=eq.${companyId}` }, fetchInvoices).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('univ_invoices').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setInvoices(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, invoice_number: form.invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}` };
    try {
      if (editingId) {
        const { error } = await supabase.from('univ_invoices').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Invoice updated!');
      } else {
        const { error } = await supabase.from('univ_invoices').insert({ ...payload, company_id: companyId });
        if (error) throw error;
        toast.success('Invoice created!');
      }
      closeModal(); fetchInvoices();
    } catch (err) { toast.error('Failed to save invoice'); }
  };

  const remove = async (id) => {
    const { error } = await supabase.from('univ_invoices').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchInvoices(); setViewingInvoice(null); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from('univ_invoices').update({ status }).eq('id', id);
    fetchInvoices();
  };

  const openModal = (inv = null) => { setForm(inv ? { ...inv } : EMPTY_FORM); setEditingId(inv?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  const filtered = invoices.filter(i => `${i.invoice_number} ${i.client_name} ${i.client_email}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || i.status === statusFilter));

  const totalPaid = invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+Number(i.amount),0);
  const totalOutstanding = invoices.filter(i=>i.status==='Sent').reduce((s,i)=>s+Number(i.amount),0);
  const totalOverdue = invoices.filter(i=>i.status==='Overdue').reduce((s,i)=>s+Number(i.amount),0);

  
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

  const handleGeneratePDF = (inv) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`INVOICE ${inv.invoice_number}`, 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Client: ${inv.client_name}`, 20, 40);
    doc.text(`Email: ${inv.client_email}`, 20, 48);
    doc.text(`Issue Date: ${inv.issue_date || 'N/A'}`, 20, 56);
    doc.text(`Due Date: ${inv.due_date || 'N/A'}`, 20, 64);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`Amount Due: $${inv.amount} ${inv.currency}`, 20, 80);
    doc.setFontSize(12);
    doc.text(`Status: ${inv.status}`, 20, 88);
    
    doc.save(`Invoice_${inv.invoice_number}.pdf`);
  };

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><FileText className="w-7 h-7 text-primary"/>Invoices</h1><p className="text-muted-foreground text-sm font-medium mt-1">Create, send and track invoices.</p></div>
        <div className="flex items-center gap-2">

        
        <div className="flex bg-muted p-1 rounded-lg border border-border mr-2 hidden sm:flex">
          {["Default","Grid","Kanban","Calendar","Dashboard"].map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Invoice':'Create Invoice'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5"/></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client Name *</label><input required type="text" value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client Email</label><input type="email" value={form.client_email} onChange={e=>setForm({...form,client_email:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Invoice Number</label><input type="text" value={form.invoice_number} onChange={e=>setForm({...form,invoice_number:e.target.value})} placeholder="Auto-generated if blank" className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Amount *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Currency</label><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{['USD','EUR','GBP','GHS','NGN','KES','ZAR','CAD','AUD'].map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Issue Date</label><input type="date" value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label><textarea rows="3" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none"/></div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update Invoice':'Create Invoice'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
