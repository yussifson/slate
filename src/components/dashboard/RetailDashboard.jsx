import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import RunIntelligenceButton from '@/components/RunIntelligenceButton';
import {
  ShoppingBag, Package, Users, DollarSign, BarChart2,
  RefreshCw, Settings2, Tag, TrendingUp, CreditCard,
  ShoppingCart, ArrowUpRight, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, formatCurrency } from "@/lib/constants";
import { buildMonthlyRevenueChart } from "@/lib/dashboardCharts";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { Link } from 'react-router-dom';

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

import { powerSync } from '@/api/PowerSyncConnector';

export default function RetailDashboard({ companyId, company, isAdmin }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chartPeriod, setChartPeriod] = useState('7D');

  const { data: stats } = useQuery({
    queryKey: ["retail_stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const [orders, customers, products] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_retail_orders WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT count(*) as count FROM univ_retail_customers WHERE company_id = ?', [companyId]),
        powerSync.execute('SELECT category FROM univ_retail_products WHERE company_id = ?', [companyId])
      ]);
      const ordersArray = orders.rows._array || Array.from(orders.rows);
      const prodArray = products.rows._array || Array.from(products.rows);
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let salesData = days.map(d => ({ day: d, sales: 0 }));
      let totalRev = 0;
      
      ordersArray.forEach(o => {
        if (o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Paid') {
          totalRev += (Number(o.total) || 0);
        }
        if (o.created_at) {
          const d = new Date(o.created_at).getDay();
          if (!isNaN(d)) salesData[d].sales += (Number(o.total) || 0);
        }
      });
      const todayIdx = new Date().getDay();
      salesData = [...salesData.slice(todayIdx + 1), ...salesData.slice(0, todayIdx + 1)];

      const catCounts = {};
      prodArray.forEach(p => {
         const c = p.category || 'General';
         catCounts[c] = (catCounts[c] || 0) + 1;
      });
      let topCats = Object.entries(catCounts).map(([cat, value]) => ({ cat, value })).sort((a,b) => b.value - a.value).slice(0, 4);
      if (topCats.length === 0) topCats = [{ cat: 'General', value: 0 }];

      return {
        activeOrders: ordersArray.filter(o => o.status === 'Processing' || o.status === 'in_progress').length,
        pendingOrders: ordersArray.filter(o => o.status === 'Pending' || o.status === 'open').length,
        totalOrders: ordersArray.length,
        customers: customers.rows._array[0]?.count || 0,
        totalRevenue: totalRev,
        salesData,
        topCats,
        // for monthly revenue chart if needed
        invoices: ordersArray.map(o => ({ ...o, total_amount: o.total }))
      };
    },
    enabled: !!companyId
  });

  const activeOrdersLength = stats?.activeOrders || 0;
  const pendingOrdersLength = stats?.pendingOrders || 0;
  const customersLength = stats?.customers || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const SALES_DATA = stats?.salesData || [];
  const TOP_CATS = stats?.topCats || [];
  
  const currency = company?.currency || "USD";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;
  const chartData = buildMonthlyRevenueChart(stats?.invoices || []);
  const staff = []; // Fallback to prevent ReferenceError

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
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
          <Store className="w-12 h-12 text-orange-600" />
        </div>
        <Button onClick={() => window.location.href = '/onboarding'} size="lg">
          <Settings2 className="w-5 h-5 mr-2" /> {t("setup_now", "Setup Now")}
        </Button>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Orders', value: activeOrdersLength, sub: `${stats?.totalOrders || 0} total`, icon: ShoppingCart, alt: false, trend: '+9%' },
    { label: 'Total Customers', value: customersLength, sub: 'registered', icon: Users, alt: true, trend: '+22%' },
    { label: 'Revenue', value: formatCurrency(totalRevenue, currency), sub: 'collected this period', icon: DollarSign, alt: false, trend: '+31%' },
    { label: 'Pending Orders', value: pendingOrdersLength, sub: 'awaiting processing', icon: Package, alt: true, trend: pendingOrdersLength > 15 ? 'High' : 'Normal' },
  ];

  // Correct routes from App.jsx retail suite
  const quickNav = [
    { label: 'Products', href: '/products', icon: Package, alt: false },
    { label: 'POS', href: '/pos', icon: CreditCard, alt: true },
    { label: 'Orders', href: '/orders', icon: ShoppingCart, alt: false },
    { label: 'Inventory', href: '/retail-inventory', icon: ShoppingBag, alt: true },
    { label: 'Promotions', href: '/promotions', icon: Tag, alt: false },
    { label: 'Analytics', href: '/analytics', icon: BarChart2, alt: true },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Retail Operations</h1>
                <p className="text-orange-100 text-sm">Welcome back, {user?.email?.split('@')[0]} 👋</p>
              </div>
            </div>
            <p className="text-orange-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <RunIntelligenceButton vertical="retail" />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2">
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Intelligence ── */}
      <IntelligenceDashboard vertical="retail" compact={true} maxItems={3} />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.alt ? 'text-orange-700 bg-orange-50' : 'text-green-700 bg-green-50'}`}>
                <ArrowUpRight className="w-3 h-3 inline" />{kpi.trend}
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
              <h3 className="text-base font-semibold text-foreground">Revenue ({currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly sales performance</p>
            </div>
            <div className="flex gap-1">
              {['7D','30D','90D'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === p ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="retailRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#retailRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Daily Sales Volume</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Sales trend this week</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SALES_DATA} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="sales" fill="#16a34a" radius={[4, 4, 0, 0]} name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Categories + Plan Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h3 className="text-base font-semibold text-foreground mb-5">Top Categories</h3>
          <div className="space-y-4">
            {TOP_CATS.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-foreground font-medium">{cat.cat}</span>
                  <span className="text-muted-foreground">{cat.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${i % 2 === 0 ? 'bg-green-600' : 'bg-orange-500'}`} style={{ width: `${cat.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">{t("plan_status", "Plan Status")}</h3>
            <span className="text-xs font-medium text-muted-foreground capitalize">{plan.name}</span>
          </div>
          <div className="space-y-4 mb-5">
            <UsageRow label="Staff" used={staff.length} max={plan.maxUsers} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB} suffix=" GB" />
            <UsageRow label="Orders" used={orders.length} max={plan.maxCases} />
            <UsageRow label="Customers" used={customers.length} max={plan.maxClients} />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Plan Details</p>
              <p className="text-sm font-bold text-orange-600">{formatCurrency(plan.price || 0, currency)}/mo</p>
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