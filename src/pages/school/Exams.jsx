import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, Search, MoreVertical, CheckCircle, Activity, Play, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';

const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'Social Studies', 
  'ICT', 'Ghanaian Language', 'French', 
  'Religious & Moral Education', 'Physical Education', 'Creative Arts'
];

const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const STATUSES = ['Upcoming', 'Ongoing', 'Completed'];

const statusColors = {
  Upcoming: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20',
  Ongoing: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20 animate-pulse',
  Completed: 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-primary/20'
};

const defaultForm = {
  name: '',
  term: TERMS[0],
  subject: SUBJECTS[0],
  class_names: [],
  date: new Date().toISOString().split('T')[0],
  start_time: '09:00',
  end_time: '11:00',
  venue: '',
  duration: '2 hours',
  total_marks: 100,
  status: 'Upcoming'
};

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
    const matchSearch = !q || 
      e.name?.toLowerCase().includes(q) || 
      e.subject?.toLowerCase().includes(q) || 
      e.venue?.toLowerCase().includes(q);
      
    return matchStatus && matchTerm && matchClass && matchSearch;
  });

  const handleClassToggle = (className) => {
    setFormData(prev => {
      const current = prev.class_names || [];
      if (current.includes(className)) {
        return { ...prev, class_names: current.filter(c => c !== className) };
      } else {
        return { ...prev, class_names: [...current, className] };
      }
    });
  };

  const handleSaveExam = () => {
    if (!formData.name.trim()) return toast.error("Exam name is required");
    if (!formData.subject.trim()) return toast.error("Subject is required");
    if (!formData.venue.trim()) return toast.error("Venue is required");
    if (!formData.class_names || formData.class_names.length === 0) return toast.error("Select at least one class");

    const payload = { 
      name: formData.name, 
      term: formData.term,
      subject: formData.subject, 
      class_names: formData.class_names, 
      date: formData.date, 
      start_time: formData.start_time, 
      end_time: formData.end_time,
      duration: formData.duration, 
      venue: formData.venue,
      total_marks: parseFloat(formData.total_marks) || 100,
      status: formData.status
    };

    const searchString = `${formData.name} ${formData.subject} ${formData.venue} ${formData.class_names.join(' ')}`;

    mutateRecord.mutate({ 
      id: editingId || undefined, 
      recordType: 'school_exam', 
      payload, 
      status: formData.status, 
      searchText: searchString 
    }, {
      onSuccess: () => { 
        toast.success(editingId ? 'Exam updated successfully!' : 'Exam scheduled successfully!'); 
        setShowModal(false); 
        setEditingId(null); 
        setFormData(defaultForm); 
      },
      onError: (err) => toast.error('Failed to save: ' + err.message)
    });
  };

  const handleUpdateStatus = (exam, newStatus) => {
    const updatedPayload = { ...exam, status: newStatus }; 
    delete updatedPayload.id; 
    
    const searchString = `${exam.name} ${exam.subject} ${exam.venue} ${(exam.class_names || []).join(' ')}`;
    
    mutateRecord.mutate({ 
      id: exam.id, 
      recordType: 'school_exam', 
      payload: updatedPayload, 
      status: newStatus, 
      searchText: searchString 
    }, { onSuccess: () => toast.success(`Exam marked as ${newStatus}`) });
  };

  const handleDeleteExam = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'school_exam' }, { 
      onSuccess: () => { toast.success('Exam removed'); setDeleteTargetId(null); } 
    });
  };

  const sortedExams = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-primary/40 pb-4">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">{t("exam_schedules", "Exam Calendar")}</h1>
          <p className="text-[var(--color-text-secondary)] font-medium mt-1 text-sm">{t("plan_and_manage_upcoming_exami", "Schedule and manage exams")}</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setShowModal(true); }} className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-full">
          <Plus className="w-4 h-4 mr-2" /> {t("schedule_exam", "Schedule Exam")}
        </Button>
      </div>

      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 rounded-md-[var(--radius-xl)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <Input placeholder="Search exam, subject or venue..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 rounded-full border-primary/30 bg-[var(--color-surface-1)] h-11" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="h-10 rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
        </div>
      </div>

      {isDbLoading ? (
        <div className="py-12 text-center text-[var(--primary)] font-semibold text-lg animate-pulse">Loading exams...</div>
      ) : sortedExams.length === 0 ? (
        <div className="py-16 text-center bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/30 rounded-md-[var(--radius-xl)]">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
          <p className="font-semibold text-lg text-[var(--color-text-primary)]">No exams found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedExams.map(exam => (
            <div key={exam.id} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-5 hover:border-[var(--primary)]/50 transition-colors flex flex-col shadow-sm hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div className={`px-2.5 py-1 border-[0.5px] border-black/9 dark:border-white/8 rounded-full text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] ${statusColors[exam.status] || statusColors.Upcoming}`}>{exam.status}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[var(--color-surface-2)] rounded-full text-[var(--color-text-secondary)]"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setViewDetails(exam)}>View Details</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => { 
                      setEditingId(exam.id); 
                      setFormData({ ...exam }); 
                      setShowModal(true); 
                    }}>Edit</DropdownMenuItem>
                    
                    {exam.status === 'Upcoming' && (
                      <DropdownMenuItem className="cursor-pointer text-[var(--color-warning)]" onClick={() => handleUpdateStatus(exam, 'Ongoing')}>
                        <Play className="w-4 h-4 mr-2" /> Mark Ongoing
                      </DropdownMenuItem>
                    )}
                    {exam.status === 'Ongoing' && (
                      <DropdownMenuItem className="cursor-pointer text-[var(--color-success)]" onClick={() => handleUpdateStatus(exam, 'Completed')}>
                        <Check className="w-4 h-4 mr-2" /> Mark Completed
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)] cursor-pointer" onClick={() => setDeleteTargetId(exam.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <h3 className="font-display font-semibold text-xl text-[var(--color-text-primary)] mb-1 tracking-tight">{exam.name}</h3>
              <p className="text-sm font-medium text-[var(--primary)] mb-3">{exam.subject} &bull; {exam.term}</p>
              
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] mb-1.5">Classes</p>
                <div className="flex flex-wrap gap-1">
                  {(exam.class_names || []).map(c => (
                    <span key={c} className="text-xs bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              </div>

              <div className="mt-auto space-y-2.5 bg-[var(--color-surface-1)] p-3 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 border-primary/10">
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium"><Calendar className="w-4 h-4 text-[var(--primary)]" /> {exam.date}</div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium"><Clock className="w-4 h-4 text-[var(--primary)]" /> {exam.start_time} - {exam.end_time} <span className="text-[var(--color-text-tertiary)] text-xs">({exam.duration})</span></div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium"><MapPin className="w-4 h-4 text-[var(--primary)]" /> {exam.venue}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto rounded-md-[var(--radius-xl)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl">
            <h2 className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">
              {editingId ? 'Edit Exam' : 'Schedule Exam'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Exam Name</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Mid-Term Examination" className="rounded-md-[var(--radius-lg)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Term</label>
                  <select value={formData.term} onChange={e => setFormData({ ...formData, term: e.target.value })} className="w-full h-10 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {TERMS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full h-10 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Classes</label>
                <div className="flex flex-wrap gap-2 p-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 border-primary/20 rounded-md-[var(--radius-lg)] max-h-32 overflow-y-auto">
                  {classList.map(c => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[var(--color-surface-2)] p-1 rounded pr-2">
                      <input 
                        type="checkbox" 
                        checked={(formData.class_names || []).includes(c)}
                        onChange={() => handleClassToggle(c)}
                        className="rounded border-primary/30 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      {c}
                    </label>
                  ))}
                  {classList.length === 0 && <span className="text-sm text-[var(--color-text-tertiary)]">No classes found. Add classes first.</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Date</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full h-10 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Start Time</label>
                  <Input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">End Time</label>
                  <Input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Duration</label>
                  <Input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 2 hours" className="rounded-md-[var(--radius-lg)]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Venue</label>
                  <Input value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} placeholder="e.g. Main Hall" className="rounded-md-[var(--radius-lg)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Total Marks</label>
                  <Input type="number" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
                </div>
              </div>

            </div>
            <div className="flex gap-3 pt-4 border-t border-primary/10 mt-6">
              <Button variant="outline" className="flex-1 rounded-full border-primary/30" onClick={() => setShowModal(false)} disabled={mutateRecord.isPending}>Cancel</Button>
              <Button className="flex-1 rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white" onClick={handleSaveExam} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : 'Save Exam'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteExam} title="Remove Exam" message="Permanently delete this exam schedule?" />

      {/* View Details Sheet */}
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md bg-[var(--color-surface-0)] border-l border-primary/20 shadow-xl">
          <SheetHeader>
            <SheetTitle className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">Exam Details</SheetTitle>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-8 space-y-5">
              <div className="bg-[var(--color-surface-1)] p-6 rounded-md-[var(--radius-xl)] border-[0.5px] border-black/9 border-primary/20">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2.5 py-1 border-[0.5px] border-black/9 rounded-full text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] ${statusColors[viewDetails.status] || statusColors.Upcoming}`}>{viewDetails.status}</span>
                </div>
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight mb-1">{viewDetails.name}</h3>
                <p className="text-[var(--primary)] font-semibold text-sm">{viewDetails.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Term</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.term}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Total Marks</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.total_marks}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 border-primary/10 col-span-2">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Participating Classes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewDetails.class_names || []).map(c => (
                      <span key={c} className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] font-medium px-2 py-1 rounded">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Date</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.date}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 border-primary/10">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Duration</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.duration}</p>
                </div>
                <div className="bg-[var(--color-surface-1)] p-4 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 border-primary/10 col-span-2">
                  <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Time & Venue</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{viewDetails.start_time} - {viewDetails.end_time} • {viewDetails.venue}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
