import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Users, CheckCircle2, XCircle, Clock, Save, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SHSDailyAttendance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // studentId -> 'Present' | 'Absent' | 'Late' | 'Excused'
  const [attendanceState, setAttendanceState] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const records = await base44.getEntities('shs_class', user?.company_id);
        setClasses(records);
        if (records.length > 0) {
          setSelectedClassId(records[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setLoadingClasses(false);
      }
    };
    
    if (user?.company_id) {
      fetchClasses();
    }
  }, [user]);

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedClassId) return;
      
      setLoadingStudents(true);
      try {
        const targetClass = classes.find(c => c.id === selectedClassId);
        
        // 1. Fetch active students in this class
        const studentRecords = await base44.getEntities('shs_student', user?.company_id);
        const classStudents = studentRecords.filter(s => 
          s.status === 'Active' && 
          s.data?.classRoom === targetClass?.title
        );
        
        // 2. Fetch existing daily attendance for this date & class
        const attendanceRecords = await base44.getEntities('shs_daily_attendance', user?.company_id);
        const existingRecord = attendanceRecords.find(a => 
          a.data?.classId === selectedClassId && 
          a.data?.date === selectedDate
        );

        setStudents(classStudents);
        
        // 3. Initialize state
        const newState = {};
        if (existingRecord && existingRecord.data?.records) {
          existingRecord.data.records.forEach(r => {
            newState[r.studentId] = r.status;
          });
          classStudents.forEach(s => {
            if (!newState[s.id]) newState[s.id] = 'Present'; // default new students to present
          });
        } else {
          classStudents.forEach(s => {
            newState[s.id] = 'Present';
          });
        }
        
        setAttendanceState(newState);
        setSaveSuccess(false);
      } catch (error) {
        console.error('Failed to fetch daily attendance:', error);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (user?.company_id && selectedClassId && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClassId, selectedDate, classes, user]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
    setSaveSuccess(false);
  };

  const handleMarkAll = (status) => {
    const newState = {};
    students.forEach(s => {
      newState[s.id] = status;
    });
    setAttendanceState(newState);
    setSaveSuccess(false);
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const targetClass = classes.find(c => c.id === selectedClassId);
      
      const attendanceRecords = await base44.getEntities('shs_daily_attendance', user?.company_id);
      const existingRecord = attendanceRecords.find(a => 
        a.data?.classId === selectedClassId && 
        a.data?.date === selectedDate
      );

      const recordsArray = Object.entries(attendanceState).map(([studentId, status]) => ({
        studentId,
        status
      }));

      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_daily_attendance',
        title: `Morning Roll Call: ${targetClass.title} - ${selectedDate}`,
        case_number: `DATT-${selectedDate.replace(/-/g, '')}`,
        status: 'Logged',
        data: {
          classId: selectedClassId,
          className: targetClass.title,
          date: selectedDate,
          records: recordsArray,
          summary: {
            total: students.length,
            present: recordsArray.filter(r => r.status === 'Present').length,
            absent: recordsArray.filter(r => r.status === 'Absent').length,
            late: recordsArray.filter(r => r.status === 'Late').length,
            excused: recordsArray.filter(r => r.status === 'Excused').length,
          }
        }
      };

      if (existingRecord) {
        await base44.updateEntity(existingRecord.id, payload);
      } else {
        await base44.createEntity(payload);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save daily attendance:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = Object.values(attendanceState).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendanceState).filter(s => s === 'Absent').length;
  const lateCount = Object.values(attendanceState).filter(s => s === 'Late').length;
  const excusedCount = Object.values(attendanceState).filter(s => s === 'Excused').length;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
            Morning Roll Call
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Record the official daily attendance for your form/class.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 p-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="space-y-2 flex-1 max-w-xs">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Select Form
                </label>
                <select 
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 font-semibold text-slate-700 dark:text-slate-200"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  disabled={loadingClasses}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                  {classes.length === 0 && <option value="">No classes found</option>}
                </select>
              </div>

              <div className="space-y-2 flex-1 max-w-xs">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Roll Call Date
                </label>
                <Input 
                  type="date"
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 font-semibold text-slate-700 dark:text-slate-200"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex items-end pb-1">
              <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</p>
                  <p className="text-xl font-black text-slate-700 dark:text-slate-200">{students.length}</p>
                </div>
                <div className="w-px bg-slate-100 dark:bg-slate-800"></div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Present</p>
                  <p className="text-xl font-black text-emerald-600">{presentCount}</p>
                </div>
                <div className="w-px bg-slate-100 dark:bg-slate-800"></div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Absent</p>
                  <p className="text-xl font-black text-rose-600">{absentCount}</p>
                </div>
                <div className="w-px bg-slate-100 dark:bg-slate-800"></div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Late</p>
                  <p className="text-xl font-black text-amber-600">{lateCount}</p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loadingStudents ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500">Loading roll call register...</div>
          ) : students.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No students found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-2">
                There are no active students enrolled in this form.
              </p>
            </div>
          ) : (
            <div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 pl-3">Mark entire form as:</p>
                <div className="flex gap-2 pr-3">
                  <Button variant="outline" size="sm" onClick={() => handleMarkAll('Present')} className="h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    All Present
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMarkAll('Absent')} className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50">
                    All Absent
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {students.map((student, index) => {
                  const status = attendanceState[student.id];
                  return (
                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-slate-100 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400">
                          {student.title.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{student.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{student.data?.indexNumber || student.case_number}</p>
                        </div>
                      </div>
                      
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner gap-1">
                        <button
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            status === 'Present' 
                              ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm ring-1 ring-emerald-200/50' 
                              : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Late')}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            status === 'Late' 
                              ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm ring-1 ring-amber-200/50' 
                              : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Late
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            status === 'Absent' 
                              ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm ring-1 ring-rose-200/50' 
                              : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Excused')}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            status === 'Excused' 
                              ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm ring-1 ring-emerald-200/50' 
                              : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <div className="w-3.5 h-3.5 border-2 border-current rounded-full" /> Excused
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {saveSuccess && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                      <CheckCircle2 className="w-4 h-4" /> Roll Call Saved Successfully
                    </Badge>
                  )}
                </div>
                
                <Button 
                  onClick={handleSaveAttendance}
                  disabled={isSaving || students.length === 0}
                  className="h-12 px-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-bold"
                >
                  {isSaving ? 'Saving...' : (
                    <><Save className="w-5 h-5 mr-2" /> Submit Roll Call</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
