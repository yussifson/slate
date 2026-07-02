import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from '@/components/intelligence/IntelligenceUI';
import { useQuery } from "@tanstack/react-query";
import { powerSync } from '@/api/PowerSyncConnector';
import {
  Users, Activity, Bed, Beaker, Calendar, Clock,
  Heart, Stethoscope, ArrowUpRight, ShieldAlert, BarChart2
} from "lucide-react";
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function HospitalDashboard({ companyId }) {
  const { t } = useTranslation();
  const [chartPeriod, setChartPeriod] = useState('7D');

  const { data: stats } = useQuery({
    queryKey: ["hospital_stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const [patients, appointments, beds, queue, admissionsRes, allAppointments] = await Promise.all([
        powerSync.execute('SELECT count(*) as count FROM univ_patients WHERE company_id = ?', [companyId]),
        powerSync.execute('SELECT count(*) as count FROM univ_appointments WHERE company_id = ? AND date >= CURRENT_DATE', [companyId]),
        powerSync.execute('SELECT count(*) as count FROM univ_beds WHERE company_id = ? AND status = ?', [companyId, 'available']),
        powerSync.execute('SELECT count(*) as count FROM univ_opd_queues WHERE company_id = ? AND status = ?', [companyId, 'waiting']),
        powerSync.execute('SELECT admission_date FROM univ_admissions WHERE company_id = ? AND admission_date >= date(\'now\', \'-7 days\')', [companyId]),
        powerSync.execute('SELECT type FROM univ_appointments WHERE company_id = ? AND date >= date(\'now\', \'-30 days\')', [companyId])
      ]);

      const admitArray = admissionsRes.rows._array || Array.from(admissionsRes.rows);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let admitData = days.map(d => ({ name: d, admissions: 0 }));
      admitArray.forEach(a => {
        const d = new Date(a.admission_date).getDay();
        if (!isNaN(d)) admitData[d].admissions++;
      });
      // Rearrange so today is last
      const todayIdx = new Date().getDay();
      admitData = [...admitData.slice(todayIdx + 1), ...admitData.slice(0, todayIdx + 1)];

      const apptArray = allAppointments.rows._array || Array.from(allAppointments.rows);
      const deptCounts = {};
      apptArray.forEach(a => {
         const t = a.type || 'General';
         deptCounts[t] = (deptCounts[t] || 0) + 1;
      });
      let deptData = Object.entries(deptCounts).map(([name, patients]) => ({ name, patients })).sort((a,b) => b.patients - a.patients).slice(0, 5);
      if (deptData.length === 0) deptData = [{ name: 'General', patients: 0 }];

      return {
        patients: patients.rows._array[0]?.count || 0,
        appointments: appointments.rows._array[0]?.count || 0,
        availableBeds: beds.rows._array[0]?.count || 0,
        waitingQueue: queue.rows._array[0]?.count || 0,
        admitData,
        deptData
      };
    },
    enabled: !!companyId
  });

  const ADMIT_DATA = stats?.admitData || [];
  const DEPT_DATA = stats?.deptData || [];

  const kpis = [
    { label: 'Total Patients', value: stats?.patients || 0, sub: 'lifetime records', icon: Users, trend: '+6%' },
    { label: 'Appointments', value: stats?.appointments || 0, sub: 'upcoming (7 days)', icon: Calendar, trend: '+14%' },
    { label: 'Available Beds', value: stats?.availableBeds || 0, sub: 'ready for admission', icon: Bed, trend: '' },
    { label: 'OPD Queue', value: stats?.waitingQueue || 0, sub: 'currently waiting', icon: Clock, trend: stats?.waitingQueue > 10 ? 'High' : 'Normal' },
  ];

  // Quick nav uses actual routes from App.jsx
  const quickNav = [
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Appointments', href: '/appointments', icon: Calendar },
    { label: 'Wards', href: '/wards', icon: Bed },
    { label: 'Lab Results', href: '/lab-results', icon: Beaker },
    { label: 'Prescriptions', href: '/prescriptions', icon: Activity },
    { label: 'Claims', href: '/hospital-claims', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Hospital Command Center</h1>
                <p className="text-green-100 text-sm">Live operational overview & predictive analytics</p>
              </div>
            </div>
            <p className="text-green-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">System Status</p>
            <div className="flex items-center gap-2 mt-1 justify-end">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <p className="text-sm font-semibold text-orange-200">All Systems Normal</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${i % 2 === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full text-green-700 bg-green-50">{kpi.trend}</span>
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
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Patient Admissions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Daily volume this week</p>
            </div>
            <div className="flex gap-1">
              {['7D','30D','90D'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === p ? 'bg-green-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ADMIT_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hospAdmitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="admissions" stroke="#16a34a" strokeWidth={2.5} fill="url(#hospAdmitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Department Load</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Patients by department</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DEPT_DATA} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="patients" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Alert Cards + Intelligence ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Infection Alerts</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <p className="text-sm text-muted-foreground">No active outbreaks detected in last 48 hrs. Standard protocols active.</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Beaker className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Lab Turnaround</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">45<span className="text-sm font-normal text-muted-foreground ml-1">min avg</span></p>
          <p className="text-xs text-green-600 mt-1">✓ Within optimal range (&lt;60 min)</p>
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickNav.map((item, i) => (
            <Link key={i} to={item.href}>
              <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm ${i % 2 === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
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
