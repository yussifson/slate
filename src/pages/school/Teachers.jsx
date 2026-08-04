import React, { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Users, Search, Plus, Briefcase, UserCheck, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import ModalForm from '@/components/school/ModalForm';
import SchoolPageShell from '@/components/school/SchoolPageShell';
import { statCardStyle, tableContainerStyle, filterBarStyle, iconBadgeStyle, STAT_COLORS, addButtonStyle, tableHeaderStyle, tableCellStyle, statusBadgeStyle } from '@/components/school/premiumStyles';
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
    full_name: '', email: '', phone: '', gender: 'Male',
    subject: '', qualification: '', class_assigned: '', 
    department: 'Academics', position: 'Class Teacher', status: 'Active', notes: ''
  });

  const teachers = useMemo(() => rawTeachers.map(r => ({ id: r.id, status: r.status, ...r.data })), [rawTeachers]);
  const classes = useMemo(() => rawClasses.map(r => r.data.name).filter(Boolean), [rawClasses]);

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
    setFormData({ full_name: '', email: '', phone: '', gender: 'Male', subject: '', qualification: '', class_assigned: '', department: 'Academics', position: 'Class Teacher', status: 'Active', notes: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (teacher) => {
    setFormData({
      full_name: teacher.full_name || '', email: teacher.email || '', phone: teacher.phone || '',
      gender: teacher.gender || 'Male', subject: teacher.subject || '', qualification: teacher.qualification || '',
      class_assigned: teacher.class_assigned || '', department: teacher.department || 'Academics',
      position: teacher.position || 'Class Teacher', status: teacher.status || 'Active', notes: teacher.notes || ''
    });
    setEditingId(teacher.id);
    setShowModal(true);
  };

  const handleDelete = async (teacher) => {
    if (!confirm(`Delete ${teacher.full_name}?`)) return;
    try { await deleteRecord.mutateAsync({ id: teacher.id, recordType: 'school_teacher' }); toast.success('Staff deleted'); }
    catch (e) { toast.error('Failed to delete'); }
  };

  const handleSubmit = async () => {
    if (!formData.full_name) { toast.error('Name is required'); return; }
    try {
      const payload = { recordType: 'school_teacher', payload: formData, status: formData.status, searchText: `${formData.full_name} ${formData.position} ${formData.subject}` };
      if (editingId) { await mutate.mutateAsync({ id: editingId, ...payload }); toast.success('Staff updated'); }
      else { await mutate.mutateAsync(payload); toast.success('Staff added'); }
      setShowModal(false);
    } catch (e) { toast.error('Failed to save'); }
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
  const avatarBgs = ['#EEF2FF', '#ECFDF5', '#FFF7ED', '#FFF1F2', '#F0F9FF', '#F5F3FF'];
  const avatarFgs = ['#4F46E5', '#059669', '#D97706', '#E11D48', '#0284C7', '#7C3AED'];
  const getAvatarIdx = (name) => (name?.charCodeAt(0) || 0) % avatarBgs.length;

  return (
    <SchoolPageShell
      title="Staff Directory"
      subtitle="Manage teachers and school staff records"
      breadcrumb={['School', 'Staff Directory']}
      actions={
        <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white" style={addButtonStyle}>
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      }
    >
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {[
          { label: 'Total Staff', value: stats.total, sub: 'All staff members', icon: Users, color: STAT_COLORS.blue },
          { label: 'Active Staff', value: stats.active, sub: 'Currently active', icon: UserCheck, color: STAT_COLORS.green },
          { label: 'Departments', value: stats.depts, sub: 'Active departments', icon: Briefcase, color: STAT_COLORS.orange },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={statCardStyle} className="group hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div style={iconBadgeStyle(color.bg)}>
                <Icon style={{ width: 22, height: 22, color: color.icon }} />
              </div>
              <div className="flex-1">
                <p style={{ color: color.label, fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
                <p className="text-foreground" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{value}</p>
                <p className="text-muted-foreground/60" style={{ fontSize: '12px', marginTop: '6px' }}>{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={filterBarStyle} className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input placeholder="Search staff by name, subject..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background border-border/40 text-sm h-9" style={{ borderRadius: '10px' }} />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[140px] h-9 bg-background border-border/40 text-sm" style={{ borderRadius: '10px' }}>
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-background border-border/40 text-sm" style={{ borderRadius: '10px' }}>
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
          <button onClick={() => { setSearch(''); setDepartmentFilter('All'); setStatusFilter('All'); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors" style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>Reset</button>
        )}
        <div className="ml-auto text-xs text-muted-foreground/60 font-medium">{filtered.length} staff</div>
      </div>

      {/* ── Table ── */}
      <div style={tableContainerStyle}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Staff Member', 'Position', 'Department', 'Subject', 'Class', 'Status', ''].map((h, i) => (
                  <th key={h || i} style={{ ...tableHeaderStyle, textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span className="text-muted-foreground/60" style={{ fontSize: '14px' }}>Loading staff…</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'hsl(var(--muted) / 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase style={{ width: '24px', height: '24px', color: 'hsl(var(--muted-foreground) / 0.3)' }} />
                    </div>
                    <p className="text-muted-foreground font-medium" style={{ fontSize: '15px' }}>No staff found</p>
                    <button onClick={handleAddNew} style={{ fontSize: '13px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Add your first staff member →</button>
                  </div>
                </td></tr>
              ) : filtered.map(teacher => {
                const isActive = teacher.status === 'Active';
                const isOnLeave = teacher.status === 'On Leave';
                const idx = getAvatarIdx(teacher.full_name);
                return (
                  <tr key={teacher.id} className="group" style={{ borderBottom: '1px solid hsl(var(--border) / 0.2)', transition: 'background-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.15)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: avatarBgs[idx], color: avatarFgs[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                          {getInitials(teacher.full_name)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: 'hsl(var(--foreground))' }}>{teacher.full_name}</p>
                          <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground) / 0.6)' }}>{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, color: 'hsl(var(--muted-foreground))' }}>{teacher.position || '—'}</td>
                    <td style={{ ...tableCellStyle, color: 'hsl(var(--muted-foreground))' }}>{teacher.department || '—'}</td>
                    <td style={{ ...tableCellStyle, color: 'hsl(var(--muted-foreground))' }}>{teacher.subject || '—'}</td>
                    <td style={{ ...tableCellStyle, color: 'hsl(var(--muted-foreground))' }}>{teacher.class_assigned || '—'}</td>
                    <td style={tableCellStyle}>
                      <span style={statusBadgeStyle(isActive)}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? '#10b981' : isOnLeave ? '#f59e0b' : '#94a3b8' }} />
                        {teacher.status}
                      </span>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ padding: '6px', borderRadius: '8px', color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => handleEdit(teacher)}><Edit2 className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(teacher)} className="text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
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
        open={showModal} onOpenChange={setShowModal}
        title={editingId ? 'Edit Staff' : 'Add Staff Member'}
        fields={formFields} formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update Staff' : 'Add Staff'}
      />
    </SchoolPageShell>
  );
}
