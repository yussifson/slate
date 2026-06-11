import React, { useState } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Plus, Search, Trash2, Edit2, Loader2, XCircle,
  Send, Download, Clock, CreditCard, AlertCircle, CheckCircle2, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  client_name: '', client_email: '', invoice_number: '', amount: '', currency: 'USD',
  status: 'Draft', due_date: '', issue_date: '', notes: '', tax: 0
};

const STATUS_COLORS = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Sent: 'bg-blue-50 text-blue-700 border-blue-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
  Cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export default function UnivInvoice() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['univ_invoices', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_invoices').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const saveInvoice = useMutation({
    mutationFn: async (payload) => {
      const data = {
        ...payload,
        invoice_number: payload.invoice_number || `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      };
      if (editingId) return base44.db.from('univ_invoices').update(data).eq('id', editingId);
      return base44.db.from('univ_invoices').insert([{ ...data, company_id: companyId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_invoices']);
      toast.success(editingId ? 'Invoice updated!' : 'Invoice created!');
      closeModal();
    },
    onError: () => toast.error('Failed to save invoice')
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id) => base44.db.from('univ_invoices').delete().eq('id', id),
    onSuccess: () => { queryClient.invalidateQueries(['univ_invoices']); toast.success('Invoice deleted'); setViewingInvoice(null); },
    onError: () => toast.error('Failed to delete')
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => base44.db.from('univ_invoices').update({ status }).eq('id', id),
    onSuccess: () => queryClient.invalidateQueries(['univ_invoices'])
  });

  const openModal = (inv = null) => {
    setForm(inv ? { ...inv } : EMPTY_FORM);
    setEditingId(inv?.id || null);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = invoices.filter(i => {
    const matchSearch = `${i.invoice_number} ${i.client_name} ${i.client_email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + Number(i.amount), 0);
  const totalOutstanding = invoices.filter(i => i.status === 'Sent').reduce((s, i) => s + Number(i.amount), 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" /> Invoices
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Create, send and track invoices.</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total Invoices', value: invoices.length, sub: '', icon: <FileText className="w-5 h-5" />, iconBg: 'bg-primary/10 text-primary' },
          { label: 'Paid', value: `$${totalPaid.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'Paid').length} invoices`, icon: <CheckCircle2 className="w-5 h-5" />, iconBg: 'bg-emerald-100 text-emerald-600' },
          { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'Sent').length} sent`, icon: <Clock className="w-5 h-5" />, iconBg: 'bg-amber-100 text-amber-600' },
          { label: 'Overdue', value: `$${totalOverdue.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'Overdue').length} overdue`, icon: <AlertCircle className="w-5 h-5" />, iconBg: 'bg-red-100 text-red-600' },
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.iconBg}`}>{k.icon}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <p className="text-lg font-black text-foreground truncate">{k.value}</p>
              {k.sub && <p className="text-[10px] text-muted-foreground">{k.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client, invoice number..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
        </div>
        <div className="flex gap-2 shrink-0">
          {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-bold border transition-all ${statusFilter === s ? 'bg-primary text-white border-primary shadow-sm' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Invoice #</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No invoices found.</p>
            </div>
          ) : filtered.map(inv => (
            <div key={inv.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-3">
                <p className="font-bold text-sm text-foreground">{inv.client_name}</p>
                <p className="text-xs text-muted-foreground">{inv.client_email}</p>
              </div>
              <div className="col-span-2 text-sm font-mono font-bold text-foreground">{inv.invoice_number}</div>
              <div className="col-span-2 text-right font-black text-foreground">
                ${Number(inv.amount || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{inv.currency}</span>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">{inv.due_date || '—'}</div>
              <div className="col-span-2">
                <select
                  value={inv.status}
                  onChange={e => updateStatus.mutate({ id: inv.id, status: e.target.value })}
                  className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none ${STATUS_COLORS[inv.status] || 'bg-muted text-foreground border-border'}`}
                >
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setViewingInvoice(inv)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-foreground"><Eye className="w-3.5 h-3.5" /></button>
                <button onClick={() => openModal(inv)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteInvoice.mutate(inv.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Preview Drawer */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewingInvoice(null)}>
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg">Invoice Preview</h3>
              <button onClick={() => setViewingInvoice(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground font-bold">Invoice #</span>
                <span className="font-black font-mono">{viewingInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span className="font-bold">{viewingInvoice.client_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-bold">{viewingInvoice.client_email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Issue Date</span><span className="font-bold">{viewingInvoice.issue_date || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span className="font-bold">{viewingInvoice.due_date || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${STATUS_COLORS[viewingInvoice.status]}`}>{viewingInvoice.status}</span></div>
              <div className="flex justify-between border-t border-border pt-3 mt-3">
                <span className="text-muted-foreground font-bold">Amount</span>
                <span className="text-xl font-black text-primary">${Number(viewingInvoice.amount || 0).toLocaleString()} {viewingInvoice.currency}</span>
              </div>
              {viewingInvoice.notes && <div className="bg-muted/50 rounded-xl p-3 text-muted-foreground text-xs">{viewingInvoice.notes}</div>}
            </div>
            <div className="flex gap-2 mt-5">
              <button className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1"><Send className="w-3.5 h-3.5" /> Send</button>
              <button className="flex-1 h-9 bg-muted rounded-xl text-sm font-bold flex items-center justify-center gap-1"><Download className="w-3.5 h-3.5" /> PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black">{editingId ? 'Edit Invoice' : 'Create Invoice'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveInvoice.mutate(form); }} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client Name *</label>
                  <input required type="text" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client Email</label>
                  <input type="email" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Invoice Number</label>
                  <input type="text" value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} placeholder="Auto-generated if blank" className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Amount *</label>
                  <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Currency</label>
                  <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    {['USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'ZAR', 'CAD', 'AUD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Issue Date</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm({...form, issue_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label>
                  <textarea rows="3" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" placeholder="Payment terms, additional info..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saveInvoice.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">
                  {saveInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
