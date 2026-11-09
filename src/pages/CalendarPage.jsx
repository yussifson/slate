import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { getTerm } from "@/config/industries";
import { 
  Plus, Calendar, ChevronLeft, ChevronRight, Globe, Lock, 
  Users, Check, Settings, Trash2, Tag, Filter, UserPlus, Clock,
  Briefcase, Building2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { useCompany } from "@/hooks/useCompanyId";
import { supabase } from "@/api/supabaseClient";
import { powerSync } from "@/api/PowerSyncConnector";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const CALENDAR_COLORS = [
  '#005A9C', // JCL Corporate Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Sky Blue
  '#14b8a6', // Teal
  '#ef4444', // Red
];

export default function CalendarPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { company } = useCompany();
  const companyId = user?.company_id || company?.id;
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

  // ── Three-Way Scope Filter: 'all' | 'personal' | 'departmental' | 'general' ──
  const [scopeFilter, setScopeFilter] = useState('all');

  // Multi-User Custom Calendars State
  const [calendars, setCalendars] = useState([]);
  const [calendarMembers, setCalendarMembers] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('all');
  const [showNewCalendarModal, setShowNewCalendarModal] = useState(false);

  const [newCalendarForm, setNewCalendarForm] = useState({
    name: '',
    description: '',
    color: '#005A9C',
    visibility: 'public', // 'public' | 'private' | 'hybrid'
    scope: 'general', // 'general' | 'departmental' | 'personal'
    department: '',
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

  // Current user's department
  const userDepartment = useMemo(() => {
    const fromStaff = staff.find(s => s.user_email === user?.email || s.user_id === user?.id);
    return fromStaff?.department || user?.department || user?.user_metadata?.department || '';
  }, [staff, user]);

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
      toast.success('Calendar event saved successfully');
    },
    onError: (error) => { 
      console.error('[v0] Calendar creation failed:', error); 
      toast.error('Could not save calendar event.'); 
    }
  });

  // Handle Create New Custom Shared Calendar
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
        scope: newCalendarForm.scope,
        department: newCalendarForm.department || '',
        created_by: user?.id,
        created_by_email: user?.email,
        created_at: new Date().toISOString()
      };

      await supabase.from('calendars').insert([newCal]);

      // If hybrid/assigned members, insert members
      const newMems = [];
      if (newCalendarForm.selectedMembers.length > 0) {
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
        color: '#005A9C',
        visibility: 'public',
        scope: 'general',
        department: '',
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

  // Helper to extract tagged metadata from outcome JSON or notes
  const parseEventMeta = (h) => {
    let meta = { scope: 'general', department: '', attendees: [] };
    if (h.outcome) {
      try {
        const parsed = JSON.parse(h.outcome);
        if (parsed.scope) meta.scope = parsed.scope;
        if (parsed.department) meta.department = parsed.department;
        if (Array.isArray(parsed.attendees)) meta.attendees = parsed.attendees;
      } catch (_e) {}
    }
    // Also check notes tag fallback: [scope:departmental|dept:Finance|attendees:...]
    if (!meta.department && h.notes && h.notes.includes('[scope:')) {
      const match = h.notes.match(/\[scope:([a-z]+)(?:\|dept:([^|\]]+))?(?:\|attendees:([^\]]+))?\]/);
      if (match) {
        meta.scope = match[1] || meta.scope;
        if (match[2]) meta.department = match[2];
        if (match[3]) meta.attendees = match[3].split(',').map(s => s.trim());
      }
    }
    return meta;
  };

  // Determine accessible calendars for current user
  const accessibleCalendars = useMemo(() => {
    return calendars.filter(cal => {
      if (cal.visibility === 'public') return true;
      if (cal.created_by === user?.id || cal.created_by_email === user?.email) return true;
      if (isAdminUser) return true;
      if (cal.visibility === 'hybrid') {
        return calendarMembers.some(
          m => m.calendar_id === cal.id && (m.member_id === user?.id || m.member_email === user?.email)
        );
      }
      return false;
    });
  }, [calendars, calendarMembers, user, isAdminUser]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay();

  // Enforce Calendar toggles, Three-Way Scopes (Personal / Departmental / General), and Visibility
  const filteredHearings = hearings.filter(h => {
    // 1. If a specific shared calendar is selected
    if (selectedCalendarId !== 'all') {
      if (h.calendar_id !== selectedCalendarId) return false;
    }

    const meta = parseEventMeta(h);
    const isMine = h.created_by === user?.id || h.created_by_email === user?.email || h.lawyer_email === user?.email;
    const isInvited = meta.attendees.includes(user?.email) || meta.attendees.includes(user?.id);
    const matchesMyDept = userDepartment && meta.department && (meta.department.toLowerCase() === userDepartment.toLowerCase());

    // 2. Filter by Scope Pills (Personal, Departmental, General)
    if (scopeFilter === 'personal') {
      // Must be marked personal or created by me with personal scope
      if (meta.scope !== 'personal' && !isMine) return false;
      if (meta.scope !== 'personal' && meta.scope !== 'individual' && meta.scope) return false;
    } else if (scopeFilter === 'departmental') {
      // Must be departmental scope
      if (meta.scope !== 'departmental') return false;
      // Must match my department or user is attendee or user is admin
      if (!isAdminUser && !matchesMyDept && !isMine && !isInvited) return false;
    } else if (scopeFilter === 'general') {
      // General company-wide
      if (meta.scope && meta.scope !== 'general' && meta.scope !== 'company') return false;
    }

    // 3. User access check for non-admins when viewing all
    if (!isAdminUser) {
      if (meta.scope === 'personal') {
        return isMine || isInvited;
      }
      if (meta.scope === 'departmental') {
        return matchesMyDept || isMine || isInvited;
      }
      // General is accessible to all
      return true;
    }

    // 4. Admin toggles
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
  const venueTerm = getTerm(activeIndustry, "venue");

  return (
    <div className="space-y-4 font-sans w-full max-w-full">
      {/* ── Top Bar with Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#005A9C]" />
            Corporate & Team Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Coordinate individual schedules, departmental deadlines, and company-wide events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowNewCalendarModal(true)} variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5 rounded-xl border-border">
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Custom Calendar</span>
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm" className="h-9 px-3.5 text-xs gap-1.5 font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-md shadow-[#005A9C]/20 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> <span>Add Event</span>
          </Button>
        </div>
      </div>

      {/* ── 3-Way Calendar Scope Pills: Personal, Departmental, General ── */}
      <div className="bg-card rounded-2xl border border-border p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#005A9C]" /> View Scope:
          </span>

          <button
            onClick={() => setScopeFilter('all')}
            className={cn(
              "text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all border",
              scopeFilter === 'all'
                ? "bg-[#005A9C] text-white border-[#005A9C] shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            All Events ({hearings.length})
          </button>

          <button
            onClick={() => setScopeFilter('personal')}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all border",
              scopeFilter === 'personal'
                ? "bg-[#005A9C] text-white border-[#005A9C] shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Calendar</span>
          </button>

          <button
            onClick={() => setScopeFilter('departmental')}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all border",
              scopeFilter === 'departmental'
                ? "bg-[#005A9C] text-white border-[#005A9C] shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Departmental {userDepartment ? `(${userDepartment})` : ''}</span>
          </button>

          <button
            onClick={() => setScopeFilter('general')}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all border",
              scopeFilter === 'general'
                ? "bg-[#005A9C] text-white border-[#005A9C] shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>General / Company-Wide</span>
          </button>
        </div>

        {/* Selected Calendar Indicator */}
        {accessibleCalendars.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-muted-foreground font-semibold">Calendar:</span>
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="bg-muted/60 text-foreground text-xs font-semibold py-1 px-2.5 rounded-lg border border-border outline-hidden"
            >
              <option value="all">All Channels</option>
              {accessibleCalendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Calendar Controls (Admin / Staff visibility toggles) */}
      {isAdminUser && (
        <div className="bg-card rounded-xl border border-border p-3 flex gap-6 items-center text-xs select-none">
          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            {t("toggles", "Admin Filters:")}
          </span>
          <label className="flex items-center gap-2 cursor-pointer hover:opacity-90">
            <input
              type="checkbox"
              checked={showAdminCalendar}
              onChange={(e) => setShowAdminCalendar(e.target.checked)}
              className="rounded text-[#005A9C] focus:ring-[#005A9C] border-border"
            />
            <span className="font-medium text-foreground">{t("firm_admin_calendar", "Leadership & Executive")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:opacity-90">
            <input
              type="checkbox"
              checked={showStaffCalendar}
              onChange={(e) => setShowStaffCalendar(e.target.checked)}
              className="rounded text-[#005A9C] focus:ring-[#005A9C] border-border"
            />
            <span className="font-medium text-foreground">{t("staff_calendars", "Team Operational Events")}</span>
          </label>
        </div>
      )}

      {/* Main Grid: Calendar Month View & Upcoming Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h3>
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
              <div key={`pad-${i}`} className="bg-card min-h-[85px] p-1 opacity-40" />
            ))}
            {days.map(day => {
              const dayHearings = getHearingsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-card min-h-[90px] p-1.5 hover:bg-muted/40 cursor-pointer transition-colors ${isToday(day) ? "ring-2 ring-[#005A9C] ring-inset" : ""}`}
                  onClick={() => { setSelectedDate(day); setShowForm(true); }}
                >
                  <span className={`text-xs font-semibold ${isToday(day) ? "text-[#005A9C] font-bold" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayHearings.slice(0, 2).map(h => {
                      const meta = parseEventMeta(h);
                      const calMatch = calendars.find(c => c.id === h.calendar_id);
                      const color = meta.scope === 'personal'
                        ? '#8b5cf6'
                        : meta.scope === 'departmental'
                        ? '#005A9C'
                        : calMatch?.color || '#0284c7';

                      return (
                        <div 
                          key={h.id} 
                          className="text-[10px] rounded px-1.5 py-0.5 truncate font-medium flex items-center justify-between gap-1 shadow-2xs text-white"
                          style={{ backgroundColor: color }}
                          title={`${h.title} (${meta.scope.toUpperCase()})`}
                        >
                          <span className="truncate">{h.title}</span>
                          <span className="text-[8px] opacity-80 uppercase tracking-tighter shrink-0">
                            {meta.scope === 'personal' ? 'Me' : meta.scope === 'departmental' ? 'Dept' : 'All'}
                          </span>
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

        {/* Upcoming Events Column */}
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/15 flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-[#005A9C]" /> Upcoming Agenda
            </h3>
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-[#005A9C] border-[#005A9C]/30">
              {scopeFilter}
            </Badge>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[520px]">
            {upcomingHearings.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No upcoming events in this scope.
              </div>
            ) : upcomingHearings.map(h => {
              const meta = parseEventMeta(h);
              const calMatch = calendars.find(c => c.id === h.calendar_id);
              const scopeBadgeColor = meta.scope === 'personal'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                : meta.scope === 'departmental'
                ? 'bg-blue-100 text-[#005A9C] dark:bg-blue-950/40 dark:text-sky-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';

              return (
                <div key={h.id} className="px-4 py-3.5 space-y-1.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{h.title}</p>
                    <Badge className={cn("text-[9px] px-2 py-0.5 uppercase font-bold shrink-0 border-0", scopeBadgeColor)}>
                      {meta.scope}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(h.date), "MMM d, yyyy")} · {h.time || "All Day"} {h.court_name ? `· ${h.court_name}` : ''}
                  </p>
                  {meta.department && (
                    <p className="text-[11px] font-semibold text-[#005A9C] dark:text-sky-400">
                      Dept: {meta.department}
                    </p>
                  )}
                  {meta.attendees && meta.attendees.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
                      <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{meta.attendees.length} attendee(s) tagged</span>
                    </div>
                  )}
                  {h.notes && !h.notes.startsWith('[scope:') && (
                    <p className="text-xs text-muted-foreground line-clamp-1 italic">{h.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Corporate Reminders Section */}
      <section className="bg-card rounded-2xl border border-border p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Operational Deadlines & Reminders</h3>
            <p className="text-xs text-muted-foreground">Follow-ups and internal commitments for the organization.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowReminderForm(prev => !prev)} className="rounded-xl text-xs h-8">
            {showReminderForm ? "Cancel" : "Add Reminder"}
          </Button>
        </div>
        {showReminderForm && (
          <form className="grid gap-3 md:grid-cols-4 mb-4" onSubmit={(event) => { event.preventDefault(); if (reminderForm.title.trim()) createReminderMutation.mutate(); }}>
            <Input placeholder="Reminder title" value={reminderForm.title} onChange={(event) => setReminderForm(prev => ({ ...prev, title: event.target.value }))} required className="h-9 text-xs" />
            <Input type="date" value={reminderForm.dueDate} onChange={(event) => setReminderForm(prev => ({ ...prev, dueDate: event.target.value }))} required className="h-9 text-xs" />
            <Input placeholder="Description" value={reminderForm.description} onChange={(event) => setReminderForm(prev => ({ ...prev, description: event.target.value }))} className="h-9 text-xs" />
            <Button type="submit" disabled={createReminderMutation.isPending} className="h-9 text-xs font-bold bg-[#005A9C] text-white">Save Reminder</Button>
          </form>
        )}
        <div className="grid gap-2 md:grid-cols-2">
          {reminders.length === 0 ? <p className="text-xs text-muted-foreground">No pending reminders recorded.</p> : reminders.slice(0, 6).map(reminder => (
            <div key={reminder.id} className="rounded-xl border border-border p-3 bg-muted/10">
              <p className="text-sm font-semibold text-foreground">{reminder.title}</p>
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
        currentUser={user}
        userDepartment={userDepartment}
      />

      {/* ── Create New Shared Calendar Modal ── */}
      <Dialog open={showNewCalendarModal} onOpenChange={setShowNewCalendarModal}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Calendar className="w-5 h-5 text-[#005A9C]" />
              <span>Create Shared Team Calendar</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure calendar visibility, assign departmental scope, and synchronize schedules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCalendar} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Calendar Name *</Label>
              <Input
                required
                value={newCalendarForm.name}
                onChange={e => setNewCalendarForm({ ...newCalendarForm, name: e.target.value })}
                placeholder="e.g. Sales Team Viewings & Closings"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Scope</Label>
                <Select
                  value={newCalendarForm.scope}
                  onValueChange={v => setNewCalendarForm({ ...newCalendarForm, scope: v })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General (Company-Wide)</SelectItem>
                    <SelectItem value="departmental">Departmental</SelectItem>
                    <SelectItem value="personal">Personal (Private)</SelectItem>
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
                        newCalendarForm.color === c ? "ring-2 ring-[#005A9C] ring-offset-1 scale-110" : "hover:opacity-80"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {newCalendarForm.scope === 'departmental' && (
              <div>
                <Label className="text-xs font-semibold">Department Tag</Label>
                <Input
                  value={newCalendarForm.department}
                  onChange={e => setNewCalendarForm({ ...newCalendarForm, department: e.target.value })}
                  placeholder="e.g. Marketing, Engineering, Accounting"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            )}

            {/* Member Selection */}
            <div className="space-y-2 border border-border p-3 rounded-xl bg-muted/20">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">
                Add Colleagues ({newCalendarForm.selectedMembers.length} selected)
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
                          ? "bg-[#005A9C]/10 border-[#005A9C] text-[#005A9C] font-semibold"
                          : "bg-card border-border hover:bg-muted text-foreground"
                      )}
                    >
                      <div>
                        <p>{s.full_name || s.name || s.user_email}</p>
                        <span className="text-[10px] text-muted-foreground">{s.role || s.user_email} {s.department ? `· ${s.department}` : ''}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#005A9C]" />}
                    </div>
                  );
                })}
              </div>
            </div>

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
              <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white font-semibold">
                Create Calendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HearingFormDialog({ open, onClose, onSubmit, initialDate, cases, staff, activeIndustry, calendars = [], selectedCalendarId, currentUser, userDepartment }) {
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
    calendar_id: selectedCalendarId !== 'all' ? selectedCalendarId : "",
    scope: "general", // 'personal' | 'departmental' | 'general'
    department: userDepartment || "",
    selectedAttendees: [] // list of staff emails
  });

  useEffect(() => {
    if (initialDate) setForm(prev => ({ ...prev, date: format(initialDate, "yyyy-MM-dd") }));
  }, [initialDate]);

  useEffect(() => {
    if (selectedCalendarId && selectedCalendarId !== 'all') {
      setForm(prev => ({ ...prev, calendar_id: selectedCalendarId }));
    }
  }, [selectedCalendarId]);

  useEffect(() => {
    if (userDepartment && !form.department) {
      setForm(prev => ({ ...prev, department: userDepartment }));
    }
  }, [userDepartment]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleAttendee = (email) => {
    setForm(prev => {
      const exists = prev.selectedAttendees.includes(email);
      return {
        ...prev,
        selectedAttendees: exists
          ? prev.selectedAttendees.filter(e => e !== email)
          : [...prev.selectedAttendees, email]
      };
    });
  };

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

    // Package scope, department, and attendees into outcome JSON for clean sync persistence
    const metaPayload = {
      scope: form.scope,
      department: form.department || '',
      attendees: form.selectedAttendees,
      created_by: currentUser?.id,
      created_by_name: currentUser?.user_metadata?.full_name || currentUser?.name || currentUser?.email
    };

    // Store in outcome field and add clean bracket tag to notes as fallback
    const outcomeJson = JSON.stringify(metaPayload);
    const scopeTag = `[scope:${form.scope}${form.department ? `|dept:${form.department}` : ''}${form.selectedAttendees.length > 0 ? `|attendees:${form.selectedAttendees.join(',')}` : ''}]`;
    const finalNotes = form.notes ? `${scopeTag} ${form.notes}` : scopeTag;

    onSubmit({
      title: form.title,
      date: form.date,
      time: form.time,
      court_name: form.court_name,
      judge_name: form.judge_name,
      case_id: form.case_id,
      case_title: form.case_title,
      case_number: form.case_number,
      lawyer_email: form.lawyer_email || '',
      lawyer_name: form.lawyer_name || '',
      calendar_id: form.calendar_id || null,
      notes: finalNotes,
      outcome: outcomeJson,
      status: "scheduled"
    });
  };

  const hearingTerm = getTerm(activeIndustry, "hearing", true);
  const venueTerm = getTerm(activeIndustry, "venue", true);
  const caseTerm = getTerm(activeIndustry, "case", true);
  const staffTerm = getTerm(activeIndustry, "staff", true);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
            <Calendar className="w-5 h-5 text-[#005A9C]" />
            New Calendar Event
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Schedule an event with scope visibility (Personal, Departmental, or General) and invite colleagues.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <Label className="text-xs font-semibold">{t("title", "Event Title *")}</Label>
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Client Viewing / Weekly Sprint / Firm All-Hands"
              className="mt-1 h-9 text-xs"
              required
            />
          </div>

          {/* Scope Selector: Personal, Departmental, General */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Calendar Scope *</Label>
              <Select value={form.scope} onValueChange={v => handleChange("scope", v)}>
                <SelectTrigger className="mt-1 h-9 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal (Private to Me)</SelectItem>
                  <SelectItem value="departmental">Departmental (Team Only)</SelectItem>
                  <SelectItem value="general">General (Entire Company)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">
                {form.scope === 'departmental' ? 'Target Department *' : 'Department Tag'}
              </Label>
              <Input
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="e.g. Marketing, Sales, Engineering"
                className="mt-1 h-9 text-xs"
                required={form.scope === 'departmental'}
              />
            </div>
          </div>

          {/* Multi-Attendee Tagging */}
          <div className="space-y-1.5 border border-border p-3 rounded-xl bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#005A9C]" />
                Invite Colleagues & Attendees ({form.selectedAttendees.length} tagged)
              </Label>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {staff.map(s => {
                const sEmail = s.user_email || s.email;
                if (!sEmail) return null;
                const isSelected = form.selectedAttendees.includes(sEmail);
                return (
                  <div
                    key={s.id || sEmail}
                    onClick={() => toggleAttendee(sEmail)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border transition-colors",
                      isSelected
                        ? "bg-[#005A9C]/10 border-[#005A9C] text-[#005A9C] font-bold"
                        : "bg-card border-border hover:bg-muted text-foreground"
                    )}
                  >
                    <div>
                      <p>{s.full_name || s.name || sEmail}</p>
                      <span className="text-[10px] text-muted-foreground">{sEmail} {s.department ? `· ${s.department}` : ''}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#005A9C]" />}
                  </div>
                );
              })}
            </div>
          </div>

          {calendars.length > 0 && (
            <div>
              <Label className="text-xs font-semibold">Assign to Channel / Calendar</Label>
              <Select value={form.calendar_id} onValueChange={v => handleChange("calendar_id", v)}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Default Company Calendar" />
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
            <div>
              <Label className="text-xs font-semibold">{t("date", "Date *")}</Label>
              <Input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} className="mt-1 h-9 text-xs" required />
            </div>
            <div>
              <Label className="text-xs font-semibold">{t("time", "Time")}</Label>
              <Input type="time" value={form.time} onChange={(e) => handleChange("time", e.target.value)} className="mt-1 h-9 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Venue / Location</Label>
              <Input value={form.court_name} onChange={(e) => handleChange("court_name", e.target.value)} placeholder="e.g. Conference Room A / Zoom Link" className="mt-1 h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Lead Host / Owner</Label>
              <Select value={form.lawyer_email} onValueChange={handleLawyerChange}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select Host" /></SelectTrigger>
                <SelectContent>
                  {staff?.map(s => <SelectItem key={s.id || s.user_email} value={s.user_email}>{s.full_name || s.user_email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {cases?.length > 0 && (
            <div>
              <Label className="text-xs font-semibold">Linked Project / File (Optional)</Label>
              <Select value={form.case_id} onValueChange={handleCaseChange}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select linked file" /></SelectTrigger>
                <SelectContent>
                  {cases?.map(c => <SelectItem key={c.id} value={c.id}>{c.case_number ? `${c.case_number} - ` : ""}{getReadableLabel(c.title)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold">{t("notes", "Description / Agenda Notes")}</Label>
            <Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Provide agenda or notes for attendees..." className="mt-1 text-xs" />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white font-bold">{t("create", "Save Event")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
