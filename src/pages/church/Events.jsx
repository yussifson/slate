import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useMeeting } from '@/hooks/integrations/useMeeting';
import { useCalendar } from '@/hooks/integrations/useCalendar';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function Events() {
  const { t } = useTranslation();
  const { generateMeetingLink, isGenerating } = useMeeting();
  const { addToCalendar, isAdding } = useCalendar();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('event');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const events = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: 'Next Sunday',
    time: '08:30 AM',
    venue: 'Main Auditorium',
    rsvp: 100,
    type: 'Service',
    createZoomLink: false,
    addCalendar: false
  });


  const openEdit = (record) => {
    setEditRecord(record);
    setFormData({ ...record, createZoomLink: false, addCalendar: false });
    setShowModal(true);
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim() || !formData.venue.trim()) {
      return toast.error("Please enter a title and venue for the event");
    }

    // Smart Event Conflict Checking
    const isConflict = events.some(e => 
      e.date === formData.date && 
      e.time === formData.time && 
      e.venue?.toLowerCase() === formData.venue.trim().toLowerCase() &&
      (!editRecord || e.id !== editRecord.id)
    );

    if (isConflict) {
      return toast.error(`Conflict Warning: ${formData.venue} is already booked on ${formData.date} at ${formData.time}`);
    }

    const payload = {
      title: formData.title,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      rsvp: parseInt(formData.rsvp) || 0,
      type: formData.type
    };

    if (formData.createZoomLink) {
      const meeting = await generateMeetingLink({ topic: payload.title, startTime: `${payload.date} ${payload.time}`, duration: 60 });
      if (meeting?.join_url) payload.venue = `Zoom: ${meeting.join_url}`;
    }

    if (formData.addCalendar) {
      await addToCalendar({ title: payload.title, date: payload.date, time: payload.time, details: payload.venue });
    }

    mutateRecord.mutate({
      ...(editRecord ? { id: editRecord.id } : {}),
      recordType: 'event',
      payload,
      status: 'Active',
      searchText: `${formData.title} ${formData.venue} ${formData.type}`
    }, {
      onSuccess: () => {
        toast.success('Gathering scheduled successfully!');
        setShowModal(false);
        setEditRecord(null);
        setFormData({ title: '', date: 'Next Sunday', time: '08:30 AM', venue: 'Main Auditorium', rsvp: 100, type: 'Service' });
      },
      onError: (err) => {
        toast.error('Failed to schedule event: ' + err.message);
      }
    });
  };

  const handleDeleteEvent = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'event' }, {
      onSuccess: () => {
        toast.success('Gathering removed from calendar successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove event: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = events.filter(evt =>
    evt.title?.toLowerCase().includes(search.toLowerCase()) ||
    evt.venue?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("events_services", "Events & Services")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "church_calendar_and_upcoming_g",
            "Church calendar and upcoming gatherings"
          )}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4" /> {t("create_event", "Create Event")}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search scheduled events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
      </div>
      {isDbLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading_calendar", "Loading calendar...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-purple-600" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_upcoming_gatherings", "No upcoming gatherings")}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">{t(
            "schedule_sunday_services_midwe",
            "Schedule Sunday services, midweek prayers, conferences, or fellowship retreats using the top-right button."
          )}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(event => {
            return (
              <div key={event.id} className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col sm:flex-row gap-5 relative group hover:shadow-md transition-all">
                <div className="flex flex-col items-center justify-center bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 rounded-lg p-4 min-w-[100px] shrink-0 border border-purple-100 dark:border-purple-900/50">
                  <span className="text-xs font-bold uppercase tracking-widest">{event.date?.split(' ')[0] || 'Upcoming'}</span>
                  <span className="text-2xl font-black">{event.date?.includes(' ') ? event.date.split(' ')[1]?.replace(',', '') : 'Soon'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded-full mb-2 inline-block">
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
                  <h3 className="text-lg font-bold text-card-foreground mb-3">{event.title}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> {event.time}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {event.venue}</div>
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> {event.rsvp} {t("expected", "Expected")}</div>
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
              <Calendar className="w-5 h-5 text-purple-600" /> {t("schedule_event_service", "Schedule Event / Service")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("event_title", "Event Title")}</label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Sunday Miracle Service"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("scheduled_date", "Scheduled Date")}</label>
                  <Input
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. June 15"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("time", "Time")}</label>
                  <Input
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. 09:00 AM"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("gathering_venue", "Gathering Venue")}</label>
                  <Input
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. Main Auditorium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("gathering_type", "Gathering Type")}</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option>{t("service", "Service")}</option>
                    <option>{t("event", "Event")}</option>
                    <option>{t("retreat", "Retreat")}</option>
                    <option>{t("conference", "Conference")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("expected_attendees_rsvp", "Expected Attendees (RSVP)")}</label>
                <Input
                  type="number"
                  value={formData.rsvp}
                  onChange={e => setFormData({ ...formData, rsvp: e.target.value })}
                  className="mt-1"
                  placeholder="100"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={formData.createZoomLink} onChange={e => setFormData({ ...formData, createZoomLink: e.target.checked })} />
                {t("generate_zoom_link", "Generate Zoom Link")}
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={formData.addCalendar} onChange={e => setFormData({ ...formData, addCalendar: e.target.checked })} />
                {t("add_to_calendar", "Add to Calendar")}
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null); }}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={isGenerating || isAdding} onClick={handleCreateEvent}>{editRecord ? 'Update' : 'Schedule'}</Button>
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
            {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => {
              return (
                <div key={key} className="border-b border-border pb-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="mt-1 text-base text-foreground font-semibold">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
