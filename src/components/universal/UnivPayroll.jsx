import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { DollarSign, Plus, Search, Trash2, Edit2, Loader2, XCircle, CheckCircle2, Clock, AlertCircle, FileText, Download, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const EMPTY_FORM = { employee_id: '', period_start: '', period_end: '', basic_salary: 0, allowances: 0, deductions: 0, tax_rate: 15, status: 'Draft', payment_date: '' };
const STATUS_COLORS = { Draft: 'bg-muted text-foreground border-primary/40', Processed: 'bg-blue-50 text-blue-700 border-blue-200', Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

export default function UnivPayroll() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
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
      const __res = await powerSync.execute(`SELECT * FROM univ_payroll WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      setPayrolls(data || []);

      const __empRes = await powerSync.execute(`SELECT * FROM univ_hr_employees WHERE company_id = ? ORDER BY first_name ASC`, [companyId]);
      const empData = __empRes.rows ? (__empRes.rows._array || Array.from(__empRes.rows)) : [];
      setEmployees(empData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEmployeeChange = (empId) => {
    const emp = employees.find(e => e.id === empId);
    setForm(prev => ({
      ...prev,
      employee_id: empId,
      basic_salary: emp?.salary || prev.basic_salary || 0
    }));
  };

  const getEmployeeName = (empId, fallbackName) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.first_name} ${emp.last_name}` : (fallbackName || 'Unknown');
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.employee_id && !form.employee_name) return toast.error('Select an employee');

    const gross = Number(form.basic_salary) + Number(form.allowances);
    const calculated_tax = gross * (Number(form.tax_rate) / 100);
    const net_pay = gross - Number(form.deductions) - calculated_tax;
    
    const { id, created_at, updated_at, tax_rate, tax_amount, ...cleanForm } = form;
    const payload = {
      ...cleanForm,
      employee_id: form.employee_id || '00000000-0000-0000-0000-000000000000',
      employee_name: getEmployeeName(form.employee_id, form.employee_name),
      net_pay,
      payment_date: form.payment_date || null,
      period_start: form.period_start || null,
      period_end: form.period_end || null
    };

    try {
      if (editingId) {
        await (async () => { const _payload = payload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_payroll SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]);})();
        toast.success('Payroll updated!');
      } else {
        const { error } = await (async () => {
          const _payload = { ...payload, id: crypto.randomUUID(), company_id: companyId };
          const _keys = Object.keys(_payload);
          const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          const _plhdr = _keys.map(()=>'?').join(', ');
          await powerSync.execute(`INSERT INTO univ_payroll (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null };})();
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
    await powerSync.execute(`DELETE FROM univ_payroll WHERE id = ?`, [id]);
    toast.success('Deleted'); fetchData();
  };

  const updateStatus = async (id, status) => {
    await (async () => { const _payload = { status }; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_payroll SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, id]);})();
    fetchData();
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleDownloadPayslip = (p) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22); doc.text(companyId.split('-')[0].toUpperCase(), 14, 22);
      doc.setFontSize(16); doc.text('Payslip', 14, 32);
      doc.setFontSize(11);
      doc.text(`Employee: ${getEmployeeName(p.employee_id, p.employee_name)}`, 14, 45);
      doc.text(`Period: ${p.period_start} to ${p.period_end}`, 14, 52);
      doc.text(`Status: ${p.status}`, 14, 59);
      doc.text(`Payment Date: ${p.payment_date || 'N/A'}`, 14, 66);
      doc.line(14, 72, 196, 72);
      doc.text(`Basic Salary: $${Number(p.basic_salary).toLocaleString()}`, 14, 82);
      doc.text(`Allowances: $${Number(p.allowances||0).toLocaleString()}`, 14, 89);
      doc.text(`Gross Pay: $${(Number(p.basic_salary) + Number(p.allowances||0)).toLocaleString()}`, 14, 96);
      doc.text(`Deductions: -$${Number(p.deductions||0).toLocaleString()}`, 14, 103);
      const tax = (Number(p.basic_salary) + Number(p.allowances||0)) * (Number(p.tax_rate||15)/100);
      doc.text(`Tax (${p.tax_rate}%): -$${tax.toLocaleString()}`, 14, 110);
      doc.line(14, 116, 196, 116);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(`Net Pay: $${Number(p.net_pay).toLocaleString()}`, 14, 126);
      doc.save(`Payslip_${getEmployeeName(p.employee_id, p.employee_name).replace(/ /g,'_')}_${p.period_start}.pdf`);
    } catch(err) { toast.error("Failed to generate PDF"); }
  };

  const filtered = payrolls.filter(p => {
    const empName = getEmployeeName(p.employee_id, p.employee_name);
    return (statusFilter === 'All' || p.status === statusFilter) &&
           `${empName} ${p.status}`.toLowerCase().includes(search.toLowerCase());
  });

  const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.net_pay||0), 0);
  const paidPayroll = payrolls.filter(p => p.status === 'Paid').reduce((sum, p) => sum + Number(p.net_pay||0), 0);

  return (
    <div className={`h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2 tracking-[-0.02em]"><DollarSign className="w-7 h-7 text-primary" /> Payroll</h1>
          <p className="text-[#71717a] dark:text-gray-400 text-sm font-medium mt-1">Manage salaries, taxes, and payslips.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-md-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors "><Plus className="w-4 h-4" /> Run Payroll</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          {label:'Total Payroll Value',value:`$${totalPayroll.toLocaleString()}`,icon:<DollarSign className="w-5 h-5"/>,ib:'bg-blue-100 text-blue-600'},
          {label:'Total Paid',value:`$${paidPayroll.toLocaleString()}`,icon:<CheckCircle2 className="w-5 h-5"/>,ib:'bg-emerald-100 text-emerald-600'},
          {label:'Drafts',value:payrolls.filter(p=>p.status==='Draft').length,icon:<FileText className="w-5 h-5"/>,ib:'bg-muted text-[#71717a] dark:text-gray-400'},
          {label:'Processed',value:payrolls.filter(p=>p.status==='Processed').length,icon:<Clock className="w-5 h-5"/>,ib:'bg-amber-100 text-amber-600'},
        ].map((k,i)=>(
          <div key={i} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-md-2xl flex items-center gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className={`w-11 h-11 rounded-md-xl flex items-center justify-center shrink-0 ${k.ib}`}>{k.icon}</div>
            <div><p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{k.label}</p><p className="text-lg font-black text-foreground">{k.value}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400"/><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee..." className="w-full h-11 pl-10 pr-4 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"/></div>
        <div className="flex gap-2 shrink-0">
          {['All',...Object.keys(STATUS_COLORS)].map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 h-11 rounded-md-xl text-sm font-semibold border-[0.5px] border-black/9 dark:border-white/8 transition-all whitespace-nowrap ${statusFilter===s?'bg-primary text-white border-primary':'bg-card border-primary/40 text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}>{s}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl flex flex-col custom-scrollbar hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-primary/40 bg-muted/50 text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider shrink-0 tracking-[0.04em]">
          <div className="col-span-3">Employee</div><div className="col-span-3">Period</div><div className="col-span-2 text-right">Net Pay</div><div className="col-span-2">Status</div><div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          : filtered.length===0 ? <div className="p-12 text-center text-[#71717a] dark:text-gray-400"><DollarSign className="w-12 h-12 mx-auto text-[#71717a] dark:text-gray-400/30 mb-3"/><p className="font-medium">No payroll records found.</p></div>
          : filtered.map(p=>(
            <div key={p.id} className="grid grid-cols-12 gap-2 p-4 border-b border-primary/40 hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-3 font-semibold text-sm text-foreground flex items-center gap-2">
                <div className="w-7 h-7 rounded-md-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs tracking-[0.04em]">{getEmployeeName(p.employee_id, p.employee_name).charAt(0).toUpperCase()}</div>
                {getEmployeeName(p.employee_id, p.employee_name)}
              </div>
              <div className="col-span-3 text-sm text-[#71717a] dark:text-gray-400">{p.period_start} to {p.period_end}</div>
              <div className="col-span-2 text-right font-black text-foreground">${Number(p.net_pay||0).toLocaleString()}</div>
              <div className="col-span-2">
                <select value={p.status} onChange={e=>updateStatus(p.id,e.target.value)} className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-lg border-[0.5px] border-black/9 dark:border-white/8 cursor-pointer focus:outline-none ${STATUS_COLORS[p.status]||'bg-muted border-primary/40'}`}>
                  {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={()=>handleDownloadPayslip(p)} className="p-1.5 bg-muted rounded-lg text-[#71717a] dark:text-gray-400 hover:text-primary"><Download className="w-3.5 h-3.5"/></button>
                <button onClick={()=>openModal(p)} className="p-1.5 bg-muted rounded-lg text-[#71717a] dark:text-gray-400 hover:text-primary"><Edit2 className="w-3.5 h-3.5"/></button>
                <button onClick={()=>remove(p.id)} className="p-1.5 bg-red-50 rounded-lg text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-md-2xl flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="p-5 border-b border-primary/40 flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Payroll':'Create Payroll Entry'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-md-full text-[#71717a] dark:text-gray-400"><XCircle className="w-5 h-5"/></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Select Employee *</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
                    <select required value={form.employee_id} onChange={e => handleEmployeeChange(e.target.value)} className="w-full h-10 pl-9 pr-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm appearance-none cursor-pointer">
                      <option value="">-- Choose Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Period Start *</label><input required type="date" value={form.period_start} onChange={e=>setForm({...form,period_start:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Period End *</label><input required type="date" value={form.period_end} onChange={e=>setForm({...form,period_end:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Basic Salary ($) *</label><input required type="number" min="0" step="0.01" value={form.basic_salary} onChange={e=>setForm({...form,basic_salary:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Allowances ($)</label><input type="number" min="0" step="0.01" value={form.allowances} onChange={e=>setForm({...form,allowances:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Deductions ($)</label><input type="number" min="0" step="0.01" value={form.deductions} onChange={e=>setForm({...form,deductions:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Tax Rate (%)</label><input type="number" min="0" max="100" step="0.1" value={form.tax_rate || 15} onChange={e=>setForm({...form,tax_rate:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Payment Date</label><input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
              </div>
              <div className="bg-muted p-4 rounded-md-xl mt-6 flex justify-between items-center">
                <span className="font-semibold text-[#71717a] dark:text-gray-400">Calculated Net Pay:</span>
                <span className="text-xl font-black text-foreground">
                  ${( (Number(form.basic_salary) + Number(form.allowances)) - Number(form.deductions) - ((Number(form.basic_salary) + Number(form.allowances)) * (Number(form.tax_rate||15)/100)) ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-primary/40"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-md-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-md-xl text-sm font-semibold ">{editingId?'Update Payroll':'Create Payroll'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
