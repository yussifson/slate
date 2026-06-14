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
import { motion } from 'framer-motion';

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
  A: 'bg-emerald-200 text-emerald-900 border border-emerald-300',
  B: 'bg-teal-200 text-teal-900 border border-teal-300',
  C: 'bg-lime-200 text-lime-900 border border-lime-300',
  D: 'bg-yellow-200 text-yellow-900 border border-yellow-300',
  F: 'bg-orange-200 text-orange-900 border border-orange-300',
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
    <div className="space-y-6 font-dmsans p-4 bg-emerald-50 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight uppercase">{t("grades_results", "Grades & Transcript")}</h1>
          <p className="text-sm text-emerald-700 font-medium mt-1">{t("record_and_manage_student_exam", "Spreadsheet data entry & analytics")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none border-2 border-emerald-800 rounded-none font-bold uppercase tracking-wider">
          <Plus className="w-4 h-4" /> {t("add_grade_entry", "Quick Add")}
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-100 border-2 border-emerald-300 p-5 shadow-none rounded-none flex items-center gap-4 hover:bg-emerald-200 transition-colors">
          <div className="w-12 h-12 bg-emerald-500 flex items-center justify-center border-2 border-emerald-700 rounded-none">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-900">{avgScore}%</p>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">{t("average", "Average")}</p>
          </div>
        </div>
        <div className="bg-emerald-100 border-2 border-emerald-300 p-5 shadow-none rounded-none flex items-center gap-4 hover:bg-emerald-200 transition-colors">
          <div className="w-12 h-12 bg-emerald-500 flex items-center justify-center border-2 border-emerald-700 rounded-none">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-900">{highScore}%</p>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">{t("highest", "Highest")}</p>
          </div>
        </div>
        <div className="bg-emerald-100 border-2 border-emerald-300 p-5 shadow-none rounded-none flex items-center gap-4 hover:bg-emerald-200 transition-colors">
          <div className="w-12 h-12 bg-emerald-500 flex items-center justify-center border-2 border-emerald-700 rounded-none">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-900">{lowScore}%</p>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">{t("lowest", "Lowest")}</p>
          </div>
        </div>
        <div className="bg-emerald-100 border-2 border-emerald-300 p-5 shadow-none rounded-none flex items-center gap-4 hover:bg-emerald-200 transition-colors">
          <div className="w-12 h-12 bg-emerald-500 flex items-center justify-center border-2 border-emerald-700 rounded-none">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-900">{passRate}%</p>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">{t("pass_rate", "Pass Rate")}</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white border-2 border-emerald-200 p-4 shadow-none rounded-none flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <Input
            placeholder="Search by student, subject, or exam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-emerald-50 border-emerald-200 rounded-none shadow-none focus-visible:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...CLASS_LIST].map(c => (
            <button
              key={c}
              onClick={() => setFilterClass(c)}
              className={`px-4 py-2 border-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-none ${
                filterClass === c ? 'bg-emerald-600 text-white border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Spreadsheet Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white border-2 border-emerald-200 shadow-none rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-emerald-600 font-bold uppercase">{t("loading_grade_records", "Loading grade records...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-emerald-800 bg-emerald-50/50">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50 text-emerald-600" />
              <p className="font-black text-2xl uppercase">{t("no_grade_entries_found", "No data")}</p>
              <p className="text-sm mt-2 font-medium">{t("add_a_grade_entry_using_the_bu", "Enter grades using the Quick Add button.")}</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-emerald-100 border-b-2 border-emerald-300">
                <tr>
                  {['Student', 'Class', 'Subject', 'Exam', 'Date', 'Score', 'Grade', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black text-emerald-900 uppercase tracking-widest border-r-2 border-emerald-200 last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-emerald-100">
                {filtered.map((g, idx) => (
                  <tr key={g.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'} hover:bg-emerald-100 transition-colors`}>
                    <td className="px-4 py-3 border-r-2 border-emerald-100 font-bold text-emerald-900">{g.studentName}</td>
                    <td className="px-4 py-3 border-r-2 border-emerald-100 font-bold text-emerald-700">{g.className}</td>
                    <td className="px-4 py-3 border-r-2 border-emerald-100 text-emerald-800 font-medium">{g.subject}</td>
                    <td className="px-4 py-3 border-r-2 border-emerald-100 text-emerald-900 font-semibold">{g.examName}</td>
                    <td className="px-4 py-3 border-r-2 border-emerald-100 text-emerald-600 text-xs font-medium">{g.date}</td>
                    <td className="px-4 py-3 border-r-2 border-emerald-100 font-black text-emerald-900">
                      {g.score} <span className="text-emerald-500 font-bold text-xs">/ {g.maxScore}</span>
                    </td>
                    <td className="px-4 py-3 border-r-2 border-emerald-100">
                      <span className={`inline-flex items-center justify-center px-3 py-1 font-black text-xs uppercase tracking-wider ${GRADE_COLORS[g.grade] || 'bg-emerald-100 text-emerald-800'}`}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-none hover:bg-emerald-200 text-emerald-800">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white border-2 border-emerald-200 rounded-none shadow-none">
                          <DropdownMenuItem className="font-bold text-emerald-800 hover:bg-emerald-100 rounded-none" onClick={() => setViewDetails(g)}>{t("view_details", "View Details")}</DropdownMenuItem>
                          <DropdownMenuItem className="font-bold text-emerald-800 hover:bg-emerald-100 rounded-none" onClick={() => {
                            setEditingId(g.id);
                            setFormData({
                              studentName: g.studentName, className: g.className, subject: g.subject, examName: g.examName, date: g.date, score: g.score, maxScore: g.maxScore
                            });
                            setShowModal(true);
                          }}>{t("edit", "Edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-700 font-black hover:bg-red-100 rounded-none" onClick={() => setDeleteTargetId(g.id)}>{t("delete", "Delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Add Grade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border-4 border-emerald-500 shadow-none rounded-none w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2 border-b-2 border-emerald-200 pb-2">
              <Plus className="w-6 h-6 text-emerald-600" /> {editingId ? 'Edit Entry' : 'Quick Add'}
            </h2>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("student_name", "Student Name")}</label>
                <select
                  value={formData.studentName}
                  onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                  className="mt-1 w-full border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900 rounded-none focus:outline-none focus:border-emerald-500"
                >
                  <option value="">{t("select_student", "Select Student...")}</option>
                  {availableStudents.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("class", "Class")}</label>
                  <select
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    className="mt-1 w-full border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900 rounded-none focus:outline-none focus:border-emerald-500"
                  >
                    {CLASS_LIST.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("subject", "Subject")}</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1 w-full border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900 rounded-none focus:outline-none focus:border-emerald-500"
                  >
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("exam_name", "Exam Name")}</label>
                <Select value={formData.examName} onValueChange={(v) => setFormData({ ...formData, examName: v })}>
                  <SelectTrigger className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none shadow-none font-bold text-emerald-900"><SelectValue placeholder="Select Exam..." /></SelectTrigger>
                  <SelectContent className="border-2 border-emerald-200 rounded-none shadow-none bg-white">
                    {uniqueExams.map(e => <SelectItem key={e} value={e} className="font-bold text-emerald-800 focus:bg-emerald-100 rounded-none">{e}</SelectItem>)}
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
                <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("date", "Date")}</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none shadow-none font-bold text-emerald-900 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 bg-emerald-100 p-4 border-2 border-emerald-300">
                <div>
                  <label className="text-xs font-black text-emerald-800 uppercase tracking-widest">{t("score", "Score")}</label>
                  <Input
                    type="number"
                    value={formData.score}
                    onChange={e => setFormData({ ...formData, score: e.target.value })}
                    className="mt-1 border-2 border-emerald-400 bg-white rounded-none shadow-none font-black text-emerald-900 text-lg text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-800 uppercase tracking-widest">{t("max_score", "Max")}</label>
                  <Input
                    type="number"
                    value={formData.maxScore}
                    onChange={e => setFormData({ ...formData, maxScore: e.target.value })}
                    className="mt-1 border-2 border-emerald-400 bg-white rounded-none shadow-none font-black text-emerald-900 text-lg text-center"
                    placeholder="100"
                  />
                </div>
              </div>
              {formData.score !== '' && (
                <div className="flex items-center gap-2 justify-center py-2 bg-emerald-50 border-2 border-emerald-200">
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("grade", "Grade:")}</span>
                  <span className={`inline-flex items-center justify-center px-4 py-1 font-black text-lg border-2 ${GRADE_COLORS[liveGrade]}`}>
                    {liveGrade}
                  </span>
                  <span className="text-sm font-black text-emerald-600">
                    ({formData.maxScore > 0 ? Math.round((parseFloat(formData.score) / parseFloat(formData.maxScore)) * 100) : 0}%)
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-4 pt-4 border-t-2 border-emerald-200">
              <Button variant="outline" className="flex-1 rounded-none border-2 border-emerald-300 font-bold text-emerald-800 hover:bg-emerald-50 uppercase tracking-wider" onClick={() => { setShowModal(false); setEditingId(null); setFormData(defaultForm); }} disabled={mutateRecord.isPending}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider border-2 border-emerald-800" onClick={handleAdd} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </motion.div>
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
        <SheetContent className="overflow-y-auto w-full sm:max-w-md bg-emerald-50 border-l-4 border-emerald-500 shadow-none">
          <SheetHeader>
            <SheetTitle className="text-2xl font-black text-emerald-900 uppercase tracking-widest">{t("grade_details", "Transcript")}</SheetTitle>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-4 bg-white p-4 border-2 border-emerald-200">
                <div>
                  <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">{viewDetails.studentName}</h3>
                  <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs mt-1">{viewDetails.examName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-100 p-4 border-2 border-emerald-300">
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("class", "Class")}</p>
                  <p className="font-bold text-emerald-900 mt-1">{viewDetails.className}</p>
                </div>
                <div className="bg-emerald-100 p-4 border-2 border-emerald-300">
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("subject", "Subject")}</p>
                  <p className="font-bold text-emerald-900 mt-1">{viewDetails.subject}</p>
                </div>
                <div className="bg-emerald-100 p-4 border-2 border-emerald-300">
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("date", "Date")}</p>
                  <p className="font-bold text-emerald-900 mt-1">{viewDetails.date}</p>
                </div>
                <div className="bg-emerald-600 p-4 border-2 border-emerald-800 flex flex-col justify-center text-white">
                  <p className="text-xs font-black text-emerald-200 uppercase tracking-widest mb-1">{t("grade", "Grade")}</p>
                  <p className="font-black text-3xl">{viewDetails.grade}</p>
                </div>
                <div className="bg-white p-6 border-4 border-emerald-400 col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{t("score", "Score")}</p>
                    <p className="font-black text-4xl text-emerald-900">
                      {viewDetails.score} <span className="text-emerald-400 text-xl">/ {viewDetails.maxScore}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{t("pct", "Percent")}</p>
                    <p className="font-black text-4xl text-emerald-900">
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
