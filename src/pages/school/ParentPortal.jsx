import { useState } from 'react';
import { Calendar, Bell, FileText, CheckCircle, Clock, BookOpen, User, CreditCard, Download } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { Link } from 'react-router-dom';
export default function ParentPortal() {
  // Real Database Hooks
  const { data: students = [], isLoading: isStudentsLoading } = useIndustryRecords('student');
  const { data: exams = [], isLoading: isExamsLoading } = useIndustryRecords('exam');

  const mappedStudents = students.map(r => ({
    id: r.id,
    ...r.data
  }));

  const activeStudent = mappedStudents[0];

  const mappedExams = exams.map(r => ({
    id: r.id,
    ...r.data
  })).slice(0, 3);

  if (isStudentsLoading || isExamsLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading family profile...</div>;
  }

  if (mappedStudents.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto bg-card rounded-xl border border-border p-6 shadow-sm">
        <User className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600 animate-pulse" />
        <p className="font-semibold text-lg text-card-foreground">No child profiles found</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Enroll a student in the student directory first to activate the Parent Portal view.</p>
      </div>
    );
  }

  const feeStatus = activeStudent.feeStatus || 'Owing';
  const balance = feeStatus === 'Paid' ? 0 : (feeStatus === 'Partial' ? 800 : 1200);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, Guardian</h1>
          <p className="text-blue-100 max-w-xl">View {activeStudent.name}'s academic progress, attendance, and fee statements for the current term.</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <User className="w-64 h-64" />
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold shrink-0 shadow-inner uppercase">
          {activeStudent.name?.substring(0, 2)}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold text-card-foreground mb-1"><Link to="/students" className="hover:underline">{activeStudent.name}</Link></h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground font-medium">
            <Link to="/classes" className="bg-muted px-3 py-1 rounded-full text-foreground hover:bg-slate-200 transition-colors">{activeStudent.class}</Link>
            <span>Student ID: {activeStudent.studentId}</span>
            <span className="text-slate-300">•</span>
            <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">Active</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Current Term Balance</span>
          <div className="text-3xl font-bold text-card-foreground">${balance.toLocaleString()}</div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
            feeStatus === 'Paid' ? 'bg-green-100 text-green-700' :
            feeStatus === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}>{feeStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Stats) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center text-green-600"><CheckCircle className="w-4 h-4" /></div>
                <h3 className="font-bold text-foreground">Attendance</h3>
              </div>
              <p className="text-4xl font-extrabold text-card-foreground mb-1">96%</p>
              <p className="text-xs text-muted-foreground">Present for the term</p>
            </div>
            
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center text-blue-600"><BookOpen className="w-4 h-4" /></div>
                <h3 className="font-bold text-foreground">Performance</h3>
              </div>
              <p className="text-4xl font-extrabold text-blue-600 mb-1">A</p>
              <p className="text-xs text-muted-foreground">Term Report Card</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-border bg-muted/50 flex justify-between items-center">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> Upcoming Scheduled Exams</h3>
            </div>
            <div className="divide-y divide-border p-2">
              {mappedExams.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-muted dark:hover:bg-muted/30 rounded-lg transition-colors">
                  <div className="w-20 shrink-0 text-center text-xs font-bold text-muted-foreground bg-muted dark:bg-muted/50 py-1.5 rounded-md">{item.time}</div>
                  <div className="flex-1">
                    <p className="font-bold text-card-foreground text-sm">{item.subject}</p>
                    <p className="text-xs text-muted-foreground">{item.venue}</p>
                  </div>
                  <span className="bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Exam</span>
                </div>
              ))}
              {mappedExams.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">No exams scheduled currently.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Notices & Bills) */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><Bell className="w-5 h-5 text-muted-foreground" /> Recent Notices</h3>
            </div>
            <div className="divide-y divide-border p-2">
               <div className="p-3">
                  <p className="text-xs font-semibold text-blue-600 mb-1">Today</p>
                  <p className="text-sm font-medium text-card-foreground mb-1">Science Fair Registration Open</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">Please register your ward for the upcoming annual science fair by next week Friday.</p>
               </div>
               <div className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">May 20, 2026</p>
                  <p className="text-sm font-medium text-card-foreground mb-1">Midterm Break Notice</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">The school will observe a mid-term break starting next Wednesday.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
