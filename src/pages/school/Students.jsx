import { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalForm from '@/components/school/ModalForm';
import SchoolPageShell from '@/components/school/SchoolPageShell';
import { statCardStyle, tableContainerStyle, filterBarStyle, iconBadgeStyle, STAT_COLORS, addButtonStyle, tableHeaderStyle, tableCellStyle, statusBadgeStyle } from '@/components/school/premiumStyles';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Users, UserCheck, UserMinus, ListChecks } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Students() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', gender: 'Male', dob: '', class_name: '', level: 'Primary',
    student_id: '', parent_name: '', parent_phone: '', parent_email: '',
    address: '', status: 'Active',
    enrollment_date: new Date().toISOString().split('T')[0]
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);

  const { data: rawStudents = [], isLoading: studentsLoading } = useIndustryRecords('school_student');
  const { data: rawClasses = [] } = useIndustryRecords('school_class');
  
  const mutate = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const students = useMemo(() => rawStudents.map(r => ({ id: r.id, status: r.status, ...r.data })), [rawStudents]);
  const classes = useMemo(() => rawClasses.map(r => r.data.name).filter(Boolean), [rawClasses]);

  const stats = useMemo(() => {
    const active = students.filter(s => s.status === 'Active').length;
    const onLeave = students.filter(s => s.status === 'On leave' || s.status === 'Inactive').length;
    return { total: students.length, active, onLeave };
  }, [students]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q));
    }
    if (classFilter !== 'All') result = result.filter(s => s.class_name === classFilter);
    if (genderFilter !== 'All') result = result.filter(s => s.gender === genderFilter);
    if (statusFilter !== 'All') result = result.filter(s => s.status === statusFilter);
    return result;
  }, [students, searchQuery, classFilter, genderFilter, statusFilter]);

  const handleResetFilters = () => { setSearchQuery(''); setClassFilter('All'); setGenderFilter('All'); setStatusFilter('All'); };

  const handleAddNew = () => {
    setFormData({
      name: '', gender: 'Male', dob: '', class_name: '', level: 'Primary',
      student_id: '2026' + String(students.length + 1).padStart(4, '0'),
      parent_name: '', parent_phone: '', parent_email: '', address: '', status: 'Active',
      enrollment_date: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name || '', gender: student.gender || 'Male', dob: student.dob || '',
      class_name: student.class_name || '', level: student.level || 'Primary',
      student_id: student.student_id || '', parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '', parent_email: student.parent_email || '',
      address: student.address || '', status: student.status || 'Active',
      enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0]
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (student) => {
    if (!confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    try {
      await deleteRecord.mutateAsync({ id: student.id, recordType: 'school_student' });
      toast.success('Student deleted');
    } catch (e) { toast.error('Failed to delete student'); }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.class_name) { toast.error('Name and class are required'); return; }
    try {
      const payload = { recordType: 'school_student', payload: formData, status: formData.status,
        searchText: `${formData.name} ${formData.student_id} ${formData.class_name}` };
      if (editingId) { await mutate.mutateAsync({ id: editingId, ...payload }); toast.success('Student updated'); }
      else { await mutate.mutateAsync(payload); toast.success('Student added'); }
      setShowForm(false);
    } catch (e) { toast.error('Failed to save student'); }
  };

  const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const formFields = [
    { name: 'student_id', label: 'Number', type: 'text', required: true, readOnly: true },
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., Aulia Rahman' },
    { name: 'gender', label: 'Gender', type: 'select', options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }] },
    { name: 'dob', label: 'Date of Birth', type: 'date' },
    { name: 'level', label: 'Level', type: 'select', options: [{ value: 'KG', label: 'KG' }, { value: 'Primary', label: 'Primary' }, { value: 'JHS', label: 'JHS' }] },
    { name: 'class_name', label: 'Grade', type: 'select', required: true, options: classes.map(c => ({ value: c, label: c })) },
    { name: 'parent_name', label: 'Guardian', type: 'text', placeholder: 'e.g., Nugroho Santoso' },
    { name: 'parent_phone', label: 'Guardian Phone', type: 'tel', placeholder: '+1234567890' },
    { name: 'parent_email', label: 'Guardian Email', type: 'email', placeholder: 'parent@example.com' },
    { name: 'address', label: 'Address', type: 'text', placeholder: 'Home Address' },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'Active', label: 'Active' }, { value: 'On leave', label: 'On leave' }, { value: 'Inactive', label: 'Inactive' }] },
    { name: 'enrollment_date', label: 'Enrollment Date', type: 'date' }
  ];

  const toggleStudent = (id) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) setSelectedStudents([]);
    else setSelectedStudents(filteredStudents.map(s => s.id));
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
  const avatarBgs = ['#EEF2FF', '#ECFDF5', '#FFF7ED', '#FFF1F2', '#F0F9FF', '#F5F3FF'];
  const avatarFgs = ['#4F46E5', '#059669', '#D97706', '#E11D48', '#0284C7', '#7C3AED'];
  const getAvatarIdx = (name) => (name?.charCodeAt(0) || 0) % avatarBgs.length;

  const hasActiveFilters = searchQuery || classFilter !== 'All' || genderFilter !== 'All' || statusFilter !== 'All';

  const statCards = [
    { label: 'Total Students', value: stats.total, sub: 'All enrolled', icon: Users, color: STAT_COLORS.blue },
    { label: 'Active Students', value: stats.active, sub: 'Currently active', icon: UserCheck, color: STAT_COLORS.green },
    { label: 'On Leave', value: stats.onLeave, sub: 'This semester', icon: UserMinus, color: STAT_COLORS.orange },
    { label: 'Avg Attendance', value: '93%', sub: 'This semester', icon: ListChecks, color: STAT_COLORS.sky },
  ];

  return (
    <SchoolPageShell
      title="Student Directory"
      subtitle="Manage and monitor all enrolled students"
      breadcrumb={['School', 'Students']}
      actions={
        <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white" style={addButtonStyle}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      }
    >
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={statCardStyle} className="group hover:shadow-lg transition-all duration-200 cursor-default">
            <div className="flex items-start gap-4">
              <div style={iconBadgeStyle(color.bg)}>
                <Icon style={{ width: 22, height: 22, color: color.icon }} />
              </div>
              <div className="flex-1 min-w-0">
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
          <Input 
            placeholder="Search by name or student ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border/40 text-sm h-9"
            style={{ borderRadius: '10px' }}
          />
        </div>
        
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[130px] h-9 bg-background border-border/40 text-sm" style={{ borderRadius: '10px' }}>
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-background border-border/40 text-sm" style={{ borderRadius: '10px' }}>
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-background border-border/40 text-sm" style={{ borderRadius: '10px' }}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On leave">On leave</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button onClick={handleResetFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors" style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            Reset Filters
          </button>
        )}

        <div className="ml-auto text-xs text-muted-foreground/60 font-medium">
          {filteredStudents.length} of {students.length}
        </div>
      </div>

      {/* ── Student Table ── */}
      <div style={tableContainerStyle}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th style={{ ...tableHeaderStyle, width: '48px' }}>
                  <input 
                    type="checkbox" 
                    className="rounded border-border/50 text-indigo-600 focus:ring-indigo-600"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                {['Number', 'Full Name', 'Grade', 'Gender', 'Attendance', 'Guardian', 'Status', ''].map((h, i) => (
                  <th key={h || i} style={{ ...tableHeaderStyle, textAlign: i === 7 ? 'right' : 'left' }}>
                    {h}{h && <span style={{ marginLeft: '4px', opacity: 0.4, fontSize: '10px' }}>↕</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentsLoading ? (
                <tr>
                  <td colSpan={9} style={{ ...tableCellStyle, textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '28px', height: '28px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span className="text-muted-foreground/60" style={{ fontSize: '14px' }}>Loading students…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...tableCellStyle, textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'hsl(var(--muted) / 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users style={{ width: '24px', height: '24px', color: 'hsl(var(--muted-foreground) / 0.3)' }} />
                      </div>
                      <p className="text-muted-foreground font-medium" style={{ fontSize: '15px' }}>No students found</p>
                      <p className="text-muted-foreground/50" style={{ fontSize: '13px' }}>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isMale = student.gender === 'Male';
                  const isActive = student.status === 'Active';
                  const idx = getAvatarIdx(student.name);
                  const attendance = Math.max(70, Math.min(100, 100 - (student.student_id?.length || 0) + (student.name?.length || 0) * 2));
                  
                  return (
                    <tr key={student.id} className="group" style={{ borderBottom: '1px solid hsl(var(--border) / 0.2)', transition: 'background-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.15)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={tableCellStyle}>
                        <input type="checkbox" className="rounded border-border/50 text-indigo-600 focus:ring-indigo-600"
                          checked={selectedStudents.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                      </td>
                      <td style={{ ...tableCellStyle, fontFamily: 'monospace', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                        {student.student_id || '—'}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: avatarBgs[idx], color: avatarFgs[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                            {getInitials(student.name)}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: 'hsl(var(--foreground))' }}>{student.name}</span>
                        </div>
                      </td>
                      <td style={{ ...tableCellStyle, color: 'hsl(var(--muted-foreground))' }}>
                        {student.class_name || '—'}
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                          backgroundColor: isMale ? 'rgba(59, 130, 246, 0.08)' : 'rgba(236, 72, 153, 0.08)',
                          color: isMale ? '#3b82f6' : '#ec4899',
                        }}>
                          {isMale ? '♂' : '♀'} {student.gender}
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                        {attendance}%
                      </td>
                      <td style={{ ...tableCellStyle, color: 'hsl(var(--muted-foreground))' }}>
                        {student.parent_name || '—'}
                      </td>
                      <td style={tableCellStyle}>
                        <span style={statusBadgeStyle(isActive)}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? '#10b981' : '#f43f5e' }} />
                          {student.status || 'On leave'}
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ padding: '6px', borderRadius: '8px', color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(student)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredStudents.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid hsl(var(--border) / 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'hsl(var(--muted-foreground) / 0.6)' }}>
            <span>{selectedStudents.length > 0 ? `${selectedStudents.length} selected` : `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}</span>
            <span>Last updated: Just now</span>
          </div>
        )}
      </div>

      <ModalForm
        open={showForm} onOpenChange={setShowForm}
        title={editingId ? 'Edit Student' : 'Add New Student'}
        fields={formFields} formData={formData}
        onChange={handleFormChange} onSubmit={handleSubmit}
        submitText={editingId ? 'Update Student' : 'Add Student'}
      />
    </SchoolPageShell>
  );
}
