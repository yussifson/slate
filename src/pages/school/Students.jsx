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
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Users, UserCheck, GraduationCap, Award, ChevronDown } from 'lucide-react';
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

  // Live real data hooks — NO hardcoded mock fallback numbers
  const { data: rawStudents = [], isLoading: studentsLoading } = useIndustryRecords('school_student');
  const { data: rawClasses = [] } = useIndustryRecords('school_class');
  
  const mutate = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const students = useMemo(() => rawStudents.map(r => ({ id: r.id, status: r.status, ...r.data })), [rawStudents]);
  const classes = useMemo(() => rawClasses.map(r => r.data.name).filter(Boolean), [rawClasses]);

  // Real dynamic database counts
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => (s.status || 'Active').toLowerCase() === 'active').length;
    const primaryCount = students.filter(s => (s.level || '').toLowerCase() === 'primary').length;
    const jhsCount = students.filter(s => (s.level || '').toLowerCase() === 'jhs').length;
    return { total, active, primaryCount, jhsCount };
  }, [students]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q));
    }
    if (classFilter !== 'All') result = result.filter(s => s.class_name === classFilter);
    if (genderFilter !== 'All') result = result.filter(s => s.gender === genderFilter);
    if (statusFilter !== 'All') result = result.filter(s => (s.status || 'Active') === statusFilter);
    return result;
  }, [students, searchQuery, classFilter, genderFilter, statusFilter]);

  const handleResetFilters = () => { setSearchQuery(''); setClassFilter('All'); setGenderFilter('All'); setStatusFilter('All'); };

  const handleAddNew = () => {
    setFormData({
      name: '', gender: 'Male', dob: '', class_name: classes[0] || '', level: 'Primary',
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
    if (!formData.name) { toast.error('Student name is required'); return; }
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
    { name: 'student_id', label: 'Student ID', type: 'text', required: true, readOnly: true },
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., Aulia Rahman' },
    { name: 'gender', label: 'Gender', type: 'select', options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }] },
    { name: 'dob', label: 'Date of Birth', type: 'date' },
    { name: 'level', label: 'Level', type: 'select', options: [{ value: 'KG', label: 'KG' }, { value: 'Primary', label: 'Primary' }, { value: 'JHS', label: 'JHS' }] },
    { name: 'class_name', label: 'Class / Grade', type: 'select', options: classes.length ? classes.map(c => ({ value: c, label: c })) : [{ value: 'Basic 1', label: 'Basic 1' }] },
    { name: 'parent_name', label: 'Guardian Name', type: 'text', placeholder: 'e.g., Nugroho Santoso' },
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

  return (
    <SchoolPageShell>
      {/* ── Top Purple/Pink Gradient Hero Banner (Matches Reference Mockup 100%) ── */}
      <div 
        className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #f97316 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Students Directory</h1>
              <p className="text-white/80 text-sm mt-1 font-medium">Manage and monitor all student records across grade levels</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block border-r border-white/20 pr-6">
              <p className="text-xs uppercase font-bold tracking-wider text-white/70">Total Students</p>
              <p className="text-3xl font-black tracking-tight">{stats.total}</p>
            </div>

            <Button 
              onClick={handleAddNew} 
              className="bg-white/20 hover:bg-white/30 text-white border border-white/40 shadow-lg backdrop-blur-md h-11 px-6 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
        
        {/* Subtle background glow circle matching mockup */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* ── Stat Cards with Colored Icons (Matches Reference Mockup 100%) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Students */}
        <div className="bg-card rounded-3xl border border-border/40 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Students</p>
          <h3 className="text-3xl font-black text-foreground tracking-tight">{stats.total}</h3>
          <p className="text-xs text-muted-foreground/70 mt-1 font-medium">All enrolled</p>
        </div>

        {/* Active Students */}
        <div className="bg-card rounded-3xl border border-border/40 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-4">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">Active Students</p>
          <h3 className="text-3xl font-black text-foreground tracking-tight">{stats.active}</h3>
          <p className="text-xs text-muted-foreground/70 mt-1 font-medium">Currently active</p>
        </div>

        {/* Primary Level */}
        <div className="bg-card rounded-3xl border border-border/40 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Primary</p>
          <h3 className="text-3xl font-black text-foreground tracking-tight">{stats.primaryCount}</h3>
          <p className="text-xs text-muted-foreground/70 mt-1 font-medium">Primary students</p>
        </div>

        {/* JHS Level */}
        <div className="bg-card rounded-3xl border border-border/40 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">JHS</p>
          <h3 className="text-3xl font-black text-foreground tracking-tight">{stats.jhsCount}</h3>
          <p className="text-xs text-muted-foreground/70 mt-1 font-medium">JHS students</p>
        </div>
      </div>

      {/* ── Filter Bar (Matches Mockup Layout) ── */}
      <div className="bg-card border border-border/40 rounded-3xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input 
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border/40 text-sm h-10 rounded-2xl focus-visible:ring-1"
            />
          </div>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[120px] h-10 bg-background border-border/40 text-sm rounded-2xl">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[110px] h-10 bg-background border-border/40 text-sm rounded-2xl">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] h-10 bg-background border-border/40 text-sm rounded-2xl">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="On leave">On leave</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || classFilter !== 'All' || genderFilter !== 'All' || statusFilter !== 'All') && (
            <button onClick={handleResetFilters} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline">
              Reset
            </button>
          )}
        </div>

        <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-2xl shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add New
        </Button>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground/70 bg-muted/20 border-b border-border/30 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-border/60 text-indigo-600 focus:ring-indigo-600 bg-background"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-4">Student ID</th>
                <th className="px-4 py-4">Student Name</th>
                <th className="px-4 py-4">Class</th>
                <th className="px-4 py-4">Gender</th>
                <th className="px-4 py-4">Guardian</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {studentsLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Loading student records…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-semibold">No student records found in database.</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Click "Add New" to add your first student.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isMale = student.gender === 'Male';
                  const isActive = (student.status || 'Active') === 'Active';
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
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-muted-foreground">
                        {student.student_id || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <span className="font-bold text-foreground text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-foreground font-semibold text-sm">
                        {student.class_name || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold ${
                          isMale ? 'bg-blue-500/10 text-blue-600' : 'bg-pink-500/10 text-pink-600'
                        }`}>
                          <span className="mr-1 text-[11px]">{isMale ? '♂' : '♀'}</span>
                          {student.gender}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground font-medium text-sm">
                        {student.parent_name || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
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
        fields={formFields} formData={formData}
        onChange={handleFormChange} onSubmit={handleSubmit}
        submitText={editingId ? 'Update Student' : 'Add Student'}
      />
    </SchoolPageShell>
  );
}
