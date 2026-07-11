import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { BarChart3, TrendingUp, Eye, Heart, MessageSquare, Clock, ArrowLeft, Video, Target, Users } from 'lucide-react';

function StatCard({ icon: Icon, color, value, label, trend }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border hover:border-white/12 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-foreground" />
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
      // Fetch user's videos
      const { data: videos } = await supabase.from('clipad_videos').select('id, title, created_at, duration_seconds').eq('creator_id', user.id);
      
      if (!videos || videos.length === 0) {
        setLoading(false);
        return;
      }

      const videoIds = videos.map(v => v.id);

      // Fetch views for those videos
      const { data: views } = await supabase.from('clipad_video_views').select('video_id, watch_percent, created_at').in('video_id', videoIds);
      
      // Fetch comments for those videos
      const { count: commentsCount } = await supabase.from('clipad_video_comments').select('id', { count: 'exact', head: true }).in('video_id', videoIds);
      
      // Fetch reactions for those videos
      const { count: reactionsCount } = await supabase.from('clipad_video_reactions').select('id', { count: 'exact', head: true }).in('video_id', videoIds);

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
        totalVideos: videos.length,
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
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
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

  // Max value for chart scaling
  const maxViews = Math.max(10, ...stats.recentViews.map(d => d.count));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter text-foreground">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-background page-enter/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Video className="w-4 h-4 text-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">CliPad</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-0.5"><ArrowLeft className="w-4 h-4 text-slate-500" /> Dashboard</button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-foreground mb-1 flex items-center gap-3"><BarChart3 className="w-7 h-7 text-emerald-500" /> Analytics</h1>
          <p className="text-muted-foreground text-sm">See how your team interacts with your video recordings.</p>
        </div>

        {stats.totalVideos === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-3xl">
            <BarChart3 className="w-16 h-16 text-gray-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground mb-2">No data yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Record a video and share it to start collecting analytics.</p>
            <button onClick={() => navigate('/record')} className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-foreground font-semibold text-sm transition-all">Record Video</button>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Eye} color="from-indigo-500 to-violet-500" value={stats.totalViews} label="Total Views" trend={14} />
              <StatCard icon={Video} color="from-cyan-500 to-blue-500" value={stats.totalVideos} label="Videos Recorded" />
              <StatCard icon={MessageSquare} color="from-pink-500 to-rose-500" value={stats.totalComments} label="Comments" trend={8} />
              <StatCard icon={Heart} color="from-amber-500 to-orange-500" value={stats.totalReactions} label="Reactions" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-bold text-foreground text-lg">Views over time</h2>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-indigo-500/20">Active</div>
                </div>
                
                <div className="h-64 flex items-end justify-between gap-2">
                  {stats.recentViews.map((day, i) => {
                    const heightPercent = Math.max((day.count / maxViews) * 100, 4); // min 4% for visibility
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full flex-1 flex items-end justify-center relative">
                          <div 
                            className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600/40 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:from-indigo-500 group-hover:to-indigo-400 relative group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            style={{ height: `${heightPercent}%` }}
                          >
                            {/* Tooltip on hover */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {day.count} views
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Videos List */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="font-bold text-foreground text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" /> Top Videos</h2>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                  {stats.topVideos.map((v, i) => (
                    <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="p-5 hover:bg-secondary cursor-pointer transition-colors group flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors mb-1">{v.title || 'Untitled Video'}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {v.viewCount} views</span>
                          {/* <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {v.avgCompletion}% avg completion</span> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
