import { useTranslation } from "react-i18next";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { powerSync } from "@/lib/powersync";
import { useAuth } from "@/lib/AuthContext";
import { CheckSquare, Bug, PlayCircle, TrendingUp, Calendar, Code2 } from "lucide-react";
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

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');
  const openBugs = bugs.filter(b => b.status === 'open' || b.status === 'in_progress');
  const activeSprints = sprints;

  // Mock progress for now
  const sprintProgress = 65;

  return (
    <div className="space-y-8 school-page-enter font-dmsans max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-700 p-8 sm:p-10 text-white shadow-2xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-900 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Code2 className="w-6 h-6 text-blue-100" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Software Engineering</h1>
            </div>
            <p className="text-blue-100 text-lg font-medium tracking-wide">Development & Product Overview</p>
            <div className="mt-6 flex items-center gap-4 text-sm font-medium text-blue-100/80">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-70" />
                {format(today, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-inner">
            <div className="text-right">
              <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_12px_rgba(96,165,250,0.8)]" />
                Build Passing
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={CheckSquare} label="My Pending Tasks" value={pendingTasks.length} color="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" />
        <StatCard icon={Bug} label="Open Bugs" value={openBugs.length} color="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" />
        <StatCard icon={PlayCircle} label="Active Sprints" value={activeSprints.length} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <StatCard icon={TrendingUp} label="Velocity" value="24" sub="Points this sprint" color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
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
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-indigo-500`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex flex-wrap gap-2.5 mt-1">
                      <Badge variant="outline" className="text-[10px] uppercase">{task.status}</Badge>
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
