import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, User, Stethoscope, Plus, Video, Trash2, CheckCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMeeting } from "@/hooks/integrations/useMeeting";
import { useCalendar } from "@/hooks/integrations/useCalendar";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw } from "lucide-react";
import { toast } from 'react-hot-toast';
import { useNotifications } from "@/hooks/integrations/useNotifications";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const typeColors = {
  Consultation: 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20',
  'Follow-up': 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20',
  Emergency: 'bg-red-50 text-red-700 border-red-200'
};

const statusColors = {
  Scheduled: 'text-primary bg-slate-50 dark:bg-slate-800/50 border-primary/20',
  'In Progress': 'text-amber-600 bg-amber-50 border-amber-200 animate-pulse',
  Completed: 'text-primary bg-slate-50 dark:bg-slate-800/50 border-primary/20'
};

export default function Appointments() {
  const { t } = useTranslation();
  const { notifyTeam } = useNotifications();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading: isDbLoading } = useQuery({
    queryKey: ['univ_appointments', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        'SELECT * FROM univ_appointments WHERE company_id = ? ORDER BY date DESC, time ASC',
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { generateMeetingLink, isGenerating } = useMeeting();
  const { syncEvent, isSyncing } = useCalendar();
  const [generateZoom, setGenerateZoom] = useState(false);
  const [syncGoogle, setSyncGoogle] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [formData, setFormData] = useState({
    patient: '',
    doctor: 'Dr. John Mensah',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'Consultation'
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      if (payload.id) {
        await powerSync.execute(
          `UPDATE univ_appointments SET 
             client_name = ?, doctor_id = ?, date = ?, time = ?, type = ?, status = ?, notes = ?
           WHERE id = ?`,
          [payload.client_name, payload.doctor_id, payload.date, payload.time, payload.type, payload.status, payload.notes, payload.id]
        );
      } else {
        await powerSync.execute(
          `INSERT INTO univ_appointments (id, created_at, company_id, client_name, doctor_id, date, time, type, status, notes)
           VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`,
          [companyId, payload.client_name, payload.doctor_id, payload.date, payload.time, payload.type, payload.status, payload.notes]
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_appointments']);
      toast.success('Appointment saved successfully!');
      setShowModal(false);
      setFormData({
        patient: '',
        doctor: 'Dr. John Mensah',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'Consultation'
      });
    },
    onError: (err) => toast.error('Failed: ' + err.message)
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_appointments WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_appointments']);
      toast.success('Appointment cancelled successfully!');
    },
    onError: (err) => toast.error('Failed to cancel: ' + err.message)
  });

  const handleSaveToDb = async () => {
    if (!formData.patient.trim()) return toast.error("Please enter a patient name");

    // Double-Booking Conflict Check
    const isConflict = appointments.some(appt => 
      appt.doctor_id === formData.doctor && 
      appt.date === formData.date && 
      appt.time === formData.time &&
      appt.status !== 'Completed'
    );

    if (isConflict) {
      return toast.error("Conflict Detected: Doctor is already booked at this time!");
    }

    const [hours, minutes] = formData.time.split(':');
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const formattedHours = parseInt(hours) % 12 || 12;
    const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

    let payload = {
      client_name: formData.patient,
      doctor_id: formData.doctor,
      date: formData.date,
      time: formattedTime,
      type: formData.type,
      status: 'Scheduled',
      notes: ''
    };

    if (generateZoom) {
      try {
        const startTime = formData.date && formData.time ? `${formData.date}T${formData.time}:00Z` : undefined;
        const meeting = await generateMeetingLink({ companyId, provider: 'zoom', topic: `Consultation with ${formData.patient}`, startTime, duration: 60 });
        if (meeting?.join_url) {
          payload.notes = `Zoom Link: ${meeting.join_url}`;
        }
      } catch (err) {
        console.error("Zoom generation failed", err);
      }
    }

    if (syncGoogle) {
      try {
        const startTime = formData.date && formData.time ? `${formData.date}T${formData.time}:00Z` : undefined;
        await syncEvent({ companyId, provider: 'google', eventDetails: { title: `Consultation with ${formData.patient}`, description: payload.notes, startTime, endTime: startTime } });
      } catch (err) {
        console.error("Google Sync failed", err);
      }
    }

    mutateRecord.mutate(payload);
  };

  const handleStatusChange = (appt, newStatus) => {
    mutateRecord.mutate({ ...appt, status: newStatus }, {
      onSuccess: () => {
        toast.success(`Status updated to ${newStatus}`);
        if (selectedAppt?.id === appt.id) {
          setSelectedAppt({ ...appt, status: newStatus });
        }
      }
    });
  };

  const handleDeleteFromDb = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to cancel and delete this appointment?')) {
      deleteRecord.mutate(id);
      if (selectedAppt?.id === id) setSelectedAppt(null);
    }
  };

  const filteredAppts = appointments.filter(appt => appt.date === date);

  if (isDbLoading) return <div className="flex items-center justify-center h-64 text-[#71717a] dark:text-gray-400">{t("loading_appointments", "Loading appointments...")}</div>;

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("appointments", "Appointments")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_doctor_schedules_and_pa", "Manage doctor schedules and patient visits")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto bg-card" />
          <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white"><Plus className="w-4 h-4"/> {t("book_appointment", "Book Appointment")}</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-card rounded-xl border-[0.5px] border-primary/40 p-4 h-[600px] overflow-y-auto space-y-4">
          <h3 className="font-semibold text-card-foreground flex items-center gap-2 border-b border-primary/40 pb-3"><CalendarIcon className="w-4 h-4 text-primary"/> {t("scheduled_visits", "Scheduled Visits (")}{filteredAppts.length})</h3>
          <div className="space-y-3">
            {filteredAppts.map(appt => {
              return (
                <div key={appt.id} onClick={() => setSelectedAppt(appt)} className={`p-3 rounded-xl border-[0.5px] cursor-pointer transition-all flex flex-col gap-2 ${selectedAppt?.id === appt.id ? 'ring-2 ring-primary border-transparent bg-primary/20' : 'border-primary/40'}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border-[0.5px] uppercase tracking-wider ${typeColors[appt.type]}`}>{appt.type}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusColors[appt.status]}`}>{appt.status}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-primary hover:underline">{appt.client_name}</span>
                    <p className="text-xs text-[#71717a] font-medium tracking-[0.04em]">{appt.doctor_id}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#71717a] mt-1 border-t border-dashed border-primary/40 pt-2">
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> <span>{appt.time}</span></div>
                    <Button size="icon" variant="ghost" onClick={(e) => handleDeleteFromDb(appt.id, e)} className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              );
            })}
            {filteredAppts.length === 0 && (
              <div className="text-center py-10 text-[#71717a]">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="font-medium text-sm">No appointments on this date.</p>
              </div>
            )}
          </div>
        </div>
        <div className="col-span-2 bg-card rounded-xl border-[0.5px] border-primary/40 p-6 flex flex-col h-[600px]">
          {selectedAppt ? (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex justify-between items-start border-b border-primary/40 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-card-foreground flex items-center gap-2">{selectedAppt.client_name} <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedAppt.status]} font-medium uppercase tracking-wider`}>{selectedAppt.status}</span></h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[#71717a]">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border-[0.5px]"><Stethoscope className="w-4 h-4" /> {selectedAppt.doctor_id}</span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border-[0.5px]"><Clock className="w-4 h-4" /> {selectedAppt.time}</span>
                  </div>
                </div>
                <Button variant="outline" onClick={(e) => handleDeleteFromDb(selectedAppt.id, e)} className="text-red-600 border-red-200 hover:bg-red-50 gap-2"><Trash2 className="w-4 h-4" /> Cancel</Button>
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#71717a] uppercase tracking-[0.04em] mb-2">{t("appointment_type", "Appointment Type")}</h3>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${typeColors[selectedAppt.type]} font-medium`}>
                    {selectedAppt.type === 'Consultation' ? <User className="w-4 h-4"/> : selectedAppt.type === 'Emergency' ? <Activity className="w-4 h-4"/> : <RefreshCw className="w-4 h-4"/>}
                    {selectedAppt.type}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#71717a] uppercase tracking-[0.04em] mb-2">{t("notes_meeting_link", "Notes & Meeting Link")}</h3>
                  <div className="bg-slate-50 p-4 rounded-xl border-[0.5px] border-primary/40 min-h-[100px] text-sm font-medium">
                    {selectedAppt.notes ? (
                      selectedAppt.notes.includes('Zoom') ? (
                        <div className="flex items-center gap-2 text-primary">
                          <Video className="w-4 h-4"/>
                          <a href={selectedAppt.notes.split(' ')[2]} target="_blank" rel="noreferrer" className="hover:underline">{t("join_zoom_meeting", "Join Zoom Meeting")}</a>
                        </div>
                      ) : <p>{selectedAppt.notes}</p>
                    ) : <p className="text-[#71717a] italic">{t("no_notes_provided_", "No notes provided.")}</p>}
                  </div>
                </div>
              </div>
              <div className="border-t border-primary/40 pt-4 mt-auto">
                <div className="flex gap-3">
                  <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2" onClick={() => handleStatusChange(selectedAppt, 'In Progress')} disabled={selectedAppt.status === 'In Progress' || selectedAppt.status === 'Completed'}><Play className="w-4 h-4"/> {t("start_session", "Start Session")}</Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => handleStatusChange(selectedAppt, 'Completed')} disabled={selectedAppt.status === 'Completed'}><CheckCircle className="w-4 h-4"/> {t("mark_completed", "Mark Completed")}</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#71717a]">
              <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-semibold text-card-foreground tracking-[-0.02em]">{t("select_an_appointment", "Select an Appointment")}</h2>
              <p className="text-sm">{t("click_on_a_scheduled_visit_to_", "Click on a scheduled visit to view details and manage the session.")}</p>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-card-foreground">{t("book_new_appointment", "Book New Appointment")}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase tracking-[0.04em]">{t("patient_name", "Patient Name")}</label>
                <Input value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value})} className="mt-1" placeholder="e.g. Ama Ghana" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase tracking-[0.04em]">{t("attending_doctor", "Attending Doctor")}</label>
                <select value={formData.doctor} onChange={e => setFormData({ ...formData, doctor: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option>Dr. John Mensah</option><option>Dr. Sarah Osei</option><option>Dr. Kwame Addo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase tracking-[0.04em]">{t("date", "Date")}</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase tracking-[0.04em]">{t("time", "Time")}</label>
                  <Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase tracking-[0.04em]">{t("visit_type", "Visit Type")}</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option>Consultation</option><option>Follow-up</option><option>Emergency</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-primary/40">
                <div className="flex items-center space-x-2">
                  <Checkbox id="zoom" checked={generateZoom} onCheckedChange={setGenerateZoom} />
                  <label htmlFor="zoom" className="text-sm font-medium leading-none text-[#71717a]">{t("generate_zoom_meeting_link", "Generate Zoom meeting link")}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="google" checked={syncGoogle} onCheckedChange={setSyncGoogle} />
                  <label htmlFor="google" className="text-sm font-medium leading-none text-[#71717a]">{t("sync_to_google_calendar", "Sync to Google Calendar")}</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb} disabled={mutateRecord.isPending || isGenerating || isSyncing}>
                {(mutateRecord.isPending || isGenerating || isSyncing) ? 'Processing...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
