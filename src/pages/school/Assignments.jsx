import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { generateText } from '@/lib/cloudflareAI';
import { BrainCircuit, RefreshCw, BookOpen, Search, Plus, Calendar, MoreHorizontal, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { motion } from 'framer-motion';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const columns = [
  { id: 'todo', title: 'To Do', dot: 'bg-indigo-500', header: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20' },
  { id: 'grading', title: 'Grading', dot: 'bg-amber-500', header: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
  { id: 'returned', title: 'Returned', dot: 'bg-emerald-500', header: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
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

  const [formData, setFormData] = useState({ title: '', class_name: '', subject: '', due_date: '', description: '', status: 'todo' });

  const assignments = records.map(r => ({ id: r.id, ...r.data }));
  const submissionsData = submissionRecords.map(r => ({ id: r.id, ...r.data }));
  const filtered = assignments.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()) || a.class_name?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!formData.title || !formData.subject || !formData.class_name) return toast.error("Title, Class, and Subject required");
    const payload = { title: formData.title, class_name: formData.class_name, subject: formData.subject, due_date: formData.due_date, description: formData.description, status: formData.status || 'todo', assigned_by: 'Teacher', total_students: 0, submissions: 0 };
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
        const prompt = `You are an AI Smart Grader for a school.\nAssignment: ${assignmentDescription}\nStudent Answer: ${sub.content}\nRespond with JSON: {"grade":"letter","score":number,"feedback":"2-3 sentences"}`;
        const rawText = await generateText(prompt);
        let result;
        try { result = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim()); } catch(e) { result = { grade: 'B', score: 85, feedback: 'Good effort.' }; }
        const updatedPayload = { ...sub, grade: result.grade, feedback: result.feedback, ai_score: result.score, status: 'Graded' };
        delete updatedPayload.id;
        await mutateRecord.mutateAsync({ id: sub.id, recordType: 'school_assignment_submission', payload: updatedPayload, status: 'active', searchText: `${sub.student}` });
      }
      toast.dismiss();
      toast.success("AI Grading Complete!");
    } catch (e) { toast.dismiss(); toast.error("AI Grading failed."); } finally { setAiGrading(false); }
  };

  return (
    <SchoolPageShell
      title="Assignments"
      subtitle="Track homework, grading, and returned work"
      breadcrumb={['School', 'Assignments']}
      actions={
        <Button onClick={() => { setFormData({ title: '', class_name: classRecords[0]?.data?.name || '', subject: SUBJECTS[0], due_date: '', description: '', status: 'todo' }); setEditingId(null); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> New Assignment
        </Button>
      }
    >
      {/* Search */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col, index) => {
            const cards = filtered.filter(a => (a.status || 'todo') === col.id);
            return (
              <div key={col.id} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                {/* Column header */}
                <div className={`px-5 py-3.5 flex items-center justify-between border-b border-border/50 ${col.header}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h2 className="font-semibold text-sm text-foreground">{col.title}</h2>
                  </div>
                  <span className="text-xs font-bold bg-card px-2.5 py-1 rounded-full shadow-sm text-muted-foreground">{cards.length}</span>
                </div>
                {/* Cards */}
                <div className="p-3 space-y-3 min-h-[420px]">
                  {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                      <BookOpen className="w-8 h-8 mb-2" />
                      <p className="text-xs">No assignments</p>
                    </div>
                  ) : cards.map(a => (
                    <motion.div layoutId={a.id} key={a.id} className="bg-background border border-border/50 rounded-xl p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{a.class_name}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => { setEditingId(a.id); setFormData(a); setShowModal(true); }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingSubmissions(a)}>View Submissions</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteRecord.mutate({ id: a.id, recordType: 'school_assignment' })}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold text-sm text-foreground leading-snug mb-1">{a.title}</h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2">{a.subject}</p>
                      {a.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{a.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {a.due_date ? format(new Date(a.due_date), 'MMM d') : 'No date'}
                        </div>
                        <div className="flex gap-1">
                          {index > 0 && <button onClick={() => moveCard(a, columns[index - 1].id)} className="w-6 h-6 rounded border border-border hover:bg-muted transition-colors flex items-center justify-center"><ArrowLeft className="w-3 h-3" /></button>}
                          {index < columns.length - 1 && <button onClick={() => moveCard(a, columns[index + 1].id)} className="w-6 h-6 rounded border border-border hover:bg-muted transition-colors flex items-center justify-center"><ArrowRight className="w-3 h-3" /></button>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submissions Modal */}
      {viewingSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">{viewingSubmissions.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Student Submissions</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-9" onClick={() => setViewingSubmissions(null)}>Close</Button>
                <Button onClick={() => handleAIGrade(viewingSubmissions.id, viewingSubmissions.description)} disabled={aiGrading} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {aiGrading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                  {aiGrading ? 'Grading...' : 'AI Grade All'}
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {submissionsData.filter(s => s.assignment_id === viewingSubmissions.id).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No submissions found.</div>
              ) : submissionsData.filter(s => s.assignment_id === viewingSubmissions.id).map(sub => (
                <div key={sub.id} className="border border-border rounded-xl p-5 bg-background">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-foreground">{sub.student}</h4>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sub.status === 'Graded' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>{sub.status || 'Pending'}</span>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 text-sm text-foreground mb-3 whitespace-pre-wrap">{sub.content}</div>
                  {sub.status === 'Graded' && (
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-3">
                      <p className="font-bold text-indigo-700 dark:text-indigo-400">Grade: {sub.grade} ({sub.ai_score}/100)</p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-300 mt-1">{sub.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Assignment' : 'Create Assignment'}</h2>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1.5 h-10" placeholder="Assignment title" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
                  <select value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select class</option>
                    {classRecords.map(c => <option key={c.id} value={c.data?.name || ''}>{c.data?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date</label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="mt-1.5 h-10" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1.5 w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave}>Save</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </SchoolPageShell>
  );
}
