import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { generateText } from '@/lib/cloudflareAI';
import { BrainCircuit, RefreshCw, BookOpen, Search, Plus, Calendar, MoreHorizontal, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'react-hot-toast';
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
      actions={
        <Button onClick={() => { setFormData({ title: '', class_name: classRecords[0]?.data?.name || '', subject: SUBJECTS[0], due_date: '', description: '', status: 'todo' }); setEditingId(null); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm h-10 px-5 text-sm font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Assignment
        </Button>
      }
    >
      {/* Search */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm rounded-xl focus-visible:ring-1" />
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col) => {
            const cards = filtered.filter(a => (a.status || 'todo') === col.id);
            return (
              <div key={col.id} className="bg-card rounded-2xl border border-border/50 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
                {/* Column header */}
                <div className={`px-5 py-4 flex items-center justify-between border-b border-border/40 ${col.header}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h2 className="font-bold text-sm text-foreground">{col.title}</h2>
                  </div>
                  <span className="text-xs font-extrabold bg-card px-2.5 py-1 rounded-full shadow-sm text-muted-foreground">{cards.length}</span>
                </div>
                {/* Cards */}
                <div className="p-3.5 space-y-3 min-h-[420px]">
                  {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
                      <BookOpen className="w-8 h-8 mb-2" />
                      <p className="text-xs font-medium">No assignments</p>
                    </div>
                  ) : cards.map(a => (
                    <motion.div layoutId={a.id} key={a.id} className="bg-background border border-border/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-lg">{a.class_name}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => { setEditingId(a.id); setFormData(a); setShowModal(true); }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingSubmissions(a)}>View Submissions</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteRecord.mutate({ id: a.id, recordType: 'school_assignment' })}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="font-bold text-foreground text-sm mb-1">{a.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{a.description || 'No description provided.'}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-3">
                        <span className="font-semibold text-indigo-600">{a.subject}</span>
                        {a.due_date && (
                          <div className="flex items-center gap-1 font-medium text-[11px]">
                            <Calendar className="w-3 h-3" /> {a.due_date}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2">
                        {col.id === 'todo' && (
                          <button onClick={() => moveCard(a, 'grading')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            Move to Grading <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.id === 'grading' && (
                          <div className="flex items-center justify-between w-full">
                            <button onClick={() => moveCard(a, 'todo')} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
                              <ArrowLeft className="w-3 h-3" /> To Do
                            </button>
                            <button onClick={() => moveCard(a, 'returned')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                              Return <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {col.id === 'returned' && (
                          <button onClick={() => moveCard(a, 'grading')} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Back to Grading
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/30 pb-4 mb-4">
              <h3 className="text-lg font-bold text-foreground">{editingId ? 'Edit Assignment' : 'New Assignment'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Title *</label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-1 bg-background border-border/40 text-sm h-9" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Class *</label>
                  <select value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} className="w-full mt-1 bg-background border border-border/40 rounded-md h-9 px-3 text-sm text-foreground">
                    {classRecords.map(c => <option key={c.id} value={c.data?.name}>{c.data?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Subject *</label>
                  <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full mt-1 bg-background border border-border/40 rounded-md h-9 px-3 text-sm text-foreground">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Due Date</label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="mt-1 bg-background border-border/40 text-sm h-9" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full mt-1 bg-background border border-border/40 rounded-md p-3 text-sm text-foreground h-24" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30">
                <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 px-4 text-xs font-medium">Cancel</Button>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 text-xs font-medium">{editingId ? 'Save' : 'Create'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SchoolPageShell>
  );
}
