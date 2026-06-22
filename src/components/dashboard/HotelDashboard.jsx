import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useTranslation } from "react-i18next";
import React from 'react';
import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from '@/components/intelligence/IntelligenceUI';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { getTerm } from "@/config/industries";
import { Bed, Users, DollarSign, Calendar, BarChart2, RefreshCw, Building2, Settings2 } from "lucide-react";
import HearingReminders from "@/components/dashboard/HearingReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, PRIORITY_COLORS, formatCurrency } from "@/lib/constants";
import { format, isAfter } from "date-fns";
import { buildMonthlyRevenueChart, buildDistributionChart } from "@/lib/dashboardCharts";
import { useQueryClient } from "@tanstack/react-query";
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

export default function HotelDashboard({ companyId, company, isAdmin }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: dbReservations = [] } = useIndustryRecords('reservation');
  const { data: dbRooms = [] } = useIndustryRecords('room');
  const { data: dbHousekeeping = [] } = useIndustryRecords('housekeeping_task');
  const { data: staff = [] } = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), enabled: !!companyId });

  const activeBookings = dbReservations.filter(r => ["Confirmed", "Checked-in"].includes(r.status));
  const activeGuests = dbReservations.filter(r => r.status === "Checked-in");
  const pendingTasks = dbHousekeeping.filter(t => t.status !== "Clean" && t.status !== "Completed");
  const totalRevenue = dbReservations.reduce((sum, r) => sum + (Number(r.data?.total) || 0), 0);
  
  const currency = company?.currency || "GHS";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;

  // Mock charts since we don't have invoices for hotel in this demo usually
  const chartData = [
    { name: 'Jan', Revenue: 12000 },
    { name: 'Feb', Revenue: 15000 },
    { name: 'Mar', Revenue: 18000 },
    { name: 'Apr', Revenue: 22000 },
    { name: 'May', Revenue: 24000 },
  ];
  
  const bookingDistribution = [
    { name: 'Confirmed', count: dbReservations.filter(r => r.status === 'Confirmed').length },
    { name: 'Checked-in', count: dbReservations.filter(r => r.status === 'Checked-in').length },
    { name: 'Checked-out', count: dbReservations.filter(r => r.status === 'Checked-out').length },
  ];

  const upcomingReservations = dbReservations
    .filter(r => r.status === "Confirmed" && r.data?.checkIn && isAfter(new Date(r.data.checkIn), new Date()))
    .sort((a, b) => new Date(a.data.checkIn) - new Date(b.data.checkIn))
    .slice(0, 5);

  const overdueInvoices = 0;

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
      {/* Removed HearingReminders entirely */}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{t("dashboard", "Dashboard")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2.5 text-xs  tracking-[0.04em]">
            <BarChart2 className="w-3.5 h-3.5" /> {t("analytics", "Analytics")}
          </Button>
          <Button variant="outline" size="sm" className="gap-2.5 text-xs  tracking-[0.04em]" onClick={handleRefresh} disabled={isRefreshing}>
            { isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" /> } 
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Intelligence Dashboard */}
      <div className="mb-6">
        <IntelligenceDashboard vertical="hospitality" compact={true} maxItems={3} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Bookings" value={activeBookings.length} icon={Bed} iconBg="bg-slate-100" iconColor="text-primary" subtitle={`${dbReservations.length} total`} />
        <MetricCard title="Active Guests" value={activeGuests.length} icon={Users} iconBg="bg-slate-100" iconColor="text-primary"
          subtitleColor="text-primary" />
        <MetricCard title="Total Revenue" value={formatCurrency(totalRevenue, currency)} icon={DollarSign} iconBg="bg-slate-100" iconColor="text-primary" subtitle="This year" />
        <MetricCard title="Pending Tasks" value={pendingTasks.length} icon={Calendar} iconBg="bg-orange-100" iconColor="text-orange-500"
          subtitle={overdueInvoices > 0 ? `${overdueInvoices} invoices overdue` : `${upcomingReservations.length} reservations due`}
          subtitleColor={overdueInvoices > 0 ? "text-red-500" : "text-[#71717a] dark:text-gray-400"} />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Area Chart */}
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 space-y-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">{t("revenue_growth_curve", "Revenue Growth Curve")} ({currency})</h3>
            <span className="text-[10px] bg-slate-100 text-primary py-0.5 px-2 rounded-full font-semibold border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 uppercase tracking-[0.04em]">{t("paid_invoices", "Paid Invoices")}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0}}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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

        {/* Booking Distribution Bar Chart */}
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 space-y-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">Booking Distribution by Stage</h3>
            <span className="text-[10px] bg-slate-100 text-primary py-0.5 px-2 rounded-full font-semibold border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 uppercase tracking-[0.04em]">Active Pipelines</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0}}>
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
        {/* Upcoming Reservations */}
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Upcoming Reservations</h3>
            </div>
            <span className="text-xs font-semibold text-primary bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center tracking-[0.04em]">
              {upcomingReservations.length}
            </span>
          </div>
          <div className="divide-y divide-border">
            {upcomingReservations.length === 0 ? (
              <div className="p-10 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#71717a] dark:text-gray-400" />
                </div>
                <p className="text-sm text-[#71717a] dark:text-gray-400">No upcoming reservations</p>
              </div>
              ) : upcomingReservations.map(r => {
                return (
                  <div key={r.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-semibold text-primary leading-none uppercase tracking-[0.04em]">{format(new Date(r.data.checkIn), "MMM")}</span>
                      <span className="text-sm font-semibold text-primary leading-none">{format(new Date(r.data.checkIn), "d")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.data.guestName || "Unknown Guest"}</p>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 truncate tracking-[0.04em]">Room {r.data.roomNumber || "TBD"} · {r.data.checkIn}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{r.status}</Badge>
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
            <UsageRow label="Team Members" used={staff.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label="Bookings" used={activeBookings.length} max={plan.maxCases} />
            <UsageRow label="Guests" used={activeGuests.length} max={plan.maxClients} />
          </div>
          <div className="px-4 pb-4 border-t border-primary/40 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{t("plan_details", "Plan Details")}</p>
              <p className="text-sm font-semibold">{formatCurrency(plan.price || 0, currency)}{t("mo", "/mo")}</p>
            </div>
            <div className="text-xs text-[#71717a] dark:text-gray-400 space-y-0.5 tracking-[0.04em]">
              <p>· {plan.maxUsers} {t("team_member", "Team Member")}{plan.maxUsers !== 1 ? "s" : ""}</p>
              <p>· {plan.maxCases} Bookings</p>
              <p>· {plan.maxClients} Guests</p>
              <p>· {plan.maxStorageGB} {t("gb_storage", "GB Storage")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
