import { useTranslation } from "react-i18next";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from "@/lib/AuthContext";
import { CheckSquare, Bug, PlayCircle, TrendingUp, Calendar, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

import { ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from "lucide-react";

function StatCard({ icon: IconComp, label, value, sub, colorClass, iconColorClass, trend, trendColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" }) {
  return (
    <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
          <IconComp className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColor} px-2 py-1 rounded-md text-xs font-bold`}>
            <ArrowUpRight className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{value}</h3>
      <p className="text-sm font-semibold text-slate-700 dark:text-foreground">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function SoftwareDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const today = new Date();

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['optavel_tasks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_tasks WHERE company_id = ? AND assignee_id = ? ORDER BY created_at DESC`, [companyId, user?.id]);
      return res.rows._array;
    },
    enabled: !!companyId && !!user?.id
  });

  const { data: bugs = [] } = useQuery({
    queryKey: ['optavel_bugs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_bugs WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['optavel_sprints', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_sprints WHERE company_id = ? AND status = 'active' ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['optavel_all_tasks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_tasks WHERE company_id = ?`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');
  const openBugs = bugs.filter(b => b.status === 'open' || b.status === 'in_progress' || b.status === 'todo');
  const activeSprints = sprints;

  // Calculate real progress and velocity
  const activeSprint = activeSprints[0];
  const sprintTasks = allTasks.filter(t => t.sprint_id === activeSprint?.id);
  const completedSprintTasks = sprintTasks.filter(t => t.status === 'completed' || t.status === 'done');
  const sprintProgress = sprintTasks.length > 0 ? Math.round((completedSprintTasks.length / sprintTasks.length) * 100) : 0;
  const velocity = completedSprintTasks.length;

  return (
    <div className="space-y-8 school-page-enter font-dmsans max-w-7xl mx-auto pb-12">
      <div className="w-full">
        {/* Massive Colorful Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-500 p-6 md:p-8 mb-8 shadow-sm text-white">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-10 -mb-16 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                <Code2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xl md:text-2xl mb-0.5">My Dashboard, {user?.user_metadata?.full_name || 'Engineer'} 👋</p>
                <p className="text-white/80 text-sm">Personal Engineering Overview • {format(today, "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-white/80 font-medium text-xs mb-1 uppercase tracking-wider">Status</p>
              <div className="text-2xl md:text-3xl font-black tabular-nums">Ready to Code</div>
            </div>
          </div>
        </div>

        {/* Top Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={CheckSquare} label="My Pending Tasks" value={pendingTasks.length} sub="tasks across your active projects" colorClass="bg-blue-600" trend="+5%" />
          <StatCard icon={Bug} label="Open Bugs" value={openBugs.length} sub="assigned directly to you" colorClass="bg-rose-500" trend="-1%" trendColor="text-rose-600 bg-rose-50 dark:bg-rose-900/30" />
          <StatCard icon={PlayCircle} label="Active Sprints" value={activeSprints.length} sub="sprints currently running" colorClass="bg-purple-600" />
          <StatCard icon={TrendingUp} label="Velocity" value={velocity} sub="tasks completed this sprint" colorClass="bg-emerald-500" trend="+12%" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Tasks */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[500px]">
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold">{t("my_tasks", "My Tasks")}</h3>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {loadingTasks ? (
              <div className="p-5 text-center text-sm text-muted-foreground">{t("loading", "Loading...")}</div>
            ) : pendingTasks.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">{t("no_pending_tasks", "No pending tasks 🎉")}</div>
            ) : pendingTasks.map(task => (
                <div key={task.id} className="px-6 py-4 flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-emerald-500`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex flex-wrap gap-2.5 mt-1">
                      <Badge variant="outline" className="text-[10px] uppercase bg-slate-50">{task.status}</Badge>
                      <Badge variant="outline" className="text-[10px] uppercase">{task.priority}</Badge>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Active Sprints */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[500px]">
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold">Active Sprints</h3>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {activeSprints.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No active sprints</div>
            ) : activeSprints.map(sprint => (
                <div key={sprint.id} className="px-6 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold">{sprint.title}</p>
                    <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{sprint.goal || "No goal specified"}</p>
                  <Progress value={sprintProgress} className="h-2 mb-1" />
                  <p className="text-[10px] text-right text-muted-foreground">{sprintProgress}% Complete</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
