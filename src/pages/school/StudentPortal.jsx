import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, BookOpen, CheckCircle, Clock, User, Download, FileText } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from "@tanstack/react-query";
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from '@/lib/AuthContext';

export default function StudentPortal() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  
  // Extract student ID from the proxy email (e.g. STU-2024-001@school.optalflow.com)
  const proxyStudentId = user?.email?.split('@')[0];
  
  // Real Database Hooks
  const { data: studentRecords = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }),
    enabled: !!companyId
  });
  const { data: exams = [], isLoading: isExamsLoading } = useIndustryRecords('exam');
  const { data: attendanceRecords = [] } = useIndustryRecords('attendance');
  const { data: gradeRecords = [] } = useIndustryRecords('grade');

  const mappedStudents = studentRecords.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name,
      studentId: r.id_number,
      company_id: r.company_id,
      class: extra.class || 'Unknown'
    };
  });

  const activeStudent = mappedStudents.find(s => s.studentId === proxyStudentId) || mappedStudents[0]; // fallback to [0] for preview if admin

  const { data: documents = [] } = useQuery({
    queryKey: ["student-docs", activeStudent?.id],
    queryFn: () => base44.entities.Document.filter({ client_id: activeStudent?.id }),
    enabled: !!activeStudent?.id,
  });

  const mappedExams = exams.map(r => ({
    id: r.id,
    ...r.data
  })).slice(0, 3);

  if (isStudentsLoading || isExamsLoading) {
    return <div className="py-12 text-center text-muted-foreground">{t("loading_student_dashboard", "Loading student dashboard...")}</div>;
  }

  if (mappedStudents.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto bg-card rounded-xl border border-border p-6 shadow-sm">
        <User className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-600 animate-pulse" />
        <p className="font-semibold text-lg text-card-foreground">{t("no_student_profile_found", "No student profile found")}</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{t(
          "you_must_be_enrolled",
          "You must be enrolled to view the student portal."
        )}</p>
      </div>
    );
  }

  let attendancePct = 0;
  let averageGrade = 'N/A';

  if (activeStudent) {
    // Calculate Attendance
    let present = 0, totalDays = 0;
    attendanceRecords.forEach(att => {
      const rec = att.data?.records?.find(r => r.studentId === activeStudent.studentId);
      if (rec) {
        totalDays++;
        if (rec.status === 'Present') present++;
      }
    });
    if (totalDays > 0) attendancePct = Math.round((present / totalDays) * 100);

    // Calculate Average Grade
    const studentGrades = gradeRecords.filter(g => g.data?.studentName === activeStudent.name);
    if (studentGrades.length > 0) {
      const totalScore = studentGrades.reduce((sum, g) => sum + (g.data?.score || 0), 0);
      const totalMax = studentGrades.reduce((sum, g) => sum + (g.data?.maxScore || 100), 0);
      const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
      if (pct >= 90) averageGrade = 'A';
      else if (pct >= 80) averageGrade = 'B';
      else if (pct >= 70) averageGrade = 'C';
      else if (pct >= 60) averageGrade = 'D';
      else averageGrade = 'F';
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("welcome_back", "Welcome back")}, {activeStudent.name.split(' ')[0]}!</h1>
          <p className="text-teal-50 max-w-xl">{t("ready_to_learn", "Here is your academic progress, attendance, and timetable for the current term.")}</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <BookOpen className="w-64 h-64" />
        </div>
      </div>
      
      {/* Student Profile Card */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-bold shrink-0 shadow-inner uppercase">
          {activeStudent.name?.substring(0, 2)}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold text-card-foreground mb-1">{activeStudent.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground font-medium">
            <span className="bg-muted px-3 py-1 rounded-full text-foreground transition-colors">{activeStudent.class}</span>
            <span>{t("student_id", "Student ID:")} {activeStudent.studentId}</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full">{t("enrolled", "Enrolled")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Stats) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600"><CheckCircle className="w-4 h-4" /></div>
                <h3 className="font-bold text-foreground">{t("my_attendance", "My Attendance")}</h3>
              </div>
              <p className="text-4xl font-extrabold text-card-foreground mb-1">{attendancePct}%</p>
              <p className="text-xs text-muted-foreground">{t("present_for_the_term", "Present for the term")}</p>
            </div>
            
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center text-blue-600"><BookOpen className="w-4 h-4" /></div>
                <h3 className="font-bold text-foreground">{t("my_performance", "My Performance")}</h3>
              </div>
              <p className="text-4xl font-extrabold text-blue-600 mb-1">{averageGrade}</p>
              <p className="text-xs text-muted-foreground">{t("term_report_card", "Term Report Card")}</p>
            </div>
          </div>

          {/* Timetable / Exams */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-border bg-muted/50 flex justify-between items-center">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> {t("my_upcoming_exams", "My Upcoming Exams")}</h3>
            </div>
            <div className="divide-y divide-border p-2">
              {mappedExams.map((item, i) => {
                return (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-muted dark:hover:bg-muted/30 rounded-lg transition-colors">
                    <div className="w-20 shrink-0 text-center text-xs font-bold text-muted-foreground bg-muted dark:bg-muted/50 py-1.5 rounded-md">{item.time}</div>
                    <div className="flex-1">
                      <p className="font-bold text-card-foreground text-sm">{item.subject}</p>
                      <p className="text-xs text-muted-foreground">{item.venue}</p>
                    </div>
                    <span className="bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">{t("exam", "Exam")}</span>
                  </div>
                );
              })}
              {mappedExams.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">{t("no_exams_scheduled_currently", "No exams scheduled currently.")}</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-1 space-y-6">
          {/* Documents Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-muted-foreground" /> {t("my_documents", "My Documents")}</h3>
            </div>
            <div className="divide-y divide-border p-2">
              {documents.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">{t("no_documents_found", "No documents found.")}</div>
              ) : documents.map(doc => {
                return (
                  <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-muted dark:hover:bg-muted/30 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-card-foreground mb-0.5 truncate max-w-[120px]" title={doc.name}>{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(doc.created_date), "MMM d")}</p>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
