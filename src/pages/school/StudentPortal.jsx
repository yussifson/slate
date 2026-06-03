import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Calendar, BookOpen, CheckCircle, Clock, User, Download, FileText, ClipboardList, GraduationCap, LayoutDashboard } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from "@tanstack/react-query";
import { useCompanyId } from '@/hooks/useCompanyId';
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
    enabled: !!activeStudent?.id,
  });

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
  
  // Find registered courses (we can store this in IndustryRecord of type 'course_registration')
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
        courses: availableCourses // Register all available for this demo, usually would be a checklist
      },
      status: 'active',
      searchText: `${activeStudent.name} ${activeStudent.studentId} courses`
    }, {
      onSuccess: () => toast.success("Courses registered successfully!"),
      onError: (err) => toast.error("Failed to register: " + err.message)
    });
  };

  const studentAssignments = assignmentRecords.filter(a => a.data?.className === activeStudent?.class || a.data?.className === 'All');
  
  if (isStudentsLoading) return <div className="py-12 text-center text-muted-foreground">{t("loading", "Loading...")}</div>;
  if (!activeStudent) return <div className="py-12 text-center font-bold text-lg">No student profile found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("welcome_back", "Welcome back")}, {user?.user_metadata?.full_name || activeStudent.name.split(' ')[0]}!</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("student_id", "Student ID:")} <span className="font-bold text-foreground">{activeStudent.studentId}</span> • {activeStudent.class}</p>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar bg-muted p-1 rounded-xl border border-border">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('courses')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'courses' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <BookOpen className="w-4 h-4" /> Courses
          </button>
          <button onClick={() => setActiveTab('grades')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'grades' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <GraduationCap className="w-4 h-4" /> Grades
          </button>
          <button onClick={() => setActiveTab('assignments')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'assignments' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <ClipboardList className="w-4 h-4" /> Assignments
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm"><CheckCircle className="w-5 h-5" /></div>
                  <h3 className="font-bold text-muted-foreground text-sm">{t("attendance", "Attendance")}</h3>
                </div>
                <p className="text-3xl font-bold text-card-foreground mb-1">{attendancePct}%</p>
                <p className="text-xs text-muted-foreground">{t("present_for_the_term", "Present for the term")}</p>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-4 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-sm"><GraduationCap className="w-5 h-5" /></div>
                  <h3 className="font-bold text-muted-foreground text-sm">{t("performance", "Performance")}</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{averageGrade}</p>
                <p className="text-xs text-muted-foreground">{t("term_report_card", "Term Report Card")}</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
                <h3 className="font-bold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> Upcoming Exams</h3>
              </div>
              <div className="divide-y divide-border p-2">
                {exams.slice(0,3).map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="w-20 shrink-0 text-center text-xs font-bold text-muted-foreground bg-muted py-1.5 rounded-md">{item.data?.time}</div>
                    <div className="flex-1">
                      <p className="font-bold text-card-foreground text-sm">{item.data?.subject}</p>
                      <p className="text-xs text-muted-foreground">{item.data?.venue}</p>
                    </div>
                  </div>
                ))}
                {exams.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No exams scheduled currently.</div>}
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="font-bold text-card-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-muted-foreground" /> My Documents</h3>
              </div>
              <div className="divide-y divide-border p-2">
                {documents.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">No documents found.</div>
                ) : documents.map(doc => (
                  <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-card-foreground mb-0.5 truncate max-w-[120px]">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(doc.created_date), "MMM d")}</p>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"><Download className="w-4 h-4" /></Button>
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
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Course Registration</h3>
                <p className="text-sm text-muted-foreground">Manage your enrolled courses for the semester.</p>
              </div>
              {classConfig.allowSelfRegistration && myRegisteredCourses.length === 0 && (
                <Button onClick={handleRegisterCourses} className="bg-emerald-600 hover:bg-emerald-700 text-white">Register All Courses</Button>
              )}
            </div>
            
            {myRegisteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {myRegisteredCourses.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">{c}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                <p className="font-semibold text-foreground">You are not registered for any courses yet.</p>
                {classConfig.allowSelfRegistration ? (
                  <p className="text-sm text-muted-foreground mt-1">Click the button above to register for {availableCourses.join(', ')}.</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Self-registration is disabled. Please contact the administrator.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in">
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
                        <span className={`font-bold ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-blue-600' : 'text-red-600'}`}>
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

      {activeTab === 'assignments' && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-border bg-muted/50">
            <h3 className="font-bold text-card-foreground">My Assignments</h3>
          </div>
          {studentAssignments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No active assignments for your class.</div>
          ) : (
            <div className="divide-y divide-border">
              {studentAssignments.map(a => (
                <div key={a.id} className="p-4 hover:bg-muted/20 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-foreground text-lg">{a.data?.title}</h4>
                    <p className="text-sm text-muted-foreground">{a.data?.subject} • {a.data?.teacher}</p>
                    <p className="text-sm mt-2 max-w-2xl">{a.data?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Due Date</p>
                    <p className="font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm inline-block">{a.data?.dueDate}</p>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="w-full text-xs">Upload Work</Button>
                    </div>
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
