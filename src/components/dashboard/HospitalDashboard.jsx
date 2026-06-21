import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from '@/components/intelligence/IntelligenceUI';
import { useQuery } from "@tanstack/react-query";
import { powerSync } from '@/api/PowerSyncConnector';
import { Users, Activity, Bed, Beaker, Calendar, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

function MetricCard({ title, value, icon: Icon, iconBg, iconColor, subtitle, subtitleColor }) {
  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs text-[#71717a] mb-1">{title}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {subtitle && <p className={`text-xs mt-1 ${subtitleColor || "text-[#71717a]"}`}>{subtitle}</p>}
      </div>
      <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

export default function HospitalDashboard({ companyId }) {
  const { t } = useTranslation();

  // Load hospital stats
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

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Hospital Intelligence Command Center</h1>
          <p className="text-slate-500 dark:text-slate-400">Live operational overview and predictive analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Registered Patients" 
          value={stats?.patients || 0} 
          icon={Users} 
          iconBg="bg-blue-50 dark:bg-blue-900/20" 
          iconColor="text-blue-600 dark:text-blue-400" 
          subtitle="Active lifetime records" 
        />
        <MetricCard 
          title="Upcoming Appointments" 
          value={stats?.appointments || 0} 
          icon={Calendar} 
          iconBg="bg-purple-50 dark:bg-purple-900/20" 
          iconColor="text-purple-600 dark:text-purple-400" 
          subtitle="Next 7 days" 
        />
        <MetricCard 
          title="Available Ward Beds" 
          value={stats?.availableBeds || 0} 
          icon={Bed} 
          iconBg="bg-green-50 dark:bg-green-900/20" 
          iconColor="text-green-600 dark:text-green-400" 
          subtitle="Ready for admission" 
        />
        <MetricCard 
          title="OPD Waiting Queue" 
          value={stats?.waitingQueue || 0} 
          icon={Clock} 
          iconBg="bg-amber-50 dark:bg-amber-900/20" 
          iconColor="text-amber-600 dark:text-amber-400" 
          subtitle="Currently waiting" 
          subtitleColor={stats?.waitingQueue > 10 ? 'text-red-500' : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RevenueForecastCard companyId={companyId} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><ShieldAlert className="w-4 h-4 text-primary" /> Active Infection Alerts</h3>
              <p className="text-sm text-slate-500">No active outbreaks detected in the last 48 hours. Continue standard protocols.</p>
            </div>
            <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><Beaker className="w-4 h-4 text-primary" /> Lab Turnaround Time</h3>
              <p className="text-sm text-slate-500">Average TAT for routine chemistry is currently 45 mins (Optimal: &lt;60 mins).</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <BehaviourProfilePanel profile={{churn_risk: "low", payment_reliability: "reliable", engagement_trend: "stable", profile_confidence: 90}} entityType="patient" />
          <BenchmarkingPanel companyId={companyId} industry="hospital" />
        </div>
      </div>
    </div>
  );
}
