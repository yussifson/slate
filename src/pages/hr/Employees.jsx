import { useState } from 'react';
import { Users, Search, Plus, Mail, Phone, Briefcase, Trash2, MoreVertical, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/hooks/integrations/useNotifications';
import { useAuth } from '@/context/AuthContext';

export default function Employees() {
  const { user } = useAuth();
  const { notifyTeam } = useNotifications();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('employee');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const employees = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [viewTargetId, setViewTargetId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    role: '',
    email: '',
    phone: '',
    salary: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleCreateOrUpdateEmployee = () => {
    if (!formData.name.trim()) return toast.error("Please enter a name");
    
    if (editTargetId) {
      const emp = employees.find(e => e.id === editTargetId);
      const payload = { ...formData, employeeId: emp.employeeId };
      
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'employee',
        payload,
        status: emp.status,
        searchText: `${formData.name} ${formData.department} ${formData.role} ${emp.employeeId}`
      }, {
        onSuccess: () => {
          toast.success('Employee updated successfully!');
          setShowModal(false);
          setEditTargetId(null);
          setFormData({
            name: '', department: '', role: '', email: '', phone: '', salary: '', startDate: new Date().toISOString().split('T')[0]
          });
        },
        onError: (err) => toast.error('Failed to update employee: ' + err.message)
      });
    } else {
      const employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = { ...formData, employeeId };

      mutateRecord.mutate({
        recordType: 'employee',
        payload,
        status: 'Active',
        searchText: `${formData.name} ${formData.department} ${formData.role} ${employeeId}`
      }, {
        onSuccess: () => {
          toast.success('Employee added successfully!');
          notifyTeam({ companyId: user?.company_id, provider: 'slack', message: `New employee onboarded: ${formData.name} as ${formData.role}`, channel: '#general' }).catch(console.error);
          setShowModal(false);
          setFormData({
            name: '', department: '', role: '', email: '', phone: '', salary: '', startDate: new Date().toISOString().split('T')[0]
          });
        },
        onError: (err) => toast.error('Failed to add employee: ' + err.message)
      });
    }
  };

  const openEdit = (emp) => {
    setFormData({
      name: emp.name || '',
      department: emp.department || '',
      role: emp.role || '',
      email: emp.email || '',
      phone: emp.phone || '',
      salary: emp.salary || '',
      startDate: emp.startDate || new Date().toISOString().split('T')[0]
    });
    setEditTargetId(emp.id);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({
      name: '', department: '', role: '', email: '', phone: '', salary: '', startDate: new Date().toISOString().split('T')[0]
    });
    setEditTargetId(null);
    setShowModal(true);
  };

  const handleUpdateStatus = (employee, newStatus) => {
    const payload = { ...employee };
    delete payload.id;
    delete payload.status;
    
    mutateRecord.mutate({
      id: employee.id,
      recordType: 'employee',
      payload,
      status: newStatus,
      searchText: `${employee.name} ${employee.department} ${employee.employeeId}`
    }, {
      onSuccess: () => toast.success(`Status updated to ${newStatus}`)
    });
  };

  const handleDeleteEmployee = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'employee' }, {
      onSuccess: () => {
        toast.success('Employee removed successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove employee: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = employees.filter(e => 
    e.name?.toLowerCase().includes(search.toLowerCase()) || 
    e.department?.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStaff = employees.length;
  const activeStaff = employees.filter(e => e.status === 'Active').length;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;
  const departments = new Set(employees.map(e => e.department).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage staff profiles and directories</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{totalStaff}</p>
            <p className="text-xs text-muted-foreground">Total Staff</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{activeStaff}</p>
            <p className="text-xs text-muted-foreground">Active Staff</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{onLeave}</p>
            <p className="text-xs text-muted-foreground">On Leave</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{departments}</p>
            <p className="text-xs text-muted-foreground">Departments</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search employee name or department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading employees...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600" />
              <p className="font-semibold text-lg text-card-foreground">No employees found</p>
              <p className="text-xs mt-1">Add your first employee to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Role & Department</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Contact Info</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-card-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.employeeId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-card-foreground">{emp.role}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Briefcase className="w-3 h-3"/> {emp.department}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> {emp.email}</div>
                      <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> {emp.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={emp.status}
                        onChange={e => handleUpdateStatus(emp, e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs font-bold"
                      >
                        <option>Active</option>
                        <option>On Leave</option>
                        <option>Terminated</option>
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
                          <DropdownMenuItem onClick={() => setViewTargetId(emp.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(emp)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(emp.id)} className="text-red-600">
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
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Employee' : 'Add Employee'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Alice Johnson" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="alice@example.com" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Department</label>
                  <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Engineering" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Role</label>
                  <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Senior Developer" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Salary</label>
                  <Input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="6000" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateOrUpdateEmployee}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {viewTargetId && (
        <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Employee Details</SheetTitle>
              <SheetDescription>Read-only view of employee record.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {(() => {
                const emp = employees.find(e => e.id === viewTargetId);
                if (!emp) return null;
                return (
                  <div className="space-y-4 text-sm">
                    <div><span className="font-semibold text-muted-foreground">ID:</span> <p className="font-medium">{emp.employeeId}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Name:</span> <p className="font-medium">{emp.name}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Department:</span> <p className="font-medium">{emp.department}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Role:</span> <p className="font-medium">{emp.role}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Email:</span> <p className="font-medium">{emp.email}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Phone:</span> <p className="font-medium">{emp.phone}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Salary:</span> <p className="font-medium">${emp.salary}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Start Date:</span> <p className="font-medium">{emp.startDate}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Status:</span> <p className="font-medium">{emp.status}</p></div>
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
        onConfirm={handleDeleteEmployee}
        title="Remove Employee"
        message="Are you sure you want to completely remove this employee? This action is permanent."
      />
    </div>
  );
}
