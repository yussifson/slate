import { useState, useMemo, useEffect } from 'react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, Check, X, Clock, Users, ClipboardList, ChevronDown, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

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
    if (classList.length > 0 && !selectedClass) {
      setSelectedClass(classList[0]);
    }
  }, [classList, selectedClass]);

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.data?.class_name === selectedClass);
  }, [students, selectedClass]);

  const existingAttendance = useMemo(() => {
    return attendanceRecords.find(r => 
      r.data?.class_name === selectedClass && r.data?.date === date
    );
  }, [attendanceRecords, selectedClass, date]);

  useEffect(() => {
    if (existingAttendance) {
      const records = existingAttendance.data?.records || [];
      const statuses = {};
      records.forEach(r => {
        statuses[r.student_id] = r.status;
      });
      classStudents.forEach(student => {
        if (!statuses[student.id]) {
          statuses[student.id] = 'Present';
        }
      });
      setStudentStatuses(statuses);
    } else {
      const statuses = {};
      classStudents.forEach(student => {
        statuses[student.id] = 'Present';
      });
      setStudentStatuses(statuses);
    }
  }, [existingAttendance, classStudents]);

  const handleStatusToggle = (studentId) => {
    setStudentStatuses(prev => {
      const current = prev[studentId];
      let next = 'Present';
      if (current === 'Present') next = 'Absent';
      else if (current === 'Absent') next = 'Late';
      else if (current === 'Late') next = 'Present';
      return { ...prev, [studentId]: next };
    });
  };

  const handleBulkAction = (status) => {
    const statuses = {};
    classStudents.forEach(s => {
      statuses[s.id] = status;
    });
    setStudentStatuses(statuses);
  };

  const stats = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Total: classStudents.length };
    Object.values(studentStatuses).forEach(status => {
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  }, [studentStatuses, classStudents]);

  const handleSave = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    try {
      const records = classStudents.map(student => ({
        student_id: student.id,
        student_name: `${student.data?.first_name || ''} ${student.data?.last_name || ''}`.trim(),
        status: studentStatuses[student.id] || 'Present'
      }));

      const payload = {
        date,
        class_name: selectedClass,
        taken_by: user?.name || user?.email || 'Unknown User',
        records,
        summary: {
          present: stats.Present,
          absent: stats.Absent,
          late: stats.Late,
          total: stats.Total
        }
      };

      await saveRecord({
        id: existingAttendance?.id,
        recordType: 'school_attendance',
        payload,
        searchText: `attendance_${selectedClass}_${date}`
      });

      toast.success(existingAttendance ? 'Attendance updated successfully' : 'Attendance saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save attendance');
    }
  };

  const isLoading = loadingClasses || loadingStudents || loadingAttendance;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (classList.length === 0) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-12 bg-white rounded-xl border border-slate-200">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Classes Found</h3>
        <p className="text-slate-500 mb-6">You need to create classes before you can take attendance.</p>
      </div>
    );
  }

  return (
    <div className="school-theme-root font-outfit min-h-screen bg-[#FCFAF7] dark:bg-zinc-950 text-[#1F1E1C] dark:text-zinc-50 p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1E1C] dark:text-zinc-50">Class Attendance</h1>
          <p className="text-zinc-500">Record daily student attendance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 appearance-none"
                >
                  <option value="" disabled>Select a class</option>
                  {classList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                <CalendarDays className="absolute left-3 top-3 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {classStudents.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-12 text-center">
              <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-zinc-500 mt-2">There are no students assigned to {selectedClass}.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-6 border-b border-[#F0EBE1] dark:border-zinc-800 flex flex-wrap gap-2 justify-between items-center bg-[#FAF8F5] dark:bg-zinc-800/50">
                <span className="text-sm font-medium">{classStudents.length} Students</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('Present')} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-full">
                    <Check className="w-4 h-4 mr-1" /> All Present
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('Absent')} className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-full">
                    <X className="w-4 h-4 mr-1" /> All Absent
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('Late')} className="text-amber-600 border-amber-200 hover:bg-amber-50 rounded-full">
                    <Clock className="w-4 h-4 mr-1" /> All Late
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-[#F0EBE1] dark:divide-zinc-800">
                {classStudents.map((student, index) => {
                  const status = studentStatuses[student.id] || 'Present';
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={student.id} 
                      className="p-6 flex items-center justify-between hover:bg-[#FAF8F5] dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {student.data?.first_name?.[0]}{student.data?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[#1F1E1C] dark:text-zinc-50">{student.data?.first_name} {student.data?.last_name}</p>
                          <p className="text-xs text-zinc-500">ID: {student.data?.student_id || student.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleStatusToggle(student.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                          status === 'Present' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                          status === 'Absent' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' :
                          'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {status === 'Present' && <Check className="w-4 h-4" />}
                        {status === 'Absent' && <X className="w-4 h-4" />}
                        {status === 'Late' && <Clock className="w-4 h-4" />}
                        {status}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 sticky top-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              Summary
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 text-emerald-700">
                <span className="font-medium flex items-center gap-2"><Check className="w-4 h-4" /> Present</span>
                <span className="text-lg font-bold">{stats.Present}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-rose-50 text-rose-700">
                <span className="font-medium flex items-center gap-2"><X className="w-4 h-4" /> Absent</span>
                <span className="text-lg font-bold">{stats.Absent}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 text-amber-700">
                <span className="font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> Late</span>
                <span className="text-lg font-bold">{stats.Late}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#FAF8F5] dark:bg-zinc-800/50 border border-[#F0EBE1] dark:border-zinc-700 mt-4">
                <span className="font-medium">Total Students</span>
                <span className="text-lg font-bold">{stats.Total}</span>
              </div>
            </div>

            {existingAttendance && (
              <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Attendance already recorded for this date. Saving will update the existing record.</p>
              </div>
            )}

            <Button 
              className="w-full py-6 text-lg bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
              onClick={handleSave}
              disabled={isSaving || classStudents.length === 0}
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {existingAttendance ? 'Update Register' : 'Save Register'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
