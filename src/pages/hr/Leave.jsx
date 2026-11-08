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
  <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 pb-24 font-sans space-y-4 sm:space-y-6">
    <div className="w-full space-y-4 sm:space-y-6">

     {/* ── Native Header ── */}
     <div className="flex items-center justify-between gap-3 min-w-0 border-b pb-4 border-border/80">
       <div className="min-w-0">
         <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">{t("leave", "Leave Management")}</h1>
         <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">{t("review_and_approve_employee_ti", "Employee absence tracking and leave requests")}</p>
       </div>
       <Button onClick={openAdd} size="sm" className="h-9 px-3 sm:px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-xs gap-1.5 shrink-0 active:scale-95 transition-all">
         <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t("new_request", "New Request")}</span><span className="sm:hidden">New</span>
       </Button>
     </div>

     {/* ── 2x2 Modern Mobile Stats Grid ── */}
     <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Requests</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-foreground">{requests.length}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-amber-600">{pending}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Approved</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-emerald-600">{approved}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Rejected</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-rose-600">{rejected}</div>
       </div>
     </div>

    {/* ── Cards Grid ── */}
    {isDbLoading ? (
      <div className="py-16 text-center text-muted-foreground">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading leave requests...
      </div>
    ) : requests.length === 0 ? (
      <div className="py-16 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
        <CalendarOff className="w-14 h-14 mx-auto mb-3 opacity-20 text-amber-600" />
        <p className="font-semibold text-lg text-foreground">{t("no_leave_requests_found", "No leave requests found")}</p>
        <p className="text-sm mt-1">{t("submit_a_new_request_using_the", "Submit a new request using the button above.")}</p>
      </div>
    ) : (
      <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Duration & Dates</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {requests.map(req => {
                const leaveStyle = getLeaveStyle(req.leaveType);
                const statusStyle = STATUS_STYLES[req.status] || STATUS_STYLES['Pending'];
                const initials = req.employeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                return (
                  <tr key={req.id} className="hover:bg-muted/40 transition-colors group">
                    {/* Employee */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${leaveStyle.bg} flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-xs leading-snug truncate">{req.employeeName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${leaveStyle.light}`}>
                        {req.leaveType} Leave
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">{req.startDate} → {req.endDate}</p>
                        <span className="text-[10px] text-muted-foreground font-medium">{req.days} {req.days === 1 ? 'day' : 'days'}</span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-muted-foreground truncate" title={req.reason}>
                        {req.reason || '—'}
                      </p>
                    </td>

                    {/* Status with quick actions if pending */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full ${statusStyle}`}>
                        {req.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(req, 'Approved')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req, 'Rejected')}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setViewTargetId(req.id)}
                          className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(req)}
                          className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(req.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>

  {/* ── Add / Edit Modal ── */}
  {showModal && (
  <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-4" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
  <div className="bg-white dark:bg-card rounded-t-[28px] sm:rounded-2xl w-full sm:max-w-md shadow-2xl border-t sm:border border-border/80 max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,20px))] sm:pb-0">
    <div className="sm:hidden w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20 mx-auto mt-3 mb-1 shrink-0" aria-hidden="true" />
    <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between shrink-0">
      <h2 className="text-base sm:text-lg font-bold text-foreground">{editTargetId ? 'Edit Leave Request' : 'New Leave Request'}</h2>
      <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
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
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-secondary rounded-2xl">
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
