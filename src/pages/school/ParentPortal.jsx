import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Calendar, Bell, FileText, CheckCircle, Clock, BookOpen, User, CreditCard, Download, LayoutDashboard, GraduationCap, ArrowRight, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
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
    queryFn: () => powerSync.execute('SELECT * FROM school_students WHERE company_id = ?', [companyId]).then(r => r.rows._array),
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
  const proxyParentEmail = user?.email;

  const myChildren = mappedStudents.filter(s => s.parentEmail === proxyParentEmail || proxyParentEmail?.includes('admin'));
  
  const activeStudent = selectedChildId 
    ? myChildren.find(c => c.id === selectedChildId) 
    : (myChildren[0] || mappedStudents[0]);

  const { data: documents = [] } = useQuery({
    queryKey: ["student-docs", activeStudent?.id],
    queryFn: () => powerSync.execute('SELECT * FROM school_notices WHERE company_id = ?', [companyId]).then(r => r.rows._array),
    enabled: !!activeStudent?.id});

  const createDocMutation = useMutation({
    mutationFn: async (data) => powerSync.execute('INSERT INTO school_notices (id, company_id, created_at) VALUES (uuid(), ?, datetime(\'now\'))', [companyId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-docs", activeStudent?.id] });
      toast.success("Document uploaded successfully");
      setShowUpload(false);
    }});

  const handleUploadSubmit = (docData) => {
    createDocMutation.mutate({
      ...docData,
      company_id: activeStudent?.company_id,
      client_id: activeStudent?.id,
      client_name: activeStudent?.name,
      uploaded_by: 'Parent/Guardian',
      shared_with_client: true});
  };

  const mappedExams = exams.map(r => ({
    id: r.id,
    ...r.data
  })).slice(0, 3);

  if (isStudentsLoading && companyId) {
    return <div className="py-12 flex justify-center"><div className="text-[var(--primary)] font-semibold animate-pulse text-lg">{t("loading", "Loading Family Data...")}</div></div>;
  }

  if (mappedStudents.length === 0) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8">
        <User className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
        <p className="font-display font-semibold text-2xl text-[var(--color-text-primary)] mb-2 tracking-tight tracking-[-0.02em]">No Profiles Linked</p>
        <p className="font-medium text-[var(--color-text-secondary)] text-sm">Ensure your email is linked to a student in the directory.</p>
      </div>
    );
  }

  const feeStatus = activeStudent.feeStatus || 'Owing';
  const balance = feeStatus === 'Paid' ? 0 : (feeStatus === 'Partial' ? 800 : 1200);

  let attendancePct = 0;
  let averageGrade = 'N/A';
  let studentGrades = [];

  if (activeStudent) {
    let present = 0, totalDays = 0;
    attendanceRecords.forEach(att => {
      const rec = att.data?.records?.find(r => r.studentId === activeStudent.studentId);
      if (rec) {
        totalDays++;
        if (rec.status === 'Present') present++;
      }
    });
    if (totalDays > 0) attendancePct = Math.round((present / totalDays) * 100);

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* Header & Nav */}
      <div className="border-b border-primary/40 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">
            Family <span className="text-[var(--primary)]">Portal</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] font-medium mt-1 text-sm">Managing records for your dependents.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['dashboard', 'academics', 'finance', 'communications'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === tab ? 'bg-[var(--primary)] text-white' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)]'}`}>
              {tab === 'dashboard' && <LayoutDashboard className="w-4 h-4" />}
              {tab === 'academics' && <GraduationCap className="w-4 h-4" />}
              {tab === 'finance' && <CreditCard className="w-4 h-4" />}
              {tab === 'communications' && <Bell className="w-4 h-4" />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Child Selector */}
      {myChildren.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] whitespace-nowrap px-2 tracking-[0.04em]">Viewing:</span>
          {myChildren.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors rounded-full whitespace-nowrap border ${
                activeStudent?.id === child.id ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--color-surface-0)] border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${activeStudent?.id === child.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]'}`}>
                {child.name.substring(0,2).toUpperCase()}
              </div>
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Child Profile Card */}
      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <User className="absolute -right-8 -top-8 w-48 h-48 text-[var(--primary)] opacity-5 pointer-events-none" />
        <div className="w-24 h-24 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] text-3xl font-semibold shrink-0 border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20 relative z-10 tracking-[-0.02em]">
          {activeStudent.name?.substring(0, 2).toUpperCase()}
        </div>
        <div className="text-center md:text-left flex-1 relative z-10">
          <h2 className="text-3xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight mb-3 tracking-[-0.02em]">{activeStudent.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[var(--tracking-widest)] rounded-full tracking-[0.04em]">{activeStudent.class}</span>
            <span className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] px-3 py-1 text-xs font-semibold uppercase tracking-[var(--tracking-widest)] rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 tracking-[0.04em]">ID: {activeStudent.studentId}</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center md:items-end gap-2 bg-[var(--color-surface-1)] p-5 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 w-full md:w-auto relative z-10">
          <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Term Balance</span>
          <div className="text-3xl font-display font-semibold text-[var(--color-text-primary)] mb-1 tracking-[-0.02em]">${balance.toLocaleString()}</div>
          <span className={`text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] px-2.5 py-1 rounded-full ${
            feeStatus === 'Paid' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' :
            feeStatus === 'Partial' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' : 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]'
          }`}>{feeStatus}</span>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                    <CheckCircle className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{t("attendance", "Attendance")}</h3>
                </div>
                <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">{attendancePct}%</p>
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] relative z-10 tracking-[0.04em]">Present for the term</p>
              </div>
              
              <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)' }}>
                    <BookOpen className="w-6 h-6 text-[var(--color-info)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{t("performance", "Performance")}</h3>
                </div>
                <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-info)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">{averageGrade}</p>
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] relative z-10 tracking-[0.04em]">Term Report Card</p>
              </div>
            </div>

            <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
              <div className="p-5 border-b border-primary/20 bg-[var(--color-surface-1)]">
                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--primary)]" /> Upcoming Scheduled Exams
                </h3>
              </div>
              <div className="divide-y divide-primary/10">
                {mappedExams.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 hover:bg-[var(--color-surface-2)] transition-colors">
                    <div className="w-20 shrink-0 text-center font-semibold text-[var(--primary)] bg-[var(--primary)]/10 rounded-md-[var(--radius-md)] py-1.5 text-xs tracking-[0.04em]">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--color-text-primary)]">{item.subject}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 tracking-[0.04em]">{item.venue}</p>
                    </div>
                  </div>
                ))}
                {mappedExams.length === 0 && <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">No exams scheduled.</div>}
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
              <div className="p-5 border-b border-primary/20 bg-[var(--color-surface-1)] flex justify-between items-center">
                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--primary)]" /> Documents
                </h3>
                <Button variant="outline" size="sm" className="h-8 rounded-full border-primary/30 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white" onClick={() => setShowUpload(true)}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                </Button>
              </div>
              <div className="divide-y divide-primary/10">
                {documents.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">No documents found.</div>
                ) : documents.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-2)] transition-colors">
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)] text-sm mb-0.5">{doc.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">{format(new Date(doc.created_date), "MMM d, yyyy")} • {doc.category?.replace('_', ' ')}</p>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-md-[var(--radius-md)] bg-[var(--color-surface-1)] flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors border-[0.5px] border-black/9 dark:border-white/8 border-primary/20">
                        <Download className="w-4 h-4" />
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
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
          <div className="p-6 border-b border-primary/20 bg-[var(--color-surface-1)]">
            <h3 className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">Academic Transcript</h3>
          </div>
          {studentGrades.length === 0 ? (
             <div className="py-16 text-center text-[var(--color-text-secondary)] text-sm">No grades recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-1)]/50 border-b border-primary/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[var(--tracking-widest)] font-semibold text-[var(--color-text-tertiary)] tracking-[0.04em]">Exam/Assignment</th>
                    <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[var(--tracking-widest)] font-semibold text-[var(--color-text-tertiary)] tracking-[0.04em]">Subject</th>
                    <th className="px-6 py-4 text-right text-[11px] uppercase tracking-[var(--tracking-widest)] font-semibold text-[var(--color-text-tertiary)] tracking-[0.04em]">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {studentGrades.map(g => {
                    const score = g.data?.score || 0;
                    const max = g.data?.maxScore || 100;
                    const pct = Math.round((score/max)*100);
                    return (
                      <tr key={g.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                        <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">{g.data?.examName}</td>
                        <td className="px-6 py-4 text-[var(--color-text-secondary)]">{g.data?.subject}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center font-semibold text-xs px-2.5 py-1 rounded-full ${pct >= 50 ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]'}`}>
                            {score} / {max} ({pct}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-6">
            <CreditCard className="w-10 h-10 text-[var(--primary)]" />
          </div>
          <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight mb-2 tracking-[-0.02em]">Fee Statements</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-8">No recent transactions or invoices found.</p>
          {balance > 0 && (
            <div className="mt-8 p-8 border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-destructive)]/30 rounded-md-[var(--radius-xl)] bg-[var(--color-destructive)]/5 max-w-md mx-auto">
              <p className="text-[11px] font-semibold text-[var(--color-destructive)] uppercase tracking-[var(--tracking-widest)] mb-2 tracking-[0.04em]">Outstanding Balance</p>
              <p className="text-4xl font-display font-semibold text-[var(--color-destructive)] mb-6 tracking-[-0.02em]">${balance.toLocaleString()}</p>
              <Button className="w-full bg-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/90 text-white rounded-full">
                Pay Now <ArrowRight className="w-4 h-4 ml-2"/>
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-6">
            <Bell className="w-10 h-10 text-[var(--primary)]" />
          </div>
          <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight mb-2 tracking-[-0.02em]">Announcements</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-8">You have no new messages from administration.</p>
          <Button variant="outline" className="border-primary/40 text-[var(--primary)] rounded-full hover:bg-[var(--primary)] hover:text-white px-8">
            Contact Office
          </Button>
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
