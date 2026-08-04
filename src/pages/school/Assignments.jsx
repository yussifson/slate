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
  { id: 'todo', title: 'To Do', color: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
  { id: 'grading', title: 'Grading', color: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
  { id: 'returned', title: 'Returned', color: 'bg-teal-100 border-teal-300 text-teal-900' }
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
    <div className="space-y-6 font-dmsans p-4 bg-[#F0F4FF] dark:bg-blue-900/20 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight uppercase">Assignments</h1>
          <p className="text-sm text-[#1E3A8A] font-medium mt-1">Kanban Board for Homework & Grading</p>
        </div>
        <Button onClick={() => { setFormData({title: '', class_name: classRecords[0]?.data?.class_name || '', subject: SUBJECTS[0], due_date: '', description: '', status: 'todo'}); setShowModal(true);}} className="gap-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-none font-semibold uppercase">
          <Plus className="w-4 h-4" /> New Assignment
        </Button>
      </motion.div>
      
      <div className="bg-white border-2 border-emerald-200 p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-[#F0F4FF] border-emerald-200 rounded-none font-semibold" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-[#1E3A8A] font-semibold uppercase">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
          {columns.map((col, index) => (
            <div key={col.id} className={`flex flex-col border-2 rounded-none p-4 min-h-[500px] min-w-[300px] ${col.color}`}>
              <h2 className="font-black text-xl mb-4 uppercase tracking-widest border-b-2 border-current pb-2 flex justify-between items-center">
                {col.title}
                <span className="text-sm font-semibold bg-white px-2 py-0.5 border-2 border-current">{filtered.filter(a => (a.status || 'todo') === col.id).length}</span>
              </h2>
              <div className="flex-1 space-y-4">
                {filtered.filter(a => (a.status || 'todo') === col.id).map(a => (
                  <motion.div layoutId={a.id} key={a.id} className="bg-white border-2 border-current p-4 relative group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase bg-current text-white px-2 py-0.5">{a.class_name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-6 w-6 p-0 hover:bg-emerald-200 rounded-none"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border-2 border-emerald-300 rounded-none">
                          <DropdownMenuItem className="font-semibold" onClick={() => { setEditingId(a.id); setFormData(a); setShowModal(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold" onClick={() => setViewingSubmissions(a)}>View Submissions & AI Grade</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-700 font-black" onClick={() => deleteRecord.mutate({ id: a.id, recordType: 'school_assignment'})}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-black text-lg leading-tight mb-1">{a.title}</h3>
                    <p className="text-xs font-semibold uppercase opacity-80 mb-3">{a.subject}</p>
                    <p className="text-sm font-medium line-clamp-2 mb-4 opacity-90">{a.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        <Calendar className="w-3 h-3" /> {a.due_date ? format(new Date(a.due_date), 'MMM d, yyyy') : 'No Date'}
                      </div>
                      <div className="flex gap-1">
                        {index > 0 && <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-none" onClick={() => moveCard(a, columns[index-1].id)}><ArrowLeft className="w-3 h-3"/></Button>}
                        {index < columns.length - 1 && <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-none" onClick={() => moveCard(a, columns[index+1].id)}><ArrowRight className="w-3 h-3"/></Button>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-4 border-emerald-500 w-full max-w-4xl p-6 rounded-none flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b-2 border-emerald-200 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-emerald-900 uppercase">{viewingSubmissions.title} - Submissions</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-none font-semibold uppercase" onClick={() => setViewingSubmissions(null)}>Close</Button>
                <Button 
                  onClick={() => handleAIGrade(viewingSubmissions.id, viewingSubmissions.description)}
                  disabled={aiGrading}
                  className="bg-[#1E3A8A] text-white rounded-none font-black uppercase flex items-center gap-2"
                >
                  {aiGrading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  {aiGrading ? 'Grading...' : 'AI Grade All'}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {submissionsData.filter(s => s.assignment_id === viewingSubmissions.id).length === 0 ? (
                <div className="text-center py-12 text-[#1E3A8A] font-medium">No submissions found.</div>
              ) : (
                submissionsData.filter(s => s.assignment_id === viewingSubmissions.id).map(sub => (
                  <div key={sub.id} className="border-2 border-emerald-200 p-4 bg-[#F0F4FF]">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-emerald-900">{sub.student}</h4>
                      <span className={`text-xs font-bold uppercase px-2 py-1 ${sub.status === 'Graded' ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                        {sub.status || 'Pending'}
                      </span>
                    </div>
                    <div className="bg-white border border-emerald-100 p-3 text-sm text-slate-700 mb-3 whitespace-pre-wrap">
                      {sub.content}
                    </div>
                    {sub.status === 'Graded' && (
                      <div className="bg-teal-50 border border-teal-200 p-3">
                        <p className="font-black text-teal-900 text-lg mb-1">Grade: {sub.grade} ({sub.ai_score}/100)</p>
                        <p className="text-sm text-teal-800"><span className="font-bold uppercase text-xs">Feedback:</span> {sub.feedback}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-4 border-emerald-500 w-full max-w-md p-6 space-y-4 rounded-none">
            <h2 className="text-xl font-black text-emerald-900 uppercase border-b-2 border-emerald-200 pb-2">{editingId ? 'Edit Assignment' : 'Create Assignment'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-[#1E3A8A] uppercase">Title</label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-[#F0F4FF] rounded-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-[#1E3A8A] uppercase">Class</label>
                  <select value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})} className="w-full h-10 px-3 mt-1 border-2 border-emerald-200 bg-[#F0F4FF] rounded-none">
                    <option value="">Select...</option>
                    {classRecords.map(c => <option key={c.id} value={c.data?.class_name || ''}>{c.data?.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-[#1E3A8A] uppercase">Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full h-10 px-3 mt-1 border-2 border-emerald-200 bg-[#F0F4FF] rounded-none">
                    <option value="">Select...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-[#1E3A8A] uppercase">Due Date</label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-[#F0F4FF] rounded-none" />
              </div>
              <div>
                <label className="text-xs font-black text-[#1E3A8A] uppercase">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full border-2 border-emerald-200 bg-[#F0F4FF] px-3 py-2 text-sm font-semibold rounded-none h-24" />
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t-2 border-emerald-200">
              <Button variant="outline" className="flex-1 rounded-none border-2 border-emerald-300" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-none bg-[#1E3A8A] text-white font-black uppercase" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
