import { useTranslation} from "react-i18next";
import { useState, useEffect } from 'react';
import { X, DollarSign, Search, Plus, Download, Trash2, FileText, Edit, Eye, TrendingDown, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
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
  <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 pb-24 font-sans space-y-4 sm:space-y-6">
    <div className="w-full space-y-4 sm:space-y-6">

     {/* ── Native Header ── */}
     <div className="flex items-center justify-between gap-3 min-w-0 border-b pb-4 border-border/80">
       <div className="min-w-0">
         <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">{t("payroll", "Payroll & Salaries")}</h1>
         <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">{t("manage_employee_salaries_and_c", "Staff payroll records and compensation cycles")}</p>
       </div>
       <div className="flex items-center gap-2 shrink-0">
         <Button onClick={openAdd} size="sm" className="h-9 px-3 sm:px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-xs gap-1.5 shrink-0 active:scale-95 transition-all">
           <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t("add_payslip", "Add Payslip")}</span><span className="sm:hidden">Add</span>
         </Button>
       </div>
     </div>

     {/* ── 2x2 Modern Mobile Stats Grid ── */}
     <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Payroll</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-foreground">${totalPayroll.toLocaleString()}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Processed</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-emerald-600">{processed}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-amber-600">{pending}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Deductions</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-rose-600">${totalDeductions.toLocaleString()}</div>
       </div>
     </div>

     {/* ── Search Bar ── */}
     <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex items-center gap-2.5">
       <div className="relative flex-1">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input placeholder="Search employee name or payroll..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9.5 bg-background rounded-xl border-border/80 text-xs w-full" />
       </div>
     </div>

    {/* ── Payslip Cards ── */}
    {isDbLoading ? (
      <div className="py-16 text-center text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading payroll data...
      </div>
    ) : filtered.length === 0 ? (
      <div className="py-16 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
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
            <div key={pay.id} className="group bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
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
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground bg-slate-100 dark:bg-secondary rounded-full px-2 py-0.5">{pay.employeeId}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full ${statusStyle}`}>{pay.status}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-slate-100 dark:bg-secondary rounded-full px-2 py-0.5">{pay.period}</span>
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
                  className="mt-3 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-slate-50 dark:bg-secondary px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
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
  <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-4" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
  <div className="bg-white dark:bg-card rounded-t-[28px] sm:rounded-2xl w-full sm:max-w-md shadow-2xl border-t sm:border border-border/80 max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,20px))] sm:pb-0">
    <div className="sm:hidden w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20 mx-auto mt-3 mb-1 shrink-0" aria-hidden="true" />
    <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between shrink-0">
      <h2 className="text-base sm:text-lg font-bold text-foreground">{editTargetId ? 'Edit Payslip' : 'Add Payslip'}</h2>
      <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
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
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-secondary rounded-2xl">
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
