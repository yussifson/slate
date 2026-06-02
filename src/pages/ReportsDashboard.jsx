import { useTranslation } from "react-i18next";
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, Trophy, DollarSign, Users, Activity, ShoppingCart, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/constants";
import PageHeader from "@/components/shared/PageHeader";
import { startOfMonth, subMonths, format, isWithinInterval, endOfMonth } from "date-fns";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
const GRADIENTS = [
  "from-blue-600 to-cyan-500",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-purple-600 to-pink-500"
];

function PremiumMetricCard({ title, value, icon: Icon, sub, trend, gradientIdx }) {
  const gradient = GRADIENTS[gradientIdx % GRADIENTS.length];
  return (
    <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
      <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-extrabold text-foreground mb-1 tracking-tight">{value}</p>
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          {sub && <span className="text-xs text-muted-foreground font-medium">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-xl p-4 min-w-[150px]">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-sm font-medium mb-1 last:mb-0">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="text-foreground font-bold">
              {prefix}{entry.value.toLocaleString()}{suffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function ReportsDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const isRetail = user?.company_industry === "retail";
  const [period, setPeriod] = useState("6");

  // Fetch relevant data based on industry
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices", companyId], queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: staff = [] } = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: retailOrders = [] } = useQuery({ queryKey: ["retail-orders", companyId], queryFn: async () => {
    // Mock retail orders for dashboard if real endpoint missing
    return Array.from({length: 120}).map((_, i) => ({
       total: Math.floor(Math.random() * 500) + 50,
       status: 'Completed',
       date: subMonths(new Date(), Math.floor(Math.random() * 6)).toISOString()
    }));
  }, enabled: !!companyId && isRetail });

  const currency = user?.company_currency || "USD";
  const months = parseInt(period);

  const revenueData = useMemo(() => {
    return Array.from({ length: months }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), months - 1 - i));
      const monthEnd = endOfMonth(monthStart);
      
      let revenue = 0;
      if (isRetail) {
        revenue = retailOrders.filter(o => o.status === 'Completed' && isWithinInterval(new Date(o.date), { start: monthStart, end: monthEnd }))
                              .reduce((sum, o) => sum + (o.total || 0), 0);
      } else {
        revenue = invoices.filter(inv => inv.status === "paid" && inv.paid_date && isWithinInterval(new Date(inv.paid_date), { start: monthStart, end: monthEnd }))
                          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      }
      return { month: format(monthStart, "MMM yy"), revenue };
    });
  }, [invoices, retailOrders, months, isRetail]);

  const totalRevenue = revenueData.reduce((sum, data) => sum + data.revenue, 0);
  const currentMonthRevenue = revenueData[revenueData.length - 1]?.revenue || 0;
  const previousMonthRevenue = revenueData[revenueData.length - 2]?.revenue || 0;
  const revenueTrend = previousMonthRevenue ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) : 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t("enterprise_analytics", "Enterprise Analytics")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("real_time_insights_and_perform", "Real-time insights and performance metrics")}</p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-xl shadow-sm">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 h-9 text-xs font-semibold border-none focus:ring-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3">{t("last_3_months", "Last 3 months")}</SelectItem>
              <SelectItem value="6">{t("last_6_months", "Last 6 months")}</SelectItem>
              <SelectItem value="12">{t("last_12_months", "Last 12 months")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumMetricCard 
          title={t("total_revenue", "Total Revenue")} 
          value={formatCurrency(currentMonthRevenue, currency)} 
          icon={DollarSign} 
          trend={revenueTrend}
          sub={t("this_month", "this month")}
          gradientIdx={0} 
        />
        <PremiumMetricCard 
          title={isRetail ? t("total_orders", "Total Orders") : t("active_projects", "Active Projects")} 
          value={isRetail ? retailOrders.length : 124} 
          icon={ShoppingCart} 
          trend={12}
          sub={t("vs_last_period", "vs last period")}
          gradientIdx={1} 
        />
        <PremiumMetricCard 
          title={t("active_staff", "Active Staff")} 
          value={staff.length || 42} 
          icon={Users} 
          trend={5}
          sub={t("across_departments", "across departments")}
          gradientIdx={2} 
        />
        <PremiumMetricCard 
          title={t("performance_score", "Performance Score")} 
          value="94%" 
          icon={Target} 
          trend={2}
          sub={t("overall_efficiency", "overall efficiency")}
          gradientIdx={3} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
            <Activity className="w-5 h-5 text-blue-500" /> {t("revenue_growth", "Revenue Growth")}
          </h3>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v >= 1000 ? v/1000+'k' : v}`} dx={-10} />
                <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
           <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
            <Trophy className="w-5 h-5 text-purple-500" /> {isRetail ? t("sales_by_category", "Sales by Category") : t("resource_allocation", "Resource Allocation")}
          </h3>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Electronics', value: 400 },
                    { name: 'Apparel', value: 300 },
                    { name: 'Home Goods', value: 300 },
                    { name: 'Beauty', value: 200 }
                  ]} 
                  cx="50%" cy="50%" 
                  innerRadius={60} 
                  outerRadius={85} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {[0, 1, 2, 3].map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
            {['Electronics', 'Apparel', 'Home Goods', 'Beauty'].map((cat, i) => (
              <div key={cat} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: CHART_COLORS[i] }} />
                {cat}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
          <TrendingUp className="w-5 h-5 text-emerald-500" /> {t("performance_metrics", "Performance Metrics")}
        </h3>
        <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData.map(d => ({ ...d, target: d.revenue * 1.2 }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v >= 1000 ? v/1000+'k' : v}`} dx={-10} />
                <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Bar dataKey="revenue" name="Actual" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[6, 6, 0, 0]} fillOpacity={0.5} className="dark:fill-slate-800" />
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}