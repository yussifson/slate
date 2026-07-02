import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import RunIntelligenceButton from '@/components/RunIntelligenceButton';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import {
  Bed, Users, DollarSign, Calendar, BarChart2, RefreshCw,
  Building2, Settings2, Star, UtensilsCrossed, Car, ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, formatCurrency } from "@/lib/constants";
import { format, isAfter } from "date-fns";
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

export default function HotelDashboard({ companyId, company, isAdmin }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chartPeriod, setChartPeriod] = useState('30D');

  const { data: dbReservations = [] } = useIndustryRecords('reservation');
  const { data: dbRooms = [] } = useIndustryRecords('room');
  const { data: dbHousekeeping = [] } = useIndustryRecords('housekeeping_task');
  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  const activeBookings = dbReservations.filter(r => ["Confirmed", "Checked-in"].includes(r.status));
  const activeGuests = dbReservations.filter(r => r.status === "Checked-in");
  const pendingTasks = dbHousekeeping.filter(t => t.status !== "Clean" && t.status !== "Completed");
  const totalRevenue = dbReservations.reduce((sum, r) => sum + (Number(r.data?.total) || 0), 0);
  const currency = company?.currency || "GHS";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;

  const chartData = React.useMemo(() => {
    const data = dbReservations.reduce((acc, res) => {
      if (res.status === 'Cancelled' || !res.created_at) return acc;
      const month = format(new Date(res.created_at), 'MMM');
      const rev = Number(res.data?.total) || 0;
      acc[month] = (acc[month] || 0) + rev;
      return acc;
    }, {});
    
    // Sort chronologically based on recent 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(format(d, 'MMM'));
    }
    return months.map(m => ({ name: m, Revenue: data[m] || 0 }));
  }, [dbReservations]);

  const bookingDist = [
    { name: 'Confirmed', count: dbReservations.filter(r => r.status === 'Confirmed').length },
    { name: 'Checked-in', count: dbReservations.filter(r => r.status === 'Checked-in').length },
    { name: 'Checked-out', count: dbReservations.filter(r => r.status === 'Checked-out').length },
  ].filter(d => d.count > 0);

  const upcomingReservations = dbReservations
    .filter(r => r.status === "Confirmed" && r.data?.checkIn && isAfter(new Date(r.data.checkIn), new Date()))
    .sort((a, b) => new Date(a.data.checkIn) - new Date(b.data.checkIn))
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
          <Building2 className="w-12 h-12 text-green-600" />
        </div>
        <Button onClick={() => window.location.href = '/onboarding'} size="lg">
          <Settings2 className="w-5 h-5 mr-2" /> {t("setup_now", "Setup Now")}
        </Button>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Bookings', value: activeBookings.length, sub: `${dbReservations.length} total`, icon: Bed, alt: false },
    { label: 'Guests In-House', value: activeGuests.length, sub: 'currently checked in', icon: Users, alt: true },
    { label: 'Revenue', value: formatCurrency(totalRevenue, currency), sub: 'total collected', icon: DollarSign, alt: false },
    { label: 'Pending Tasks', value: pendingTasks.length, sub: 'housekeeping tasks', icon: Star, alt: true },
  ];

  // Correct routes from App.jsx
  const quickNav = [
    { label: 'Reservations', href: '/reservations', icon: Calendar, alt: false },
    { label: 'Front Desk', href: '/front-desk', icon: Building2, alt: true },
    { label: 'Housekeeping', href: '/housekeeping', icon: Star, alt: false },
    { label: 'Restaurant', href: '/restaurant', icon: UtensilsCrossed, alt: true },
    { label: 'Concierge', href: '/guest-requests', icon: Car, alt: false },
    { label: 'Analytics', href: '/analytics', icon: BarChart2, alt: true },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-700 to-emerald-800 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Bed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Hotel Operations</h1>
                <p className="text-green-100 text-sm">Welcome back, {user?.email?.split('@')[0]} 👋</p>
              </div>
            </div>
            <p className="text-green-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <RunIntelligenceButton vertical="hospitality" />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2">
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Intelligence ── */}
      <IntelligenceDashboard vertical="hospitality" compact={true} maxItems={3} />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full text-green-700 bg-green-50">
                <ArrowUpRight className="w-3 h-3 inline" />
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
              <h3 className="text-base font-semibold text-foreground">Revenue Growth ({currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue from bookings</p>
            </div>
            <div className="flex gap-1">
              {['30D','90D','1Y'].map(p => (
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
                <linearGradient id="hotelRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} tickFormatter={v => `${v/1000}K`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#hotelRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Booking Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Reservation pipeline</p>
          </div>
          {bookingDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={bookingDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="count">
                    {bookingDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {bookingDist.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bed className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming + Plan Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Upcoming Check-ins</h3>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">{upcomingReservations.length} pending</span>
          </div>
          {upcomingReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming check-ins</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center text-white shrink-0">
                    <span className="text-[9px] font-bold uppercase leading-none">{format(new Date(r.data.checkIn), "MMM")}</span>
                    <span className="text-sm font-bold leading-none">{format(new Date(r.data.checkIn), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.data.guestName || "Unknown Guest"}</p>
                    <p className="text-xs text-muted-foreground">Room {r.data.roomNumber || "TBD"} · {r.data.checkIn}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{r.status}</Badge>
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
            <UsageRow label="Bookings" used={activeBookings.length} max={plan.maxCases} />
            <UsageRow label="Guests" used={activeGuests.length} max={plan.maxClients} />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Plan Details</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(plan.price || 0, currency)}/mo</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>· {plan.maxUsers} Team Members · {plan.maxCases} Bookings</p>
              <p>· {plan.maxClients} Guests · {plan.maxStorageGB} GB Storage</p>
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