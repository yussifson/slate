import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, CalendarDays, MessageSquareWarning, DollarSign,
  ArrowUpCircle, ArrowUpRight, ArrowDownRight, RefreshCw,
  TrendingUp, Briefcase, Clock, CheckCircle2, AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import { isSuperAdmin } from "@/lib/constants";
import { buildMonthlyRevenueChart } from "@/lib/dashboardCharts";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

// Sub-panel imports
import HRStaffPanel from "@/components/hr/HRStaffPanel";
import HRLeavePanel from "@/components/hr/HRLeavePanel";
import HRSalaryPanel from "@/components/hr/HRSalaryPanel";
import HRComplaintsPanel from "@/components/hr/HRComplaintsPanel";
import HRPromotionsPanel from "@/components/hr/HRPromotionsPanel";
import HRPayrollPanel from "@/components/hr/HRPayrollPanel";

function MetricCard({ icon: Icon, label, value, alt = false, trend, trendUp }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${trendUp ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

const DEPT_DATA = [
  { dept: 'Engineering', count: 0 },
  { dept: 'Sales', count: 0 },
  { dept: 'HR', count: 0 },
  { dept: 'Finance', count: 0 },
];

export default function HRDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = user?.company_id;
  const isAdmin = user?.role === "company_admin" || user?.role === "hr" || isSuperAdmin(user);
  const [chartPeriod, setChartPeriod] = useState('6M');

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ["leaves", companyId],
    queryFn: () => base44.entities.LeaveRequest.filter({ company_id: companyId }, "-created_date", 200),
    enabled: !!companyId
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints", companyId],
    queryFn: () => base44.entities.HRComplaint.filter({ company_id: companyId }, "-created_date", 100),
    enabled: !!companyId
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions", companyId],
    queryFn: () => base44.entities.Promotion.filter({ company_id: companyId }, "-created_date", 100),
    enabled: !!companyId
  });

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const list = await base44.entities.Company.list();
      return list.find(c => c.id === companyId) || null;
    },
    enabled: !!companyId
  });

  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => { setIsRefreshing(false); toast({ title: "Dashboard refreshed" }); }, 500);
  };

  const currency = company?.currency || "GHS";
  const activeStaff = staff.filter(s => s.status === "active").length;
  const pendingLeaves = leaves.filter(l => l.status === "pending").length;
  const openComplaints = complaints.filter(c => c.status === "open" || c.status === "under_review").length;
  const pendingPromotions = promotions.filter(p => p.status === "pending").length;
  const totalSalary = staff.reduce((s, m) => s + (m.salary || 0), 0);
  const onLeaveToday = leaves.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.status === "approved" && l.start_date <= today && l.end_date >= today;
  }).length;

  // Build a simple salary chart from staff data grouped by month (mock monthly payroll)
  const salaryChartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      name: d.toLocaleDateString('en-US', { month: 'short' }),
      Payroll: totalSalary + Math.floor(Math.random() * 500)
    };
  });

  const kpis = [
    { label: "Active Staff", value: activeStaff, icon: Users, alt: false, trend: "+3%", trendUp: true },
    { label: `Monthly Payroll`, value: formatCurrency(totalSalary, currency), icon: DollarSign, alt: true, trend: "", trendUp: true },
    { label: "Pending Leave", value: pendingLeaves, icon: CalendarDays, alt: false, trend: pendingLeaves > 0 ? `${pendingLeaves} waiting` : "None", trendUp: pendingLeaves === 0 },
    { label: "Open Complaints", value: openComplaints, icon: MessageSquareWarning, alt: true, trend: openComplaints > 0 ? "Needs action" : "Clear", trendUp: openComplaints === 0 },
    { label: "Pending Promotions", value: pendingPromotions, icon: ArrowUpCircle, alt: false, trend: "+1", trendUp: true },
  ];

  return (
    <div className="space-y-6 p-6">

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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">HR Management</h1>
                <p className="text-green-100 text-sm">Team, payroll, leave, complaints &amp; promotions</p>
              </div>
            </div>
            <p className="text-green-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white/60 text-xs">On Leave Today</p>
              <p className="text-2xl font-bold">{onLeaveToday}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-right">
              <p className="text-white/60 text-xs">Total Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2">
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <MetricCard key={i} {...kpi} />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Monthly Payroll ({currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Payroll expenditure trend</p>
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
            <AreaChart data={salaryChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hrPayrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Payroll" stroke="#16a34a" strokeWidth={2.5} fill="url(#hrPayrollGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground">Workforce Overview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Key HR metrics at a glance</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Active Staff', value: activeStaff, icon: CheckCircle2, color: 'green' },
              { label: 'On Leave Today', value: onLeaveToday, icon: CalendarDays, color: 'orange' },
              { label: 'Pending Leave Requests', value: pendingLeaves, icon: Clock, color: onLeaveToday > 0 ? 'orange' : 'green' },
              { label: 'Open Complaints', value: openComplaints, icon: AlertTriangle, color: openComplaints > 0 ? 'orange' : 'green' },
              { label: 'Total Headcount', value: staff.length, icon: Users, color: 'green' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color === 'green' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <span className="text-sm text-foreground font-medium">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs (all original panels kept intact) ── */}
      <div className="bg-card rounded-2xl border border-border/50 p-1">
        <Tabs defaultValue="team">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl w-full justify-start">
            <TabsTrigger value="team" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t("team", "Team")}
            </TabsTrigger>
            <TabsTrigger value="salary" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t("salary", "Salary")}
            </TabsTrigger>
            <TabsTrigger value="leave" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t("leave", "Leave")}
              {pendingLeaves > 0 && (
                <Badge className="ml-1.5 bg-orange-100 text-orange-700 text-[9px] h-4 px-1.5 rounded-full">
                  {pendingLeaves}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="complaints" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t("complaints", "Complaints")}
              {openComplaints > 0 && (
                <Badge className="ml-1.5 bg-orange-100 text-orange-700 text-[9px] h-4 px-1.5 rounded-full">
                  {openComplaints}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="promotions" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t("promotions", "Promotions")}
              {pendingPromotions > 0 && (
                <Badge className="ml-1.5 bg-green-100 text-green-700 text-[9px] h-4 px-1.5 rounded-full">
                  {pendingPromotions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payroll" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t("payroll", "Payroll")}
            </TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="team" className="mt-0">
              <HRStaffPanel companyId={companyId} staff={staff} currency={currency} isAdmin={isAdmin} />
            </TabsContent>
            <TabsContent value="salary" className="mt-0">
              <HRSalaryPanel companyId={companyId} staff={staff} currency={currency} isAdmin={isAdmin} />
            </TabsContent>
            <TabsContent value="leave" className="mt-0">
              <HRLeavePanel companyId={companyId} leaves={leaves} staff={staff} isAdmin={isAdmin} user={user} />
            </TabsContent>
            <TabsContent value="complaints" className="mt-0">
              <HRComplaintsPanel companyId={companyId} complaints={complaints} staff={staff} isAdmin={isAdmin} user={user} />
            </TabsContent>
            <TabsContent value="promotions" className="mt-0">
              <HRPromotionsPanel companyId={companyId} promotions={promotions} staff={staff} currency={currency} isAdmin={isAdmin} user={user} />
            </TabsContent>
            <TabsContent value="payroll" className="mt-0">
              <HRPayrollPanel companyId={companyId} staff={staff} currency={currency} isAdmin={isAdmin} leaves={leaves} user={user} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

    </div>
  );
}