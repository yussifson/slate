import { useTranslation } from "react-i18next";
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { CheckSquare, Clock, AlertTriangle, Target, TrendingUp, Calendar, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/shared/PageHeader";
import { TASK_STATUS_COLORS, PRIORITY_COLORS, formatCurrency } from "@/lib/constants";
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth } from "date-fns";

function StatCard({ icon: IconComp, label, value, sub, color = "bg-slate-50 text-primary" }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <IconComp className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["my-tasks", user?.email],
    queryFn: () => base44.entities.Task.filter({ company_id: companyId, assigned_to: user?.email }),
    enabled: !!user?.email && !!companyId,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["my-time", user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ company_id: companyId, lawyer_email: user?.email }),
    enabled: !!user?.email && !!companyId,
  });

  const { data: hearings = [] } = useQuery({
    queryKey: ["my-hearings", companyId],
    queryFn: () => base44.entities.Hearing.filter({ company_id: companyId, lawyer_email: user?.email }),
    enabled: !!user?.email && !!companyId,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["my-cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, assigned_lawyer: user?.email }),
    enabled: !!user?.email && !!companyId,
  });

  const { data: staffRecords = [] } = useQuery({
    queryKey: ["staff-record", user?.email],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId, user_email: user?.email }),
    enabled: !!user?.email && !!companyId,
  });

  const staffRecord = staffRecords[0];

  // Derived data
  const pendingTasks = tasks.filter(item => item.status === "pending" || item.status === "in_progress");
  const overdueTasks = tasks.filter(item => item.due_date && isBefore(new Date(item.due_date), today) && item.status !== "completed" && item.status !== "cancelled");
  const dueSoonTasks = pendingTasks.filter(item => item.due_date && isAfter(new Date(item.due_date), today) && isBefore(new Date(item.due_date), addDays(today, 7)));

  const monthEntries = timeEntries.filter(e => {
    if (!e.start_time) return false;
    const d = new Date(e.start_time);
    return d >= monthStart && d <= monthEnd;
  });

  const billedHours = monthEntries.filter(e => e.billed).reduce((s, e) => s + (e.duration_minutes || 0), 0) / 60;
  const totalHours = monthEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0) / 60;
  const billedAmount = monthEntries.filter(e => e.is_billable).reduce((s, e) => s + (e.billable_amount || 0), 0);

  // Hourly target: assume 120 billable hours/month if not set
  const TARGET_HOURS = 120;
  const hoursProgress = Math.min((totalHours / TARGET_HOURS) * 100, 100);

  const upcomingHearings = hearings
    .filter(h => h.date && isAfter(new Date(h.date), today))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const activeCases = cases.filter(c => ["open", "in_progress", "pending_hearing"].includes(c.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(" ")[0] || "Counselor"}`}
        subtitle={`${format(today, "EEEE, MMMM d, yyyy")} · Your personal workspace`}
      />
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active Cases" value={activeCases.length} color="bg-slate-50 text-primary" />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={pendingTasks.length} sub={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : undefined} color="bg-amber-50 text-amber-600" />
        <StatCard icon={Clock} label="Hours This Month" value={totalHours.toFixed(1)} sub={`${billedHours.toFixed(1)}h billed`} color="bg-slate-50 text-primary" />
        <StatCard icon={TrendingUp} label="Billed Amount" value={formatCurrency(billedAmount, staffRecord?.currency || "GHS")} sub="This month" color="bg-slate-50 text-primary" />
      </div>
      {/* Hours vs Target */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">{t("billable_hours", "Billable Hours —")} {format(today, "MMMM yyyy")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{totalHours.toFixed(1)}{t("h_logged_target", "h logged · Target:")} {TARGET_HOURS}h</p>
          </div>
          <span className="text-lg font-bold text-primary">{hoursProgress.toFixed(0)}%</span>
        </div>
        <Progress value={hoursProgress} className="h-3" />
        <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
          <span>{totalHours.toFixed(1)}{t("h_logged", "h logged")}</span>
          <span>{(TARGET_HOURS - totalHours).toFixed(1)}{t("h_remaining", "h remaining")}</span>
        </div>

        {/* Monthly breakdown by category */}
        {monthEntries.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(
              monthEntries.reduce((acc, e) => {
                const cat = e.category || "other";
                acc[cat] = (acc[cat] || 0) + (e.duration_minutes || 0);
                return acc;
              }, {})
            ).map(([cat, mins]) => {
              return (
                <div key={cat} className="bg-muted/40 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground capitalize">{cat.replace("_", " ")}</p>
                  <p className="text-sm font-semibold">{(mins / 60).toFixed(1)}h</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("my_tasks", "My Tasks")}</h3>
            </div>
            {overdueTasks.length > 0 && (
              <Badge className="bg-red-100 text-red-700 text-[10px] gap-1">
                <AlertTriangle className="w-3 h-3" /> {overdueTasks.length} {t("overdue", "overdue")}
              </Badge>
            )}
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {loadingTasks ? (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("loading", "Loading...")}</div>
            ) : pendingTasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("no_pending_tasks", "No pending tasks 🎉")}</div>
            ) : pendingTasks
                .sort((a, b) => {
                  const aOd = a.due_date && isBefore(new Date(a.due_date), today);
                  const bOd = b.due_date && isBefore(new Date(b.due_date), today);
                  if (aOd && !bOd) return -1;
                  if (!aOd && bOd) return 1;
                  return new Date(a.due_date || 9999) - new Date(b.due_date || 9999);
                })
                .map(task => {
              const isOverdue = task.due_date && isBefore(new Date(task.due_date), today);
              const isDueSoon = !isOverdue && task.due_date && isBefore(new Date(task.due_date), addDays(today, 7));
              return (
                <div key={task.id} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${isOverdue ? "bg-red-500" : isDueSoon ? "bg-amber-500" : "bg-primary/70"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {task.case_title && <span className="text-[10px] text-muted-foreground">{task.case_title}</span>}
                      <Badge className={`${TASK_STATUS_COLORS[task.status]} text-[10px]`}>{task.status?.replace("_", " ")}</Badge>
                      <Badge className={`${PRIORITY_COLORS[task.priority]} text-[10px]`}>{task.priority}</Badge>
                    </div>
                  </div>
                  {task.due_date && (
                    <span className={`text-[10px] font-medium shrink-0 ${isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-muted-foreground"}`}>
                      {isOverdue ? "OVERDUE" : format(new Date(task.due_date), "MMM d")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Hearings */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("upcoming_hearings", "Upcoming Hearings")}</h3>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {upcomingHearings.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("no_upcoming_hearings", "No upcoming hearings")}</div>
            ) : upcomingHearings.map(h => {
              return (
                <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-primary leading-none">{format(new Date(h.date), "MMM")}</span>
                    <span className="text-sm font-bold text-primary leading-none">{format(new Date(h.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.court_name || "—"} · {h.time || "TBD"}</p>
                    {h.case_title && <p className="text-[11px] text-muted-foreground">{h.case_title}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize shrink-0">{h.status}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Active Cases */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("my_active_cases", "My Active Cases")}</h3>
          <span className="ml-auto text-xs text-muted-foreground">{activeCases.length} {t("cases", "cases")}</span>
        </div>
        <div className="divide-y divide-border">
          {activeCases.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("no_active_cases_assigned_to_yo", "No active cases assigned to you")}</div>
          ) : activeCases.slice(0, 6).map(c => {
            return (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.case_number && `#${c.case_number} · `}{c.client_name} · {c.case_type}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.next_hearing_date && (
                    <span className="text-[10px] text-muted-foreground hidden sm:block">
                      {t("hearing", "Hearing:")} {format(new Date(c.next_hearing_date), "MMM d")}
                    </span>
                  )}
                  <Badge className={`text-[10px] capitalize ${c.status === "open" ? "bg-orange-100 text-orange-700" : c.status === "in_progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-primary/90"}`}>
                    {c.status?.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}