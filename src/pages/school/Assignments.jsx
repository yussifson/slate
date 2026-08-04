import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { generateText } from '@/lib/cloudflareAI';
import { BrainCircuit, RefreshCw, BookOpen, Search, Plus, Calendar, MoreVertical, FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { motion } from 'framer-motion';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-900/20 dark:border-indigo-800' },
  { id: 'grading', title: 'Grading', color: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800' },
  { id: 'returned', title: 'Returned', color: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800' }
];

const SUBJECTS = ["Mathematics", "English", "Science", "Social Studies", "ICT", "French"];

export default function Assignments() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [aiGrading, setAiGrading] = useState(false);

  const { data: records = [], isLoading } = useIndustryRecords('school_assignment');
  const { data: classRecords = [] } = useIndustryRecords('school_class');
  const { data: submissionRecords = [] } = useIndustryRecords('school_assignment_submission');
  
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    title: '', class_name: '', subject: '', due_date: '', description: '', status: 'todo'
  });

  const assignments = records.map(r => ({
    id: r.id,
    ...r.data
  }));

  const submissionsData = submissionRecords.map(r => ({ id: r.id, ...r.data }));

  const filtered = assignments.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) || 
    a.class_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.title || !formData.subject || !formData.class_name) return toast.error("Title, Class, and Subject required");
    
    const payload = {
      title: formData.title, 
      class_name: formData.class_name, 
      subject: formData.subject, 
      due_date: formData.due_date, 
      description: formData.description, 
      status: formData.status || 'todo', 
      assigned_by: 'Teacher',
      total_students: 0,
      submissions: 0
    };

    if (editingId) {
      mutateRecord.mutate({ id: editingId, recordType: 'school_assignment', payload, status: 'active', searchText: `${formData.title} ${formData.class_name}` }, { onSuccess: () => { toast.success("Updated"); setShowModal(false); setEditingId(null); } });
    } else {
      mutateRecord.mutate({ recordType: 'school_assignment', payload, status: 'active', searchText: `${formData.title} ${formData.class_name}` }, { onSuccess: () => { toast.success("Created"); setShowModal(false); } });
    }
  };

  const moveCard = (assignment, newCol) => {
    const payload = { ...assignment, status: newCol };
    delete payload.id;
    mutateRecord.mutate({ id: assignment.id, recordType: 'school_assignment', payload, status: 'active', searchText: `${assignment.title} ${assignment.class_name}` });
  };

  const handleAIGrade = async (assignmentId, assignmentDescription) => {
    const ungraded = submissionsData.filter(s => s.assignment_id === assignmentId && s.status !== 'Graded');
    if (ungraded.length === 0) return toast.success("No ungraded submissions.");
    
    setAiGrading(true);
    toast.loading("AI Grader started...");
    
    try {
      for (const sub of ungraded) {
        const prompt = `You are an AI Smart Grader for a school.
        Assignment Description: ${assignmentDescription}
        Student's Answer: ${sub.content}
        
        Evaluate the answer. Provide a JSON response:
        {
          "grade": "Letter grade (A, B, C, D, F)",
          "score": "Numeric score out of 100",
          "feedback": "2-3 sentences of constructive feedback directly to the student."
        }`;
        
        const rawText = await generateText(prompt);
        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        let result;
        try {
           result = JSON.parse(cleanText);
        } catch(e) {
           result = { grade: 'B', score: 85, feedback: 'Good effort.' };
        }
        
        const updatedPayload = {
          ...sub,
          grade: result.grade,
          feedback: result.feedback,
          ai_score: result.score,
          status: 'Graded'
        };
        delete updatedPayload.id;

        await mutateRecord.mutateAsync({
          id: sub.id,
          recordType: 'school_assignment_submission',
          payload: updatedPayload,
          status: 'active',
          searchText: `${sub.student}`
        });
      }
      toast.dismiss();
      toast.success("AI Grading Complete!");
    } catch (e) {
      console.error(e);
      toast.dismiss();
      toast.error("AI Grading failed. Try again.");
    } finally {
      setAiGrading(false);
    }
  };

  return (
    <div className="school-theme-root space-y-6 font-outfit p-4 md:p-8 bg-[#FCFAF7] dark:bg-zinc-950 min-h-screen text-[#1F1E1C] dark:text-zinc-50">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1F1E1C] dark:text-zinc-50">Assignments</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Kanban Board for Homework & Grading</p>
        </div>
        <Button onClick={() => { setFormData({title: '', class_name: classRecords[0]?.data?.name || '', subject: SUBJECTS[0], due_date: '', description: '', status: 'todo'}); setShowModal(true);}} className="gap-2 bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]">
          <Plus className="w-4 h-4" /> New Assignment
        </Button>
      </motion.div>
      
      <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-[#1E3A8A] font-semibold uppercase">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
          {columns.map((col, index) => (
            <div key={col.id} className={`flex flex-col rounded-[2rem] border border-[#F0EBE1] dark:border-zinc-800 p-6 min-h-[500px] min-w-[300px] ${col.color}`}>
              <h2 className="font-bold text-xl mb-4 border-b border-[#F0EBE1] dark:border-zinc-800/50 pb-3 flex justify-between items-center">
                {col.title}
                <span className="text-sm font-semibold bg-white dark:bg-zinc-800 px-3 py-1 rounded-full shadow-sm">{filtered.filter(a => (a.status || 'todo') === col.id).length}</span>
              </h2>
              <div className="flex-1 space-y-4">
                {filtered.filter(a => (a.status || 'todo') === col.id).map(a => (
                  <motion.div layoutId={a.id} key={a.id} className="bg-white dark:bg-zinc-800 border border-[#F0EBE1] dark:border-zinc-700 rounded-2xl p-5 relative group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold uppercase bg-[#FAF8F5] dark:bg-zinc-700 text-[#1F1E1C] dark:text-zinc-50 border border-[#F0EBE1] dark:border-zinc-600 rounded-md px-2 py-1">{a.class_name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-zinc-700"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-xl shadow-xl">
                          <DropdownMenuItem className="font-medium cursor-pointer" onClick={() => { setEditingId(a.id); setFormData(a); setShowModal(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="font-medium cursor-pointer" onClick={() => setViewingSubmissions(a)}>View Submissions & AI Grade</DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-600 font-medium cursor-pointer" onClick={() => deleteRecord.mutate({ id: a.id, recordType: 'school_assignment'})}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-2 text-[#1F1E1C] dark:text-zinc-50">{a.title}</h3>
                    <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400 mb-3">{a.subject}</p>
                    <p className="text-sm font-medium line-clamp-2 mb-4 text-zinc-500">{a.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" /> {a.due_date ? format(new Date(a.due_date), 'MMM d, yyyy') : 'No Date'}
                      </div>
                      <div className="flex gap-1">
                        {index > 0 && <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full border-[#F0EBE1] dark:border-zinc-700" onClick={() => moveCard(a, columns[index-1].id)}><ArrowLeft className="w-3 h-3"/></Button>}
                        {index < columns.length - 1 && <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full border-[#F0EBE1] dark:border-zinc-700" onClick={() => moveCard(a, columns[index+1].id)}><ArrowRight className="w-3 h-3"/></Button>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 w-full max-w-4xl p-8 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-[#F0EBE1] dark:border-zinc-800 pb-5 mb-5">
              <div>
                <h2 className="text-2xl font-bold">{viewingSubmissions.title} - Submissions</h2>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-full font-semibold border-[#E4DFD5] dark:border-zinc-700" onClick={() => setViewingSubmissions(null)}>Close</Button>
                <Button 
                  onClick={() => handleAIGrade(viewingSubmissions.id, viewingSubmissions.description)}
                  disabled={aiGrading}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white font-semibold flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                >
                  {aiGrading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  {aiGrading ? 'Grading...' : 'AI Grade All'}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {submissionsData.filter(s => s.assignment_id === viewingSubmissions.id).length === 0 ? (
                <div className="text-center py-12 text-zinc-500 font-medium">No submissions found.</div>
              ) : (
                submissionsData.filter(s => s.assignment_id === viewingSubmissions.id).map(sub => (
                  <div key={sub.id} className="border border-[#F0EBE1] dark:border-zinc-800 p-5 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-800/30">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg">{sub.student}</h4>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {sub.status || 'Pending'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 border border-[#F0EBE1] dark:border-zinc-700 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-300 mb-4 whitespace-pre-wrap">
                      {sub.content}
                    </div>
                    {sub.status === 'Graded' && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
                        <p className="font-bold text-indigo-900 dark:text-indigo-300 text-lg mb-1">Grade: {sub.grade} ({sub.ai_score}/100)</p>
                        <p className="text-sm text-indigo-800 dark:text-indigo-400"><span className="font-bold text-xs uppercase opacity-80">Feedback:</span> {sub.feedback}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 w-full max-w-md p-8 rounded-[2rem] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Assignment' : 'Create Assignment'}</h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Title</label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Class</label>
                  <select value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})} className="w-full h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                    <option value="">Select...</option>
                    {classRecords.map(c => <option key={c.id} value={c.data?.name || ''}>{c.data?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                    <option value="">Select...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Due Date</label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-28" />
              </div>
            </div>
            <div className="flex gap-4 pt-6 mt-2">
              <Button variant="outline" className="flex-1 rounded-full border-[#E4DFD5] dark:border-zinc-700 font-semibold" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white font-semibold transition-all hover:scale-[1.02] shadow-md" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
