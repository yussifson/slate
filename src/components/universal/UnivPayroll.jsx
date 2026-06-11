import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { DollarSign, Plus, Search, Trash2, Edit2, Loader2, XCircle, CheckCircle2, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const EMPTY_FORM = { employee_name: '', period_start: '', period_end: '', basic_salary: 0, allowances: 0, deductions: 0, tax_rate: 15, status: 'Draft', payment_date: '' };
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
    const gross = Number(form.basic_salary) + Number(form.allowances);
    const calculated_tax = gross * (Number(form.tax_rate) / 100);
    const net_pay = gross - Number(form.deductions) - calculated_tax;
    
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

  const handleDownloadPayslip = (p) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`PAYSLIP: ${p.employee_name}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Period: ${p.period_start} to ${p.period_end}`, 14, 35);
    doc.text(`Payment Date: ${p.payment_date || 'Pending'}`, 14, 42);
    doc.text(`Basic Salary: $${Number(p.basic_salary || 0).toLocaleString()}`, 14, 56);
    doc.text(`Allowances: $${Number(p.allowances || 0).toLocaleString()}`, 14, 63);
    doc.text(`Deductions: $${Number(p.deductions || 0).toLocaleString()}`, 14, 70);
    doc.text(`Tax (${p.tax_rate || 0}%): $${Number(p.tax_amount || 0).toLocaleString()}`, 14, 77);
    doc.setFontSize(14);
    doc.text(`Net Pay: $${Number(p.net_pay || 0).toLocaleString()}`, 14, 95);
    doc.save(`Payslip_${p.employee_name.replace(/\s+/g,'_')}.pdf`);
  };

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><DollarSign className="w-7 h-7 text-primary"/>Payroll</h1><p className="text-muted-foreground text-sm font-medium mt-1">Manage employee salaries and payslips.</p></div>
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
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={()=>openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4"/>Add Payroll Entry</button>
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

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm"/></div>
        <div className="flex gap-2 shrink-0">
          {['All',...Object.keys(STATUS_COLORS)].map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${statusFilter===s?'bg-primary text-white border-primary':'bg-card border-border text-muted-foreground hover:text-foreground'}`}>{s}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-3">Employee</div><div className="col-span-3">Period</div><div className="col-span-2 text-right">Net Pay</div><div className="col-span-2">Status</div><div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          : filtered.length===0 ? <div className="p-12 text-center text-muted-foreground"><DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3"/><p className="font-medium">No payroll records found.</p></div>
          : filtered.map(p=>(
            <div key={p.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-3 font-bold text-sm text-foreground">{p.employee_name}</div>
              <div className="col-span-3 text-sm text-muted-foreground">{p.period_start} to {p.period_end}</div>
              <div className="col-span-2 text-right font-black text-foreground">${Number(p.net_pay||0).toLocaleString()}</div>
              <div className="col-span-2">
                <select value={p.status} onChange={e=>updateStatus(p.id,e.target.value)} className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none ${STATUS_COLORS[p.status]||'bg-muted border-border'}`}>
                  {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={()=>handleDownloadPayslip(p)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Download className="w-3.5 h-3.5"/></button>
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
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Payroll':'Create Payroll Entry'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5"/></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Employee Name *</label><input required type="text" value={form.employee_name} onChange={e=>setForm({...form,employee_name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Period Start *</label><input required type="date" value={form.period_start} onChange={e=>setForm({...form,period_start:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Period End *</label><input required type="date" value={form.period_end} onChange={e=>setForm({...form,period_end:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Basic Salary ($) *</label><input required type="number" min="0" step="0.01" value={form.basic_salary} onChange={e=>setForm({...form,basic_salary:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Allowances ($)</label><input type="number" min="0" step="0.01" value={form.allowances} onChange={e=>setForm({...form,allowances:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Deductions ($)</label><input type="number" min="0" step="0.01" value={form.deductions} onChange={e=>setForm({...form,deductions:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Tax Rate (%)</label><input type="number" min="0" max="100" step="0.1" value={form.tax_rate || 15} onChange={e=>setForm({...form,tax_rate:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Payment Date</label><input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
              </div>
              <div className="bg-muted p-4 rounded-xl mt-6 flex justify-between items-center">
                <span className="font-bold text-muted-foreground">Calculated Net Pay:</span>
                <span className="text-xl font-black text-foreground">
                  ${( (Number(form.basic_salary) + Number(form.allowances)) - Number(form.deductions) - ((Number(form.basic_salary) + Number(form.allowances)) * (Number(form.tax_rate||15)/100)) ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update Payroll':'Create Payroll'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
