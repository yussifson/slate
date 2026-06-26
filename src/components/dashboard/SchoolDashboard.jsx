import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from '@/components/intelligence/IntelligenceUI';
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { getTerm } from "@/config/industries";
import {
  Briefcase, Users, DollarSign, Clock, Calendar,
  BarChart2, RefreshCw, Building2, Settings2,
  GraduationCap, BookOpen, Trophy, ChevronRight,
  ArrowUpRight, ClipboardList, Star
} from "lucide-react";
import HearingReminders from "@/components/dashboard/HearingReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, PRIORITY_COLORS, formatCurrency } from "@/lib/constants";
import { format, isAfter } from "date-fns";
import { buildMonthlyRevenueChart, buildDistributionChart } from "@/lib/dashboardCharts";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

function UsageRow({ label, used, max, suffix = "" }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isHigh = pct > 80;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{used}{suffix} / {max}{suffix}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${isHigh ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SchoolDashboard({ companyId, company, isAdmin }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState('30D');

  const { data: cases = [] } = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: clients = [] } = useQuery({ queryKey: ["clients", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: hearings = [] } = useQuery({ queryKey: ["hearings", companyId], queryFn: () => base44.entities.Hearing.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", companyId], queryFn: () => base44.entities.Task.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices", companyId], queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: staff = [] } = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), enabled: !!companyId });

  const activeCases = cases.filter(c => ["open", "in_progress"].includes(c.status));
  const activeClients = clients.filter(c => c.status === "active");
  const pendingTasks = tasks.filter(item => ["pending", "in_progress"].includes(item.status));
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const currency = company?.currency || "GHS";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;
  const industry = "school";

  const casesTermPlural = getTerm(industry, "cases");
  const clientsTermPlural = getTerm(industry, "clients");
  const hearingsTermPlural = getTerm(industry, "hearings");
  const caseTerm = getTerm(industry, "case");

  const chartData = buildMonthlyRevenueChart(invoices);
  const students = clients.filter(c => c.type === "student" || !c.type);
  const caseDistribution = buildDistributionChart(cases, "case_type");

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
      toast({ title: "Dashboard refreshed", description: "All data is up to date." });
    }, 500);
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
          <GraduationCap className="w-12 h-12 text-blue-600" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-bold">{t("welcome_to_your_workslate", "Welcome to your workslate")}</h1>
          <p className="text-muted-foreground">{t("you_haven_t_set_up_your_firm_y", "You haven't set up your firm yet.")}</p>
        </div>
        <Button onClick={() => window.location.href = '/onboarding'} size="lg">
          <Settings2 className="w-5 h-5 mr-2" /> {t("setup_now", "Setup Now")}
        </Button>
      </div>
    );
  }

  const kpis = [
    { label: `Active ${casesTermPlural}`, value: activeCases.length, sub: `${cases.length} total`, icon: ClipboardList, from: 'from-blue-500', to: 'to-sky-600', trend: '+4%', up: true },
    { label: 'Students', value: students.filter(s => s.status === "active" || s.status === "Active").length, sub: `${clients.length} enrolled`, icon: Users, from: 'from-sky-500', to: 'to-cyan-600', trend: '+11%', up: true },
    { label: 'Fees Collected', value: formatCurrency(totalRevenue, currency), sub: 'paid invoices', icon: DollarSign, from: 'from-emerald-500', to: 'to-green-600', trend: '+8%', up: true },
    { label: 'Pending Tasks', value: pendingTasks.length, sub: `${overdueInvoices} fees overdue`, icon: Clock, from: 'from-amber-500', to: 'to-orange-500', trend: overdueInvoices > 0 ? 'Action needed' : 'On track', up: overdueInvoices === 0 },
  ];

  const quickNav = [
    { label: casesTermPlural, href: '/cases', icon: ClipboardList, from: 'from-blue-500', to: 'to-sky-600' },
    { label: clientsTermPlural, href: '/clients', icon: Users, from: 'from-sky-500', to: 'to-cyan-600' },
    { label: hearingsTermPlural, href: '/hearings', icon: Calendar, from: 'from-violet-500', to: 'to-purple-600' },
    { label: 'Tasks', href: '/tasks', icon: Trophy, from: 'from-amber-500', to: 'to-orange-500' },
    { label: 'Invoices', href: '/invoices', icon: DollarSign, from: 'from-emerald-500', to: 'to-green-600' },
    { label: 'Reports', href: '/reports', icon: BarChart2, from: 'from-slate-500', to: 'to-gray-600' },
  ];

  return (
    <div className="space-y-6 p-6">
      <HearingReminders hearings={hearings} userEmail={user?.email} isAdmin={isAdmin} />

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">School Dashboard</h1>
                <p className="text-blue-100 text-sm">Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]} 👋</p>
              </div>
            </div>
            <p className="text-blue-200 text-xs mt-1">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2">
              <BarChart2 className="w-4 h-4" /> {t("analytics", "Analytics")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2">
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.from} ${kpi.to} flex items-center justify-center shadow-md`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.up ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3 inline mr-0.5" /> : null}{kpi.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Fee Revenue ({currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly fee collection trend</p>
            </div>
            <div className="flex gap-1">
              {['30D','90D','1Y'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === p ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="schoolRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#schoolRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">{caseTerm} Distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">By type / category</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">Active</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={caseDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Upcoming + Plan Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Upcoming {hearingsTermPlural}</h3>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">{upcomingHearings.length} scheduled</span>
          </div>
          {upcomingHearings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming {hearingsTermPlural.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingHearings.map(h => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex flex-col items-center justify-center text-white shrink-0">
                    <span className="text-[9px] font-bold uppercase leading-none">{format(new Date(h.date), "MMM")}</span>
                    <span className="text-sm font-bold leading-none">{format(new Date(h.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{h.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{h.court_name || h.case_title} · {h.time || "TBD"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{h.lawyer_name || "—"}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">{t("plan_status", "Plan Status")}</h3>
            <span className="text-xs font-medium text-muted-foreground capitalize">{plan.name}</span>
          </div>
          <div className="space-y-4 mb-5">
            <UsageRow label="Team Members" used={staff.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label={casesTermPlural} used={activeCases.length} max={plan.maxCases} />
            <UsageRow label={clientsTermPlural} used={clients.length} max={plan.maxClients} />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Plan Details</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(plan.price || 0, currency)}/mo</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>· {plan.maxUsers} Staff · {plan.maxCases} {casesTermPlural}</p>
              <p>· {plan.maxClients} {clientsTermPlural} · {plan.maxStorageGB} GB</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickNav.map((item, i) => (
            <Link key={i} to={item.href}>
              <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-foreground">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
