import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Calendar, Bell, FileText, CheckCircle, Clock, BookOpen, User, CreditCard, LayoutDashboard, GraduationCap, ArrowRight } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast';

export default function ParentPortal() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChildId, setSelectedChildId] = useState(null);

  const { data: studentRecords = [], isLoading: isStudentsLoading } = useIndustryRecords('school_student');
  const { data: attendanceRecords = [] } = useIndustryRecords('school_attendance');
  const { data: gradeRecords = [] } = useIndustryRecords('school_grade');
  const { data: examRecords = [] } = useIndustryRecords('school_exam');
  const { data: feeRecords = [] } = useIndustryRecords('school_fee');
  const { data: noticeRecords = [] } = useIndustryRecords('school_notice');
  const { data: assignmentRecords = [] } = useIndustryRecords('school_assignment');

  const isAdmin = user?.email?.includes('admin') || user?.role?.includes('admin') || user?.user_metadata?.role?.includes('admin');

  const myChildren = studentRecords.filter(r => isAdmin || r.data?.parent_email === user?.email);
  
  const activeStudent = selectedChildId 
    ? myChildren.find(c => c.id === selectedChildId) 
    : myChildren[0];

  if (isStudentsLoading) {
    return <div className="school-theme-root py-12 flex justify-center bg-[#FCFAF7] dark:bg-zinc-950 min-h-[50vh]"><div className="text-indigo-600 font-semibold animate-pulse text-lg">{t("loading", "Loading Family Data...")}</div></div>;
  }

  if (myChildren.length === 0) {
    return (
      <div className="school-theme-root bg-[#FCFAF7] dark:bg-zinc-950 min-h-[50vh] py-16 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-8">
          <User className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
          <p className="font-semibold text-2xl text-[#1F1E1C] dark:text-zinc-50 mb-2">No Profiles Linked</p>
          <p className="font-medium text-zinc-500 text-sm">Ensure your email ({user?.email}) is linked to a student in the directory.</p>
        </div>
      </div>
    );
  }

  const childId = activeStudent.id;
  const childClassName = activeStudent.data?.class_name || activeStudent.data?.class;

  const childAttendance = attendanceRecords.filter(r => r.data?.records?.some(rec => rec.student_id === childId));
  const childGrades = gradeRecords.filter(r => r.data?.student_id === childId);
  const childFees = feeRecords.filter(r => r.data?.student_id === childId);
  const childNotices = noticeRecords.filter(r => !r.data?.class_name || r.data?.class_name === 'All' || r.data?.class_name === childClassName);
  const childExams = examRecords.filter(r => r.data?.class_name === childClassName);

  // Stats
  let totalDays = childAttendance.length;
  let presentDays = childAttendance.filter(att => att.data?.records?.find(rec => rec.student_id === childId)?.status === 'Present').length;
  let attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  let averageGrade = 'N/A';
  if (childGrades.length > 0) {
    const totalScore = childGrades.reduce((sum, g) => sum + (Number(g.data?.score) || 0), 0);
    const totalMax = childGrades.reduce((sum, g) => sum + (Number(g.data?.max_score) || 100), 0);
    const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
    if (pct >= 90) averageGrade = 'A';
    else if (pct >= 80) averageGrade = 'B';
    else if (pct >= 70) averageGrade = 'C';
    else if (pct >= 60) averageGrade = 'D';
    else averageGrade = 'F';
  }

  const totalFees = childFees.reduce((sum, f) => sum + (Number(f.data?.amount) || 0), 0);
  const totalPaid = childFees.reduce((sum, f) => sum + (Number(f.data?.amount_paid) || 0), 0);
  const balance = totalFees - totalPaid;

  const cardStyle = "bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300";

  return (
    <div className="school-theme-root bg-[#FCFAF7] dark:bg-zinc-950 min-h-screen text-[#1F1E1C] dark:text-zinc-50 font-sans">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto p-4 md:p-8">
        {/* Header & Nav */}
        <div className="border-b border-[#F0EBE1] dark:border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-semibold text-4xl text-[#1F1E1C] dark:text-zinc-50 tracking-tight">
              Family <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-orange-500">Portal</span>
            </h1>
            <p className="text-zinc-500 font-medium mt-2 text-base">Managing records for your dependents.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {['dashboard', 'attendance', 'grades', 'fees', 'notices', 'exams'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-2.5 font-semibold text-sm transition-all rounded-full whitespace-nowrap hover:scale-[1.02] ${activeTab === tab ? 'bg-gradient-to-r from-indigo-600 to-orange-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.15)] hover:opacity-90' : 'bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 text-[#1F1E1C] dark:text-zinc-50 border border-[#E4DFD5] dark:border-zinc-700'}`}>
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Child Selector */}
        {myChildren.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2">Viewing:</span>
            {myChildren.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex items-center gap-2 px-5 py-2 font-medium text-sm transition-all rounded-full whitespace-nowrap border hover:scale-[1.02] ${
                  activeStudent?.id === child.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-300' : 'bg-white dark:bg-zinc-800 border-[#E4DFD5] dark:border-zinc-700 text-[#1F1E1C] dark:text-zinc-50 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStudent?.id === child.id ? 'bg-gradient-to-r from-indigo-600 to-orange-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                  {(child.data?.name || child.data?.first_name || 'ST').substring(0,2).toUpperCase()}
                </div>
                {child.data?.name || `${child.data?.first_name} ${child.data?.last_name}`}
              </button>
            ))}
          </div>
        )}

        {/* Child Profile Card */}
        <div className={`${cardStyle} flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden`}>
          <User className="absolute -right-8 -top-8 w-48 h-48 text-indigo-500 opacity-5 pointer-events-none" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-100 to-orange-100 dark:from-indigo-900/30 dark:to-orange-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-bold shrink-0 border border-indigo-200 dark:border-indigo-800/50 relative z-10">
            {(activeStudent.data?.name || activeStudent.data?.first_name || 'ST').substring(0, 2).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1 relative z-10">
            <h2 className="text-3xl font-semibold text-[#1F1E1C] dark:text-zinc-50 tracking-tight mb-3">
              {activeStudent.data?.name || `${activeStudent.data?.first_name} ${activeStudent.data?.last_name}`}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full">{childClassName || 'No Class'}</span>
              <span className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full border border-zinc-200 dark:border-zinc-700">ID: {activeStudent.data?.student_id || activeStudent.id.substring(0,8)}</span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center md:items-end gap-2 bg-[#FCFAF7] dark:bg-zinc-950 p-6 rounded-[1.5rem] border border-[#F0EBE1] dark:border-zinc-800 w-full md:w-auto relative z-10">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Balance</span>
            <div className="text-3xl font-semibold text-[#1F1E1C] dark:text-zinc-50 mb-1">${balance.toLocaleString()}</div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
              balance <= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
            }`}>{balance <= 0 ? 'Cleared' : 'Owing'}</span>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cardStyle}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-xl text-[#1F1E1C] dark:text-zinc-50">Attendance</h3>
              </div>
              <p className="text-5xl font-semibold mb-2 text-[#1F1E1C] dark:text-zinc-50 tracking-tight">{attendancePct}%</p>
              <p className="text-base text-zinc-500 font-medium">Present for the term</p>
            </div>
            <div className={cardStyle}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-xl text-[#1F1E1C] dark:text-zinc-50">Performance</h3>
              </div>
              <p className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-orange-500 mb-2 tracking-tight">{averageGrade}</p>
              <p className="text-base text-zinc-500 font-medium">Average Grade</p>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Attendance Records</h3>
            {childAttendance.length === 0 ? <p className="text-zinc-500">No attendance records found.</p> : (
              <div className="divide-y divide-[#F0EBE1] dark:divide-zinc-800">
                {childAttendance.map(att => {
                  const rec = att.data?.records?.find(r => r.student_id === childId);
                  return (
                    <div key={att.id} className="py-4 flex justify-between items-center">
                      <span className="font-medium text-lg">{att.data?.date}</span>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${rec?.status === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>{rec?.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'grades' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Academic Transcript</h3>
            {childGrades.length === 0 ? <p className="text-zinc-500">No grades found.</p> : (
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
                    {childGrades.map(g => (
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

        {activeTab === 'fees' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Fee Statements</h3>
            {childFees.length === 0 ? <p className="text-zinc-500">No fee records found.</p> : (
              <div className="space-y-4">
                {childFees.map(f => (
                  <div key={f.id} className="p-6 border border-[#F0EBE1] dark:border-zinc-800 rounded-[1.5rem] flex justify-between items-center bg-[#FCFAF7] dark:bg-zinc-950">
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{f.data?.fee_type || 'Tuition Fee'}</h4>
                      <p className="text-sm text-zinc-500 font-medium">Due: {f.data?.due_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-xl mb-1">${f.data?.amount}</p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Paid: ${f.data?.amount_paid || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notices' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Notices & Announcements</h3>
            {childNotices.length === 0 ? <p className="text-zinc-500">No notices at this time.</p> : (
              <div className="space-y-4">
                {childNotices.map(n => (
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

        {activeTab === 'exams' && (
          <div className={cardStyle}>
            <h3 className="text-2xl font-semibold mb-6 text-[#1F1E1C] dark:text-zinc-50">Upcoming Exams</h3>
            {childExams.length === 0 ? <p className="text-zinc-500">No exams scheduled.</p> : (
              <div className="divide-y divide-[#F0EBE1] dark:divide-zinc-800">
                {childExams.map(ex => (
                  <div key={ex.id} className="py-4">
                    <p className="font-semibold text-lg text-indigo-600 dark:text-indigo-400 mb-1">{ex.data?.subject}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Date: {ex.data?.date} | Time: {ex.data?.time} | Venue: {ex.data?.venue}</p>
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
