import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Users, TrendingUp, Home, Calendar, DollarSign,
  AlertCircle, BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight,
  Eye, FileText, Wrench, MapPin, Sparkles, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePaywall } from '@/hooks/usePaywall';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { generateText } from '@/lib/cloudflareAI';
import { OrbitLoader } from '@/components/ui/orbit-loader';

const PIE_COLORS = ['#16a34a', '#f97316', '#6b7280'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function RealEstateDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const { isProOrAbove } = usePaywall();

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [leases, setLeases] = useState([]);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [chartPeriod, setChartPeriod] = useState('6M');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [propRes, clientRes, viewRes, txnRes, leaseRes, offerRes] = await Promise.all([
          powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        ]);
        if (active) {
          setProperties(propRes.rows._array || Array.from(propRes.rows));
          setClients(clientRes.rows._array || Array.from(clientRes.rows));
          setViewings(viewRes.rows._array || Array.from(viewRes.rows));
          setTransactions(txnRes.rows._array || Array.from(txnRes.rows));
          setLeases(leaseRes.rows._array || Array.from(leaseRes.rows));
          setOffers(offerRes.rows._array || Array.from(offerRes.rows));
        }
      } catch (e) {
        console.error('[RE Dashboard] Data fetch failed:', e);
      }
      setIsLoading(false);
    };
    if (companyId) fetchData();
    return () => { active = false; };
  }, [companyId]);

  const activeProperties = properties.filter(p => p.status === 'active').length;
  const activeBuyers = clients.filter(c => c.type === 'buyer' && c.status === 'active').length;
  const activeLeases = leases.filter(l => l.status === 'active').length;
  const pendingOffers = offers.filter(o => o.status === 'pending').length;

  const now = new Date();
  const thisMonthTransactions = transactions.filter(t => {
    const d = new Date(t.closing_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyRevenue = thisMonthTransactions.reduce((s, t) => s + (Number(t.sale_price) || 0), 0);

  const thisMonthViewings = viewings.filter(v => {
    const d = new Date(v.viewing_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const statusData = [
    { name: 'Active', value: properties.filter(p => p.status === 'active').length || 1 },
    { name: 'Pending', value: properties.filter(p => p.status === 'pending').length || 0 },
    { name: 'Sold', value: properties.filter(p => p.status === 'sold').length || 0 },
  ];

  // Build last 6 months revenue chart
  const revenueChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(); const y = d.getFullYear();
    const rev = transactions
      .filter(t => { const td = new Date(t.closing_date); return td.getMonth() === m && td.getFullYear() === y; })
      .reduce((s, t) => s + (Number(t.sale_price) || 0), 0);
    return { name: MONTHS[m], revenue: rev };
  });

  const handleAIInsight = async () => {
    if (!isProOrAbove) return;
    setIsGenerating(true);
    setAiInsight('');
    try {
      const prompt = `You are a Real Estate Market Analyst. Provide a brief daily market insight based on: Active Properties: ${activeProperties}, Active Buyers: ${activeBuyers}, This Month's Sales: ${thisMonthTransactions.length}, Active Leases: ${activeLeases}. Give 2-3 actionable recommendations in plain text.`;
      const response = await generateText(prompt);
      setAiInsight(typeof response === 'string' ? response : JSON.stringify(response));
    } catch (e) {
      console.error('[AI] Insight generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const kpis = [
    { label: 'Active Properties', value: activeProperties, sub: `${properties.length} total`, icon: Building2, from: 'from-green-500', to: 'to-primary', trend: '+5%', up: true },
    { label: 'Active Buyers', value: activeBuyers, sub: `${clients.length} total clients`, icon: Users, from: 'from-orange-500', to: 'to-orange-600', trend: '+12%', up: true },
    { label: 'Viewings This Month', value: thisMonthViewings, sub: 'scheduled & completed', icon: Eye, from: 'from-green-500', to: 'to-green-600', trend: '+8%', up: true },
    { label: 'Monthly Revenue', value: `$${(monthlyRevenue / 1000).toFixed(0)}K`, sub: 'closed this month', icon: DollarSign, from: 'from-orange-500', to: 'to-orange-600', trend: '+22%', up: true },
    { label: 'Active Leases', value: activeLeases, sub: `${pendingOffers} pending offers`, icon: Home, from: 'from-green-500', to: 'to-primary', trend: '+3%', up: true },
  ];

  const quickNav = [
    { label: 'Properties', href: '/real-estate/properties', icon: Building2, count: properties.length, from: 'from-green-500', to: 'to-primary' },
    { label: 'Clients', href: '/real-estate/clients', icon: Users, count: clients.length, from: 'from-orange-500', to: 'to-orange-600' },
    { label: 'Viewings', href: '/real-estate/viewings', icon: Calendar, count: viewings.length, from: 'from-green-500', to: 'to-green-600' },
    { label: 'Offers', href: '/real-estate/offers', icon: FileText, count: offers.length, from: 'from-orange-500', to: 'to-orange-600' },
    { label: 'Transactions', href: '/real-estate/transactions', icon: DollarSign, count: transactions.length, from: 'from-green-500', to: 'to-primary' },
    { label: 'Leases', href: '/real-estate/leases', icon: Home, count: leases.length, from: 'from-orange-500', to: 'to-orange-600' },
    { label: 'Maintenance', href: '/real-estate/maintenance', icon: Wrench, count: 0, from: 'from-green-500', to: 'to-green-600' },
    { label: 'Market Data', href: '/real-estate/market-data', icon: BarChart3, count: 0, from: 'from-orange-500', to: 'to-orange-600' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-44 bg-muted rounded-2xl" />
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-72 bg-muted rounded-2xl" />
          <div className="h-72 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-emerald-900 p-10 text-white shadow-xl hover:shadow-2xl transition-shadow">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-primary/40 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Real Estate Command</h1>
                <p className="text-emerald-100 font-medium text-sm mt-0.5">Welcome back, {user?.email?.split('@')[0]} 👋</p>
              </div>
            </div>
            <p className="text-emerald-200/80 font-bold text-xs mt-2 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAIInsight}
              disabled={isGenerating || !isProOrAbove}
              className="bg-white text-primary hover:bg-emerald-50 border-0 shadow-lg font-bold gap-2 rounded-xl h-12 px-6"
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              {isGenerating ? 'Analyzing...' : 'Generate Insight'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── AI Insight ── */}
      {aiInsight && (
        <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-extrabold text-primary mb-2">Orbit AI Market Insight</p>
              <p className="text-sm font-medium text-foreground leading-relaxed">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="group p-6 border border-border/60 bg-card/40 backdrop-blur-md hover:shadow-2xl hover:border-primary/50 transition-all duration-300 rounded-[2rem] relative overflow-hidden flex flex-col hover:-translate-y-1">
            <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 group-hover:scale-110 pointer-events-none">
              <kpi.icon className="w-32 h-32 text-primary" />
            </div>
            <div className="flex items-start justify-between mb-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <kpi.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <Badge variant="outline" className={`font-bold px-2.5 py-1 uppercase tracking-wider text-[9px] border-0 ${kpi.up ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/30'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {kpi.trend}
              </Badge>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-3xl font-black text-foreground mb-1 tracking-tight">{kpi.value}</p>
              <p className="text-sm font-bold text-foreground">{kpi.label}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5 uppercase tracking-wide">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 p-6 border border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 transition-all rounded-3xl relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly closed transaction value</p>
            </div>
            <div className="flex gap-1">
              {['3M','6M','1Y'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === p ? 'bg-green-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
              <Tooltip formatter={v => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#reRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Property Status Donut */}
        <div className="p-6 border border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 transition-all rounded-3xl relative overflow-hidden flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Property Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Current listing distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activity Feed + Recent Transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="p-6 border border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 transition-all rounded-3xl relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Recent Sales</h3>
            <Link to="/real-estate/transactions">
              <button className="text-xs text-green-600 hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map(txn => (
                <div key={txn.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(txn.buyer_name || 'T')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{txn.property_address || 'Property'}</p>
                    <p className="text-xs text-muted-foreground truncate">{txn.buyer_name || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">${Number(txn.sale_price || 0).toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${txn.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                      {txn.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Viewings */}
        <div className="p-6 border border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 transition-all rounded-3xl relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Upcoming Viewings</h3>
            <Link to="/real-estate/viewings">
              <button className="text-xs text-green-600 hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
            </Link>
          </div>
          {viewings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No viewings scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewings.slice(0, 5).map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col items-center justify-center text-white shrink-0">
                    <span className="text-[9px] font-bold uppercase leading-none">
                      {v.viewing_date ? new Date(v.viewing_date).toLocaleDateString('en-US', { month: 'short' }) : '—'}
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {v.viewing_date ? new Date(v.viewing_date).getDate() : '—'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{v.property_address || 'Property viewing'}</p>
                    <p className="text-xs text-muted-foreground">{v.viewing_time || ''} · {v.client_name || 'Client'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    v.status === 'completed' ? 'bg-green-50 text-green-700' :
                    v.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                    'bg-orange-50 text-orange-700'
                  }`}>{v.status || 'scheduled'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Nav Grid ── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickNav.map((item, i) => (
            <Link key={i} to={item.href}>
              <div className="p-4 border border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-0.5 transition-all rounded-3xl text-center cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{item.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
