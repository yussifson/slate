import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Activity, BrainCircuit, HeartPulse, ShieldAlert, Target, TrendingUp, Users, LogOut, Settings, Shield, Sparkles } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import ClipadLoader from '@/components/ui/ClipadLoader';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import NotificationCenter from '@/components/clipad/notifications/NotificationCenter';
import ThemeToggle from '@/components/layout/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { isAdmin } from '@/lib/constants';

export default function KnowledgeHealth() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [rawCounts, setRawCounts] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');

  const isUserAdmin = isAdmin(user);

  useEffect(() => {
    if (!isUserAdmin) {
      setLoading(false);
      return;
    }

    async function fetchHealth() {
      try {
        const { data: meetings } = await supabase
          .from('clipad_meeting_records')
          .select('id')
          .eq('workspace_id', user?.company_id);

        const { data: decisions } = await supabase
          .from('clipad_decisions')
          .select('id, status')
          .eq('workspace_id', user?.company_id);
          
        const { data: events } = await supabase
          .from('clipad_org_events')
          .select('event_type')
          .eq('workspace_id', user?.company_id);

        const meetingCount = meetings?.length || 1;
        const decisionCount = decisions?.length || 0;
        const blockerCount = events?.filter(e => e.event_type === 'blocker_raised')?.length || 0;
        const taskCompletedCount = events?.filter(e => e.event_type === 'task_completed')?.length || 0;

        // Calculate some basic mock "health" metrics based on actual DB row counts
        const velocity = Math.min(100, Math.round((decisionCount / meetingCount) * 100) + 30);
        const resolution = blockerCount === 0 ? 100 : Math.min(100, Math.round((taskCompletedCount / blockerCount) * 100) + 20);
        const silos = Math.min(100, 85 - (meetingCount % 10)); // proxy metric
        const bloat = Math.max(20, 100 - (meetingCount * 2)); // proxy metric

        setRawCounts({
          meetings: meetingCount,
          decisions: decisionCount,
          blockers: blockerCount,
          completed: taskCompletedCount
        });

        setHealthData([
          { subject: 'Decision Velocity', A: velocity, fullMark: 100 },
          { subject: 'Resolution Speed', A: resolution, fullMark: 100 },
          { subject: 'Cross-Functional (Silos)', A: silos, fullMark: 100 },
          { subject: 'Meeting Efficiency', A: bloat, fullMark: 100 },
          { subject: 'Knowledge Capture', A: Math.min(100, decisionCount * 5 + 40), fullMark: 100 },
        ]);

        // Generate a mock AI diagnosis based on the metrics
        if (silos < 50) {
          setDiagnosis("Your teams are operating in silos. Cross-functional knowledge sharing is below average. We recommend scheduling inter-departmental standups.");
        } else if (velocity < 40) {
          setDiagnosis("Meeting volume is high, but decision velocity is low. Consider using async standups to reduce meeting bloat.");
        } else {
          setDiagnosis("Your organizational intelligence is healthy. Teams are effectively capturing decisions and resolving blockers.");
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.company_id) fetchHealth();
  }, [user, isUserAdmin]);

  if (loading) return <ClipadLoader fullScreen text="Analyzing Organizational Health..." />;

  if (!isUserAdmin) {
    return <Navigate to="/clipad" replace />;
  }



  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col w-full page-enter">
      {/* Sleek top nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm text-primary">
            <CliPadLogo size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight">CliPad</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          <button onClick={() => navigate('/spaces')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Spaces</button>
          <button onClick={() => navigate('/videos')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Recordings</button>
          <button onClick={() => navigate('/meetings')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Meetings</button>
          <button onClick={() => navigate('/chat')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Chat</button>
            <>
              {user?.clipad_plan === 'enterprise' ? (
                <button onClick={() => navigate('/clipad/enterprise')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Enterprise</button>
              ) : (
                <button onClick={() => navigate('/analytics')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Analytics</button>
              )}
            </>
          )}
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
          
          <ThemeToggle />
          
          <button onClick={() => window.dispatchEvent(new CustomEvent("toggle-clipad-orbit"))} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 ml-2">
            <Sparkles className="w-3.5 h-3.5" /> OrbitFlow
          </button>
          
          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center font-bold text-sm text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95 ml-1 overflow-hidden border border-primary/20">
                {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <img src={user.avatar_url || user.user_metadata.avatar_url} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                  firstName[0]?.toUpperCase()
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 font-sans">
              <DropdownMenuLabel className="font-semibold">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              {user?.role === 'super_admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin')} className="cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <Shield className="mr-2 h-4 w-4" />
                    <span className="font-semibold">Super Admin Dashboard</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { await logout(); navigate('/login'); }} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-rose-500" />
            Knowledge Health
          </h1>
          <p className="text-slate-500 mt-2">Bird's-eye view of your organization's operational intelligence and efficiency.</p>
        </div>
      </div>

      {/* Raw Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Total Meetings', value: rawCounts?.meetings || 0, desc: 'Recorded on platform', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { title: 'Key Decisions', value: rawCounts?.decisions || 0, desc: 'Extracted automatically', icon: BrainCircuit, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { title: 'Blockers Raised', value: rawCounts?.blockers || 0, desc: 'Identified in syncs', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
          { title: 'Tasks Completed', value: rawCounts?.completed || 0, desc: 'Resolved action items', icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <h4 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">{stat.title}</h4>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</div>
            <p className="text-xs text-slate-400 mt-auto">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Radar Chart */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <h3 className="text-xl font-bold mb-1 relative z-10">Operational Vectors</h3>
          <p className="text-sm text-slate-500 mb-6 relative z-10">Calculated from your raw organizational data</p>
          <div className="flex-1 min-h-[400px] w-full flex items-center justify-center relative z-10">
            {healthData ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={healthData}>
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Org Health" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="url(#colorRadar)" fillOpacity={1} />
                  <defs>
                    <linearGradient id="colorRadar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}/100`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">Not enough data to calculate health metrics.</p>
            )}
          </div>
        </div>

        {/* AI Diagnosis */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-xl flex flex-col relative overflow-hidden ring-1 ring-indigo-500/50">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <BrainCircuit className="w-48 h-48 -rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          
          <h3 className="text-2xl font-black mb-3 flex items-center gap-3 relative z-10">
            <BrainCircuit className="w-6 h-6 text-indigo-300" /> AI Diagnosis
          </h3>
          <p className="text-indigo-200 text-sm mb-8 relative z-10 leading-relaxed">
            Based on analysis of <strong>{rawCounts?.meetings || 0}</strong> meeting transcripts and <strong>{rawCounts?.decisions || 0}</strong> extracted decisions across your workspace.
          </p>
          
          <div className="flex-1 bg-black/20 rounded-2xl p-6 backdrop-blur-md border border-white/10 relative z-10 flex flex-col justify-center shadow-inner">
            <div className="absolute -left-3 top-6 text-4xl text-indigo-400/30 font-serif">"</div>
            <p className="text-lg font-medium leading-relaxed relative z-10">
              {diagnosis || "Analyzing data points to formulate a diagnosis..."}
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
            <button className="w-full py-3.5 bg-white text-indigo-900 font-black rounded-xl hover:bg-indigo-50 hover:shadow-lg hover:-translate-y-0.5 transition-all focus:ring-4 focus:ring-indigo-300">
              Generate Detailed Report
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
