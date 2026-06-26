import React, { useState } from 'react';
import { Building2, Users, Briefcase, ChevronRight, BarChart3, Download, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function CorporateDashboard() {
  const companyId = useCompanyId();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: learners = [] } = useQuery({
    queryKey: ["cases", companyId, "online_learner"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_learner' }),
    enabled: !!companyId
  });

  const chartData = [
    { department: 'Engineering', completed: 45, inProgress: 12 },
    { department: 'Sales', completed: 30, inProgress: 25 },
    { department: 'Marketing', completed: 20, inProgress: 10 },
    { department: 'HR', completed: 15, inProgress: 5 },
  ];

  const kpis = [
    {
      label: 'Active Licenses',
      value: '150',
      sub: '50 unused licenses available',
      icon: Briefcase,
      from: 'from-blue-500',
      to: 'to-indigo-600',
      badge: 'Allocated',
      badgeClass: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Enrolled Employees',
      value: learners.length || 0,
      sub: 'Across 4 departments',
      icon: Users,
      from: 'from-indigo-500',
      to: 'to-violet-600',
      badge: 'Active',
      badgeClass: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Avg Completion',
      value: '78%',
      sub: null,
      progress: 78,
      icon: BarChart3,
      from: 'from-violet-500',
      to: 'to-purple-600',
      badge: 'On Track',
      badgeClass: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Corporate Portal</h1>
                <p className="text-white/70 text-sm">Enterprise Training Management</p>
              </div>
            </div>
            <p className="text-white/60 text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button className="bg-white text-indigo-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-white/90 transition flex items-center gap-2 shadow-md">
            <Users className="w-4 h-4" /> Invite Employees
          </button>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -right-16 w-48 h-48 bg-white/5 rounded-full" />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.from} ${kpi.to} flex items-center justify-center shadow-md`}>
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.badgeClass}`}>
                {kpi.badge}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{kpi.value}</p>
            <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
            {kpi.progress != null ? (
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-violet-500 to-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${kpi.progress}%` }}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70 mt-1">{kpi.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Tab Panel ── */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-border/50 bg-muted/30 flex px-4">
          {['overview', 'employees'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium text-sm capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'overview' ? 'Overview' : 'Employee Directory'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Department Training Progress</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Completed vs. in-progress by department</p>
                </div>
                <button className="text-sm font-medium text-indigo-600 flex items-center gap-1.5 hover:underline">
                  <Download className="w-4 h-4" /> Export Report
                </button>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="department" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-surface-0)', borderColor: '#e2e8f0', borderRadius: '12px' }}
                      cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                    />
                    <Bar dataKey="completed" stackId="a" fill="#4f46e5" radius={[0, 0, 4, 4]} name="Completed" />
                    <Bar dataKey="inProgress" stackId="a" fill="#a5b4fc" radius={[4, 4, 0, 0]} name="In Progress" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Employee</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Department</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Active Courses</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Progress</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {learners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center">
                        <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                        <p className="font-medium text-muted-foreground">No employees found</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">Invite your team to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    learners.map((learner, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(learner.title || 'U')[0]}
                            </div>
                            <span className="font-medium text-foreground">{learner.title || 'Unnamed Learner'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">Engineering</td>
                        <td className="px-4 py-4">2</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full w-[60%] rounded-full" />
                            </div>
                            <span className="text-xs font-semibold text-indigo-600">60%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="text-sm font-semibold text-indigo-600 flex items-center justify-end gap-1.5 hover:underline w-full opacity-0 group-hover:opacity-100 transition-opacity">
                            View Report <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
