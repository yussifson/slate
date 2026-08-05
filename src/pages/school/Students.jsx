import { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalForm from '@/components/school/ModalForm';
import SchoolPageShell from '@/components/school/SchoolPageShell';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Users, UserCheck, UserMinus, ListChecks, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  const { data: rawAttendance = [] } = useIndustryRecords('school_attendance');
  
  const mutate = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const students = useMemo(() => rawStudents.map(r => ({ id: r.id, status: r.status, ...r.data })), [rawStudents]);
  const classes = useMemo(() => rawClasses.map(r => r.data.name).filter(Boolean), [rawClasses]);

  const attendanceRate = useMemo(() => {
    if (!rawAttendance.length) return 100;
    let totalCheckins = 0;
    let presentCount = 0;
    rawAttendance.forEach(rec => {
      const records = rec.data?.records || [];
      records.forEach(r => {
        totalCheckins++;
        if (r.status === 'Present') presentCount++;
      });
    });
    return totalCheckins > 0 ? Math.round((presentCount / totalCheckins) * 100) : 100;
  }, [rawAttendance]);

  const stats = useMemo(() => {
    const active = students.filter(s => s.status === 'Active').length;
    const onLeave = students.filter(s => s.status === 'On leave' || s.status === 'Inactive').length;
    return { total: students.length, active, onLeave, attendanceRate };
  }, [students, attendanceRate]);

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

  return (
    <SchoolPageShell
      title="Student Overview"
      subtitle="Manage and monitor students"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-card border-border/60 shadow-sm text-sm h-10 px-4">
            Export
          </Button>
          <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-10 px-5 text-sm font-semibold rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      }
    >
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Students */}
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Students</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{stats.total}</h3>
            {stats.total > 0 && (
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> 4%
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/70">vs last year</p>
        </div>

        {/* Active Students */}
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Students</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{stats.active}</h3>
            {stats.active > 0 && (
              <span className="inline-flex items-center text-[11px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                <ArrowDownRight className="w-3 h-3 mr-0.5" /> 7%
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/70">vs last semester</p>
        </div>

        {/* On Leave */}
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <UserMinus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">On Leave</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{stats.onLeave}</h3>
            {stats.onLeave > 0 && (
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> 4%
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/70">This Semester</p>
        </div>

        {/* Avg Attendance */}
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <ListChecks className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Attendance</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{stats.attendanceRate}%</h3>
          </div>
          <p className="text-[11px] text-muted-foreground/70">This Semester</p>
        </div>
      </div>

      {/* ── Filters & Actions Row ── */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input 
            placeholder="Search Students"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border/50 text-sm h-9 rounded-xl focus-visible:ring-1"
          />
        </div>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-background border-border/50 text-sm rounded-xl">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Class</SelectItem>
            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-background border-border/50 text-sm rounded-xl">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Gender</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-background border-border/50 text-sm rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On leave">On leave</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || classFilter !== 'All' || genderFilter !== 'All' || statusFilter !== 'All') && (
          <button onClick={handleResetFilters} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-1">
            Reset Filters
          </button>
        )}
      </div>

      {/* ── Table Container ── */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground/80 bg-muted/20 border-b border-border/40 font-medium">
              <tr>
                <th className="px-5 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-border/60 text-indigo-600 focus:ring-indigo-600 bg-background"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Number ↕</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Full Name ↕</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Grade ↕</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Gender ↕</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Attendance ↕</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Guardian ↕</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Status ↕</th>
                <th className="px-5 py-4 font-semibold text-right text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {studentsLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading students…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">No students found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isMale = student.gender === 'Male';
                  const isActive = student.status === 'Active';
                  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
                  
                  return (
                    <tr key={student.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-border/60 text-indigo-600 focus:ring-indigo-600 bg-background"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                        />
                      </td>
                      <td className="px-4 py-4 font-medium text-foreground text-sm">
                        {student.student_id || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <span className="font-semibold text-foreground text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-foreground font-medium text-sm">
                        {student.class_name || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isMale ? 'bg-blue-500/10 text-blue-600' : 'bg-pink-500/10 text-pink-600'
                        }`}>
                          <span className="mr-1 text-[11px]">{isMale ? '♂' : '♀'}</span>
                          {student.gender}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-foreground font-medium text-sm">
                        {stats.attendanceRate}%
                      </td>
                      <td className="px-4 py-4 text-foreground font-medium text-sm">
                        {student.parent_name || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {student.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="w-4 h-4" />
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
      </div>

      <ModalForm
        open={showForm} onOpenChange={setShowForm}
        title={editingId ? 'Edit Student' : 'Add New Student'}
        isEditing={!!editingId}
        fields={formFields} formData={formData}
        onChange={handleFormChange} onSubmit={handleSubmit}
        submitText={editingId ? 'Update Student' : 'Add Student'}
      />
    </SchoolPageShell>
  );
}
