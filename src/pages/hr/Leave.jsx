import { useState } from 'react';
import { CalendarOff, Check, X, Plus, Trash2, CalendarDays, MoreVertical, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function Leave() {
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('leave_request');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const requests = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Pending',
    ...r.data
  }));

  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [viewTargetId, setViewTargetId] = useState(null);

  const [formData, setFormData] = useState({
    employeeName: '',
    leaveType: 'Annual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reason: ''
  });

  const handleCreateOrUpdate = () => {
    if (!formData.employeeName.trim()) return toast.error("Please enter employee name");
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);

    if (editTargetId) {
      const req = requests.find(r => r.id === editTargetId);
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'leave_request',
        payload: { ...formData, days },
        status: req.status,
        searchText: `${formData.employeeName} ${formData.leaveType}`
      }, {
        onSuccess: () => {
          toast.success('Leave request updated!');
          setShowModal(false);
          setEditTargetId(null);
          setFormData({
            employeeName: '', leaveType: 'Annual', 
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
        payload: { ...formData, days },
        status: 'Pending',
        searchText: `${formData.employeeName} ${formData.leaveType}`
      }, {
        onSuccess: () => {
          toast.success('Leave request submitted!');
          setShowModal(false);
          setFormData({
            employeeName: '', leaveType: 'Annual', 
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
      employeeName: req.employeeName || '',
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
      employeeName: '', leaveType: 'Annual', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
      reason: ''
    });
    setEditTargetId(null);
    setShowModal(true);
  };

  const handleUpdateStatus = (req, newStatus) => {
    const payload = { ...req };
    delete payload.id;
    delete payload.status;
    
    mutateRecord.mutate({
      id: req.id,
      recordType: 'leave_request',
      payload,
      status: newStatus,
      searchText: `${req.employeeName} ${req.leaveType}`
    }, {
      onSuccess: () => toast.success(`Leave request ${newStatus}`)
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'leave_request' }, {
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
          <h1 className="text-2xl font-bold text-card-foreground">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and approve employee time-off requests</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{requests.length}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <CalendarOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{approved}</p>
            <p className="text-xs text-muted-foreground">Approved Leaves</p>
          </div>
        </div>
      </div>

      {isDbLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading leave requests...</div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <CalendarOff className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-600" />
          <p className="font-semibold text-lg text-card-foreground">No leave requests found</p>
          <p className="text-xs mt-1">Submit a new request using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 bg-background/50 hover:bg-background">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewTargetId(req.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(req)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteTargetId(req.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
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
                    req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{req.status}</span>
                </div>
                
                <div className="bg-muted rounded-lg p-3 border border-border mb-4">
                  <div className="flex items-center gap-2 mb-2 text-foreground font-bold"><CalendarOff className="w-4 h-4"/> {req.leaveType} Leave</div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {req.startDate} to {req.endDate} <span className="text-muted-foreground font-normal">({req.days} days)</span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground font-medium block mb-1">Reason:</span>
                  <p className="text-card-foreground bg-muted p-2 rounded border border-border">"{req.reason}"</p>
                </div>
              </div>

              {req.status === 'Pending' && (
                <div className="p-4 bg-muted border-t border-border grid grid-cols-2 gap-3 mt-auto">
                  <Button onClick={() => handleUpdateStatus(req, 'Rejected')} variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2"><X className="w-4 h-4"/> Reject</Button>
                  <Button onClick={() => handleUpdateStatus(req, 'Approved')} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"><Check className="w-4 h-4"/> Approve</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Leave Request' : 'New Leave Request'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Employee Name</label>
                <Input value={formData.employeeName} onChange={e => setFormData({...formData, employeeName: e.target.value})} placeholder="e.g. Alice Johnson" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Leave Type</label>
                <select value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                  <option>Annual</option>
                  <option>Sick</option>
                  <option>Maternity</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Reason</label>
                <textarea 
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                  placeholder="Enter reason..." 
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateOrUpdate}>{editTargetId ? 'Save Changes' : 'Submit Request'}</Button>
            </div>
          </div>
        </div>
      )}

      {viewTargetId && (
        <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Leave Request Details</SheetTitle>
              <SheetDescription>Read-only view of leave request.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {(() => {
                const req = requests.find(r => r.id === viewTargetId);
                if (!req) return null;
                return (
                  <div className="space-y-4 text-sm">
                    <div><span className="font-semibold text-muted-foreground">Employee:</span> <p className="font-medium"><Link to="/employees" className="hover:underline text-primary">{req.employeeName}</Link></p></div>
                    <div><span className="font-semibold text-muted-foreground">Type:</span> <p className="font-medium">{req.leaveType}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Duration:</span> <p className="font-medium">{req.startDate} to {req.endDate} ({req.days} days)</p></div>
                    <div><span className="font-semibold text-muted-foreground">Reason:</span> <p className="font-medium">{req.reason}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Status:</span> <p className="font-medium">{req.status}</p></div>
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
