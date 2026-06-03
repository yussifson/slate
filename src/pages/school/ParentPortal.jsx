import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, Bell, FileText, CheckCircle, Clock, BookOpen, User, CreditCard, Download } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompanyId } from '@/hooks/useCompanyId';
import { UploadDocumentDialog } from "@/components/cases/CaseDocumentRepo";
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { useAuth } from '@/lib/AuthContext';

export default function ParentPortal() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  // Real Database Hooks
  const { data: studentRecords = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }),
    enabled: !!companyId
  });
  const { data: exams = [], isLoading: isExamsLoading } = useIndustryRecords('exam');
  const { data: attendanceRecords = [] } = useIndustryRecords('attendance');
  const { data: gradeRecords = [] } = useIndustryRecords('grade');

  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const mappedStudents = studentRecords.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name,
      studentId: r.id_number,
      company_id: r.company_id,
      class: extra.class || 'Unknown',
      feeStatus: extra.feeStatus || 'Owing',
      parentEmail: extra.parentEmail || ''
    };
  });

  const { user } = useAuth();
  const proxyParentEmail = user?.email; // PAR-2024-001@school.optalflow.com

  // Find all children linked to this parent's email. Fallback to all if super_admin/previewing
  const myChildren = mappedStudents.filter(s => s.parentEmail === proxyParentEmail || proxyParentEmail?.includes('admin'));
  
  const activeStudent = myChildren[0] || mappedStudents[0];

  const { data: documents = [] } = useQuery({
    queryKey: ["student-docs", activeStudent?.id],
    queryFn: () => base44.entities.Document.filter({ client_id: activeStudent?.id }),
    enabled: !!activeStudent?.id,
  });

  const createDocMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-docs", activeStudent?.id] });
      toast.success("Document uploaded successfully");
      setShowUpload(false);
    },
  });

  const handleUploadSubmit = (docData) => {
    createDocMutation.mutate({
      ...docData,
      company_id: activeStudent?.company_id,
      client_id: activeStudent?.id,
      client_name: activeStudent?.name,
      uploaded_by: 'Parent/Guardian',
      shared_with_client: true, // uploaded by parent, so shared automatically
    });
  };

  const mappedExams = exams.map(r => ({
    id: r.id,
    ...r.data
  })).slice(0, 3);

  if (isStudentsLoading && companyId) {
    return <div className="py-12 text-center text-muted-foreground">{t("loading_family_profile", "Loading family profile...")}</div>;
  }

  if (mappedStudents.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto bg-card rounded-xl border border-border p-6 shadow-sm">
        <User className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600 animate-pulse" />
        <p className="font-semibold text-lg text-card-foreground">{t("no_child_profiles_found", "No child profiles found")}</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{t(
          "enroll_a_student_in_the_studen",
          "Enroll a student in the student directory first to activate the Parent Portal view."
        )}</p>
      </div>
    );
  }

  const feeStatus = activeStudent.feeStatus || 'Owing';
  const balance = feeStatus === 'Paid' ? 0 : (feeStatus === 'Partial' ? 800 : 1200);

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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("welcome_back_guardian", "Welcome back, Guardian")}</h1>
          <p className="text-blue-100 max-w-xl">{t("view", "View")} {activeStudent.name}{t(
              "s_academic_progress_attendance",
              "'s academic progress, attendance, and fee statements for the current term."
            )}</p>
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
            <span>{t("student_id", "Student ID:")} {activeStudent.studentId}</span>
            <span className="text-slate-300">•</span>
            <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">{t("active", "Active")}</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("current_term_balance", "Current Term Balance")}</span>
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
                <h3 className="font-bold text-foreground">{t("attendance", "Attendance")}</h3>
              </div>
              <p className="text-4xl font-extrabold text-card-foreground mb-1">{attendancePct}%</p>
              <p className="text-xs text-muted-foreground">{t("present_for_the_term", "Present for the term")}</p>
            </div>
            
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center text-blue-600"><BookOpen className="w-4 h-4" /></div>
                <h3 className="font-bold text-foreground">{t("performance", "Performance")}</h3>
              </div>
              <p className="text-4xl font-extrabold text-blue-600 mb-1">{averageGrade}</p>
              <p className="text-xs text-muted-foreground">{t("term_report_card", "Term Report Card")}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-border bg-muted/50 flex justify-between items-center">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> {t("upcoming_scheduled_exams", "Upcoming Scheduled Exams")}</h3>
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
                    <span className="bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">{t("exam", "Exam")}</span>
                  </div>
                );
              })}
              {mappedExams.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">{t("no_exams_scheduled_currently", "No exams scheduled currently.")}</div>
              )}
            </div>
          </div>
        </div>

          {/* Documents Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-muted-foreground" /> {t("documents_forms", "Documents & Forms")}</h3>
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setShowUpload(true)}>
                <CheckCircle className="w-3.5 h-3.5" /> {t("upload_form", "Upload Form")}
              </Button>
            </div>
            <div className="divide-y divide-border p-2">
              {documents.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">{t("no_documents_found", "No documents found.")}</div>
              ) : documents.map(doc => {
                return (
                  <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-muted dark:hover:bg-muted/30 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-card-foreground mb-0.5">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(doc.created_date), "MMM d, yyyy")} • {doc.category?.replace('_', ' ')}</p>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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
      {showUpload && (
        <UploadDocumentDialog
          onClose={() => setShowUpload(false)}
          onSubmit={handleUploadSubmit}
          isUploading={createDocMutation.isPending}
          companyId={activeStudent?.company_id}
          caseId={activeStudent?.id} // Use student ID as case ID for storage path
        />
      )}
    </div>
  );
}
