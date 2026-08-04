import React, { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Users, Search, Plus, Briefcase, GraduationCap, UserCheck, MoreHorizontal, Edit2, Trash2, Mail, Phone, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import ModalForm from '@/components/school/ModalForm';
import SchoolPageShell from '@/components/school/SchoolPageShell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Teachers() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: rawTeachers = [], isLoading } = useIndustryRecords('school_teacher');
  const { data: rawClasses = [] } = useIndustryRecords('school_class');
  
  const mutate = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    full_name: '', 
    email: '', 
    phone: '', 
    gender: 'Male',
    subject: '', 
    qualification: '', 
    class_assigned: '', 
    department: 'Academics', 
    position: 'Class Teacher', 
    status: 'Active', 
    notes: ''
  });

  const teachers = useMemo(() => {
    return rawTeachers.map(r => ({ id: r.id, status: r.status, ...r.data }));
  }, [rawTeachers]);

  const classes = useMemo(() => {
    return rawClasses.map(r => r.data.name).filter(Boolean);
  }, [rawClasses]);

  const stats = useMemo(() => {
    const active = teachers.filter(t => t.status === 'Active').length;
    const depts = new Set(teachers.map(t => t.department)).size;
    return { total: teachers.length, active, depts };
  }, [teachers]);

  const departments = ['All', 'Academics', 'Administration', 'Support'];

  const filtered = teachers.filter(teacher =>
    (departmentFilter === 'All' || teacher.department === departmentFilter) &&
    (statusFilter === 'All' || teacher.status === statusFilter) &&
    (teacher.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     teacher.position?.toLowerCase().includes(search.toLowerCase()) ||
     teacher.subject?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddNew = () => {
    setFormData({ 
      full_name: '', email: '', phone: '', gender: 'Male',
      subject: '', qualification: '', class_assigned: '', 
      department: 'Academics', position: 'Class Teacher', status: 'Active', notes: '' 
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (teacher) => {
    setFormData({
      full_name: teacher.full_name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      gender: teacher.gender || 'Male',
      subject: teacher.subject || '',
      qualification: teacher.qualification || '',
      class_assigned: teacher.class_assigned || '',
      department: teacher.department || 'Academics',
      position: teacher.position || 'Class Teacher',
      status: teacher.status || 'Active',
      notes: teacher.notes || ''
    });
    setEditingId(teacher.id);
    setShowModal(true);
  };

  const handleDelete = async (teacher) => {
    if (!confirm(`Delete ${teacher.full_name}?`)) return;
    try {
      await deleteRecord.mutateAsync({ id: teacher.id, recordType: 'school_teacher' });
      toast.success('Teacher deleted');
    } catch (e) {
      toast.error('Failed to delete teacher');
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }
    
    try {
      const payload = {
        recordType: 'school_teacher',
        payload: formData,
        status: formData.status,
        searchText: `${formData.full_name} ${formData.email} ${formData.subject}`
      };

      if (editingId) {
        await mutate.mutateAsync({ id: editingId, ...payload });
        toast.success('Teacher updated');
      } else {
        await mutate.mutateAsync(payload);
        toast.success('Teacher added');
      }
      setShowModal(false);
    } catch (e) {
      toast.error('Failed to save teacher');
    }
  };

  const formFields = [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., Jane Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jane@school.com' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1234567890' },
    { name: 'gender', label: 'Gender', type: 'select', options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }] },
    { name: 'department', label: 'Department', type: 'select', options: [{ value: 'Academics', label: 'Academics' }, { value: 'Administration', label: 'Administration' }, { value: 'Support', label: 'Support' }] },
    { name: 'position', label: 'Position', type: 'select', options: [{ value: 'Head Teacher', label: 'Head Teacher' }, { value: 'Class Teacher', label: 'Class Teacher' }, { value: 'Subject Teacher', label: 'Subject Teacher' }, { value: 'Assistant Teacher', label: 'Assistant Teacher' }, { value: 'Admin Staff', label: 'Admin Staff' }] },
    { name: 'class_assigned', label: 'Class Assigned', type: 'select', options: [{ value: '', label: 'None' }, ...classes.map(c => ({ value: c, label: c }))] },
    { name: 'subject', label: 'Subject(s) Taught', type: 'text', placeholder: 'e.g., Mathematics, Science' },
    { name: 'qualification', label: 'Qualification', type: 'text', placeholder: 'e.g., B.Ed, M.Sc' },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'Active', label: 'Active' }, { value: 'On Leave', label: 'On Leave' }, { value: 'Inactive', label: 'Inactive' }] },
    { name: 'notes', label: 'Additional Notes', type: 'text' }
  ];

  const getInitials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
  const avatarColors = ['bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700'];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <SchoolPageShell
      title="Staff Directory"
      subtitle="Manage teachers and school staff"
      breadcrumb={['School', 'Staff Directory']}
      actions={
        <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      }
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Staff', value: stats.total, icon: Users, color: 'bg-indigo-500/10 text-indigo-600' },
          { label: 'Active Staff', value: stats.active, icon: UserCheck, color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Departments', value: stats.depts, icon: Briefcase, color: 'bg-amber-500/10 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background border-border/50 text-sm h-9"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[140px] h-9 bg-background border-border/50 text-sm">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-background border-border/50 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {(search || departmentFilter !== 'All' || statusFilter !== 'All') && (
          <button onClick={() => { setSearch(''); setDepartmentFilter('All'); setStatusFilter('All'); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Reset
          </button>
        )}
        <div className="ml-auto text-sm text-muted-foreground">{filtered.length} staff</div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff Member</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Position</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Department</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Loading staff...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No staff found</p>
                      <button onClick={handleAddNew} className="text-sm text-indigo-600 hover:underline">Add your first staff member →</button>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(teacher => {
                const isActive = teacher.status === 'Active';
                const isOnLeave = teacher.status === 'On Leave';
                return (
                  <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getAvatarColor(teacher.full_name)}`}>
                          {getInitials(teacher.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{teacher.full_name}</p>
                          <p className="text-xs text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{teacher.position || '—'}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{teacher.department || '—'}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{teacher.subject || '—'}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{teacher.class_assigned || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        isOnLeave ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : isOnLeave ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                            <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(teacher)} className="text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalForm
        open={showModal}
        onOpenChange={setShowModal}
        title={editingId ? 'Edit Staff' : 'Add Staff Member'}
        fields={formFields}
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update Staff' : 'Add Staff'}
      />
    </SchoolPageShell>
  );
}
