import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Calendar, BookOpen, CheckCircle, Clock, User, FileText, ClipboardList, GraduationCap, LayoutDashboard, Zap, Target } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from "@/components/ui/button";
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function StudentPortal() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  
  const { data: studentRecords = [], isLoading: isStudentsLoading } = useIndustryRecords('school_student');
  const { data: attendanceRecords = [] } = useIndustryRecords('school_attendance');
  const { data: gradeRecords = [] } = useIndustryRecords('school_grade');
  const { data: examRecords = [] } = useIndustryRecords('school_exam');
  const { data: assignmentRecords = [] } = useIndustryRecords('school_assignment');
  const { data: timetableRecords = [] } = useIndustryRecords('school_timetable');
  const { data: noticeRecords = [] } = useIndustryRecords('school_notice');

  const isAdmin = user?.email?.includes('admin') || user?.role?.includes('admin') || user?.user_metadata?.role?.includes('admin');
  
  const validStudents = isAdmin ? studentRecords : studentRecords.filter(r => r.data?.email === user?.email);
  const activeStudent = selectedStudentId 
    ? validStudents.find(s => s.id === selectedStudentId) 
    : validStudents[0];

  if (isStudentsLoading) return <div className="flex h-64 items-center justify-center"><div className="text-indigo-600 font-semibold animate-pulse text-lg">{t("loading", "Loading Portal...")}</div></div>;
  if (!activeStudent) return <div className="p-8 text-center text-muted-foreground font-semibold text-sm">No student profile linked to your account.</div>;

  const studentId = activeStudent.id;
  const className = activeStudent.data?.class_name || activeStudent.data?.class;

  const myAttendance = attendanceRecords.filter(r => r.data?.records?.some(rec => rec.student_id === studentId));
  const myGrades = gradeRecords.filter(r => r.data?.student_id === studentId);
  const myExams = examRecords.filter(r => r.data?.class_name === className);
  const myAssignments = assignmentRecords.filter(r => r.data?.class_name === className || r.data?.class_name === 'All');
  const myTimetable = timetableRecords.filter(r => r.data?.class_name === className);
  const myNotices = noticeRecords.filter(r => r.data?.class_name === className || !r.data?.class_name || r.data?.class_name === 'All');

  // Stats
  let totalDays = myAttendance.length;
  let presentDays = myAttendance.filter(att => att.data?.records?.find(rec => rec.student_id === studentId)?.status === 'Present').length;
  let attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  let averageGrade = 'N/A';
  if (myGrades.length > 0) {
    const totalScore = myGrades.reduce((sum, g) => sum + (Number(g.data?.score) || 0), 0);
    const totalMax = myGrades.reduce((sum, g) => sum + (Number(g.data?.max_score) || 100), 0);
    const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
    if (pct >= 90) averageGrade = 'A';
    else if (pct >= 80) averageGrade = 'B';
    else if (pct >= 70) averageGrade = 'C';
    else if (pct >= 60) averageGrade = 'D';
    else averageGrade = 'F';
  }

  const periods = Array.from(new Set(myTimetable.map(s => `${s.data?.start_time} - ${s.data?.end_time}`))).sort();
  const timetableMatrix = periods.map(period => {
    const slotsForPeriod = myTimetable.filter(s => `${s.data?.start_time} - ${s.data?.end_time}` === period);
    return {
      period,
      Monday: slotsForPeriod.find(s => s.data?.day === 'Monday')?.data?.subject || '',
      Tuesday: slotsForPeriod.find(s => s.data?.day === 'Tuesday')?.data?.subject || '',
      Wednesday: slotsForPeriod.find(s => s.data?.day === 'Wednesday')?.data?.subject || '',
      Thursday: slotsForPeriod.find(s => s.data?.day === 'Thursday')?.data?.subject || '',
      Friday: slotsForPeriod.find(s => s.data?.day === 'Friday')?.data?.subject || '',
    };
  });

  return (
    <SchoolPageShell
      title={`Welcome, ${activeStudent.data?.name || activeStudent.data?.first_name}`}
      subtitle={`Class: ${className || 'No Class Specified'}`}
      breadcrumb={['School', 'Portal']}
      actions={
        <div className="flex bg-card border border-border/50 rounded-lg p-1.5 shadow-sm">
          {['dashboard', 'timetable', 'assignments', 'grades', 'exams', 'notices'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}>{tab}</button>
          ))}
        </div>
      }
    >
      {isAdmin && validStudents.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Viewing Profile:</span>
          {validStudents.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedStudentId(child.id)}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeStudent?.id === child.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-300' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {child.data?.name || `${child.data?.first_name} ${child.data?.last_name}`}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600"><CheckCircle className="w-5 h-5" /></div>
              <h3 className="font-bold text-sm text-foreground">Attendance</h3>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-foreground">{attendancePct}%</p>
            <p className="text-xs text-muted-foreground mt-1">Class presence recorded this term</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600"><GraduationCap className="w-5 h-5" /></div>
              <h3 className="font-bold text-sm text-foreground">Performance</h3>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-indigo-600">{averageGrade}</p>
            <p className="text-xs text-muted-foreground mt-1">Average grades calculated across all courses</p>
          </div>
        </div>
      )}

      {activeTab === 'timetable' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Class Timetable</h3>
          {timetableMatrix.length === 0 ? <p className="text-muted-foreground text-sm">No timetable available for your class.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground bg-muted/20">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Period</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Monday</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Tuesday</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Wednesday</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Thursday</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Friday</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {timetableMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground whitespace-nowrap">{row.period}</td>
                      <td className="px-5 py-4 text-muted-foreground">{row.Monday || '—'}</td>
                      <td className="px-5 py-4 text-muted-foreground">{row.Tuesday || '—'}</td>
                      <td className="px-5 py-4 text-muted-foreground">{row.Wednesday || '—'}</td>
                      <td className="px-5 py-4 text-muted-foreground">{row.Thursday || '—'}</td>
                      <td className="px-5 py-4 text-muted-foreground">{row.Friday || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Assignments</h3>
          {myAssignments.length === 0 ? <p className="text-muted-foreground text-sm">No active assignments.</p> : (
            <div className="space-y-4">
              {myAssignments.map(a => (
                <div key={a.id} className="p-5 border border-border/50 rounded-xl bg-muted/10">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                    <h4 className="font-bold text-sm text-foreground">{a.data?.title}</h4>
                    <span className="text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-500/10 px-2.5 py-1 rounded-full">Due: {a.data?.due_date}</span>
                  </div>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-2">Subject: {a.data?.subject}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.data?.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">My Academic Grades</h3>
          {myGrades.length === 0 ? <p className="text-muted-foreground text-sm">No grades recorded yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground bg-muted/20">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Subject</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Exam / Type</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {myGrades.map(g => (
                    <tr key={g.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">{g.data?.subject}</td>
                      <td className="px-5 py-4 text-muted-foreground">{g.data?.exam_name || g.data?.type}</td>
                      <td className="px-5 py-4 text-right font-bold text-foreground">{g.data?.score} / {g.data?.max_score || 100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Upcoming Exams</h3>
          {myExams.length === 0 ? <p className="text-muted-foreground text-sm">No exams scheduled.</p> : (
            <div className="space-y-3">
              {myExams.map(ex => (
                <div key={ex.id} className="p-4 border border-border/50 rounded-xl bg-muted/10 text-sm">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">{ex.data?.subject}</p>
                  <p className="text-xs text-muted-foreground">Date: {ex.data?.date} · Time: {ex.data?.time} · Venue: {ex.data?.venue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Notices</h3>
          {myNotices.length === 0 ? <p className="text-muted-foreground text-sm">No notices at this time.</p> : (
            <div className="space-y-4">
              {myNotices.map(n => (
                <div key={n.id} className="p-5 border border-border/50 rounded-xl bg-muted/10">
                  <h4 className="font-bold text-sm text-foreground">{n.data?.title}</h4>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block mt-1 mb-2">{n.data?.date}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.data?.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SchoolPageShell>
  );
}
