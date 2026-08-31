import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Users, TrendingUp, Home, Calendar, DollarSign,
  AlertCircle, BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight,
  Eye, FileText, Wrench, MapPin, Sparkles, ChevronRight, Briefcase, Wallet, Clock, Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePaywall } from '@/hooks/usePaywall';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, isAfter, differenceInDays } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import RunIntelligenceButton from '@/components/RunIntelligenceButton';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { SUBSCRIPTION_PLANS, formatCurrency } from '@/lib/constants';

const PIE_COLORS = ['#10b981', '#f97316', '#0284c7', '#8b5cf6'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function UsageRow({ label, used, max, suffix = "" }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{used}{suffix} / {max}{suffix}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct > 80 ? "bg-orange-500" : "bg-emerald-600"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function RealEstateDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = new Date();

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [leases, setLeases] = useState([]);
  const [offers, setOffers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('6M');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [propRes, clientRes, viewRes, txnRes, leaseRes, offerRes, staffRes, compRes] = await Promise.all([
          powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM staff_records WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM companies WHERE id = ? LIMIT 1', [companyId]),
        ]);
        if (active) {
          setProperties(propRes.rows._array || Array.from(propRes.rows));
          setClients(clientRes.rows._array || Array.from(clientRes.rows));
          setViewings(viewRes.rows._array || Array.from(viewRes.rows));
          setTransactions(txnRes.rows._array || Array.from(txnRes.rows));
          setLeases(leaseRes.rows._array || Array.from(leaseRes.rows));
          setOffers(offerRes.rows._array || Array.from(offerRes.rows));
          setStaff(staffRes.rows._array || Array.from(staffRes.rows));
          if (compRes.rows?._array?.length > 0) {
            setCompany(compRes.rows._array[0]);
          }
        }
      } catch (e) {
        console.error('[RE Dashboard] Data fetch failed:', e);
      }
      setIsLoading(false);
    };
    if (companyId) fetchData();
    return () => { active = false; };
  }, [companyId]);

  const activeProperties = properties.filter(p => p.status === 'active' || p.status === 'listed').length;
  const activeBuyers = clients.filter(c => c.type === 'buyer' || c.status === 'active').length;
  const activeLeases = leases.filter(l => l.status === 'active').length;
  const pendingOffers = offers.filter(o => o.status === 'pending').length;

  const totalVolume = transactions.filter(t => t.status === 'closed' || t.status === 'completed' || t.status === 'paid').reduce((s, t) => s + (Number(t.sale_price || t.price || t.amount) || 0), 0);
  const currency = company?.currency || "USD";
  const planKey = company?.subscription_plan === 'free' ? 'free_trial' : company?.subscription_plan;
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free_trial;

  const upcomingViewings = viewings
    .filter(v => (v.viewing_date || v.date) && isAfter(new Date(v.viewing_date || v.date), new Date()))
    .sort((a, b) => new Date(a.viewing_date || a.date) - new Date(b.viewing_date || b.date))
    .slice(0, 5);

  const statusData = [
    { name: 'Active Listed', value: properties.filter(p => p.status === 'active' || p.status === 'listed').length || (properties.length > 0 ? 0 : 1) },
    { name: 'Under Contract', value: properties.filter(p => p.status === 'pending' || p.status === 'under_contract').length || 0 },
    { name: 'Sold / Closed', value: properties.filter(p => p.status === 'sold' || p.status === 'closed').length || 0 },
  ];

  const revenueChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(); const y = d.getFullYear();
    const rev = transactions
      .filter(t => {
        const td = new Date(t.closing_date || t.created_at);
        return td.getMonth() === m && td.getFullYear() === y;
      })
      .reduce((s, t) => s + (Number(t.sale_price || t.price || t.amount) || 0), 0);
    return { name: MONTHS[m], Revenue: rev };
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: t('dashboard_refreshed', "Dashboard refreshed") });
    }, 500);
  };

  const kpis = [
    { label: 'Active Listings', value: activeProperties, sub: `${properties.length} total properties`, icon: Building2, alt: false, trend: '+5%' },
    { label: 'Active Clients', value: activeBuyers, sub: `${clients.length} total clients`, icon: Users, alt: true, trend: '+9%' },
    { label: 'Upcoming Viewings', value: upcomingViewings.length, sub: 'scheduled ahead', icon: Calendar, alt: false, trend: '+12%' },
    { label: 'Closed Volume', value: formatCurrency(totalVolume, currency), sub: 'closed transactions', icon: DollarSign, alt: true, trend: '+18%' },
    { label: 'Active Leases', value: activeLeases, sub: `${pendingOffers} pending offers`, icon: Home, alt: false, trend: '+7%' },
  ];

  const quickNav = [
    { label: 'Properties', href: '/real-estate/properties', icon: Building2, alt: false },
    { label: 'Clients', href: '/real-estate/clients', icon: Users, alt: true },
    { label: 'Viewings', href: '/real-estate/viewings', icon: Calendar, alt: false },
    { label: 'Offers', href: '/real-estate/offers', icon: FileText, alt: true },
    { label: 'Transactions', href: '/real-estate/transactions', icon: DollarSign, alt: false },
    { label: 'Analytics', href: '/real-estate/analytics', icon: BarChart3, alt: true },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10b981] via-[#0d9488] to-[#0284c7] p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('real_estate_dashboard', "Real Estate Command")}</h1>
                <p className="text-emerald-100 text-sm">Welcome back, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin'} 👋</p>
              </div>
            </div>
            <p className="text-emerald-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <RunIntelligenceButton vertical="real_estate" />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2">
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Intelligence Dashboard ── */}
      <IntelligenceDashboard vertical="real_estate" compact={true} maxItems={3} />

      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.alt ? 'text-orange-700 bg-orange-50' : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                  <ArrowUpRight className="w-3 h-3 inline mr-0.5" />{kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Revenue & Sales Volume ({currency})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly closed transaction volume</p>
            </div>
            <div className="flex gap-1">
              {['3M', '6M', '1Y'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === p ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#reRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground">Property Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Current portfolio breakdown</p>
          </div>
          {properties.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground truncate max-w-[120px]">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No property records yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Viewings + Team & Agents + Plan Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Viewings */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Upcoming Viewings</h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">{upcomingViewings.length} scheduled</span>
          </div>
          {upcomingViewings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming viewings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingViewings.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col items-center justify-center text-white shrink-0">
                    <span className="text-[9px] font-bold uppercase leading-none">{v.viewing_date ? format(new Date(v.viewing_date), "MMM") : '—'}</span>
                    <span className="text-sm font-bold leading-none">{v.viewing_date ? format(new Date(v.viewing_date), "d") : '—'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{v.property_address || v.title || 'Property Viewing'}</p>
                    <p className="text-xs text-muted-foreground">{v.client_name || 'Client'} · {v.viewing_date ? `${differenceInDays(new Date(v.viewing_date), new Date())}d away` : 'Scheduled'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team & Agents */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h3 className="text-base font-semibold text-foreground mb-5">Team & Agents</h3>
          {staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No staff/agent records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.slice(0, 5).map((agent, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${idx % 2 === 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
                    {(agent.name || agent.full_name || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{agent.name || agent.full_name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role || agent.position || 'Agent / Broker'}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Status */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">{t("plan_status", "Plan Status")}</h3>
            <span className="text-xs font-medium text-muted-foreground capitalize">{plan.name}</span>
          </div>
          <div className="space-y-4 mb-5">
            <UsageRow label="Agents & Staff" used={staff.length} max={plan.maxUsers || 10} />
            <UsageRow label="Properties" used={properties.length} max={plan.maxCases || 50} />
            <UsageRow label="Clients" used={clients.length} max={plan.maxClients || 100} />
            <UsageRow label="Storage" used={0} max={plan.maxStorageGB || 10} suffix=" GB" />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Workspace Plan</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(plan.price || 0, currency)}/mo</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Navigation ── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickNav.map((item, i) => (
            <Link key={i} to={item.href}>
              <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm ${item.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
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
