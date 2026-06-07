import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Award, Search, Plus, Trash2, TrendingUp, BarChart3, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
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
  A: 'bg-primary/10 text-primary/90',
  B: 'bg-primary/5 text-primary dark:bg-primary/30 dark:text-primary/30',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

const defaultForm = {
  studentName: '',
  className: 'Grade 9A',
  subject: 'Mathematics',
  examName: '',
  date: new Date().toISOString().split('T')[0],
  score: '',
  maxScore: '100',
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

  // Filter
  const filtered = grades.filter(g => {
    const matchClass = filterClass === 'All' || g.className === filterClass;
    const q = search.toLowerCase();
    const matchSearch = !q || g.studentName?.toLowerCase().includes(q) || g.examName?.toLowerCase().includes(q) || g.subject?.toLowerCase().includes(q);
    return matchClass && matchSearch;
  });

  // Stats
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
    <div className="space-y-6 school-page-enter font-dmsans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl school-heading font-extrabold tracking-tight">{t("grades_results", "Grades & Results")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("record_and_manage_student_exam", "Record and manage student exam scores")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold">
          <Plus className="w-4 h-4" /> {t("add_grade_entry", "Add Grade Entry")}
        </Button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card-premium school-card p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl school-heading font-extrabold tracking-tight">{avgScore}%</p>
            <p className="text-xs text-muted-foreground">{t("average_score", "Average Score")}</p>
          </div>
        </div>
        <div className="stat-card-premium school-card p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{highScore}%</p>
            <p className="text-xs text-muted-foreground">{t("highest_score", "Highest Score")}</p>
          </div>
        </div>
        <div className="stat-card-premium school-card p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-400 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{lowScore}%</p>
            <p className="text-xs text-muted-foreground">{t("lowest_score", "Lowest Score")}</p>
          </div>
        </div>
        <div className="stat-card-premium school-card p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{passRate}%</p>
            <p className="text-xs text-muted-foreground">{t("pass_rate", "Pass Rate")}</p>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="school-card p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by student, subject, or exam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...CLASS_LIST].map(c => {
            return (
              <button
                key={c}
                onClick={() => setFilterClass(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterClass === c ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
      {/* Table */}
      <div className="school-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading_grade_records", "Loading grade records...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
              <p className="font-semibold text-lg text-card-foreground">{t("no_grade_entries_found", "No grade entries found")}</p>
              <p className="text-sm mt-1">{t(
                "add_a_grade_entry_using_the_bu",
                "Add a grade entry using the button above."
              )}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-primary/5/60 dark:bg-slate-800/40 border-b border-primary/10 dark:border-slate-700">
                <tr>
                  {['Student', 'Class', 'Subject', 'Exam', 'Date', 'Score', 'Grade', ''].map(h => {
                    return (<th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>);
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(g => {
                  return (
                    <tr key={g.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary/90 font-bold text-xs shrink-0">
                            {g.studentName?.substring(0, 2).toUpperCase()}
                          </div>
                          <Link to="/students" className="font-semibold text-primary hover:underline">{g.studentName}</Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link to="/classes" className="bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary/30 text-xs font-semibold px-2 py-1 rounded-md hover:underline">{g.className}</Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{g.subject}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{g.examName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{g.date}</td>
                      <td className="px-4 py-3 font-bold text-card-foreground">
                        {g.score} <span className="text-muted-foreground font-normal text-xs">/ {g.maxScore}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${GRADE_COLORS[g.grade] || 'bg-gray-100 text-gray-700'}`}>
                          {g.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setViewDetails(g)}>{t("view_details", "View Details")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setEditingId(g.id);
                              setFormData({
                                studentName: g.studentName,
                                className: g.className,
                                subject: g.subject,
                                examName: g.examName,
                                date: g.date,
                                score: g.score,
                                maxScore: g.maxScore
                              });
                              setShowModal(true);
                            }}>{t("edit", "Edit")}</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 font-medium" onClick={() => setDeleteTargetId(g.id)}>{t("delete", "Delete")}</DropdownMenuItem>
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
      {/* Add Grade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-[#1E3A8A]/10 w-full max-w-md p-6 space-y-4 border border-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> {editingId ? 'Edit Grade Entry' : 'Add Grade Entry'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("student_name", "Student Name")}</label>
                <select
                  value={formData.studentName}
                  onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">{t("select_student", "Select Student...")}</option>
                  {availableStudents.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                {availableStudents.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">{t("no_students_found_in_this_clas", "No students found in this class.")}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("class", "Class")}</label>
                  <select
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {CLASS_LIST.map(c => {
                      return <option key={c}>{c}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("subject", "Subject")}</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {SUBJECTS.map(s => {
                      return <option key={s}>{s}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("exam_name", "Exam Name")}</label>
                <Select value={formData.examName} onValueChange={(v) => setFormData({ ...formData, examName: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Exam..." /></SelectTrigger>
                  <SelectContent>
                    {uniqueExams.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                    <AddOptionInline
                      onAdd={(v) => {
                        mutateRecord.mutate({
                          recordType: 'exam',
                          payload: {
                            subject: v,
                            class: formData.className,
                            date: formData.date,
                            time: '09:00 AM',
                            duration: '2 Hours',
                            venue: 'TBD'
                          },
                          status: 'Upcoming',
                          searchText: `${v} ${formData.className} TBD`
                        });
                        setFormData({ ...formData, examName: v });
                      }}
                      placeholder="New exam..."
                    />
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("date", "Date")}</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("score", "Score")}</label>
                  <Input
                    type="number"
                    value={formData.score}
                    onChange={e => setFormData({ ...formData, score: e.target.value })}
                    className="mt-1"
                    placeholder="75"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("max_score", "Max Score")}</label>
                  <Input
                    type="number"
                    value={formData.maxScore}
                    onChange={e => setFormData({ ...formData, maxScore: e.target.value })}
                    className="mt-1"
                    placeholder="100"
                  />
                </div>
              </div>
              {formData.score !== '' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">{t("auto_grade", "Auto Grade:")}</span>
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-bold text-sm ${GRADE_COLORS[liveGrade]}`}>
                    {liveGrade}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({formData.maxScore > 0 ? Math.round((parseFloat(formData.score) / parseFloat(formData.maxScore)) * 100) : 0}%)
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingId(null); setFormData(defaultForm); }} disabled={mutateRecord.isPending}>
                {t("cancel", "Cancel")}
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={handleAdd} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Grade')}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Grade Entry"
        message="Are you sure you want to permanently remove this grade entry? This action cannot be undone."
      />
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("grade_details", "Grade Details")}</SheetTitle>
            <SheetDescription>{t(
              "comprehensive_view_of_the_stud",
              "Comprehensive view of the student's grade record."
            )}</SheetDescription>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary/90 font-bold text-xl">
                  {viewDetails.studentName?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl school-heading font-bold tracking-tight">
                    <Link to="/students" className="hover:underline text-primary">{viewDetails.studentName}</Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">{viewDetails.examName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("class", "Class")}</p>
                  <Link to="/classes" className="text-primary hover:underline font-medium">{viewDetails.className}</Link>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("subject", "Subject")}</p>
                  <p className="font-medium text-foreground">{viewDetails.subject}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("date", "Date")}</p>
                  <p className="font-medium text-foreground">{viewDetails.date}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg flex flex-col items-start justify-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">{t("final_grade", "Final Grade")}</p>
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md font-bold text-sm ${GRADE_COLORS[viewDetails.grade] || 'bg-gray-100 text-gray-700'}`}>
                    {viewDetails.grade}
                  </span>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">{t("score_acquired", "Score Acquired")}</p>
                    <p className="font-bold text-xl text-foreground">
                      {viewDetails.score} <span className="text-muted-foreground text-sm font-medium">/ {viewDetails.maxScore}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">{t("percentage", "Percentage")}</p>
                    <p className="font-bold text-xl text-foreground">
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
