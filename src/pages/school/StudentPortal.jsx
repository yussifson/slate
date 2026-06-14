import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, BookOpen, CheckCircle, Clock, User, Download, FileText, ClipboardList, GraduationCap, LayoutDashboard, Zap, Target, ArrowRight } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from "@tanstack/react-query";
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

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
  
  if (isStudentsLoading) return <div className="py-12 flex justify-center"><div className="text-emerald-500 font-black animate-pulse text-xl uppercase tracking-widest">{t("loading", "Loading Portal...")}</div></div>;
  if (!activeStudent) return <div className="py-12 text-center font-black text-2xl text-emerald-900">No student profile found.</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-emerald-950 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tight leading-none mb-2 uppercase">
            {t("welcome_back", "Welcome")}, <span className="text-emerald-500">{user?.user_metadata?.full_name || activeStudent.name.split(' ')[0]}</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-950 text-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest">{activeStudent.studentId}</span>
            <span className="text-emerald-700 font-black uppercase text-sm tracking-widest">{activeStudent.class}</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['dashboard', 'courses', 'grades', 'assignments'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-3 font-black uppercase tracking-widest text-xs transition-colors border-4 whitespace-nowrap ${activeTab === tab ? 'bg-emerald-500 border-emerald-950 text-emerald-950' : 'bg-transparent border-transparent text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'}`}>
              {tab === 'dashboard' && <LayoutDashboard className="w-4 h-4" />}
              {tab === 'courses' && <BookOpen className="w-4 h-4" />}
              {tab === 'grades' && <GraduationCap className="w-4 h-4" />}
              {tab === 'assignments' && <ClipboardList className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-emerald-400 border-4 border-emerald-950 p-6 flex flex-col justify-center relative overflow-hidden">
                <Target className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-950 opacity-10" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-emerald-950 flex items-center justify-center text-emerald-400"><CheckCircle className="w-6 h-6" /></div>
                  <h3 className="font-black text-emerald-950 text-sm uppercase tracking-widest">{t("attendance", "Attendance")}</h3>
                </div>
                <p className="text-5xl font-black text-emerald-950 mb-1 relative z-10">{attendancePct}%</p>
                <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest relative z-10">{t("present_for_the_term", "Present this term")}</p>
              </div>
              
              <div className="bg-white border-4 border-emerald-950 p-6 flex flex-col justify-center relative overflow-hidden">
                <Zap className="absolute -right-4 -top-4 w-32 h-32 text-emerald-100 opacity-50" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-emerald-500 border-2 border-emerald-950 flex items-center justify-center text-emerald-950"><GraduationCap className="w-6 h-6" /></div>
                  <h3 className="font-black text-emerald-950 text-sm uppercase tracking-widest">{t("performance", "Performance")}</h3>
                </div>
                <p className="text-5xl font-black text-emerald-500 mb-1 relative z-10">{averageGrade}</p>
                <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest relative z-10">{t("term_report_card", "Term Average")}</p>
              </div>
            </div>

            <div className="bg-white border-4 border-emerald-950">
              <div className="p-5 border-b-4 border-emerald-950 bg-emerald-50 flex justify-between items-center">
                <h3 className="font-black text-emerald-950 uppercase tracking-widest flex items-center gap-3"><Calendar className="w-5 h-5 text-emerald-500" /> Upcoming Exams</h3>
              </div>
              <div className="divide-y-4 divide-emerald-100 p-0">
                {exams.slice(0,3).map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-5 hover:bg-emerald-50 transition-colors">
                    <div className="w-24 shrink-0 text-center font-black text-emerald-950 bg-emerald-200 border-2 border-emerald-950 py-2 uppercase tracking-widest text-xs">{item.data?.time}</div>
                    <div className="flex-1">
                      <p className="font-black text-emerald-950 text-lg uppercase tracking-wider">{item.data?.subject}</p>
                      <p className="text-sm font-bold text-emerald-600">{item.data?.venue}</p>
                    </div>
                  </div>
                ))}
                {exams.length === 0 && <div className="py-8 text-center font-bold text-emerald-600 uppercase tracking-widest">No exams scheduled.</div>}
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-8">
            <div className="bg-emerald-950 border-4 border-emerald-950">
              <div className="p-5 border-b-4 border-emerald-800 bg-emerald-900">
                <h3 className="font-black text-emerald-50 uppercase tracking-widest flex items-center gap-3"><FileText className="w-5 h-5 text-emerald-400" /> My Documents</h3>
              </div>
              <div className="divide-y-2 divide-emerald-800 p-2">
                {documents.length === 0 ? (
                  <div className="py-8 text-center font-bold text-emerald-500 uppercase tracking-widest text-xs">No documents.</div>
                ) : documents.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-emerald-800 transition-colors">
                    <div>
                      <p className="font-bold text-emerald-50 mb-1 truncate max-w-[150px]">{doc.name}</p>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{format(new Date(doc.created_date), "MMM d")}</p>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-emerald-500 flex items-center justify-center text-emerald-950 hover:bg-emerald-400 transition-colors border-2 border-transparent hover:border-emerald-50">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'courses' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white border-4 border-emerald-950 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">Course Registration</h3>
                <p className="text-emerald-600 font-bold mt-1">Manage your enrolled courses for the semester.</p>
              </div>
              {classConfig.allowSelfRegistration && myRegisteredCourses.length === 0 && (
                <button onClick={handleRegisterCourses} className="px-6 py-3 bg-emerald-500 text-emerald-950 font-black uppercase tracking-widest border-4 border-emerald-950 hover:bg-emerald-400 transition-colors flex items-center gap-2">
                  Register All <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {myRegisteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {myRegisteredCourses.map((c, i) => (
                  <div key={i} className="p-6 border-4 border-emerald-950 bg-emerald-50 flex items-center gap-4 hover:bg-emerald-100 transition-colors">
                    <div className="w-12 h-12 bg-emerald-500 border-2 border-emerald-950 flex items-center justify-center text-emerald-950 shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="font-black text-emerald-950 uppercase tracking-wider text-lg">{c}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-emerald-50 border-4 border-emerald-200 border-dashed">
                <BookOpen className="w-16 h-16 mx-auto text-emerald-300 mb-4" />
                <p className="font-black text-xl text-emerald-900 uppercase tracking-wider">No Courses Registered</p>
                {classConfig.allowSelfRegistration ? (
                  <p className="font-bold text-emerald-600 mt-2">Click the button above to register for {availableCourses.join(', ')}.</p>
                ) : (
                  <p className="font-bold text-emerald-600 mt-2">Registration is disabled. Contact admin.</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'grades' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-4 border-emerald-950">
          <div className="p-6 border-b-4 border-emerald-950 bg-emerald-400">
            <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">Academic Transcript</h3>
          </div>
          {studentGrades.length === 0 ? (
            <div className="py-16 text-center font-black text-emerald-400 uppercase tracking-widest text-xl">No grades recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-emerald-50 border-b-4 border-emerald-950">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-emerald-950 uppercase tracking-widest">Exam/Assignment</th>
                    <th className="px-6 py-4 text-left font-black text-emerald-950 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-right font-black text-emerald-950 uppercase tracking-widest">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-emerald-100">
                  {studentGrades.map(g => {
                    const score = g.data?.score || 0;
                    const max = g.data?.maxScore || 100;
                    const pct = Math.round((score/max)*100);
                    return (
                      <tr key={g.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="px-6 py-5 font-black text-emerald-950 text-base">{g.data?.examName}</td>
                        <td className="px-6 py-5 font-bold text-emerald-700">{g.data?.subject}</td>
                        <td className="px-6 py-5 text-right">
                          <span className={`font-black text-lg px-3 py-1 border-2 ${pct >= 50 ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
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
        </motion.div>
      )}

      {activeTab === 'assignments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-4 border-emerald-950">
          <div className="p-6 border-b-4 border-emerald-950 bg-emerald-400">
            <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">My Assignments</h3>
          </div>
          {studentAssignments.length === 0 ? (
            <div className="py-16 text-center font-black text-emerald-400 uppercase tracking-widest text-xl">No active assignments.</div>
          ) : (
            <div className="divide-y-4 divide-emerald-950">
              {studentAssignments.map(a => (
                <div key={a.id} className="p-6 hover:bg-emerald-50 flex flex-col md:flex-row justify-between md:items-center gap-6 transition-colors">
                  <div className="max-w-2xl">
                    <h4 className="font-black text-emerald-950 text-2xl mb-2">{a.data?.title}</h4>
                    <div className="flex gap-3 mb-4">
                      <span className="bg-emerald-950 text-emerald-50 px-2 py-1 text-xs font-bold uppercase tracking-widest">{a.data?.subject}</span>
                      <span className="bg-emerald-200 text-emerald-950 px-2 py-1 text-xs font-bold uppercase tracking-widest border border-emerald-950">{a.data?.teacher}</span>
                    </div>
                    <p className="font-medium text-emerald-800">{a.data?.description}</p>
                  </div>
                  <div className="text-left md:text-right shrink-0 bg-emerald-100 p-4 border-2 border-emerald-950">
                    <p className="text-xs font-black text-emerald-950 uppercase tracking-widest mb-2">Due Date</p>
                    <p className="font-black text-red-600 bg-red-50 border-2 border-red-600 px-4 py-2 uppercase tracking-widest inline-block">{a.data?.dueDate}</p>
                    <div className="mt-4">
                      <button className="w-full bg-emerald-950 text-emerald-50 font-black uppercase tracking-widest text-xs py-3 px-4 hover:bg-emerald-800 transition-colors">Upload Work</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
