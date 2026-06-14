import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, LayoutGrid, MoreVertical, Edit2} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Link} from 'react-router-dom';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { useMeeting} from '@/hooks/integrations/useMeeting';
import { useCalendar} from '@/hooks/integrations/useCalendar';
import { useCompanyId} from '@/hooks/useCompanyId';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useQuery} from '@tanstack/react-query';
import { base44} from '@/api/base44Client';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Chemistry', 'Physics', 'Geography', 'ICT', 'P.E.', 'Art'];

const SLOT_COLORS = [
 'bg-orange-100 text-orange-800 border-primary/20',
 'bg-slate-100 text-primary/80 border-primary/20',
 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/30 text-primary/80 border-primary/20',
 'bg-amber-100 text-amber-800 border-amber-200',
 'bg-slate-100 text-primary/80 border-primary/20',
 'bg-slate-100 text-primary/80 border-primary/20',
 'bg-slate-100 text-primary/80 border-primary/20',
 'bg-orange-100 text-orange-800 border-orange-200',
 'bg-slate-100 text-primary/80 border-primary/20',
 'bg-lime-100 text-lime-800 border-lime-200',
];

// Consistent color per subject name
function subjectColor(subject) {
 const idx = SUBJECTS.indexOf(subject);
 return SLOT_COLORS[(idx >= 0 ? idx : subject?.charCodeAt(0) || 0) % SLOT_COLORS.length];
}

const defaultForm = {
 className: 'Grade 9A',
 day: 'Monday',
 period: '1',
 startTime: '08:00',
 endTime: '09:00',
 subject: 'Mathematics',
 teacher: 'Mr. John Doe',
 room: '',
};

export default function Timetable() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const [selectedClass, setSelectedClass] = useState('Grade 9A');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editingId, setEditingId] = useState(null);
 const [formData, setFormData] = useState({ ...defaultForm, createZoomLink: false, addCalendar: false});

 const { generateMeetingLink, isGenerating} = useMeeting();
 const { syncEvent, isSyncing} = useCalendar();
 const { data: dbRecords = [], isLoading} = useIndustryRecords('timetable_slot');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const { data: teamRecords = []} = useQuery({
 queryKey: ['employees', companyId],
 queryFn: () => base44.entities.Employee.filter({ company_id: companyId}),
 enabled: !!companyId
});
 
 const { data: classRecords = []} = useQuery({
 queryKey: ['cases', companyId],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId}),
 enabled: !!companyId
});

 const CLASS_LIST = classRecords.length > 0 ? [...new Set(classRecords.map(r => r.title))] : ['Grade 7B', 'Grade 8C', 'Grade 9A'];
 const TEACHERS = teamRecords.length > 0 ? [...new Set(teamRecords.map(r => r.full_name))] : ['Mr. John Doe', 'Mrs. Jane Smith'];

 const slots = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Active',
 ...r.data,
}));

 // Filter slots by selected class
 const classSlots = slots.filter(s => s.className === selectedClass);

 // Build a lookup: day -> period -> slot
 const slotGrid = {};
 classSlots.forEach(s => {
 if (!slotGrid[s.day]) slotGrid[s.day] = {};
 slotGrid[s.day][s.period] = s;
});

 const handleAddSlot = async () => {
 if (!formData.room.trim()) return toast.error('Please enter a room number.');
 const period = parseInt(formData.period);
 if (isNaN(period) || period < 1 || period > 8) return toast.error('Period must be 1–8.');

 // Check for class conflict
 const classConflict = classSlots.find(s => s.day === formData.day && String(s.period) === String(formData.period) && s.id !== editingId);
 if (classConflict) return toast.error(`A slot already exists for ${formData.day} Period ${formData.period} in ${formData.className}.`);

 // Check for teacher double-booking
 const teacherConflict = slots.find(s => 
 s.day === formData.day && 
 String(s.period) === String(formData.period) && 
 s.teacher === formData.teacher && 
 s.id !== editingId
 );
 if (teacherConflict) return toast.error(`Conflict! ${formData.teacher} is already teaching ${teacherConflict.subject} in ${teacherConflict.className} on ${formData.day} Period ${formData.period}.`);

 const payload = {
 className: formData.className,
 day: formData.day,
 period,
 startTime: formData.startTime,
 endTime: formData.endTime,
 subject: formData.subject,
 teacher: formData.teacher,
 room: formData.room.trim(),
};

 if (formData.createZoomLink) {
 const meeting = await generateMeetingLink({ topic: payload.subject, startTime: `2026-06-01 ${payload.startTime}`, duration: 60});
 if (meeting?.join_url) payload.room = `Zoom: ${meeting.join_url}`;
}

 if (formData.addCalendar) {
 await syncEvent({ 
 companyId, 
 provider: 'google', 
 eventDetails: { title: `${payload.subject} (${payload.className})`, date: payload.day, time: payload.startTime, description: payload.room} 
});
}

 if (editingId) {
 mutateRecord.mutate({
 id: editingId,
 recordType: 'timetable_slot',
 payload,
 status: 'active',
 searchText: `${formData.className} ${formData.day} ${formData.subject} ${formData.teacher}`,
}, {
 onSuccess: () => {
 toast.success('Timetable slot updated!');
 setShowModal(false);
 setEditingId(null);
 setFormData({ ...defaultForm, className: selectedClass});
},
 onError: (err) => toast.error('Failed: ' + err.message),
});
} else {
 mutateRecord.mutate({
 recordType: 'timetable_slot',
 payload,
 status: 'active',
 searchText: `${formData.className} ${formData.day} ${formData.subject} ${formData.teacher}`,
}, {
 onSuccess: () => {
 toast.success('Timetable slot added!');
 setShowModal(false);
 setFormData({ ...defaultForm, className: selectedClass});
},
 onError: (err) => toast.error('Failed: ' + err.message),
});
}
};

 const handleDelete = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'timetable_slot'}, {
 onSuccess: () => { toast.success('Slot removed.'); setDeleteTargetId(null);},
 onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null);},
});
};

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl school-heading font-extrabold tracking-tight">{t("timetable", "Timetable")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t("weekly_class_schedule_grid", "Weekly class schedule grid")}</p>
 </div>
 <div className="flex items-center gap-3">
 <select
 value={selectedClass}
 onChange={e => setSelectedClass(e.target.value)}
 className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground "
 >
 {CLASS_LIST.map(c => {
 return <option key={c}>{c}</option>;
})}
 </select>
 <Button
 onClick={() => { setFormData({ ...defaultForm, className: selectedClass}); setShowModal(true);}}
 className="gap-2 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold"
 >
 <Plus className="w-4 h-4" /> {t("add_slot", "Add Slot")}
 </Button>
 </div>
 </div>
 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 <div className="stat-card-premium school-card p-5 flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
 <LayoutGrid className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-2xl school-heading font-extrabold tracking-tight">{classSlots.length}</p>
 <p className="text-xs text-muted-foreground">{t("slots_scheduled", "Slots Scheduled")}</p>
 </div>
 </div>
 <div className="stat-card-premium school-card p-5 flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
 <Calendar className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-2xl school-heading font-extrabold tracking-tight">
 {[...new Set(classSlots.map(s => s.day))].length}
 </p>
 <p className="text-xs text-muted-foreground">{t("active_days", "Active Days")}</p>
 </div>
 </div>
 <div className="stat-card-premium school-card p-5 flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
 <Clock className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-2xl school-heading font-extrabold tracking-tight">
 {[...new Set(classSlots.map(s => s.subject))].length}
 </p>
 <p className="text-xs text-muted-foreground">{t("subjects", "Subjects")}</p>
 </div>
 </div>
 </div>
 {/* Weekly Grid */}
 {isLoading ? (
 <div className="py-12 text-center text-muted-foreground">{t("loading_timetable", "Loading timetable...")}</div>
 ) : (
 <div className="school-card overflow-hidden overflow-x-auto">
 <div className="min-w-[720px]">
 {/* Day Headers */}
 <div className="grid grid-cols-6 divide-x divide-border border-b border-primary/40 bg-muted">
 <div className="p-4 flex items-center justify-center">
 <Clock className="w-5 h-5 text-muted-foreground" />
 </div>
 {DAYS.map(day => {
 return (
 <div key={day} className="p-4 text-center font-bold text-foreground text-sm uppercase tracking-wide">
 {day}
 </div>
 );
})}
 </div>

 {/* Period Rows */}
 <div className="divide-y divide-border">
 {PERIODS.map(period => {
 return (
 <div key={period} className="grid grid-cols-6 divide-x divide-border min-h-[80px]">
 {/* Period Label */}
 <div className="p-3 flex flex-col items-center justify-center bg-muted/40 text-muted-foreground">
 <span className="text-xs font-bold uppercase">P{period}</span>
 <span className="text-[10px] mt-0.5">{t("period", "Period")} {period}</span>
 </div>
 {/* Day Cells */}
 {DAYS.map(day => {
 const slot = slotGrid[day]?.[period];
 if (slot) {
 const color = subjectColor(slot.subject);
 return (
 <div key={day} className="p-2 group relative">
 <div className={`h-full p-2.5 rounded-lg border flex flex-col justify-between ${color} transition-all`}>
 <div>
 <p className="font-bold text-xs leading-tight mb-0.5">{slot.subject}</p>
 <p className="text-[10px] opacity-75"><Link to="/team" className="hover:underline">{slot.teacher}</Link></p>
 </div>
 <div className="flex items-center justify-between mt-1.5">
 <p className="text-[10px] font-medium flex items-center gap-0.5 opacity-80">
 <MapPin className="w-2.5 h-2.5" /> {slot.room}
 </p>
 <p className="text-[10px] opacity-70">{slot.startTime}–{slot.endTime}</p>
 </div>
 <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-primary/20">
 <MoreVertical className="h-3 w-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-32">
 <DropdownMenuItem onClick={() => {
 setEditingId(slot.id);
 setFormData({
 className: slot.className,
 day: slot.day,
 period: String(slot.period),
 startTime: slot.startTime,
 endTime: slot.endTime,
 subject: slot.subject,
 teacher: slot.teacher,
 room: slot.room
});
 setShowModal(true);
}}>{t("edit_slot", "Edit Slot")}</DropdownMenuItem>
 <DropdownMenuItem className="text-red-600 font-medium" onClick={() => setDeleteTargetId(slot.id)}>{t("remove", "Remove")}</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </div>
 );
}
 return (
 <div key={day} className="p-2 flex items-center justify-center">
 <button
 onClick={() => {
 setFormData({ ...defaultForm, className: selectedClass, day, period: String(period)});
 setShowModal(true);
}}
 className="w-full h-full min-h-[56px] rounded-lg border-2 border-dashed border-primary/40 text-muted-foreground/40 hover:border-primary/70 hover:text-primary transition-colors flex items-center justify-center"
 >
 <Plus className="w-4 h-4" />
 </button>
 </div>
 );
})}
 </div>
 );
})}
 </div>
 </div>
 </div>
 )}
 {/* Add Slot Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
 <div className="bg-white dark:bg-slate-900/40/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl -[#1E3A8A]/10 w-full max-w-md p-6 space-y-4 border border-primary/40 max-h-[90vh] overflow-y-auto">
 <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
 <Plus className="w-5 h-5 text-primary dark:text-primary/70" /> {editingId ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("class", "Class")}</label>
 <select
 value={formData.className}
 onChange={e => setFormData({ ...formData, className: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 {CLASS_LIST.map(c => {
 return <option key={c}>{c}</option>;
})}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("day", "Day")}</label>
 <select
 value={formData.day}
 onChange={e => setFormData({ ...formData, day: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 {DAYS.map(d => {
 return <option key={d}>{d}</option>;
})}
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("period_1_8", "Period (1–8)")}</label>
 <select
 value={formData.period}
 onChange={e => setFormData({ ...formData, period: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 {PERIODS.map(p => {
 return <option key={p} value={p}>{t("period", "Period")} {p}</option>;
})}
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("start_time", "Start Time")}</label>
 <Input
 type="time"
 value={formData.startTime}
 onChange={e => setFormData({ ...formData, startTime: e.target.value})}
 className="mt-1"
 />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("end_time", "End Time")}</label>
 <Input
 type="time"
 value={formData.endTime}
 onChange={e => setFormData({ ...formData, endTime: e.target.value})}
 className="mt-1"
 />
 </div>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("subject", "Subject")}</label>
 <select
 value={formData.subject}
 onChange={e => setFormData({ ...formData, subject: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 {SUBJECTS.map(s => {
 return <option key={s}>{s}</option>;
})}
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("teacher", "Teacher")}</label>
 <select
 value={formData.teacher}
 onChange={e => setFormData({ ...formData, teacher: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 {TEACHERS.map(item => {
 return <option key={item}>{item}</option>;
})}
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("room", "Room")}</label>
 <Input
 value={formData.room}
 onChange={e => setFormData({ ...formData, room: e.target.value})}
 className="mt-1"
 placeholder="e.g. Room 205"
 />
 </div>
 </div>
 <div className="flex items-center gap-4 mt-2">
 <label className="flex items-center gap-2 text-sm text-foreground">
 <input type="checkbox" checked={formData.createZoomLink || false} onChange={e => setFormData({ ...formData, createZoomLink: e.target.checked})} />
 {t("generate_zoom_link", "Generate Zoom Link")}
 </label>
 <label className="flex items-center gap-2 text-sm text-foreground">
 <input type="checkbox" checked={formData.addCalendar || false} onChange={e => setFormData({ ...formData, addCalendar: e.target.checked})} />
 {t("add_to_calendar", "Add to Calendar")}
 </label>
 </div>
 <div className="flex gap-3 pt-2">
 <Button
 variant="outline"
 className="flex-1"
 onClick={() => { setShowModal(false); setEditingId(null); setFormData({ ...defaultForm, className: selectedClass});}}
 disabled={mutateRecord.isPending}
 >
 {t("cancel", "Cancel")}
 </Button>
 <Button
 className="flex-1 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold"
 onClick={handleAddSlot}
 disabled={mutateRecord.isPending}
 >
 {mutateRecord.isPending ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Slot')}
 </Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDelete}
 title="Remove Timetable Slot"
 message="Are you sure you want to remove this scheduled slot from the timetable?"
 />
 </div>
 );
}
