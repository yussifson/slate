import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { TrendingUp, Briefcase, Clock, CheckSquare, DollarSign, Trophy } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";

export default function PerformanceDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [period, setPeriod] = useState("this_month");

  const getPeriodRange = () => {
    const now = new Date();
    if (period === "this_month") return { start: startOfMonth(now), end: endOfMonth(now) };
    if (period === "last_month") { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
    return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
  };

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });
  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time-entries", companyId],
    queryFn: () => base44.entities.TimeEntry.filter({ company_id: companyId }),
    enabled: !!companyId,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", companyId],
    queryFn: () => base44.entities.Task.filter({ company_id: companyId }),
    enabled: !!companyId,
  });
  const { data: outcomes = [] } = useQuery({
    queryKey: ["outcomes", companyId],
    queryFn: () => base44.entities.CaseOutcome.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { start, end } = getPeriodRange();

  const lawyers = staff.filter(s => s.role === "lawyer");

  const getMetrics = (lawyerEmail) => {
    const periodEntries = timeEntries.filter(e => {
      if (!e.start_time || e.lawyer_email !== lawyerEmail) return false;
      const d = new Date(e.start_time);
      return d >= start && d <= end;
    });
    const activeCases = cases.filter(c => c.assigned_lawyer === lawyerEmail && ["open", "in_progress", "pending_hearing"].includes(c.status));
    const completedTasks = tasks.filter(item => item.assigned_to === lawyerEmail && item.status === "completed");
    const totalHours = periodEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0) / 60;
    const billedAmount = periodEntries.filter(e => e.is_billable).reduce((s, e) => s + (e.billable_amount || 0), 0);
    const lawyerOutcomes = outcomes.filter(o => o.assigned_lawyer === lawyerEmail);
    const wins = lawyerOutcomes.filter(o => o.outcome === "won").length;
    const winRate = lawyerOutcomes.length > 0 ? Math.round((wins / lawyerOutcomes.length) * 100) : null;
    return { activeCases: activeCases.length, totalHours, billedAmount, completedTasks: completedTasks.length, winRate, totalOutcomes: lawyerOutcomes.length };
  };

  const lawyerMetrics = lawyers.map(l => ({ ...l, metrics: getMetrics(l.user_email) })).sort((a, b) => b.metrics.billedAmount - a.metrics.billedAmount);

  const chartData = lawyerMetrics.slice(0, 8).map(l => ({
    name: l.full_name?.split(" ")[0] || l.user_email?.split("@")[0],
    hours: parseFloat(l.metrics.totalHours.toFixed(1)),
    cases: l.metrics.activeCases,
  }));

  const topBiller = lawyerMetrics[0];
  const currency = user?.company_currency || "GHS";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Dashboard"
        subtitle="Firm-wide lawyer performance metrics"
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">{t("this_month", "This Month")}</SelectItem>
              <SelectItem value="last_month">{t("last_month", "Last Month")}</SelectItem>
              <SelectItem value="3months">{t("last_3_months", "Last 3 Months")}</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {/* Top Performer Highlight */}
      {topBiller && (
        <div className="bg-gradient-to-r from-primary to-primary/70 rounded-xl p-5 text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900/40/20 flex items-center justify-center text-xl font-bold shrink-0">
            {topBiller.full_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-300" /><span className="text-xs font-bold text-white/80 uppercase tracking-wide">{t("top_performer", "Top Performer")}</span></div>
            <p className="text-lg font-bold">{topBiller.full_name}</p>
            <p className="text-sm text-white/80">{topBiller.metrics.totalHours.toFixed(1)}{t("h_logged", "h logged ·")} {formatCurrency(topBiller.metrics.billedAmount, currency)} {t("billed", "billed ·")} {topBiller.metrics.activeCases} {t("active_cases", "active cases")}</p>
          </div>
          {topBiller.metrics.winRate !== null && (
            <div className="text-center shrink-0">
              <p className="text-3xl font-bold">{topBiller.metrics.winRate}%</p>
              <p className="text-xs text-white/80">{t("win_rate", "win rate")}</p>
            </div>
          )}
        </div>
      )}
      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-primary/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("hours_logged_by_lawyer", "Hours Logged by Lawyer")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Lawyer Cards */}
      <div className="space-y-3">
        {lawyerMetrics.map((lawyer, idx) => {
          return (
            <div key={lawyer.id} className="bg-card border border-primary/40 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{lawyer.full_name?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
                    <p className="text-sm font-semibold truncate">{lawyer.full_name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{lawyer.department || "Lawyer"}</p>
                </div>
                {lawyer.metrics.winRate !== null && (
                  <Badge className={cn("text-xs", lawyer.metrics.winRate >= 60 ? "bg-slate-100 text-primary/90" : "bg-amber-100 text-amber-700")}>
                    {lawyer.metrics.winRate}{t("win_rate", "% win rate")}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Briefcase, label: "Active Cases", value: lawyer.metrics.activeCases },
                  { icon: Clock, label: "Hours", value: lawyer.metrics.totalHours.toFixed(1) + "h" },
                  { icon: DollarSign, label: "Billed", value: formatCurrency(lawyer.metrics.billedAmount, currency) },
                  { icon: CheckSquare, label: "Tasks Done", value: lawyer.metrics.completedTasks },
                ].map(m => {
                  return (
                    <div key={m.label} className="bg-muted/40 rounded-lg p-2.5 flex items-center gap-2">
                      <m.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div><p className="text-sm font-semibold">{m.value}</p><p className="text-[10px] text-muted-foreground">{m.label}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {lawyerMetrics.length === 0 && (
          <div className="bg-card border border-primary/40 rounded-xl p-10 text-center text-sm text-muted-foreground">{t("no_lawyer_records_found", "No lawyer records found")}</div>
        )}
      </div>
    </div>
  );
}