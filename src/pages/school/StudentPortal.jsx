import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Calendar, BookOpen, CheckCircle, Clock, User, FileText, ClipboardList, GraduationCap, LayoutDashboard, Zap, Target } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from "@/components/ui/button";
import './SchoolTheme.css';

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

  if (isStudentsLoading) return <div className="school-theme-root py-12 flex justify-center bg-[#FCFAF7] dark:bg-zinc-950 min-h-[50vh]"><div className="text-indigo-600 font-semibold animate-pulse text-lg">{t("loading", "Loading Portal...")}</div></div>;
  if (!activeStudent) return <div className="school-theme-root py-12 text-center font-semibold text-lg text-zinc-500 bg-[#FCFAF7] dark:bg-zinc-950 min-h-[50vh]">No student profile found for your account.</div>;

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

  const cardStyle = "bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300";

  return (
    <div className="school-theme-root bg-[#FCFAF7] dark:bg-zinc-950 min-h-screen text-[#1F1E1C] dark:text-zinc-50 font-sans">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto p-4 md:p-8">
        {/* Header & Nav */}
        <div className="border-b border-[#F0EBE1] dark:border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-semibold text-4xl text-[#1F1E1C] dark:text-zinc-50 tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-orange-500">{activeStudent.data?.name || activeStudent.data?.first_name}</span>
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="bg-gradient-to-r from-indigo-600 to-orange-500 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full">{className || 'No Class'}</span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {['dashboard', 'timetable', 'assignments', 'grades', 'exams', 'notices'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-2.5 font-semibold text-sm transition-all rounded-full whitespace-nowrap hover:scale-[1.02] ${activeTab === tab ? 'bg-gradient-to-r from-indigo-600 to-orange-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.15)] hover:opacity-90' : 'bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 text-[#1F1E1C] dark:text-zinc-50 border border-[#E4DFD5] dark:border-zinc-700'}`}>
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {isAdmin && validStudents.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2">Viewing:</span>
            {validStudents.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedStudentId(child.id)}
                className={`flex items-center gap-2 px-5 py-2 font-medium text-sm transition-all rounded-full whitespace-nowrap border hover:scale-[1.02] ${
                  activeStudent?.id === child.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-300' : 'bg-white dark:bg-zinc-800 border-[#E4DFD5] dark:border-zinc-700 text-[#1F1E1C] dark:text-zinc-50 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700'
                }`}
              >
                {child.data?.name || `${child.data?.first_name} ${child.data?.last_name}`}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={cardStyle}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-xl text-[#1F1E1C] dark:text-zinc-50">Attendance</h3>
              </div>
              <p className="text-5xl font-semibold mb-2 tracking-tight text-[#1F1E1C] dark:text-zinc-50">{attendancePct}%</p>
              <p className="text-base font-medium text-zinc-500">Present this term</p>
            </div>
            
            <div className={cardStyle}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-xl text-[#1F1E1C] dark:text-zinc-50">Performance</h3>
              </div>
              <p className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-orange-500 mb-2 tracking-tight">{averageGrade}</p>
              <p className="text-base font-medium text-zinc-500">Term Average</p>
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Class Timetable</h3>
            {timetableMatrix.length === 0 ? <p className="text-zinc-500">No timetable available for your class.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#FCFAF7] dark:bg-zinc-950 border-b border-[#F0EBE1] dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Period</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Monday</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Tuesday</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Wednesday</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Thursday</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Friday</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE1] dark:divide-zinc-800">
                    {timetableMatrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FCFAF7] dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#1F1E1C] dark:text-zinc-100 whitespace-nowrap">{row.period}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{row.Monday}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{row.Tuesday}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{row.Wednesday}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{row.Thursday}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{row.Friday}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Assignments</h3>
            {myAssignments.length === 0 ? <p className="text-zinc-500">No active assignments.</p> : (
              <div className="space-y-4">
                {myAssignments.map(a => (
                  <div key={a.id} className="p-6 border border-[#F0EBE1] dark:border-zinc-800 rounded-[1.5rem] bg-[#FCFAF7] dark:bg-zinc-950 hover:-translate-y-0.5 transition-transform">
                    <div className="flex justify-between flex-wrap gap-2 mb-2">
                      <h4 className="font-semibold text-xl">{a.data?.title}</h4>
                      <span className="text-orange-600 dark:text-orange-400 text-sm font-bold bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full uppercase tracking-wider">Due: {a.data?.due_date}</span>
                    </div>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-3">Subject: {a.data?.subject}</p>
                    <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">{a.data?.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'grades' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">My Grades</h3>
            {myGrades.length === 0 ? <p className="text-zinc-500">No grades recorded yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#FCFAF7] dark:bg-zinc-950 border-b border-[#F0EBE1] dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Subject</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Exam/Type</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-xs text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE1] dark:divide-zinc-800">
                    {myGrades.map(g => (
                      <tr key={g.id} className="hover:bg-[#FCFAF7] dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#1F1E1C] dark:text-zinc-100">{g.data?.subject}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{g.data?.exam_name || g.data?.type}</td>
                        <td className="px-6 py-4 text-right font-semibold text-[#1F1E1C] dark:text-zinc-100">{g.data?.score} / {g.data?.max_score || 100}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exams' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Upcoming Exams</h3>
            {myExams.length === 0 ? <p className="text-zinc-500">No exams scheduled.</p> : (
              <div className="space-y-4">
                {myExams.map(ex => (
                  <div key={ex.id} className="p-6 border border-[#F0EBE1] dark:border-zinc-800 rounded-[1.5rem] bg-[#FCFAF7] dark:bg-zinc-950">
                    <p className="font-semibold text-xl text-indigo-600 dark:text-indigo-400 mb-2">{ex.data?.subject}</p>
                    <p className="text-base text-zinc-600 dark:text-zinc-400 font-medium">Date: {ex.data?.date} | Time: {ex.data?.time} | Venue: {ex.data?.venue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notices' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Notices</h3>
            {myNotices.length === 0 ? <p className="text-zinc-500">No notices at this time.</p> : (
              <div className="space-y-4">
                {myNotices.map(n => (
                  <div key={n.id} className="p-6 border border-[#F0EBE1] dark:border-zinc-800 rounded-[1.5rem] bg-[#FCFAF7] dark:bg-zinc-950 hover:-translate-y-0.5 transition-transform">
                    <h4 className="font-semibold text-xl mb-2">{n.data?.title}</h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-3">{n.data?.date}</p>
                    <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">{n.data?.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
