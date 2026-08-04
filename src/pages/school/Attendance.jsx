import { useState, useMemo, useEffect } from 'react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, Check, X, Clock, Users, ClipboardList, ChevronDown, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function Attendance() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentStatuses, setStudentStatuses] = useState({});

  const { data: classes = [], isLoading: loadingClasses } = useIndustryRecords('school_class');
  const { data: students = [], isLoading: loadingStudents } = useIndustryRecords('school_student');
  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useIndustryRecords('school_attendance');
  const { mutateAsync: saveRecord, isLoading: isSaving } = useMutateIndustryRecord();

  const classList = useMemo(() => {
    return classes.map(c => c.data?.name || c.data?.class_name).filter(Boolean);
  }, [classes]);

  useEffect(() => {
    if (classList.length > 0 && !selectedClass) setSelectedClass(classList[0]);
  }, [classList, selectedClass]);

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.data?.class_name === selectedClass);
  }, [students, selectedClass]);

  const existingAttendance = useMemo(() => {
    return attendanceRecords.find(r => r.data?.class_name === selectedClass && r.data?.date === date);
  }, [attendanceRecords, selectedClass, date]);

  useEffect(() => {
    if (existingAttendance) {
      const records = existingAttendance.data?.records || [];
      const statuses = {};
      records.forEach(r => { statuses[r.student_id] = r.status; });
      classStudents.forEach(student => { if (!statuses[student.id]) statuses[student.id] = 'Present'; });
      setStudentStatuses(statuses);
    } else {
      const statuses = {};
      classStudents.forEach(student => { statuses[student.id] = 'Present'; });
      setStudentStatuses(statuses);
    }
  }, [existingAttendance, classStudents]);

  const handleStatusToggle = (studentId) => {
    setStudentStatuses(prev => {
      const current = prev[studentId];
      const next = current === 'Present' ? 'Absent' : current === 'Absent' ? 'Late' : 'Present';
      return { ...prev, [studentId]: next };
    });
  };

  const handleBulkAction = (status) => {
    const statuses = {};
    classStudents.forEach(s => { statuses[s.id] = status; });
    setStudentStatuses(statuses);
  };

  const stats = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Total: classStudents.length };
    Object.values(studentStatuses).forEach(status => { if (counts[status] !== undefined) counts[status]++; });
    return counts;
  }, [studentStatuses, classStudents]);

  const handleSave = async () => {
    if (!selectedClass) { toast.error('Please select a class first'); return; }
    try {
      const records = classStudents.map(student => ({
        student_id: student.id,
        student_name: student.data?.name || `${student.data?.first_name || ''} ${student.data?.last_name || ''}`.trim(),
        status: studentStatuses[student.id] || 'Present'
      }));
      const payload = { date, class_name: selectedClass, taken_by: user?.name || user?.email || 'Unknown User', records, summary: { present: stats.Present, absent: stats.Absent, late: stats.Late, total: stats.Total } };
      await saveRecord({ id: existingAttendance?.id, recordType: 'school_attendance', payload, searchText: `attendance_${selectedClass}_${date}` });
      toast.success(existingAttendance ? 'Attendance updated' : 'Attendance saved');
    } catch (error) {
      toast.error('Failed to save attendance');
    }
  };

  const isLoading = loadingClasses || loadingStudents || loadingAttendance;

  const getInitials = (student) => {
    const name = student.data?.name || `${student.data?.first_name || ''} ${student.data?.last_name || ''}`.trim();
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
  };
  const getStudentName = (student) => {
    return student.data?.name || `${student.data?.first_name || ''} ${student.data?.last_name || ''}`.trim() || 'Unknown';
  };

  return (
    <SchoolPageShell
      title="Class Attendance"
      subtitle="Record and track daily student attendance"
      breadcrumb={['School', 'Attendance']}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : classList.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No classes found</p>
          <p className="text-sm text-muted-foreground mt-1">Create classes before taking attendance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Controls + Student List */}
          <div className="md:col-span-2 space-y-5">
            {/* Class & Date Selector */}
            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Class</label>
                  <div className="relative">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full pl-4 pr-10 py-2.5 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                      <option value="" disabled>Select a class</option>
                      {classList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Date</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-9 pr-4 py-2.5 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              </div>
            </div>

            {/* Student List */}
            {classStudents.length === 0 ? (
              <div className="bg-card rounded-xl border border-dashed border-border py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No students in {selectedClass}</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/50 bg-muted/20 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm font-semibold text-foreground">{classStudents.length} Students</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleBulkAction('Present')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 transition-colors flex items-center gap-1">
                      <Check className="w-3 h-3" /> All Present
                    </button>
                    <button onClick={() => handleBulkAction('Absent')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" /> All Absent
                    </button>
                    <button onClick={() => handleBulkAction('Late')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 transition-colors flex items-center gap-1">
                      <Clock className="w-3 h-3" /> All Late
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {classStudents.map((student, index) => {
                    const status = studentStatuses[student.id] || 'Present';
                    const name = getStudentName(student);
                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                            status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                            status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {getInitials(student)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{name}</p>
                            <p className="text-xs text-muted-foreground">ID: {student.data?.student_id || student.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStatusToggle(student.id)}
                          className={`px-4 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-all border ${
                            status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400' :
                            status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400' :
                            'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
                          }`}
                        >
                          {status === 'Present' && <Check className="w-3 h-3" />}
                          {status === 'Absent' && <X className="w-3 h-3" />}
                          {status === 'Late' && <Clock className="w-3 h-3" />}
                          {status}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary Panel */}
          <div>
            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 sticky top-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-5">
                <ClipboardList className="w-4 h-4 text-indigo-500" /> Session Summary
              </h3>
              
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Present', count: stats.Present, icon: Check, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
                  { label: 'Absent', count: stats.Absent, icon: X, color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
                  { label: 'Late', count: stats.Late, icon: Clock, color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
                ].map(({ label, count, icon: Icon, color }) => (
                  <div key={label} className={`flex items-center justify-between p-3 rounded-xl ${color}`}>
                    <span className="font-medium flex items-center gap-2 text-sm"><Icon className="w-4 h-4" />{label}</span>
                    <span className="text-xl font-bold">{count}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50 mt-1">
                  <span className="font-medium text-sm text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">{stats.Total}</span>
                </div>
              </div>

              {/* Attendance rate */}
              {stats.Total > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">Attendance Rate</span>
                    <span className="text-sm font-bold text-foreground">{Math.round((stats.Present / stats.Total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round((stats.Present / stats.Total) * 100)}%` }} />
                  </div>
                </div>
              )}

              {existingAttendance && (
                <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <p>Attendance already saved for this date. Saving will update the existing record.</p>
                </div>
              )}

              <Button
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm"
                onClick={handleSave}
                disabled={isSaving || classStudents.length === 0}
              >
                {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {existingAttendance ? 'Update Register' : 'Save Register'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SchoolPageShell>
  );
}
