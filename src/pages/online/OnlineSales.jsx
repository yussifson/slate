import React, { useMemo, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Banknote, TrendingUp, CreditCard, ShoppingCart, Download, Users, BookOpen } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function buildMonthBuckets(months = 6) {
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    buckets.push({
      label: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      month: d.toISOString().slice(0, 7),
      revenue: 0,
      orders: 0,
    });
  }
  return buckets;
}

export default function OnlineSales() {
  const companyId = useCompanyId();
  const [tab, setTab] = useState('overview');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['online_orders', companyId],
    queryFn: async () => {
      try {
        const data = await powerSync.getAll(
          `SELECT * FROM online_orders WHERE company_id = ? ORDER BY created_at DESC`,
          [companyId]
        );
        return data || [];
      } catch { return []; }
    },
    enabled: !!companyId,
  });

  // ── Metrics ────────────────────────────────────────────────────────────────
  const paidOrders    = useMemo(() => orders.filter(o => o.status === 'paid'), [orders]);
  const freeOrders    = useMemo(() => orders.filter(o => o.status === 'free'), [orders]);
  const refunds       = useMemo(() => orders.filter(o => o.status === 'refunded'), [orders]);
  const totalRevenue  = useMemo(() => paidOrders.reduce((s, o) => s + parseFloat(o.amount || 0), 0), [paidOrders]);
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // ── Monthly trend ──────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const buckets = buildMonthBuckets(6);
    const byMonth = Object.fromEntries(buckets.map(b => [b.month, b]));
    orders.forEach(o => {
      const m = (o.created_at || '').slice(0, 7);
      if (byMonth[m] && (o.status === 'paid' || o.status === 'free')) {
        byMonth[m].revenue += parseFloat(o.amount || 0);
        byMonth[m].orders += 1;
      }
    });
    return buckets;
  }, [orders]);

  // ── Revenue by course ──────────────────────────────────────────────────────
  const courseRevenue = useMemo(() => {
    const map = {};
    orders.filter(o => o.status === 'paid').forEach(o => {
      const key = o.course_title || 'Unknown Course';
      map[key] = (map[key] || 0) + parseFloat(o.amount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [orders]);

  // ── Payment method breakdown ───────────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.payment_method || 'card';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Banknote, color: 'var(--color-success)' },
    { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}`, icon: ShoppingCart, color: 'var(--primary)' },
    { label: 'Paid Enrollments', value: paidOrders.length, icon: CreditCard, color: 'var(--color-info)' },
    { label: 'Free Enrollments', value: freeOrders.length, icon: Users, color: 'var(--color-warning)' },
    { label: 'Refunds', value: refunds.length, icon: TrendingUp, color: 'var(--color-error)' },
    { label: 'Total Orders', value: orders.length, icon: BookOpen, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Sales & Revenue</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Track course purchases, subscriptions, and financial metrics.</p>
        </div>
        <button
          onClick={() => {
            const csv = ['ID,Date,Course,Student,Amount,Status',
              ...orders.map(o => `${o.id},${o.created_at},${o.course_title || ''},${o.student_name || ''},${o.amount},${o.status}`)
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'sales.csv'; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-1)] border border-primary/40 text-[var(--color-text-primary)] text-sm font-medium rounded-xl hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mt-1 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar */}
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Monthly Revenue</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Last 6 months</p>
          </div>
          {monthlyData.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [`$${parseFloat(v).toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-xl text-[var(--color-text-tertiary)]">
              <Banknote className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No revenue data yet</p>
            </div>
          )}
        </div>

        {/* Cumulative Area */}
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Cumulative Growth</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Running total of orders</p>
          </div>
          {monthlyData.some(d => d.orders > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [v, 'Orders']} />
                <Area type="monotone" dataKey="orders" stroke="#8b5cf6" fill="url(#ordersGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-xl text-[var(--color-text-tertiary)]">
              <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue by Course + Payment Breakdown */}
      {(courseRevenue.length > 0 || paymentBreakdown.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courseRevenue.length > 0 && (
            <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl p-6">
              <div className="mb-5">
                <h2 className="font-semibold text-[var(--color-text-primary)]">Revenue by Course</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Top earning courses</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={courseRevenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={v => [`$${parseFloat(v).toFixed(2)}`, 'Revenue']} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {courseRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {paymentBreakdown.length > 0 && (
            <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl p-6">
              <div className="mb-5">
                <h2 className="font-semibold text-[var(--color-text-primary)]">Payment Methods</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Breakdown by type</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-[var(--color-surface-1)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text-primary)]">All Orders</h2>
          <span className="text-sm text-[var(--color-text-secondary)]">{orders.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-1)] border-b border-primary/40 text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-[var(--color-text-tertiary)]">
                    <Banknote className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-[var(--color-text-secondary)]">No orders recorded</p>
                    <p className="text-xs mt-1">Orders appear here when learners enrol in courses.</p>
                  </td>
                </tr>
              ) : orders.slice(0, 20).map((order, idx) => (
                <tr key={order.id || idx} className="hover:bg-[var(--color-surface-1)] transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-text-secondary)]">
                    #{(order.reference || order.id || '').slice(0, 10)}
                  </td>
                  <td className="px-5 py-3.5 font-medium">{order.student_name || '—'}</td>
                  <td className="px-5 py-3.5 text-[var(--color-text-secondary)] truncate max-w-[180px]">{order.course_title || '—'}</td>
                  <td className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className={`px-5 py-3.5 font-semibold ${order.status === 'paid' ? 'text-[var(--color-success)]' : ''}`}>
                    {order.currency || '$'}{parseFloat(order.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      order.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      order.status === 'free' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      order.status === 'refunded' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-primary/20'
                    }`}>
                      {order.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
