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
    return <div className="py-12 flex justify-center"><div className="text-[var(--primary)] font-semibold animate-pulse text-lg">{t("loading", "Loading Family Data...")}</div></div>;
  }

  if (myChildren.length === 0) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-[var(--color-surface-0)] border-[0.5px] border-primary/40 rounded-[var(--radius-xl)] p-8">
        <User className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
        <p className="font-display font-semibold text-2xl text-[var(--color-text-primary)] mb-2">No Profiles Linked</p>
        <p className="font-medium text-[var(--color-text-secondary)] text-sm">Ensure your email ({user?.email}) is linked to a student in the directory.</p>
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* Header & Nav */}
      <div className="border-b border-primary/40 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-semibold text-3xl text-[var(--color-text-primary)] tracking-tight">
            Family <span className="text-[var(--primary)]">Portal</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] font-medium mt-1 text-sm">Managing records for your dependents.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['dashboard', 'attendance', 'grades', 'fees', 'notices', 'exams'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === tab ? 'bg-[var(--primary)] text-white' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)]'}`}>
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Child Selector */}
      {myChildren.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest px-2">Viewing:</span>
          {myChildren.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors rounded-full whitespace-nowrap border ${
                activeStudent?.id === child.id ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--color-surface-0)] border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${activeStudent?.id === child.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]'}`}>
                {(child.data?.name || child.data?.first_name || 'ST').substring(0,2).toUpperCase()}
              </div>
              {child.data?.name || `${child.data?.first_name} ${child.data?.last_name}`}
            </button>
          ))}
        </div>
      )}

      {/* Child Profile Card */}
      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-primary/40 rounded-xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <User className="absolute -right-8 -top-8 w-48 h-48 text-[var(--primary)] opacity-5 pointer-events-none" />
        <div className="w-24 h-24 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] text-3xl font-semibold shrink-0 border-[0.5px] border-[var(--primary)]/20 relative z-10">
          {(activeStudent.data?.name || activeStudent.data?.first_name || 'ST').substring(0, 2).toUpperCase()}
        </div>
        <div className="text-center md:text-left flex-1 relative z-10">
          <h2 className="text-3xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight mb-3">
            {activeStudent.data?.name || `${activeStudent.data?.first_name} ${activeStudent.data?.last_name}`}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 text-xs font-semibold uppercase tracking-widest rounded-full">{childClassName || 'No Class'}</span>
            <span className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] px-3 py-1 text-xs font-semibold uppercase tracking-widest rounded-full border-[0.5px] border-primary/10">ID: {activeStudent.data?.student_id || activeStudent.id.substring(0,8)}</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center md:items-end gap-2 bg-[var(--color-surface-1)] p-5 rounded-lg border-[0.5px] border-primary/20 w-full md:w-auto relative z-10">
          <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest">Balance</span>
          <div className="text-3xl font-display font-semibold text-[var(--color-text-primary)] mb-1">${balance.toLocaleString()}</div>
          <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${
            balance <= 0 ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]'
          }`}>{balance <= 0 ? 'Cleared' : 'Owing'}</span>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-primary/40 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-[var(--primary)]" />
              <h3 className="font-semibold text-lg">Attendance</h3>
            </div>
            <p className="text-4xl font-semibold mb-1">{attendancePct}%</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Present for the term</p>
          </div>
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-primary/40 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-[var(--color-info)]" />
              <h3 className="font-semibold text-lg">Performance</h3>
            </div>
            <p className="text-4xl font-semibold text-[var(--color-info)] mb-1">{averageGrade}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Average Grade</p>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Attendance Records</h3>
          {childAttendance.length === 0 ? <p className="text-[var(--color-text-secondary)]">No attendance records found.</p> : (
            <div className="divide-y divide-primary/10">
              {childAttendance.map(att => {
                const rec = att.data?.records?.find(r => r.student_id === childId);
                return (
                  <div key={att.id} className="py-3 flex justify-between items-center">
                    <span className="font-medium">{att.data?.date}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rec?.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rec?.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Academic Transcript</h3>
          {childGrades.length === 0 ? <p className="text-[var(--color-text-secondary)]">No grades found.</p> : (
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
                  {childGrades.map(g => (
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

      {activeTab === 'fees' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Fee Statements</h3>
          {childFees.length === 0 ? <p className="text-[var(--color-text-secondary)]">No fee records found.</p> : (
            <div className="space-y-4">
              {childFees.map(f => (
                <div key={f.id} className="p-4 border rounded-lg flex justify-between items-center bg-[var(--color-surface-1)]">
                  <div>
                    <h4 className="font-semibold">{f.data?.fee_type || 'Tuition Fee'}</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">Due: {f.data?.due_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${f.data?.amount}</p>
                    <p className="text-sm text-green-600">Paid: ${f.data?.amount_paid || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Notices & Announcements</h3>
          {childNotices.length === 0 ? <p className="text-[var(--color-text-secondary)]">No notices at this time.</p> : (
            <div className="space-y-4">
              {childNotices.map(n => (
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

      {activeTab === 'exams' && (
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Upcoming Exams</h3>
          {childExams.length === 0 ? <p className="text-[var(--color-text-secondary)]">No exams scheduled.</p> : (
            <div className="divide-y divide-primary/10">
              {childExams.map(ex => (
                <div key={ex.id} className="py-3">
                  <p className="font-semibold text-[var(--primary)]">{ex.data?.subject}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Date: {ex.data?.date} | Time: {ex.data?.time} | Venue: {ex.data?.venue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
