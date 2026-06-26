import { OrbitLoader } from '@/components/ui/orbit-loader';
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import RunIntelligenceButton from '@/components/RunIntelligenceButton';
import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { getTerm } from "@/config/industries";
import {
  Briefcase, Users, DollarSign, Clock, Calendar, BarChart2,
  RefreshCw, Settings2, AlertCircle, ArrowUpRight, Scale,
  FileText, CheckCircle2, AlertTriangle
} from "lucide-react";
import HearingReminders from "@/components/dashboard/HearingReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, PRIORITY_COLORS, formatCurrency } from "@/lib/constants";
import { format, isAfter, differenceInDays } from "date-fns";
import { buildMonthlyRevenueChart, buildDistributionChart } from "@/lib/dashboardCharts";
import { useToast } from "@/components/ui/use-toast";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { Link } from 'react-router-dom';

const PIE_COLORS = ['#16a34a', '#f97316', '#22c55e', '#fb923c'];

function UsageRow({ label, used, max, suffix = "" }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{used}{suffix} / {max}{suffix}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct > 80 ? "bg-orange-500" : "bg-green-600"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function LawDashboard({ companyId, company, isAdmin }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
  const overdueInvoices = invoices.filter(i => i.status === "overdue").length;
  const currency = company?.currency || "GHS";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;
  const industry = company?.industry_type || user?.company_industry || "law";

  const chartData = buildMonthlyRevenueChart(invoices);
  const caseDistribution = buildDistributionChart(cases, "stage").filter(d => d.count > 0).slice(0, 4);

  const upcomingHearings = hearings
    .filter(h => h.status === "scheduled" && h.date && isAfter(new Date(h.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: t('dashboard_refreshed', "Dashboard refreshed") });
    }, 500);
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
          <Scale className="w-12 h-12 text-green-600" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">{t('welcome_to_workslate', "Welcome to your workslate")}</h1>
          <p className="text-muted-foreground text-lg">{t('setup_firm_prompt', "You haven't set up your law firm yet.")}</p>
        </div>
        <Button onClick={() => window.location.href = '/onboarding'} size="lg" className="mt-4 px-8 h-12">
          <Settings2 className="w-5 h-5 mr-2" />
          {t('setup_firm_now', "Setup Firm Now")}
        </Button>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Cases', value: activeCases.length, sub: `${cases.length} total`, icon: Briefcase, alt: false, trend: '+4%' },
    { label: 'Active Clients', value: activeClients.length, sub: `${clients.length} total`, icon: Users, alt: true, trend: '+9%' },
    { label: 'Upcoming Hearings', value: upcomingHearings.length, sub: 'scheduled ahead', icon: Calendar, alt: false, trend: '' },
    { label: 'Revenue Collected', value: formatCurrency(totalRevenue, currency), sub: 'paid invoices', icon: DollarSign, alt: true, trend: '+18%' },
    { label: 'Pending Tasks', value: pendingTasks.length, sub: `${overdueInvoices} overdue invoices`, icon: Clock, alt: false, trend: '' },
  ];

  // Quick nav routes for law firm
  const quickNav = [
    { label: 'Cases', href: '/cases', icon: Briefcase, alt: false },
    { label: 'Clients', href: '/clients', icon: Users, alt: true },
    { label: 'Hearings', href: '/hearings', icon: Calendar, alt: false },
    { label: 'Tasks', href: '/tasks', icon: Clock, alt: true },
    { label: 'Invoices', href: '/invoices', icon: FileText, alt: false },
    { label: 'Analytics', href: '/analytics', icon: BarChart2, alt: true },
  ];

  return (
    <div className="space-y-6 p-6">
      <HearingReminders hearings={hearings} userEmail={user?.email} isAdmin={isAdmin} />

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#f97316] p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('law_dashboard', "Law Firm Dashboard")}</h1>
                <p className="text-green-100 text-sm">Welcome back, {user?.email?.split('@')[0]} 👋</p>
              </div>
            </div>
            <p className="text-green-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <RunIntelligenceButton vertical="law" />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2">
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Intelligence ── */}
      <IntelligenceDashboard vertical="law" compact={true} maxItems={3} />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.alt ? 'text-orange-700 bg-orange-50' : 'text-green-700 bg-green-50'}`}>
                  <ArrowUpRight className="w-3 h-3 inline" />{kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Revenue Collected ({currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly billing performance</p>
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
                <linearGradient id="lawRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#lawRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground">Case Pipeline</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution by stage</p>
          </div>
          {caseDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={caseDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="count">
                    {caseDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {caseDistribution.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground truncate max-w-[100px]">{d.name || 'Unknown'}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No cases yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Hearings + Case Deadlines + Plan ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Hearings */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Upcoming Hearings</h3>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">{upcomingHearings.length} scheduled</span>
          </div>
          {upcomingHearings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming hearings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingHearings.map(h => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col items-center justify-center text-white shrink-0">
                    <span className="text-[9px] font-bold uppercase leading-none">{format(new Date(h.date), "MMM")}</span>
                    <span className="text-sm font-bold leading-none">{format(new Date(h.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.time || 'TBD'} · {differenceInDays(new Date(h.date), new Date())}d away</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Attorneys */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h3 className="text-base font-semibold text-foreground mb-5">Team & Attorneys</h3>
          {staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No staff records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.slice(0, 5).map((attorney, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${idx % 2 === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
                    {(attorney.name || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{attorney.name}</p>
                    <p className="text-xs text-muted-foreground">{attorney.role || attorney.position || 'Attorney'}</p>
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">Active</span>
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
            <UsageRow label="Attorneys" used={staff.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label="Cases" used={cases.length} max={plan.maxCases} />
            <UsageRow label="Clients" used={clients.length} max={plan.maxClients} />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Monthly Plan</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(plan.price || 0, currency)}/mo</p>
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm ${item.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
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
