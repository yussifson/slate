import { useState, useMemo, useEffect } from 'react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, Check, X, Clock, Users, RefreshCw, ChevronDown, Save } from 'lucide-react';
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
    const updated = {};
    classStudents.forEach(student => { updated[student.id] = status; });
    setStudentStatuses(updated);
  };

  const handleSave = async () => {
    if (!selectedClass) return toast.error('Please select a class');
    if (classStudents.length === 0) return toast.error('No students in selected class');

    const records = classStudents.map(student => ({
      student_id: student.id,
      student_name: student.data?.name || `${student.data?.first_name || ''} ${student.data?.last_name || ''}`.trim(),
      status: studentStatuses[student.id] || 'Present'
    }));

    const payload = {
      class_name: selectedClass,
      date,
      records,
      recorded_by: user?.email || 'Teacher',
      recorded_at: new Date().toISOString()
    };

    try {
      if (existingAttendance) {
        await saveRecord({ id: existingAttendance.id, recordType: 'school_attendance', payload, status: 'Completed', searchText: `${selectedClass} ${date}` });
      } else {
        await saveRecord({ recordType: 'school_attendance', payload, status: 'Completed', searchText: `${selectedClass} ${date}` });
      }
      toast.success(`Attendance saved for ${selectedClass}`);
    } catch (err) {
      toast.error('Failed to save attendance');
    }
  };

  const summary = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    classStudents.forEach(s => {
      const st = studentStatuses[s.id] || 'Present';
      if (st === 'Present') present++;
      else if (st === 'Absent') absent++;
      else if (st === 'Late') late++;
    });
    const total = classStudents.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, late, total, rate };
  }, [classStudents, studentStatuses]);

  const isLoading = loadingClasses || loadingStudents || loadingAttendance;

  const getStudentName = (student) => {
    return student.data?.name || `${student.data?.first_name || ''} ${student.data?.last_name || ''}`.trim() || 'Unknown';
  };

  return (
    <SchoolPageShell
      title="Class Attendance"
      subtitle="Record and track daily student attendance"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : classList.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No classes found</p>
          <p className="text-sm text-muted-foreground mt-1">Create classes before taking attendance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Controls + Student List */}
          <div className="md:col-span-2 space-y-5">
            {/* Class & Date Selector */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Class</label>
                  <div className="relative">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full pl-4 pr-10 py-2.5 h-10 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring appearance-none">
                      <option value="" disabled>Select a class</option>
                      {classList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Date</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-9 pr-4 py-2.5 h-10 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                </div>
              </div>
            </div>

            {/* Student List */}
            {classStudents.length === 0 ? (
              <div className="bg-card rounded-2xl border border-dashed border-border/60 py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No students in {selectedClass}</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border/50 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/40 bg-muted/20 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm font-bold text-foreground">{classStudents.length} Students</span>
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
                <div className="divide-y divide-border/30">
                  {classStudents.map((student, index) => {
                    const status = studentStatuses[student.id] || 'Present';
                    const name = getStudentName(student);
                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground text-sm">{name}</span>
                        </div>
                        <button
                          onClick={() => handleStatusToggle(student.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            status === 'Present' ? 'bg-emerald-500/10 text-emerald-600' :
                            status === 'Absent' ? 'bg-rose-500/10 text-rose-600' :
                            'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {status}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary Card */}
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border/50 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5">
              <h3 className="text-base font-bold text-foreground mb-4">Daily Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">Class Attendance Rate</span>
                  <span className="text-xl font-extrabold text-foreground">{summary.rate}%</span>
                </div>
                <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${summary.rate}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-center">
                    <p className="text-xs text-emerald-600 font-bold">Present</p>
                    <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{summary.present}</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-xl text-center">
                    <p className="text-xs text-rose-600 font-bold">Absent</p>
                    <p className="text-xl font-extrabold text-rose-700 dark:text-rose-400 mt-1">{summary.absent}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-center">
                    <p className="text-xs text-amber-600 font-bold">Late</p>
                    <p className="text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{summary.late}</p>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving || classStudents.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm h-10 text-sm font-semibold mt-4">
                  <Save className="w-4 h-4 mr-2" /> Save Attendance
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SchoolPageShell>
  );
}
