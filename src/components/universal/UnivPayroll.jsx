import React, { useState } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, Plus, Search, Trash2, Edit2, Loader2, XCircle,
  Users, CheckCircle2, Clock, AlertCircle, Download, Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  employee_name: '', employee_id: '', period_start: '', period_end: '',
  base_salary: '', bonuses: '0', deductions: '0', status: 'Draft', payment_date: '', notes: ''
};

const STATUS_COLORS = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
};

export default function UnivPayroll() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ['univ_payroll', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_payroll').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const savePayroll = useMutation({
    mutationFn: async (payload) => {
      const net_pay = (Number(payload.base_salary) + Number(payload.bonuses || 0)) - Number(payload.deductions || 0);
      const data = { ...payload, net_pay };
      if (editingId) return base44.db.from('univ_payroll').update(data).eq('id', editingId);
      return base44.db.from('univ_payroll').insert([{ ...data, company_id: companyId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_payroll']);
      toast.success(editingId ? 'Payroll updated!' : 'Payroll entry created!');
      closeModal();
    },
    onError: () => toast.error('Failed to save payroll entry')
  });

  const deletePayroll = useMutation({
    mutationFn: async (id) => base44.db.from('univ_payroll').delete().eq('id', id),
    onSuccess: () => { queryClient.invalidateQueries(['univ_payroll']); toast.success('Entry deleted'); },
    onError: () => toast.error('Failed to delete')
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => base44.db.from('univ_payroll').update({ status }).eq('id', id),
    onSuccess: () => queryClient.invalidateQueries(['univ_payroll'])
  });

  const openModal = (p = null) => {
    setForm(p ? { ...p } : EMPTY_FORM);
    setEditingId(p?.id || null);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = payrolls.filter(p => {
    const matchSearch = `${p.employee_name} ${p.period_start} ${p.period_end}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaidOut = payrolls.filter(p => p.status === 'Paid').reduce((s, p) => s + Number(p.net_pay || 0), 0);
  const pendingCount = payrolls.filter(p => p.status === 'Draft' || p.status === 'Processing').length;
  const netPay = (f) => (Number(f.base_salary || 0) + Number(f.bonuses || 0)) - Number(f.deductions || 0);

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-primary" /> Payroll
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Process and manage employee payroll.</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Payroll Entry
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total Entries', value: payrolls.length, icon: <Users className="w-5 h-5" />, iconBg: 'bg-primary/10 text-primary' },
          { label: 'Paid Out', value: `$${totalPaidOut.toLocaleString()}`, icon: <CheckCircle2 className="w-5 h-5" />, iconBg: 'bg-emerald-100 text-emerald-600' },
          { label: 'Pending', value: pendingCount, icon: <Clock className="w-5 h-5" />, iconBg: 'bg-amber-100 text-amber-600' },
          { label: 'Failed', value: payrolls.filter(p => p.status === 'Failed').length, icon: <AlertCircle className="w-5 h-5" />, iconBg: 'bg-red-100 text-red-600' },
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.iconBg}`}>{k.icon}</div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <p className="text-xl font-black text-foreground">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee name or pay period..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
        </div>
        <div className="flex gap-2 shrink-0">
          {['All', ...Object.keys(STATUS_COLORS)].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-bold border transition-all ${statusFilter === s ? 'bg-primary text-white border-primary shadow-sm' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-3">Employee</div>
          <div className="col-span-2">Pay Period</div>
          <div className="col-span-2 text-right">Base Salary</div>
          <div className="col-span-1 text-right">Bonuses</div>
          <div className="col-span-1 text-right">Deductions</div>
          <div className="col-span-1 text-right">Net Pay</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No payroll entries found.</p>
            </div>
          ) : filtered.map(p => (
            <div key={p.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-3">
                <p className="font-bold text-sm text-foreground">{p.employee_name}</p>
                {p.payment_date && <p className="text-xs text-muted-foreground">Paid: {p.payment_date}</p>}
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                {p.period_start} → {p.period_end}
              </div>
              <div className="col-span-2 text-right text-sm font-bold text-foreground">${Number(p.base_salary || 0).toLocaleString()}</div>
              <div className="col-span-1 text-right text-sm text-emerald-600 font-medium">+${Number(p.bonuses || 0).toLocaleString()}</div>
              <div className="col-span-1 text-right text-sm text-red-500 font-medium">-${Number(p.deductions || 0).toLocaleString()}</div>
              <div className="col-span-1 text-right text-sm font-black text-primary">${Number(p.net_pay || 0).toLocaleString()}</div>
              <div className="col-span-1">
                <select value={p.status} onChange={e => updateStatus.mutate({ id: p.id, status: e.target.value })} className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none ${STATUS_COLORS[p.status] || 'bg-muted'}`}>
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(p)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deletePayroll.mutate(p.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black">{editingId ? 'Edit Payroll Entry' : 'New Payroll Entry'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); savePayroll.mutate(form); }} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Employee Name *</label>
                  <input required type="text" value={form.employee_name} onChange={e => setForm({...form, employee_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Period Start *</label>
                  <input required type="date" value={form.period_start} onChange={e => setForm({...form, period_start: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Period End *</label>
                  <input required type="date" value={form.period_end} onChange={e => setForm({...form, period_end: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Base Salary ($) *</label>
                  <input required type="number" min="0" step="0.01" value={form.base_salary} onChange={e => setForm({...form, base_salary: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Bonuses ($)</label>
                  <input type="number" min="0" step="0.01" value={form.bonuses} onChange={e => setForm({...form, bonuses: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Deductions ($)</label>
                  <input type="number" min="0" step="0.01" value={form.deductions} onChange={e => setForm({...form, deductions: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Payment Date</label>
                  <input type="date" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div className="col-span-2 p-3 bg-muted/40 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground">Calculated Net Pay</span>
                  <span className="text-lg font-black text-primary">${netPay(form).toLocaleString()}</span>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label>
                  <textarea rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={savePayroll.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">
                  {savePayroll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
