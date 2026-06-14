import { powerSync} from '@/api/PowerSyncConnector';
import { useTranslation} from "react-i18next";
import React, { useState, useMemo} from "react";
import { base44} from "@/api/base44Client";
import { useQuery} from "@tanstack/react-query";
import { useAuth} from "@/lib/AuthContext";
import {
 AreaChart,
 Area,
 BarChart,
 Bar,
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell,
 Legend,
} from "recharts";
import {
 TrendingUp,
 DollarSign,
 Users,
 ShoppingCart,
 Target,
 Package,
 FileText,
 BarChart2,
 Percent,
 Clock,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { formatCurrency} from "@/lib/constants";
import { startOfMonth, subMonths, format, isWithinInterval, endOfMonth} from "date-fns";
import { RETAIL_BRAND} from "@/components/retail/RetailViewKit";

// Use professional enterprise colors instead of potentially playful brand colors
const CHART_COLORS = ["#1e3a8a", "#2563eb", "#3b82f6", "#60a5fa", "#0f172a", "#334155"];
const THEME_BLUE = "text-primary/90 dark:text-primary/70";
const BG_BLUE_LIGHT = "bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20";

function ReportMetricCard({ title, value, sub, icon: Icon, trend}) {
 return (
 <div className="bg-card border border-primary/40 rounded-xl p-6 transition-">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
 <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 dark:text-white mt-2 tracking-tight">{value}</p>
 <div className="flex items-center gap-2 mt-2 flex-wrap">
 {trend !== undefined && (
 <span
 className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
 trend >= 0 ? "bg-slate-50 dark:bg-slate-800/50 text-primary/90 dark:bg-primary/30 dark:text-primary/70" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
}`}
 >
 {trend > 0 ? "+" : ""}
 {trend}% vs prior period
 </span>
 )}
 {sub && <span className="text-xs text-slate-500 dark:text-slate-400">{sub}</span>}
 </div>
 </div>
 <div className={`w-12 h-12 rounded-xl ${BG_BLUE_LIGHT} flex items-center justify-center shrink-0`}>
 <Icon className={`w-6 h-6 ${THEME_BLUE}`} />
 </div>
 </div>
 </div>
 );
}

function ReportSection({ title, description, icon: Icon, children, className = ""}) {
 return (
 <section className={`bg-card border border-primary/40 rounded-xl overflow-hidden ${className}`}>
 <div className="px-6 py-5 border-b border-primary/40 bg-slate-50/50 dark:bg-transparent dark:bg-slate-900/50">
 <div className="flex items-center gap-3">
 {Icon && <Icon className={`w-5 h-5 ${THEME_BLUE} shrink-0`} />}
 <div>
 <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 dark:text-white">{title}</h2>
 {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
 </div>
 </div>
 </div>
 <div className="p-6">{children}</div>
 </section>
 );
}

function BlueTooltip({ active, payload, label, prefix = "", suffix = ""}) {
 if (!active || !payload?.length) return null;
 return (
 <div className="bg-card border border-primary/40 rounded-lg p-3 text-sm min-w-[140px]">
 <p className="font-semibold text-primary mb-2">{label}</p>
 {payload.map((entry, i) => (
 <div key={i} className="flex justify-between gap-4 text-muted-foreground">
 <span className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full" style={{ background: entry.color}} />
 {entry.name}
 </span>
 <span className="font-semibold text-foreground">
 {prefix}
 {Number(entry.value).toLocaleString()}
 {suffix}
 </span>
 </div>
 ))}
 </div>
 );
}

import { Link} from 'react-router-dom';
import { ShieldAlert} from 'lucide-react';
import { isRetailAdmin} from '@/lib/constants';

export default function ReportsDashboard() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const companyId = user?.company_id;
 const isRetail = user?.company_industry === "retail" || user?.company_industry === "retail_sale";
 const isSchool = user?.company_industry === "school";
 const [period, setPeriod] = useState("12");
 const currency = user?.company_currency || "USD";
 const months = parseInt(period, 10);

 if (isRetail && !isRetailAdmin(user)) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 h-[calc(100vh-100px)]">
 <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
 <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
 </div>
 <h2 className="text-2xl font-bold text-foreground mb-3">Access Restricted</h2>
 <p className="text-muted-foreground max-w-md mx-auto mb-8">
 Your current role does not grant you permission to view the Reports Dashboard.
 </p>
 <div className="bg-card">
 </div>
 </div>
 );
}

 const { data: invoices = []} = useQuery({
 queryKey: ["invoices", companyId],
 queryFn: () => base44.entities.Invoice.filter({ company_id: companyId}),
 enabled: !!companyId && !isRetail,
});
 const { data: staff = []} = useQuery({
 queryKey: ["staff", companyId],
 queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId}),
 enabled: !!companyId && !isRetail,
});
 const { data: clients = []} = useQuery({
 queryKey: ["clients", companyId],
 queryFn: () => base44.entities.Client.filter({ company_id: companyId}),
 enabled: !!companyId && !isRetail,
});
 const { data: cases = []} = useQuery({
 queryKey: ["cases", companyId],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId}),
 enabled: !!companyId && !isRetail && !isSchool,
});

 // Retail specific data using useIndustryRecords directly if we can, but since this is a global component,
 // we'll fetch them using React Query to match the hook's structure (or simulate it).
 // The cache key for useIndustryRecords is ['industry_records', companyId, industry, recordType]
 const industry = user?.company_industry || 'retail';
 const { data: retailOrders = []} = useQuery({
 queryKey: ['industry_records', companyId, industry, 'order'],
 queryFn: async () => {
 // Data is usually loaded via the useIndustryRecords hook which hits idb first, but for reports we can fetch from Supabase
 const __res = await powerSync.execute(`SELECT * FROM industry_records WHERE company_id = ? AND industry = ? AND record_type = 'order' AND status != 'deleted'`, [companyId, industry]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 return data || [];
},
 enabled: !!companyId && isRetail
});

 const { data: retailCustomers = []} = useQuery({
 queryKey: ['industry_records', companyId, industry, 'customer'],
 queryFn: async () => {
 const __res = await powerSync.execute(`SELECT * FROM industry_records WHERE company_id = ? AND industry = ? AND record_type = 'customer' AND status != 'deleted'`, [companyId, industry]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 return data || [];
},
 enabled: !!companyId && isRetail
});

 const { data: retailProducts = []} = useQuery({
 queryKey: ['industry_records', companyId, industry, 'product'],
 queryFn: async () => {
 const __res = await powerSync.execute(`SELECT * FROM industry_records WHERE company_id = ? AND industry = ? AND record_type = 'product' AND status != 'deleted'`, [companyId, industry]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 return data || [];
},
 enabled: !!companyId && isRetail
});

 const revenueData = useMemo(() => {
 return Array.from({ length: months}, (_, i) => {
 const monthStart = startOfMonth(subMonths(new Date(), months - 1 - i));
 const monthEnd = endOfMonth(monthStart);
 
 let revenue = 0;
 if (isRetail) {
 revenue = retailOrders
 .filter((ord) => {
 const date = new Date(ord.data?.date || ord.created_at);
 return isWithinInterval(date, { start: monthStart, end: monthEnd}) && (ord.data?.status === 'Completed' || ord.data?.status === 'Delivered' || !ord.data?.status);
})
 .reduce((sum, ord) => sum + (parseFloat(ord.data?.total) || 0), 0);
} else {
 revenue = invoices
 .filter(
 (inv) =>
 inv.status === "paid" &&
 inv.paid_date &&
 isWithinInterval(new Date(inv.paid_date), { start: monthStart, end: monthEnd})
 )
 .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
}

 return {
 month: format(monthStart, "MMM yyyy"),
 revenue,
 target: Math.round(revenue * 1.15) || 0,
 invoices: 0 // Placeholder logic for retail
};
});
}, [invoices, retailOrders, months, isRetail]);

 const metrics = useMemo(() => {
 let totalRev = 0;
 let totalItems = 0;
 let totalStaffCount = 0;
 let avgDeal = 0;

 if (isRetail) {
 totalRev = retailOrders.reduce((sum, o) => sum + (parseFloat(o.data?.total) || 0), 0);
 totalItems = retailCustomers.length;
 totalStaffCount = retailOrders.length;
 avgDeal = retailOrders.length ? totalRev / retailOrders.length : 0;
} else {
 totalRev = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
 totalItems = clients.length;
 totalStaffCount = staff.length;
 avgDeal = invoices.filter(i => i.status === "paid").length ? totalRev / invoices.filter(i => i.status === "paid").length : 0;
}

 return {
 totalRevenue: totalRev,
 totalClients: totalItems,
 totalStaff: totalStaffCount,
 avgDealSize: avgDeal,
};
}, [invoices, clients, staff, retailOrders, retailCustomers, isRetail]);

 const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
 const currentMonthRevenue = revenueData[revenueData.length - 1]?.revenue || 0;
 const previousMonthRevenue = revenueData[revenueData.length - 2]?.revenue || 0;
 const revenueTrend = previousMonthRevenue
 ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
 : 0;

 const statusBreakdown = useMemo(() => {
 const map = {};
 invoices.forEach((inv) => {
 const s = inv.status || "unknown";
 map[s] = (map[s] || 0) + 1;
});
 return Object.entries(map).map(([name, value]) => ({
 name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
 value,
}));
}, [invoices]);

 const pipelineStages = useMemo(() => {
 if (isRetail || isSchool) return [];
 const stages = {};
 cases.forEach((c) => {
 const s = c.stage || c.status || "unspecified";
 stages[s] = (stages[s] || 0) + 1;
});
 return Object.entries(stages).map(([name, count]) => ({
 name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
 count,
}));
}, [cases, isRetail]);

 const topClients = useMemo(() => {
 return [...clients]
 .sort((a, b) => (b.total_billed || 0) - (a.total_billed || 0))
 .slice(0, 8)
 .map((c) => ({
 name: c.name || "Unknown",
 billed: c.total_billed || 0,
 cases: c.total_cases || 0,
 status: c.status || "active",
}));
}, [clients]);

 const staffSummary = useMemo(() => {
 return staff.slice(0, 10).map((s) => ({
 name: s.full_name || s.user_email,
 role: (s.role || "staff").replace(/_/g, " "),
 department: s.department || "—",
 status: s.status || "active",
}));
}, [staff]);

 const overdueCount = invoices.filter((i) => i.status === "overdue").length;
 const paidCount = invoices.filter((i) => i.status === "paid").length;
 const collectionRate = invoices.length ? Math.round((paidCount / invoices.length) * 100) : 0;

 return (
 <div className="space-y-8 pb-12 max-w-[1600px]">
 <header className="border-b border-primary/40 pb-6">
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
 <div>
 <p className={`text-xs font-bold ${THEME_BLUE} uppercase tracking-widest mb-2`}>
 {t("business_intelligence", "Business Intelligence")}
 </p>
 <h1 className={`text-4xl md:text-5xl font-extrabold ${THEME_BLUE} tracking-tight`}>
 {t("enterprise_analytics", "Enterprise Analytics")}
 </h1>
 <p className="text-base text-slate-500 dark:text-slate-400 mt-3 max-w-2xl">
 {t(
 "comprehensive_performance_report",
 "Comprehensive performance report with revenue, operations, and workforce metrics for executive review."
 )}
 </p>
 </div>
 <div className="flex items-center gap-3 bg-card border border-primary/40 rounded-lg px-3 py-2 ">
 <Clock className="w-4 h-4 text-primary shrink-0" />
 <Select value={period} onValueChange={setPeriod}>
 <SelectTrigger className="w-40 border-0 focus:ring-0 font-medium text-foreground">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="3">{t("last_3_months", "Last 3 months")}</SelectItem>
 <SelectItem value="6">{t("last_6_months", "Last 6 months")}</SelectItem>
 <SelectItem value="12">{t("last_12_months", "Last 12 months")}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </header>

 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 <ReportMetricCard
 title={t("revenue_mtd", "Revenue (current month)")}
 value={formatCurrency(currentMonthRevenue, currency)}
 icon={DollarSign}
 trend={revenueTrend}
 sub={t("from_paid_invoices", "From paid invoices")}
 />
 <ReportMetricCard
 title={t("revenue_period", "Revenue (selected period)")}
 value={formatCurrency(totalRevenue, currency)}
 icon={TrendingUp}
 sub={`${months} ${t("months", "months")}`}
 />
 <ReportMetricCard
 title={isRetail ? t("active_customers", "Active customers") : isSchool ? t("active_students", "Active students") : t("active_clients", "Active clients")}
 value={isRetail ? retailCustomers.length : clients.filter((c) => c.status === "active").length}
 icon={Users}
 sub={`${isRetail ? retailCustomers.length : clients.length} ${t("total_records", "total records")}`}
 />
 <ReportMetricCard
 title={t("collection_rate", "Collection rate")}
 value={`${collectionRate}%`}
 icon={Percent}
 sub={`${overdueCount} ${t("overdue", "overdue")}`}
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <ReportSection
 className="lg:col-span-2"
 title={t("revenue_trend", "Revenue trend")}
 description={t("paid_invoice_revenue_by_month", "Paid invoice revenue by month")}
 icon={BarChart2}
 >
 <div className="h-[450px] w-full mt-4">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0}}>
 <defs>
 <linearGradient id="reportRevenue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.25} />
 <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
 <XAxis dataKey="month" tick={{ fontSize: 11}} className="text-muted-foreground" />
 <YAxis tick={{ fontSize: 11}} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
 <Tooltip content={<BlueTooltip prefix={currency === "GHS" ? "₵" : "$"} />} />
 <Area
 type="monotone"
 dataKey="revenue"
 name="Revenue"
 stroke={CHART_COLORS[0]}
 strokeWidth={2.5}
 fill="url(#reportRevenue)"
 />
 <Line type="monotone" dataKey="target" name="Target" stroke={CHART_COLORS[2]} strokeDasharray="4 4" dot={false} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </ReportSection>

 <ReportSection
 title={t("invoice_status", "Invoice status")}
 description={t("distribution_by_status", "Distribution by payment status")}
 icon={FileText}
 >
 <div className="h-[350px] mt-4">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={statusBreakdown.length ? statusBreakdown : [{ name: "No data", value: 1}]}
 cx="50%"
 cy="50%"
 innerRadius={55}
 outerRadius={85}
 paddingAngle={3}
 dataKey="value"
 >
 {(statusBreakdown.length ? statusBreakdown : [{ name: "No data", value: 1}]).map((_, i) => (
 <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
 ))}
 </Pie>
 <Tooltip content={<BlueTooltip />} />
 <Legend wrapperStyle={{ fontSize: 11}} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </ReportSection>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <ReportSection
 title={t("actual_vs_target", "Actual vs target revenue")}
 description={t("monthly_performance_against_goal", "Monthly performance against goal")}
 icon={Target}
 >
 <div className="h-[400px] mt-4">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={revenueData} barGap={4} margin={{ top: 8, right: 8, left: 0, bottom: 0}}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
 <XAxis dataKey="month" tick={{ fontSize: 10}} interval={months > 6 ? 1 : 0} />
 <YAxis tick={{ fontSize: 11}} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
 <Tooltip content={<BlueTooltip prefix="$" />} />
 <Legend />
 <Bar dataKey="revenue" name="Actual" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
 <Bar dataKey="target" name="Target" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} opacity={0.85} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </ReportSection>

 <ReportSection
 title={t("billing_activity", "Billing activity")}
 description={t("invoices_created_per_month", "Invoices created per month")}
 icon={ShoppingCart}
 >
 <div className="h-[400px] mt-4">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0}}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
 <XAxis dataKey="month" tick={{ fontSize: 10}} />
 <YAxis tick={{ fontSize: 11}} allowDecimals={false} />
 <Tooltip content={<BlueTooltip />} />
 <Line type="monotone" dataKey="invoices" name="Invoices" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3}} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </ReportSection>
 </div>

 {!isRetail && !isSchool && pipelineStages.length > 0 && (
 <ReportSection
 title={t("pipeline_by_stage", "Pipeline by stage")}
 description={t("active_matters_by_workflow_stage", "Active matters by workflow stage")}
 icon={Package}
 >
 <div className="h-[280px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={pipelineStages} layout="vertical" margin={{ left: 20}}>
 <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
 <XAxis type="number" tick={{ fontSize: 11}} />
 <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11}} />
 <Tooltip content={<BlueTooltip />} />
 <Bar dataKey="count" name="Count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </ReportSection>
 )}

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 <ReportSection
 title={isSchool ? t("top_students_by_billing", "Top students by billing") : isRetail ? t("top_customers_by_billing", "Top customers by billing") : t("top_clients_by_billing", "Top clients by billing")}
 description={isSchool ? t("highest_value_students", "Highest value student accounts") : t("highest_value_relationships", "Highest value relationships")}
 icon={Users}
 >
 <div className="overflow-x-auto -mx-2">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-primary/40 text-left">
 <th className={`py-4 px-3 text-xs font-bold ${THEME_BLUE} uppercase`}>{isSchool ? 'Student' : isRetail ? 'Customer' : 'Client'}</th>
 <th className={`py-4 px-3 text-xs font-bold ${THEME_BLUE} uppercase text-right`}>Billed</th>
 <th className={`py-4 px-3 text-xs font-bold ${THEME_BLUE} uppercase text-center`}>{isSchool ? 'Classes' : 'Cases'}</th>
 <th className={`py-4 px-3 text-xs font-bold ${THEME_BLUE} uppercase`}>Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {topClients.length === 0 ? (
 <tr>
 <td colSpan={4} className="py-8 text-center text-muted-foreground">
 {t("no_client_data", "No client billing data yet")}
 </td>
 </tr>
 ) : (
 topClients.map((row) => (
 <tr key={row.name} className="hover:bg-muted/40">
 <td className="py-3 px-2 font-medium text-foreground">{row.name}</td>
 <td className="py-3 px-2 text-right font-semibold text-primary">
 {formatCurrency(row.billed, currency)}
 </td>
 <td className="py-3 px-2 text-center">{row.cases}</td>
 <td className="py-3 px-2 capitalize text-muted-foreground">{row.status}</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </ReportSection>

 <ReportSection
 title={t("workforce_overview", "Workforce overview")}
 description={t("staff_directory_snapshot", "Staff directory snapshot")}
 icon={Users}
 >
 <div className="overflow-x-auto -mx-2">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-primary/40 text-left">
 <th className={`py-4 px-3 text-xs font-bold ${THEME_BLUE} uppercase`}>Name</th>
 <th className={`py-4 px-3 text-xs font-bold ${THEME_BLUE} uppercase`}>Role</th>
 <th className={`py-4 px-3 text-xs font-bold ${THEME_BLUE} uppercase`}>Department</th>
 <th className={`py-4 px-3 text-xs font-bold ${THEME_BLUE} uppercase`}>Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {staffSummary.length === 0 ? (
 <tr>
 <td colSpan={4} className="py-8 text-center text-muted-foreground">
 {t("no_staff_records", "No staff records")}
 </td>
 </tr>
 ) : (
 staffSummary.map((row) => (
 <tr key={row.name} className="hover:bg-muted/40">
 <td className="py-3 px-2 font-medium text-foreground">{row.name}</td>
 <td className="py-3 px-2 capitalize text-muted-foreground">{row.role}</td>
 <td className="py-3 px-2 text-muted-foreground">{row.department}</td>
 <td className="py-3 px-2">
 <span className="text-xs font-semibold text-primary capitalize">{row.status}</span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </ReportSection>
 </div>

 <ReportSection
 title={t("executive_summary", "Executive summary")}
 description={t("key_figures_for_selected_period", "Key figures for the selected period")}
 icon={FileText}
 >
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
 <div className="p-6 rounded-xl border border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900">
 <p className={`text-xs font-bold ${THEME_BLUE} uppercase`}>{t("total_invoices", "Total invoices")}</p>
 <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 dark:text-white mt-2">{invoices.length}</p>
 </div>
 <div className="p-6 rounded-xl border border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900">
 <p className={`text-xs font-bold ${THEME_BLUE} uppercase`}>{t("paid_invoices", "Paid invoices")}</p>
 <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 dark:text-white mt-2">{paidCount}</p>
 </div>
 <div className="p-6 rounded-xl border border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900">
 <p className={`text-xs font-bold ${THEME_BLUE} uppercase`}>{t("team_members", "Team members")}</p>
 <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 dark:text-white mt-2">{staff.length}</p>
 </div>
 <div className="p-6 rounded-xl border border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900">
 <p className={`text-xs font-bold ${THEME_BLUE} uppercase`}>{t("avg_monthly_revenue", "Avg monthly revenue")}</p>
 <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 dark:text-white mt-2">
 {formatCurrency(months ? Math.round(totalRevenue / months) : 0, currency)}
 </p>
 </div>
 </div>
 <p className="text-xs text-muted-foreground mt-6 border-t border-primary/40 pt-4">
 {t(
 "report_footer_note",
 "Figures are generated from live workspace data. Export detailed ledgers from Billing or Data Export for audit trails."
 )}
 </p>
 </ReportSection>
 </div>
 );
}
