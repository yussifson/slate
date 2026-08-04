import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Award, Search, Plus, Trash2, TrendingUp, BarChart3, CheckCircle, MoreHorizontal, FileSpreadsheet, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import ConfirmationModal from '@/components/ConfirmationModal';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'ICT', 'Ghanaian Language', 'French', 'Religious & Moral Education', 'Physical Education', 'Creative Arts'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];

function calcGrade(score, maxScore) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 80) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

function getGradeRemarks(grade) {
  const map = { A: 'Excellent', B: 'Very Good', C: 'Good', D: 'Pass', F: 'Fail' };
  return map[grade] || 'N/A';
}

const GRADE_CONFIG = {
  A: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
  B: { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', dot: 'bg-indigo-500' },
  C: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', dot: 'bg-amber-500' },
  D: { cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', dot: 'bg-orange-500' },
  F: { cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20', dot: 'bg-rose-500' },
};

const defaultForm = { student_id: '', student_name: '', class_name: '', subject: SUBJECTS[0], exam_name: '', term: TERMS[0], score: '', max_score: '100', remarks: '', date: new Date().toISOString().split('T')[0] };

export default function Grades() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterTerm, setFilterTerm] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const { data: gradesData = [], isLoading } = useIndustryRecords('school_grade');
  const { data: studentsData = [] } = useIndustryRecords('school_student');
  const { data: classesData = [] } = useIndustryRecords('school_class');
  const { data: examsData = [] } = useIndustryRecords('school_exam');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const classList = useMemo(() => classesData.map(c => c.data?.name).filter(Boolean), [classesData]);
  const examList = useMemo(() => examsData.map(e => e.data?.name).filter(Boolean), [examsData]);
  
  const availableStudents = useMemo(() => {
    return studentsData.map(s => ({ id: s.id, name: `${s.data?.first_name || ''} ${s.data?.last_name || ''}`.trim(), className: s.data?.current_class })).filter(s => !formData.class_name || s.className === formData.class_name);
  }, [studentsData, formData.class_name]);

  const grades = gradesData.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data }));
  const filtered = grades.filter(g => {
    const matchClass = filterClass === 'All' || g.class_name === filterClass;
    const matchSubject = filterSubject === 'All' || g.subject === filterSubject;
    const matchTerm = filterTerm === 'All' || g.term === filterTerm;
    const q = search.toLowerCase();
    const matchSearch = !q || g.student_name?.toLowerCase().includes(q) || g.exam_name?.toLowerCase().includes(q) || g.subject?.toLowerCase().includes(q);
    return matchClass && matchSubject && matchTerm && matchSearch;
  });

  const scores = filtered.map(g => (g.max_score > 0 ? (g.score / g.max_score) * 100 : 0));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highScore = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;
  const lowScore = scores.length > 0 ? Math.round(Math.min(...scores)) : 0;
  const passRate = scores.length > 0 ? Math.round((scores.filter(s => s >= 50).length / scores.length) * 100) : 0;

  const handleStudentSelect = (studentId) => {
    const student = availableStudents.find(s => s.id === studentId);
    if (student) setFormData(prev => ({ ...prev, student_id: student.id, student_name: student.name }));
    else setFormData(prev => ({ ...prev, student_id: '', student_name: '' }));
  };

  const handleAdd = () => {
    if (!formData.student_id) return toast.error('Student is required.');
    if (!formData.class_name) return toast.error('Class is required.');
    if (!formData.exam_name) return toast.error('Exam is required.');
    const score = parseFloat(formData.score), maxScore = parseFloat(formData.max_score);
    if (isNaN(score) || isNaN(maxScore) || maxScore <= 0) return toast.error('Please enter valid score values.');
    if (score > maxScore) return toast.error('Score cannot exceed max score.');
    const grade = calcGrade(score, maxScore);
    const remarks = formData.remarks || getGradeRemarks(grade);
    const payload = { student_id: formData.student_id, student_name: formData.student_name, class_name: formData.class_name, subject: formData.subject, exam_name: formData.exam_name, term: formData.term, score, max_score: maxScore, grade, remarks, date: formData.date };
    const searchString = `${formData.student_name} ${formData.class_name} ${formData.subject} ${formData.exam_name} ${formData.term}`;
    mutateRecord.mutate({ id: editingId || undefined, recordType: 'school_grade', payload, status: 'active', searchText: searchString }, {
      onSuccess: () => { toast.success(editingId ? 'Grade updated!' : 'Grade recorded!'); setShowModal(false); setEditingId(null); setFormData(defaultForm); },
      onError: (err) => toast.error('Failed: ' + err.message)
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'school_grade' }, { onSuccess: () => { toast.success('Grade deleted.'); setDeleteTargetId(null); } });
  };

  const liveGrade = calcGrade(parseFloat(formData.score) || 0, parseFloat(formData.max_score) || 100);
  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Grades & Transcript"
      subtitle="Record and manage student exam results"
      breadcrumb={['School', 'Grades']}
      actions={
        <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Quick Add
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Average', value: `${avgScore}%`, icon: BarChart3, color: 'bg-indigo-500/10 text-indigo-600' },
          { label: 'Highest', value: `${highScore}%`, icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Lowest', value: `${lowScore}%`, icon: Award, color: 'bg-amber-500/10 text-amber-600' },
          { label: 'Pass Rate', value: `${passRate}%`, icon: CheckCircle, color: 'bg-sky-500/10 text-sky-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by student, subject, or exam..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
        </div>
        <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="All">All Terms</option>{TERMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="All">All Classes</option>{classList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="All">All Subjects</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto text-sm text-muted-foreground">{filtered.length} entries</div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No grade entries found</p>
              <button onClick={() => setShowModal(true)} className="text-sm text-indigo-600 hover:underline mt-2">Add grade entry →</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {['Student', 'Class', 'Term', 'Subject', 'Exam', 'Score', 'Grade', 'Remarks', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(g => {
                  const gcfg = GRADE_CONFIG[g.grade] || GRADE_CONFIG.F;
                  const pct = g.max_score > 0 ? Math.round((g.score / g.max_score) * 100) : 0;
                  return (
                    <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">{g.student_name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{g.class_name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{g.term}</td>
                      <td className="px-5 py-4 text-muted-foreground">{g.subject}</td>
                      <td className="px-5 py-4 font-medium text-foreground">{g.exam_name}</td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-foreground">{g.score}</span>
                        <span className="text-muted-foreground text-xs ml-1">/ {g.max_score}</span>
                        <div className="w-16 bg-muted rounded-full h-1 mt-1.5">
                          <div className={`h-1 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${gcfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${gcfg.dot}`} />{g.grade}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground truncate max-w-[120px]">{g.remarks}</td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => setViewDetails(g)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingId(g.id); setFormData({ student_id: g.student_id, student_name: g.student_name, class_name: g.class_name, subject: g.subject, exam_name: g.exam_name, term: g.term, score: g.score, max_score: g.max_score, remarks: g.remarks, date: g.date }); setShowModal(true); }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTargetId(g.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 flex-shrink-0 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Grade Entry' : 'Quick Add Grade'}</h2>
              {/* Live grade preview */}
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${GRADE_CONFIG[liveGrade]?.cls || ''}`}>{liveGrade} — {getGradeRemarks(liveGrade)}</span>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class *</label>
                  <select value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value, student_id: '', student_name: ''})} className={`mt-1.5 ${inputCls}`}>
                    <option value="">Select Class...</option>
                    {classList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student *</label>
                  <select value={formData.student_id} onChange={e => handleStudentSelect(e.target.value)} disabled={!formData.class_name} className={`mt-1.5 ${inputCls} disabled:opacity-50`}>
                    <option value="">Select Student...</option>
                    {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Term</label>
                  <select value={formData.term} onChange={e => setFormData({...formData, term: e.target.value})} className={`mt-1.5 ${inputCls}`}>{TERMS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exam *</label>
                  <select value={formData.exam_name} onChange={e => setFormData({...formData, exam_name: e.target.value})} className={`mt-1.5 ${inputCls}`}>
                    <option value="">Select Exam...</option>
                    {examList.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</label>
                <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className={`mt-1.5 ${inputCls}`}>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score *</label>
                  <Input type="number" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. 78" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Max Score</label>
                  <Input type="number" value={formData.max_score} onChange={e => setFormData({...formData, max_score: e.target.value})} className="mt-1.5 h-10" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remarks</label>
                <Input value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="mt-1.5 h-10" placeholder="Optional teacher remarks..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowModal(false)} disabled={mutateRecord.isPending}>Cancel</Button>
                <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAdd} disabled={mutateRecord.isPending}>
                  {mutateRecord.isPending ? 'Saving...' : editingId ? 'Update Grade' : 'Record Grade'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDelete} title="Delete Grade Entry" message="Permanently delete this grade entry?" />

      {/* View Details Sheet */}
      <Sheet open={!!viewDetails} onOpenChange={open => !open && setViewDetails(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Grade Details</SheetTitle></SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">{viewDetails.student_name}</h3>
                <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${(GRADE_CONFIG[viewDetails.grade] || GRADE_CONFIG.F).cls}`}>{viewDetails.grade}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Class', viewDetails.class_name], ['Term', viewDetails.term], ['Subject', viewDetails.subject], ['Exam', viewDetails.exam_name], ['Score', `${viewDetails.score} / ${viewDetails.max_score}`], ['Date', viewDetails.date]].map(([label, val]) => (
                  <div key={label} className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className="font-semibold text-foreground">{val}</p>
                  </div>
                ))}
              </div>
              {viewDetails.remarks && (
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-1">Remarks</p>
                  <p className="text-foreground">{viewDetails.remarks}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </SchoolPageShell>
  );
}
