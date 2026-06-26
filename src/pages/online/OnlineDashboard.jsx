import React, { useMemo, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Users, BookOpen, Banknote, TrendingUp, Award, ArrowUpRight, GraduationCap, Star, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Generate last-N-days labels for the chart
function buildDayBuckets(days) {
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.push({
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      date: d.toISOString().slice(0, 10),
      revenue: 0,
      enrollments: 0,
    });
  }
  return buckets;
}

export default function OnlineDashboard() {
  const companyId = useCompanyId();
  const [period, setPeriod] = useState('30D');

  // ── KPI Data ──────────────────────────────────────────────────────────────
  const { data: courses = [] } = useQuery({
    queryKey: ['online_courses', companyId],
    queryFn: async () => {
      const data = await powerSync.getAll(
        'SELECT * FROM online_courses WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['online_enrollments_all', companyId],
    queryFn: async () => {
      const data = await powerSync.getAll(
        'SELECT * FROM online_enrollments WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['online_orders', companyId],
    queryFn: async () => {
      try {
        const data = await powerSync.getAll(
          "SELECT * FROM online_orders WHERE company_id = ? AND status IN ('paid','free') ORDER BY created_at DESC",
          [companyId]
        );
        return data || [];
      } catch { return []; }
    },
    enabled: !!companyId,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['online_certificates', companyId],
    queryFn: async () => {
      try {
        const data = await powerSync.getAll(
          "SELECT id FROM online_certificates WHERE company_id = ?",
          [companyId]
        );
        return data || [];
      } catch { return []; }
    },
    enabled: !!companyId,
  });

  // ── Derived metrics ────────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => orders.reduce((s, o) => s + parseFloat(o.amount || 0), 0),
    [orders]
  );

  const uniqueLearners = useMemo(
    () => new Set(enrollments.map(e => e.student_id).filter(Boolean)).size,
    [enrollments]
  );

  const avgProgress = useMemo(() => {
    if (!enrollments.length) return 0;
    const sum = enrollments.reduce((s, e) => s + parseFloat(e.progress_percent || 0), 0);
    return (sum / enrollments.length).toFixed(1);
  }, [enrollments]);

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const days = period === '7D' ? 7 : period === '30D' ? 30 : 90;
  const chartData = useMemo(() => {
    const buckets = buildDayBuckets(days);
    const byDate = Object.fromEntries(buckets.map(b => [b.date, b]));

    orders.forEach(o => {
      const d = (o.created_at || '').slice(0, 10);
      if (byDate[d]) byDate[d].revenue += parseFloat(o.amount || 0);
    });
    enrollments.forEach(e => {
      const d = (e.created_at || '').slice(0, 10);
      if (byDate[d]) byDate[d].enrollments += 1;
    });

    return buckets;
  }, [orders, enrollments, days]);

  // ── Top Courses ────────────────────────────────────────────────────────────
  const topCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => (b.total_students || 0) - (a.total_students || 0))
      .slice(0, 5);
  }, [courses]);

  const kpis = [
    {
      label: 'Total Learners',
      value: uniqueLearners,
      icon: Users,
      color: 'violet',
      bg: 'bg-violet-500',
      sub: 'Unique enrolled students',
    },
    {
      label: 'Active Courses',
      value: courses.filter(c => c.status === 'Published').length,
      icon: BookOpen,
      color: 'blue',
      bg: 'bg-blue-500',
      sub: `${courses.length} total courses`,
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Banknote,
      color: 'emerald',
      bg: 'bg-emerald-500',
      sub: `${orders.length} orders`,
    },
    {
      label: 'Avg. Progress',
      value: `${avgProgress}%`,
      icon: TrendingUp,
      color: 'amber',
      bg: 'bg-amber-500',
      sub: 'Across all enrollments',
    },
    {
      label: 'Certificates Issued',
      value: certificates.length,
      icon: Award,
      color: 'rose',
      bg: 'bg-rose-500',
      sub: 'Completions',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">
            Learning Dashboard
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">
            Real-time overview of your online learning platform.
          </p>
        </div>
        <div className="flex gap-1 bg-[var(--color-surface-1)] border border-primary/40 rounded-xl p-1">
          {['7D', '30D', '90D'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                period === p
                  ? 'bg-[var(--primary)] text-white shadow'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl p-5 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 ${kpi.bg}/15 rounded-xl flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-5 h-5 text-${kpi.color}-500`} />
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
              {kpi.value}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">Revenue Over Time</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">Daily sales revenue</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-500">
              <ArrowUpRight className="w-4 h-4" /> Live
            </span>
          </div>
          {chartData.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.floor(days / 6)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [`$${parseFloat(v).toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#revenueGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-[var(--color-text-tertiary)]">
              <Banknote className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No revenue data yet for this period.</p>
            </div>
          )}
        </div>

        {/* Enrollments Chart */}
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">New Enrollments</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">Daily sign-ups</p>
            </div>
          </div>
          {chartData.some(d => d.enrollments > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.floor(days / 6)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [v, 'Enrollments']} />
                <Area type="monotone" dataKey="enrollments" stroke="#8b5cf6" fill="url(#enrollGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-[var(--color-text-tertiary)]">
              <GraduationCap className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No enrollments recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Courses + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-primary/40 bg-[var(--color-surface-1)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Top Performing Courses</h2>
          </div>
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {topCourses.length === 0 ? (
              <div className="px-6 py-10 text-center text-[var(--color-text-tertiary)]">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No courses yet. Create your first course!</p>
              </div>
            ) : topCourses.map((course, i) => (
              <div key={course.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-surface-1)] transition-colors">
                <span className="text-lg font-bold text-[var(--color-text-tertiary)] w-6 text-center">{i + 1}</span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(course.title || 'C').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{course.title}</p>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-0.5">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.total_students || 0}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_hours || 0}h</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{course.rating || '—'}</span>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  course.status === 'Published'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                }`}>
                  {course.status || 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-primary/40 bg-[var(--color-surface-1)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Recent Orders</h2>
          </div>
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {orders.length === 0 ? (
              <div className="px-6 py-10 text-center text-[var(--color-text-tertiary)]">
                <Banknote className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No orders yet.</p>
              </div>
            ) : orders.slice(0, 6).map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-surface-1)] transition-colors">
                <div>
                  <p className="font-semibold text-sm text-[var(--color-text-primary)]">{order.student_name || 'Unknown'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-[200px]">{order.course_title || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-[var(--color-text-primary)]">
                    {order.currency || '$'}{parseFloat(order.amount || 0).toFixed(2)}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    order.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                    order.status === 'free' ? 'bg-blue-50 text-blue-600' :
                    'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
