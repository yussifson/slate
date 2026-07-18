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
import {
  Briefcase, Users, DollarSign, Clock, Calendar, BarChart2,
  RefreshCw, Building2, Settings2, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertTriangle, TrendingUp, FileText
} from "lucide-react";
import HearingReminders from "@/components/dashboard/HearingReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, formatCurrency } from "@/lib/constants";
import { format, isAfter } from "date-fns";
import { buildMonthlyRevenueChart, buildDistributionChart } from "@/lib/dashboardCharts";
import { useToast } from "@/components/ui/use-toast";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar
} from "recharts";

function UsageRow({ label, used, max, suffix = "" }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isHigh = pct > 80;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">{used}{suffix} / {max}{suffix}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-orange-500" : "bg-green-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function GenericDashboard({ companyId, company, isAdmin, industry }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState('6M');

  const { data: cases = [] } = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: clients = [] } = useQuery({ queryKey: ["clients", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: hearings = [] } = useQuery({ queryKey: ["hearings", companyId], queryFn: () => base44.entities.Hearing.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", companyId], queryFn: () => base44.entities.Task.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices", companyId], queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: staff = [] } = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), enabled: !!companyId });

  const activeCases = cases.filter(c => ["open", "in_progress", "pending_hearing"].includes(c.status));
  const activeClients = clients.filter(c => c.status === "active");
  const pendingTasks = tasks.filter(item => ["pending", "in_progress"].includes(item.status));
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const currency = company?.currency || "GHS";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;

  const casesTermPlural = getTerm(industry, "cases");
  const clientsTermPlural = getTerm(industry, "clients");
  const hearingsTermPlural = getTerm(industry, "hearings");
  const caseTerm = getTerm(industry, "case");

  const chartData = buildMonthlyRevenueChart(invoices);
  const caseDistribution = buildDistributionChart(cases, "stage");

  const upcomingHearings = hearings
    .filter(h => h.status === "scheduled" && h.date && isAfter(new Date(h.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const overdueInvoices = invoices.filter(i => i.status === "overdue").length;

  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: t('dashboard_refreshed', "Dashboard refreshed"), description: t('all_data_up_to_date', "All data is up to date.") });
    }, 500);
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
          <Building2 className="w-12 h-12 text-green-600" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">{t("welcome_to_your_workslate", "Welcome to your workslate")}</h1>
          <p className="text-muted-foreground text-lg">{t("you_haven_t_set_up_your_firm_y", "You haven't set up your firm yet. Configure your details to unlock your dashboard and features.")}</p>
        </div>
        <Button onClick={() => window.location.href = '/onboarding'} size="lg" className="mt-4 px-8 h-12 bg-green-600 hover:bg-green-700">
          <Settings2 className="w-5 h-5 mr-2" />
          {t("setup_now", "Setup Now")}
        </Button>
      </div>
    );
  }

  const kpis = [
    {
      label: `Active ${casesTermPlural}`,
      value: activeCases.length,
      sub: `${cases.length} total`,
      icon: Briefcase,
      alt: false,
      trend: '+4%',
      trendUp: true,
    },
    {
      label: `Active ${clientsTermPlural}`,
      value: activeClients.length,
      sub: clients.length > 0 ? `+${Math.round((activeClients.length / Math.max(clients.length, 1)) * 100)}% active` : 'No clients yet',
      icon: Users,
      alt: true,
      trend: '+9%',
      trendUp: true,
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue, currency),
      sub: 'This year',
      icon: DollarSign,
      alt: false,
      trend: '+18%',
      trendUp: true,
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks.length,
      sub: overdueInvoices > 0 ? `${overdueInvoices} invoices overdue` : `${upcomingHearings.length} ${hearingsTermPlural.toLowerCase()} due`,
      icon: Clock,
      alt: true,
      trend: overdueInvoices > 0 ? `${overdueInvoices} overdue` : 'On track',
      trendUp: overdueInvoices === 0,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* 24h Hearing Reminders */}
      <HearingReminders hearings={hearings} userEmail={user?.email} isAdmin={isAdmin} />

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("dashboard", "Dashboard")}</h1>
                <p className="text-green-100 text-sm">Welcome back, {user?.email?.split('@')[0]} 👋</p>
              </div>
            </div>
            <p className="text-green-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2 text-xs">
              <BarChart2 className="w-3.5 h-3.5" /> {t("analytics", "Analytics")}
            </Button>
            <RunIntelligenceButton vertical={industry} />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2 text-xs">
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Intelligence Dashboard */}
      <IntelligenceDashboard vertical={industry} compact={true} maxItems={3} />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${kpi.trendUp ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50'}`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1 tabular-nums">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className={`text-xs ${(!kpi.trendUp && overdueInvoices > 0 && kpi.icon === Clock) ? 'text-orange-500' : 'text-muted-foreground'}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t("revenue_growth_curve", "Revenue Growth Curve (")} {currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Based on paid invoices</p>
            </div>
            <div className="flex gap-1">
              {['3M', '6M', '1Y'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === p ? 'bg-green-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="genericRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#genericRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution Bar Chart */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">{caseTerm} {t("distribution_by_stage", "Distribution by Stage")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Active pipeline overview</p>
            </div>
            <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-full">
              {t("active_pipelines", "Active Pipelines")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={caseDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Hearings */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <h3 className="text-base font-semibold text-foreground">{t("upcoming", "Upcoming")} {hearingsTermPlural}</h3>
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
              {upcomingHearings.length} scheduled
            </span>
          </div>
          {upcomingHearings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">{t("no_upcoming", "No upcoming")} {hearingsTermPlural.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingHearings.map(h => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col items-center justify-center text-white shrink-0">
                    <span className="text-[9px] font-bold uppercase leading-none">{format(new Date(h.date), "MMM")}</span>
                    <span className="text-sm font-bold leading-none">{format(new Date(h.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{h.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{h.court_name || h.case_title} · {h.time || "TBD"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-green-200 text-green-700">{h.lawyer_name || "—"}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Status */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">{t("plan_status", "Plan Status")}</h3>
            <span className="text-xs font-medium text-muted-foreground capitalize">{plan.name}</span>
          </div>
          <div className="space-y-4 mb-5">
            <UsageRow label="Team Members" used={staff.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label="Cases" used={activeCases.length} max={plan.maxCases} />
            <UsageRow label="Clients" used={clients.length} max={plan.maxClients} />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">{t("plan_details", "Plan Details")}</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(plan.price || 0, currency)}{t("mo", "/mo")}</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                `${plan.maxUsers} Team Member${plan.maxUsers !== 1 ? 's' : ''}`,
                `${plan.maxCases} ${t("cases", "Cases")}`,
                `${plan.maxClients} ${t("clients", "Clients")}`,
                `${plan.maxStorageGB} GB Storage`,
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
