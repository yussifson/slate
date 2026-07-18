import { useTranslation } from "react-i18next";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from "@/lib/AuthContext";
import { GraduationCap, Users, Calendar, BookOpen, CheckSquare, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

function StatCard({ icon: IconComp, label, value, sub, color = "bg-slate-50 dark:bg-secondary/50 text-primary" }) {
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

export default function SchoolDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const today = new Date();

  const { data: students = [] } = useQuery({
    queryKey: ['univ_school_students', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM univ_school_students WHERE company_id = ?`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['univ_school_classes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM univ_school_classes WHERE company_id = ?`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['univ_school_assignments', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const res = await powerSync.execute(`SELECT * FROM univ_school_assignments WHERE company_id = ? ORDER BY due_date ASC`, [companyId]);
        return res.rows._array;
      } catch(e) { return []; }
    },
    enabled: !!companyId
  });

  const activeClasses = classes.filter(c => c.status === 'active' || !c.status);
  const pendingAssignments = assignments.filter(a => a.due_date && new Date(a.due_date) >= today);

  return (
    <div className="space-y-8 school-page-enter font-dmsans max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-8 sm:p-10 text-white shadow-2xl shadow-purple-500/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-violet-900 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <GraduationCap className="w-6 h-6 text-purple-100" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Academic Portal</h1>
            </div>
            <p className="text-purple-100 text-lg font-medium tracking-wide">Campus Operations Overview</p>
            <div className="mt-6 flex items-center gap-4 text-sm font-medium text-purple-100/80">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-70" />
                {format(today, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-inner">
            <div className="text-right">
              <p className="text-xs text-purple-200 font-bold uppercase tracking-wider mb-1">Term Status</p>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_12px_rgba(192,132,252,0.8)]" />
                In Session
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Students" value={students.length} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <StatCard icon={BookOpen} label="Active Classes" value={activeClasses.length} color="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" />
        <StatCard icon={CheckSquare} label="Assignments Due" value={pendingAssignments.length} sub="upcoming (7 days)" color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <StatCard icon={Award} label="Attendance" value="94%" sub="school average" color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Classes */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[500px]">
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-bold">Active Classes</h3>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {activeClasses.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No active classes</div>
            ) : activeClasses.slice(0, 8).map(c => (
                <div key={c.id} className="px-6 py-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.class_name || c.name || 'Unnamed Class'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.subject || 'General'}</p>
                  </div>
                  <Badge variant="outline">{c.grade_level || 'N/A'}</Badge>
                </div>
              ))}
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[500px]">
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold">Upcoming Assignments</h3>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {pendingAssignments.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No upcoming assignments</div>
            ) : pendingAssignments.slice(0, 8).map(a => (
                <div key={a.id} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Due: {a.due_date ? format(new Date(a.due_date), "MMM d, yyyy") : 'TBD'}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
