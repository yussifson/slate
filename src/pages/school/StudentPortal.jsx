import React, { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Calendar, BookOpen, CheckCircle, Clock, User, Download, FileText, ClipboardList, GraduationCap, LayoutDashboard, Zap, Target, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'react-hot-toast';

export default function StudentPortal() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  
  const proxyStudentId = user?.email?.split('@')[0];
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real Database Hooks
  const { data: studentRecords = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }),
    enabled: !!companyId
  });
  
  const { data: classes = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  const { data: exams = [] } = useIndustryRecords('exam');
  const { data: attendanceRecords = [] } = useIndustryRecords('attendance');
  const { data: gradeRecords = [] } = useIndustryRecords('grade');
  const { data: assignmentRecords = [] } = useIndustryRecords('assignment');
  const mutateRecord = useMutateIndustryRecord();

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

  const activeStudent = mappedStudents.find(s => s.studentId === proxyStudentId) || mappedStudents[0];

  const { data: documents = [] } = useQuery({
    queryKey: ["student-docs", activeStudent?.id],
    queryFn: () => base44.entities.Document.filter({ client_id: activeStudent?.id }),
    enabled: !!activeStudent?.id});

  // Calculate stats
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

  // Course Registration Logic
  const myClassInfo = classes.find(c => c.title === activeStudent?.class);
  let classConfig = {};
  if (myClassInfo) {
    try { classConfig = JSON.parse(myClassInfo.description || '{}'); } catch(e) {}
  }
  const availableCourses = classConfig.courses ? classConfig.courses.split(',').map(c => c.trim()) : [];
  
  const { data: regRecords = [] } = useIndustryRecords('course_registration');
  const myRegistration = regRecords.find(r => r.data?.studentId === activeStudent?.studentId);
  const myRegisteredCourses = myRegistration ? (myRegistration.data.courses || []) : [];

  const handleRegisterCourses = () => {
    if (!classConfig.allowSelfRegistration) return toast.error("Self-registration is currently disabled for your class.");
    if (availableCourses.length === 0) return toast.error("No courses available for your class.");
    
    mutateRecord.mutate({
      recordType: 'course_registration',
      payload: {
        studentId: activeStudent.studentId,
        studentName: activeStudent.name,
        class: activeStudent.class,
        courses: availableCourses 
      },
      status: 'active',
      searchText: `${activeStudent.name} ${activeStudent.studentId} courses`
    }, {
      onSuccess: () => toast.success("Courses registered successfully!"),
      onError: (err) => toast.error("Failed to register: " + err.message)
    });
  };

  const studentAssignments = assignmentRecords.filter(a => a.data?.className === activeStudent?.class || a.data?.className === 'All');
  
  if (isStudentsLoading) return <div className="py-12 flex justify-center"><div className="text-[var(--primary)] font-semibold animate-pulse text-lg">{t("loading", "Loading Portal...")}</div></div>;
  if (!activeStudent) return <div className="py-12 text-center font-semibold text-lg text-[var(--color-text-secondary)]">No student profile found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Nav */}
      <div className="border-b border-primary/40 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">
            {t("welcome_back", "Welcome")}, <span className="text-[var(--primary)]">{user?.user_metadata?.full_name || activeStudent.name.split(' ')[0]}</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-[var(--primary)] text-[var(--color-surface-0)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] rounded-full tracking-[0.04em]">{activeStudent.studentId}</span>
            <span className="text-[var(--color-text-secondary)] font-semibold text-sm">{activeStudent.class}</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['dashboard', 'courses', 'grades', 'assignments'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === tab ? 'bg-[var(--primary)] text-white' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)]'}`}>
              {tab === 'dashboard' && <LayoutDashboard className="w-4 h-4" />}
              {tab === 'courses' && <BookOpen className="w-4 h-4" />}
              {tab === 'grades' && <GraduationCap className="w-4 h-4" />}
              {tab === 'assignments' && <ClipboardList className="w-4 h-4" />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <Target className="absolute -right-4 -bottom-4 w-32 h-32 text-[var(--primary)] opacity-5" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                    <CheckCircle className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{t("attendance", "Attendance")}</h3>
                </div>
                <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">{attendancePct}%</p>
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] relative z-10 tracking-[0.04em]">{t("present_for_the_term", "Present this term")}</p>
              </div>
              
              <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <Zap className="absolute -right-4 -top-4 w-32 h-32 text-[var(--color-info)] opacity-5" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)' }}>
                    <GraduationCap className="w-6 h-6 text-[var(--color-info)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{t("performance", "Performance")}</h3>
                </div>
                <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-info)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">{averageGrade}</p>
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] relative z-10 tracking-[0.04em]">{t("term_report_card", "Term Average")}</p>
              </div>
            </div>

            <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
              <div className="p-5 border-b border-primary/20 bg-[var(--color-surface-1)] flex justify-between items-center">
                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--primary)]" /> Upcoming Exams
                </h3>
              </div>
              <div className="divide-y divide-primary/10">
                {exams.slice(0,3).map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 hover:bg-[var(--color-surface-2)] transition-colors">
                    <div className="w-20 shrink-0 text-center font-semibold text-[var(--primary)] bg-[var(--primary)]/10 rounded-md-[var(--radius-md)] py-1.5 text-xs tracking-[0.04em]">
                      {item.data?.time}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--color-text-primary)]">{item.data?.subject}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 tracking-[0.04em]">{item.data?.venue}</p>
                    </div>
                  </div>
                ))}
                {exams.length === 0 && <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">No exams scheduled.</div>}
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
              <div className="p-5 border-b border-primary/20 bg-[var(--color-surface-1)]">
                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--primary)]" /> Today's Schedule
                </h3>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div className="relative pl-6 border-l-2 border-[var(--primary)]/30 pb-4">
                    <div className="absolute w-3 h-3 bg-[var(--primary)] rounded-full -left-[7px] top-1"></div>
                    <p className="font-semibold text-[var(--color-text-primary)] text-sm">08:00 AM - Mathematics</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 tracking-[0.04em]">Room 101 • Mr. Smith</p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-[var(--primary)] pb-4">
                    <div className="absolute w-3 h-3 bg-[var(--primary)] rounded-full -left-[7px] top-1"></div>
                    <p className="font-semibold text-[var(--color-text-primary)] text-sm">10:00 AM - Physics</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 tracking-[0.04em]">Lab A • Mrs. Jones</p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-transparent">
                    <div className="absolute w-3 h-3 bg-[var(--color-surface-2)] border-2 border-[var(--primary)]/50 rounded-full -left-[7px] top-1"></div>
                    <p className="font-semibold text-[var(--color-text-primary)] text-sm">01:00 PM - Literature</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 tracking-[0.04em]">Room 205 • Ms. Davis</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
              <div className="p-5 border-b border-primary/20 bg-[var(--color-surface-1)]">
                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--primary)]" /> My Documents
                </h3>
              </div>
              <div className="divide-y divide-primary/10">
                {documents.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">No documents.</div>
                ) : documents.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-2)] transition-colors">
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)] text-sm mb-0.5 truncate max-w-[150px]">{doc.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">{format(new Date(doc.created_date), "MMM d")}</p>
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

      {activeTab === 'courses' && (
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">Course Registration</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage your enrolled courses for the semester.</p>
            </div>
            {classConfig.allowSelfRegistration && myRegisteredCourses.length === 0 && (
              <Button onClick={handleRegisterCourses} className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-full">
                Register All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
          
          {myRegisteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myRegisteredCourses.map((c, i) => (
                <div key={i} className="p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)] bg-[var(--color-surface-1)] flex items-center gap-3 hover:border-[var(--primary)]/50 transition-colors">
                  <div className="w-10 h-10 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)] text-sm">{c}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/30 rounded-md-[var(--radius-xl)] bg-[var(--color-surface-1)]">
              <BookOpen className="w-12 h-12 mx-auto text-[var(--color-text-tertiary)] mb-4" />
              <p className="font-semibold text-base text-[var(--color-text-primary)]">No Courses Registered</p>
              {classConfig.allowSelfRegistration ? (
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">Click the button above to register for {availableCourses.join(', ')}.</p>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">Registration is disabled. Contact admin.</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
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

      {activeTab === 'assignments' && (
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
          <div className="p-6 border-b border-primary/20 bg-[var(--color-surface-1)]">
            <h3 className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">My Assignments</h3>
          </div>
          {studentAssignments.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-text-secondary)] text-sm">No active assignments.</div>
          ) : (
            <div className="divide-y divide-primary/10">
              {studentAssignments.map(a => (
                <div key={a.id} className="p-6 hover:bg-[var(--color-surface-2)] flex flex-col md:flex-row justify-between gap-6 transition-colors">
                  <div className="max-w-2xl">
                    <h4 className="font-semibold text-[var(--color-text-primary)] text-lg mb-1">{a.data?.title}</h4>
                    <div className="flex gap-2 mb-3">
                      <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-md text-xs font-medium tracking-[0.04em]">{a.data?.subject}</span>
                      <span className="bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-md text-xs font-medium tracking-[0.04em]">{a.data?.teacher}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{a.data?.description}</p>
                  </div>
                  <div className="text-left md:text-right shrink-0 bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">Due Date</p>
                      <p className="font-medium text-[var(--color-destructive)] text-sm">{a.data?.dueDate}</p>
                    </div>
                    <Button variant="outline" className="w-full mt-4 text-xs font-medium border-primary/30 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-full tracking-[0.04em]">
                      Upload Work
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
