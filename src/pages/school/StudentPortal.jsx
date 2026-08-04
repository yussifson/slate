import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Calendar, BookOpen, CheckCircle, Clock, User, FileText, ClipboardList, GraduationCap, LayoutDashboard, Zap, Target } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from "@/components/ui/button";

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

  if (isStudentsLoading) return <div className="py-12 flex justify-center"><div className="text-[var(--primary)] font-semibold animate-pulse text-lg">{t("loading", "Loading Portal...")}</div></div>;
  if (!activeStudent) return <div className="py-12 text-center font-semibold text-lg text-[var(--color-text-secondary)]">No student profile found for your account.</div>;

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

  // Group timetable by period
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* Header & Nav */}
      <div className="border-b border-primary/40 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-semibold text-3xl text-[var(--color-text-primary)] tracking-tight">
            Welcome, <span className="text-[var(--primary)]">{activeStudent.data?.name || activeStudent.data?.first_name}</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-[var(--primary)] text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-widest rounded-full">{className || 'No Class'}</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['dashboard', 'timetable', 'assignments', 'grades', 'exams', 'notices'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === tab ? 'bg-[var(--primary)] text-white' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)]'}`}>
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {isAdmin && validStudents.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest px-2">Viewing:</span>
          {validStudents.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedStudentId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors rounded-full whitespace-nowrap border ${
                activeStudent?.id === child.id ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--color-surface-0)] border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'
              }`}
            >
              {child.data?.name || `${child.data?.first_name} ${child.data?.last_name}`}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-primary/40 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-[var(--primary)]" />
              <h3 className="font-semibold text-lg">Attendance</h3>
            </div>
            <p className="text-4xl font-semibold mb-1">{attendancePct}%</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Present this term</p>
          </div>
          
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-primary/40 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-6 h-6 text-[var(--color-info)]" />
              <h3 className="font-semibold text-lg">Performance</h3>
            </div>
            <p className="text-4xl font-semibold text-[var(--color-info)] mb-1">{averageGrade}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Term Average</p>
          </div>
        </div>
      )}

      {activeTab === 'timetable' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Class Timetable</h3>
          {timetableMatrix.length === 0 ? <p className="text-[var(--color-text-secondary)]">No timetable available for your class.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-[var(--color-surface-1)]">
                  <tr>
                    <th className="px-4 py-3 border border-primary/20">Period</th>
                    <th className="px-4 py-3 border border-primary/20">Monday</th>
                    <th className="px-4 py-3 border border-primary/20">Tuesday</th>
                    <th className="px-4 py-3 border border-primary/20">Wednesday</th>
                    <th className="px-4 py-3 border border-primary/20">Thursday</th>
                    <th className="px-4 py-3 border border-primary/20">Friday</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-surface-2)]">
                      <td className="px-4 py-3 border border-primary/20 font-semibold whitespace-nowrap">{row.period}</td>
                      <td className="px-4 py-3 border border-primary/20">{row.Monday}</td>
                      <td className="px-4 py-3 border border-primary/20">{row.Tuesday}</td>
                      <td className="px-4 py-3 border border-primary/20">{row.Wednesday}</td>
                      <td className="px-4 py-3 border border-primary/20">{row.Thursday}</td>
                      <td className="px-4 py-3 border border-primary/20">{row.Friday}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Assignments</h3>
          {myAssignments.length === 0 ? <p className="text-[var(--color-text-secondary)]">No active assignments.</p> : (
            <div className="space-y-4">
              {myAssignments.map(a => (
                <div key={a.id} className="p-4 border border-primary/20 rounded-lg bg-[var(--color-surface-1)]">
                  <div className="flex justify-between flex-wrap gap-2">
                    <h4 className="font-semibold text-lg">{a.data?.title}</h4>
                    <span className="text-red-500 text-sm font-semibold">Due: {a.data?.due_date}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2 mt-1">Subject: {a.data?.subject}</p>
                  <p className="text-sm mt-2">{a.data?.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">My Grades</h3>
          {myGrades.length === 0 ? <p className="text-[var(--color-text-secondary)]">No grades recorded yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--color-surface-1)] border-b border-primary/20">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Subject</th>
                    <th className="px-4 py-3 font-semibold">Exam/Type</th>
                    <th className="px-4 py-3 font-semibold text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {myGrades.map(g => (
                    <tr key={g.id}>
                      <td className="px-4 py-3">{g.data?.subject}</td>
                      <td className="px-4 py-3">{g.data?.exam_name || g.data?.type}</td>
                      <td className="px-4 py-3 text-right font-medium">{g.data?.score} / {g.data?.max_score || 100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Upcoming Exams</h3>
          {myExams.length === 0 ? <p className="text-[var(--color-text-secondary)]">No exams scheduled.</p> : (
            <div className="space-y-3">
              {myExams.map(ex => (
                <div key={ex.id} className="p-3 border rounded-lg bg-[var(--color-surface-1)]">
                  <p className="font-semibold text-[var(--primary)]">{ex.data?.subject}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Date: {ex.data?.date} | Time: {ex.data?.time} | Venue: {ex.data?.venue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Notices</h3>
          {myNotices.length === 0 ? <p className="text-[var(--color-text-secondary)]">No notices at this time.</p> : (
            <div className="space-y-4">
              {myNotices.map(n => (
                <div key={n.id} className="p-4 border border-primary/20 rounded-lg bg-[var(--color-surface-1)]">
                  <h4 className="font-semibold text-lg">{n.data?.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2">{n.data?.date}</p>
                  <p className="text-sm">{n.data?.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
