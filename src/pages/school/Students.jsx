import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, GraduationCap, Phone, Mail, Filter, CheckCircle, XCircle, Clock, UserCheck, AlertCircle, MapPin, HeartPulse, FileText, BrainCircuit, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { generateText } from '@/lib/cloudflareAI';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registerSchoolUser } from "@/api/authUtils";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { motion, AnimatePresence } from 'framer-motion';

const feeColors = { Paid: 'bg-green-100 text-green-800 border-green-200', Owing: 'bg-red-100 text-red-800 border-red-200', Partial: 'bg-amber-100 text-amber-800 border-amber-200' };
const statusColors = { Active: 'bg-green-100 text-green-800 border-green-200', Suspended: 'bg-red-100 text-red-800 border-red-200', Graduated: 'bg-blue-100 text-blue-800 border-blue-200' };

export default function Students() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileTab, setProfileTab] = useState('academics');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const handleGenerateAIProfile = async () => {
    if (!selectedStudent) return;
    setAiGenerating(true);
    try {
        // Fetch historical data
        const gradesRes = await powerSync.execute('SELECT * FROM univ_school_grades WHERE company_id = ? AND student = ?', [companyId, selectedStudent.name]);
        const attendanceRes = await powerSync.execute('SELECT * FROM univ_school_attendance WHERE company_id = ? AND student = ?', [companyId, selectedStudent.name]);
        const disciplineRes = await powerSync.execute('SELECT * FROM univ_school_discipline WHERE company_id = ? AND student = ?', [companyId, selectedStudent.name]);

        const grades = gradesRes.rows._array || [];
        const attendance = attendanceRes.rows._array || [];
        const discipline = disciplineRes.rows._array || [];

        const prompt = `You are an AI Academic Analyst for a school. 
        Analyze the following student data and provide a JSON response predicting their academic trajectory and dropout risk.
        Student: ${selectedStudent.name} (Class: ${selectedStudent.class})
        Grades: ${JSON.stringify(grades)}
        Attendance: ${JSON.stringify(attendance)}
        Disciplinary Actions: ${JSON.stringify(discipline)}

        Provide ONLY a JSON object with this exact structure:
        {
            "riskLevel": "Low" | "Medium" | "High",
            "trajectory": "Improving" | "Stable" | "Declining",
            "summary": "2-3 sentence overview of their current status",
            "keyFactors": ["factor 1", "factor 2"],
            "recommendedInterventions": ["action 1", "action 2"]
        }`;

        const rawText = await generateText(prompt);
        // Clean markdown backticks if any
        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        setAiAnalysis(parsed);
    } catch (e) {
        console.error("AI Analysis Failed", e);
        toast.error("Failed to generate AI Risk Profile.");
    } finally {
        setAiGenerating(false);
    }
  };


  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["clients", companyId, "student"], 
    queryFn: () => powerSync.execute('SELECT * FROM school_students WHERE company_id = ?', [companyId]).then(r => r.rows._array), 
    enabled: !!companyId 
  });

  const students = records.map(r => {
    return {
      id: r.id,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown',
      studentId: r.student_id_number,
      phone: '',
      email: '',
      status: r.status || 'Active',
      class: r.grade_level || 'Unknown',
      age: 0,
      gender: 'Unknown',
      parent: '',
      parentPhone: '',
      parentEmail: '',
      address: '',
      medicalNotes: 'No known allergies or medical conditions.',
      previousSchool: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      feeStatus: 'Paid',
      avatar: (r.first_name || 'U').substring(0, 2).toUpperCase(),
      gpa: r.gpa || 0.0
    };
  });

  const classes = ['All', 'Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'];

  const filtered = students.filter(s =>
    (statusFilter === 'All' || s.status === statusFilter) &&
    (filterClass === 'All' || s.class === filterClass) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.includes(search))
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 font-dmsans">
      {/* Left Pane: Directory */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-1/3 flex flex-col bg-green-50 border-2 border-green-200 rounded-none overflow-hidden"
      >
        <div className="p-5 border-b-2 border-green-200 bg-green-500/10 text-white">
          <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" /> Student Directory
          </h2>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-700" />
              <input 
                placeholder="Search students..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 bg-white text-green-900 placeholder:text-green-700 border-2 border-transparent focus:border-green-300 focus:outline-none rounded-none text-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="flex-1 bg-white border-2 border-transparent focus:border-green-300 rounded-none px-2 py-1.5 text-xs text-green-900 font-semibold focus:outline-none tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 bg-white border-2 border-transparent focus:border-green-300 rounded-none px-2 py-1.5 text-xs text-green-900 font-semibold focus:outline-none tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white custom-scrollbar hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {isLoading ? (
            <div className="text-center py-10 text-green-600 font-medium animate-pulse">Loading directory...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-green-600/50">No students found.</div>
          ) : (
            filtered.map(student => (
              <button
                key={student.id}
                onClick={() => { setSelectedStudent(student); setAiAnalysis(null); }}
                className={`w-full text-left p-3 border-2 transition-colors flex items-center gap-3 ${
                  selectedStudent?.id === student.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-green-100 hover:border-green-300 bg-white'
                }`}
              >
                <div className="w-10 h-10 bg-green-200 text-green-800 font-semibold flex items-center justify-center shrink-0">
                  {student.avatar}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-green-900 truncate">{student.name}</p>
                  <p className="text-xs text-green-600 truncate font-mono tracking-[0.04em]">{student.studentId} • {student.class}</p>
                </div>
                <div className={`w-3 h-3 shrink-0 rounded-full border-2 border-white ${student.status === 'Active' ? 'bg-green-500/10' : student.status === 'Graduated' ? 'bg-blue-500/10' : 'bg-red-500/10'}`} />
              </button>
            ))
          )}
        </div>
      </motion.div>

      {/* Right Pane: Student Profile */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col bg-white border-2 border-green-200 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
      >
        {selectedStudent ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b-2 border-green-200 bg-green-50/50 flex items-start gap-6">
              <div className="w-24 h-24 bg-green-200 text-green-800 text-3xl font-semibold flex items-center justify-center border-4 border-white tracking-[-0.02em]">
                {selectedStudent.avatar}
              </div>
              <div className="flex-1 pt-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-extrabold text-green-900 tracking-tight tracking-[-0.02em]">{selectedStudent.name}</h1>
                    <p className="text-green-700 font-mono mt-1">{selectedStudent.studentId}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 border-2 text-xs font-semibold uppercase tracking-wider ${statusColors[selectedStudent.status] || statusColors.Active}`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mt-4 text-sm font-semibold text-green-800">
                  <span className="flex items-center gap-2.5"><GraduationCap className="w-4 h-4 text-green-500" /> {selectedStudent.class}</span>
                  <span className="flex items-center gap-2.5"><UserCheck className="w-4 h-4 text-green-500" /> {selectedStudent.gender}, {selectedStudent.age} yrs</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b-2 border-green-200 bg-white px-6 gap-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              {[
                { id: 'academics', label: 'Academics', icon: FileText },
                { id: 'intelligence', label: 'AI Intelligence', icon: BrainCircuit },
                { id: 'medical', label: 'Medical & Health', icon: HeartPulse },
                { id: 'contact', label: 'Contact Details', icon: MapPin },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProfileTab(tab.id)}
                  className={`py-4 px-2 font-semibold text-sm flex items-center gap-2 border-b-4 transition-colors ${
                    profileTab === tab.id 
                      ? 'border-green-500 text-green-900' 
                      : 'border-transparent text-green-600 hover:text-green-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <AnimatePresence mode="wait">
                {profileTab === 'intelligence' && (
                  <motion.div key="intelligence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white border-2 border-emerald-800">
                      <div>
                        <h3 className="text-xl font-black flex items-center gap-2 mb-1 tracking-[-0.02em]"><BrainCircuit className="w-6 h-6" /> AI Predictive Risk Profile</h3>
                        <p className="text-emerald-100 text-sm font-medium">Aggregates grades, attendance, and discipline to predict academic trajectory.</p>
                      </div>
                      <button 
                        onClick={handleGenerateAIProfile} 
                        disabled={aiGenerating}
                        className="bg-white text-emerald-900 px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-2 border-transparent hover:border-emerald-900 transition-colors tracking-[0.04em]"
                      >
                        {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        {aiGenerating ? 'Analyzing...' : 'Generate Profile'}
                      </button>
                    </div>

                    {aiAnalysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-6">
                          <div className={`p-6 border-2 flex items-center justify-between ${
                            aiAnalysis.riskLevel === 'High' ? 'bg-red-50 border-red-200' : 
                            aiAnalysis.riskLevel === 'Medium' ? 'bg-amber-50 border-amber-200' : 
                            'bg-green-50 border-green-200'
                          }`}>
                            <div>
                              <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                                aiAnalysis.riskLevel === 'High' ? 'text-red-700' : 
                                aiAnalysis.riskLevel === 'Medium' ? 'text-amber-700' : 
                                'text-green-700'
                              }`}>Dropout Risk Level</p>
                              <p className={`text-3xl font-black ${
                                aiAnalysis.riskLevel === 'High' ? 'text-red-900' : 
                                aiAnalysis.riskLevel === 'Medium' ? 'text-amber-900' : 
                                'text-green-900'
                              }`}>{aiAnalysis.riskLevel}</p>
                            </div>
                            <AlertCircle className={`w-12 h-12 opacity-50 ${
                                aiAnalysis.riskLevel === 'High' ? 'text-red-500' : 
                                aiAnalysis.riskLevel === 'Medium' ? 'text-amber-500' : 
                                'text-green-500'
                              }`} />
                          </div>

                          <div className={`p-6 border-2 flex items-center justify-between ${
                            aiAnalysis.trajectory === 'Declining' ? 'bg-red-50 border-red-200' : 
                            aiAnalysis.trajectory === 'Improving' ? 'bg-green-50 border-green-200' : 
                            'bg-blue-50 border-blue-200'
                          }`}>
                            <div>
                              <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                                aiAnalysis.trajectory === 'Declining' ? 'text-red-700' : 
                                aiAnalysis.trajectory === 'Improving' ? 'text-green-700' : 
                                'text-blue-700'
                              }`}>Academic Trajectory</p>
                              <p className={`text-3xl font-black ${
                                aiAnalysis.trajectory === 'Declining' ? 'text-red-900' : 
                                aiAnalysis.trajectory === 'Improving' ? 'text-green-900' : 
                                'text-blue-900'
                              }`}>{aiAnalysis.trajectory}</p>
                            </div>
                            {aiAnalysis.trajectory === 'Declining' ? <TrendingDown className="w-12 h-12 opacity-50 text-red-500" /> : <TrendingUp className={`w-12 h-12 opacity-50 ${aiAnalysis.trajectory === 'Improving' ? 'text-green-500' : 'text-blue-500'}`} />}
                          </div>
                        </div>

                        <div className="space-y-6">
                           <div className="p-5 border-2 border-slate-200 bg-slate-50">
                             <h4 className="font-black text-slate-900 uppercase tracking-wider text-sm mb-2 border-b-2 border-slate-200 pb-2">AI Summary</h4>
                             <p className="text-sm text-slate-700 font-medium leading-relaxed">{aiAnalysis.summary}</p>
                           </div>

                           <div className="p-5 border-2 border-amber-200 bg-amber-50">
                             <h4 className="font-black text-amber-900 uppercase tracking-wider text-sm mb-3 border-b-2 border-amber-200 pb-2">Key Risk Factors</h4>
                             <ul className="space-y-2">
                               {aiAnalysis.keyFactors.map((f, i) => (
                                 <li key={i} className="flex gap-2 text-sm text-amber-800 font-medium">
                                   <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> {f}
                                 </li>
                               ))}
                             </ul>
                           </div>
                           
                           <div className="p-5 border-2 border-emerald-200 bg-emerald-50">
                             <h4 className="font-black text-emerald-900 uppercase tracking-wider text-sm mb-3 border-b-2 border-emerald-200 pb-2">Recommended Interventions</h4>
                             <ul className="space-y-2">
                               {aiAnalysis.recommendedInterventions.map((f, i) => (
                                 <li key={i} className="flex gap-2 text-sm text-emerald-800 font-medium">
                                   <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {f}
                                 </li>
                               ))}
                             </ul>
                           </div>
                        </div>
                      </div>
                    )}
                    {!aiAnalysis && !aiGenerating && (
                       <div className="text-center py-12 border-2 border-dashed border-slate-200">
                         <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                         <p className="text-slate-500 font-semibold">Click Generate Profile to run the AI Risk Analysis.</p>
                       </div>
                    )}
                  </motion.div>
                )}

                {profileTab === 'academics' && (
                  <motion.div key="academics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border-2 border-green-100 bg-green-50">
                        <p className="text-xs font-semibold text-green-600 uppercase mb-1 tracking-[0.04em]">Current Class</p>
                        <p className="text-lg font-semibold text-green-900">{selectedStudent.class}</p>
                      </div>
                      <div className="p-4 border-2 border-green-100 bg-green-50">
                        <p className="text-xs font-semibold text-green-600 uppercase mb-1 tracking-[0.04em]">Fee Status</p>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold uppercase border-2 ${feeColors[selectedStudent.feeStatus] || feeColors.Owing}`}>
                          {selectedStudent.feeStatus}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border-2 border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3 uppercase tracking-wide text-sm border-b-2 border-green-100 pb-2 tracking-[0.04em]">Academic History</h3>
                      <p className="text-sm font-medium text-green-800"><span className="text-green-600">Previous School:</span> {selectedStudent.previousSchool || 'None recorded'}</p>
                    </div>
                  </motion.div>
                )}

                {profileTab === 'medical' && (
                  <motion.div key="medical" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="p-5 border-2 border-red-200 bg-red-50">
                      <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-3">
                        <HeartPulse className="w-5 h-5 text-red-500" /> Medical Notes & Allergies
                      </h3>
                      <p className="text-sm font-medium text-red-800 whitespace-pre-wrap">
                        {selectedStudent.medicalNotes || 'No specific medical notes provided.'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {profileTab === 'contact' && (
                  <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 border-2 border-green-200">
                        <h3 className="font-semibold text-green-900 mb-4 uppercase tracking-wide text-sm flex items-center gap-2 border-b-2 border-green-100 pb-2 tracking-[0.04em]">
                          <Users className="w-4 h-4 text-green-500" /> Guardian Info
                        </h3>
                        <div className="space-y-3 text-sm font-medium text-green-800">
                          <p><span className="text-green-600 block text-xs uppercase mb-0.5 tracking-[0.04em]">Name</span> {selectedStudent.parent || '—'}</p>
                          <p><span className="text-green-600 block text-xs uppercase mb-0.5 tracking-[0.04em]">Phone</span> {selectedStudent.parentPhone || '—'}</p>
                          <p><span className="text-green-600 block text-xs uppercase mb-0.5 tracking-[0.04em]">Email</span> {selectedStudent.parentEmail || '—'}</p>
                        </div>
                      </div>

                      <div className="p-4 border-2 border-amber-200 bg-amber-50">
                        <h3 className="font-semibold text-amber-900 mb-4 uppercase tracking-wide text-sm flex items-center gap-2 border-b-2 border-amber-200/50 pb-2 tracking-[0.04em]">
                          <AlertCircle className="w-4 h-4 text-amber-500" /> Emergency Contact
                        </h3>
                        <div className="space-y-3 text-sm font-medium text-amber-900">
                          <p><span className="text-amber-700/70 block text-xs uppercase mb-0.5 tracking-[0.04em]">Name</span> {selectedStudent.emergencyContactName || '—'}</p>
                          <p><span className="text-amber-700/70 block text-xs uppercase mb-0.5 tracking-[0.04em]">Phone</span> {selectedStudent.emergencyContactPhone || '—'}</p>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 p-4 border-2 border-green-200">
                        <h3 className="font-semibold text-green-900 mb-3 uppercase tracking-wide text-sm flex items-center gap-2 border-b-2 border-green-100 pb-2 tracking-[0.04em]">
                          <MapPin className="w-4 h-4 text-green-500" /> Home Address
                        </h3>
                        <p className="text-sm font-medium text-green-800">
                          {selectedStudent.address || 'No address on file.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-green-300 p-8 text-center">
            <Users className="w-20 h-20 mb-4 opacity-50" />
            <h3 className="text-2xl font-semibold text-green-800 mb-2 tracking-[-0.02em]">No Student Selected</h3>
            <p className="text-green-600 font-medium">Select a student from the directory to view their rich profile.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
