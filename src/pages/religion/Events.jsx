import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Plus, Trash2, Search, MoreVertical, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMeeting } from '@/hooks/integrations/useMeeting';
import { useCalendar } from '@/hooks/integrations/useCalendar';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function Events() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { generateMeetingLink, isGenerating } = useMeeting();
  const { addToCalendar, isAdding } = useCalendar();
  const powerSync = usePowerSync();

  const [events, setEvents] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    date: 'Next Sunday',
    time: '08:30 AM',
    location: 'Main Auditorium',
    attendees: 100,
    type: 'Service',
    createZoomLink: false,
    addCalendar: false,
    rsvp: ''
  });

  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      setIsDbLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_religion_events WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if (active) setEvents(res.rows._array || Array.from(res.rows));
      } catch (e) {}
      setIsDbLoading(false);
    };
    if (companyId) fetchEvents();
    return () => { active = false; };
  }, [companyId]);

  const openEdit = (record) => {
    setEditRecord(record);
    setFormData({ ...record, createZoomLink: false, addCalendar: false });
    setShowModal(true);
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim() || !formData.location.trim()) {
      return toast.error("Please enter a title and location for the event");
    }

    const dateWithTime = formData.date + ' ' + formData.time;
    let finalLocation = formData.location;

    if (formData.createZoomLink) {
      const meeting = await generateMeetingLink({ topic: formData.title, startTime: dateWithTime, duration: 60 });
      if (meeting?.join_url) finalLocation = `Zoom: ${meeting.join_url}`;
    }

    if (formData.addCalendar) {
      await addToCalendar({ title: formData.title, date: formData.date, time: formData.time, details: finalLocation });
    }

    try {
      if (editRecord) {
        await powerSync.execute(`UPDATE univ_religion_events SET title=?, date=?, location=?, attendees=? WHERE id=?`, 
          [formData.title, dateWithTime, finalLocation, parseInt(formData.attendees) || 0, editRecord.id]
        );
        toast.success('Gathering updated successfully!');
      } else {
        await powerSync.execute(`INSERT INTO univ_religion_events (id, created_at, company_id, title, date, location, attendees, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Upcoming')`, 
          [crypto.randomUUID(), new Date().toISOString(), companyId, formData.title, dateWithTime, finalLocation, parseInt(formData.attendees) || 0]
        );
        toast.success('Gathering scheduled successfully!');
      }
      setShowModal(false);
      setEditRecord(null);
      setFormData({ title: '', date: 'Next Sunday', time: '08:30 AM', location: 'Main Auditorium', attendees: 100, type: 'Service', createZoomLink: false, addCalendar: false, rsvp: '' });
      
      const res = await powerSync.execute('SELECT * FROM univ_religion_events WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setEvents(res.rows._array || Array.from(res.rows));
    } catch (err) {
      toast.error('Failed to save gathering: ' + err.message);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteTargetId) return;
    try {
      await powerSync.execute(`DELETE FROM univ_religion_events WHERE id=?`, [deleteTargetId]);
      toast.success('Gathering removed successfully!');
      setDeleteTargetId(null);
      setEvents(events.filter(e => e.id !== deleteTargetId));
    } catch (err) {
      toast.error('Failed to remove gathering: ' + err.message);
    }
  };

  const filtered = events.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("events_services", "Events & Services")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("religion_calendar_and_upcoming_g", "Religion calendar and upcoming gatherings")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("create_event", "Create Event")}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
          <Input placeholder="Search scheduled events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
      </div>
      
      {isDbLoading ? (
        <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_calendar", "Loading calendar...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_upcoming_gatherings", "No upcoming gatherings")}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">{t("schedule_sunday_services_midwe", "Schedule Sunday services, midweek prayers, conferences, or fellowship retreats using the top-right button.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(event => (
            <div key={event.id} className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex gap-5 group">
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 min-w-[100px] shrink-0 border-[0.5px] border-black/9">
                <span className="text-xs font-semibold uppercase tracking-widest">{event.date?.split(' ')[0] || 'Upcoming'}</span>
                <span className="text-2xl font-black">{event.date?.split(' ')[1] || 'Soon'}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {event.type}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewRecord(event)}>
                        <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(event)}>
                        <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTargetId(event.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-3">{event.title}</h3>
                <div className="space-y-2 text-sm text-[#71717a] dark:text-gray-400">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {event.time}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.location}</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {event.attendees} {t("expected", "Expected")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> {t("schedule_event_service", "Schedule Event / Service")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("event_title", "Event Title")}</label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value})} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("scheduled_date", "Scheduled Date")}</label>
                  <Input value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("time", "Time")}</label>
                  <Input value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 block mb-1.5 uppercase tracking-[0.04em]">{t("location_venue", "Location/Venue")}</label>
                  <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 block mb-1.5 uppercase tracking-[0.04em]">{t("expected_attendance", "Expected Attendance")}</label>
                  <Input type="number" value={formData.attendees} onChange={e => setFormData({ ...formData, attendees: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("gathering_type", "Gathering Type")}</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground">
                  <option>{t("service", "Service")}</option>
                  <option>{t("event", "Event")}</option>
                  <option>{t("retreat", "Retreat")}</option>
                  <option>{t("conference", "Conference")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("expected_attendees_rsvp", "Expected Attendees (RSVP)")}</label>
                <Input type="number" value={formData.rsvp} onChange={e => setFormData({ ...formData, rsvp: e.target.value})} className="mt-1" placeholder="100" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={formData.createZoomLink} onChange={e => setFormData({ ...formData, createZoomLink: e.target.checked})} />
                {t("generate_zoom_link", "Generate Zoom Link")}
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={formData.addCalendar} onChange={e => setFormData({ ...formData, addCalendar: e.target.checked})} />
                {t("add_to_calendar", "Add to Calendar")}
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null);}}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" disabled={isGenerating || isAdding} onClick={handleCreateEvent}>{editRecord ? 'Update' : 'Schedule'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteEvent}
        title="Remove Calendar Event"
        message="Are you sure you want to completely remove this gathering from your schedule? This action is permanent."
      />

      <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("record_details", "Record Details")}</SheetTitle>
            <SheetDescription>{t("read_only_view_of_the_selected", "Read-only view of the selected record.")}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => (
              <div key={key} className="border-b border-primary/40 pb-2">
                <p className="text-sm font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="mt-1 text-base text-foreground font-semibold">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
