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
import './SchoolTheme.css';

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
  A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  B: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  F: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
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

  const cardStyle = "bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300";
  const primaryBtn = "bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]";
  const secondaryBtn = "bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 text-[#1F1E1C] dark:text-zinc-50 border border-[#E4DFD5] dark:border-zinc-700 rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02]";
  const inputStyle = "rounded-xl border-[1.5px] border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none w-full px-4 h-11 text-sm";

  return (
    <div className="school-theme-root bg-[#FCFAF7] dark:bg-zinc-950 min-h-screen text-[#1F1E1C] dark:text-zinc-50 font-sans p-4 md:p-8">
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#F0EBE1] dark:border-zinc-800 pb-6">
          <div>
            <h1 className="font-semibold text-4xl text-[#1F1E1C] dark:text-zinc-50 tracking-tight">{t("grades_results", "Grades & Transcript")}</h1>
            <p className="text-zinc-500 font-medium mt-2">{t("record_and_manage_student_exam", "Spreadsheet data entry & analytics")}</p>
          </div>
          <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setShowModal(true); }} className={primaryBtn}>
            <Plus className="w-5 h-5 mr-2" /> {t("add_grade_entry", "Quick Add")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className={cardStyle}>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-zinc-500 text-sm">{t("average", "Average")}</h3>
            </div>
            <p className="text-4xl font-semibold text-[#1F1E1C] dark:text-zinc-50 mb-1 tracking-tight">{avgScore}%</p>
          </div>
          <div className={cardStyle}>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-zinc-500 text-sm">{t("highest", "Highest")}</h3>
            </div>
            <p className="text-4xl font-semibold text-emerald-600 dark:text-emerald-400 mb-1 tracking-tight">{highScore}%</p>
          </div>
          <div className={cardStyle}>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-zinc-500 text-sm">{t("lowest", "Lowest")}</h3>
            </div>
            <p className="text-4xl font-semibold text-orange-600 dark:text-orange-400 mb-1 tracking-tight">{lowScore}%</p>
          </div>
          <div className={cardStyle}>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-zinc-500 text-sm">{t("pass_rate", "Pass Rate")}</h3>
            </div>
            <p className="text-4xl font-semibold text-indigo-600 dark:text-indigo-400 mb-1 tracking-tight">{passRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${cardStyle} flex flex-col md:flex-row gap-4 items-center justify-between`}>
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Search by student, subject, or exam..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${inputStyle} pl-12 h-12`}
            />
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <select 
              value={filterTerm} 
              onChange={e => setFilterTerm(e.target.value)}
              className={inputStyle}
            >
              <option value="All">All Terms</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select 
              value={filterClass} 
              onChange={e => setFilterClass(e.target.value)}
              className={inputStyle}
            >
              <option value="All">All Classes</option>
              {classList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={filterSubject} 
              onChange={e => setFilterSubject(e.target.value)}
              className={inputStyle}
            >
              <option value="All">All Subjects</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-12 text-center text-indigo-600 font-semibold">{t("loading", "Loading...")}</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center bg-[#FCFAF7] dark:bg-zinc-950 border-t border-[#F0EBE1] dark:border-zinc-800">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                <p className="font-semibold text-xl text-[#1F1E1C] dark:text-zinc-50">{t("no_grade_entries_found", "No data")}</p>
                <p className="text-zinc-500 font-medium mt-1">{t("add_a_grade_entry_using_the_bu", "Enter grades using the Quick Add button.")}</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FCFAF7] dark:bg-zinc-950 border-b border-[#F0EBE1] dark:border-zinc-800">
                  <tr>
                    {['Student', 'Class', 'Term', 'Subject', 'Exam', 'Score', 'Grade', 'Remarks', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1] dark:divide-zinc-800">
                  {filtered.map((g) => (
                    <tr key={g.id} className="hover:bg-[#FCFAF7] dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-5 font-semibold text-[#1F1E1C] dark:text-zinc-50">{g.student_name}</td>
                      <td className="px-6 py-5 font-medium text-zinc-600 dark:text-zinc-400">{g.class_name}</td>
                      <td className="px-6 py-5 text-zinc-600 dark:text-zinc-400">{g.term}</td>
                      <td className="px-6 py-5 font-medium text-zinc-600 dark:text-zinc-400">{g.subject}</td>
                      <td className="px-6 py-5 font-semibold text-[#1F1E1C] dark:text-zinc-50">{g.exam_name}</td>
                      <td className="px-6 py-5 font-bold text-[#1F1E1C] dark:text-zinc-50 text-base">
                        {g.score} <span className="text-zinc-400 text-xs font-medium">/ {g.max_score}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center justify-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${GRADE_COLORS[g.grade] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                          {g.grade}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-zinc-500 font-medium truncate max-w-[150px]" title={g.remarks}>{g.remarks}</td>
                      <td className="px-6 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-xl p-2 shadow-xl">
                            <DropdownMenuItem className="cursor-pointer font-medium rounded-lg" onClick={() => setViewDetails(g)}>{t("view_details", "View Details")}</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer font-medium rounded-lg" onClick={() => {
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
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer font-medium rounded-lg" onClick={() => setDeleteTargetId(g.id)}>{t("delete", "Delete")}</DropdownMenuItem>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] w-full max-w-xl p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-2xl font-semibold text-[#1F1E1C] dark:text-zinc-50 tracking-tight">
                {editingId ? 'Edit Grade Entry' : 'Quick Add Grade'}
              </h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Class</label>
                    <select
                      value={formData.class_name}
                      onChange={e => setFormData({ ...formData, class_name: e.target.value, student_id: '', student_name: '' })}
                      className={inputStyle}
                    >
                      <option value="">Select Class...</option>
                      {classList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Student</label>
                    <select
                      value={formData.student_id}
                      onChange={e => handleStudentSelect(e.target.value)}
                      disabled={!formData.class_name}
                      className={`${inputStyle} disabled:opacity-50`}
                    >
                      <option value="">Select Student...</option>
                      {availableStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Term</label>
                    <select
                      value={formData.term}
                      onChange={e => setFormData({ ...formData, term: e.target.value })}
                      className={inputStyle}
                    >
                      {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Exam Name</label>
                    <select
                      value={formData.exam_name}
                      onChange={e => setFormData({ ...formData, exam_name: e.target.value })}
                      className={inputStyle}
                    >
                      <option value="">Select Exam...</option>
                      {examList.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className={inputStyle}
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Date</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 bg-[#FCFAF7] dark:bg-zinc-950 p-5 border border-[#F0EBE1] dark:border-zinc-800 rounded-2xl">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 text-center uppercase tracking-widest">Score</label>
                    <Input
                      type="number"
                      value={formData.score}
                      onChange={e => setFormData({ ...formData, score: e.target.value })}
                      className={`${inputStyle} text-center font-bold text-xl h-14`}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 text-center uppercase tracking-widest">Max Score</label>
                    <Input
                      type="number"
                      value={formData.max_score}
                      onChange={e => setFormData({ ...formData, max_score: e.target.value })}
                      className={`${inputStyle} text-center font-bold text-xl h-14`}
                      placeholder="100"
                    />
                  </div>
                </div>

                {formData.score !== '' && (
                  <div className="flex items-center justify-center gap-4 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Grade:</span>
                    <span className={`inline-flex items-center justify-center px-4 py-1.5 font-bold text-lg rounded-full ${GRADE_COLORS[liveGrade]}`}>
                      {liveGrade}
                    </span>
                    <span className="text-sm font-semibold text-zinc-400">
                      ({formData.max_score > 0 ? Math.round((parseFloat(formData.score) / parseFloat(formData.max_score)) * 100) : 0}%)
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Remarks (Optional)</label>
                  <Input
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder={getGradeRemarks(liveGrade)}
                    className={inputStyle}
                  />
                </div>

              </div>
              <div className="flex gap-4 pt-6">
                <Button variant="outline" className={`${secondaryBtn} flex-1 h-12`} onClick={() => { setShowModal(false); setEditingId(null); setFormData(defaultForm); }} disabled={mutateRecord.isPending}>
                  Cancel
                </Button>
                <Button className={`${primaryBtn} flex-1 h-12`} onClick={handleAdd} disabled={mutateRecord.isPending}>
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
          <SheetContent className="overflow-y-auto w-full sm:max-w-md bg-white dark:bg-zinc-900 border-l border-[#F0EBE1] dark:border-zinc-800 shadow-2xl p-8">
            <SheetHeader>
              <SheetTitle className="text-2xl font-semibold text-[#1F1E1C] dark:text-zinc-50 tracking-tight">{t("grade_details", "Transcript")}</SheetTitle>
            </SheetHeader>
            {viewDetails && (
              <div className="mt-8 space-y-5">
                <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-6 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800">
                  <h3 className="text-2xl font-semibold text-[#1F1E1C] dark:text-zinc-50 tracking-tight mb-2">{viewDetails.student_name}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">{viewDetails.exam_name}</p>
                  <p className="text-zinc-500 text-sm font-medium">{viewDetails.term}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Class</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-base">{viewDetails.class_name}</p>
                  </div>
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Subject</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-base">{viewDetails.subject}</p>
                  </div>
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Date</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-base">{viewDetails.date}</p>
                  </div>
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Remarks</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-base truncate" title={viewDetails.remarks}>{viewDetails.remarks}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl flex flex-col justify-center border border-indigo-100 dark:border-indigo-800/50 col-span-2 text-center">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Final Grade</p>
                    <p className="font-bold text-5xl text-indigo-600 dark:text-indigo-400 tracking-tight">{viewDetails.grade}</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800 col-span-2 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t("score", "Score")}</p>
                      <p className="font-semibold text-3xl text-[#1F1E1C] dark:text-zinc-50 tracking-tight">
                        {viewDetails.score} <span className="text-zinc-400 text-xl font-medium">/ {viewDetails.max_score}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t("pct", "Percent")}</p>
                      <p className="font-semibold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-orange-500 tracking-tight">
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
    </div>
  );
}
