import { OrbitLoader } from '@/components/ui/orbit-loader';
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import RunIntelligenceButton from '@/components/RunIntelligenceButton';
import { 
  DashboardMetricCard, 
  DashboardChartCard, 
  DashboardAreaChart, 
  DashboardBarChart,
  InsightAlertCard,
  MetricGrid,
  DataTableCard
} from '@/components/dashboard/DashboardLibrary';

import React from 'react';
import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from '@/components/intelligence/IntelligenceUI';
import { useState, useEffect} from "react";
import { useNavigate} from "react-router-dom";
import { useTranslation} from "react-i18next";
import { base44} from "@/api/base44Client";
import { useQuery} from "@tanstack/react-query";
import { useAuth} from "@/lib/AuthContext";
import { useImpersonation} from "@/lib/ImpersonationContext";
import { useCompanyId} from "@/hooks/useCompanyId";
import { getTerm} from "@/config/industries";
import { Briefcase, Users, DollarSign, Clock, Calendar, BarChart2, RefreshCw, Building2, Settings2, AlertCircle} from "lucide-react";
import HearingReminders from "@/components/dashboard/HearingReminders";
import { Badge} from "@/components/ui/badge";
import { Button} from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, PRIORITY_COLORS, formatCurrency} from "@/lib/constants";
import { format, isAfter, differenceInDays} from "date-fns";
import { buildMonthlyRevenueChart, buildDistributionChart} from "@/lib/dashboardCharts";
import { useQueryClient} from "@tanstack/react-query";
import { useToast} from "@/components/ui/use-toast";

function UsageRow({ label, used, max, suffix = ""}) {
 const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
 const isHigh = pct > 80;
 return (
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-sm">
 <span className="text-foreground font-medium">{label}</span>
 <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{used}{suffix} / {max}{suffix}</span>
 </div>
 <div className="h-1.5 bg-muted rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all ${isHigh ? "bg-amber-500" : "bg-primary"}`}
 style={{ width: `${pct}%`}}
 />
 </div>
 </div>
 );
}

export default function LawDashboard({ companyId, company, isAdmin}) {
 const { t} = useTranslation();
 const { user} = useAuth();
 const queryClient = useQueryClient();
 const navigate = useNavigate();

 const { data: cases = []} = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId}), enabled: !!companyId});
 const { data: clients = []} = useQuery({ queryKey: ["clients", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId}), enabled: !!companyId});
 const { data: hearings = []} = useQuery({ queryKey: ["hearings", companyId], queryFn: () => base44.entities.Hearing.filter({ company_id: companyId}), enabled: !!companyId});
 const { data: tasks = []} = useQuery({ queryKey: ["tasks", companyId], queryFn: () => base44.entities.Task.filter({ company_id: companyId}), enabled: !!companyId});
 const { data: invoices = []} = useQuery({ queryKey: ["invoices", companyId], queryFn: () => base44.entities.Invoice.filter({ company_id: companyId}), enabled: !!companyId});
 const { data: staff = []} = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId}), enabled: !!companyId});

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

 const chartData = buildMonthlyRevenueChart(invoices);
 const caseDistribution = buildDistributionChart(cases, "stage");

 const upcomingHearings = hearings
 .filter(h => h.status === "scheduled" && h.date && isAfter(new Date(h.date), new Date()))
 .sort((a, b) => new Date(a.date) - new Date(b.date))
 .slice(0, 5);

 const overdueInvoices = invoices.filter(i => i.status === "overdue").length;



 const { toast} = useToast();
 const [isRefreshing, setIsRefreshing] = useState(false);

 const handleRefresh = async () => {
 setIsRefreshing(true);
 await queryClient.invalidateQueries();
 setTimeout(() => {
 setIsRefreshing(false);
 toast({ title: t('dashboard_refreshed', "Dashboard refreshed"), description: t('all_data_up_to_date', "All data is up to date.")});
}, 500); // add slight delay for better UX
};

 if (!companyId) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
 <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
 <Building2 className="w-12 h-12 text-primary" />
 </div>
 <div className="max-w-md space-y-2">
 <h1 className="text-3xl font-semibold text-slate-900 tracking-tight tracking-[-0.02em]">{t('welcome_to_workslate', "Welcome to your workslate")}</h1>
 <p className="text-slate-500 text-lg">{t('setup_firm_prompt', "You haven't set up your law firm yet. Configure your firm's details to unlock your dashboard and features.")}</p>
 </div>
 <Button onClick={() => window.location.href = '/onboarding'} size="lg" className="mt-4 px-8 h-12 text-md">
 <Settings2 className="w-5 h-5 mr-2" />
 {t('setup_firm_now', "Setup Firm Now")}
 </Button>
 </div>
 );
}

 return (
 <div className="page-enter space-y-6 pb-8">
 {/* Header Section */}
 <div>
   <h1 className="text-3xl font-bold text-foreground mb-2">{t('law_dashboard', "Law Firm Dashboard")}</h1>
   <p className="text-muted-foreground">{t('law_dashboard_desc', "Manage cases, clients, revenue, and upcoming hearings at a glance")}</p>
 </div>

 {/* Hearing Reminders */}
 <HearingReminders hearings={hearings} userEmail={user?.email} isAdmin={isAdmin} />

 {/* Zone 1: Primary KPI Metrics */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 zone-1">
   <DashboardMetricCard
     title={t('active_cases', { defaultValue: `Active ${casesTermPlural}`})}
     value={activeCases.length}
     icon={Briefcase}
     iconBg="bg-blue-50 dark:bg-blue-950/20"
     iconColor="text-blue-600"
     subtitle={`${cases.length} total cases`}
   />
   <DashboardMetricCard
     title={t('deadline_this_week', "Cases with Deadline This Week")}
     value={upcomingHearings.length}
     icon={Calendar}
     iconBg="bg-red-50 dark:bg-red-950/20"
     iconColor="text-red-600"
     subtitle={upcomingHearings.length > 0 ? `Next: ${format(new Date(upcomingHearings[0].date), 'MMM dd')}` : 'None'}
   />
   <DashboardMetricCard
     title={t('unbilled_hours_value', "Unbilled Hours Value")}
     value={formatCurrency(totalRevenue * 0.2, currency)}
     unit={`${currency}`}
     icon={DollarSign}
     iconBg="bg-amber-50 dark:bg-amber-950/20"
     iconColor="text-amber-600"
     subtitle="This month"
   />
   <DashboardMetricCard
     title={t('revenue_collected', "Revenue Collected")}
     value={formatCurrency(totalRevenue, currency)}
     unit={`${currency}`}
     icon={DollarSign}
     iconBg="bg-emerald-50 dark:bg-emerald-950/20"
     iconColor="text-emerald-600"
     subtitle="This month"
   />
 </div>

 {/* Intelligence Dashboard - Zone 2 Top */}
 <div className="mb-2">
   <IntelligenceDashboard vertical="law" compact={true} maxItems={3} />
 </div>
 {/* Zone 2: Main Chart */}
 <DashboardChartCard
   title={t("monthly_revenue", "Monthly Revenue Collected")}
   onPeriodChange={(period) => console.log('Period changed to', period)}
 >
   <DashboardAreaChart data={chartData} dataKey="Revenue" color="#10b981" />
 </DashboardChartCard>
 {/* Zone 3: Supporting Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 zone-3">
   {/* Case Deadline Urgency */}
   <div className="bg-card rounded-lg border-[0.5px] border-border p-6 card-enter space-y-4">
     <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
       <Calendar className="w-4 h-4" />
       Case Deadlines
     </h3>
     <div className="space-y-3">
       {upcomingHearings.slice(0, 3).map(h => (
         <div key={h.id} className="text-sm border-l-4 border-red-500 pl-3 py-1 list-item-enter">
           <p className="font-medium text-foreground">{h.title}</p>
           <p className="text-xs text-muted-foreground">{format(new Date(h.date), 'MMM dd')} • {differenceInDays(new Date(h.date), new Date())} days</p>
         </div>
       ))}
     </div>
   </div>

   {/* Case Pipeline */}
   <div className="bg-card rounded-lg border-[0.5px] border-border p-6 card-enter space-y-4">
     <h3 className="text-sm font-semibold text-foreground">Case Pipeline</h3>
     <DashboardBarChart 
       data={caseDistribution} 
       dataKey="count" 
       color="#3b82f6"
     />
   </div>

   {/* Top Attorneys */}
   <div className="bg-card rounded-lg border-[0.5px] border-border p-6 card-enter space-y-4">
     <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
       <Users className="w-4 h-4" />
       Top Attorneys
     </h3>
     <div className="space-y-2">
       {staff.slice(0, 3).map((attorney, idx) => (
         <div key={idx} className="flex items-center justify-between text-sm list-item-enter">
           <span className="font-medium text-foreground">{attorney.name}</span>
           <span className="text-xs text-muted-foreground">{activeCases.length} active</span>
         </div>
       ))}
     </div>
   </div>

   {/* Open Intakes */}
   <div className="bg-card rounded-lg border-[0.5px] border-border p-6 card-enter space-y-4">
     <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
       <AlertCircle className="w-4 h-4" />
       Pending Intakes
     </h3>
     <div className="text-2xl font-bold text-foreground">{clients.filter(c => c.status === 'pending').length}</div>
     <Button variant="outline" size="sm" className="w-full">Review</Button>
   </div>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center gap-2 justify-end">
   <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
     {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
     {isRefreshing ? t('refreshing', 'Refreshing...') : t('refresh', 'Refresh')}
   </Button>
   <RunIntelligenceButton vertical="law" />
 </div>
 </div>
 );
}
