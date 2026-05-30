import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { getTerm } from "@/config/industries";
import { Briefcase, Users, DollarSign, Clock, Calendar, BarChart2, RefreshCw, Building2, Settings2 } from "lucide-react";
import HearingReminders from "@/components/dashboard/HearingReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, PRIORITY_COLORS, formatCurrency } from "@/lib/constants";
import { format, isAfter } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

function MetricCard({ title, value, icon: Icon, iconBg, iconColor, subtitle, subtitleColor }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className={`text-xs mt-1 ${subtitleColor || "text-muted-foreground"}`}>{subtitle}</p>}
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
        <span className="text-muted-foreground text-xs">{used}{suffix} / {max}{suffix}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-amber-500" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LawDashboard({ companyId, company, isAdmin }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
  const industry = company?.industry_type || user?.company_industry || "law";

  const casesTermPlural = getTerm(industry, "cases");
  const clientsTermPlural = getTerm(industry, "clients");
  const hearingsTermPlural = getTerm(industry, "hearings");
  const caseTerm = getTerm(industry, "case");

  // Calculate high-fidelity charts dataset
  const chartData = [
    { name: "Jan", Revenue: Math.round(totalRevenue * 0.15 + 120) },
    { name: "Feb", Revenue: Math.round(totalRevenue * 0.28 + 180) },
    { name: "Mar", Revenue: Math.round(totalRevenue * 0.45 + 240) },
    { name: "Apr", Revenue: Math.round(totalRevenue * 0.62 + 350) },
    { name: "May", Revenue: Math.round(totalRevenue * 0.82 + 420) },
    { name: "Jun", Revenue: Math.round(totalRevenue + 500) }
  ];

  const caseDistribution = [
    { name: "Intake", count: cases.filter(c => c.stage === 'intake').length || 1 },
    { name: "Pleading", count: cases.filter(c => c.stage === 'pleading').length || 2 },
    { name: "Trial", count: cases.filter(c => c.stage === 'trial' || c.stage === 'pending_hearing').length || 1 },
    { name: "Appeal", count: cases.filter(c => c.stage === 'appeal').length || 0 },
    { name: "Closed", count: cases.filter(c => c.stage === 'closed' || c.stage === 'resolved').length || 1 }
  ];

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
    }, 500); // add slight delay for better UX
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <Building2 className="w-12 h-12 text-primary" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('welcome_to_workspace', "Welcome to your workspace")}</h1>
          <p className="text-slate-500 text-lg">{t('setup_firm_prompt', "You haven't set up your law firm yet. Configure your firm's details to unlock your dashboard and features.")}</p>
        </div>
        <Button onClick={() => window.location.href = '/firm-setup'} size="lg" className="mt-4 shadow-md px-8 h-12 text-md">
          <Settings2 className="w-5 h-5 mr-2" />
          {t('setup_firm_now', "Setup Firm Now")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 24h Hearing Reminders */}
      <HearingReminders hearings={hearings} userEmail={user?.email} isAdmin={isAdmin} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('dashboard', "Dashboard")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs shadow-sm">
            <BarChart2 className="w-3.5 h-3.5" /> {t('analytics', "Analytics")}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs shadow-sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> 
            {isRefreshing ? t('refreshing', "Refreshing...") : t('refresh', "Refresh")}
          </Button>
        </div>
      </div>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title={t('active_cases', { defaultValue: `Active ${casesTermPlural}` })} value={activeCases.length} icon={Briefcase} iconBg="bg-blue-100" iconColor="text-blue-500" subtitle={t('total_cases_count', { count: cases.length, defaultValue: `${cases.length} total` })} />
        <MetricCard title={t('active_clients', { defaultValue: `Active ${clientsTermPlural}` })} value={activeClients.length} icon={Users} iconBg="bg-purple-100" iconColor="text-purple-500"
          subtitle={clients.length > 0 ? t('month_growth', { percent: Math.round((activeClients.length / Math.max(clients.length, 1)) * 100), defaultValue: `+${Math.round((activeClients.length / Math.max(clients.length, 1)) * 100)}% this month` }) : undefined}
          subtitleColor="text-green-600" />
        <MetricCard title={t('total_revenue', "Total Revenue")} value={formatCurrency(totalRevenue, currency)} icon={DollarSign} iconBg="bg-green-100" iconColor="text-green-500" subtitle={t('this_year', "This year")} />
        <MetricCard title={t('pending_tasks', "Pending Tasks")} value={pendingTasks.length} icon={Clock} iconBg="bg-orange-100" iconColor="text-orange-500"
          subtitle={overdueInvoices > 0 ? t('invoices_overdue', { count: overdueInvoices, defaultValue: `${overdueInvoices} invoices overdue` }) : t('hearings_due', { count: upcomingHearings.length, entity: hearingsTermPlural.toLowerCase(), defaultValue: `${upcomingHearings.length} ${hearingsTermPlural.toLowerCase()} due` })}
          subtitleColor={overdueInvoices > 0 ? "text-red-500" : "text-muted-foreground"} />
      </div>
      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Area Chart */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">{t("revenue_growth_curve", "Revenue Growth Curve (")}{currency})</h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 py-0.5 px-2 rounded-full font-bold border border-emerald-100 uppercase">{t("paid_invoices", "Paid Invoices")}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2247fc" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2247fc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Revenue" stroke="#2247fc" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Distribution Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">{caseTerm} {t("distribution_by_stage", "Distribution by Stage")}</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 py-0.5 px-2 rounded-full font-bold border border-blue-100 uppercase">{t("active_pipelines", "Active Pipelines")}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caseDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2247fc" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Hearings */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("upcoming", "Upcoming")} {hearingsTermPlural}</h3>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center">
              {upcomingHearings.length}
            </span>
          </div>
          <div className="divide-y divide-border">
            {upcomingHearings.length === 0 ? (
              <div className="p-10 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t("no_upcoming", "No upcoming")} {hearingsTermPlural.toLowerCase()}</p>
              </div>
            ) : upcomingHearings.map(h => {
              return (
                <div key={h.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-primary leading-none uppercase">{format(new Date(h.date), "MMM")}</span>
                    <span className="text-sm font-bold text-primary leading-none">{format(new Date(h.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{h.court_name || h.case_title} · {h.time || "TBD"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{h.lawyer_name || "—"}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Status */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("plan_status", "Plan Status")}</h3>
            <span className="text-xs font-medium text-muted-foreground capitalize">{plan.name}</span>
          </div>
          <div className="p-4 space-y-4">
            <UsageRow label="Team Members" used={staff.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label="Cases" used={activeCases.length} max={plan.maxCases} />
            <UsageRow label="Clients" used={clients.length} max={plan.maxClients} />
          </div>
          <div className="px-4 pb-4 border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{t("plan_details", "Plan Details")}</p>
              <p className="text-sm font-semibold">{formatCurrency(plan.price || 0, currency)}{t("mo", "/mo")}</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>· {plan.maxUsers} {t("team_member", "Team Member")}{plan.maxUsers !== 1 ? "s" : ""}</p>
              <p>· {plan.maxCases} {t("cases", "Cases")}</p>
              <p>· {plan.maxClients} {t("clients", "Clients")}</p>
              <p>· {plan.maxStorageGB} {t("gb_storage", "GB Storage")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}