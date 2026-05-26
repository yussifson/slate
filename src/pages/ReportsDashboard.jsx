import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Clock, Trophy, DollarSign, Users, BarChart2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/constants";
import PageHeader from "@/components/shared/PageHeader";
import { startOfMonth, subMonths, format, isWithinInterval, endOfMonth } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

function MetricCard({ title, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsDashboard() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [period, setPeriod] = useState("6");

  const { data: timeEntries = [] } = useQuery({ queryKey: ["time-entries", companyId], queryFn: () => base44.entities.TimeEntry.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: outcomes = [] } = useQuery({ queryKey: ["outcomes", companyId], queryFn: () => base44.entities.CaseOutcome.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices", companyId], queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: staff = [] } = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: cases = [] } = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: company } = useQuery({ queryKey: ["company", companyId], queryFn: async () => { const r = await base44.entities.Company.filter({ id: companyId }); return r[0]; }, enabled: !!companyId });

  const currency = company?.currency || "GHS";
  const months = parseInt(period);

  // Monthly revenue trend
  const revenueData = useMemo(() => {
    return Array.from({ length: months }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), months - 1 - i));
      const monthEnd = endOfMonth(monthStart);
      const revenue = invoices
        .filter(inv => inv.status === "paid" && inv.paid_date && isWithinInterval(new Date(inv.paid_date), { start: monthStart, end: monthEnd }))
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      return { month: format(monthStart, "MMM yy"), revenue };
    });
  }, [invoices, months]);

  // Billable hours per department
  const deptHours = useMemo(() => {
    const deptMap = {};
    timeEntries.forEach(entry => {
      const s = staff.find(s => s.user_email === entry.lawyer_email);
      const dept = s?.department || s?.role || "Other";
      deptMap[dept] = (deptMap[dept] || 0) + (entry.hours || 0);
    });
    return Object.entries(deptMap).map(([dept, hours]) => ({ dept, hours: Math.round(hours * 10) / 10 })).sort((a, b) => b.hours - a.hours);
  }, [timeEntries, staff]);

  // Win rate
  const winRateData = useMemo(() => {
    const resolved = outcomes.filter(o => ["won", "lost", "settled", "dismissed"].includes(o.outcome));
    const won = resolved.filter(o => o.outcome === "won" || o.outcome === "settled").length;
    const winRate = resolved.length > 0 ? Math.round((won / resolved.length) * 100) : 0;
    return {
      winRate,
      total: resolved.length,
      won,
      lost: resolved.filter(o => o.outcome === "lost").length,
      settled: resolved.filter(o => o.outcome === "settled").length,
    };
  }, [outcomes]);

  // Win rate by department
  const deptWinRate = useMemo(() => {
    const deptMap = {};
    outcomes.filter(o => ["won", "lost", "settled", "dismissed"].includes(o.outcome)).forEach(o => {
      const s = staff.find(s => s.user_email === o.assigned_lawyer);
      const dept = s?.department || s?.role || "Other";
      if (!deptMap[dept]) deptMap[dept] = { won: 0, total: 0 };
      deptMap[dept].total++;
      if (o.outcome === "won" || o.outcome === "settled") deptMap[dept].won++;
    });
    return Object.entries(deptMap).map(([dept, d]) => ({
      dept, rate: Math.round((d.won / d.total) * 100), total: d.total
    }));
  }, [outcomes, staff]);

  // Pie data for outcomes
  const outcomePie = [
    { name: "Won", value: winRateData.won },
    { name: "Lost", value: winRateData.lost },
    { name: "Settled", value: winRateData.settled },
  ].filter(d => d.value > 0);

  const totalBillable = timeEntries.reduce((s, e) => s + (e.hours || 0), 0);
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);

  // Monthly billable hours trend
  const hoursData = useMemo(() => {
    return Array.from({ length: months }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), months - 1 - i));
      const monthEnd = endOfMonth(monthStart);
      const hours = timeEntries
        .filter(e => e.date && isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd }))
        .reduce((sum, e) => sum + (e.hours || 0), 0);
      return { month: format(monthStart, "MMM yy"), hours: Math.round(hours * 10) / 10 };
    });
  }, [timeEntries, months]);

  // Current month vs last month
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  const thisMonthRevenue = invoices.filter(i => i.status === "paid" && i.paid_date && isWithinInterval(new Date(i.paid_date), { start: thisMonthStart, end: thisMonthEnd })).reduce((s, i) => s + (i.total_amount || 0), 0);
  const lastMonthRevenue = invoices.filter(i => i.status === "paid" && i.paid_date && isWithinInterval(new Date(i.paid_date), { start: lastMonthStart, end: lastMonthEnd })).reduce((s, i) => s + (i.total_amount || 0), 0);
  const thisMonthHours = timeEntries.filter(e => e.date && isWithinInterval(new Date(e.date), { start: thisMonthStart, end: thisMonthEnd })).reduce((s, e) => s + (e.hours || 0), 0);
  const lastMonthHours = timeEntries.filter(e => e.date && isWithinInterval(new Date(e.date), { start: lastMonthStart, end: lastMonthEnd })).reduce((s, e) => s + (e.hours || 0), 0);
  const revenueDelta = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;
  const hoursDelta = lastMonthHours > 0 ? Math.round(((thisMonthHours - lastMonthHours) / lastMonthHours) * 100) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Billable hours, win rates, and revenue trends"
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 text-xs h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Monthly Summary for Managers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium mb-1">This Month's Revenue</p>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(thisMonthRevenue, currency)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">vs last month: {formatCurrency(lastMonthRevenue, currency)}</span>
            {revenueDelta !== null && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${revenueDelta >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {revenueDelta >= 0 ? "+" : ""}{revenueDelta}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium mb-1">This Month's Billable Hours</p>
          <p className="text-3xl font-bold text-foreground">{Math.round(thisMonthHours * 10) / 10}h</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">vs last month: {Math.round(lastMonthHours * 10) / 10}h</span>
            {hoursDelta !== null && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${hoursDelta >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {hoursDelta >= 0 ? "+" : ""}{hoursDelta}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Billable Hours" value={`${Math.round(totalBillable)}h`} icon={Clock} color="bg-blue-100 text-blue-600" sub={`${timeEntries.length} entries`} />
        <MetricCard title="Win Rate" value={`${winRateData.winRate}%`} icon={Trophy} color="bg-green-100 text-green-600" sub={`${winRateData.total} resolved cases`} />
        <MetricCard title="Total Revenue" value={formatCurrency(totalRevenue, currency)} icon={DollarSign} color="bg-amber-100 text-amber-600" sub="All time paid" />
        <MetricCard title="Active Staff" value={staff.filter(s => s.status === "active").length} icon={Users} color="bg-purple-100 text-purple-600" sub={`${staff.length} total`} />
      </div>

      {/* Revenue Trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Monthly Revenue Trend
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} />
            <Tooltip formatter={(v) => formatCurrency(v, currency)} />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Billable Hours Trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Monthly Billable Hours Trend
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hoursData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
            <Tooltip formatter={(v) => [`${v}h`, "Billable Hours"]} />
            <Bar dataKey="hours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Billable Hours by Department */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Billable Hours by Department
          </h3>
          {deptHours.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No time entries found</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptHours} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Win Rate by Department */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Case Outcomes
          </h3>
          {outcomePie.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No resolved cases yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={outcomePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {outcomePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {outcomePie.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-semibold">{entry.value}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-border text-xs text-muted-foreground">
                  Win rate: <span className="font-bold text-foreground">{winRateData.winRate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Win Rate per Department Table */}
      {deptWinRate.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Win Rate by Department
          </h3>
          <div className="space-y-3">
            {deptWinRate.map(d => (
              <div key={d.dept} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0 capitalize">{d.dept}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${d.rate}%` }} />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{d.rate}%</span>
                <span className="text-xs text-muted-foreground w-16 text-right">{d.total} cases</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}