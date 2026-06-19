import { useTranslation } from "react-i18next";
import { generateText } from '@/lib/cloudflareAI';
import { BrainCircuit, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { BookOpen, Search, Plus, Calendar, MoreVertical, FileText, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { motion } from 'framer-motion';

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
  { id: 'grading', title: 'Grading', color: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
  { id: 'returned', title: 'Returned', color: 'bg-teal-100 border-teal-300 text-teal-900' }
];

export default function Assignments() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [aiGrading, setAiGrading] = useState(false);

  const { data: submissionsData = [] } = useQuery({
    queryKey: ['univ_school_assignment_submissions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute('SELECT * FROM univ_school_assignment_submissions WHERE company_id = ?', [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const updateSubmission = useMutation({
    mutationFn: async ({ id, grade, feedback, aiScore }) => {
      await powerSync.execute(
        'UPDATE univ_school_assignment_submissions SET grade = ?, feedback = ?, ai_score = ?, status = ? WHERE id = ?',
        [grade, feedback, aiScore, 'Graded', id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_school_assignment_submissions']);
    }
  });

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
        const result = JSON.parse(cleanText);
        
        await updateSubmission.mutateAsync({
          id: sub.id,
          grade: result.grade,
          feedback: result.feedback,
          aiScore: result.score
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


  const { data: records = [], isLoading } = useIndustryRecords('assignment');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    title: '', class: 'Grade 10', subject: '', dueDate: '', description: '', status: 'todo'
  });

  const assignments = records.map(r => ({
    id: r.id,
    column: r.data?.status || 'todo',
    ...r.data
  }));

  const filtered = assignments.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) || 
    a.class?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.title || !formData.subject) return toast.error("Title and subject required");
    
    const payload = {
      title: formData.title, class: formData.class, subject: formData.subject, dueDate: formData.dueDate, description: formData.description, status: formData.status || 'todo', dateCreated: new Date().toISOString()
    };

    if (editingId) {
      mutateRecord.mutate({ id: editingId, recordType: 'assignment', payload, status: 'active', searchText: `${formData.title} ${formData.class}` }, { onSuccess: () => { toast.success("Updated"); setShowModal(false); setEditingId(null); } });
    } else {
      mutateRecord.mutate({ recordType: 'assignment', payload, status: 'active', searchText: `${formData.title} ${formData.class}` }, { onSuccess: () => { toast.success("Created"); setShowModal(false); } });
    }
  };

  const moveCard = (assignment, newCol) => {
    const payload = { ...assignment, status: newCol };
    delete payload.id; delete payload.column;
    mutateRecord.mutate({ id: assignment.id, recordType: 'assignment', payload, status: 'active', searchText: `${assignment.title} ${assignment.class}` });
  };

  return (
    <div className="space-y-6 font-dmsans p-4 bg-emerald-50 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight uppercase tracking-[-0.02em] tracking-[0.04em]">{t("assignments", "Assignments")}</h1>
          <p className="text-sm text-emerald-700 font-medium mt-1">{t("manage_class_assignments", "Kanban Board for Homework & Grading")}</p>
        </div>
        <Button onClick={() => { setFormData({title: '', class: 'Grade 10', subject: '', dueDate: '', description: '', status: 'todo'}); setShowModal(true);}} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none border-2 border-emerald-800 rounded-none font-semibold uppercase tracking-[0.04em]">
          <Plus className="w-4 h-4" /> {t("create_assignment", "New")}
        </Button>
      </motion.div>
      
      <div className="bg-white border-2 border-emerald-200 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-emerald-50 border-emerald-200 rounded-none focus-visible:ring-emerald-500 font-semibold" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-emerald-600 font-semibold uppercase tracking-[0.04em]">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(col => (
            <div key={col.id} className={`flex flex-col border-2 rounded-none p-4 min-h-[500px] ${col.color}`}>
              <h2 className="font-black text-xl mb-4 uppercase tracking-widest border-b-2 border-current pb-2 flex justify-between items-center tracking-[0.04em]">
                {col.title}
                <span className="text-sm font-semibold bg-white px-2 py-0.5 border-2 border-current hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{filtered.filter(a => a.column === col.id).length}</span>
              </h2>
              <div className="flex-1 space-y-4">
                {filtered.filter(a => a.column === col.id).map(a => (
                  <motion.div layoutId={a.id} key={a.id} className="bg-white border-2 border-current p-4 hover:bg-emerald-50 transition-colors relative group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-current text-white px-2 py-0.5 tracking-[0.04em]">{a.class}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-6 w-6 p-0 hover:bg-emerald-200 rounded-none"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border-2 border-emerald-300 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                          <DropdownMenuItem className="font-semibold text-emerald-800 rounded-none" onClick={() => { setEditingId(a.id); setFormData(a); setShowModal(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold text-emerald-800 rounded-none bg-emerald-50" onClick={() => setViewingSubmissions(a)}>View Submissions & AI Grade</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold text-emerald-800 rounded-none" onClick={() => moveCard(a, 'todo')}>Move to To Do</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold text-emerald-800 rounded-none" onClick={() => moveCard(a, 'grading')}>Move to Grading</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold text-emerald-800 rounded-none" onClick={() => moveCard(a, 'returned')}>Move to Returned</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-700 font-black rounded-none" onClick={() => deleteRecord.mutate({ id: a.id, recordType: 'assignment'})}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-black text-lg leading-tight mb-1">{a.title}</h3>
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-3 tracking-[0.04em]">{a.subject}</p>
                    <p className="text-sm font-medium line-clamp-2 mb-4 opacity-90">{a.description}</p>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider border-t-2 border-current/20 pt-3 tracking-[0.04em]">
                      <Calendar className="w-4 h-4" /> Due: {a.dueDate ? format(new Date(a.dueDate), 'MMM d, yyyy') : 'No Date'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white border-4 border-emerald-500 w-full max-w-4xl p-6 rounded-none shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-emerald-200 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-emerald-900 uppercase tracking-wider">{viewingSubmissions.title} - Submissions</h2>
                <p className="text-sm text-emerald-600 font-medium">Auto-grade all pending submissions using AI.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-none font-semibold uppercase" onClick={() => setViewingSubmissions(null)}>Close</Button>
                <Button 
                  onClick={() => handleAIGrade(viewingSubmissions.id, viewingSubmissions.description)}
                  disabled={aiGrading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none font-black uppercase flex items-center gap-2"
                >
                  {aiGrading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  {aiGrading ? 'Grading...' : 'AI Auto-Grade All'}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {submissionsData.filter(s => s.assignment_id === viewingSubmissions.id).length === 0 ? (
                <div className="text-center py-12 text-emerald-600/50 font-medium">No submissions yet.</div>
              ) : (
                submissionsData.filter(s => s.assignment_id === viewingSubmissions.id).map(sub => (
                  <div key={sub.id} className="border-2 border-emerald-200 p-4 bg-emerald-50">
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
                        <p className="text-sm text-teal-800"><span className="font-bold uppercase tracking-wider text-xs">AI Feedback:</span> {sub.feedback}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white border-4 border-emerald-500 w-full max-w-md p-6 space-y-4 rounded-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-wider border-b-2 border-emerald-200 pb-2 tracking-[0.04em]">{editingId ? 'Edit Assignment' : 'Create Assignment'}</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-black text-emerald-700 uppercase tracking-widest tracking-[0.04em]">Title</label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-semibold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-black text-emerald-700 uppercase tracking-widest tracking-[0.04em]">Class</label><Input value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-semibold" /></div>
                <div><label className="text-xs font-black text-emerald-700 uppercase tracking-widest tracking-[0.04em]">Subject</label><Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-semibold" /></div>
              </div>
              <div><label className="text-xs font-black text-emerald-700 uppercase tracking-widest tracking-[0.04em]">Due Date</label><Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-semibold" /></div>
              <div>
                <label className="text-xs font-black text-emerald-700 uppercase tracking-widest tracking-[0.04em]">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 rounded-none focus:outline-none resize-none h-24" />
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t-2 border-emerald-200">
              <Button variant="outline" className="flex-1 rounded-none border-2 border-emerald-300 font-semibold text-emerald-800 hover:bg-emerald-50 uppercase tracking-[0.04em]" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase border-2 border-emerald-800 tracking-[0.04em]" onClick={handleSave}>Save</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
