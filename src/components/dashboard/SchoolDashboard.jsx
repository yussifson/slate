import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import RunIntelligenceButton from '@/components/RunIntelligenceButton';
import HearingReminders from "@/components/dashboard/HearingReminders";
import { getTerm } from "@/config/industries";
import {
  GraduationCap, Users, DollarSign, Calendar, BarChart2,
  RefreshCw, Settings2, BookOpen, ArrowUpRight,
  ClipboardList, Trophy, Star, Bell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, formatCurrency } from "@/lib/constants";
import { format, isAfter } from "date-fns";
import { buildMonthlyRevenueChart, buildDistributionChart } from "@/lib/dashboardCharts";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
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

export default function SchoolDashboard({ companyId, company, isAdmin, industry = 'school' }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chartPeriod, setChartPeriod] = useState('6M');

  // Terminology adapts to industry (school/university/online etc.)
  const studentTerm = getTerm('client', industry) || 'Students';
  const caseTerm = getTerm('case', industry) || 'Classes';

  const { data: students = [] } = useQuery({ queryKey: ["clients", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: classes = [] } = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: events = [] } = useQuery({ queryKey: ["hearings", companyId], queryFn: () => base44.entities.Hearing.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: staff = [] } = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices", companyId], queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }), enabled: !!companyId });

  const activeStudents = students.filter(s => s.status === "active");
  const activeClasses = classes.filter(c => c.status === "in_progress" || c.status === "open");
  const totalFees = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const overdueFees = invoices.filter(i => i.status === "overdue").length;

  const currency = company?.currency || "USD";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;
  const chartData = buildMonthlyRevenueChart(invoices);
  const classDistribution = buildDistributionChart(classes, "stage");
  const pieData = classDistribution.filter(d => d.count > 0).slice(0, 4);

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

  // Industry-specific hero label
  const heroLabel = industry === 'university' ? 'University Portal'
    : industry === 'online' ? 'Online Learning Hub'
    : industry === 'vocational' ? 'Vocational Training Centre'
    : industry === 'highschool' ? 'High School Dashboard'
    : 'School Management System';

  // Routes adapt to industry — default to shared school routes
  const isUniversity = industry === 'university';
  const isOnline = industry === 'online';
  const isHighSchool = industry === 'highschool';
  const isVocational = industry === 'vocational';

  const getNavRoutes = () => {
    if (isUniversity) return [
      { label: 'Students', href: '/u/students', icon: Users, alt: false },
      { label: 'Faculties', href: '/u/faculties', icon: GraduationCap, alt: true },
      { label: 'Courses', href: '/u/courses', icon: BookOpen, alt: false },
      { label: 'Admissions', href: '/u/admissions', icon: ClipboardList, alt: true },
      { label: 'Finance', href: '/u/finance', icon: DollarSign, alt: false },
      { label: 'Exams', href: '/u/exams', icon: Trophy, alt: true },
    ];
    if (isOnline) return [
      { label: 'Learners', href: '/o/learners', icon: Users, alt: false },
      { label: 'Courses', href: '/o/courses', icon: BookOpen, alt: true },
      { label: 'Builder', href: '/o/builder', icon: Star, alt: false },
      { label: 'Sales', href: '/o/sales', icon: DollarSign, alt: true },
      { label: 'Live', href: '/o/live', icon: Bell, alt: false },
      { label: 'Analytics', href: '/analytics', icon: BarChart2, alt: true },
    ];
    if (isHighSchool) return [
      { label: 'Students', href: '/s/students', icon: Users, alt: false },
      { label: 'Classes', href: '/classes', icon: BookOpen, alt: true },
      { label: 'Attendance', href: '/attendance', icon: ClipboardList, alt: false },
      { label: 'Grades', href: '/grades', icon: Trophy, alt: true },
      { label: 'Fees', href: '/fees', icon: DollarSign, alt: false },
      { label: 'Exams', href: '/exams', icon: Star, alt: true },
    ];
    if (isVocational) return [
      { label: 'Trainees', href: '/v/trainee-profiles', icon: Users, alt: false },
      { label: 'Courses', href: '/v/courses', icon: BookOpen, alt: true },
      { label: 'Workshops', href: '/v/workshops', icon: Star, alt: false },
      { label: 'Assessments', href: '/v/workshop-assessments', icon: ClipboardList, alt: true },
      { label: 'Internships', href: '/v/internship-tracking', icon: Trophy, alt: false },
      { label: 'Certificates', href: '/v/certificates', icon: GraduationCap, alt: true },
    ];
    // default school
    return [
      { label: 'Students', href: '/students', icon: Users, alt: false },
      { label: 'Classes', href: '/classes', icon: BookOpen, alt: true },
      { label: 'Attendance', href: '/attendance', icon: ClipboardList, alt: false },
      { label: 'Grades', href: '/grades', icon: Trophy, alt: true },
      { label: 'Fees', href: '/fees', icon: DollarSign, alt: false },
      { label: 'Timetable', href: '/timetable', icon: Calendar, alt: true },
    ];
  };

  const quickNav = getNavRoutes();

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
          <GraduationCap className="w-12 h-12 text-green-600" />
        </div>
        <Button onClick={() => window.location.href = '/onboarding'} size="lg">
          <Settings2 className="w-5 h-5 mr-2" /> {t("setup_now", "Setup Now")}
        </Button>
      </div>
    );
  }

  const kpis = [
    { label: studentTerm, value: activeStudents.length, sub: `${students.length} total enrolled`, icon: Users, alt: false, trend: '+11%' },
    { label: `Active ${caseTerm}`, value: activeClasses.length, sub: `${classes.length} total`, icon: BookOpen, alt: true, trend: '' },
    { label: 'Fee Revenue', value: formatCurrency(totalFees, currency), sub: 'collected this term', icon: DollarSign, alt: false, trend: '+8%' },
    { label: 'Staff', value: staff.length, sub: `${overdueFees} outstanding invoices`, icon: GraduationCap, alt: true, trend: '+4%' },
  ];

  return (
    <div className="space-y-6 p-6">
      <HearingReminders hearings={events} userEmail={user?.email} isAdmin={isAdmin} />

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-green-600 to-emerald-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{heroLabel}</h1>
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
              <h3 className="text-base font-semibold text-foreground">Fee Collection ({currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue trend</p>
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
                <linearGradient id="schoolFeeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#schoolFeeGrad)" name="Fees Collected" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">{caseTerm} Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">By status / stage</p>
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
              <BookOpen className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No {caseTerm.toLowerCase()} yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Events + Plan ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Upcoming Events</h3>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">{upcomingEvents.length} scheduled</span>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming events</p>
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
                    <p className="text-xs text-muted-foreground">{e.time || "TBD"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{e.type || "Event"}</Badge>
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
            <UsageRow label="Staff" used={staff.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label={caseTerm} used={classes.length} max={plan.maxCases} />
            <UsageRow label={studentTerm} used={students.length} max={plan.maxClients} />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Plan Details</p>
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
