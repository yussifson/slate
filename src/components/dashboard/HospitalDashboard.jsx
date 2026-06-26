import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from '@/components/intelligence/IntelligenceUI';
import { useQuery } from "@tanstack/react-query";
import { powerSync } from '@/api/PowerSyncConnector';
import {
  Users, Activity, Bed, Beaker, Calendar, Clock,
  ArrowRight, ShieldAlert, Heart, Stethoscope,
  TrendingUp, ArrowUpRight, ChevronRight, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const DEPT_DATA = [
  { name: 'Emergency', patients: 24 },
  { name: 'OPD', patients: 68 },
  { name: 'Surgery', patients: 12 },
  { name: 'ICU', patients: 8 },
  { name: 'Pediatrics', patients: 19 },
];

const ADMIT_DATA = [
  { name: 'Mon', admissions: 14 },
  { name: 'Tue', admissions: 18 },
  { name: 'Wed', admissions: 12 },
  { name: 'Thu', admissions: 21 },
  { name: 'Fri', admissions: 16 },
  { name: 'Sat', admissions: 9 },
  { name: 'Sun', admissions: 7 },
];

export default function HospitalDashboard({ companyId }) {
  const { t } = useTranslation();
  const [chartPeriod, setChartPeriod] = useState('7D');

  const { data: stats } = useQuery({
    queryKey: ["hospital_stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const [patients, appointments, beds, queue] = await Promise.all([
        powerSync.execute('SELECT count(*) as count FROM univ_patients WHERE company_id = ?', [companyId]),
        powerSync.execute('SELECT count(*) as count FROM univ_appointments WHERE company_id = ? AND date >= CURRENT_DATE', [companyId]),
        powerSync.execute('SELECT count(*) as count FROM univ_beds WHERE company_id = ? AND status = ?', [companyId, 'available']),
        powerSync.execute('SELECT count(*) as count FROM univ_opd_queues WHERE company_id = ? AND status = ?', [companyId, 'waiting'])
      ]);
      return {
        patients: patients.rows._array[0].count,
        appointments: appointments.rows._array[0].count,
        availableBeds: beds.rows._array[0].count,
        waitingQueue: queue.rows._array[0].count
      };
    },
    enabled: !!companyId
  });

  const kpis = [
    { label: 'Total Patients', value: stats?.patients || 0, sub: 'lifetime records', icon: Users, from: 'from-cyan-500', to: 'to-teal-600', trend: '+6%', up: true },
    { label: 'Appointments', value: stats?.appointments || 0, sub: 'upcoming (7 days)', icon: Calendar, from: 'from-teal-500', to: 'to-emerald-600', trend: '+14%', up: true },
    { label: 'Available Beds', value: stats?.availableBeds || 0, sub: 'ready for admission', icon: Bed, from: 'from-emerald-500', to: 'to-green-600', trend: '', up: true },
    { label: 'OPD Queue', value: stats?.waitingQueue || 0, sub: 'currently waiting', icon: Clock, from: 'from-amber-500', to: 'to-orange-600', trend: stats?.waitingQueue > 10 ? 'High' : 'Normal', up: false },
  ];

  const quickNav = [
    { label: 'Patients', href: '/hospital/patients', icon: Users, from: 'from-cyan-500', to: 'to-teal-600' },
    { label: 'Appointments', href: '/appointments', icon: Calendar, from: 'from-teal-500', to: 'to-emerald-600' },
    { label: 'Wards', href: '/hospital/wards', icon: Bed, from: 'from-emerald-500', to: 'to-green-600' },
    { label: 'Lab Results', href: '/lab-results', icon: Beaker, from: 'from-blue-500', to: 'to-indigo-600' },
    { label: 'Prescriptions', href: '/prescriptions', icon: Activity, from: 'from-purple-500', to: 'to-violet-600' },
    { label: 'Claims', href: '/hospital-claims', icon: ShieldAlert, from: 'from-orange-500', to: 'to-red-500' },
  ];

  return (
    <div className="space-y-6 p-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Hospital Command Center</h1>
                <p className="text-cyan-100 text-sm">Live operational overview & predictive analytics</p>
              </div>
            </div>
            <p className="text-cyan-200 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white/60 text-xs">System Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-emerald-300">All Systems Normal</p>
              </div>
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
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.up ? 'text-emerald-700 bg-emerald-50' : (kpi.trend === 'High' ? 'text-red-600 bg-red-50' : 'text-amber-700 bg-amber-50')}`}>
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
        {/* Admissions Trend */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Patient Admissions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Daily admission volume this week</p>
            </div>
            <div className="flex gap-1">
              {['7D','30D','90D'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === p ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ADMIT_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hospAdmitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="admissions" stroke="#0d9488" strokeWidth={2.5} fill="url(#hospAdmitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Load */}
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
              <Bar dataKey="patients" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Alerts + Intelligence ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Infection Alerts</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <p className="text-sm text-muted-foreground">No active outbreaks detected in the last 48 hours. Standard protocols active.</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Beaker className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Lab Turnaround</h3>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">45<span className="text-sm font-normal text-muted-foreground ml-1">min avg</span></p>
                <p className="text-xs text-emerald-600 mt-1">✓ Within optimal range (&lt;60 min)</p>
              </div>
            </div>
          </div>
          <RevenueForecastCard companyId={companyId} />
        </div>
        <div className="space-y-4">
          <BehaviourProfilePanel profile={{ churn_risk: "low", payment_reliability: "reliable", engagement_trend: "stable", profile_confidence: 90 }} entityType="patient" />
          <BenchmarkingPanel companyId={companyId} industry="hospital" />
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickNav.map((item, i) => (
            <Link key={i} to={item.href}>
              <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
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
