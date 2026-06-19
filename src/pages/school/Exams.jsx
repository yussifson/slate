import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, FileText, Trash2, Search, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

const statusColors = {
  Upcoming: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20',
  Ongoing: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20 animate-pulse',
  Completed: 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-primary/20'
};

export default function Exams() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('exam');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const exams = dbRecords.map(r => ({ id: r.id, status: r.status || 'Upcoming', ...r.data }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // Default to list for timeline

  const [formData, setFormData] = useState({
    subject: '', class: 'Grade 9A', date: new Date().toISOString().split('T')[0], time: '09:00 AM', duration: '2 Hours', venue: 'Main Auditorium'
  });

  const handleCreateExam = () => {
    if (!formData.subject.trim() || !formData.venue.trim()) return toast.error("Please enter a subject name and classroom venue");

    const payload = { subject: formData.subject, class: formData.class, date: formData.date, time: formData.time, duration: formData.duration, venue: formData.venue };

    if (editingId) {
      mutateRecord.mutate({ id: editingId, recordType: 'exam', payload, status: 'Upcoming', searchText: `${formData.subject} ${formData.class} ${formData.venue}` }, {
        onSuccess: () => { toast.success('Exam schedule updated successfully!'); setShowModal(false); setEditingId(null); setFormData({ subject: '', class: 'Grade 9A', date: new Date().toISOString().split('T')[0], time: '09:00 AM', duration: '2 Hours', venue: 'Main Auditorium' }); },
        onError: (err) => toast.error('Failed to update: ' + err.message)
      });
    } else {
      mutateRecord.mutate({ recordType: 'exam', payload, status: 'Upcoming', searchText: `${formData.subject} ${formData.class} ${formData.venue}` }, {
        onSuccess: () => { toast.success('Exam scheduled successfully!'); setShowModal(false); setFormData({ subject: '', class: 'Grade 9A', date: new Date().toISOString().split('T')[0], time: '09:00 AM', duration: '2 Hours', venue: 'Main Auditorium' }); },
        onError: (err) => toast.error('Failed to schedule: ' + err.message)
      });
    }
  };

  const handleUpdateStatus = (exam, newStatus) => {
    const updatedPayload = { ...exam }; delete updatedPayload.id; delete updatedPayload.status;
    mutateRecord.mutate({ id: exam.id, recordType: 'exam', payload: updatedPayload, status: newStatus, searchText: `${exam.subject} ${exam.class}` }, { onSuccess: () => toast.success(`Status updated`) });
  };

  const handleDeleteExam = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'exam' }, { onSuccess: () => { toast.success('Exam removed'); setDeleteTargetId(null); } });
  };

  const filtered = exams.filter(e => e.subject?.toLowerCase().includes(search.toLowerCase()) || e.class?.toLowerCase().includes(search.toLowerCase()));
  
  // Sort by date for timeline
  const sortedExams = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-primary/40 pb-4">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">{t("exam_schedules", "Exam Calendar")}</h1>
          <p className="text-[var(--color-text-secondary)] font-medium mt-1 text-sm">{t("plan_and_manage_upcoming_exami", "Timeline & Scheduling")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-full">
          <Plus className="w-4 h-4 mr-2" /> {t("schedule_exam", "Schedule Exam")}
        </Button>
      </div>

      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 rounded-md-[var(--radius-xl)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <Input placeholder="Search subject or class..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 rounded-full border-primary/30 bg-[var(--color-surface-1)] h-11" />
        </div>
        <div className="flex bg-[var(--color-surface-1)] p-1 rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shrink-0">
          <button onClick={() => setViewMode('grid')} className={`px-5 py-2 text-sm font-semibold transition-colors rounded-full ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}>Grid</button>
          <button onClick={() => setViewMode('list')} className={`px-5 py-2 text-sm font-semibold transition-colors rounded-full ${viewMode === 'list' ? 'bg-[var(--primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}>Timeline</button>
        </div>
      </div>

      {isDbLoading ? (
        <div className="py-12 text-center text-[var(--primary)] font-semibold text-lg animate-pulse">Loading calendar...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/30 rounded-md-[var(--radius-xl)]">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
          <p className="font-semibold text-lg text-[var(--color-text-primary)]">No exams scheduled</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(exam => (
            <div key={exam.id} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-5 hover:border-[var(--primary)]/50 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2.5 py-1 border-[0.5px] border-black/9 dark:border-white/8 rounded-full text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] ${statusColors[exam.status]}`}>{exam.status}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[var(--color-surface-2)] rounded-full text-[var(--color-text-secondary)]"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setViewDetails(exam)}>View Details</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => { setEditingId(exam.id); setFormData({ subject: exam.subject, class: exam.class, date: exam.date, time: exam.time, duration: exam.duration, venue: exam.venue }); setShowModal(true); }}>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)] cursor-pointer" onClick={() => setDeleteTargetId(exam.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-display font-semibold text-xl text-[var(--color-text-primary)] mb-1 tracking-tight">{exam.subject}</h3>
              <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[var(--tracking-widest)] mb-4 tracking-[0.04em]">{exam.class}</p>
              <div className="mt-auto space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium"><Calendar className="w-4 h-4 text-[var(--primary)]" /> {exam.date}</div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium"><Clock className="w-4 h-4 text-[var(--primary)]" /> {exam.time} <span className="text-[var(--color-text-tertiary)] text-xs tracking-[0.04em]">({exam.duration})</span></div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium"><MapPin className="w-4 h-4 text-[var(--primary)]" /> {exam.venue}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-primary/20">
          {sortedExams.map((exam, index) => (
            <div key={exam.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-[var(--color-surface-0)] bg-[var(--primary)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[var(--color-surface-0)] p-6 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] hover:border-[var(--primary)]/50 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-[var(--tracking-widest)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-full tracking-[0.04em]">{exam.date} • {exam.time}</span>
                  <span className={`px-2.5 py-1 border-[0.5px] border-black/9 dark:border-white/8 rounded-full text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] ${statusColors[exam.status]}`}>{exam.status}</span>
                </div>
                <h3 className="font-display font-semibold text-xl text-[var(--color-text-primary)] tracking-tight">{exam.subject}</h3>
                <p className="font-medium text-[var(--color-text-secondary)] text-sm mb-4 mt-1">{exam.class}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-1)] p-3 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--primary)]" /> {exam.duration}</span>
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--primary)]" /> {exam.venue}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-primary/10 flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="rounded-full border-primary/30" onClick={() => { setEditingId(exam.id); setFormData({ ...exam }); setShowModal(true); }}>Edit</Button>
                  <Button variant="ghost" size="sm" className="rounded-full text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10" onClick={() => setDeleteTargetId(exam.id)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto rounded-md-[var(--radius-xl)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl">
            <h2 className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">
              {editingId ? 'Edit Exam' : 'Schedule Exam'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Subject Name</label>
                <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Class</label>
                  <select value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })} className="w-full flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10">
                    {['Grade 7B','Grade 8C','Grade 9A','Grade 10B','Grade 11A','Grade 12A'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Date</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Time</label>
                  <Input value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Duration</label>
                  <Input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Venue</label>
                  <Input value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="rounded-md-[var(--radius-lg)]" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-full border-primary/30" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white" onClick={handleCreateExam}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteExam} title="Remove Exam" message="Permanently delete this schedule?" />
    </div>
  );
}
