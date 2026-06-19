import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Link} from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, User, Stethoscope, Plus, Video, Trash2, CheckCircle, Play} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { useMeeting} from "@/hooks/integrations/useMeeting";
import { useCalendar} from "@/hooks/integrations/useCalendar";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Checkbox} from "@/components/ui/checkbox";
import { RefreshCw} from "lucide-react";
import { toast} from 'react-hot-toast';
import { useNotifications} from "@/hooks/integrations/useNotifications";
import { MessageSquare, Bell} from "lucide-react";

const typeColors = {
 Consultation: 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20',
 'Follow-up': 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20',
 Emergency: 'bg-red-50 text-red-700 border-red-200',
};

const statusColors = {
 Scheduled: 'text-primary bg-slate-50 dark:bg-slate-800/50 border-primary/20',
 'In Progress': 'text-amber-600 bg-amber-50 border-amber-200 animate-pulse',
 Completed: 'text-primary bg-slate-50 dark:bg-slate-800/50 border-primary/20',
};

export default function Appointments() {
 const { t} = useTranslation();
 const { notifyTeam} = useNotifications();
 // Supabase Real-time Sync Hooks
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('appt');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();
 const companyId = useCompanyId();

 const { generateMeetingLink, isGenerating} = useMeeting();
 const { syncEvent, isSyncing} = useCalendar();
 const [generateZoom, setGenerateZoom] = useState(false);
 const [syncGoogle, setSyncGoogle] = useState(true);

 // Map database records
 const appointments = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data}));

 const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [showModal, setShowModal] = useState(false);
 const [selectedAppt, setSelectedAppt] = useState(null);

 // Form State
 const [formData, setFormData] = useState({
 patient: '',
 doctor: 'Dr. John Mensah',
 date: new Date().toISOString().split('T')[0],
 time: '09:00',
 type: 'Consultation'
});

 // Generic Save Handler for real DB persistence
 const handleSaveToDb = async () => {
 if (!formData.patient.trim()) return toast.error("Please enter a patient name");

 // Convert time to 12h format for UI consistency
 const [hours, minutes] = formData.time.split(':');
 const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
 const formattedHours = parseInt(hours) % 12 || 12;
 const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

 let payload = {
 patient: formData.patient,
 doctor: formData.doctor,
 date: formData.date,
 time: formattedTime,
 type: formData.type,
 status: 'Scheduled',
 notes: ''
};

 // Handle Zoom
 if (generateZoom) {
 try {
 const startTime = formData.date && formData.time ? `${formData.date}T${formData.time}:00Z` : undefined;
 const meeting = await generateMeetingLink({ companyId, provider: 'zoom', topic: `Consultation with ${formData.patient}`, startTime, duration: 60});
 if (meeting?.join_url) {
 payload.meeting_url = meeting.join_url;
 payload.notes = `Zoom Link: ${meeting.join_url}`;
}
} catch (err) {
 console.error("Zoom generation failed", err);
}
}

 // Handle Sync
 if (syncGoogle) {
 try {
 const startTime = formData.date && formData.time ? `${formData.date}T${formData.time}:00Z` : undefined;
 await syncEvent({ companyId, provider: 'google', eventDetails: { title: `Consultation with ${formData.patient}`, description: payload.notes, startTime, endTime: startTime}});
} catch (err) {
 console.error("Google Sync failed", err);
}
}

 mutateRecord.mutate({
 recordType: 'appt',
 payload,
 status: 'Scheduled',
 searchText: `${formData.patient} ${formData.doctor} ${formData.type}`
}, {
 onSuccess: () => {
 toast.success('Appointment booked successfully!');
 setShowModal(false);
 setFormData({
 patient: '',
 doctor: 'Dr. John Mensah',
 date: new Date().toISOString().split('T')[0],
 time: '09:00',
 type: 'Consultation'
});
},
 onError: (err) => {
 toast.error('Failed to book appointment: ' + err.message);
}
});
};

 // Change Appointment Status
 const handleStatusChange = (appt, newStatus) => {
 const updatedPayload = { ...appt, status: newStatus};
 delete updatedPayload.id;

 mutateRecord.mutate({
 id: appt.id,
 recordType: 'appt',
 payload: updatedPayload,
 status: newStatus,
 searchText: `${appt.patient} ${appt.doctor} ${appt.type}`
}, {
 onSuccess: () => {
 toast.success(`Status updated to ${newStatus}`);
 if (selectedAppt?.id === appt.id) {
 setSelectedAppt({ ...appt, status: newStatus});
}
}
});
};

 // Generic Delete Handler for real DB persistence
 const handleDeleteFromDb = (id, e) => {
 e.stopPropagation(); // prevent selecting the appt when clicking delete
 if (window.confirm('Are you sure you want to cancel and delete this appointment?')) {
 deleteRecord.mutate({ id, recordType: 'appt'}, {
 onSuccess: () => {
 toast.success('Appointment cancelled successfully!');
 if (selectedAppt?.id === id) setSelectedAppt(null);
},
 onError: (err) => {
 toast.error('Failed to cancel appointment: ' + err.message);
}
});
}
};

 const filteredAppts = appointments.filter(appt => appt.date === date);

 if (isDbLoading) return <div className="flex items-center justify-center h-64 text-[#71717a] dark:text-gray-400">{t("loading_appointments", "Loading appointments...")}</div>;

 return (
 <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("appointments", "Appointments")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "manage_doctor_schedules_and_pa",
 "Manage doctor schedules and patient visits"
 )}</p>
 </div>
 <div className="flex items-center gap-3">
 <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white"><Plus className="w-4 h-4"/> {t("book_appointment", "Book Appointment")}</Button>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {/* Sidebar Calendar List */}
 <div className="col-span-1 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 h-[600px] overflow-y-auto space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="font-semibold text-card-foreground flex items-center gap-2 border-b border-primary/40 pb-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><CalendarIcon className="w-4 h-4 text-primary"/> {t("scheduled_visits", "Scheduled Visits (")}{filteredAppts.length})</h3>
 <div className="space-y-3">
 {filteredAppts.map(appt => {
 return (
 <div key={appt.id} onClick={() => setSelectedAppt(appt)} className={`p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 cursor-pointer transition-all flex flex-col gap-2 ${selectedAppt?.id === appt.id ? 'ring-2 ring-primary border-transparent bg-primary/20' : 'border-primary/40'}`}>
 <div className="flex justify-between items-start">
 <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border-[0.5px] border-black/9 dark:border-white/8 uppercase tracking-wider ${typeColors[appt.type]}`}>{appt.type}</span>
 <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusColors[appt.status]}`}>{appt.status}</span>
 </div>
 <div>
 <Link to="/hospital/patients" className="font-semibold text-sm text-primary hover:underline">{appt.patient}</Link>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-medium tracking-[0.04em]">{appt.doctor}</p>
 </div>
 <div className="flex items-center justify-between gap-2 text-xs text-[#71717a] dark:text-gray-400 mt-1 border-t border-dashed border-primary/40 pt-2 tracking-[0.04em]">
 <div className="flex items-center gap-2">
 <Clock className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400" /> <span>{appt.time}</span>
 </div>
 <Button size="icon" variant="ghost" onClick={(e) => handleDeleteFromDb(appt.id, e)} className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50">
 <Trash2 className="w-3.5 h-3.5" />
 </Button>
 </div>
 </div>
 );
})}
 {filteredAppts.length === 0 && (
 <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
 <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
 <p className="text-xs tracking-[0.04em]">{t("no_appointments_booked_for_thi", "No appointments booked for this day.")}</p>
 </div>
 )}
 </div>
 </div>

 {/* Main Details Area */}
 <div className="col-span-1 md:col-span-2 space-y-6">
 {selectedAppt ? (
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 space-y-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-start">
 <div>
 <Link to="/hospital/patients" className="text-xl font-semibold text-primary hover:underline">{selectedAppt.patient}</Link>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("assigned", "Assigned:")} <strong>{selectedAppt.doctor}</strong></p>
 </div>
 <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColors[selectedAppt.status]}`}>{selectedAppt.status}</span>
 </div>

 <div className="grid grid-cols-2 gap-4 border-y border-primary/40 py-4 my-4">
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">{t("appointment_type", "Appointment Type")}</p>
 <p className="font-semibold text-foreground">{selectedAppt.type}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">{t("schedule_time", "Schedule Time")}</p>
 <p className="font-semibold text-foreground flex items-center gap-2.5"><Clock className="w-4 h-4 text-primary" /> {selectedAppt.time}</p>
 </div>
 </div>

 <div className="flex gap-3">
 <Button variant="outline" onClick={(e) => { e.stopPropagation(); notifyTeam({ companyId, provider: 'twilio', message: `Reminder: You have an appointment at ${selectedAppt.time}.`, recipientPhone: '+1234567890'}).then(()=>toast.success("SMS Sent!")).catch(()=>{})}} className="gap-2 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex-1">
 <MessageSquare className="w-4 h-4" /> SMS Reminder
 </Button>
 {selectedAppt.status === 'Scheduled' && (
 <Button onClick={() => handleStatusChange(selectedAppt, 'In Progress')} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white flex-1">
 <Play className="w-4 h-4" /> {t("start_consultation", "Start Consultation")}
 </Button>
 )}
 {selectedAppt.status === 'In Progress' && (
 <Button onClick={() => handleStatusChange(selectedAppt, 'Completed')} className="gap-2 bg-primary hover:bg-primary/90 text-white flex-1">
 <CheckCircle className="w-4 h-4" /> {t("complete_consultation", "Complete Consultation")}
 </Button>
 )}
 {selectedAppt.status === 'Completed' && (
 <div className="bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-primary/90 text-sm p-4 rounded-xl flex items-center gap-2 w-full justify-center font-semibold">
 <CheckCircle className="w-5 h-5" /> {t(
 "visit_completed_successfully_c",
 "Visit completed successfully. Clinical chart created."
 )}
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 flex flex-col items-center justify-center min-h-[300px] text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
 <Stethoscope className="w-8 h-8 text-primary" />
 </div>
 <h2 className="text-lg font-semibold text-card-foreground mb-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("select_an_appointment", "Select an appointment")}</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 max-w-sm">{t(
 "click_on_an_appointment_from_t",
 "Click on an appointment from the schedule to view details, begin consultation, or update status."
 )}</p>
 </div>
 )}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("book_appointment", "Book Appointment")}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("patient_name", "Patient Name")}</label>
 <Input value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value})} className="mt-1" placeholder="e.g. Kwesi Asante" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("doctor", "Doctor")}</label>
 <select value={formData.doctor} onChange={e => setFormData({ ...formData, doctor: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("dr_john_mensah", "Dr. John Mensah")}</option>
 <option>{t("dr_jane_doe", "Dr. Jane Doe")}</option>
 <option>{t("dr_sarah_connor", "Dr. Sarah Connor")}</option>
 </select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("date", "Date")}</label>
 <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("time", "Time")}</label>
 <Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value})} className="mt-1" />
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("type", "Type")}</label>
 <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("consultation", "Consultation")}</option>
 <option>{t("follow_up", "Follow-up")}</option>
 <option>{t("emergency", "Emergency")}</option>
 </select>
 </div>
 </div>
 <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40">
 <div className="flex items-center space-x-2">
 <Checkbox id="generateZoom" checked={generateZoom} onCheckedChange={setGenerateZoom} />
 <label htmlFor="generateZoom" className="text-sm font-medium leading-none cursor-pointer">
 {t("generate_zoom_meeting_link", "Generate Zoom Meeting Link")}
 </label>
 </div>
 <div className="flex items-center space-x-2">
 <Checkbox id="syncGoogle" checked={syncGoogle} onCheckedChange={setSyncGoogle} />
 <label htmlFor="syncGoogle" className="text-sm font-medium leading-none cursor-pointer">
 {t("sync_to_google_calendar", "Sync to Google Calendar")}
 </label>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb} disabled={isGenerating || isSyncing}>
 {(isGenerating || isSyncing) ? <OrbitLoader size="sm" /> : null}
 {t("book_visit", "Book Visit")}
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
