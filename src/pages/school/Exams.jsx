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
import './SchoolTheme.css';

const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'Social Studies', 
  'ICT', 'Ghanaian Language', 'French', 
  'Religious & Moral Education', 'Physical Education', 'Creative Arts'
];

const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const STATUSES = ['Upcoming', 'Ongoing', 'Completed'];

const statusColors = {
  Upcoming: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800/50',
  Ongoing: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800/50 animate-pulse',
  Completed: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
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

  const cardStyle = "bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300";
  const primaryBtn = "bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]";
  const secondaryBtn = "bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 text-[#1F1E1C] dark:text-zinc-50 border border-[#E4DFD5] dark:border-zinc-700 rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02]";
  const inputStyle = "rounded-xl border-[1.5px] border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none w-full px-4 h-11 text-sm";

  return (
    <div className="school-theme-root bg-[#FCFAF7] dark:bg-zinc-950 min-h-screen text-[#1F1E1C] dark:text-zinc-50 font-sans p-4 md:p-8">
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#F0EBE1] dark:border-zinc-800 pb-6">
          <div>
            <h1 className="font-semibold text-4xl text-[#1F1E1C] dark:text-zinc-50 tracking-tight">{t("exam_schedules", "Exam Calendar")}</h1>
            <p className="text-zinc-500 font-medium mt-2">{t("plan_and_manage_upcoming_exami", "Schedule and manage exams")}</p>
          </div>
          <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setShowModal(true); }} className={primaryBtn}>
            <Plus className="w-5 h-5 mr-2" /> {t("schedule_exam", "Schedule Exam")}
          </Button>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input placeholder="Search exam, subject or venue..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputStyle} pl-12 h-12 rounded-full`} />
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className={`${inputStyle} rounded-full`}
            >
              <option value="All">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              value={filterTerm} 
              onChange={e => setFilterTerm(e.target.value)}
              className={`${inputStyle} rounded-full`}
            >
              <option value="All">All Terms</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select 
              value={filterClass} 
              onChange={e => setFilterClass(e.target.value)}
              className={`${inputStyle} rounded-full`}
            >
              <option value="All">All Classes</option>
              {classList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {isDbLoading ? (
          <div className="py-12 text-center text-indigo-600 font-semibold text-lg animate-pulse">Loading exams...</div>
        ) : sortedExams.length === 0 ? (
          <div className="py-16 text-center bg-[#FCFAF7] dark:bg-zinc-950 border border-[#F0EBE1] dark:border-zinc-800 border-dashed rounded-[2rem]">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
            <p className="font-semibold text-xl text-zinc-600 dark:text-zinc-400">No exams found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedExams.map(exam => (
              <div key={exam.id} className={`${cardStyle} flex flex-col h-full`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColors[exam.status] || statusColors.Upcoming}`}>{exam.status}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-xl p-2 shadow-xl w-48">
                      <DropdownMenuItem className="cursor-pointer font-medium rounded-lg" onClick={() => setViewDetails(exam)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer font-medium rounded-lg" onClick={() => { 
                        setEditingId(exam.id); 
                        setFormData({ ...exam }); 
                        setShowModal(true); 
                      }}>Edit</DropdownMenuItem>
                      
                      {exam.status === 'Upcoming' && (
                        <DropdownMenuItem className="cursor-pointer text-orange-600 font-medium rounded-lg" onClick={() => handleUpdateStatus(exam, 'Ongoing')}>
                          <Play className="w-4 h-4 mr-2" /> Mark Ongoing
                        </DropdownMenuItem>
                      )}
                      {exam.status === 'Ongoing' && (
                        <DropdownMenuItem className="cursor-pointer text-emerald-600 font-medium rounded-lg" onClick={() => handleUpdateStatus(exam, 'Completed')}>
                          <Check className="w-4 h-4 mr-2" /> Mark Completed
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer font-medium rounded-lg" onClick={() => setDeleteTargetId(exam.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="font-semibold text-2xl text-[#1F1E1C] dark:text-zinc-50 mb-1 tracking-tight line-clamp-2">{exam.name}</h3>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4">{exam.subject} &bull; {exam.term}</p>
                
                <div className="mb-6 flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {(exam.class_names || []).map(c => (
                      <span key={c} className="text-xs bg-[#FCFAF7] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full border border-[#F0EBE1] dark:border-zinc-700 font-medium">{c}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto space-y-3 bg-[#FCFAF7] dark:bg-zinc-950 p-4 rounded-[1.5rem] border border-[#F0EBE1] dark:border-zinc-800">
                  <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium"><Calendar className="w-4 h-4 text-indigo-500" /> {exam.date}</div>
                  <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium"><Clock className="w-4 h-4 text-orange-500" /> {exam.start_time} - {exam.end_time} <span className="text-zinc-400 text-xs font-bold">({exam.duration})</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium"><MapPin className="w-4 h-4 text-emerald-500" /> <span className="truncate">{exam.venue}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
            <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 w-full max-w-xl p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl">
              <h2 className="text-2xl font-semibold text-[#1F1E1C] dark:text-zinc-50 tracking-tight">
                {editingId ? 'Edit Exam' : 'Schedule Exam'}
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Exam Name</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Mid-Term Examination" className={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Term</label>
                    <select value={formData.term} onChange={e => setFormData({ ...formData, term: e.target.value })} className={inputStyle}>
                      {TERMS.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Subject</label>
                    <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className={inputStyle}>
                      {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Classes</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-[#FCFAF7] dark:bg-zinc-950 border border-[#F0EBE1] dark:border-zinc-800 rounded-2xl max-h-40 overflow-y-auto">
                    {classList.map(c => (
                      <label key={c} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white dark:hover:bg-zinc-900 p-2 rounded-xl transition-colors w-full sm:w-auto">
                        <input 
                          type="checkbox" 
                          checked={(formData.class_names || []).includes(c)}
                          onChange={() => handleClassToggle(c)}
                          className="rounded border-[#E4DFD5] text-indigo-600 focus:ring-indigo-600 h-5 w-5"
                        />
                        <span className="font-medium text-[#1F1E1C] dark:text-zinc-50">{c}</span>
                      </label>
                    ))}
                    {classList.length === 0 && <span className="text-sm text-zinc-500">No classes found. Add classes first.</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Date</label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={inputStyle}>
                      {STATUSES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Start</label>
                    <Input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className={inputStyle} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">End</label>
                    <Input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className={inputStyle} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Duration</label>
                    <Input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 2 hours" className={inputStyle} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Venue</label>
                    <Input value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} placeholder="e.g. Main Hall" className={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-widest">Total Marks</label>
                    <Input type="number" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: e.target.value })} className={inputStyle} />
                  </div>
                </div>

              </div>
              <div className="flex gap-4 pt-6 mt-6">
                <Button variant="outline" className={`${secondaryBtn} flex-1 h-14`} onClick={() => setShowModal(false)} disabled={mutateRecord.isPending}>Cancel</Button>
                <Button className={`${primaryBtn} flex-1 h-14`} onClick={handleSaveExam} disabled={mutateRecord.isPending}>
                  {mutateRecord.isPending ? 'Saving...' : 'Save Exam'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteExam} title="Remove Exam" message="Permanently delete this exam schedule?" />

        {/* View Details Sheet */}
        <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
          <SheetContent className="overflow-y-auto w-full sm:max-w-md bg-white dark:bg-zinc-900 border-l border-[#F0EBE1] dark:border-zinc-800 shadow-2xl p-8">
            <SheetHeader>
              <SheetTitle className="text-2xl font-semibold text-[#1F1E1C] dark:text-zinc-50 tracking-tight">Exam Details</SheetTitle>
            </SheetHeader>
            {viewDetails && (
              <div className="mt-8 space-y-6">
                <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-6 rounded-[1.5rem] border border-[#F0EBE1] dark:border-zinc-800">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColors[viewDetails.status] || statusColors.Upcoming}`}>{viewDetails.status}</span>
                  </div>
                  <h3 className="text-3xl font-semibold text-[#1F1E1C] dark:text-zinc-50 tracking-tight mb-2">{viewDetails.name}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold text-base">{viewDetails.subject}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-[1.5rem] border border-[#F0EBE1] dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Term</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-lg">{viewDetails.term}</p>
                  </div>
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-[1.5rem] border border-[#F0EBE1] dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Marks</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-lg">{viewDetails.total_marks}</p>
                  </div>
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-[1.5rem] border border-[#F0EBE1] dark:border-zinc-800 col-span-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Participating Classes</p>
                    <div className="flex flex-wrap gap-2">
                      {(viewDetails.class_names || []).map(c => (
                        <span key={c} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800/50">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-[1.5rem] border border-[#F0EBE1] dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Date</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-base">{viewDetails.date}</p>
                  </div>
                  <div className="bg-[#FCFAF7] dark:bg-zinc-950 p-5 rounded-[1.5rem] border border-[#F0EBE1] dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Duration</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-base">{viewDetails.duration}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-800/50 col-span-2">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Time & Venue</p>
                    <p className="font-semibold text-[#1F1E1C] dark:text-zinc-50 text-lg">{viewDetails.start_time} - {viewDetails.end_time} • {viewDetails.venue}</p>
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
