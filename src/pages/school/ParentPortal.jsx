import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Calendar, Bell, FileText, CheckCircle, Clock, BookOpen, User, CreditCard, LayoutDashboard, GraduationCap, ArrowRight } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast';
import SchoolPageShell from '@/components/school/SchoolPageShell';

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
    return <div className="flex h-64 items-center justify-center"><div className="text-indigo-600 font-semibold animate-pulse text-lg">{t("loading", "Loading Family Data...")}</div></div>;
  }

  if (myChildren.length === 0) {
    return (
      <SchoolPageShell title="Family Portal" subtitle="Dependents records & portals" breadcrumb={['School', 'Portal']}>
        <div className="bg-card border border-border/50 rounded-xl p-8 max-w-md mx-auto text-center shadow-sm">
          <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-bold text-lg text-foreground mb-1">No dependency profile linked</p>
          <p className="text-xs text-muted-foreground leading-relaxed">Ensure your account email ({user?.email}) is configured as a guardian contact in the student directory.</p>
        </div>
      </SchoolPageShell>
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
    <SchoolPageShell
      title="Family Portal"
      subtitle="Track records and performance for dependents"
      breadcrumb={['School', 'Portal']}
      actions={
        <div className="flex bg-card border border-border/50 rounded-lg p-1.5 shadow-sm">
          {['dashboard', 'attendance', 'grades', 'fees', 'notices', 'exams'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}>{tab}</button>
          ))}
        </div>
      }
    >
      {/* Dependent Selector */}
      {myChildren.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Dependent:</span>
          {myChildren.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeStudent?.id === child.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-300' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {child.data?.name || `${child.data?.first_name} ${child.data?.last_name}`}
            </button>
          ))}
        </div>
      )}

      {/* Dependent Profile Card */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 rounded-full flex items-center justify-center text-xl font-black border border-indigo-500/20">
            {(activeStudent.data?.name || activeStudent.data?.first_name || 'ST').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{activeStudent.data?.name || `${activeStudent.data?.first_name} ${activeStudent.data?.last_name}`}</h2>
            <p className="text-xs text-muted-foreground">Class: <strong className="text-foreground">{childClassName || 'N/A'}</strong> · ID: {activeStudent.data?.student_id || activeStudent.id.substring(0,8)}</p>
          </div>
        </div>
        <div className="bg-muted/30 p-4 rounded-xl border border-border/50 w-full sm:w-auto flex justify-between sm:flex-col items-center sm:items-end gap-2">
          <div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fees Balance</span>
            <p className="text-lg font-bold text-foreground mt-0.5">GHS {balance.toLocaleString()}</p>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${balance <= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10'}`}>{balance <= 0 ? 'Settled' : 'Owing'}</span>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600"><CheckCircle className="w-5 h-5" /></div>
              <h3 className="font-bold text-sm text-foreground">Attendance</h3>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-foreground">{attendancePct}%</p>
            <p className="text-xs text-muted-foreground mt-1">Dependents present rate this academic session</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600"><BookOpen className="w-5 h-5" /></div>
              <h3 className="font-bold text-sm text-foreground">Academic Performance</h3>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-indigo-600">{averageGrade}</p>
            <p className="text-xs text-muted-foreground mt-1">Average grades calculated across all courses</p>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Attendance History</h3>
          {childAttendance.length === 0 ? <p className="text-muted-foreground text-sm">No records logged.</p> : (
            <div className="divide-y divide-border/50">
              {childAttendance.map(att => {
                const rec = att.data?.records?.find(r => r.student_id === childId);
                return (
                  <div key={att.id} className="py-3 flex justify-between items-center text-sm">
                    <span className="font-semibold text-foreground">{att.data?.date}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rec?.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10'}`}>{rec?.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Academic Transcript</h3>
          {childGrades.length === 0 ? <p className="text-muted-foreground text-sm">No grades recorded.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground bg-muted/20">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Subject</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Exam / Description</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {childGrades.map(g => (
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

      {activeTab === 'fees' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Fee Statements</h3>
          {childFees.length === 0 ? <p className="text-muted-foreground text-sm">No billing records found.</p> : (
            <div className="space-y-3">
              {childFees.map(f => (
                <div key={f.id} className="p-4 border border-border/50 rounded-xl flex justify-between items-center bg-muted/10">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{f.data?.fee_type || 'Tuition Fee'}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Due: {f.data?.due_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-foreground">GHS {f.data?.amount}</p>
                    <p className="text-xs font-semibold text-emerald-600">Paid: GHS {f.data?.amount_paid || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Notices & Announcements</h3>
          {childNotices.length === 0 ? <p className="text-muted-foreground text-sm">No alerts at this time.</p> : (
            <div className="space-y-4">
              {childNotices.map(n => (
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

      {activeTab === 'exams' && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Upcoming Exam Schedules</h3>
          {childExams.length === 0 ? <p className="text-muted-foreground text-sm">No exam sessions scheduled.</p> : (
            <div className="divide-y divide-border/50">
              {childExams.map(ex => (
                <div key={ex.id} className="py-4 text-sm">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">{ex.data?.subject}</p>
                  <p className="text-xs text-muted-foreground">Date: {ex.data?.date} · Time: {ex.data?.time} · Venue: {ex.data?.venue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SchoolPageShell>
  );
}
