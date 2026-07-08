import { useTranslation} from "react-i18next";
import { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Download, Trash2, FileText, Edit, Eye, TrendingDown, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';

const STATUS_STYLES = {
  Pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Processed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Failed:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export default function Payroll() {
 const { t} = useTranslation();
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  const mutateRecord = useMutateIndustryRecord();

  const [dbRecords, setDbRecords] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const fetchPr = async () => {
      setIsDbLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_hr_payroll WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setDbRecords(res.rows._array || Array.from(res.rows));
      } catch(e){}
      setIsDbLoading(false);
    };
    if (companyId) fetchPr();
    return () => { active = false; };
  }, [companyId]);

  const [staffRecords, setStaffRecords] = useState([]);
  useEffect(() => {
    let active = true;
    const fetchStaff = async () => {
      try {
        const res = await powerSync.execute('SELECT * FROM univ_hr_employees WHERE company_id = ?', [companyId]);
        if(active) setStaffRecords(res.rows._array || Array.from(res.rows));
      } catch(e){}
    };
    if (companyId) fetchStaff();
    return () => { active = false; };
  }, [companyId]);

 const staffList = staffRecords.map(r => ({
  id: r.id,
  name: r.name || 'Unnamed Staff',
  employeeId: r.employee_id || r.id.substring(0,6)
}));

 const payrolls = dbRecords.map(r => ({
  id: r.id,
  status: r.status || 'Pending',
  staffRecordId: r.employee_id || '',
  employeeName: r.employee_id ? (staffList.find(s => s.id === r.employee_id)?.name || 'Unknown') : 'Unnamed',
  employeeId: r.employee_id ? (staffList.find(s => s.id === r.employee_id)?.employeeId || 'Unknown') : '',
  period: r.period,
  grossPay: r.basic_salary,
  deductions: r.deductions,
  netPay: r.net_salary
}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editTargetId, setEditTargetId] = useState(null);
 const [viewTargetId, setViewTargetId] = useState(null);

 const [formData, setFormData] = useState({
 staffRecordId: '',
 period: 'May 2026',
 grossPay: 0,
 deductions: 0
});

 const handleCreateOrUpdatePayroll = () => {
 if (!formData.staffRecordId) return toast.error("Please select an employee");
 const gross = parseFloat(formData.grossPay) || 0;
 const ded = parseFloat(formData.deductions) || 0;
 const netPay = gross - ded;

 if (editTargetId) {
   powerSync.execute(`UPDATE univ_hr_payroll SET employee_id=?, period=?, basic_salary=?, deductions=?, net_salary=? WHERE id=?`, 
     [formData.staffRecordId, formData.period, gross, ded, netPay, editTargetId]
   ).then(() => {
     toast.success('Payroll record updated!');
     setShowModal(false);
     setEditTargetId(null);
     setDbRecords(prev => prev.map(r => r.id === editTargetId ? { ...r, employee_id: formData.staffRecordId, period: formData.period, basic_salary: gross, deductions: ded, net_salary: netPay } : r));
     setFormData({ staffRecordId: '', period: 'May 2026', grossPay: 0, deductions: 0});
   }).catch(err => toast.error('Failed: ' + err.message));
 } else {
   powerSync.execute(`INSERT INTO univ_hr_payroll (id, company_id, created_at, employee_id, period, basic_salary, deductions, net_salary, status) VALUES (uuid(), ?, datetime('now'), ?, ?, ?, ?, ?, ?)`, 
     [companyId, formData.staffRecordId, formData.period, gross, ded, netPay, 'Pending']
   ).then(() => {
     toast.success('Payroll record added!');
     setShowModal(false);
     setFormData({ staffRecordId: '', period: 'May 2026', grossPay: 0, deductions: 0});
   }).catch(err => toast.error('Failed: ' + err.message));
 }
};

 const openEdit = (pay) => {
 setFormData({
 staffRecordId: pay.staffRecordId || '',
 period: pay.period || 'May 2026',
 grossPay: pay.grossPay || 0,
 deductions: pay.deductions || 0
});
 setEditTargetId(pay.id);
 setShowModal(true);
};

 const openAdd = () => {
 setFormData({ staffRecordId: '', period: 'May 2026', grossPay: 0, deductions: 0});
 setEditTargetId(null);
 setShowModal(true);
};

 const handleUpdateStatus = (pay, newStatus) => {
   powerSync.execute(`UPDATE univ_hr_payroll SET status = ? WHERE id = ?`, [newStatus, pay.id])
     .then(() => {
       setDbRecords(prev => prev.map(r => r.id === pay.id ? { ...r, status: newStatus } : r));
       toast.success(`Payroll marked as ${newStatus}`);
     })
     .catch(err => toast.error('Failed: ' + err.message));
};

 const handleDelete = () => {
 if (!deleteTargetId) return;
 powerSync.execute(`DELETE FROM univ_hr_payroll WHERE id = ?`, [deleteTargetId])
      .then(() => { 
        setDbRecords(prev => prev.filter(r => r.id !== deleteTargetId));
        toast.success('Payroll record deleted'); 
        setDeleteTargetId(null); 
      })
      .catch(err => toast.error('Failed: ' + err.message));
};

 const filtered = payrolls.filter(p => 
 p.employeeName?.toLowerCase().includes(search.toLowerCase()) || 
 p.employeeId?.toLowerCase().includes(search.toLowerCase())
 );

 const totalPayroll = payrolls.reduce((sum, p) => sum + (Number(p.netPay) || 0), 0);
 const processed = payrolls.filter(p => p.status === 'Processed').length;
 const pending = payrolls.filter(p => p.status === 'Pending').length;
 const totalDeductions = payrolls.reduce((sum, p) => sum + (Number(p.deductions) || 0), 0);

 return (
 <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 h-full p-4 lg:p-8 font-dmsans">
  <div className="max-w-[1600px] mx-auto space-y-6">

    {/* ── Header ── */}
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("payroll", "Payroll")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("manage_employee_salaries_and_c", "Manage employee salaries and compensation")}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2 rounded-xl">
          <Download className="w-4 h-4" /> Export
        </Button>
        <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4" /> {t("add_payslip", "Add Payslip")}
        </Button>
      </div>
    </div>

    {/* ── Metric Cards ── */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Payroll', value: `$${totalPayroll.toLocaleString()}`, icon: DollarSign, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Processed', value: processed, icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Pending', value: pending, icon: Clock, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Total Deductions', value: `$${totalDeductions.toLocaleString()}`, icon: TrendingDown, gradient: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
      ].map(({ label, value, icon: Icon, gradient, bg }) => (
        <div key={label} className={`${bg} rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200`}>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>

    {/* ── Search ── */}
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white dark:bg-slate-900 rounded-xl border-[0.5px] border-black/9 dark:border-white/8" />
    </div>

    {/* ── Payslip Cards ── */}
    {isDbLoading ? (
      <div className="py-16 text-center text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading payroll data...
      </div>
    ) : filtered.length === 0 ? (
      <div className="py-16 text-center text-muted-foreground bg-white dark:bg-slate-900 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
        <DollarSign className="w-14 h-14 mx-auto mb-3 opacity-20 text-primary" />
        <p className="font-semibold text-lg text-foreground">{t("no_payroll_records", "No payroll records")}</p>
        <p className="text-sm mt-1">{t("add_a_payslip_to_get_started", "Add a payslip to get started.")}</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(pay => {
          const statusStyle = STATUS_STYLES[pay.status] || STATUS_STYLES['Pending'];
          const initials = pay.employeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
          const gross = Number(pay.grossPay) || 0;
          const deductions = Number(pay.deductions) || 0;
          const net = Number(pay.netPay) || 0;
          const deductionPct = gross > 0 ? Math.round((deductions / gross) * 100) : 0;
          return (
            <div key={pay.id} className="group bg-white dark:bg-slate-900 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              {/* Top accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground leading-tight">{pay.employeeName}</h3>
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">{pay.employeeId}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full ${statusStyle}`}>{pay.status}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">{pay.period}</span>
                  </div>
                </div>

                {/* Salary breakdown */}
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Gross Pay</span>
                      <span className="font-bold text-foreground">${gross.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-red-500" /> Deductions ({deductionPct}%)</span>
                      <span className="font-bold text-red-600 dark:text-red-400">-${deductions.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Net Pay</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">${net.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status select */}
                <select
                  value={pay.status}
                  onChange={e => handleUpdateStatus(pay, e.target.value)}
                  className="mt-3 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="Pending">Pending</option>
                  <option value="Processed">Processed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* ── Action Buttons ── */}
              <div className="px-5 pb-5 flex gap-2 mt-auto">
                <button onClick={() => setViewTargetId(pay.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => openEdit(pay)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40 transition-colors">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setDeleteTargetId(pay.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>

  {/* ── Add / Edit Modal ── */}
  {showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
  <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border-[0.5px] border-black/9 dark:border-white/8">
    <div className="p-6 border-b border-border/50">
      <h2 className="text-lg font-bold text-foreground">{editTargetId ? 'Edit Payslip' : 'Add Payslip'}</h2>
    </div>
  <div className="space-y-4 p-6">
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("employee", "Employee")}</label>
  <select value={formData.staffRecordId} onChange={e => setFormData({...formData, staffRecordId: e.target.value})} className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground">
  <option value="">Select Employee...</option>
  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.employeeId})</option>)}
  </select>
  </div>
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("period", "Period")}</label>
  <Input value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} placeholder="May 2026" className="mt-1" />
  </div>
  <div className="grid grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("gross_pay", "Gross Pay ($)")}</label>
  <Input type="number" value={formData.grossPay} onChange={e => setFormData({...formData, grossPay: e.target.value})} className="mt-1" />
  </div>
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("deductions", "Deductions ($)")}</label>
  <Input type="number" value={formData.deductions} onChange={e => setFormData({...formData, deductions: e.target.value})} className="mt-1" />
  </div>
  </div>
  {(parseFloat(formData.grossPay) > 0) && (
    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex justify-between">
      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Net Pay Preview</span>
      <span className="font-bold text-emerald-700 dark:text-emerald-400">${(parseFloat(formData.grossPay) - parseFloat(formData.deductions || 0)).toLocaleString()}</span>
    </div>
  )}
  </div>
  <div className="flex gap-3 p-6 border-t border-border/50">
  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
  <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl" onClick={handleCreateOrUpdatePayroll}>{editTargetId ? 'Save Changes' : 'Save Payslip'}</Button>
  </div>
  </div>
  </div>
  )}

  {/* ── View Sheet ── */}
  {viewTargetId && (
  <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
  <SheetContent className="overflow-y-auto w-full sm:max-w-md">
  <SheetHeader>
  <SheetTitle>{t("payslip_details", "Payslip Details")}</SheetTitle>
  <SheetDescription>{t("read_only_view_of_payslip_reco", "Read-only view of payslip record.")}</SheetDescription>
  </SheetHeader>
  <div className="mt-6 space-y-5">
  {(() => {
  const pay = payrolls.find(p => p.id === viewTargetId);
  if (!pay) return null;
  const initials = pay.employeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">{initials}</div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{pay.employeeName}</h3>
          <span className="text-xs text-muted-foreground">{pay.period}</span>
        </div>
      </div>
      {[
        { label: 'Employee ID', value: pay.employeeId },
        { label: 'Status', value: pay.status },
        { label: 'Gross Pay', value: `$${Number(pay.grossPay).toLocaleString()}` },
        { label: 'Deductions', value: `-$${Number(pay.deductions).toLocaleString()}` },
        { label: 'Net Pay', value: `$${Number(pay.netPay).toLocaleString()}` },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between py-2 border-b border-border/30">
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
          <span className="text-sm font-bold text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
})()}
  </div>
  </SheetContent>
  </Sheet>
  )}

  <ConfirmationModal
  isOpen={deleteTargetId !== null}
  onClose={() => setDeleteTargetId(null)}
  onConfirm={handleDelete}
  title="Delete Payslip"
  message="Are you sure you want to completely remove this payslip record?"
  />
 </div>
 );
}
