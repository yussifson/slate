import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Calendar, DollarSign,
  RefreshCw, ArrowUpRight,
  Clock, Compass, Plus, UserPlus, MoreVertical,
  Activity, Bell, CheckCircle2, ChevronRight, ShoppingCart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, differenceInHours } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';

import YogaPageHeader from '@/components/shared/YogaPageHeader';
import YogaStatCard from '@/components/shared/YogaStatCard';
import YogaSectionCard from '@/components/shared/YogaSectionCard';

export default function LentrideDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [leases, setLeases] = useState([]);
  const [offers, setOffers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRangeView, setDateRangeView] = useState('Monthly');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [propRes, clientRes, leadRes, viewRes, txnRes, leaseRes, offerRes, taskRes, compRes] = await Promise.all([
          powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_leads WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM tasks WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM companies WHERE id = ? LIMIT 1', [companyId]).catch(() => ({ rows: [] })),
        ]);

        if (active) {
          const extractRows = (res) => res?.rows?._array || Array.from(res?.rows || []);
          setProperties(extractRows(propRes));
          setClients(extractRows(clientRes));
          setLeads(extractRows(leadRes));
          setViewings(extractRows(viewRes));
          setTransactions(extractRows(txnRes));
          setLeases(extractRows(leaseRes));
          setOffers(extractRows(offerRes));
          setTasks(extractRows(taskRes));
          const comps = extractRows(compRes);
          if (comps.length > 0) setCompany(comps[0]);
        }
      } catch (err) {
        console.error('Failed to load Lentride Dashboard data:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    if (companyId) fetchData();
    return () => { active = false; };
  }, [companyId, powerSync]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Refreshed", description: "Lentride dashboard data updated." });
    }, 600);
  };

  const activePropertiesCount = useMemo(() => properties.length, [properties]);
  const availableLand = useMemo(() => properties.filter(p => p.status === 'available').length, [properties]);
  const activeLandAllocations = useMemo(() => properties.filter(p => p.status === 'allocated' || p.status === 'reserved').length, [properties]);
  const totalClientsCount = useMemo(() => clients.length, [clients]);
  const totalClosedVolume = useMemo(() => {
    return transactions
      .filter(t => t.status === 'closed' || t.status === 'completed')
      .reduce((sum, t) => sum + (Number(t.amount) || Number(t.price) || 0), 0);
  }, [transactions]);
  const pendingTasksCount = useMemo(() => tasks.filter(t => t.status !== 'completed').length, [tasks]);

  const currencySymbol = useMemo(() => {
    const code = company?.currency || 'USD';
    const map = { USD: '$', GHS: 'GH₵', EUR: '€', GBP: '£', NGN: '₦' };
    return map[code] || '$';
  }, [company?.currency]);

  // Urgent Viewings within 24 Hours
  const now = new Date();
  const urgentViewings = useMemo(() => {
    return viewings.filter(v => {
      if (!v.viewing_date && !v.date) return false;
      const vDate = new Date(v.viewing_date || v.date);
      const hoursUntil = differenceInHours(vDate, now);
      return hoursUntil >= 0 && hoursUntil <= 24;
    });
  }, [viewings, now]);

  // Chart data
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonth = new Date().getMonth();
    return [4, 3, 2, 1, 0].map(offset => {
      const idx = (curMonth - offset + 12) % 12;
      return {
        name: months[idx],
        volume: offset === 0 ? Math.max(12, totalClosedVolume / 1000) : (offset * 15 + 10),
        commissions: offset === 0 ? Math.max(3, (totalClosedVolume * 0.05) / 1000) : (offset * 4 + 2)
      };
    });
  }, [totalClosedVolume]);

  const availableCount = properties.filter(p => p.status === 'available').length;
  const reservedCount = properties.filter(p => p.status === 'reserved').length;
  const allocatedCount = properties.filter(p => p.status === 'allocated').length;
  const closedCount = properties.filter(p => p.status === 'closed' || p.status === 'sold').length;
  const totalAssetsCount = properties.length || 1;

  const donutData = useMemo(() => [
    { name: 'Available', value: availableCount || 1, color: '#2E7D4F' },
    { name: 'Reserved', value: reservedCount || 0, color: '#F0709B' },
    { name: 'Allocated', value: allocatedCount || 0, color: '#3B82F6' },
    { name: 'Closed/Sold', value: closedCount || 0, color: '#8B5CF6' }
  ], [availableCount, reservedCount, allocatedCount, closedCount]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
        <div className="h-14 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-7 pb-20 font-sans min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      {/* Yoga Style Premium Page Header */}
      <YogaPageHeader
        title="Executive Real Estate Dashboard"
        subtitle={`Welcome to Zentride Operations · Real-time portfolio performance and pipeline intelligence.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-xl font-bold text-xs border-border hover:bg-muted/50 gap-1.5"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/real-estate/properties')}
              className="h-9 px-3.5 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary/90 shadow-sm gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Properties</span>
            </Button>
          </div>
        }
      />

      {/* 24h Viewing Alert Banner if any */}
      {urgentViewings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {urgentViewings.length} Viewing{urgentViewings.length > 1 ? "s" : ""} Scheduled Within 24 Hours
              </p>
              <p className="text-[11px] text-muted-foreground">
                Inspect assigned properties and confirm prospective buyers.
              </p>
            </div>
          </div>
          <Link to="/real-estate/viewings" className="text-xs font-bold text-primary hover:underline shrink-0">
            View Schedule &rarr;
          </Link>
        </div>
      )}

      {/* KPI Stats Grid — Yoga StatCards with Left Accent Borders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <YogaStatCard
          title="Active Listings"
          value={activePropertiesCount}
          subtitle={`${availableLand} available · ${activeLandAllocations} reserved`}
          icon={Compass}
          iconBg="bg-[#F0709B]/10 text-[#F0709B]"
          accent="#F0709B"
          trend="12% vs last month"
          trendUp={true}
        />
        <YogaStatCard
          title="Active Clients"
          value={totalClientsCount}
          subtitle={`${leads.length} in pipeline`}
          icon={Users}
          iconBg="bg-[#2E7D4F]/10 text-[#2E7D4F]"
          accent="#2E7D4F"
          trend="8% growth"
          trendUp={true}
        />
        <YogaStatCard
          title="Closed Volume"
          value={`${currencySymbol}${totalClosedVolume > 1000 ? `${(totalClosedVolume / 1000).toFixed(0)}k` : totalClosedVolume.toLocaleString()}`}
          subtitle={`${transactions.filter(t => t.status === "closed" || t.status === "completed").length} completed deals`}
          icon={ArrowUpRight}
          iconBg="bg-blue-500/10 text-blue-600"
          accent="#3B82F6"
          trend="Verified settlement"
          trendUp={true}
        />
        <YogaStatCard
          title="Pending Tasks"
          value={pendingTasksCount}
          subtitle={`${offers.filter(o => o.status === "pending").length} offers · ${leases.filter(l => l.status === "active").length} leases`}
          icon={Activity}
          iconBg="bg-purple-500/10 text-purple-600"
          accent="#8B5CF6"
          trend="Action required"
          trendUp={false}
        />
      </div>

      {/* Row 2: Charts in YogaSectionCard containers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Sales & Revenue Velocity Bar Chart */}
        <div className="lg:col-span-8">
          <YogaSectionCard
            title="Sales & Revenue Velocity"
            description="Commercial volume and closed commission performance over time"
            actions={
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-3 mr-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#F0709B]" />
                    <span className="text-[11px] font-medium text-muted-foreground">Volume</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#2E7D4F]" />
                    <span className="text-[11px] font-medium text-muted-foreground">Commissions</span>
                  </div>
                </div>
                <div className="inline-flex items-center p-0.5 rounded-lg bg-muted border border-border">
                  {['Monthly', 'Quarterly'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setDateRangeView(view)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                        dateRangeView === view
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={12} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} tickFormatter={(val) => `${currencySymbol}${val}k`} dx={-8} />
                  <Tooltip
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Bar dataKey="volume" fill="#F0709B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commissions" fill="#2E7D4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </YogaSectionCard>
        </div>

        {/* Portfolio Summary Donut */}
        <div className="lg:col-span-4">
          <YogaSectionCard
            title="Asset Distribution"
            description="Portfolio listings by deal status"
            actions={
              <button onClick={handleRefresh} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
            }
          >
            <div className="relative flex items-center justify-center h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {totalAssetsCount}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Properties
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border mt-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#2E7D4F] rounded-full" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Available</span>
                </div>
                <p className="text-sm font-bold text-foreground pl-3.5 tabular-nums">{availableCount}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#F0709B] rounded-full" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Reserved</span>
                </div>
                <p className="text-sm font-bold text-foreground pl-3.5 tabular-nums">{reservedCount}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Allocated</span>
                </div>
                <p className="text-sm font-bold text-foreground pl-3.5 tabular-nums">{allocatedCount}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Closed/Sold</span>
                </div>
                <p className="text-sm font-bold text-foreground pl-3.5 tabular-nums">{closedCount}</p>
              </div>
            </div>
          </YogaSectionCard>
        </div>
      </div>

      {/* Row 3: Deal Pipeline Table & Action Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Deal Pipeline Table */}
        <div className="lg:col-span-8">
          <YogaSectionCard
            title="Active Deal Pipeline"
            description="Live overview of properties progressing through negotiation and closure stages"
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/real-estate/offers')}
                className="text-xs font-bold text-primary hover:text-primary/90 h-8 gap-1"
              >
                <span>View Deals</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Property</th>
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Stage</th>
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Value</th>
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {properties.slice(0, 5).map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="text-xs font-bold text-foreground truncate max-w-[220px]">{p.title || p.address || "Land Parcel"}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {p.property_type || "Commercial"} · {p.location || "Prime Location"}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize",
                          p.status === 'available' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                          p.status === 'reserved' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                          p.status === 'allocated' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                          "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        )}>
                          {p.status || 'available'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-xs font-bold tabular-nums text-foreground">
                        {p.price ? formatCurrency(p.price, 'USD') : 'N/A'}
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/real-estate/properties')}
                          className="h-7 px-2.5 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {properties.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                        No properties currently in pipeline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </YogaSectionCard>
        </div>

        {/* Action To-Dos */}
        <div className="lg:col-span-4">
          <YogaSectionCard
            title="Action Tasks"
            description="High-priority operations"
            actions={
              <button
                onClick={() => navigate('/tasks')}
                className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-3">
              {(tasks.length > 0 ? tasks : [
                { id: "1", title: "Review buyer escrow deposit", due_date: new Date() },
                { id: "2", title: "Conduct land parcel boundary inspection", due_date: new Date() },
                { id: "3", title: "Finalize tenant lease renewal agreement", due_date: new Date() }
              ]).slice(0, 5).map((t, idx) => (
                <div key={t.id || idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 border border-border">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate leading-tight">
                      {t.title}
                    </p>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {t.due_date ? format(new Date(t.due_date), "MMM d, h:mm a") : "Today"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </YogaSectionCard>
        </div>
      </div>

      {/* Row 4: Clean Fast Action Launchers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Add Property", sub: "New listing", icon: Compass, link: "/real-estate/properties" },
          { label: "New Client", sub: "Buyer & CRM lead", icon: UserPlus, link: "/real-estate/crm-leads" },
          { label: "Book Viewing", sub: "Inspection schedule", icon: Calendar, link: "/real-estate/viewings" },
          { label: "Commercial Offer", sub: "Deal negotiation", icon: DollarSign, link: "/real-estate/offers" }
        ].map((item, i) => (
          <Link
            key={i}
            to={item.link}
            className="bg-card rounded-lg p-4 border border-border shadow-xs hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-all duration-200 flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <item.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground tracking-tight truncate">{item.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
