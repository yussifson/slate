import { useTranslation} from "react-i18next";
import { useState, useEffect } from 'react';
import { CalendarOff, Check, X, Plus, Trash2, CalendarDays, Edit, Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { useNotifications} from '@/hooks/integrations/useNotifications';
import { useAuth} from '@/lib/AuthContext';
import { useCompanyId} from "@/hooks/useCompanyId";
import { usePowerSync } from '@powersync/react';

const LEAVE_TYPE_STYLES = {
  Annual:    { bg: 'from-blue-500 to-blue-600',    light: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',    accent: 'border-l-blue-400' },
  Sick:      { bg: 'from-red-500 to-red-600',      light: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',        accent: 'border-l-red-400' },
  Maternity: { bg: 'from-pink-500 to-pink-600',    light: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',    accent: 'border-l-pink-400' },
  Emergency: { bg: 'from-orange-500 to-orange-600',light: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400', accent: 'border-l-orange-400' },
};
const getLeaveStyle = (type) => LEAVE_TYPE_STYLES[type] || { bg: 'from-slate-500 to-slate-600', light: 'bg-slate-100 text-slate-700', accent: 'border-l-slate-400' };

const STATUS_STYLES = {
  Pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export default function Leave() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { user} = useAuth();
 const { notifyTeam} = useNotifications();
 const powerSync = usePowerSync();
 
  const [dbRecords, setDbRecords] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const fetchL = async () => {
      setIsDbLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_hr_leave WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setDbRecords(res.rows._array || Array.from(res.rows));
      } catch(e){}
      setIsDbLoading(false);
    };
    if (companyId) fetchL();
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
  name: r.name || 'Unnamed Staff'
}));

 const requests = dbRecords.map(r => ({
  id: r.id,
  status: r.status || 'Pending',
  employeeId: r.employee_id || '',
  employeeName: r.employee_id ? (staffList.find(s => s.id === r.employee_id)?.name || 'Unknown') : 'Unnamed',
  leaveType: r.leave_type,
  startDate: r.start_date,
  endDate: r.end_date,
  reason: r.reason,
  days: r.start_date && r.end_date ? Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1) : 1
}));

 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editTargetId, setEditTargetId] = useState(null);
 const [viewTargetId, setViewTargetId] = useState(null);

 const [formData, setFormData] = useState({
 employeeId: '',
 leaveType: 'Annual',
 startDate: new Date().toISOString().split('T')[0],
 endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
 reason: ''
});

 const handleCreateOrUpdate = () => {
 if (!formData.employeeId) return toast.error("Please select an employee");
 if (editTargetId) {
   powerSync.execute(`UPDATE univ_hr_leave SET employee_id=?, leave_type=?, start_date=?, end_date=?, reason=? WHERE id=?`, 
     [formData.employeeId, formData.leaveType, formData.startDate, formData.endDate, formData.reason, editTargetId]
   ).then(() => {
     toast.success('Leave updated!');
     setShowModal(false);
     setEditTargetId(null);
     setFormData({ employeeId: '', leaveType: 'Annual', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], reason: '' });
   }).catch(err => toast.error('Failed: ' + err.message));
 } else {
   powerSync.execute(`INSERT INTO univ_hr_leave (id, company_id, created_at, employee_id, leave_type, start_date, end_date, reason, status) VALUES (uuid(), ?, datetime('now'), ?, ?, ?, ?, ?, ?)`, 
     [companyId, formData.employeeId, formData.leaveType, formData.startDate, formData.endDate, formData.reason, 'Pending']
   ).then(() => {
     toast.success('Leave added!');
     setShowModal(false);
     setFormData({ employeeId: '', leaveType: 'Annual', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], reason: '' });
   }).catch(err => toast.error('Failed: ' + err.message));
 }
};

 const openEdit = (req) => {
 setFormData({
 employeeId: req.employeeId || '',
 leaveType: req.leaveType || 'Annual',
 startDate: req.startDate || new Date().toISOString().split('T')[0],
 endDate: req.endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
 reason: req.reason || ''
});
 setEditTargetId(req.id);
 setShowModal(true);
};

 const openAdd = () => {
 setFormData({
 employeeId: '', leaveType: 'Annual', 
 startDate: new Date().toISOString().split('T')[0], 
 endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
 reason: ''
});
 setEditTargetId(null);
 setShowModal(true);
};

 const handleUpdateStatus = (req, newStatus) => {
   powerSync.execute(`UPDATE univ_hr_leave SET status = ? WHERE id = ?`, [newStatus, req.id])
     .then(() => {
       setDbRecords(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus } : r));
       toast.success(`Leave request ${newStatus}`);
       if (newStatus === 'Approved') {
         notifyTeam({ companyId: user?.company_id, provider: 'slack', message: `Leave request for ${req.employeeName} has been approved.`, channel: '#hr'}).catch(console.error);
         powerSync.execute(`INSERT INTO univ_notifications (id, company_id, created_at, title, message, type, read) VALUES (?, ?, ?, ?, ?, ?, ?)`, [crypto.randomUUID(), user?.company_id, new Date().toISOString(), "Leave Approved", `${req.employeeName}'s leave was approved`, "success", 0]).catch(console.error);
       }
     })
     .catch(err => toast.error('Failed: ' + err.message));
};

 const handleDelete = () => {
 if (!deleteTargetId) return;
 powerSync.execute(`DELETE FROM univ_hr_leave WHERE id = ?`, [deleteTargetId])
      .then(() => { 
        setDbRecords(prev => prev.filter(r => r.id !== deleteTargetId));
        toast.success('Leave deleted'); 
        setDeleteTargetId(null); 
      })
      .catch(err => toast.error('Failed: ' + err.message));
};

 const pending = requests.filter(r => r.status === 'Pending').length;
 const approved = requests.filter(r => r.status === 'Approved').length;
 const rejected = requests.filter(r => r.status === 'Rejected').length;

 return (
 <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 h-full p-4 lg:p-8 font-dmsans">
  <div className="max-w-[1600px] mx-auto space-y-6">

    {/* ── Header ── */}
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("leave", "Leave Management")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("review_and_approve_employee_ti", "Review and approve employee time-off requests")}</p>
      </div>
      <Button onClick={openAdd} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm">
        <Plus className="w-4 h-4" /> {t("new_request", "New Request")}
      </Button>
    </div>

    {/* ── Metric Cards ── */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Requests', value: requests.length, icon: CalendarDays, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Pending Review', value: pending, icon: Clock, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Approved', value: approved, icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Rejected', value: rejected, icon: XCircle, gradient: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
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

    {/* ── Cards Grid ── */}
    {isDbLoading ? (
      <div className="py-16 text-center text-muted-foreground">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading leave requests...
      </div>
    ) : requests.length === 0 ? (
      <div className="py-16 text-center text-muted-foreground bg-white dark:bg-slate-900 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
        <CalendarOff className="w-14 h-14 mx-auto mb-3 opacity-20 text-amber-600" />
        <p className="font-semibold text-lg text-foreground">{t("no_leave_requests_found", "No leave requests found")}</p>
        <p className="text-sm mt-1">{t("submit_a_new_request_using_the", "Submit a new request using the button above.")}</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {requests.map(req => {
          const leaveStyle = getLeaveStyle(req.leaveType);
          const statusStyle = STATUS_STYLES[req.status] || STATUS_STYLES['Pending'];
          const initials = req.employeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
          return (
            <div key={req.id} className={`group bg-white dark:bg-slate-900 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col border-l-4 ${leaveStyle.accent}`}>
              
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${leaveStyle.bg} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground leading-tight">{req.employeeName}</h3>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${leaveStyle.light}`}>
                        {req.leaveType} Leave
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shrink-0 ${statusStyle}`}>
                    {req.status}
                  </span>
                </div>

                {/* Date range */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{req.startDate} → {req.endDate}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.days} {req.days === 1 ? 'day' : 'days'} off</p>
                  </div>
                </div>

                {/* Reason */}
                {req.reason && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                    <p className="text-sm text-foreground bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg leading-relaxed line-clamp-2">"{req.reason}"</p>
                  </div>
                )}
              </div>

              {/* ── Action Buttons ── */}
              <div className="px-5 pb-3 flex gap-2">
                <button onClick={() => setViewTargetId(req.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => openEdit(req)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40 transition-colors">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setDeleteTargetId(req.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              {/* ── Approve / Reject (only for Pending) ── */}
              {req.status === 'Pending' && (
                <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                  <Button onClick={() => handleUpdateStatus(req, 'Rejected')} variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800/50 gap-2 rounded-xl">
                    <X className="w-4 h-4"/> Reject
                  </Button>
                  <Button onClick={() => handleUpdateStatus(req, 'Approved')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl">
                    <Check className="w-4 h-4"/> Approve
                  </Button>
                </div>
              )}
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
      <h2 className="text-lg font-bold text-foreground">{editTargetId ? 'Edit Leave Request' : 'New Leave Request'}</h2>
    </div>
  <div className="space-y-4 p-6">
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("employee_name", "Employee")}</label>
  <select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground">
  <option value="">Select Employee...</option>
  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
  </select>
  </div>
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("leave_type", "Leave Type")}</label>
  <select value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})} className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground">
  <option>Annual</option>
  <option>Sick</option>
  <option>Maternity</option>
  <option>Emergency</option>
  </select>
  </div>
  <div className="grid grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("start_date", "Start Date")}</label>
  <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1" />
  </div>
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("end_date", "End Date")}</label>
  <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="mt-1" />
  </div>
  </div>
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("reason", "Reason")}</label>
  <textarea 
  value={formData.reason} 
  onChange={e => setFormData({...formData, reason: e.target.value})} 
  placeholder="Enter reason..." 
  className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
  />
  </div>
  </div>
  <div className="flex gap-3 p-6 border-t border-border/50">
  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
  <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl" onClick={handleCreateOrUpdate}>{editTargetId ? 'Save Changes' : 'Submit Request'}</Button>
  </div>
  </div>
  </div>
  )}

  {/* ── View Sheet ── */}
  {viewTargetId && (
  <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
  <SheetContent className="overflow-y-auto w-full sm:max-w-md">
  <SheetHeader>
  <SheetTitle>{t("leave_request_details", "Leave Request Details")}</SheetTitle>
  <SheetDescription>{t("read_only_view_of_leave_reques", "Read-only view of leave request.")}</SheetDescription>
  </SheetHeader>
  <div className="mt-6 space-y-5">
  {(() => {
  const req = requests.find(r => r.id === viewTargetId);
  if (!req) return null;
  const leaveStyle = getLeaveStyle(req.leaveType);
  const initials = req.employeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${leaveStyle.bg} flex items-center justify-center text-white font-bold text-lg shadow-md`}>{initials}</div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{req.employeeName}</h3>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${leaveStyle.light}`}>{req.leaveType} Leave</span>
        </div>
      </div>
      {[
        { label: 'Status', value: req.status },
        { label: 'Duration', value: `${req.startDate} → ${req.endDate} (${req.days} days)` },
        { label: 'Reason', value: req.reason || '—' },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between py-2 border-b border-border/30">
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
          <span className="text-sm font-semibold text-foreground text-right max-w-[60%]">{value}</span>
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
  title="Delete Request"
  message="Are you sure you want to completely remove this leave request?"
  />
 </div>
 );
}
