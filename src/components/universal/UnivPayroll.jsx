import React, { useState, useEffect } from 'react';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { DollarSign, Plus, Search, Trash2, Edit2, Loader2, XCircle, CheckCircle2, Clock, FileText, Download, CheckSquare, Square, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { employee_name: '', period_start: '', period_end: '', basic_salary: 0, allowances: 0, deductions: 0, status: 'Draft', payment_date: '' };
const STATUS_COLORS = { Draft: 'bg-muted text-foreground border-border', Processed: 'bg-blue-50 text-blue-700 border-blue-200', Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

export default function UnivPayroll() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [selectedIds, setSelectedIds] = useState([]);
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchData();
      const ch = supabase.channel('pay_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_payroll', filter: `company_id=eq.${companyId}` }, fetchData).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('univ_payroll').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setPayrolls(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    const net_pay = Number(form.basic_salary) + Number(form.allowances) - Number(form.deductions);
    
    // Clean and prepare the payload
    const { id, created_at, updated_at, ...cleanForm } = form;
    const payload = {
      ...cleanForm,
      net_pay,
      payment_date: form.payment_date || null,
      period_start: form.period_start || null,
      period_end: form.period_end || null
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('univ_payroll').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Payroll updated!');
      } else {
        const { error } = await supabase.from('univ_payroll').insert({ ...payload, company_id: companyId });
        if (error) throw error;
        toast.success('Payroll created!');
      }
      closeModal(); fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const remove = async (id) => {
    const { error } = await supabase.from('univ_payroll').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchData(); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from('univ_payroll').update({ status }).eq('id', id);
    fetchData();
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  
  const filtered = payrolls.filter(p => `${p.employee_name}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || p.status === statusFilter));

  const totalPayroll = payrolls.reduce((s, p) => s + Number(p.net_pay || 0), 0);
  const paidPayroll = payrolls.filter(p=>p.status==='Paid').reduce((s, p) => s + Number(p.net_pay || 0), 0);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const { error } = await supabase.from('univ_payroll')
        .update({ status: 'Processed' })
        .in('id', selectedIds)
        .eq('status', 'Draft');
      if (error) throw error;
      toast.success(`Processed ${selectedIds.length} payrolls!`);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error('Bulk update failed');
    }
  };

  const handleExport = () => {
    const exportData = filtered;
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'payroll_export.csv'; a.click();
  };

  const previewRecord = payrolls.find(p => p.id === previewId);

  return (
    <div className={`h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><DollarSign className="w-7 h-7 text-primary"/>Payroll</h1><p className="text-muted-foreground text-sm font-medium mt-1">Manage employee salaries and payslips.</p></div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4"/>Add Payroll Entry</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          {label:'Total Payroll Value',value:`$${totalPayroll.toLocaleString()}`,icon:<DollarSign className="w-5 h-5"/>,ib:'bg-blue-100 text-blue-600'},
          {label:'Total Paid',value:`$${paidPayroll.toLocaleString()}`,icon:<CheckCircle2 className="w-5 h-5"/>,ib:'bg-emerald-100 text-emerald-600'},
          {label:'Drafts',value:payrolls.filter(p=>p.status==='Draft').length,icon:<FileText className="w-5 h-5"/>,ib:'bg-muted text-muted-foreground'},
          {label:'Processed',value:payrolls.filter(p=>p.status==='Processed').length,icon:<Clock className="w-5 h-5"/>,ib:'bg-amber-100 text-amber-600'},
        ].map((k,i)=>(
          <div key={i} className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.ib}`}>{k.icon}</div>
            <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-lg font-black text-foreground">{k.value}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0 items-center justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm"/></div>
          <div className="flex gap-2 shrink-0">
            {['All',...Object.keys(STATUS_COLORS)].map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${statusFilter===s?'bg-primary text-white border-primary':'bg-card border-border text-muted-foreground hover:text-foreground'}`}>{s}</button>)}
          </div>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-card p-2 rounded-xl border border-border shadow-sm">
            <span className="text-sm font-bold text-muted-foreground ml-2">{selectedIds.length} selected</span>
            <button onClick={handleBulkApprove} className="h-9 px-4 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Bulk Process</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0 items-center">
          <div className="cursor-pointer" onClick={toggleSelectAll}>
            {selectedIds.length > 0 && selectedIds.length === filtered.length ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
          </div>
          <div>Employee</div><div>Period</div><div className="text-right">Net Pay</div><div>Status</div><div className="text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          : filtered.length===0 ? <div className="p-12 text-center text-muted-foreground"><DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3"/><p className="font-medium">No payroll records found.</p></div>
          : filtered.map(p=>(
            <div key={p.id} className={`grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group ${selectedIds.includes(p.id) ? 'bg-primary/5' : ''}`}>
              <div className="cursor-pointer" onClick={() => toggleSelect(p.id)}>
                {selectedIds.includes(p.id) ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="font-bold text-sm text-foreground">{p.employee_name}</div>
              <div className="text-sm text-muted-foreground">{p.period_start} to {p.period_end}</div>
              <div className="text-right font-black text-foreground">${Number(p.net_pay||0).toLocaleString()}</div>
              <div>
                <select value={p.status} onChange={e=>updateStatus(p.id,e.target.value)} className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none ${STATUS_COLORS[p.status]||'bg-muted border-border'}`}>
                  {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setPreviewId(p.id)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Eye className="w-3.5 h-3.5"/></button>
                <button onClick={()=>openModal(p)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5"/></button>
                <button onClick={()=>remove(p.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Payroll':'Create Payroll Entry'}</h2><button onClick={closeModal} className="p-2 hover:bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5"/></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Employee Name *</label><input required type="text" value={form.employee_name} onChange={e=>setForm({...form,employee_name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Period Start *</label><input required type="date" value={form.period_start} onChange={e=>setForm({...form,period_start:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Period End *</label><input required type="date" value={form.period_end} onChange={e=>setForm({...form,period_end:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Basic Salary ($) *</label><input required type="number" min="0" step="0.01" value={form.basic_salary} onChange={e=>setForm({...form,basic_salary:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Allowances ($)</label><input type="number" min="0" step="0.01" value={form.allowances} onChange={e=>setForm({...form,allowances:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Deductions ($)</label><input type="number" min="0" step="0.01" value={form.deductions} onChange={e=>setForm({...form,deductions:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Payment Date</label><input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
              </div>
              <div className="bg-muted p-4 rounded-xl mt-6 flex justify-between items-center">
                <span className="font-bold text-muted-foreground">Calculated Net Pay:</span>
                <span className="text-xl font-black text-foreground">${(Number(form.basic_salary)+Number(form.allowances)-Number(form.deductions)).toLocaleString()}</span>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update Payroll':'Create Payroll'}</button></div>
            </form>
          </div>
        </div>
      )}

      {previewId && previewRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-black w-full max-w-xl rounded-xl shadow-2xl p-8 relative">
            <button onClick={() => setPreviewId(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"><XCircle className="w-6 h-6" /></button>
            <div className="flex justify-between items-end border-b-2 border-gray-200 pb-6 mb-6">
              <div>
                <h2 className="text-3xl font-black uppercase text-gray-900">Payslip</h2>
                <p className="text-gray-500 font-medium mt-1">Period: {previewRecord.period_start} to {previewRecord.period_end}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800 text-lg">{previewRecord.employee_name}</p>
                <p className="text-sm text-gray-500 mt-1">Status: <span className="uppercase font-bold text-blue-600">{previewRecord.status}</span></p>
              </div>
            </div>
            
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Basic Salary</span>
                <span className="text-gray-900 font-bold">${Number(previewRecord.basic_salary || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between p-3 bg-emerald-50 text-emerald-900 rounded-lg">
                <span>Allowances</span>
                <span className="font-bold">+ ${Number(previewRecord.allowances || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between p-3 bg-red-50 text-red-900 rounded-lg">
                <span>Deductions</span>
                <span className="font-bold">- ${Number(previewRecord.deductions || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-900 text-white rounded-lg mt-6">
                <span className="text-lg font-bold uppercase">Net Pay</span>
                <span className="text-2xl font-black">${Number(previewRecord.net_pay || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
               <button className="h-10 px-5 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2">
                 <Download className="w-4 h-4" /> Download PDF
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
