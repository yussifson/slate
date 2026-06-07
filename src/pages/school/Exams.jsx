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

const statusColors = {
  Upcoming: 'bg-emerald-100 dark:bg-emerald-950/50 text-[#1E3A8A] dark:text-emerald-400 dark:text-emerald-400',
  Ongoing: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 animate-pulse',
  Completed: 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400'
};

export default function Exams() {
  const { t } = useTranslation();
  // Supabase Real-time Sync Hooks
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('exam');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const exams = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Upcoming',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    class: 'Grade 9A',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM',
    duration: '2 Hours',
    venue: 'Main Auditorium'
  });

  const handleCreateExam = () => {
    if (!formData.subject.trim() || !formData.venue.trim()) {
      return toast.error("Please enter a subject name and classroom venue");
    }

    const payload = {
      subject: formData.subject,
      class: formData.class,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      venue: formData.venue
    };

    if (editingId) {
      mutateRecord.mutate({
        id: editingId,
        recordType: 'exam',
        payload,
        status: 'Upcoming',
        searchText: `${formData.subject} ${formData.class} ${formData.venue}`
      }, {
        onSuccess: () => {
          toast.success('Exam schedule updated successfully!');
          setShowModal(false);
          setEditingId(null);
          setFormData({
            subject: '',
            class: 'Grade 9A',
            date: new Date().toISOString().split('T')[0],
            time: '09:00 AM',
            duration: '2 Hours',
            venue: 'Main Auditorium'
          });
        },
        onError: (err) => {
          toast.error('Failed to update exam: ' + err.message);
        }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'exam',
        payload,
        status: 'Upcoming',
        searchText: `${formData.subject} ${formData.class} ${formData.venue}`
      }, {
        onSuccess: () => {
          toast.success('Exam schedule recorded successfully!');
          setShowModal(false);
          setFormData({
            subject: '',
            class: 'Grade 9A',
            date: new Date().toISOString().split('T')[0],
            time: '09:00 AM',
            duration: '2 Hours',
            venue: 'Main Auditorium'
          });
        },
        onError: (err) => {
          toast.error('Failed to schedule exam: ' + err.message);
        }
      });
    }
  };

  const handleUpdateStatus = (exam, newStatus) => {
    const updatedPayload = { ...exam };
    delete updatedPayload.id;
    delete updatedPayload.status;

    mutateRecord.mutate({
      id: exam.id,
      recordType: 'exam',
      payload: updatedPayload,
      status: newStatus,
      searchText: `${exam.subject} ${exam.class}`
    }, {
      onSuccess: () => {
        toast.success(`Exam status updated to ${newStatus}`);
      }
    });
  };

  const handleDeleteExam = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'exam' }, {
      onSuccess: () => {
        toast.success('Exam schedule removed successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove exam: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = exams.filter(e =>
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.class?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl school-heading font-extrabold tracking-tight">{t("exam_schedules", "Exam Schedules")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("plan_and_manage_upcoming_exami", "Plan and manage upcoming examinations")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold">
          <Plus className="w-4 h-4" /> {t("schedule_exam", "Schedule Exam")}
        </Button>
      </div>
      <div className="school-card p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search scheduled exams by subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
      </div>
      {isDbLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading_calendar", "Loading calendar...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-[#1E3A8A] dark:text-emerald-400" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_exams_scheduled", "No exams scheduled")}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">{t(
            "create_mid_terms_final_practic",
            "Create mid-terms, final practicals, invigilation venue cards using the top right button."
          )}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(exam => (
            <ExamGridCard
              key={exam.id}
              exam={exam}
              onView={() => setViewDetails(exam)}
              onStatusChange={handleUpdateStatus}
              onEdit={() => {
                setEditingId(exam.id);
                setFormData({
                  subject: exam.subject,
                  class: exam.class,
                  date: exam.date,
                  time: exam.time,
                  duration: exam.duration,
                  venue: exam.venue
                });
                setShowModal(true);
              }}
              onDelete={() => setDeleteTargetId(exam.id)}
            />
          ))}
        </div>
      ) : (
        <div className="school-card overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F4FF]/60 dark:bg-slate-800/40 border-b border-emerald-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("subject", "Subject")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("class", "Class")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("date_time", "Date & Time")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("venue", "Venue")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(exam => (
                  <tr key={exam.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-card-foreground">{exam.subject}</td>
                    <td className="px-6 py-4 font-medium"><Link to="/classes" className="text-[#1E3A8A] dark:text-emerald-400 hover:underline">{exam.class}</Link></td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(exam.date).toLocaleDateString()} at {exam.time}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{exam.venue}</td>
                    <td className="px-6 py-4">
                      <select
                        value={exam.status}
                        onChange={e => handleUpdateStatus(exam, e.target.value)}
                        className={`text-xs font-bold px-2 py-0.5 rounded border border-transparent bg-muted cursor-pointer`}
                      >
                        <option>{t("upcoming", "Upcoming")}</option>
                        <option>{t("ongoing", "Ongoing")}</option>
                        <option>{t("completed", "Completed")}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setViewDetails(exam)}>{t("view_details", "View Details")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingId(exam.id);
                            setFormData({
                              subject: exam.subject,
                              class: exam.class,
                              date: exam.date,
                              time: exam.time,
                              duration: exam.duration,
                              venue: exam.venue
                            });
                            setShowModal(true);
                          }}>{t("edit", "Edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 font-medium" onClick={() => setDeleteTargetId(exam.id)}>{t("delete", "Delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-[#1E3A8A]/10 w-full max-w-md p-6 space-y-4 border border-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#1E3A8A] dark:text-emerald-400" /> {editingId ? 'Edit Examination' : 'Schedule Examination'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("subject_name", "Subject Name")}</label>
                <Input
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Mathematics Paper II"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("target_class", "Target Class")}</label>
                  <select
                    value={formData.class}
                    onChange={e => setFormData({ ...formData, class: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option>{t("grade_7b", "Grade 7B")}</option>
                    <option>{t("grade_8c", "Grade 8C")}</option>
                    <option>{t("grade_9a", "Grade 9A")}</option>
                    <option>{t("grade_10b", "Grade 10B")}</option>
                    <option>{t("grade_11a", "Grade 11A")}</option>
                    <option>{t("grade_12a", "Grade 12A")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("scheduled_date", "Scheduled Date")}</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("time", "Time")}</label>
                  <Input
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1"
                    placeholder="09:00 AM"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("duration", "Duration")}</label>
                  <Input
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="mt-1"
                    placeholder="2 Hours"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("venue", "Venue")}</label>
                  <Input
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    className="mt-1"
                    placeholder="Lab 1"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={handleCreateExam}>{editingId ? 'Save Changes' : 'Save Exam'}</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteExam}
        title="Remove Exam Schedule"
        message="Are you sure you want to completely remove this exam schedule? This action is permanent."
      />
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("exam_details", "Exam Details")}</SheetTitle>
            <SheetDescription>{t(
              "read_only_view_of_the_examinat",
              "Read-only view of the examination schedule."
            )}</SheetDescription>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F0F4FF] dark:bg-emerald-900/20 dark:bg-emerald-950/50 flex items-center justify-center text-[#1E3A8A] dark:text-emerald-400 dark:text-emerald-400">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl school-heading font-bold tracking-tight">{viewDetails.subject}</h3>
                  <Link to="/classes" className="text-sm font-medium text-[#1E3A8A] dark:text-emerald-400 hover:underline">{viewDetails.class}</Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("date", "Date")}</p>
                  <p className="font-medium text-foreground">{new Date(viewDetails.date).toLocaleDateString()}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("time", "Time")}</p>
                  <p className="font-medium text-foreground">{viewDetails.time}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("duration", "Duration")}</p>
                  <p className="font-medium text-foreground">{viewDetails.duration}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("venue", "Venue")}</p>
                  <p className="font-medium text-foreground">{viewDetails.venue}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("status", "Status")}</p>
                  <p className="font-medium text-foreground mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[viewDetails.status]}`}>
                      {viewDetails.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
