import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { getTerm } from "@/config/industries";
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";

export default function CalendarPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const isAdminUser = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);
  const [showAdminCalendar, setShowAdminCalendar] = useState(true);
  const [showStaffCalendar, setShowStaffCalendar] = useState(true);

  const activeIndustry = sessionStorage.getItem("slate_industry_override") || user?.company_industry || "law";

  const { data: hearings = [] } = useQuery({
    queryKey: ["hearings", companyId],
    queryFn: () => base44.entities.Hearing.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId, user?.email, isAdminUser],
    queryFn: async () => {
      const list = await base44.entities.LegalCase.filter({ company_id: companyId });
      if (isAdminUser) return list;
      return list.filter(c => c.assigned_lawyer === user?.email || c.created_by === user?.id);
    },
    enabled: !!companyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hearing.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hearings"] }); setShowForm(false); },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay();

  // Enforce Calendar toggles and assigned visibility logic
  const filteredHearings = hearings.filter(h => {
    if (!isAdminUser) {
      return h.lawyer_email === user?.email;
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
    <div className="space-y-4 font-sans">
      <PageHeader
        title={getTerm(activeIndustry, "hearing", true) + " Calendar"}
        subtitle={`${hearingTermPlural} and important dates`}
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Add {getTerm(activeIndustry, "hearing", true)}</Button>}
      />
      {/* Calendar Controls (Admin / Staff visibility toggles) */}
      {isAdminUser && (
        <div className="bg-card rounded-xl border border-border p-4 flex gap-6 items-center text-sm shadow-sm select-none">
          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">{t("toggles", "Toggles:")}</span>
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
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>{t("today", "Today")}</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => {
              return (<div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>);
            })}
            {Array(startPad).fill(null).map((_, i) => {
              return (<div key={`pad-${i}`} className="bg-card min-h-[80px] p-1" />);
            })}
            {days.map(day => {
              const dayHearings = getHearingsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-card min-h-[80px] p-1.5 hover:bg-muted/50 cursor-pointer transition-colors ${isToday(day) ? "ring-2 ring-primary ring-inset" : ""}`}
                  onClick={() => { setSelectedDate(day); setShowForm(true); }}
                >
                  <span className={`text-xs font-medium ${isToday(day) ? "text-primary font-bold" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayHearings.slice(0, 2).map(h => {
                      return (
                        <div key={h.id} className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 truncate">
                          {h.title}
                        </div>
                      );
                    })}
                    {dayHearings.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{dayHearings.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Upcoming {getTerm(activeIndustry, "hearing", true)}s
            </h3>
          </div>
          <div className="divide-y divide-border">
            {upcomingHearings.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No upcoming {hearingTerm}s</div>
            ) : upcomingHearings.map(h => {
              return (
                <div key={h.id} className="px-4 py-3">
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(h.date), "MMM d, yyyy")} · {h.time || "TBD"} · {h.court_name || `${getTerm(activeIndustry, "venue", true)} TBD`}
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    <Badge variant="outline" className="text-[10px]">{h.case_number || h.case_title || "—"}</Badge>
                    <Badge className={`text-[10px] ${h.status === "scheduled" ? "bg-orange-100 text-orange-700" : h.status === "completed" ? "bg-primary/10 text-primary/90" : "bg-slate-100 text-slate-600"}`}>
                      {h.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <HearingFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setSelectedDate(null); }}
        onSubmit={(data) => createMutation.mutate(data)}
        initialDate={selectedDate}
        cases={cases}
        staff={staff}
        activeIndustry={activeIndustry}
      />
    </div>
  );
}

function HearingFormDialog({ open, onClose, onSubmit, initialDate, cases, staff, activeIndustry }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: "", date: "", time: "", court_name: "", judge_name: "", case_id: "", case_title: "", case_number: "", lawyer_email: "", lawyer_name: "", notes: "" });

  useEffect(() => {
    if (initialDate) setForm(prev => ({ ...prev, date: format(initialDate, "yyyy-MM-dd") }));
  }, [initialDate]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCaseChange = (caseId) => {
    const c = cases?.find(cs => cs.id === caseId);
    setForm(prev => ({ ...prev, case_id: caseId, case_title: c?.title || "", case_number: c?.case_number || "" }));
  };

  const handleLawyerChange = (email) => {
    const s = staff?.find(st => st.user_email === email);
    setForm(prev => ({ ...prev, lawyer_email: email, lawyer_name: s?.full_name || "" }));
  };

  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  const hearingTerm = getTerm(activeIndustry, "hearing", true);
  const venueTerm = getTerm(activeIndustry, "venue", true);
  const caseTerm = getTerm(activeIndustry, "case", true);
  const staffTerm = getTerm(activeIndustry, "staff", true);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New {hearingTerm}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>{t("title", "Title *")}</Label><Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{t("date", "Date *")}</Label><Input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} required /></div>
            <div><Label>{t("time", "Time")}</Label><Input type="time" value={form.time} onChange={(e) => handleChange("time", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{venueTerm}</Label><Input value={form.court_name} onChange={(e) => handleChange("court_name", e.target.value)} /></div>
            <div><Label>{activeIndustry === "law" ? "Judge" : "Supervisor / Host"}</Label><Input value={form.judge_name} onChange={(e) => handleChange("judge_name", e.target.value)} /></div>
          </div>
          <div>
            <Label>{caseTerm}</Label>
            <Select value={form.case_id} onValueChange={handleCaseChange}>
              <SelectTrigger><SelectValue placeholder={`Link to ${caseTerm.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>{cases?.map(c => {
                return <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{staffTerm}</Label>
            <Select value={form.lawyer_email} onValueChange={handleLawyerChange}>
              <SelectTrigger><SelectValue placeholder={`Assign ${staffTerm.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>{staff?.filter(s => ["lawyer", "company_admin", "teacher", "doctor", "staff"].includes(s.role) || s.role?.includes("admin")).map(s => {
                return <SelectItem key={s.user_email} value={s.user_email}>{s.full_name}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("notes", "Notes")}</Label><Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={2} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">Create {hearingTerm}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}