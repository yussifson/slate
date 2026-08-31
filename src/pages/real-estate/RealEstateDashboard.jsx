import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Users, TrendingUp, Home, Calendar, DollarSign,
  AlertCircle, BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight,
  Eye, FileText, Wrench, MapPin, Sparkles, ChevronRight, Briefcase, Wallet
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
import { generateText } from '@/lib/cloudflareAI';
import { format } from 'date-fns';

const PIE_COLORS = ['#10b981', '#f59e0b', '#64748b'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ icon: IconComp, label, value, sub, color = "bg-slate-50 dark:bg-secondary/50 text-primary", trend, trendUp = true }) {
  return (
    <div className="bg-card rounded-3xl border-0 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color} shadow-sm group-hover:scale-110 transition-transform`}>
          <IconComp className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${trendUp ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300'}`}>
            {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl sm:text-4xl font-black text-foreground tracking-[-0.03em] mb-1">{value}</p>
        <p className="text-sm font-semibold text-muted-foreground tracking-tight">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function RealEstateDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const { isProOrAbove } = usePaywall();
  const today = new Date();

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

  const activeProperties = properties.filter(p => p.status === 'active' || p.status === 'listed').length;
  const activeBuyers = clients.filter(c => c.type === 'buyer' || c.status === 'active').length;
  const activeLeases = leases.filter(l => l.status === 'active').length;
  const pendingOffers = offers.filter(o => o.status === 'pending').length;

  const now = new Date();
  const thisMonthTransactions = transactions.filter(t => {
    const d = new Date(t.closing_date || t.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyRevenue = thisMonthTransactions.reduce((s, t) => s + (Number(t.sale_price || t.price) || 0), 0);
  const totalVolume = transactions.filter(t => t.status === 'closed' || t.status === 'completed').reduce((s, t) => s + (Number(t.sale_price || t.price) || 0), 0);

  const thisMonthViewings = viewings.filter(v => {
    const d = new Date(v.viewing_date || v.date);
    return d && d >= today;
  }).length;

  const statusData = [
    { name: 'Active', value: properties.filter(p => p.status === 'active' || p.status === 'listed').length || 1 },
    { name: 'Pending', value: properties.filter(p => p.status === 'pending' || p.status === 'under_contract').length || 0 },
    { name: 'Sold', value: properties.filter(p => p.status === 'sold' || p.status === 'closed').length || 0 },
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
      .reduce((s, t) => s + (Number(t.sale_price || t.price) || 0), 0);
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

  const quickNav = [
    { label: 'Properties', href: '/real-estate/properties', icon: Building2, count: properties.length, color: 'bg-emerald-500' },
    { label: 'Clients', href: '/real-estate/clients', icon: Users, count: clients.length, color: 'bg-blue-500' },
    { label: 'Viewings', href: '/real-estate/viewings', icon: Calendar, count: viewings.length, color: 'bg-amber-500' },
    { label: 'Offers', href: '/real-estate/offers', icon: FileText, count: offers.length, color: 'bg-purple-500' },
    { label: 'Transactions', href: '/real-estate/transactions', icon: DollarSign, count: transactions.length, color: 'bg-teal-500' },
    { label: 'Leases', href: '/real-estate/leases', icon: Home, count: leases.length, color: 'bg-indigo-500' },
    { label: 'Trust Acct.', href: '/real-estate/trust-accounting', icon: Wallet, count: 0, color: 'bg-rose-500' },
    { label: 'Analytics', href: '/real-estate/analytics', icon: BarChart3, count: 0, color: 'bg-sky-500' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6 animate-pulse">
        <div className="h-48 bg-muted rounded-3xl" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 school-page-enter font-dmsans max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 sm:p-10 text-white shadow-2xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-teal-900 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Building2 className="w-6 h-6 text-emerald-100" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Real Estate Command</h1>
            </div>
            <p className="text-emerald-100 text-lg font-medium tracking-wide">Welcome back, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Broker'} 👋</p>
            <div className="mt-6 flex items-center gap-4 text-sm font-medium text-emerald-100/80">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-70" />
                {format(today, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-inner">
              <div className="text-right">
                <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider mb-1">Market Status</p>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  Active & Synced
                </div>
              </div>
            </div>

            <Button
              onClick={handleAIInsight}
              disabled={isGenerating || !isProOrAbove}
              className="bg-white text-teal-800 hover:bg-emerald-50 border-0 shadow-lg font-bold gap-2 rounded-2xl h-14 px-6 text-sm"
            >
              <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
              {isGenerating ? 'Analyzing...' : 'AI Market Insight'}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Market Insight Output */}
      {aiInsight && (
        <div className="bg-card rounded-3xl border border-emerald-500/30 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">Orbit AI Market Recommendation</p>
              <p className="text-sm font-medium text-foreground leading-relaxed">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Building2} label="Active Listings" value={activeProperties} sub={`${properties.length} total properties`} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" trend="+5%" trendUp={true} />
        <StatCard icon={Calendar} label="Upcoming Viewings" value={thisMonthViewings} sub="scheduled this month" color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" trend="+12%" trendUp={true} />
        <StatCard icon={Users} label="Active Clients" value={activeBuyers} sub={`${clients.length} registered clients`} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" trend="+8%" trendUp={true} />
        <StatCard icon={DollarSign} label="Closed Volume" value={`$${(totalVolume / 1000000).toFixed(1)}M`} sub="total closed deals" color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" trend="+22%" trendUp={true} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-card rounded-3xl border-0 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Revenue & Sales Trend</h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Monthly closed transaction volume</p>
            </div>
            <div className="flex gap-1.5 bg-muted/60 p-1 rounded-xl">
              {['3M','6M','1Y'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartPeriod === p ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
              <Tooltip formatter={v => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#reRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Property Status Distribution */}
        <div className="bg-card rounded-3xl border-0 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-bold tracking-tight text-foreground">Property Status</h3>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Current portfolio breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
            {statusData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="text-foreground font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Split Cards: Viewings & Pending Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Viewings */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[460px]">
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Upcoming Viewings</h3>
            </div>
            <Link to="/real-estate/viewings" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1 p-2">
            {viewings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                <Calendar className="w-10 h-10 opacity-30 mb-2" />
                <p className="text-sm font-medium">No viewings scheduled</p>
              </div>
            ) : viewings.slice(0, 6).map(v => (
              <div key={v.id} className="p-4 rounded-2xl hover:bg-muted/40 transition-colors flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 font-bold">
                  <span className="text-[10px] uppercase leading-none">{v.viewing_date ? format(new Date(v.viewing_date), 'MMM') : '—'}</span>
                  <span className="text-base leading-none mt-0.5">{v.viewing_date ? format(new Date(v.viewing_date), 'd') : '—'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{v.property_address || 'Property Viewing'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.client_name || 'Client'} · {v.viewing_time || 'Scheduled'}</p>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-0">
                  {v.status || 'scheduled'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Deals & Recent Transactions */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[460px]">
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Recent Sales & Deals</h3>
            </div>
            <Link to="/real-estate/transactions" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1 p-2">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                <DollarSign className="w-10 h-10 opacity-30 mb-2" />
                <p className="text-sm font-medium">No transactions recorded</p>
              </div>
            ) : transactions.slice(0, 6).map(txn => (
              <div key={txn.id} className="p-4 rounded-2xl hover:bg-muted/40 transition-colors flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  {(txn.buyer_name || 'D')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{txn.property_address || 'Property Deal'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Buyer: {txn.buyer_name || 'Client'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">${Number(txn.sale_price || txn.price || 0).toLocaleString()}</p>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-0 mt-0.5">
                    {txn.status || 'pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Toolbar */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Real Estate Operations Modules</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {quickNav.map((item, i) => (
            <Link key={i} to={item.href}>
              <div className="bg-card rounded-3xl border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all text-center cursor-pointer group">
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-3 text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                {item.count > 0 && <p className="text-sm font-extrabold text-muted-foreground mt-0.5">{item.count}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
