import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import RunIntelligenceButton from '@/components/RunIntelligenceButton';

import { getTerm } from "@/config/industries";
import { Users, Layers, Calendar, HandCoins, BarChart2, RefreshCw, Building2, Settings2, Clock } from "lucide-react";
import HearingReminders from "@/components/dashboard/HearingReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, formatCurrency } from "@/lib/constants";
import { format, isAfter } from "date-fns";
import { buildMonthlyRevenueChart, buildDistributionChart } from "@/lib/dashboardCharts";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

function MetricCard({ title, value, icon: Icon, iconBg, iconColor, subtitle, subtitleColor }) {
  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div>
        <p className="text-[11px] font-medium text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.05em] uppercase">{title}</p>
        <p className="text-2xl font-semibold text-foreground tracking-[-0.03em] tabular-nums">{value}</p>
        {subtitle && <p className={`text-xs mt-1 ${subtitleColor || "text-[#71717a] dark:text-gray-400"}`}>{subtitle}</p>}
      </div>
      <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

function UsageRow({ label, used, max, suffix = "" }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isHigh = pct > 80;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-[#71717a] dark:text-gray-400 text-xs tabular-nums tracking-[0.04em]">{used}{suffix} / {max}{suffix}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReligionDashboard({ companyId, company, isAdmin }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const industry = "religion";

  const { data: groups = [] } = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: members = [] } = useQuery({ queryKey: ["clients", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: events = [] } = useQuery({ queryKey: ["hearings", companyId], queryFn: () => base44.entities.Hearing.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", companyId], queryFn: () => base44.entities.Task.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: donations = [] } = useQuery({ queryKey: ["invoices", companyId], queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: staff = [] } = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), enabled: !!companyId });

  const activeGroups = groups.filter(g => ["open", "in_progress", "pending_hearing"].includes(g.status));
  const activeMembers = members.filter(m => m.status === "active");
  const pendingTasks = tasks.filter(item => ["pending", "in_progress"].includes(item.status));
  const totalDonationsAmount = donations.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const currency = company?.currency || "GHS";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;

  const groupsTermPlural = getTerm(industry, "cases") || "Groups";
  const membersTermPlural = getTerm(industry, "clients") || "Members";
  const eventsTermPlural = getTerm(industry, "hearings") || "Events";
  const groupTerm = getTerm(industry, "case") || "Group";

  const chartData = buildMonthlyRevenueChart(donations);
  const groupDistribution = buildDistributionChart(groups, "stage");

  const upcomingEvents = events
    .filter(e => e.status === "scheduled" && e.date && isAfter(new Date(e.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Dashboard refreshed", description: "All data is up to date." });
    }, 500);
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
          <Building2 className="w-12 h-12 text-primary" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight tracking-[-0.02em]">{t("welcome_to_your_workslate", "Welcome to your workslate")}</h1>
          <p className="text-slate-500 text-lg">{t(
            "you_haven_t_set_up_your_firm_y",
            "You haven't set up your firm yet. Configure your details to unlock your dashboard and features."
          )}</p>
        </div>
        <Button onClick={() => window.location.href = '/onboarding'} size="lg" className="mt-4 px-8 h-12 text-md">
          <Settings2 className="w-5 h-5 mr-2" />
          {t("setup_now", "Setup Now")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Event Reminders */}
      <HearingReminders hearings={events} userEmail={user?.email} isAdmin={isAdmin} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{t("dashboard", "Dashboard")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2.5 text-xs tracking-[0.04em]">
            <BarChart2 className="w-3.5 h-3.5" /> {t("analytics", "Analytics")}
          </Button>
          <RunIntelligenceButton vertical={industry} />
          <Button variant="outline" size="sm" className="gap-2.5 text-xs tracking-[0.04em]" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Intelligence Dashboard */}
      <div className="mb-6">
        <IntelligenceDashboard vertical={industry} compact={true} maxItems={3} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title={`Active ${membersTermPlural}`} value={activeMembers.length} icon={Users} iconBg="bg-slate-100" iconColor="text-primary"
          subtitle={members.length > 0 ? `+${Math.round((activeMembers.length / Math.max(members.length, 1)) * 100)}% this month` : undefined}
          subtitleColor="text-primary" />
        <MetricCard title={`Active ${groupsTermPlural}`} value={activeGroups.length} icon={Layers} iconBg="bg-slate-100" iconColor="text-primary" subtitle={`${groups.length} total`} />
        <MetricCard title="Upcoming Events" value={upcomingEvents.length} icon={Calendar} iconBg="bg-orange-100" iconColor="text-orange-500" subtitle={`${events.length} total events`} subtitleColor="text-[#71717a] dark:text-gray-400" />
        <MetricCard title="Total Donations" value={formatCurrency(totalDonationsAmount, currency)} icon={HandCoins} iconBg="bg-slate-100" iconColor="text-primary" subtitle="This year" />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donations Area Chart */}
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">{t("donation_growth_curve", "Donations Growth Curve (")}{currency})</h3>
            <span className="text-[10px] bg-slate-100 text-primary py-0.5 px-2 rounded-full font-semibold border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 uppercase tracking-[0.04em]">{t("received_donations", "Received Donations")}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Group Distribution Bar Chart */}
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">{groupTerm} {t("distribution_by_stage", "Distribution by Stage")}</h3>
            <span className="text-[10px] bg-slate-100 text-primary py-0.5 px-2 rounded-full font-semibold border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 uppercase tracking-[0.04em]">{t("active_groups", "Active Groups")}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Events */}
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("upcoming", "Upcoming")} {eventsTermPlural}</h3>
            </div>
            <span className="text-xs font-semibold text-primary bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center tracking-[0.04em]">
              {upcomingEvents.length}
            </span>
          </div>
          <div className="divide-y divide-border">
            {upcomingEvents.length === 0 ? (
              <div className="p-10 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#71717a] dark:text-gray-400" />
                </div>
                <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_upcoming", "No upcoming")} {eventsTermPlural.toLowerCase()}</p>
              </div>
            ) : upcomingEvents.map(e => {
              return (
                <div key={e.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-semibold text-primary leading-none uppercase tracking-[0.04em]">{format(new Date(e.date), "MMM")}</span>
                    <span className="text-sm font-semibold text-primary leading-none">{format(new Date(e.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 truncate tracking-[0.04em]">{e.court_name || e.case_title || e.location} · {e.time || "TBD"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{e.lawyer_name || e.organizer_name || "—"}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Status */}
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/40 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("plan_status", "Plan Status")}</h3>
            <span className="text-xs font-medium text-[#71717a] dark:text-gray-400 capitalize tracking-[0.04em]">{plan.name}</span>
          </div>
          <div className="p-4 space-y-4">
            <UsageRow label="Staff/Admins" used={staff.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label="Groups" used={activeGroups.length} max={plan.maxCases} />
            <UsageRow label="Members" used={members.length} max={plan.maxClients} />
          </div>
          <div className="px-4 pb-4 border-t border-primary/40 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{t("plan_details", "Plan Details")}</p>
              <p className="text-sm font-semibold">{formatCurrency(plan.price || 0, currency)}{t("mo", "/mo")}</p>
            </div>
            <div className="text-xs text-[#71717a] dark:text-gray-400 space-y-0.5 tracking-[0.04em]">
              <p>· {plan.maxUsers} {t("team_member", "Team Member")}{plan.maxUsers !== 1 ? "s" : ""}</p>
              <p>· {plan.maxCases} {t("groups", "Groups")}</p>
              <p>· {plan.maxClients} {t("members", "Members")}</p>
              <p>· {plan.maxStorageGB} {t("gb_storage", "GB Storage")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}