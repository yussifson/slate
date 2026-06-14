import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, FileText, Trash2, Search, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { ViewModeToggle, ExamGridCard } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { motion } from 'framer-motion';

const statusColors = {
  Upcoming: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Ongoing: 'bg-yellow-200 text-yellow-900 border-yellow-400 animate-pulse',
  Completed: 'bg-slate-200 text-slate-800 border-slate-300'
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
    <div className="space-y-6 font-dmsans p-4 bg-emerald-50 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight uppercase">{t("exam_schedules", "Exam Calendar")}</h1>
          <p className="text-sm text-emerald-700 font-medium mt-1">{t("plan_and_manage_upcoming_exami", "Timeline & Scheduling")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none border-2 border-emerald-800 rounded-none font-bold uppercase tracking-wider">
          <Plus className="w-4 h-4" /> {t("schedule_exam", "Schedule Exam")}
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white border-2 border-emerald-200 p-4 shadow-none rounded-none flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <Input placeholder="Search subject or class..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-emerald-50 border-emerald-200 rounded-none shadow-none focus-visible:ring-emerald-500" />
        </div>
        <div className="flex bg-emerald-100 p-1 border-2 border-emerald-200">
          <button onClick={() => setViewMode('grid')} className={`px-4 py-1 text-xs font-black uppercase tracking-wider ${viewMode === 'grid' ? 'bg-emerald-600 text-white border-2 border-emerald-800' : 'text-emerald-700 border-2 border-transparent hover:bg-emerald-200'}`}>Grid</button>
          <button onClick={() => setViewMode('list')} className={`px-4 py-1 text-xs font-black uppercase tracking-wider ${viewMode === 'list' ? 'bg-emerald-600 text-white border-2 border-emerald-800' : 'text-emerald-700 border-2 border-transparent hover:bg-emerald-200'}`}>Timeline</button>
        </div>
      </motion.div>

      {isDbLoading ? (
        <div className="py-12 text-center text-emerald-600 font-bold uppercase">Loading calendar...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-emerald-800 bg-emerald-50/50 border-2 border-emerald-200">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50 text-emerald-600" />
          <p className="font-black text-2xl uppercase">No exams scheduled</p>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(exam => (
            <div key={exam.id} className="bg-white border-2 border-emerald-300 shadow-none rounded-none p-5 hover:bg-emerald-50 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2 py-1 border-2 text-[10px] font-black uppercase tracking-widest ${statusColors[exam.status]}`}>{exam.status}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-emerald-200 rounded-none"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-2 border-emerald-300 rounded-none shadow-none">
                    <DropdownMenuItem className="font-bold text-emerald-800 rounded-none" onClick={() => setViewDetails(exam)}>View Details</DropdownMenuItem>
                    <DropdownMenuItem className="font-bold text-emerald-800 rounded-none" onClick={() => { setEditingId(exam.id); setFormData({ subject: exam.subject, class: exam.class, date: exam.date, time: exam.time, duration: exam.duration, venue: exam.venue }); setShowModal(true); }}>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-700 font-black rounded-none" onClick={() => setDeleteTargetId(exam.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-black text-xl text-emerald-900 mb-1">{exam.subject}</h3>
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{exam.class}</p>
              <div className="mt-4 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium"><Calendar className="w-4 h-4 text-emerald-500" /> {exam.date}</div>
                <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium"><Clock className="w-4 h-4 text-emerald-500" /> {exam.time} ({exam.duration})</div>
                <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium"><MapPin className="w-4 h-4 text-emerald-500" /> {exam.venue}</div>
              </div>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-emerald-300">
          {sortedExams.map((exam, index) => (
            <div key={exam.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-emerald-50 bg-emerald-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-none z-10">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 border-2 border-emerald-300 shadow-none hover:bg-emerald-50 transition-colors rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{exam.date} • {exam.time}</span>
                  <span className={`px-2 py-0.5 border-2 text-[10px] font-black uppercase tracking-widest ${statusColors[exam.status]}`}>{exam.status}</span>
                </div>
                <h3 className="font-black text-xl text-emerald-900">{exam.subject}</h3>
                <p className="font-bold text-emerald-700 mb-3">{exam.class}</p>
                <div className="flex items-center gap-4 text-sm font-medium text-emerald-800">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {exam.duration}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {exam.venue}</span>
                </div>
                <div className="mt-4 pt-3 border-t-2 border-emerald-100 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="font-bold text-emerald-700 hover:bg-emerald-200 rounded-none" onClick={() => { setEditingId(exam.id); setFormData({ ...exam }); setShowModal(true); }}>Edit</Button>
                  <Button variant="ghost" size="sm" className="font-bold text-red-600 hover:bg-red-100 rounded-none" onClick={() => setDeleteTargetId(exam.id)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white border-4 border-emerald-500 w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto rounded-none">
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2 border-b-2 border-emerald-200 pb-2">
              <Plus className="w-6 h-6 text-emerald-600" /> {editingId ? 'Edit Exam' : 'Schedule Exam'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Subject Name</label>
                <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold text-emerald-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Class</label>
                  <select value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })} className="mt-1 w-full border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900 rounded-none focus:outline-none">
                    {['Grade 7B','Grade 8C','Grade 9A','Grade 10B','Grade 11A','Grade 12A'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Date</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold text-emerald-900" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Time</label>
                  <Input value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold text-emerald-900" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Duration</label>
                  <Input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold text-emerald-900" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Venue</label>
                  <Input value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold text-emerald-900" />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t-2 border-emerald-200">
              <Button variant="outline" className="flex-1 rounded-none border-2 border-emerald-300 font-bold text-emerald-800 hover:bg-emerald-50 uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase border-2 border-emerald-800" onClick={handleCreateExam}>Save</Button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteExam} title="Remove Exam" message="Permanently delete this schedule?" />
    </div>
  );
}
