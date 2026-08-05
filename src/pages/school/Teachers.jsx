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
        <Button onClick={handleAddNew} className="bg-[#0066fe] hover:bg-[#0055d4] text-white border-0 shadow-lg shadow-[#0066fe]/15 rounded-full px-6 h-10 text-sm font-semibold transition-all hover:scale-[1.02] hover:-translate-y-0.5">
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      }
    >
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Staff', value: stats.total, sub: 'All staff members', icon: Users, theme: 'blue' },
          { label: 'Active Staff', value: stats.active, sub: 'Currently active', icon: UserCheck, theme: 'green' },
          { label: 'Departments', value: stats.depts, sub: 'Active departments', icon: Briefcase, theme: 'orange' },
        ].map(({ label, value, sub, icon: Icon, theme }) => {
          const styles = {
            blue: {
              card: 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-100/60 dark:border-blue-900/20',
              iconBg: 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/30',
              iconColor: 'text-blue-600 dark:text-blue-400'
            },
            green: {
              card: 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20',
              iconBg: 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30',
              iconColor: 'text-emerald-600 dark:text-emerald-400'
            },
            orange: {
              card: 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-100/60 dark:border-amber-900/20',
              iconBg: 'bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/30',
              iconColor: 'text-amber-600 dark:text-amber-400'
            }
          };
          const themeStyle = styles[theme] || styles.blue;
          return (
            <div 
              key={label}
              className={`border rounded-[2.2rem] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-[0_32px_64px_rgba(0,0,0,0.04)] transition-all duration-300 flex items-center gap-5 relative overflow-hidden group ${themeStyle.card}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50/50 dark:from-zinc-800/10 to-transparent rounded-full pointer-events-none" />
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${themeStyle.iconBg}`}>
                <Icon className={`w-5 h-5 ${themeStyle.iconColor}`} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight leading-none">{value}</p>
                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-2">{label}</p>
                {sub && <p className="text-[10px] text-slate-400/80 dark:text-zinc-500/80 mt-1 font-medium">{sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-100 dark:border-zinc-800/80 rounded-[1.75rem] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search staff by name, subject..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-slate-200/50 dark:border-zinc-700/50 text-sm h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0066fe] transition-all" />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[140px] h-10 bg-white/60 dark:bg-zinc-800/80 hover:bg-slate-50/80 dark:hover:bg-zinc-800 border-slate-200/60 dark:border-zinc-700 text-sm rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[125px] h-10 bg-white/60 dark:bg-zinc-800/80 hover:bg-slate-50/80 dark:hover:bg-zinc-800 border-slate-200/60 dark:border-zinc-700 text-sm rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {(search || departmentFilter !== 'All' || statusFilter !== 'All') && (
          <button onClick={() => { setSearch(''); setDepartmentFilter('All'); setStatusFilter('All'); }} className="text-xs font-bold text-[#0066fe] hover:text-[#0055d4] transition-colors ml-2">Reset</button>
        )}
        <div className="ml-auto text-xs text-slate-400 dark:text-zinc-500 font-bold">{filtered.length} staff</div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2.2rem] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-800/60 border-b border-slate-100/80 dark:border-zinc-800/80 uppercase tracking-widest">
              <tr>
                {['Staff Member', 'Position', 'Department', 'Subject', 'Class', 'Status', ''].map((h, i) => (
                  <th key={h || i} className={`px-5 py-4.5 font-bold ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 dark:divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0066fe] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-semibold mt-1">Loading staff…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Briefcase className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-slate-400 dark:text-zinc-500 text-sm font-semibold">No staff found</p>
                    <button onClick={handleAddNew} className="text-xs font-bold text-[#0066fe] hover:text-[#0055d4] transition-colors mt-2 block mx-auto">Add your first staff member →</button>
                  </td>
                </tr>
              ) : filtered.map(teacher => {
                const isActive = teacher.status === 'Active';
                const isOnLeave = teacher.status === 'On Leave' || teacher.status === 'On leave';
                const initials = getInitials(teacher.full_name);
                const colors = [
                  'from-blue-400 to-indigo-500 text-blue-50 shadow-blue-500/10',
                  'from-emerald-400 to-teal-500 text-emerald-50 shadow-emerald-500/10',
                  'from-amber-400 to-orange-500 text-amber-50 shadow-amber-500/10',
                  'from-pink-400 to-rose-500 text-pink-50 shadow-pink-500/10',
                  'from-purple-400 to-violet-500 text-purple-50 shadow-purple-500/10',
                ];
                const colorIndex = (teacher.full_name || 'T').charCodeAt(0) % colors.length;
                const gradColor = colors[colorIndex];
                
                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-5 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8.5 h-8.5 rounded-full bg-gradient-to-br ${gradColor} flex items-center justify-center text-[11px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex-shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm">{teacher.full_name}</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 font-medium">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4.5 text-slate-700 dark:text-zinc-300 font-bold text-sm">{teacher.position || '—'}</td>
                    <td className="px-5 py-4.5 text-slate-700 dark:text-zinc-300 font-bold text-sm">{teacher.department || '—'}</td>
                    <td className="px-5 py-4.5 text-slate-700 dark:text-zinc-300 font-bold text-sm">{teacher.subject || '—'}</td>
                    <td className="px-5 py-4.5 text-slate-700 dark:text-zinc-300 font-bold text-sm">{teacher.class_assigned || '—'}</td>
                    <td className="px-5 py-4.5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        isActive ? 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-850/30' : isOnLeave ? 'bg-amber-50/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100/30 dark:border-amber-850/30' : 'bg-rose-50/80 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100/30 dark:border-rose-850/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : isOnLeave ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => handleEdit(teacher)} className="cursor-pointer font-medium text-xs"><Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(teacher)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20 cursor-pointer font-medium text-xs"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Record</DropdownMenuItem>
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
