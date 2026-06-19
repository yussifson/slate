import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Award, Search, Plus, Trash2, TrendingUp, BarChart3, CheckCircle, MoreVertical, FileSpreadsheet } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import AddOptionInline from "@/components/shared/AddOptionInline";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyId } from '@/hooks/useCompanyId';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Chemistry', 'Physics', 'Geography', 'ICT'];

function calcGrade(score, maxScore) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

const GRADE_COLORS = {
  A: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  B: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
  C: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  D: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  F: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
};

const defaultForm = {
  studentName: '', className: 'Grade 9A', subject: 'Mathematics', examName: '', date: new Date().toISOString().split('T')[0], score: '', maxScore: '100',
};

export default function Grades() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const { data: dbRecords = [], isLoading } = useIndustryRecords('grade');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const { data: studentRecords = [] } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }),
    enabled: !!companyId
  });

  const { data: classRecords = [] } = useQuery({
    queryKey: ['cases', companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  const CLASS_LIST = classRecords.length > 0 ? [...new Set(classRecords.map(r => r.title))] : ['Grade 7B', 'Grade 8C', 'Grade 9A'];

  const { data: examsData = [] } = useIndustryRecords('exam');
  const uniqueExams = [...new Set(examsData.map(r => r.data?.subject).filter(Boolean))];

  const availableStudents = studentRecords.filter(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return extra.class === formData.className;
  }).map(r => ({ id: r.id, name: r.name || 'Unknown' }));

  const grades = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data,
  }));

  const filtered = grades.filter(g => {
    const matchClass = filterClass === 'All' || g.className === filterClass;
    const q = search.toLowerCase();
    const matchSearch = !q || g.studentName?.toLowerCase().includes(q) || g.examName?.toLowerCase().includes(q) || g.subject?.toLowerCase().includes(q);
    return matchClass && matchSearch;
  });

  const scores = grades.map(g => (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highScore = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;
  const lowScore = scores.length > 0 ? Math.round(Math.min(...scores)) : 0;
  const passRate = scores.length > 0 ? Math.round((scores.filter(s => s >= 50).length / scores.length) * 100) : 0;

  const handleAdd = () => {
    if (!formData.studentName.trim()) return toast.error('Student name is required.');
    if (!formData.examName.trim()) return toast.error('Exam name is required.');
    const score = parseFloat(formData.score);
    const maxScore = parseFloat(formData.maxScore);
    if (isNaN(score) || isNaN(maxScore) || maxScore <= 0) return toast.error('Please enter valid score values.');
    if (score > maxScore) return toast.error('Score cannot exceed max score.');

    const grade = calcGrade(score, maxScore);
    const payload = {
      studentName: formData.studentName.trim(),
      className: formData.className,
      subject: formData.subject,
      examName: formData.examName.trim(),
      date: formData.date,
      score,
      maxScore,
      grade,
    };

    if (editingId) {
      mutateRecord.mutate({
        id: editingId,
        recordType: 'grade',
        payload,
        status: 'active',
        searchText: `${formData.studentName} ${formData.className} ${formData.subject} ${formData.examName}`,
      }, {
        onSuccess: () => {
          toast.success('Grade entry updated!');
          setShowModal(false);
          setEditingId(null);
          setFormData(defaultForm);
        },
        onError: (err) => toast.error('Failed: ' + err.message),
      });
    } else {
      mutateRecord.mutate({
        recordType: 'grade',
        payload,
        status: 'active',
        searchText: `${formData.studentName} ${formData.className} ${formData.subject} ${formData.examName}`,
      }, {
        onSuccess: () => {
          toast.success('Grade entry recorded!');
          setShowModal(false);
          setFormData(defaultForm);
        },
        onError: (err) => toast.error('Failed: ' + err.message),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'grade' }, {
      onSuccess: () => { toast.success('Grade record deleted.'); setDeleteTargetId(null); },
      onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null); },
    });
  };

  const liveGrade = calcGrade(parseFloat(formData.score) || 0, parseFloat(formData.maxScore) || 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-primary/40 pb-4">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">{t("grades_results", "Grades & Transcript")}</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">{t("record_and_manage_student_exam", "Spreadsheet data entry & analytics")}</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setShowModal(true); }} className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-md-full">
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
      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <Input
            placeholder="Search by student, subject, or exam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 rounded-md-full border-primary/30 bg-[var(--color-surface-1)] h-11"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center overflow-x-auto scrollbar-hide">
          {['All', ...CLASS_LIST].map(c => (
            <button
              key={c}
              onClick={() => setFilterClass(c)}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors rounded-md-full ${
                filterClass === c ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-[var(--primary)] font-semibold">{t("loading_grade_records", "Loading grade records...")}</div>
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
                  {['Student', 'Class', 'Subject', 'Exam', 'Date', 'Score', 'Grade', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] uppercase tracking-[var(--tracking-widest)] font-semibold text-[var(--color-text-tertiary)] tracking-[0.04em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">{g.studentName}</td>
                    <td className="px-6 py-4 font-medium text-[var(--color-text-secondary)]">{g.className}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{g.subject}</td>
                    <td className="px-6 py-4 text-[var(--color-text-primary)] font-medium">{g.examName}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs tracking-[0.04em]">{g.date}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">
                      {g.score} <span className="text-[var(--color-text-tertiary)] text-xs font-normal tracking-[0.04em]">/ {g.maxScore}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] rounded-md-full ${GRADE_COLORS[g.grade] || 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'}`}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 rounded-md-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setViewDetails(g)}>{t("view_details", "View Details")}</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => {
                            setEditingId(g.id);
                            setFormData({
                              studentName: g.studentName, className: g.className, subject: g.subject, examName: g.examName, date: g.date, score: g.score, maxScore: g.maxScore
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
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl">
            <h2 className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">
              {editingId ? 'Edit Entry' : 'Quick Add'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">{t("student_name", "Student Name")}</label>
                <select
                  value={formData.studentName}
                  onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">{t("select_student", "Select Student...")}</option>
                  {availableStudents.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">{t("class", "Class")}</label>
                  <select
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    className="w-full flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    {CLASS_LIST.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">{t("subject", "Subject")}</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">{t("exam_name", "Exam Name")}</label>
                <Select value={formData.examName} onValueChange={(v) => setFormData({ ...formData, examName: v })}>
                  <SelectTrigger className="rounded-md-[var(--radius-lg)]"><SelectValue placeholder="Select Exam..." /></SelectTrigger>
                  <SelectContent className="rounded-md-[var(--radius-lg)] bg-[var(--color-surface-0)] border-primary/20">
                    {uniqueExams.map(e => <SelectItem key={e} value={e} className="cursor-pointer">{e}</SelectItem>)}
                    <AddOptionInline
                      onAdd={(v) => {
                        mutateRecord.mutate({
                          recordType: 'exam', payload: { subject: v, class: formData.className, date: formData.date, time: '09:00 AM', duration: '2 Hours', venue: 'TBD' }, status: 'Upcoming', searchText: `${v} ${formData.className} TBD`
                        });
                        setFormData({ ...formData, examName: v });
                      }}
                      placeholder="New exam..."
                    />
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">{t("date", "Date")}</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-md-[var(--radius-lg)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 bg-[var(--color-surface-1)] p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 text-center tracking-[0.04em]">{t("score", "Score")}</label>
                  <Input
                    type="number"
                    value={formData.score}
                    onChange={e => setFormData({ ...formData, score: e.target.value })}
                    className="rounded-md-[var(--radius-lg)] text-center font-semibold text-lg h-12"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 text-center tracking-[0.04em]">{t("max_score", "Max")}</label>
                  <Input
                    type="number"
                    value={formData.maxScore}
                    onChange={e => setFormData({ ...formData, maxScore: e.target.value })}
                    className="rounded-md-[var(--radius-lg)] text-center font-semibold text-lg h-12"
                    placeholder="100"
                  />
                </div>
              </div>
              {formData.score !== '' && (
                <div className="flex items-center justify-center gap-3 py-3 bg-[var(--color-surface-2)] rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-[0.04em]">{t("grade", "Grade:")}</span>
                  <span className={`inline-flex items-center justify-center px-3 py-1 font-semibold text-base rounded-md-full ${GRADE_COLORS[liveGrade]}`}>
                    {liveGrade}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-tertiary)]">
                    ({formData.maxScore > 0 ? Math.round((parseFloat(formData.score) / parseFloat(formData.maxScore)) * 100) : 0}%)
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-md-full border-primary/30" onClick={() => { setShowModal(false); setEditingId(null); setFormData(defaultForm); }} disabled={mutateRecord.isPending}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-md-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white" onClick={handleAdd} disabled={mutateRecord.isPending}>
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
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight mb-1 tracking-[-0.02em]">{viewDetails.studentName}</h3>
                <p className="text-[var(--primary)] font-semibold text-sm">{viewDetails.examName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">{t("class", "Class")}</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.className}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">{t("subject", "Subject")}</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.subject}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">{t("date", "Date")}</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.date}</p>
                </div>
                <div className="bg-[var(--primary)]/10 p-4 rounded-md-[var(--radius-lg)] flex flex-col justify-center text-[var(--primary)] border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20">
                  <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">{t("grade", "Grade")}</p>
                  <p className="font-semibold text-3xl tracking-[-0.02em]">{viewDetails.grade}</p>
                </div>
                <div className="bg-[var(--color-surface-0)] p-6 rounded-md-[var(--radius-xl)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 col-span-2 flex justify-between items-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
                  <div>
                    <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">{t("score", "Score")}</p>
                    <p className="font-display font-semibold text-3xl text-[var(--color-text-primary)] tracking-[-0.02em]">
                      {viewDetails.score} <span className="text-[var(--color-text-secondary)] text-xl font-medium">/ {viewDetails.maxScore}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1 tracking-[0.04em]">{t("pct", "Percent")}</p>
                    <p className="font-display font-semibold text-3xl text-[var(--primary)] tracking-[-0.02em]">
                      {viewDetails.maxScore > 0 ? Math.round((viewDetails.score / viewDetails.maxScore) * 100) : 0}%
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
