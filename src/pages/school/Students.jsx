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
import { motion } from 'framer-motion';

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
          <Button variant="outline" className="bg-white dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 rounded-full font-semibold px-5 h-10 text-sm shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all">
            Export
          </Button>
          <Button onClick={handleAddNew} className="bg-[#0066fe] hover:bg-[#0055d4] text-white border-0 shadow-lg shadow-[#0066fe]/15 rounded-full px-6 h-10 text-sm font-semibold transition-all hover:scale-[1.02] hover:-translate-y-0.5">
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      }
    >
      {/* ── Stat Cards (Compact Top-Line Reference Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Stat 1: Total Students */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-card dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Total Students</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 cursor-pointer" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{stats.total}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +4%
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal ml-1">vs last yr</span>
            </span>
          </div>
        </motion.div>

        {/* Stat 2: Active Students */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-card dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Active Students</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 cursor-pointer" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{stats.active}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 96%
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal ml-1">active</span>
            </span>
          </div>
        </motion.div>

        {/* Stat 3: On Leave */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-card dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <UserMinus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">On Leave</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 cursor-pointer" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{stats.onLeave}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-3 h-3 mr-0.5" /> -7%
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal ml-1">this term</span>
            </span>
          </div>
        </motion.div>

        {/* Stat 4: Avg Attendance */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-card dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <ListChecks className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Avg Attendance</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 cursor-pointer" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{stats.attendanceRate}%</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +2.1%
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal ml-1">this sem</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Filters & Actions Row ── */}
      <div className="bg-card/85 dark:bg-zinc-900/70 backdrop-blur-md border border-slate-100/70 dark:border-zinc-800/80 rounded-[1.75rem] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.015)] flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search Students"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-11 bg-slate-50/50 hover:bg-slate-100/40 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80 border-slate-200/60 dark:border-zinc-700/60 text-sm h-11 rounded-full focus-visible:ring-2 focus-visible:ring-[#0066fe]/80 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
          />
        </div>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[140px] h-11 bg-white/60 dark:bg-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/80 border-slate-200/60 dark:border-zinc-700 text-sm rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="All">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[140px] h-11 bg-white/60 dark:bg-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/80 border-slate-200/60 dark:border-zinc-700 text-sm rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="All">All Genders</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-11 bg-white/60 dark:bg-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/80 border-slate-200/60 dark:border-zinc-700 text-sm rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On leave">On leave</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || classFilter !== 'All' || genderFilter !== 'All' || statusFilter !== 'All') && (
          <button onClick={handleResetFilters} className="text-xs font-bold text-[#0066fe] hover:text-[#0055d4] transition-colors ml-2 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 px-4 h-11 rounded-full border border-blue-100/30">
            Reset Filters
          </button>
        )}
      </div>

      {/* ── Table Container ── */}
      <div className="bg-card/75 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-100 dark:border-zinc-800/80 rounded-[2.2rem] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.015)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 bg-slate-50/40 dark:bg-zinc-800/30 border-b border-slate-100/80 dark:border-zinc-800/80 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 dark:border-zinc-700 text-[#0066fe] focus:ring-[#0066fe] bg-white dark:bg-zinc-800 w-4 h-4 cursor-pointer"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-6 py-5 font-bold">Number ↕</th>
                <th className="px-6 py-5 font-bold">Full Name ↕</th>
                <th className="px-6 py-5 font-bold">Grade ↕</th>
                <th className="px-6 py-5 font-bold">Gender ↕</th>
                <th className="px-6 py-5 font-bold">Attendance ↕</th>
                <th className="px-6 py-5 font-bold">Guardian ↕</th>
                <th className="px-6 py-5 font-bold">Status ↕</th>
                <th className="px-6 py-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/40 dark:divide-zinc-800/30">
              {studentsLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0066fe] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-semibold mt-2">Loading students…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <Users className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-slate-400 dark:text-zinc-500 text-sm font-semibold">No students found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isMale = student.gender === 'Male';
                  const isActive = student.status === 'Active';
                  const initials = `${student.name?.split(' ')[0]?.charAt(0) || ''}${student.name?.split(' ')[1]?.charAt(0) || ''}`.toUpperCase() || 'S';
                  
                  const colors = [
                    'from-blue-400 to-indigo-500 text-blue-50 shadow-blue-500/10',
                    'from-emerald-400 to-teal-500 text-emerald-50 shadow-emerald-500/10',
                    'from-amber-400 to-orange-500 text-amber-50 shadow-amber-500/10',
                    'from-pink-400 to-rose-500 text-pink-50 shadow-pink-500/10',
                    'from-purple-400 to-violet-500 text-purple-50 shadow-purple-500/10',
                  ];
                  const colorIndex = (student.name || 'S').charCodeAt(0) % colors.length;
                  const gradColor = colors[colorIndex];
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 transition-all duration-200 group">
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 dark:border-zinc-700 text-[#0066fe] focus:ring-[#0066fe] bg-white dark:bg-zinc-800 w-4 h-4 cursor-pointer"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-200 text-sm">
                        {student.student_id || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradColor} flex items-center justify-center text-[11px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex-shrink-0`}>
                            {initials}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-zinc-300 font-bold text-sm">
                        {student.class_name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          isMale ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                        }`}>
                          <span className="mr-1 text-[11px] font-medium">{isMale ? '♂' : '♀'}</span>
                          {student.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-zinc-300 font-bold text-sm">
                        {stats.attendanceRate}%
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-zinc-300 font-bold text-sm">
                        {student.parent_name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : student.status === 'On leave' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : student.status === 'On leave' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                          {student.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleEdit(student)} className="cursor-pointer font-medium text-xs">
                              <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(student)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20 cursor-pointer font-medium text-xs">
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Student
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
