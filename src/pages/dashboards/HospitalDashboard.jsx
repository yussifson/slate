import { useTranslation } from "react-i18next";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from "@/lib/AuthContext";
import { HeartPulse, Calendar as CalendarIcon, Users, Activity, BedDouble, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

function StatCard({ icon: IconComp, label, value, sub, color = "bg-slate-50 dark:bg-slate-800/50 text-primary" }) {
  return (
    <div className="bg-card rounded-2xl border-0 p-5 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <IconComp className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tracking-[-0.03em]">{value}</p>
        <p className="text-sm font-medium text-muted-foreground tracking-tight mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function HospitalDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const today = new Date();

  const { data: patients = [] } = useQuery({
    queryKey: ['univ_patients', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM univ_patients WHERE company_id = ?`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['univ_med_appointments', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM univ_med_appointments WHERE company_id = ? ORDER BY date ASC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: wards = [] } = useQuery({
    queryKey: ['univ_med_wards', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const res = await powerSync.execute(`SELECT * FROM univ_med_wards WHERE company_id = ?`, [companyId]);
        return res.rows._array;
      } catch (e) { return []; }
    },
    enabled: !!companyId
  });

  const upcomingAppointments = appointments.filter(a => a.date && new Date(a.date) >= today);
  const admittedPatients = patients.filter(p => p.status === 'admitted');
  const availableBeds = wards.reduce((sum, w) => sum + (w.available_beds || 0), 0);

  return (
    <div className="space-y-8 school-page-enter font-dmsans max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-8 sm:p-10 text-white shadow-2xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-900 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <HeartPulse className="w-6 h-6 text-emerald-100" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Hospital Command Center</h1>
            </div>
            <p className="text-emerald-100 text-lg font-medium tracking-wide">Live operational overview & predictive analytics</p>
            <div className="mt-6 flex items-center gap-4 text-sm font-medium text-emerald-100/80">
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 opacity-70" />
                {format(today, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-inner">
            <div className="text-right">
              <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider mb-1">System Status</p>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                All Systems Normal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Patients" value={patients.length} sub="lifetime records" color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <StatCard icon={CalendarIcon} label="Appointments" value={upcomingAppointments.length} sub="upcoming (7 days)" color="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" />
        <StatCard icon={BedDouble} label="Available Beds" value={availableBeds} sub="ready for admission" color="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" />
        <StatCard icon={Activity} label="Admissions" value={admittedPatients.length} sub="currently admitted" color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Appointments */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[500px]">
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-bold">Upcoming Appointments</h3>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {upcomingAppointments.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No upcoming appointments</div>
            ) : upcomingAppointments.slice(0, 8).map(a => (
                <div key={a.id} className="px-6 py-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-semibold text-orange-600 leading-none">{format(new Date(a.date), "MMM")}</span>
                    <span className="text-sm font-semibold text-orange-600 leading-none">{format(new Date(a.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.patient_name || 'Patient'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.doctor_name} · {a.time || 'TBD'}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[500px]">
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold">Recent Patients</h3>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {patients.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No patients</div>
            ) : patients.slice(0, 8).map(patient => (
                <div key={patient.id} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold">{patient.first_name} {patient.last_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">ID: {patient.patient_number || 'N/A'}</p>
                    </div>
                    <Badge variant="outline">{patient.gender || 'Unknown'}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
