import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { BarChart3, TrendingUp, Eye, Heart, MessageSquare, Clock, ArrowLeft, Video, Target, Users, Settings, UserCircle } from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationsDropdown from '@/components/clipad/NotificationsDropdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ClipadMobileNav from '@/components/clipad/ClipadMobileNav';
import { isAdmin } from '@/lib/constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import ClipadLoader from '@/components/ui/ClipadLoader';

function StatCard({ icon: Icon, color, value, label, trend }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border hover:border-white/12 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${color || 'bg-primary/10 text-primary'}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'text-emerald-500 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <div className="text-3xl font-black text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default function VideoAnalytics() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalVideos: 0,
    totalComments: 0,
    totalReactions: 0,
    topVideos: [],
    recentViews: []
  });

  useEffect(() => { 
    if (user) {
      fetchAnalytics(); 
    } else if (!isLoadingAuth) {
      setLoading(false);
    }
  }, [user, isLoadingAuth]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let videoIds = [];
      let videos = [];
      
      let myMeetings = [];
      if (user.company_id) {
        const { data: spaces } = await supabase.from('clipad_spaces').select('id').eq('company_id', user.company_id);
        const spaceIds = spaces?.map(s => s.id) || [];
        if (spaceIds.length > 0) {
          const { data: companyVideos } = await supabase.from('clipad_videos').select('id, title, created_at, duration_seconds').in('space_id', spaceIds);
          videos = companyVideos || [];
          const { data: companyMeetings } = await supabase.from('clipad_meeting_records').select('id').in('space_id', spaceIds);
          myMeetings = companyMeetings || [];
        }
      } else {
        const { data: myVideos } = await supabase.from('clipad_videos').select('id, title, created_at, duration_seconds').eq('creator_id', user.id);
        videos = myVideos || [];
        const { data: myM } = await supabase.from('clipad_meeting_records').select('id').eq('host_id', user.id);
        myMeetings = myM || [];
      }

      videoIds = videos.map(v => v.id);

      // Fetch views for those videos
      const { data: views } = videoIds.length > 0
        ? await supabase.from('clipad_video_views').select('video_id, watch_percent, created_at').in('video_id', videoIds)
        : { data: [] };
      
      // Fetch comments for those videos
      const { count: commentsCount } = videoIds.length > 0
        ? await supabase.from('clipad_video_comments').select('id', { count: 'exact', head: true }).in('video_id', videoIds)
        : { count: 0 };
      
      // Fetch reactions for those videos
      const { count: reactionsCount } = videoIds.length > 0 
        ? await supabase.from('clipad_video_reactions').select('id', { count: 'exact', head: true }).in('video_id', videoIds)
        : { count: 0 };

      // Calculate stats per video
      const enhancedVideos = videos.map(v => {
        const vViews = views?.filter(vw => vw.video_id === v.id) || [];
        const avgCompletion = vViews.length > 0 ? Math.round(vViews.reduce((acc, curr) => acc + (curr.watch_percent || 0), 0) / vViews.length) : 0;
        return {
          ...v,
          viewCount: vViews.length,
          avgCompletion
        };
      }).sort((a, b) => b.viewCount - a.viewCount); // sort by most viewed

      // Calculate timeline data (views per day for last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return { date: d.toISOString().split('T')[0], count: 0 };
      }).reverse();

      views?.forEach(v => {
        const d = v.created_at.split('T')[0];
        const day = last7Days.find(x => x.date === d);
        if (day) day.count++;
      });

      setStats({
        totalViews: views?.length || 0,
        totalVideos: videos.length + myMeetings.length,
        totalComments: commentsCount || 0,
        totalReactions: reactionsCount || 0,
        topVideos: enhancedVideos.slice(0, 5),
        recentViews: last7Days
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoadingAuth) {
    return <ClipadLoader fullScreen text="Loading analytics..." />;
  }

  if (!user) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative text-slate-900 dark:text-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-[420px] text-center space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-500">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Video Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Please sign in to view your video engagement analytics and metrics.</p>
          </div>
          <button
            onClick={() => {
              const continueUrl = encodeURIComponent(`${window.location.origin}/auth/callback?continue=%2Fanalytics`);
              window.location.href = `https://account.optavel.com/sso?redirect_uri=${continueUrl}`;
            }}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow-sm"
          >
            Sign In with SSO
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin(user)) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative text-slate-900 dark:text-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-[420px] text-center space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Video Analytics are restricted to Company Admins.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Max value for chart scaling
  const maxViews = Math.max(10, ...stats.recentViews.map(d => d.count));

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 page-enter overflow-x-hidden pb-24 md:pb-8">
      {/* Sleek top nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm text-primary">
            <CliPadLogo size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:block">CliPad</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          <button onClick={() => navigate('/spaces')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Spaces</button>
          <button onClick={() => navigate('/meetings')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Meetings</button>
          <button onClick={() => navigate('/chat')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Chat</button>
          <button onClick={() => navigate('/analytics')} className="hidden md:block px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg transition-colors">Analytics</button>
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
          
          <ThemeToggle />
          <NotificationsDropdown />

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
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800">
              <div className="px-3 py-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="font-semibold text-sm truncate">{user?.full_name || user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl py-2.5 px-3 cursor-pointer">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem onClick={() => window.location.href = 'https://account.optavel.com'} className="rounded-xl py-2.5 px-3 cursor-pointer text-slate-500">
                <UserCircle className="w-4 h-4 mr-2" /> Go to Optavel Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-foreground mb-1 flex items-center gap-3"><BarChart3 className="w-7 h-7 text-emerald-500" /> Analytics</h1>
          <p className="text-muted-foreground text-sm">See how your team interacts with your video recordings.</p>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Eye} color="bg-primary/10 text-primary" value={stats.totalViews} label="Total Views" trend={14} />
              <StatCard icon={Video} color="bg-primary/10 text-primary" value={stats.totalVideos} label="Videos Recorded" />
              <StatCard icon={MessageSquare} color="bg-primary/10 text-primary" value={stats.totalComments} label="Comments" trend={8} />
              <StatCard icon={Heart} color="bg-primary/10 text-primary" value={stats.totalReactions} label="Reactions" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-8">
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Views Over Time</h3>
                <div className="h-[250px] w-full flex items-end gap-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.recentViews}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-surface-0)' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2 opacity-90">Engagement Score</h3>
                  <p className="text-sm opacity-80 mb-6">Based on completion rates and interactions</p>
                  <div className="text-5xl font-black mb-2">
                    {stats.totalViews > 0 
                      ? Math.min(100, Math.round(((stats.totalComments + stats.totalReactions) / stats.totalViews) * 100) + 40)
                      : 0}
                    <span className="text-2xl opacity-70">/100</span>
                  </div>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full" 
                    style={{ width: `${stats.totalViews > 0 ? Math.min(100, Math.round(((stats.totalComments + stats.totalReactions) / stats.totalViews) * 100) + 40) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top Videos Bar Chart */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
              <h3 className="text-lg font-bold mb-6">Top Performing Videos</h3>
              {stats.topVideos.length > 0 ? (
                <div className="space-y-4">
                  {stats.topVideos.map((v, i) => (
                    <div key={v.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer" onClick={() => navigate(`/watch/${v.id}`)}>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-500 dark:text-slate-400 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{v.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{new Date(v.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-6 shrink-0 text-right">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{v.viewCount}</p>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Views</p>
                        </div>
                        <div className="w-16 hidden sm:block">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{v.avgCompletion}%</p>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Avg %</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Video className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No video data available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ClipadMobileNav />
    </div>
  );
}
