import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { getTerm } from "@/config/industries";
import { 
  Plus, Calendar, ChevronLeft, ChevronRight, Globe, Lock, 
  Users, Check, Settings, Trash2, Tag, Filter, UserPlus, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { useCompany } from "@/hooks/useCompanyId";
import { supabase } from "@/api/supabaseClient";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const CALENDAR_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#ef4444', // Red
];

export default function CalendarPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { company } = useCompany();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const isAdminUser = ["super_admin", "company_admin", "managing_partner", "admin"].includes(user?.role);
  const [showAdminCalendar, setShowAdminCalendar] = useState(true);
  const [showStaffCalendar, setShowStaffCalendar] = useState(true);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: "", description: "", dueDate: format(new Date(), "yyyy-MM-dd"), priority: "medium" });

  const activeIndustry = sessionStorage.getItem("slate_industry_override") || company?.industry_type || user?.company_industry || "law";

  // ── Multi-User Calendars State ──────────────────────────────────────────
  const [calendars, setCalendars] = useState([]);
  const [calendarMembers, setCalendarMembers] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('all'); // 'all' or calendar.id
  const [showNewCalendarModal, setShowNewCalendarModal] = useState(false);

  const [newCalendarForm, setNewCalendarForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    visibility: 'public', // 'public' | 'private' | 'hybrid'
    selectedMembers: [], // [{ id, name, email }]
  });

  // Load custom shared calendars
  const loadCalendars = async () => {
    if (!companyId) return;
    try {
      const { data: cals } = await supabase
        .from('calendars')
        .select('*')
        .eq('company_id', companyId);

      const { data: mems } = await supabase
        .from('calendar_members')
        .select('*')
        .eq('company_id', companyId);

      if (cals) {
        setCalendars(cals);
      } else {
        const stored = localStorage.getItem(`jcl_calendars_${companyId}`);
        if (stored) {
          try { setCalendars(JSON.parse(stored)); } catch (e) {}
        }
      }

      if (mems) {
        setCalendarMembers(mems);
      } else {
        const storedM = localStorage.getItem(`jcl_cal_members_${companyId}`);
        if (storedM) {
          try { setCalendarMembers(JSON.parse(storedM)); } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Calendars load warning:', e);
    }
  };

  useEffect(() => {
    loadCalendars();
  }, [companyId]);

  const { data: hearings = [] } = useQuery({
    queryKey: ["hearings", companyId],
    queryFn: () => base44.entities.Hearing.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId, user?.email, isAdminUser],
    queryFn: async () => {
      const list = await base44.entities.LegalCase.filter({ company_id: companyId });
      if (isAdminUser) return list;
      return list.filter(c => c.assigned_lawyer === user?.email || c.created_by === user?.id);
    },
    enabled: !!companyId
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["calendar-reminders", companyId],
    queryFn: () => base44.entities.Task.filter({ company_id: companyId, category: "calendar_reminder" }),
    enabled: !!companyId
  });

  const createReminderMutation = useMutation({
    mutationFn: () => base44.entities.Task.create({
      company_id: companyId,
      title: reminderForm.title,
      description: reminderForm.description,
      due_date: reminderForm.dueDate,
      priority: reminderForm.priority,
      status: "todo",
      category: "calendar_reminder"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-reminders", companyId] });
      setReminderForm({ title: "", description: "", dueDate: format(new Date(), "yyyy-MM-dd"), priority: "medium" });
      setShowReminderForm(false);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hearing.create({ 
      ...data, 
      company_id: companyId, 
      created_by: user?.id, 
      created_by_email: user?.email,
      calendar_id: selectedCalendarId !== 'all' ? selectedCalendarId : null
    }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["hearings"] }); 
      setShowForm(false);
      toast.success('Calendar event added');
    },
    onError: (error) => { 
      console.error('[v0] Calendar creation failed:', error); 
      toast.error('You do not have permission to create this calendar item.'); 
    }
  });

  // Handle Create New Custom Calendar
  const handleCreateCalendar = async (e) => {
    e.preventDefault();
    if (!newCalendarForm.name.trim()) {
      toast.error('Please enter a calendar name');
      return;
    }

    try {
      const calId = crypto.randomUUID ? crypto.randomUUID() : 'cal_' + Date.now();
      const newCal = {
        id: calId,
        company_id: companyId,
        name: newCalendarForm.name.trim(),
        description: newCalendarForm.description || '',
        color: newCalendarForm.color,
        visibility: newCalendarForm.visibility,
        created_by: user?.id,
        created_by_email: user?.email,
        created_at: new Date().toISOString()
      };

      await supabase.from('calendars').insert([newCal]);

      // If hybrid, insert members
      const newMems = [];
      if (newCalendarForm.visibility === 'hybrid' && newCalendarForm.selectedMembers.length > 0) {
        for (const m of newCalendarForm.selectedMembers) {
          const memRecord = {
            id: crypto.randomUUID ? crypto.randomUUID() : 'mem_' + Math.random().toString(36).substring(7),
            calendar_id: calId,
            company_id: companyId,
            member_id: m.id,
            member_name: m.name,
            member_email: m.email,
            can_edit: true,
            added_at: new Date().toISOString()
          };
          newMems.push(memRecord);
        }
        await supabase.from('calendar_members').insert(newMems);
      }

      // Update state & localStorage fallback
      const updatedCals = [...calendars, newCal];
      const updatedMems = [...calendarMembers, ...newMems];
      setCalendars(updatedCals);
      setCalendarMembers(updatedMems);
      localStorage.setItem(`jcl_calendars_${companyId}`, JSON.stringify(updatedCals));
      localStorage.setItem(`jcl_cal_members_${companyId}`, JSON.stringify(updatedMems));

      setSelectedCalendarId(calId);
      setShowNewCalendarModal(false);
      toast.success(`Calendar "${newCalendarForm.name}" created!`);

      setNewCalendarForm({
        name: '',
        description: '',
        color: '#6366f1',
        visibility: 'public',
        selectedMembers: []
      });
    } catch (err) {
      toast.error('Failed to create calendar');
      console.error(err);
    }
  };

  // Toggle member in newCalendarForm
  const toggleMemberSelection = (s) => {
    const sId = s.id || s.user_email;
    const exists = newCalendarForm.selectedMembers.some(m => m.id === sId);
    if (exists) {
      setNewCalendarForm(prev => ({
        ...prev,
        selectedMembers: prev.selectedMembers.filter(m => m.id !== sId)
      }));
    } else {
      setNewCalendarForm(prev => ({
        ...prev,
        selectedMembers: [...prev.selectedMembers, {
          id: sId,
          name: s.full_name || s.name || s.user_email,
          email: s.user_email || s.email
        }]
      }));
    }
  };

  // Determine accessible calendars for current user
  const accessibleCalendars = useMemo(() => {
    return calendars.filter(cal => {
      if (cal.visibility === 'public') return true;
      if (cal.created_by === user?.id || cal.created_by_email === user?.email) return true;
      if (isAdminUser) return true;
      if (cal.visibility === 'hybrid') {
        const isMember = calendarMembers.some(
          m => m.calendar_id === cal.id && (m.member_id === user?.id || m.member_email === user?.email)
        );
        return isMember;
      }
      return false; // private and not creator
    });
  }, [calendars, calendarMembers, user, isAdminUser]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay();

  // Enforce Calendar toggles and assigned visibility logic
  const filteredHearings = hearings.filter(h => {
    // 1. If a specific shared calendar is selected
    if (selectedCalendarId !== 'all') {
      if (h.calendar_id !== selectedCalendarId) return false;
    }

    if (!isAdminUser) {
      return h.lawyer_email === user?.email || h.created_by === user?.id || h.created_by_email === user?.email;
    }
    const assignedStaff = staff.find(s => s.user_email === h.lawyer_email);
    const isEventAdmin = !assignedStaff || ["company_admin", "managing_partner", "super_admin"].includes(assignedStaff.role);
    if (isEventAdmin && !showAdminCalendar) return false;
    if (!isEventAdmin && !showStaffCalendar) return false;
    return true;
  });

  const getHearingsForDay = (date) => filteredHearings.filter(h => h.date && isSameDay(new Date(h.date), date));

  const upcomingHearings = filteredHearings
    .filter(h => h.date && new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 8);

  const hearingTerm = getTerm(activeIndustry, "hearing");
  const hearingTermPlural = getTerm(activeIndustry, "hearings");
  const venueTerm = getTerm(activeIndustry, "venue");

  return (
    <div className="space-y-4 font-sans max-w-7xl mx-auto">
      <PageHeader
        title={getTerm(activeIndustry, "hearing", true) + " Calendar"}
        subtitle={`${hearingTermPlural} and important dates`}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowNewCalendarModal(true)} variant="outline" size="sm" className="h-9 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Calendar
            </Button>
            <Button onClick={() => setShowForm(true)} size="sm" className="h-9 text-xs gap-1.5 font-semibold bg-primary text-white">
              <Plus className="w-4 h-4" /> Add Event
            </Button>
          </div>
        }
      />

      {/* ── Multi-User Calendars Bar ── */}
      <div className="bg-card rounded-xl border border-border p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Calendars:
          </span>

          <button
            onClick={() => setSelectedCalendarId('all')}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border",
              selectedCalendarId === 'all'
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            All Shared Calendars
          </button>

          {accessibleCalendars.map(cal => {
            const isSelected = selectedCalendarId === cal.id;
            return (
              <button
                key={cal.id}
                onClick={() => setSelectedCalendarId(cal.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cal.color || '#6366f1' }} />
                <span>{cal.name}</span>
                {cal.visibility === 'public' && <Globe className="w-3 h-3 opacity-60" />}
                {cal.visibility === 'hybrid' && <Users className="w-3 h-3 opacity-60" />}
                {cal.visibility === 'private' && <Lock className="w-3 h-3 opacity-60" />}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-emerald-500" /> Public</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-indigo-500" /> Hybrid</span>
          <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-amber-500" /> Private</span>
        </div>
      </div>

      {/* Calendar Controls (Admin / Staff visibility toggles) */}
      {isAdminUser && (
        <div className="bg-card rounded-xl border border-border p-3 flex gap-6 items-center text-xs select-none">
          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            {t("toggles", "Toggles:")}
          </span>
          <label className="flex items-center gap-2 cursor-pointer hover:opacity-90">
            <input
              type="checkbox"
              checked={showAdminCalendar}
              onChange={(e) => setShowAdminCalendar(e.target.checked)}
              className="rounded text-primary focus:ring-primary border-border"
            />
            <span className="font-medium text-foreground">{t("firm_admin_calendar", "Firm Admin Calendar")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:opacity-90">
            <input
              type="checkbox"
              checked={showStaffCalendar}
              onChange={(e) => setShowStaffCalendar(e.target.checked)}
              className="rounded text-primary focus:ring-primary border-border"
            />
            <span className="font-medium text-foreground">{t("staff_calendars", "Staff Calendars")}</span>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{format(currentMonth, "MMMM yyyy")}</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>{t("today", "Today")}</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
            {Array(startPad).fill(null).map((_, i) => (
              <div key={`pad-${i}`} className="bg-card min-h-[80px] p-1 opacity-40" />
            ))}
            {days.map(day => {
              const dayHearings = getHearingsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-card min-h-[85px] p-1.5 hover:bg-muted/40 cursor-pointer transition-colors ${isToday(day) ? "ring-2 ring-primary ring-inset" : ""}`}
                  onClick={() => { setSelectedDate(day); setShowForm(true); }}
                >
                  <span className={`text-xs font-semibold ${isToday(day) ? "text-primary font-bold" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayHearings.slice(0, 2).map(h => {
                      const calMatch = calendars.find(c => c.id === h.calendar_id);
                      return (
                        <div 
                          key={h.id} 
                          className="text-[10px] rounded px-1.5 py-0.5 truncate font-medium flex items-center gap-1 shadow-2xs text-white"
                          style={{ backgroundColor: calMatch?.color || '#4f46e5' }}
                        >
                          <span className="truncate">{h.title}</span>
                        </div>
                      );
                    })}
                    {dayHearings.length > 2 && (
                      <span className="text-[10px] text-muted-foreground font-semibold">+{dayHearings.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Upcoming {getTerm(activeIndustry, "hearing", true)}s
            </h3>
          </div>
          <div className="divide-y divide-border">
            {upcomingHearings.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No upcoming {hearingTerm}s</div>
            ) : upcomingHearings.map(h => {
              const calMatch = calendars.find(c => c.id === h.calendar_id);
              return (
                <div key={h.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{h.title}</p>
                    {calMatch && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0" style={{ borderColor: calMatch.color, color: calMatch.color }}>
                        {calMatch.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(h.date), "MMM d, yyyy")} · {h.time || "TBD"} · {h.court_name || `${venueTerm} TBD`}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Badge variant="outline" className="text-[10px]">{h.case_number || h.case_title || "—"}</Badge>
                    <Badge className={`text-[10px] ${h.status === "scheduled" ? "bg-amber-100 text-amber-800" : h.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                      {h.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Corporate Reminders Section */}
      <section className="bg-card rounded-xl border border-border p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold">Corporate Reminders</h3>
            <p className="text-xs text-muted-foreground">Follow-ups and internal deadlines for the team.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowReminderForm(prev => !prev)}>
            {showReminderForm ? "Cancel" : "Add reminder"}
          </Button>
        </div>
        {showReminderForm && (
          <form className="grid gap-3 md:grid-cols-4 mb-4" onSubmit={(event) => { event.preventDefault(); if (reminderForm.title.trim()) createReminderMutation.mutate(); }}>
            <Input placeholder="Reminder title" value={reminderForm.title} onChange={(event) => setReminderForm(prev => ({ ...prev, title: event.target.value }))} required />
            <Input type="date" value={reminderForm.dueDate} onChange={(event) => setReminderForm(prev => ({ ...prev, dueDate: event.target.value }))} required />
            <Input placeholder="Description" value={reminderForm.description} onChange={(event) => setReminderForm(prev => ({ ...prev, description: event.target.value }))} />
            <Button type="submit" disabled={createReminderMutation.isPending}>Save reminder</Button>
          </form>
        )}
        <div className="grid gap-2 md:grid-cols-2">
          {reminders.length === 0 ? <p className="text-sm text-muted-foreground">No reminders yet.</p> : reminders.slice(0, 6).map(reminder => (
            <div key={reminder.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{reminder.title}</p>
              <p className="text-xs text-muted-foreground">Due {reminder.due_date || "No date"}{reminder.description ? ` · ${reminder.description}` : ""}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Add / Edit Event Dialog ── */}
      <HearingFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setSelectedDate(null); }}
        onSubmit={(data) => createMutation.mutate(data)}
        initialDate={selectedDate}
        cases={cases}
        staff={staff}
        activeIndustry={activeIndustry}
        calendars={accessibleCalendars}
        selectedCalendarId={selectedCalendarId}
      />

      {/* ── Create New Shared Calendar Modal ── */}
      <Dialog open={showNewCalendarModal} onOpenChange={setShowNewCalendarModal}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Create Shared Team Calendar</span>
            </DialogTitle>
            <DialogDescription>
              Configure calendar visibility, assign teammates, and synchronize schedules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCalendar} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Calendar Name *</Label>
              <Input
                required
                value={newCalendarForm.name}
                onChange={e => setNewCalendarForm({ ...newCalendarForm, name: e.target.value })}
                placeholder="e.g. Site Inspections & Land Viewings"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Visibility Level</Label>
                <Select
                  value={newCalendarForm.visibility}
                  onValueChange={v => setNewCalendarForm({ ...newCalendarForm, visibility: v })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (All Staff)</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Shared Team)</SelectItem>
                    <SelectItem value="private">Private (Only Me)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Calendar Color</Label>
                <div className="flex items-center gap-1.5 mt-2">
                  {CALENDAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCalendarForm({ ...newCalendarForm, color: c })}
                      className={cn(
                        "w-5 h-5 rounded-full transition-all border",
                        newCalendarForm.color === c ? "ring-2 ring-primary ring-offset-1 scale-110" : "hover:opacity-80"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Hybrid Member Selection */}
            {newCalendarForm.visibility === 'hybrid' && (
              <div className="space-y-2 border border-border p-3 rounded-xl bg-muted/20">
                <span className="text-[11px] font-bold uppercase text-muted-foreground">
                  Select Team Members to Share ({newCalendarForm.selectedMembers.length} selected)
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {staff.map(s => {
                    const sId = s.id || s.user_email;
                    const isSelected = newCalendarForm.selectedMembers.some(m => m.id === sId);
                    return (
                      <div
                        key={sId}
                        onClick={() => toggleMemberSelection(s)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border transition-colors",
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "bg-card border-border hover:bg-muted text-foreground"
                        )}
                      >
                        <div>
                          <p>{s.full_name || s.name || s.user_email}</p>
                          <span className="text-[10px] text-muted-foreground">{s.role || s.user_email}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Description / Purpose</Label>
              <Input
                value={newCalendarForm.description}
                onChange={e => setNewCalendarForm({ ...newCalendarForm, description: e.target.value })}
                placeholder="e.g. Coordinated schedule for sales reps and surveyors"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCalendarModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white font-semibold">
                Create Calendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HearingFormDialog({ open, onClose, onSubmit, initialDate, cases, staff, activeIndustry, calendars = [], selectedCalendarId }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    court_name: "",
    judge_name: "",
    case_id: "",
    case_title: "",
    case_number: "",
    lawyer_email: "",
    lawyer_name: "",
    notes: "",
    calendar_id: selectedCalendarId !== 'all' ? selectedCalendarId : ""
  });

  useEffect(() => {
    if (initialDate) setForm(prev => ({ ...prev, date: format(initialDate, "yyyy-MM-dd") }));
  }, [initialDate]);

  useEffect(() => {
    if (selectedCalendarId && selectedCalendarId !== 'all') {
      setForm(prev => ({ ...prev, calendar_id: selectedCalendarId }));
    }
  }, [selectedCalendarId]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const getReadableLabel = (value) => {
    if (!value) return "";
    if (typeof value !== "string") return value.name || value.title || value.address || "Linked record";
    try {
      const parsed = JSON.parse(value);
      return parsed.name || parsed.title || parsed.address || parsed.label || "Linked record";
    } catch {
      return value;
    }
  };

  const handleCaseChange = (caseId) => {
    const c = cases?.find(cs => cs.id === caseId);
    setForm(prev => ({ ...prev, case_id: caseId, case_title: getReadableLabel(c?.title), case_number: c?.case_number || "" }));
  };

  const handleLawyerChange = (email) => {
    const s = staff?.find(st => st.user_email === email);
    setForm(prev => ({ ...prev, lawyer_email: email, lawyer_name: s?.full_name || "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, lawyer_email: form.lawyer_email || '' });
  };

  const hearingTerm = getTerm(activeIndustry, "hearing", true);
  const venueTerm = getTerm(activeIndustry, "venue", true);
  const caseTerm = getTerm(activeIndustry, "case", true);
  const staffTerm = getTerm(activeIndustry, "staff", true);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader><DialogTitle>New {hearingTerm}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div><Label className="text-xs font-semibold">{t("title", "Title *")}</Label><Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} className="mt-1 h-9 text-xs" required /></div>
          
          {calendars.length > 0 && (
            <div>
              <Label className="text-xs font-semibold">Assign to Calendar</Label>
              <Select value={form.calendar_id} onValueChange={v => handleChange("calendar_id", v)}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Default Calendar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default Company Calendar</SelectItem>
                  {calendars.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs font-semibold">{t("date", "Date *")}</Label><Input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} className="mt-1 h-9 text-xs" required /></div>
            <div><Label className="text-xs font-semibold">{t("time", "Time")}</Label><Input type="time" value={form.time} onChange={(e) => handleChange("time", e.target.value)} className="mt-1 h-9 text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs font-semibold">{venueTerm}</Label><Input value={form.court_name} onChange={(e) => handleChange("court_name", e.target.value)} placeholder="e.g. Conference Room A" className="mt-1 h-9 text-xs" /></div>
            <div><Label className="text-xs font-semibold">{staffTerm}</Label>
              <Select value={form.lawyer_email} onValueChange={handleLawyerChange}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder={`Select ${staffTerm}`} /></SelectTrigger>
                <SelectContent>{staff?.map(s => <SelectItem key={s.id || s.user_email} value={s.user_email}>{s.full_name || s.user_email}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs font-semibold">{caseTerm}</Label>
            <Select value={form.case_id} onValueChange={handleCaseChange}>
              <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder={`Select ${caseTerm}`} /></SelectTrigger>
              <SelectContent>{cases?.map(c => <SelectItem key={c.id} value={c.id}>{c.case_number ? `${c.case_number} - ` : ""}{getReadableLabel(c.title)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs font-semibold">{t("notes", "Notes")}</Label><Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} className="mt-1 text-xs" /></div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit" size="sm" className="bg-primary text-white font-semibold">{t("create", "Create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
