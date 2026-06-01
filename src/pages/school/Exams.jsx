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
  Upcoming: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("exam_schedules", "Exam Schedules")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("plan_and_manage_upcoming_exami", "Plan and manage upcoming examinations")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> {t("schedule_exam", "Schedule Exam")}
        </Button>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search scheduled exams by subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      {isDbLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading_calendar", "Loading calendar...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-blue-600" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_exams_scheduled", "No exams scheduled")}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">{t(
            "create_mid_terms_final_practic",
            "Create mid-terms, final practicals, invigilation venue cards using the top right button."
          )}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(exam => {
            return (
              <div key={exam.id} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start mb-4">
                  <select
                    value={exam.status}
                    onChange={e => handleUpdateStatus(exam, e.target.value)}
                    className={`text-xs font-bold px-2 py-0.5 rounded border border-transparent bg-muted cursor-pointer`}
                  >
                    <option>{t("upcoming", "Upcoming")}</option>
                    <option>{t("ongoing", "Ongoing")}</option>
                    <option>{t("completed", "Completed")}</option>
                  </select>
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
                </div>
                <h3 className="text-lg font-bold text-card-foreground mb-1">{exam.subject}</h3>
                <p className="text-sm font-medium mb-4"><Link to="/classes" className="text-blue-600 hover:underline">{exam.class}</Link></p>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{exam.time} ({exam.duration})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{t("venue", "Venue:")} <strong>{exam.venue}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> {editingId ? 'Edit Examination' : 'Schedule Examination'}
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
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateExam}>{editingId ? 'Save Changes' : 'Save Exam'}</Button>
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
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">{viewDetails.subject}</h3>
                  <Link to="/classes" className="text-sm font-medium text-blue-600 hover:underline">{viewDetails.class}</Link>
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
