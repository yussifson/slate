import { useTranslation} from "react-i18next";
import { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Download, Trash2, FileText, MoreVertical, Edit, Eye} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';

export default function Payroll() {
 const { t} = useTranslation();
 
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
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
 if (!formData.staffRecordId) {
 return toast.error("Please select an employee");
}
 
 const gross = parseFloat(formData.grossPay) || 0;
 const ded = parseFloat(formData.deductions) || 0;
 const netPay = gross - ded;

 const selectedStaff = staffList.find(s => s.id === formData.staffRecordId);

 
  if (editTargetId) {
    powerSync.execute(`UPDATE univ_hr_payroll SET employee_id=?, period=?, basic_salary=?, deductions=?, net_salary=? WHERE id=?`, 
      [formData.staffRecordId, formData.period, gross, ded, netPay, editTargetId]
    ).then(() => {
      toast.success('Payroll record updated!');
      setShowModal(false);
      setEditTargetId(null);
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

 const handleUpdateStatus = (payroll, newStatus) => {
 const payload = { ...payroll};
 delete payload.id;
 delete payload.status;
 
 mutateRecord.mutate({
 id: payroll.id,
 recordType: 'payroll_run',
 payload,
 status: newStatus,
 searchText: `${payroll.employeeName} ${payroll.employeeId} ${payroll.period}`
}, {
 onSuccess: () => toast.success(`Payroll marked as ${newStatus}`)
});
};

 const handleDelete = () => {
 if (!deleteTargetId) return;
 powerSync.execute(`DELETE FROM univ_hr_payroll WHERE id = ?`, [deleteTargetId])
      .then(() => { toast.success('Payroll record deleted'); setDeleteTargetId(null); })
      .catch(err => toast.error('Failed: ' + err.message));
};

 const filtered = payrolls.filter(p => 
 p.employeeName?.toLowerCase().includes(search.toLowerCase()) || 
 p.employeeId?.toLowerCase().includes(search.toLowerCase())
 );

 const totalPayroll = payrolls.reduce((sum, p) => sum + (Number(p.netPay) || 0), 0);
 const processed = payrolls.filter(p => p.status === 'Processed').length;
 const pending = payrolls.filter(p => p.status === 'Pending').length;

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("payroll", "Payroll")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "manage_employee_salaries_and_c",
 "Manage employee salaries and compensation"
 )}</p>
 </div>
 <div className="flex gap-2">
 <Button variant="outline" className="gap-2">
 <Download className="w-4 h-4" /> {t("export", "Export")}
 </Button>
 <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Plus className="w-4 h-4" /> {t("add_payslip", "Add Payslip")}
 </Button>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-1">{t("total_payroll", "Total Payroll")}</p>
 <h2 className="text-3xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${totalPayroll.toLocaleString()}</h2>
 </div>
 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary">
 <DollarSign className="w-6 h-6" />
 </div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-1">{t("processed", "Processed")}</p>
 <h2 className="text-3xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{processed}</h2>
 </div>
 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary">
 <FileText className="w-6 h-6" />
 </div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-1">{t("pending", "Pending")}</p>
 <h2 className="text-3xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{pending}</h2>
 </div>
 <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
 <DollarSign className="w-6 h-6" />
 </div>
 </div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_payroll_data", "Loading payroll data...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_payroll_records", "No payroll records")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t("add_a_payslip_to_get_started", "Add a payslip to get started.")}</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("employee", "Employee")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("period", "Period")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("gross_pay", "Gross Pay")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("deductions", "Deductions")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("net_pay", "Net Pay")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(pay => {
 return (
 <tr key={pay.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Link to="/employees" className="hover:underline text-primary">{pay.employeeName}</Link>
 </p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{pay.employeeId}</p>
 </td>
 <td className="px-6 py-4 text-foreground font-medium">{pay.period}</td>
 <td className="px-6 py-4 text-right text-[#71717a] dark:text-gray-400">${pay.grossPay?.toLocaleString()}</td>
 <td className="px-6 py-4 text-right text-red-500">-${pay.deductions?.toLocaleString()}</td>
 <td className="px-6 py-4 text-right font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${pay.netPay?.toLocaleString()}</td>
 <td className="px-6 py-4 text-center">
 <select
 value={pay.status}
 onChange={e => handleUpdateStatus(pay, e.target.value)}
 className={`rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input px-2 py-1 text-xs font-semibold ${
 pay.status === 'Processed' ? 'bg-slate-100 text-primary/90 dark:bg-primary/20 dark:text-primary-foreground' : 
 pay.status === 'Failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
}`}
 >
 <option value="Pending">{t("pending", "Pending")}</option>
 <option value="Processed">{t("processed", "Processed")}</option>
 <option value="Failed">{t("failed", "Failed")}</option>
 </select>
 </td>
 <td className="px-6 py-4 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <span className="sr-only">{t("open_menu", "Open menu")}</span>
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewTargetId(pay.id)}>
 <Eye className="mr-2 h-4 w-4" />
 {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(pay)}>
 <Edit className="mr-2 h-4 w-4" />
 {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(pay.id)} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" />
 {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 )}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{editTargetId ? 'Edit Payslip' : 'Add Payslip'}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("employee", "Employee")}</label>
 <select value={formData.staffRecordId} onChange={e => setFormData({...formData, staffRecordId: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground">
 <option value="">Select Employee...</option>
 {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.employeeId})</option>)}
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("period", "Period")}</label>
 <Input value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} placeholder="May 2026" className="mt-1" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("gross_pay", "Gross Pay ($)")}</label>
 <Input type="number" value={formData.grossPay} onChange={e => setFormData({...formData, grossPay: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("deductions", "Deductions ($)")}</label>
 <Input type="number" value={formData.deductions} onChange={e => setFormData({...formData, deductions: e.target.value})} className="mt-1" />
 </div>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateOrUpdatePayroll}>{editTargetId ? 'Save Changes' : 'Save Payslip'}</Button>
 </div>
 </div>
 </div>
 )}
 {viewTargetId && (
 <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("payslip_details", "Payslip Details")}</SheetTitle>
 <SheetDescription>{t("read_only_view_of_payslip_reco", "Read-only view of payslip record.")}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {(() => {
 const pay = payrolls.find(p => p.id === viewTargetId);
 if (!pay) return null;
 return (
 <div className="space-y-4 text-sm">
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("employee", "Employee:")}</span> <p className="font-medium"><Link to="/employees" className="hover:underline text-primary">{pay.employeeName}</Link></p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("employee_id", "Employee ID:")}</span> <p className="font-medium">{pay.employeeId}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("period", "Period:")}</span> <p className="font-medium">{pay.period}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("gross_pay", "Gross Pay:")}</span> <p className="font-medium">${pay.grossPay?.toLocaleString()}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("deductions", "Deductions:")}</span> <p className="font-medium text-red-500">-${pay.deductions?.toLocaleString()}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("net_pay", "Net Pay:")}</span> <p className="font-medium text-primary font-semibold">${pay.netPay?.toLocaleString()}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("status", "Status:")}</span> <p className="font-medium">{pay.status}</p></div>
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
