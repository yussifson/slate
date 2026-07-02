import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import RunIntelligenceButton from '@/components/RunIntelligenceButton';
import {
  Shield, AlertCircle, Users, DollarSign, Calendar,
  BarChart2, RefreshCw, Settings2, ArrowUpRight, FileText, TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, formatCurrency } from "@/lib/constants";
import { format, isAfter } from "date-fns";
import { buildMonthlyRevenueChart, buildDistributionChart } from "@/lib/dashboardCharts";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
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

import { powerSync } from '@/api/PowerSyncConnector';

export default function InsuranceDashboard({ companyId, company, isAdmin, industry = 'insurance' }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chartPeriod, setChartPeriod] = useState('6M');

  const { data: stats } = useQuery({
    queryKey: ["insurance_stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const [claimsRes, policiesRes, agentsRes, premiumsRes] = await Promise.all([
        powerSync.execute(`SELECT * FROM insurance_claims WHERE company_id = ?`, [companyId]),
        powerSync.execute(`SELECT * FROM univ_insurancepolicy WHERE company_id = ?`, [companyId]),
        powerSync.execute(`SELECT * FROM insurance_agents WHERE company_id = ?`, [companyId]),
        powerSync.execute(`SELECT * FROM insurance_premiums WHERE company_id = ?`, [companyId])
      ]);
      return {
        claims: claimsRes.rows._array || Array.from(claimsRes.rows),
        policies: policiesRes.rows._array || Array.from(policiesRes.rows),
        agents: agentsRes.rows._array || Array.from(agentsRes.rows),
        premiums: premiumsRes.rows._array || Array.from(premiumsRes.rows)
      };
    },
    enabled: !!companyId
  });

  const claims = stats?.claims || [];
  const policies = stats?.policies || [];
  const agents = stats?.agents || [];
  const premiums = stats?.premiums || [];
  const events = []; // Events mock/placeholder if needed

  const activeClaims = claims.filter(c => ["Pending", "Under Review", "Open"].includes(c.status));
  const activePolicies = policies.filter(p => p.status === "Active");
  const totalRevenue = premiums.filter(p => p.status === "Paid").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const overduePremiums = premiums.filter(p => p.status === "Overdue" || p.status === "Unpaid").length;
  const currency = company?.currency || "USD";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;

  const chartData = buildMonthlyRevenueChart(premiums.map(p => ({ ...p, total_amount: p.amount })));
  const claimDistribution = buildDistributionChart(claims, "type");
  const pieData = claimDistribution.filter(d => d.count > 0).slice(0, 4);

  const upcomingEvents = events
    .filter(e => e.status === "scheduled" && e.date && isAfter(new Date(e.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => { setIsRefreshing(false); toast({ title: "Dashboard refreshed" }); }, 500);
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
          <Shield className="w-12 h-12 text-green-600" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-bold">{t("welcome_to_your_workslate", "Welcome")}</h1>
          <p className="text-muted-foreground">{t("you_haven_t_set_up_your_firm_y", "Set up your firm to get started.")}</p>
        </div>
        <Button onClick={() => window.location.href = '/onboarding'} size="lg">
          <Settings2 className="w-5 h-5 mr-2" /> {t("setup_now", "Setup Now")}
        </Button>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Policies', value: activePolicies.length, sub: `${policies.length} total`, icon: Shield, alt: false, trend: '+7%' },
    { label: 'Active Claims', value: activeClaims.length, sub: `${claims.length} total`, icon: AlertCircle, alt: true, trend: activeClaims.length > 10 ? 'High' : 'Normal' },
    { label: 'Premium Revenue', value: formatCurrency(totalRevenue, currency), sub: 'paid this year', icon: DollarSign, alt: false, trend: '+15%' },
    { label: 'Active Agents', value: agents.length, sub: `${overduePremiums} premiums overdue`, icon: Users, alt: true, trend: '+2%' },
  ];

  // Correct routes from App.jsx insurance suite
  const quickNav = [
    { label: 'Policies', href: '/policies', icon: Shield, alt: false },
    { label: 'Claims', href: '/claims', icon: AlertCircle, alt: true },
    { label: 'Clients', href: '/insurance-clients', icon: Users, alt: false },
    { label: 'Premiums', href: '/premiums', icon: DollarSign, alt: true },
    { label: 'Underwriting', href: '/underwriting', icon: FileText, alt: false },
    { label: 'Reports', href: '/reports', icon: BarChart2, alt: true },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-700 to-green-800 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Insurance Dashboard</h1>
                <p className="text-green-100 text-sm">Welcome back, {user?.email?.split('@')[0]} 👋</p>
              </div>
            </div>
            <p className="text-green-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <RunIntelligenceButton vertical={industry} />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2">
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Intelligence ── */}
      <IntelligenceDashboard vertical={industry} compact={true} maxItems={3} />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.alt ? 'text-orange-700 bg-orange-50' : 'text-green-700 bg-green-50'}`}>
                {kpi.trend}
              </span>
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
              <h3 className="text-base font-semibold text-foreground">Premium Growth ({currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly paid premiums</p>
            </div>
            <div className="flex gap-1">
              {['3M','6M','1Y'].map(p => (
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
                <linearGradient id="insurRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#insurRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground">Claim Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">By stage / type</p>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="count">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground truncate max-w-[100px]">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No claims yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Renewals + Plan Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Upcoming Renewals</h3>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">{upcomingEvents.length}</span>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming renewals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center text-white shrink-0">
                    <span className="text-[9px] font-bold uppercase leading-none">{format(new Date(e.date), "MMM")}</span>
                    <span className="text-sm font-bold leading-none">{format(new Date(e.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.court_name || e.case_title} · {e.time || "TBD"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{e.lawyer_name || "—"}</Badge>
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
            <UsageRow label="Agents" used={agents.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label="Claims" used={activeClaims.length} max={plan.maxCases} />
            <UsageRow label="Policies" used={policies.length} max={plan.maxClients} />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Plan Details</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(plan.price || 0, currency)}/mo</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>· {plan.maxUsers} Agents · {plan.maxCases} Claims</p>
              <p>· {plan.maxClients} Policies · {plan.maxStorageGB} GB</p>
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