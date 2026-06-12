import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, Bell, FileText, CheckCircle, Clock, BookOpen, User, CreditCard, Download, LayoutDashboard, GraduationCap } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChildId, setSelectedChildId] = useState(null);

  // Real Database Hooks
  const { data: studentRecords = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }),
    enabled: !!companyId
  });
  const { data: exams = [] } = useIndustryRecords('exam');
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
  const proxyParentEmail = user?.email; // PAR-2024-001@school.slate.com

  // Find all children linked to this parent's email. Fallback to all if super_admin/previewing
  const myChildren = mappedStudents.filter(s => s.parentEmail === proxyParentEmail || proxyParentEmail?.includes('admin'));
  
  const activeStudent = selectedChildId 
    ? myChildren.find(c => c.id === selectedChildId) 
    : (myChildren[0] || mappedStudents[0]);

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
    return <div className="py-12 text-center text-muted-foreground">{t("loading", "Loading family profile...")}</div>;
  }

  if (mappedStudents.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto bg-card rounded-xl border border-border p-6 shadow-sm">
        <User className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary animate-pulse" />
        <p className="font-semibold text-lg text-card-foreground">No child profiles found</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Enroll a student in the student directory first to activate the Parent Portal view.</p>
      </div>
    );
  }

  const feeStatus = activeStudent.feeStatus || 'Owing';
  const balance = feeStatus === 'Paid' ? 0 : (feeStatus === 'Partial' ? 800 : 1200);

  let attendancePct = 0;
  let averageGrade = 'N/A';
  let studentGrades = [];

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
    studentGrades = gradeRecords.filter(g => g.data?.studentName === activeStudent.name);
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
      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl school-heading font-extrabold tracking-tight">Welcome back, {user?.user_metadata?.full_name || 'Guardian'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Managing records for your dependents.</p>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar bg-muted p-1 rounded-xl border border-border">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('academics')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'academics' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <GraduationCap className="w-4 h-4" /> Academics
          </button>
          <button onClick={() => setActiveTab('finance')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'finance' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <CreditCard className="w-4 h-4" /> Finance
          </button>
          <button onClick={() => setActiveTab('communications')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'communications' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <Bell className="w-4 h-4" /> Communications
          </button>
        </div>
      </div>

      {/* Child Selector */}
      {myChildren.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Viewing:</span>
          {myChildren.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeStudent?.id === child.id ? 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 border-primary/20 text-primary dark:text-primary/70' : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 text-primary dark:text-primary/70 flex items-center justify-center text-[10px] font-bold">
                {child.name.substring(0,2).toUpperCase()}
              </div>
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Child Profile Card */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-primary/30 text-3xl font-bold shrink-0 shadow-inner uppercase">
          {activeStudent.name?.substring(0, 2)}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl school-heading font-extrabold tracking-tight mb-1">{activeStudent.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground font-medium">
            <span className="bg-muted px-3 py-1 rounded-full text-foreground">{activeStudent.class}</span>
            <span>Student ID: {activeStudent.studentId}</span>
            <span className="text-primary font-bold bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-200">Active</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Term Balance</span>
          <div className="text-3xl font-bold text-card-foreground">${balance.toLocaleString()}</div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
            feeStatus === 'Paid' ? 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 text-primary dark:text-primary/30 border-primary/20' :
            feeStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>{feeStatus}</span>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm"><CheckCircle className="w-5 h-5" /></div>
                  <h3 className="font-bold text-muted-foreground text-sm">Attendance</h3>
                </div>
                <p className="text-3xl font-bold text-card-foreground mb-1">{attendancePct}%</p>
                <p className="text-xs text-muted-foreground">Present for the term</p>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-4 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm"><BookOpen className="w-5 h-5" /></div>
                  <h3 className="font-bold text-muted-foreground text-sm">Performance</h3>
                </div>
                <p className="text-3xl font-bold text-primary dark:text-primary/70 dark:text-primary/70 mb-1">{averageGrade}</p>
                <p className="text-xs text-muted-foreground">Term Report Card</p>
              </div>
            </div>

            <div className="school-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="font-bold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> Upcoming Scheduled Exams</h3>
              </div>
              <div className="divide-y divide-border p-2">
                {mappedExams.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="w-20 shrink-0 text-center text-xs font-bold text-muted-foreground bg-muted py-1.5 rounded-md">{item.time}</div>
                    <div className="flex-1">
                      <p className="font-bold text-card-foreground text-sm">{item.subject}</p>
                      <p className="text-xs text-muted-foreground">{item.venue}</p>
                    </div>
                  </div>
                ))}
                {mappedExams.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No exams scheduled currently.</div>}
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="school-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
                <h3 className="font-bold text-card-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-muted-foreground" /> Documents</h3>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setShowUpload(true)}>
                  <CheckCircle className="w-3.5 h-3.5" /> Upload Form
                </Button>
              </div>
              <div className="divide-y divide-border p-2">
                {documents.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">No documents found.</div>
                ) : documents.map(doc => (
                  <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-card-foreground mb-0.5">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(doc.created_date), "MMM d, yyyy")} • {doc.category?.replace('_', ' ')}</p>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary dark:text-primary/70 hover:text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'academics' && (
        <div className="school-card overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-border bg-muted/50">
            <h3 className="font-bold text-card-foreground">Academic Transcript</h3>
          </div>
          {studentGrades.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No grades recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-muted-foreground uppercase">Exam/Assignment</th>
                  <th className="px-6 py-3 text-left font-bold text-muted-foreground uppercase">Subject</th>
                  <th className="px-6 py-3 text-right font-bold text-muted-foreground uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentGrades.map(g => {
                  const score = g.data?.score || 0;
                  const max = g.data?.maxScore || 100;
                  const pct = Math.round((score/max)*100);
                  return (
                    <tr key={g.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-medium text-foreground">{g.data?.examName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{g.data?.subject}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${pct >= 70 ? 'text-primary dark:text-primary/70' : pct >= 50 ? 'text-primary dark:text-primary/70' : 'text-red-600'}`}>
                          {score} / {max} ({pct}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="school-card overflow-hidden animate-in fade-in p-8 text-center text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
          <h3 className="font-bold text-lg text-foreground mb-1">Fee Statements & Invoices</h3>
          <p className="text-sm">No recent transactions or invoices found for this student.</p>
          {balance > 0 && (
            <div className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 max-w-sm mx-auto">
              <p className="font-semibold text-lg mb-2">Outstanding Balance: ${balance.toLocaleString()}</p>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Pay Now</Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="school-card overflow-hidden animate-in fade-in p-8 text-center text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
          <h3 className="font-bold text-lg text-foreground mb-1">Messages & Announcements</h3>
          <p className="text-sm">You have no new messages from the school administration.</p>
          <Button className="mt-6 bg-primary hover:bg-primary text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold">Contact School Office</Button>
        </div>
      )}

      {showUpload && (
        <UploadDocumentDialog
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onUpload={handleUploadSubmit}
          isUploading={createDocMutation.isPending}
        />
      )}
    </div>
  );
}
