import { useState } from 'react';
import { DollarSign, Search, Plus, Download, Trash2, FileText, MoreVertical, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function Payroll() {
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('payroll_run');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const payrolls = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Pending',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [viewTargetId, setViewTargetId] = useState(null);

  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    period: 'May 2026',
    grossPay: 0,
    deductions: 0
  });

  const handleCreateOrUpdatePayroll = () => {
    if (!formData.employeeName.trim() || !formData.employeeId.trim()) {
      return toast.error("Please enter employee details");
    }
    
    const gross = parseFloat(formData.grossPay) || 0;
    const ded = parseFloat(formData.deductions) || 0;
    const netPay = gross - ded;

    if (editTargetId) {
      const pay = payrolls.find(p => p.id === editTargetId);
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'payroll_run',
        payload: { ...formData, grossPay: gross, deductions: ded, netPay },
        status: pay.status,
        searchText: `${formData.employeeName} ${formData.employeeId} ${formData.period}`
      }, {
        onSuccess: () => {
          toast.success('Payroll record updated!');
          setShowModal(false);
          setEditTargetId(null);
          setFormData({ employeeName: '', employeeId: '', period: 'May 2026', grossPay: 0, deductions: 0 });
        },
        onError: (err) => toast.error('Failed: ' + err.message)
      });
    } else {
      mutateRecord.mutate({
        recordType: 'payroll_run',
        payload: { ...formData, grossPay: gross, deductions: ded, netPay },
        status: 'Pending',
        searchText: `${formData.employeeName} ${formData.employeeId} ${formData.period}`
      }, {
        onSuccess: () => {
          toast.success('Payroll record added!');
          setShowModal(false);
          setFormData({ employeeName: '', employeeId: '', period: 'May 2026', grossPay: 0, deductions: 0 });
        },
        onError: (err) => toast.error('Failed: ' + err.message)
      });
    }
  };

  const openEdit = (pay) => {
    setFormData({
      employeeName: pay.employeeName || '',
      employeeId: pay.employeeId || '',
      period: pay.period || 'May 2026',
      grossPay: pay.grossPay || 0,
      deductions: pay.deductions || 0
    });
    setEditTargetId(pay.id);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({ employeeName: '', employeeId: '', period: 'May 2026', grossPay: 0, deductions: 0 });
    setEditTargetId(null);
    setShowModal(true);
  };

  const handleUpdateStatus = (payroll, newStatus) => {
    const payload = { ...payroll };
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
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'payroll_run' }, {
      onSuccess: () => {
        toast.success('Record deleted!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to delete: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = payrolls.filter(p => 
    p.employeeName?.toLowerCase().includes(search.toLowerCase()) || 
    p.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayroll = payrolls.reduce((sum, p) => sum + (Number(p.netPay) || 0), 0);
  const processed = payrolls.filter(p => p.status === 'Processed').length;
  const pending = payrolls.filter(p => p.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage employee salaries and compensation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={openAdd} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" /> Add Payslip
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground mb-1">Total Payroll</p>
             <h2 className="text-3xl font-bold text-card-foreground">${totalPayroll.toLocaleString()}</h2>
           </div>
           <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
             <DollarSign className="w-6 h-6" />
           </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground mb-1">Processed</p>
             <h2 className="text-3xl font-bold text-card-foreground">{processed}</h2>
           </div>
           <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
             <FileText className="w-6 h-6" />
           </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground mb-1">Pending</p>
             <h2 className="text-3xl font-bold text-card-foreground">{pending}</h2>
           </div>
           <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
             <DollarSign className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading payroll data...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600" />
              <p className="font-semibold text-lg text-card-foreground">No payroll records</p>
              <p className="text-xs mt-1">Add a payslip to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Period</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Gross Pay</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Deductions</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Net Pay</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(pay => (
                  <tr key={pay.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-card-foreground">
                        <Link to="/employees" className="hover:underline text-primary">{pay.employeeName}</Link>
                      </p>
                      <p className="text-xs text-muted-foreground">{pay.employeeId}</p>
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">{pay.period}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">${pay.grossPay?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-red-500">-${pay.deductions?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-card-foreground">${pay.netPay?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={pay.status}
                        onChange={e => handleUpdateStatus(pay, e.target.value)}
                        className={`rounded-md border border-input px-2 py-1 text-xs font-bold ${
                          pay.status === 'Processed' ? 'bg-green-100 text-green-700' : 
                          pay.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processed">Processed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewTargetId(pay.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(pay)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(pay.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Payslip' : 'Add Payslip'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Employee Name</label>
                <Input value={formData.employeeName} onChange={e => setFormData({...formData, employeeName: e.target.value})} placeholder="Alice Johnson" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Employee ID</label>
                <Input value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} placeholder="EMP-1234" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Period</label>
                <Input value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} placeholder="May 2026" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Gross Pay ($)</label>
                  <Input type="number" value={formData.grossPay} onChange={e => setFormData({...formData, grossPay: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Deductions ($)</label>
                  <Input type="number" value={formData.deductions} onChange={e => setFormData({...formData, deductions: e.target.value})} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateOrUpdatePayroll}>{editTargetId ? 'Save Changes' : 'Save Payslip'}</Button>
            </div>
          </div>
        </div>
      )}

      {viewTargetId && (
        <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Payslip Details</SheetTitle>
              <SheetDescription>Read-only view of payslip record.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {(() => {
                const pay = payrolls.find(p => p.id === viewTargetId);
                if (!pay) return null;
                return (
                  <div className="space-y-4 text-sm">
                    <div><span className="font-semibold text-muted-foreground">Employee:</span> <p className="font-medium"><Link to="/employees" className="hover:underline text-primary">{pay.employeeName}</Link></p></div>
                    <div><span className="font-semibold text-muted-foreground">Employee ID:</span> <p className="font-medium">{pay.employeeId}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Period:</span> <p className="font-medium">{pay.period}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Gross Pay:</span> <p className="font-medium">${pay.grossPay?.toLocaleString()}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Deductions:</span> <p className="font-medium text-red-500">-${pay.deductions?.toLocaleString()}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Net Pay:</span> <p className="font-medium text-green-600 font-bold">${pay.netPay?.toLocaleString()}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Status:</span> <p className="font-medium">{pay.status}</p></div>
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
