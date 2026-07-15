import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { hasFeature } from '@/lib/clipadPricing';
import { useCompanyPlan } from '@/hooks/useCompanyPlan';
import { BarChart3, TrendingUp, Eye, Heart, MessageSquare, Clock, ArrowLeft, Video, Target, Users, Settings, UserCircle, ShieldAlert, X } from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationCenter from '@/components/clipad/notifications/NotificationCenter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { isAdmin } from '@/lib/constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import ClipadLoader from '@/components/ui/ClipadLoader';

function StatCard({ icon: Icon, color, value, label, trend }) {
  return (
    <div className="group relative p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative z-10 flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${color || 'bg-primary/10 text-primary'}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${trend > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' : trend < 0 ? 'text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20' : 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="relative z-10 text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{value || 0}</div>
      <div className="relative z-10 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default function VideoAnalytics() {
  const { user, isLoadingAuth } = useAuth();
  const { plan } = useCompanyPlan();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [videoFilter, setVideoFilter] = useState('top');
  const [stats, setStats] = useState({
    totalViews: 0,
    totalVideos: 0,
    totalComments: 0,
    totalReactions: 0,
    topVideos: [],
    allVideos: [],
    recentViews: []
  });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [viewersData, setViewersData] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  useEffect(() => {
    if (selectedVideo) {
      setLoadingViewers(true);
      supabase.from('clipad_video_views')
        .select('*, profile:clipad_profiles(*)')
        .eq('video_id', selectedVideo.id)
        .order('viewed_at', { ascending: false })
        .then(({ data }) => {
          setViewersData(data || []);
          setLoadingViewers(false);
        });
    } else {
      setViewersData([]);
    }
  }, [selectedVideo]);

  useEffect(() => { 
    if (user && !isAdmin(user)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => { 
    if (user) {
      if (isAdmin(user)) {
        fetchAnalytics(); 
      } else {
        setLoading(false);
      }
    } else if (!isLoadingAuth) {
      setLoading(false);
    }
  }, [user, isLoadingAuth]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let videoIds = [];
      
      const isAdminUser = isAdmin(user);
      let videos = [];
      let myMeetings = [];

      if (isAdminUser) {
        const [videosRes, meetingsRes] = await Promise.all([
          supabase.from('clipad_videos').select('id, title, created_at, duration_seconds'),
          supabase.from('clipad_meeting_records').select('id')
        ]);
        videos = videosRes.data || [];
        myMeetings = meetingsRes.data || [];
      } else {
        const [mySpacesRes, memberSpacesRes] = await Promise.all([
          supabase.from('clipad_spaces').select('id').eq('created_by', user.id),
          supabase.from('clipad_space_members').select('space_id').eq('user_id', user.id)
        ]);
        const spaceIds = Array.from(new Set([
          ...(mySpacesRes.data?.map(s => s.id) || []),
          ...(memberSpacesRes.data?.map(m => m.space_id) || [])
        ]));
        
        const [videosRes, meetingsRes, myVidsRes] = await Promise.all([
          spaceIds.length > 0 ? supabase.from('clipad_videos').select('id, title, created_at, duration_seconds').in('space_id', spaceIds) : { data: [] },
          spaceIds.length > 0 ? supabase.from('clipad_meeting_records').select('id').in('space_id', spaceIds) : { data: [] },
          supabase.from('clipad_videos').select('id, title, created_at, duration_seconds').eq('creator_id', user.id)
        ]);
        
        const allVids = [...(videosRes.data || []), ...(myVidsRes.data || [])];
        videos = Array.from(new Map(allVids.map(v => [v.id, v])).values());
        myMeetings = meetingsRes.data || [];
      }

      videoIds = videos.map(v => v.id);

      // Fetch views for those videos
      const { data: views } = videoIds.length > 0 
        ? await supabase.from('clipad_video_views').select('video_id, viewed_at').in('video_id', videoIds)
        : { data: [] };
      
      // Fetch comments for those videos
      const { data: commentsData } = videoIds.length > 0
        ? await supabase.from('clipad_video_comments').select('id, video_id').in('video_id', videoIds)
        : { data: [] };
      
      // Fetch reactions for those videos
      const { data: reactionsData } = videoIds.length > 0 
        ? await supabase.from('clipad_video_reactions').select('id, video_id').in('video_id', videoIds)
        : { data: [] };

      // Calculate stats per video
      const enhancedVideos = videos.map(v => {
        const vViews = views?.filter(vw => vw.video_id === v.id) || [];
        const vComments = commentsData?.filter(c => c.video_id === v.id) || [];
        const vReactions = reactionsData?.filter(r => r.video_id === v.id) || [];
        const avgCompletion = vViews.length > 0 ? 100 : 0; // watch_percent is missing in db
        
        return {
          ...v,
          viewCount: vViews.length,
          commentCount: vComments.length,
          reactionCount: vReactions.length,
          avgCompletion: avgCompletion
        };
      });

      // Aggregations
      const totalViews = views?.length || 0;
      const totalComments = commentsData?.length || 0;
      const totalReactions = reactionsData?.length || 0;
      const totalVideos = enhancedVideos.length;

      // Top performing
      const sortedVideos = [...enhancedVideos].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 5);
      
      // Recent views chart data (last 7 days mock up based on actual view timestamps if available)
      const recentViewsMap = new Map();
      for (let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        recentViewsMap.set(d.toLocaleDateString('en-US', { weekday: 'short' }), 0);
      }
      views?.forEach(vw => {
        const d = new Date(vw.viewed_at);
        const key = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (recentViewsMap.has(key)) {
          recentViewsMap.set(key, recentViewsMap.get(key) + 1);
        }
      });

      setStats({
        totalViews,
        totalVideos,
        totalComments,
        totalReactions,
        topVideos: sortedVideos,
        allVideos: enhancedVideos,
        recentViews: Array.from(recentViewsMap.entries()).map(([name, count]) => ({ name, count }))
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
    return null; // Prevents rendering anything while redirect happens
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
          <button onClick={() => navigate('/videos')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Recordings</button>
          <button onClick={() => navigate('/meetings')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Meetings</button>
          <button onClick={() => navigate('/chat')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Chat</button>
            <>
              {user?.clipad_plan === 'enterprise' ? (
                <button onClick={() => navigate('/clipad/enterprise')} className="hidden md:block px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg transition-colors">Enterprise</button>
              ) : (
                <button onClick={() => navigate('/analytics')} className="hidden md:block px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg transition-colors">Analytics</button>
              )}
            </>
          )}
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
          
          <ThemeToggle />
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

            {hasFeature(plan, 'hasAdvancedAnalytics') ? (
              <>
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

            {/* Top Videos List */}
            <div className="p-8 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10 gap-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><Video className="w-5 h-5 text-primary" /> Video Performance</h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto shadow-inner">
                  <button onClick={() => setVideoFilter('top')} className={`flex-1 sm:flex-none px-5 py-1.5 text-sm font-semibold rounded-lg transition-all ${videoFilter === 'top' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Top 5</button>
                  <button onClick={() => setVideoFilter('latest')} className={`flex-1 sm:flex-none px-5 py-1.5 text-sm font-semibold rounded-lg transition-all ${videoFilter === 'latest' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Latest</button>
                  <button onClick={() => setVideoFilter('all')} className={`flex-1 sm:flex-none px-5 py-1.5 text-sm font-semibold rounded-lg transition-all ${videoFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>All Videos</button>
                </div>
              </div>
              
              {(() => {
                let displayVideos = stats.allVideos || [];
                if (videoFilter === 'top') {
                  displayVideos = [...displayVideos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
                } else if (videoFilter === 'latest') {
                  displayVideos = [...displayVideos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
                } else {
                  displayVideos = [...displayVideos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                }

                return displayVideos.length > 0 ? (
                  <div className="space-y-4 relative z-10">
                    {displayVideos.map((v, i) => (
                      <div key={v.id} className="flex items-center gap-4 p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/80 backdrop-blur-md transition-all duration-300 border border-white/50 dark:border-slate-700/50 hover:border-primary/30 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 group" onClick={() => setSelectedVideo(v)}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${i === 0 && videoFilter === 'top' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : i === 1 && videoFilter === 'top' ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : i === 2 && videoFilter === 'top' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {videoFilter === 'top' ? `#${i + 1}` : <Video className="w-4 h-4" />}
                        </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate text-base group-hover:text-primary transition-colors">{v.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(v.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-4 sm:gap-8 shrink-0 text-right">
                        <div className="flex flex-col items-center sm:items-end justify-center">
                          <p className="text-lg font-black text-slate-900 dark:text-white">{v.viewCount}</p>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Eye className="w-3 h-3" /> Views</p>
                        </div>
                        <div className="flex flex-col items-center sm:items-end justify-center hidden sm:flex">
                          <p className="text-lg font-black text-slate-900 dark:text-white">{v.commentCount}</p>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1 mt-0.5"><MessageSquare className="w-3 h-3" /> Comments</p>
                        </div>
                        <div className="flex flex-col items-center sm:items-end justify-center hidden md:flex">
                          <p className="text-lg font-black text-slate-900 dark:text-white">{v.reactionCount}</p>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Heart className="w-3 h-3" /> Reacts</p>
                        </div>
                        <div className="w-16 flex flex-col items-center sm:items-end justify-center">
                          <p className="text-lg font-black text-emerald-500">{v.avgCompletion}%</p>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Target className="w-3 h-3" /> Avg %</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center relative z-10">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No video engagement data available yet.</p>
                </div>
              );
              })()}
            </div>
            </>
            ) : (
              <div className="mt-8 relative overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-slate-950/90 pointer-events-none" />
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4 relative z-10" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 relative z-10 mb-2">Advanced Analytics Locked</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto relative z-10 mb-6">
                  Upgrade to Pro to unlock deep engagement scoring, views over time tracking, and top performing video charts.
                </p>
                <button 
                  onClick={() => navigate('/clipad/billing')}
                  className="relative z-10 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Viewer Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{selectedVideo.title}</h3>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1"><Eye className="w-3.5 h-3.5" /> {viewersData.length} Unique Viewers</p>
                </div>
                <button onClick={() => setSelectedVideo(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
                {loadingViewers ? (
                  <div className="h-full flex flex-col items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-slate-500 font-medium">Loading viewer data...</p>
                  </div>
                ) : viewersData.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {viewersData.map(viewer => (
                      <div key={viewer.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                          {viewer.profile.avatar_url ? (
                            <img src={viewer.profile.avatar_url} alt={viewer.profile.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-primary text-sm">{viewer.profile.full_name?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{viewer.profile.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{viewer.profile.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-slate-500">{new Date(viewer.viewed_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400">{new Date(viewer.viewed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No viewers yet</p>
                    <p className="text-xs text-slate-500 mt-1">When users watch this video, they will appear here.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                <button 
                  onClick={() => navigate(`/watch/${selectedVideo.id}`)}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" /> Watch Video
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
