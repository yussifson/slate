import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Award, Search, Plus, Trash2, TrendingUp, BarChart3, CheckCircle, MoreHorizontal, FileSpreadsheet, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

  const classList = useMemo(() => classesData.map(c => c.data?.name || c.data?.class_name).filter(Boolean), [classesData]);
  const examList = useMemo(() => examsData.map(e => e.data?.name).filter(Boolean), [examsData]);
  
  const availableStudents = useMemo(() => {
    return studentsData.map(s => {
      const sData = s.data || {};
      const fullName = sData.name || `${sData.first_name || ''} ${sData.last_name || ''}`.trim() || 'Unnamed Student';
      const className = sData.class_name || sData.current_class || '';
      return { id: s.id, name: fullName, className };
    }).filter(s => !formData.class_name || s.className === formData.class_name);
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
  const inputCls = "flex h-10 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <SchoolPageShell
      title="Grades & Transcript"
      subtitle="Record and manage student exam results"
      actions={
        <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm h-10 px-5 text-sm font-semibold">
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
          <div key={label} className="bg-card rounded-2xl border border-border/50 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input placeholder="Search by student, subject, or exam..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm rounded-xl" />
        </div>
        <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="h-9 rounded-xl border border-border/50 bg-background px-3 text-sm">
          <option value="All">All Terms</option>{TERMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="h-9 rounded-xl border border-border/50 bg-background px-3 text-sm">
          <option value="All">All Classes</option>{classList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="h-9 rounded-xl border border-border/50 bg-background px-3 text-sm">
          <option value="All">All Subjects</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto text-xs text-muted-foreground/60 font-medium">{filtered.length} entries</div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading grades…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">No grade entries found</p>
              <button onClick={() => setShowModal(true)} className="text-sm text-indigo-600 hover:underline mt-2">Add grade entry →</button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground/80 bg-muted/20 border-b border-border/40 font-medium">
                <tr>
                  {['Student', 'Class', 'Term', 'Subject', 'Exam', 'Score', 'Grade', 'Remarks', 'Action'].map((h, i) => (
                    <th key={h} className={`px-4 py-4 font-semibold text-muted-foreground ${i === 8 ? 'text-right px-5' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map(g => {
                  const gcfg = GRADE_CONFIG[g.grade] || GRADE_CONFIG.F;
                  const pct = g.max_score > 0 ? Math.round((g.score / g.max_score) * 100) : 0;
                  return (
                    <tr key={g.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-4 font-semibold text-foreground">{g.student_name}</td>
                      <td className="px-4 py-4 text-foreground font-medium">{g.class_name}</td>
                      <td className="px-4 py-4 text-muted-foreground">{g.term}</td>
                      <td className="px-4 py-4 text-muted-foreground">{g.subject}</td>
                      <td className="px-4 py-4 font-medium text-foreground">{g.exam_name}</td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-foreground">{g.score}</span>
                        <span className="text-muted-foreground text-xs ml-1">/ {g.max_score}</span>
                        <div className="w-16 bg-muted/40 rounded-full h-1 mt-1.5 overflow-hidden">
                          <div className={`h-1 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${gcfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${gcfg.dot}`} />{g.grade}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground truncate max-w-[120px]">{g.remarks}</td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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

      {/* Add/Edit Modal Header & Styling Match */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border/40 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className={`px-6 py-5 flex-shrink-0 flex items-center justify-between transition-colors ${editingId ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-gradient-to-r from-indigo-600 to-indigo-500'}`}>
              <div>
                <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Grade Entry' : 'Quick Add Grade'}</h2>
                <p className="text-xs text-white/80 mt-0.5">{editingId ? 'Update recorded grade information' : 'Record new student exam evaluation'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${GRADE_CONFIG[liveGrade]?.cls || ''}`}>{liveGrade} — {getGradeRemarks(liveGrade)}</span>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                  <Input type="number" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} className="mt-1.5 h-10 rounded-xl" placeholder="e.g. 78" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Max Score</label>
                  <Input type="number" value={formData.max_score} onChange={e => setFormData({...formData, max_score: e.target.value})} className="mt-1.5 h-10 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remarks</label>
                <Input value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="mt-1.5 h-10 rounded-xl" placeholder="Optional teacher remarks..." />
              </div>
              <div className="flex gap-3 pt-4 border-t border-border/30">
                <Button variant="outline" className="flex-1 h-10 rounded-xl font-medium" onClick={() => setShowModal(false)} disabled={mutateRecord.isPending}>Cancel</Button>
                <Button className={`flex-1 h-10 text-white rounded-xl font-semibold ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`} onClick={handleAdd} disabled={mutateRecord.isPending}>
                  {editingId ? 'Update Grade' : 'Record Grade'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal
        open={!!deleteTargetId}
        onOpenChange={(op) => !op && setDeleteTargetId(null)}
        title="Delete Grade Entry"
        description="Are you sure you want to delete this grade entry? This action cannot be undone."
        onConfirm={handleDelete}
        confirmText="Delete"
        destructive
      />
    </SchoolPageShell>
  );
}
