import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Award, Search, Plus, Trash2, TrendingUp, BarChart3, CheckCircle, MoreVertical, FileSpreadsheet } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'Social Studies', 
  'ICT', 'Ghanaian Language', 'French', 
  'Religious & Moral Education', 'Physical Education', 'Creative Arts'
];

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
  switch(grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Pass';
    default: return 'Fail';
  }
}

const GRADE_COLORS = {
  A: 'bg-[var(--color-success)]/10 text-[var(--color-success)]', // green
  B: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',       // blue
  C: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]', // yellow/amber
  D: 'bg-[#f97316]/10 text-[#f97316]',                           // orange
  F: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]' // red
};

const defaultForm = {
  student_id: '',
  student_name: '',
  class_name: '',
  subject: SUBJECTS[0],
  exam_name: '',
  term: TERMS[0],
  score: '',
  max_score: '100',
  remarks: '',
  date: new Date().toISOString().split('T')[0]
};

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
    return studentsData
      .map(s => ({ id: s.id, name: `${s.data?.first_name || ''} ${s.data?.last_name || ''}`.trim(), className: s.data?.current_class }))
      .filter(s => !formData.class_name || s.className === formData.class_name);
  }, [studentsData, formData.class_name]);

  const grades = gradesData.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data }));

  const filtered = grades.filter(g => {
    const matchClass = filterClass === 'All' || g.class_name === filterClass;
    const matchSubject = filterSubject === 'All' || g.subject === filterSubject;
    const matchTerm = filterTerm === 'All' || g.term === filterTerm;
    const q = search.toLowerCase();
    const matchSearch = !q || 
      g.student_name?.toLowerCase().includes(q) || 
      g.exam_name?.toLowerCase().includes(q) || 
      g.subject?.toLowerCase().includes(q);
    return matchClass && matchSubject && matchTerm && matchSearch;
  });

  const scores = filtered.map(g => (g.max_score > 0 ? (g.score / g.max_score) * 100 : 0));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highScore = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;
  const lowScore = scores.length > 0 ? Math.round(Math.min(...scores)) : 0;
  const passRate = scores.length > 0 ? Math.round((scores.filter(s => s >= 50).length / scores.length) * 100) : 0;

  const handleStudentSelect = (studentId) => {
    const student = availableStudents.find(s => s.id === studentId);
    if (student) {
      setFormData(prev => ({ ...prev, student_id: student.id, student_name: student.name }));
    } else {
      setFormData(prev => ({ ...prev, student_id: '', student_name: '' }));
    }
  };

  const handleAdd = () => {
    if (!formData.student_id) return toast.error('Student is required.');
    if (!formData.class_name) return toast.error('Class is required.');
    if (!formData.exam_name) return toast.error('Exam is required.');
    
    const score = parseFloat(formData.score);
    const maxScore = parseFloat(formData.max_score);
    if (isNaN(score) || isNaN(maxScore) || maxScore <= 0) return toast.error('Please enter valid score values.');
    if (score > maxScore) return toast.error('Score cannot exceed max score.');

    const grade = calcGrade(score, maxScore);
    const remarks = formData.remarks || getGradeRemarks(grade);

    const payload = {
      student_id: formData.student_id,
      student_name: formData.student_name,
      class_name: formData.class_name,
      subject: formData.subject,
      exam_name: formData.exam_name,
      term: formData.term,
      score,
      max_score: maxScore,
      grade,
      remarks,
      date: formData.date
    };

    const searchString = `${formData.student_name} ${formData.class_name} ${formData.subject} ${formData.exam_name} ${formData.term}`;

    mutateRecord.mutate({
      id: editingId || undefined,
      recordType: 'school_grade',
      payload,
      status: 'active',
      searchText: searchString
    }, {
      onSuccess: () => {
        toast.success(editingId ? 'Grade entry updated!' : 'Grade entry recorded!');
        setShowModal(false);
        setEditingId(null);
        setFormData(defaultForm);
      },
      onError: (err) => toast.error('Failed: ' + err.message)
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'school_grade' }, {
      onSuccess: () => { toast.success('Grade record deleted.'); setDeleteTargetId(null); },
      onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null); }
    });
  };

  const liveGrade = calcGrade(parseFloat(formData.score) || 0, parseFloat(formData.max_score) || 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-primary/40 pb-4">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">{t("grades_results", "Grades & Transcript")}</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">{t("record_and_manage_student_exam", "Spreadsheet data entry & analytics")}</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setShowModal(true); }} className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-full">
          <Plus className="w-4 h-4 mr-2" /> {t("add_grade_entry", "Quick Add")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
              <BarChart3 className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{t("average", "Average")}</h3>
          </div>
          <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">{avgScore}%</p>
        </div>
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)' }}>
              <TrendingUp className="w-6 h-6 text-[var(--color-success)]" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{t("highest", "Highest")}</h3>
          </div>
          <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-success)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">{highScore}%</p>
        </div>
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
              <Award className="w-6 h-6 text-[var(--color-warning)]" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{t("lowest", "Lowest")}</h3>
          </div>
          <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-warning)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">{lowScore}%</p>
        </div>
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)' }}>
              <CheckCircle className="w-6 h-6 text-[var(--color-info)]" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{t("pass_rate", "Pass Rate")}</h3>
          </div>
          <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-info)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">{passRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <Input
            placeholder="Search by student, subject, or exam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 rounded-full border-primary/30 bg-[var(--color-surface-1)] h-11"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select 
            value={filterTerm} 
            onChange={e => setFilterTerm(e.target.value)}
            className="h-10 rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="All">All Terms</option>
            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            value={filterClass} 
            onChange={e => setFilterClass(e.target.value)}
            className="h-10 rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="All">All Classes</option>
            {classList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={filterSubject} 
            onChange={e => setFilterSubject(e.target.value)}
            className="h-10 rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="All">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-[var(--primary)] font-semibold">{t("loading", "Loading...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center bg-[var(--color-surface-1)] border-t border-primary/20">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
              <p className="font-semibold text-lg text-[var(--color-text-primary)]">{t("no_grade_entries_found", "No data")}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{t("add_a_grade_entry_using_the_bu", "Enter grades using the Quick Add button.")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-1)]/50 border-b border-primary/20">
                <tr>
                  {['Student', 'Class', 'Term', 'Subject', 'Exam', 'Score', 'Grade', 'Remarks', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] uppercase tracking-[var(--tracking-widest)] font-semibold text-[var(--color-text-tertiary)] tracking-[0.04em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">{g.student_name}</td>
                    <td className="px-6 py-4 font-medium text-[var(--color-text-secondary)]">{g.class_name}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{g.term}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{g.subject}</td>
                    <td className="px-6 py-4 text-[var(--color-text-primary)] font-medium">{g.exam_name}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">
                      {g.score} <span className="text-[var(--color-text-tertiary)] text-xs font-normal tracking-[0.04em]">/ {g.max_score}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] rounded-full ${GRADE_COLORS[g.grade] || 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'}`}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] truncate max-w-[150px]" title={g.remarks}>{g.remarks}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setViewDetails(g)}>{t("view_details", "View Details")}</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => {
                            setEditingId(g.id);
                            setFormData({
                              student_id: g.student_id,
                              student_name: g.student_name,
                              class_name: g.class_name,
                              subject: g.subject,
                              exam_name: g.exam_name,
                              term: g.term,
                              score: g.score,
                              max_score: g.max_score,
                              remarks: g.remarks,
                              date: g.date
                            });
                            setShowModal(true);
                          }}>{t("edit", "Edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)] cursor-pointer" onClick={() => setDeleteTargetId(g.id)}>{t("delete", "Delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Grade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl">
            <h2 className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">
              {editingId ? 'Edit Grade Entry' : 'Quick Add Grade'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Class</label>
                  <select
                    value={formData.class_name}
                    onChange={e => setFormData({ ...formData, class_name: e.target.value, student_id: '', student_name: '' })}
                    className="flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select Class...</option>
                    {classList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Student</label>
                  <select
                    value={formData.student_id}
                    onChange={e => handleStudentSelect(e.target.value)}
                    disabled={!formData.class_name}
                    className="flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    <option value="">Select Student...</option>
                    {availableStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Term</label>
                  <select
                    value={formData.term}
                    onChange={e => setFormData({ ...formData, term: e.target.value })}
                    className="flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Exam Name</label>
                  <select
                    value={formData.exam_name}
                    onChange={e => setFormData({ ...formData, exam_name: e.target.value })}
                    className="flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select Exam...</option>
                    {examList.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="rounded-md-[var(--radius-lg)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[var(--color-surface-1)] p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 text-center tracking-[0.04em]">Score</label>
                  <Input
                    type="number"
                    value={formData.score}
                    onChange={e => setFormData({ ...formData, score: e.target.value })}
                    className="rounded-md-[var(--radius-lg)] text-center font-semibold text-lg h-12"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 text-center tracking-[0.04em]">Max Score</label>
                  <Input
                    type="number"
                    value={formData.max_score}
                    onChange={e => setFormData({ ...formData, max_score: e.target.value })}
                    className="rounded-md-[var(--radius-lg)] text-center font-semibold text-lg h-12"
                    placeholder="100"
                  />
                </div>
              </div>

              {formData.score !== '' && (
                <div className="flex items-center justify-center gap-3 py-3 bg-[var(--color-surface-2)] rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-[0.04em]">Grade:</span>
                  <span className={`inline-flex items-center justify-center px-3 py-1 font-semibold text-base rounded-full ${GRADE_COLORS[liveGrade]}`}>
                    {liveGrade}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-tertiary)]">
                    ({formData.max_score > 0 ? Math.round((parseFloat(formData.score) / parseFloat(formData.max_score)) * 100) : 0}%)
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Remarks (Optional)</label>
                <Input
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder={getGradeRemarks(liveGrade)}
                  className="rounded-md-[var(--radius-lg)]"
                />
              </div>

            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-full border-primary/30" onClick={() => { setShowModal(false); setEditingId(null); setFormData(defaultForm); }} disabled={mutateRecord.isPending}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white" onClick={handleAdd} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        message="Permanently remove this transcript entry?"
      />
      
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md bg-[var(--color-surface-0)] border-l border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl">
          <SheetHeader>
            <SheetTitle className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">{t("grade_details", "Transcript")}</SheetTitle>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-8 space-y-4">
              <div className="bg-[var(--color-surface-1)] p-6 rounded-md-[var(--radius-xl)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight mb-1 tracking-[-0.02em]">{viewDetails.student_name}</h3>
                <p className="text-[var(--primary)] font-semibold text-sm">{viewDetails.exam_name}</p>
                <p className="text-[var(--color-text-secondary)] text-sm">{viewDetails.term}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">Class</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.class_name}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">Subject</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.subject}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">Date</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.date}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">Remarks</p>
                  <p className="font-semibold text-[var(--color-text-primary)] truncate" title={viewDetails.remarks}>{viewDetails.remarks}</p>
                </div>
                <div className="bg-[var(--primary)]/10 p-4 rounded-md-[var(--radius-lg)] flex flex-col justify-center text-[var(--primary)] border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20 col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">Grade</p>
                  <p className="font-semibold text-3xl tracking-[-0.02em]">{viewDetails.grade}</p>
                </div>
                <div className="bg-[var(--color-surface-0)] p-6 rounded-md-[var(--radius-xl)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 col-span-2 flex justify-between items-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
                  <div>
                    <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">{t("score", "Score")}</p>
                    <p className="font-display font-semibold text-3xl text-[var(--color-text-primary)] tracking-[-0.02em]">
                      {viewDetails.score} <span className="text-[var(--color-text-secondary)] text-xl font-medium">/ {viewDetails.max_score}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">{t("pct", "Percent")}</p>
                    <p className="font-display font-semibold text-3xl text-[var(--primary)] tracking-[-0.02em]">
                      {viewDetails.max_score > 0 ? Math.round((viewDetails.score / viewDetails.max_score) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
