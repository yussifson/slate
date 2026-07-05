import { useState, useEffect } from 'react';
import {
  BarChart3, Pill, Users, TrendingUp, AlertCircle, DollarSign,
  Package, Clock, ArrowUpRight, ArrowDownRight, ChevronRight,
  ShoppingCart, Activity, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Button } from '@/components/ui/button';
import PharmacyAPI from '@/api/PharmacyAPI';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#16a34a', '#f97316', '#22c55e', '#fb923c'];

export default function Dashboard() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [analytics, setAnalytics] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState({ total: 0, lowStock: 0, expiring: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('7D');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayResult = await powerSync.execute(
          'SELECT COUNT(*) as total_transactions, SUM(grand_total) as total_sales FROM univ_pharmacy_sales WHERE company_id = ? AND DATE(sale_date) = DATE(?)',
          [companyId, todayStr]
        );
        const todayData = todayResult.rows._array?.[0] || { total_transactions: 0, total_sales: 0 };
        setAnalytics(todayData);

        const inventoryResult = await powerSync.execute(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN quantity_available <= reorder_level THEN 1 END) as low_stock FROM univ_pharmacy_inventory WHERE company_id = ?',
          [companyId]
        );
        const invData = inventoryResult.rows._array?.[0] || {};
        setInventoryStatus({ total: invData.total || 0, lowStock: invData.low_stock || 0, expiring: 0 });

        const salesResult = await powerSync.execute(
          'SELECT DATE(sale_date) as date, SUM(grand_total) as total FROM univ_pharmacy_sales WHERE company_id = ? GROUP BY DATE(sale_date) ORDER BY date DESC LIMIT 7',
          [companyId]
        );
        setSalesData((salesResult.rows._array || []).reverse().map(d => ({
          name: d.date ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }) : d.date,
          sales: parseFloat(d.total || 0)
        })));

        const productsResult = await powerSync.execute(
          'SELECT d.drug_name, COUNT(si.id) as sales_count FROM univ_pharmacy_sale_items si JOIN univ_pharmacy_drugs d ON si.drug_id = d.id WHERE si.company_id = ? GROUP BY d.id ORDER BY sales_count DESC LIMIT 5',
          [companyId]
        );
        setTopProducts(productsResult.rows._array || []);
      } catch (e) {
        console.error('[Dashboard] Error:', e);
      } finally {
        setLoading(false);
      }
    };
    if (companyId) fetchDashboardData();
  }, [companyId, powerSync]);

  const pieData = [
    { name: 'Healthy', value: Math.max(inventoryStatus.total - inventoryStatus.lowStock, 0) },
    { name: 'Low Stock', value: inventoryStatus.lowStock },
    { name: 'Expiring', value: inventoryStatus.expiring },
  ].filter(d => d.value > 0);

  const kpis = [
    { label: "Today's Sales", value: `$${parseFloat(analytics?.total_sales || 0).toFixed(2)}`, sub: 'vs yesterday', icon: DollarSign, from: 'from-green-500', to: 'to-emerald-600', trend: '+12%', up: true },
    { label: 'Transactions', value: analytics?.total_transactions || 0, sub: 'completed sales', icon: ShoppingCart, from: 'from-orange-500', to: 'to-orange-600', trend: '+8%', up: true },
    { label: 'Inventory Items', value: inventoryStatus.total, sub: 'total SKUs tracked', icon: Package, from: 'from-green-500', to: 'to-green-600', trend: '', up: true },
    { label: 'Low Stock Alerts', value: inventoryStatus.lowStock, sub: 'need reordering', icon: AlertCircle, from: 'from-orange-500', to: 'to-orange-600', trend: '-5%', up: false },
  ];

  const quickNav = [
    { label: 'Drugs', href: '/pharmacy/drugs', icon: Pill, from: 'from-green-500', to: 'to-emerald-600' },
    { label: 'Inventory', href: '/pharmacy/inventory', icon: Package, from: 'from-orange-500', to: 'to-orange-600' },
    { label: 'Customers', href: '/pharmacy/customers', icon: Users, from: 'from-green-500', to: 'to-green-600' },
    { label: 'POS', href: '/pharmacy/pos', icon: ShoppingCart, from: 'from-orange-500', to: 'to-orange-600' },
    { label: 'Prescriptions', href: '/pharmacy/prescriptions', icon: Activity, from: 'from-green-500', to: 'to-emerald-600' },
    { label: 'Reports', href: '/pharmacy/reports', icon: BarChart3, from: 'from-orange-500', to: 'to-orange-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-44 bg-muted rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}</div>
        <div className="grid grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="h-64 bg-muted rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-orange-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-6 right-32 w-20 h-20 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Pharmacy Dashboard</h1>
                <p className="text-green-100 text-sm">Welcome back, {user?.email?.split('@')[0]} 👋</p>
              </div>
            </div>
            <p className="text-green-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white/60 text-xs">Today's Revenue</p>
              <p className="text-2xl font-bold">${parseFloat(analytics?.total_sales || 0).toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.from} ${kpi.to} flex items-center justify-center shadow-md`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${kpi.up ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Sales Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Daily revenue overview</p>
            </div>
            <div className="flex gap-1">
              {['7D','30D'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === p ? 'bg-green-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pharmaSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, 'Sales']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Status Pie */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Inventory Health</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Stock status breakdown</p>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No inventory data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Products + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Top Products</h3>
            <Link to="/pharmacy/drugs"><button className="text-xs text-green-600 hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button></Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Pill className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'
                  }`}>#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.drug_name}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-1">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((p.sales_count / Math.max(topProducts[0]?.sales_count || 1, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600 shrink-0">{p.sales_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Nav */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h3 className="text-base font-semibold text-foreground mb-5">Quick Access</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickNav.map((item, i) => (
              <Link key={i} to={item.href}>
                <div className="rounded-xl border border-border/50 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-sm`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
