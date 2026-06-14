import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, Bell, FileText, CheckCircle, Clock, BookOpen, User, CreditCard, Download, LayoutDashboard, GraduationCap, ArrowRight, Upload } from 'lucide-react';
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
import { motion } from 'framer-motion';

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
  const proxyParentEmail = user?.email;

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
      shared_with_client: true,
    });
  };

  const mappedExams = exams.map(r => ({
    id: r.id,
    ...r.data
  })).slice(0, 3);

  if (isStudentsLoading && companyId) {
    return <div className="py-12 flex justify-center"><div className="text-emerald-500 font-black animate-pulse text-xl uppercase tracking-widest">{t("loading", "Loading Family Data...")}</div></div>;
  }

  if (mappedStudents.length === 0) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-emerald-50 border-4 border-emerald-950 p-8">
        <User className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
        <p className="font-black text-2xl text-emerald-950 uppercase tracking-widest mb-2">No Profiles Linked</p>
        <p className="font-bold text-emerald-700">Ensure your email is linked to a student in the directory.</p>
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
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-emerald-950 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tight leading-none mb-2 uppercase">
            Family <span className="text-emerald-500">Portal</span>
          </h1>
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Managing records for your dependents.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['dashboard', 'academics', 'finance', 'communications'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-3 font-black uppercase tracking-widest text-xs transition-colors border-4 whitespace-nowrap ${activeTab === tab ? 'bg-emerald-500 border-emerald-950 text-emerald-950' : 'bg-transparent border-transparent text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'}`}>
              {tab === 'dashboard' && <LayoutDashboard className="w-4 h-4" />}
              {tab === 'academics' && <GraduationCap className="w-4 h-4" />}
              {tab === 'finance' && <CreditCard className="w-4 h-4" />}
              {tab === 'communications' && <Bell className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Child Selector */}
      {myChildren.length > 1 && (
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <span className="text-xs font-black text-emerald-950 uppercase tracking-widest whitespace-nowrap bg-emerald-200 px-3 py-2 border-2 border-emerald-950">Viewing:</span>
          {myChildren.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 px-4 py-2 font-black uppercase tracking-widest text-sm transition-colors border-4 whitespace-nowrap ${
                activeStudent?.id === child.id ? 'bg-emerald-950 border-emerald-950 text-emerald-50' : 'bg-white border-emerald-950 text-emerald-950 hover:bg-emerald-100'
              }`}
            >
              <div className={`w-6 h-6 flex items-center justify-center text-[10px] ${activeStudent?.id === child.id ? 'bg-emerald-500 text-emerald-950' : 'bg-emerald-950 text-emerald-50'}`}>
                {child.name.substring(0,2).toUpperCase()}
              </div>
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Child Profile Card */}
      <div className="bg-emerald-400 border-4 border-emerald-950 p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <User className="absolute -right-8 -top-8 w-48 h-48 text-emerald-950 opacity-10 pointer-events-none" />
        <div className="w-32 h-32 bg-emerald-950 flex items-center justify-center text-emerald-400 text-5xl font-black shrink-0 border-4 border-emerald-200 relative z-10">
          {activeStudent.name?.substring(0, 2).toUpperCase()}
        </div>
        <div className="text-center md:text-left flex-1 relative z-10">
          <h2 className="text-4xl font-black text-emerald-950 tracking-tight mb-4">{activeStudent.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="bg-emerald-950 text-emerald-50 px-4 py-2 text-sm font-black uppercase tracking-widest border-2 border-emerald-900">{activeStudent.class}</span>
            <span className="bg-emerald-100 text-emerald-950 px-4 py-2 text-sm font-black uppercase tracking-widest border-2 border-emerald-950">ID: {activeStudent.studentId}</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center md:items-end gap-2 bg-emerald-950 p-6 border-4 border-emerald-200 w-full md:w-auto relative z-10">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Term Balance</span>
          <div className="text-4xl font-black text-emerald-50 mb-1">${balance.toLocaleString()}</div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 ${
            feeStatus === 'Paid' ? 'bg-emerald-500 text-emerald-950 border-emerald-500' :
            feeStatus === 'Partial' ? 'bg-yellow-400 text-yellow-950 border-yellow-400' : 'bg-red-500 text-white border-red-500'
          }`}>{feeStatus}</span>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border-4 border-emerald-950 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-500 border-2 border-emerald-950 flex items-center justify-center text-emerald-950"><CheckCircle className="w-6 h-6" /></div>
                  <h3 className="font-black text-emerald-950 text-sm uppercase tracking-widest">Attendance</h3>
                </div>
                <p className="text-5xl font-black text-emerald-950 mb-1">{attendancePct}%</p>
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Present for the term</p>
              </div>
              
              <div className="bg-white border-4 border-emerald-950 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-500 border-2 border-emerald-950 flex items-center justify-center text-emerald-950"><BookOpen className="w-6 h-6" /></div>
                  <h3 className="font-black text-emerald-950 text-sm uppercase tracking-widest">Performance</h3>
                </div>
                <p className="text-5xl font-black text-emerald-500 mb-1">{averageGrade}</p>
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Term Report Card</p>
              </div>
            </div>

            <div className="bg-white border-4 border-emerald-950">
              <div className="p-5 border-b-4 border-emerald-950 bg-emerald-50">
                <h3 className="font-black text-emerald-950 uppercase tracking-widest flex items-center gap-3"><Calendar className="w-5 h-5 text-emerald-500" /> Upcoming Scheduled Exams</h3>
              </div>
              <div className="divide-y-4 divide-emerald-100 p-0">
                {mappedExams.map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-5 hover:bg-emerald-50 transition-colors">
                    <div className="w-24 shrink-0 text-center font-black text-emerald-950 bg-emerald-200 border-2 border-emerald-950 py-2 uppercase tracking-widest text-xs">{item.time}</div>
                    <div className="flex-1">
                      <p className="font-black text-emerald-950 text-lg uppercase tracking-wider">{item.subject}</p>
                      <p className="text-sm font-bold text-emerald-600">{item.venue}</p>
                    </div>
                  </div>
                ))}
                {mappedExams.length === 0 && <div className="py-8 text-center font-bold text-emerald-600 uppercase tracking-widest">No exams scheduled.</div>}
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-8">
            <div className="bg-emerald-950 border-4 border-emerald-950">
              <div className="p-5 border-b-4 border-emerald-800 bg-emerald-900 flex justify-between items-center">
                <h3 className="font-black text-emerald-50 uppercase tracking-widest flex items-center gap-3"><FileText className="w-5 h-5 text-emerald-400" /> Documents</h3>
                <button className="bg-emerald-500 text-emerald-950 px-3 py-1.5 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-colors" onClick={() => setShowUpload(true)}>
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
              <div className="divide-y-2 divide-emerald-800 p-2">
                {documents.length === 0 ? (
                  <div className="py-8 text-center font-bold text-emerald-500 uppercase tracking-widest text-xs">No documents found.</div>
                ) : documents.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-emerald-800 transition-colors">
                    <div>
                      <p className="font-bold text-emerald-50 mb-1">{doc.name}</p>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{format(new Date(doc.created_date), "MMM d, yyyy")} • {doc.category?.replace('_', ' ')}</p>
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

      {activeTab === 'academics' && (
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

      {activeTab === 'finance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-4 border-emerald-950 p-16 text-center">
          <CreditCard className="w-20 h-20 mx-auto mb-6 text-emerald-300" />
          <h3 className="text-3xl font-black text-emerald-950 uppercase tracking-tight mb-2">Fee Statements</h3>
          <p className="font-bold text-emerald-600 mb-8">No recent transactions or invoices found.</p>
          {balance > 0 && (
            <div className="mt-8 p-8 border-4 border-red-600 bg-red-50 max-w-md mx-auto">
              <p className="text-sm font-black text-red-800 uppercase tracking-widest mb-2">Outstanding Balance</p>
              <p className="text-5xl font-black text-red-600 mb-6">${balance.toLocaleString()}</p>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-4 border-4 border-red-900 transition-colors">Pay Now <ArrowRight className="inline w-5 h-5 ml-2"/></button>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'communications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-4 border-emerald-950 p-16 text-center">
          <Bell className="w-20 h-20 mx-auto mb-6 text-emerald-300" />
          <h3 className="text-3xl font-black text-emerald-950 uppercase tracking-tight mb-2">Announcements</h3>
          <p className="font-bold text-emerald-600 mb-8">You have no new messages from administration.</p>
          <button className="bg-emerald-950 hover:bg-emerald-800 text-emerald-50 font-black uppercase tracking-widest px-8 py-4 border-4 border-transparent transition-colors">Contact Office</button>
        </motion.div>
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
