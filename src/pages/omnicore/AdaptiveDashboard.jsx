import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import {
  Activity, ArrowUpRight, CheckCircle2, AlertTriangle, AlertCircle,
  Clock, DollarSign, Users, Briefcase, RefreshCw, Layers, ShieldAlert,
  Calendar, Package, Sparkles, ChevronRight, CheckSquare, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';

// OmniCore Structural Imports
import { BusinessProfileResolver } from '@/omnicore/config/BusinessProfileResolver';
import { BusinessHealth } from '@/omnicore/intelligence/BusinessHealth';
import { ActionCenter } from '@/omnicore/intelligence/ActionCenter';
import { Analytics } from '@/omnicore/capabilities/Analytics';
import { Scheduling } from '@/omnicore/capabilities/Scheduling';
import { Reporting } from '@/omnicore/capabilities/Reporting';
import { OrbitPilotGate } from '@/omnicore/orbit/OrbitPilotGate';

export default function AdaptiveDashboard() {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const userRole = (user?.role || 'employee').toLowerCase();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('executive');

  // OmniCore State Data
  const [profile, setProfile] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [actionFeed, setActionFeed] = useState(null);
  const [workloadDist, setWorkloadDist] = useState(null);
  const [staffSchedule, setStaffSchedule] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);

  const isPilotAuthorized = useMemo(() => {
    return OrbitPilotGate.isPilotCompanyActiveSync(companyId, {
      omnicore_enabled: true,
      slate_v2_enabled: true,
      pilot_companies: [companyId]
    });
  }, [companyId]);

  const isExecutiveRole = useMemo(() => {
    return ['owner', 'ceo', 'managing_partner', 'company_admin', 'admin', 'super_admin'].includes(userRole);
  }, [userRole]);

  const isManagerRole = useMemo(() => {
    return ['manager', 'finance', 'operations', 'director', 'lead'].includes(userRole) || isExecutiveRole;
  }, [userRole, isExecutiveRole]);

  useEffect(() => {
    if (isExecutiveRole) {
      setActiveTab('executive');
    } else if (isManagerRole) {
      setActiveTab('manager');
    } else {
      setActiveTab('staff');
    }
  }, [isExecutiveRole, isManagerRole]);

  const loadDashboardData = async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Resolve Profile & Context
      const companyMock = { id: companyId, industry_type: user?.industry_type || user?.industry || 'retail' };
      const resolvedProfile = BusinessProfileResolver.resolveSync(companyMock);
      setProfile(resolvedProfile);

      // 2. Fetch Signals in Parallel
      const [
        execSummary,
        health,
        feed,
        workload,
        schedule,
        report
      ] = await Promise.all([
        Analytics.getExecutiveSummary(companyId).catch(() => null),
        BusinessHealth.evaluateHealth(companyId).catch(() => null),
        ActionCenter.getActionCenterFeed(companyId).catch(() => null),
        Analytics.getEmployeeWorkloadDistribution(companyId).catch(() => null),
        Scheduling.getStaffSchedule(companyId, user?.email || user?.id || '').catch(() => null),
        Reporting.getWeeklyOperationsReport(companyId).catch(() => null)
      ]);

      setExecutiveSummary(execSummary);
      setHealthData(health);
      setActionFeed(feed);
      setWorkloadDist(workload);
      setStaffSchedule(schedule);
      setWeeklyReport(report);
    } catch (err) {
      console.error('[AdaptiveDashboard] Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [companyId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const terms = profile?.terms || {};
  const contextPack = profile?.contextPack || {};

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* ── Pilot Status Notice Banner (Informative & Reversible) ── */}
      {!isPilotAuthorized && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Pilot Preview Mode: Active for Company <strong>{companyId || 'Default'}</strong>. Full GA roll-out scheduled across all tenants.</span>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
            Slate V2 Pilot
          </Badge>
        </div>
      )}

      {/* ── Dashboard Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {contextPack?.name || 'OmniCore'} Adaptive Dashboard
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold gap-1 px-2.5 py-0.5">
              <span>{contextPack?.icon || '🏢'}</span> {contextPack?.name || 'Vertical'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Context-aware operations, intelligence radar, and prioritized action feed for <strong>{user?.name || user?.full_name || 'Team Member'}</strong> ({userRole}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-xl border-border bg-card text-xs font-semibold gap-1.5 h-9 px-3"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Updating...' : 'Sync Live'}
          </Button>
        </div>
      </div>

      {/* ── Role Tab Selector ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-10 border border-border/60">
            <TabsTrigger value="executive" className="rounded-lg text-xs font-bold gap-1.5 px-3.5">
              <Activity className="w-3.5 h-3.5" /> Executive Radar
            </TabsTrigger>
            <TabsTrigger value="manager" className="rounded-lg text-xs font-bold gap-1.5 px-3.5">
              <Users className="w-3.5 h-3.5" /> Operations & Team
            </TabsTrigger>
            <TabsTrigger value="staff" className="rounded-lg text-xs font-bold gap-1.5 px-3.5">
              <CheckSquare className="w-3.5 h-3.5" /> My Schedule
            </TabsTrigger>
          </TabsList>

          {/* Dynamic Active Terms Summary Pill */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/40">
            <span>Client: <strong className="text-foreground">{terms.client || 'Client'}</strong></span>
            <span>•</span>
            <span>Case/Unit: <strong className="text-foreground">{terms.case || 'Case'}</strong></span>
            <span>•</span>
            <span>Staff: <strong className="text-foreground">{terms.staff || 'Staff'}</strong></span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: EXECUTIVE RADAR VIEW
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="executive" className="space-y-6 mt-0">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Revenue
                </CardDescription>
                <CardTitle className="text-2xl font-black text-foreground">
                  {formatCurrency(executiveSummary?.revenue || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Gross Sales Volume</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Operating Margin
                </CardDescription>
                <CardTitle className="text-2xl font-black text-foreground">
                  {formatCurrency(executiveSummary?.netOperatingMargin || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>Spend: {formatCurrency(executiveSummary?.supplierSpend || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Headcount
                </CardDescription>
                <CardTitle className="text-2xl font-black text-foreground">
                  {executiveSummary?.headcount || weeklyReport?.summary?.activeHeadcount || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>Assigned Personnel ({terms.staffPlural || 'Staff'})</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Task Throughput
                </CardDescription>
                <CardTitle className="text-2xl font-black text-foreground">
                  {executiveSummary?.taskCompletionRate || 0}%
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{weeklyReport?.summary?.completedTasks || 0} of {weeklyReport?.summary?.totalTasksScheduled || 0} Done</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Health & Action Center Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Radar Card */}
            <Card className="rounded-2xl border-border bg-card shadow-sm lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Health Radar
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-bold uppercase text-[10px]",
                      healthData?.overallStatus === 'healthy' && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
                      healthData?.overallStatus === 'attention' && "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
                      healthData?.overallStatus === 'at-risk' && "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                    )}
                  >
                    {healthData?.overallStatus || 'HEALTHY'}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Cross-dimensional health analysis across revenue, receivables, and customer retention.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                {['sales', 'finance', 'customers'].map((dim) => {
                  const d = healthData?.dimensions?.[dim] || { status: 'healthy', reason: 'Normal operational parameters.' };
                  return (
                    <div key={dim} className="p-2.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="capitalize">{dim}</span>
                        <span className={cn(
                          "capitalize font-bold text-[11px]",
                          d.status === 'healthy' && "text-emerald-600 dark:text-emerald-400",
                          d.status === 'attention' && "text-amber-600 dark:text-amber-400",
                          d.status === 'at-risk' && "text-rose-600 dark:text-rose-400"
                        )}>
                          {d.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {d.reason}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Action Center Feed Card */}
            <Card className="rounded-2xl border-border bg-card shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" /> Action Center Recommendations
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5">
                      {actionFeed?.summary?.totalActions || 0} Pending
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(actionFeed?.summary?.categories || {}).map(([cat, count]) => {
                      if (count === 0) return null;
                      return (
                        <Badge key={cat} variant="outline" className="text-[10px] font-semibold capitalize border-border/60">
                          {cat}: {count}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Prioritized operational actions generated from live accounting, inventory, and task signals.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {(actionFeed?.actions || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      No critical action items pending. Operations running smoothly.
                    </div>
                  ) : (
                    (actionFeed?.actions || []).slice(0, 5).map((action) => (
                      <div
                        key={action.id}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                          action.priority === 'high' ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10" : "border-border bg-muted/20"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground">{action.title}</span>
                            <Badge
                              className={cn(
                                "text-[10px] font-bold uppercase py-0 px-1.5",
                                action.priority === 'high' ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {action.priority}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-medium capitalize border-border/60">
                              {action.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {action.explanation}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Button size="sm" variant="secondary" className="h-7 text-xs font-semibold rounded-lg">
                            Review Item
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Context-Specific Quick Action Shortcuts */}
          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {contextPack?.name || 'Industry'} Specialized Workflows
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(contextPack?.dashboard?.quickActions || []).map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="rounded-xl border-border bg-muted/20 hover:bg-muted/50 text-xs font-bold justify-between h-10 px-4"
                >
                  <span>{action.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: OPERATIONS & TEAM VIEW (Manager)
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="manager" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Workload Table */}
            <Card className="rounded-2xl border-border bg-card shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Team Workload & Task Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Operational distribution across all registered staff members.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold">
                        <th className="pb-2">{terms.staff || 'Staff Member'}</th>
                        <th className="pb-2">Role</th>
                        <th className="pb-2">Active Tasks</th>
                        <th className="pb-2">Overdue</th>
                        <th className="pb-2">Workload Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(workloadDist?.distribution || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">
                            No team workload data available.
                          </td>
                        </tr>
                      ) : (
                        (workloadDist?.distribution || []).map((emp) => (
                          <tr key={emp.employeeId} className="hover:bg-muted/30">
                            <td className="py-2.5 font-medium text-foreground">{emp.name || emp.email}</td>
                            <td className="py-2.5 text-muted-foreground capitalize">{emp.role || 'Staff'}</td>
                            <td className="py-2.5 font-semibold text-foreground">{emp.activeTasks}</td>
                            <td className="py-2.5 text-rose-500 font-bold">{emp.overdueTasks > 0 ? emp.overdueTasks : '-'}</td>
                            <td className="py-2.5 font-mono">{emp.workloadScore}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Alerts Card */}
            <Card className="rounded-2xl border-border bg-card shadow-sm lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" /> Low-Stock Inventory Alerts
                </CardTitle>
                <CardDescription className="text-xs">
                  Items requiring immediate reorder.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-1">
                {(weeklyReport?.details?.inventoryAlerts || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    All stock levels above reorder thresholds.
                  </div>
                ) : (
                  (weeklyReport?.details?.inventoryAlerts || []).slice(0, 4).map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{item.name}</span>
                        <span className="text-rose-500 font-bold">{item.stockQuantity} Left</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Deficit: {item.deficit} units • Supplier: {item.supplier || 'Unassigned'}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: MY SCHEDULE & TASKS VIEW (Staff)
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="staff" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Task Roster */}
            <Card className="rounded-2xl border-border bg-card shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" /> My Assigned Tasks
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs font-bold">
                    {staffSchedule?.activeTasksCount || 0} Active
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Personal operational queue sorted by deadline urgency.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="space-y-2.5">
                  {(staffSchedule?.tasks || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      You have zero pending tasks assigned.
                    </div>
                  ) : (
                    (staffSchedule?.tasks || []).map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground">{t.title}</span>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">
                              {t.priority || 'medium'}
                            </Badge>
                          </div>
                          {t.dueDate && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Due: {new Date(t.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs font-semibold rounded-lg">
                          Complete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* My Schedule Summary Stats */}
            <Card className="rounded-2xl border-border bg-card shadow-sm lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Schedule Snapshot
                </CardTitle>
                <CardDescription className="text-xs">
                  Individual load metrics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Total Assigned Tasks</span>
                  <span className="font-bold text-foreground">{staffSchedule?.totalTasks || 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Active Pending</span>
                  <span className="font-bold text-foreground">{staffSchedule?.activeTasksCount || 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Overdue Deadlines</span>
                  <span className="font-bold text-rose-500">{staffSchedule?.overdueTasksCount || 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Completed Tasks</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{staffSchedule?.completedTasksCount || 0}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Workload Weight Score</span>
                  <span className="font-mono font-bold text-foreground">{staffSchedule?.taskLoadScore || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
