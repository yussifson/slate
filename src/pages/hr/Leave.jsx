import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { CalendarOff, Check, X, Plus, Trash2, CalendarDays, MoreVertical, Edit, Eye} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { useNotifications} from '@/hooks/integrations/useNotifications';
import { useAuth} from '@/lib/AuthContext';
import { useCompanyId} from "@/hooks/useCompanyId";
import { Bell} from "lucide-react";

export default function Leave() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { user} = useAuth();
 const { notifyTeam} = useNotifications();
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('leave_request');
 const { data: staffRecords = []} = useIndustryRecords('staff');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const staffList = staffRecords.map(r => ({
 id: r.id,
 name: r.data?.full_name || r.data?.name || 'Unnamed Staff',
}));

 const requests = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Pending',
 employeeId: r.data?.employeeId || '',
 employeeName: r.data?.employeeId ? (staffList.find(s => s.id === r.data.employeeId)?.name || 'Unknown') : (r.data?.employeeName || 'Unnamed Employee'),
 ...r.data
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
 
 const start = new Date(formData.startDate);
 const end = new Date(formData.endDate);
 const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
 
 const selectedStaff = staffList.find(s => s.id === formData.employeeId);
 const employeeName = selectedStaff?.name || '';

 if (editTargetId) {
 const req = requests.find(r => r.id === editTargetId);
 mutateRecord.mutate({
 id: editTargetId,
 recordType: 'leave_request',
 payload: { ...formData, employeeName, days},
 status: req.status,
 searchText: `${employeeName} ${formData.leaveType}`
}, {
 onSuccess: () => {
 toast.success('Leave request updated!');
 setShowModal(false);
 setEditTargetId(null);
 setFormData({
 employeeId: '', leaveType: 'Annual', 
 startDate: new Date().toISOString().split('T')[0], 
 endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
 reason: ''
});
},
 onError: (err) => toast.error('Failed to update: ' + err.message)
});
} else {
 mutateRecord.mutate({
 recordType: 'leave_request',
 payload: { ...formData, employeeName, days},
 status: 'Pending',
 searchText: `${employeeName} ${formData.leaveType}`
}, {
 onSuccess: () => {
 toast.success('Leave request submitted!');
 notifyTeam({ companyId: user?.company_id, provider: 'slack', message: `Leave request submitted by ${employeeName} for ${formData.leaveType}`, channel: '#hr'}).catch(console.error);
 setShowModal(false);
 setFormData({
 employeeId: '', leaveType: 'Annual', 
 startDate: new Date().toISOString().split('T')[0], 
 endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
 reason: ''
});
},
 onError: (err) => toast.error('Failed: ' + err.message)
});
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
 const payload = { ...req};
 delete payload.id;
 delete payload.status;
 
 mutateRecord.mutate({
 id: req.id,
 recordType: 'leave_request',
 payload,
 status: newStatus,
 searchText: `${req.employeeName} ${req.leaveType}`
}, {
 onSuccess: () => {
 toast.success(`Leave request ${newStatus}`);
 if (newStatus === 'Approved') {
 notifyTeam({ companyId: user?.company_id, provider: 'slack', message: `Leave request for ${req.employeeName} has been approved.`, channel: '#hr'}).catch(console.error);
}
}
});
};

 const handleDelete = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'leave_request'}, {
 onSuccess: () => {
 toast.success('Request removed successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to remove: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const pending = requests.filter(r => r.status === 'Pending').length;
 const approved = requests.filter(r => r.status === 'Approved').length;

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">{t("leave_management", "Leave Management")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t(
 "review_and_approve_employee_ti",
 "Review and approve employee time-off requests"
 )}</p>
 </div>
 <Button onClick={openAdd} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
 <Plus className="w-4 h-4" /> {t("new_request", "New Request")}
 </Button>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="stat-card-premium bg-card rounded-xl border border-primary/40 p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary">
 <CalendarDays className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-card-foreground">{requests.length}</p>
 <p className="text-xs text-muted-foreground">{t("total_requests", "Total Requests")}</p>
 </div>
 </div>
 <div className="stat-card-premium bg-card rounded-xl border border-primary/40 p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
 <CalendarOff className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-card-foreground">{pending}</p>
 <p className="text-xs text-muted-foreground">{t("pending_review", "Pending Review")}</p>
 </div>
 </div>
 <div className="stat-card-premium bg-card rounded-xl border border-primary/40 p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary">
 <Check className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-card-foreground">{approved}</p>
 <p className="text-xs text-muted-foreground">{t("approved_leaves", "Approved Leaves")}</p>
 </div>
 </div>
 </div>
 {isDbLoading ? (
 <div className="py-12 text-center text-muted-foreground">{t("loading_leave_requests", "Loading leave requests...")}</div>
 ) : requests.length === 0 ? (
 <div className="py-12 text-center text-muted-foreground">
 <CalendarOff className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-600" />
 <p className="font-semibold text-lg text-card-foreground">{t("no_leave_requests_found", "No leave requests found")}</p>
 <p className="text-xs mt-1">{t(
 "submit_a_new_request_using_the",
 "Submit a new request using the button above."
 )}</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {requests.map(req => {
 return (
 <div key={req.id} className="bg-card rounded-xl border border-primary/40 overflow-hidden flex flex-col relative group">
 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0 bg-background/50 hover:bg-background">
 <span className="sr-only">{t("open_menu", "Open menu")}</span>
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewTargetId(req.id)}>
 <Eye className="mr-2 h-4 w-4" />
 {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(req)}>
 <Edit className="mr-2 h-4 w-4" />
 {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(req.id)} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" />
 {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 <div className="p-5 flex-1 mt-2">
 <div className="flex justify-between items-start mb-4 pr-8">
 <h3 className="text-lg font-bold text-card-foreground">
 <Link to="/employees" className="hover:underline text-primary">{req.employeeName}</Link>
 </h3>
 <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm ${
 req.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
 req.status === 'Approved' ? 'bg-slate-100 text-primary/90' : 'bg-red-100 text-red-700'
}`}>{req.status}</span>
 </div>
 
 <div className="bg-muted rounded-lg p-3 border border-primary/40 mb-4">
 <div className="flex items-center gap-2 mb-2 text-foreground font-bold"><CalendarOff className="w-4 h-4"/> {req.leaveType} {t("leave", "Leave")}</div>
 <div className="text-sm text-muted-foreground font-medium">
 {req.startDate} {t("to", "to")} {req.endDate} <span className="text-muted-foreground font-normal">({req.days} {t("days", "days)")}</span>
 </div>
 </div>
 
 <div className="text-sm">
 <span className="text-muted-foreground font-medium block mb-1">{t("reason", "Reason:")}</span>
 <p className="text-card-foreground bg-muted p-2 rounded border border-primary/40">"{req.reason}"</p>
 </div>
 </div>
 {req.status === 'Pending' && (
 <div className="p-4 bg-muted border-t border-primary/40 grid grid-cols-2 gap-3 mt-auto">
 <Button onClick={() => handleUpdateStatus(req, 'Rejected')} variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2"><X className="w-4 h-4"/> {t("reject", "Reject")}</Button>
 <Button onClick={() => handleUpdateStatus(req, 'Approved')} className="w-full bg-primary hover:bg-primary/90 text-white gap-2"><Check className="w-4 h-4"/> {t("approve", "Approve")}</Button>
 </div>
 )}
 </div>
 );
})}
 </div>
 )}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border border-primary/40">
 <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Leave Request' : 'New Leave Request'}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("employee_name", "Employee")}</label>
 <select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
 <option value="">Select Employee...</option>
 {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("leave_type", "Leave Type")}</label>
 <select value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
 <option>{t("annual", "Annual")}</option>
 <option>{t("sick", "Sick")}</option>
 <option>{t("maternity", "Maternity")}</option>
 <option>{t("emergency", "Emergency")}</option>
 </select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("start_date", "Start Date")}</label>
 <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("end_date", "End Date")}</label>
 <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="mt-1" />
 </div>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("reason", "Reason")}</label>
 <textarea 
 value={formData.reason} 
 onChange={e => setFormData({...formData, reason: e.target.value})} 
 placeholder="Enter reason..." 
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20 resize-none"
 />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateOrUpdate}>{editTargetId ? 'Save Changes' : 'Submit Request'}</Button>
 </div>
 </div>
 </div>
 )}
 {viewTargetId && (
 <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("leave_request_details", "Leave Request Details")}</SheetTitle>
 <SheetDescription>{t("read_only_view_of_leave_reques", "Read-only view of leave request.")}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {(() => {
 const req = requests.find(r => r.id === viewTargetId);
 if (!req) return null;
 return (
 <div className="space-y-4 text-sm">
 <div><span className="font-semibold text-muted-foreground">{t("employee", "Employee:")}</span> <p className="font-medium"><Link to="/employees" className="hover:underline text-primary">{req.employeeName}</Link></p></div>
 <div><span className="font-semibold text-muted-foreground">{t("type", "Type:")}</span> <p className="font-medium">{req.leaveType}</p></div>
 <div><span className="font-semibold text-muted-foreground">{t("duration", "Duration:")}</span> <p className="font-medium">{req.startDate} {t("to", "to")} {req.endDate}({req.days} {t("days", "days)")}</p></div>
 <div><span className="font-semibold text-muted-foreground">{t("reason", "Reason:")}</span> <p className="font-medium">{req.reason}</p></div>
 <div><span className="font-semibold text-muted-foreground">{t("status", "Status:")}</span> <p className="font-medium">{req.status}</p></div>
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
