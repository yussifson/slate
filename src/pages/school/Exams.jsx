import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, Search, MoreHorizontal, CheckCircle, Activity, Play, Check, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { motion } from 'framer-motion';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'ICT', 'Ghanaian Language', 'French', 'Religious & Moral Education', 'Physical Education', 'Creative Arts'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const STATUSES = ['Upcoming', 'Ongoing', 'Completed'];

const statusConfig = {
  Upcoming: { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', dot: 'bg-indigo-500' },
  Ongoing: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', dot: 'bg-amber-500' },
  Completed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
};

const defaultForm = { name: '', term: TERMS[0], subject: SUBJECTS[0], class_names: [], date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '11:00', venue: '', duration: '2 hours', total_marks: 100, status: 'Upcoming' };

export default function Exams() {
  const { t } = useTranslation();
  
  const { data: dbExams = [], isLoading: isDbLoading } = useIndustryRecords('school_exam');
  const { data: dbClasses = [] } = useIndustryRecords('school_class');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const classList = useMemo(() => dbClasses.map(c => c.data?.name).filter(Boolean), [dbClasses]);
  const exams = dbExams.map(r => ({ id: r.id, status: r.status || 'Upcoming', ...r.data }));

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTerm, setFilterTerm] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const filtered = exams.filter(e => {
    const matchStatus = filterStatus === 'All' || e.status === filterStatus;
    const matchTerm = filterTerm === 'All' || e.term === filterTerm;
    const matchClass = filterClass === 'All' || (e.class_names && e.class_names.includes(filterClass));
    const q = search.toLowerCase();
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q);
    return matchStatus && matchTerm && matchClass && matchSearch;
  });

  const sortedExams = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleClassToggle = (className) => {
    setFormData(prev => {
      const current = prev.class_names || [];
      return { ...prev, class_names: current.includes(className) ? current.filter(c => c !== className) : [...current, className] };
    });
  };

  const handleSaveExam = () => {
    if (!formData.name.trim()) return toast.error("Exam name is required");
    if (!formData.subject.trim()) return toast.error("Subject is required");
    if (!formData.venue.trim()) return toast.error("Venue is required");
    if (!formData.class_names || formData.class_names.length === 0) return toast.error("Select at least one class");
    const payload = { name: formData.name, term: formData.term, subject: formData.subject, class_names: formData.class_names, date: formData.date, start_time: formData.start_time, end_time: formData.end_time, duration: formData.duration, venue: formData.venue, total_marks: parseFloat(formData.total_marks) || 100, status: formData.status };
    const searchString = `${formData.name} ${formData.subject} ${formData.venue} ${formData.class_names.join(' ')}`;
    mutateRecord.mutate({ id: editingId || undefined, recordType: 'school_exam', payload, status: formData.status, searchText: searchString }, {
      onSuccess: () => { toast.success(editingId ? 'Exam updated!' : 'Exam scheduled!'); setShowModal(false); setEditingId(null); setFormData(defaultForm); },
      onError: (err) => toast.error('Failed to save: ' + err.message)
    });
  };

  const handleUpdateStatus = (exam, newStatus) => {
    const updatedPayload = { ...exam, status: newStatus };
    delete updatedPayload.id;
    mutateRecord.mutate({ id: exam.id, recordType: 'school_exam', payload: updatedPayload, status: newStatus, searchText: `${exam.name} ${exam.subject}` }, { onSuccess: () => toast.success(`Marked as ${newStatus}`) });
  };

  const handleDeleteExam = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'school_exam' }, { onSuccess: () => { toast.success('Exam removed'); setDeleteTargetId(null); } });
  };

  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Exam Calendar"
      subtitle="Schedule and manage upcoming examinations"
      breadcrumb={['School', 'Exams']}
      actions={
        <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Schedule Exam
        </Button>
      }
    >
      {/* Filters */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search exam, subject or venue..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="All">All Terms</option>
          {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="All">All Classes</option>
          {classList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="ml-auto text-sm text-muted-foreground">{sortedExams.length} exams</div>
      </div>

      {/* Exam Cards */}
      {isDbLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading exams...</div>
      ) : sortedExams.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No exams found</p>
          <button onClick={() => setShowModal(true)} className="text-sm text-indigo-600 hover:underline mt-2">Schedule your first exam →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedExams.map(exam => {
            const cfg = statusConfig[exam.status] || statusConfig.Upcoming;
            return (
              <motion.div key={exam.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                <div className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {exam.status}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setViewDetails(exam)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingId(exam.id); setFormData({ ...exam }); setShowModal(true); }}>Edit</DropdownMenuItem>
                        {exam.status === 'Upcoming' && <DropdownMenuItem onClick={() => handleUpdateStatus(exam, 'Ongoing')} className="text-amber-600">Mark Ongoing</DropdownMenuItem>}
                        {exam.status === 'Ongoing' && <DropdownMenuItem onClick={() => handleUpdateStatus(exam, 'Completed')} className="text-emerald-600">Mark Completed</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => setDeleteTargetId(exam.id)} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-bold text-base text-foreground leading-snug mb-1">{exam.name}</h3>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">{exam.subject} · {exam.term}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(exam.class_names || []).map(c => (
                      <span key={c} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium">{c}</span>
                    ))}
                  </div>

                  <div className="mt-auto bg-muted/30 rounded-lg p-3 space-y-1.5 border border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="w-3.5 h-3.5 text-indigo-500" />{exam.date}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5 text-amber-500" />{exam.start_time} – {exam.end_time} <span className="text-muted-foreground/60">({exam.duration})</span></div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5 text-emerald-500" /><span className="truncate">{exam.venue}</span></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 flex-shrink-0">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Exam' : 'Schedule Exam'}</h2>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exam Name *</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. Mid-Term Examination" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Term</label>
                  <select value={formData.term} onChange={e => setFormData({...formData, term: e.target.value})} className={`mt-1.5 ${inputCls}`}>{TERMS.map(t => <option key={t}>{t}</option>)}</select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className={`mt-1.5 ${inputCls}`}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Classes *</label>
                <div className="bg-muted/30 border border-border rounded-xl p-3 max-h-36 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1.5">
                    {classList.map(c => (
                      <label key={c} className="flex items-center gap-2 p-2 hover:bg-card rounded-lg cursor-pointer transition-colors">
                        <input type="checkbox" checked={(formData.class_names || []).includes(c)} onChange={() => handleClassToggle(c)} className="w-4 h-4 text-indigo-600 border-input rounded" />
                        <span className="text-sm font-medium">{c}</span>
                      </label>
                    ))}
                    {classList.length === 0 && <span className="text-sm text-muted-foreground col-span-2">No classes found.</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1.5 h-10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`mt-1.5 ${inputCls}`}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start</label>
                  <Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="mt-1.5 h-10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">End</label>
                  <Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="mt-1.5 h-10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</label>
                  <Input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="2 hours" className="mt-1.5 h-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Venue *</label>
                  <Input value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} placeholder="e.g. Main Hall" className="mt-1.5 h-10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Marks</label>
                  <Input type="number" value={formData.total_marks} onChange={e => setFormData({...formData, total_marks: e.target.value})} className="mt-1.5 h-10" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowModal(false)} disabled={mutateRecord.isPending}>Cancel</Button>
                <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveExam} disabled={mutateRecord.isPending}>
                  {mutateRecord.isPending ? 'Saving...' : editingId ? 'Update Exam' : 'Schedule Exam'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteExam} title="Remove Exam" message="Permanently delete this exam schedule?" />

      {/* Details Sheet */}
      <Sheet open={!!viewDetails} onOpenChange={open => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Exam Details</SheetTitle></SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${(statusConfig[viewDetails.status] || statusConfig.Upcoming).cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${(statusConfig[viewDetails.status] || statusConfig.Upcoming).dot}`} /> {viewDetails.status}
              </div>
              <h3 className="text-2xl font-bold text-foreground">{viewDetails.name}</h3>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold">{viewDetails.subject} · {viewDetails.term}</p>
              <div className="grid grid-cols-2 gap-3">
                {[['Date', viewDetails.date], ['Duration', viewDetails.duration], ['Total Marks', viewDetails.total_marks], ['Venue', viewDetails.venue]].map(([label, val]) => (
                  <div key={label} className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className="font-semibold text-foreground">{val}</p>
                  </div>
                ))}
                <div className="col-span-2 bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-2">Time</p>
                  <p className="font-bold text-foreground">{viewDetails.start_time} – {viewDetails.end_time}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Participating Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {(viewDetails.class_names || []).map(c => <span key={c} className="text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20">{c}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </SchoolPageShell>
  );
}
