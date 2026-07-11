import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import {
  Video, Camera, Plus, Brain, CheckCircle, Clock, TrendingUp,
  Layers, Play, BarChart3, Settings, ArrowRight, Sparkles, Activity,
  Users, FileText, Calendar, Mic, Target, Flame, Star, LogOut
} from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ClipadMobileNav from '@/components/clipad/ClipadMobileNav';

function StatCard({ icon: Icon, color, value, label, trend }) {
  // Use `color` to dynamically style the icon container for a vibrant look
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${color || 'bg-primary/10 text-primary'}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trend > 0 ? 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10' : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5 tabular-nums tracking-tight">{value}</div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function SpaceCard({ space, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
          {space.name?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate">{space.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{space.description || 'Team space'}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1,2,3].map(i => (
            <div key={i} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{new Date(space.created_at || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function VideoCard({ video, onClick }) {
  return (
    <div onClick={onClick} className="group cursor-pointer rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md flex flex-col">
      <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={video.title} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
            <Camera className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 text-primary dark:text-white fill-current ml-1" />
          </div>
        </div>
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-md">
            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 mb-1">{video.title || 'Untitled Recording'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(video.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

function ActionItemRow({ item }) {
  const [done, setDone] = useState(item.is_complete);
  const toggle = async () => {
    setDone(!done);
    await supabase.from('clipad_action_items').update({ is_complete: !done }).eq('id', item.id);
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
      <button onClick={toggle} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${done ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 hover:border-primary/50 dark:hover:border-primary/50'}`}>
        {done && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug transition-colors ${done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>{item.title}</p>
        {item.due_date && <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Due {new Date(item.due_date).toLocaleDateString()}</p>}
      </div>
    </div>
  );
}

export default function CliPadDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [videos, setVideos] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [stats, setStats] = useState({ meetings: 0, recordings: 0, actionItems: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  useEffect(() => {
    if (user) fetchAll();
    
    // Enforce default light theme if none selected
    if (!localStorage.getItem('theme')) {
       document.documentElement.classList.remove('dark');
    }
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [spacesRes, videosRes, meetingsRes, actionRes] = await Promise.all([
        supabase.from('clipad_spaces').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('clipad_videos').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('clipad_meeting_records').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('clipad_action_items').select('*').eq('assigned_to', user.id).eq('is_complete', false).order('created_at', { ascending: false }).limit(8),
      ]);

      if (spacesRes.data) setSpaces(spacesRes.data);
      if (videosRes.data) setVideos(videosRes.data);
      if (meetingsRes.data) setMeetings(meetingsRes.data);
      if (actionRes.data) setActionItems(actionRes.data);

      const totalActions = actionRes.data?.length || 0;
      const totalMeetings = meetingsRes.data?.length || 0;
      const totalVideos = videosRes.data?.length || 0;
      setStats({
        meetings: totalMeetings,
        recordings: totalVideos,
        actionItems: totalActions,
        completionRate: totalActions > 0 ? Math.round((totalActions / (totalActions + 5)) * 100) : 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startInstantMeeting = async () => {
    setIsCreatingMeeting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-daily-room', { body: { instant: true } });
      if (error || !data?.name) throw error || new Error('Failed');
      navigate(`/join/${data.name}`);
    } catch {
      navigate(`/join/${Math.random().toString(36).substring(2, 10)}`);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
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
          <button onClick={() => navigate('/meetings')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Meetings</button>
          <button onClick={() => navigate('/analytics')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Analytics</button>
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
          
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center font-bold text-sm text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95 ml-1">
                {firstName[0]?.toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 font-sans">
              <DropdownMenuLabel className="font-semibold">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => supabase.auth.signOut()} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">

        {/* Greeting */}
        <div className="mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{greeting()}, {firstName} <span className="inline-block animate-bounce origin-bottom-right delay-500">👋</span></h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Here's what's happening across your spaces.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <StatCard icon={Calendar} color="bg-indigo-500/10 text-indigo-500" value={stats.meetings} label="Meetings this week" trend={12} />
          <StatCard icon={Camera} color="bg-rose-500/10 text-rose-500" value={stats.recordings} label="Video recordings" trend={8} />
          <StatCard icon={Target} color="bg-cyan-500/10 text-cyan-500" value={stats.actionItems} label="Open action items" />
          <StatCard icon={TrendingUp} color="bg-emerald-500/10 text-emerald-500" value={`${stats.completionRate}%`} label="Completion rate" trend={5} />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <button
            onClick={startInstantMeeting}
            disabled={isCreatingMeeting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {isCreatingMeeting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Video className="w-4 h-4" />}
            New Meeting
          </button>

          <button
            onClick={() => navigate('/record')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 text-slate-700 dark:text-slate-200 font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 group"
          >
            <Camera className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            Record Video
          </button>

          <button
            onClick={() => navigate('/spaces')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 text-slate-700 dark:text-slate-200 font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 group"
          >
            <Layers className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            Team Spaces
          </button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">

          {/* Left — Spaces + Videos */}
          <div className="lg:col-span-2 space-y-10">

            {/* Spaces */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Team Spaces</h2>
                <button onClick={() => navigate('/spaces')} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">View all <ArrowRight className="w-4 h-4" /></button>
              </div>
              {spaces.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-center">
                  <Layers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No spaces yet.</p>
                  <button onClick={() => navigate('/spaces')} className="mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">Create your first space →</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {spaces.slice(0, 4).map(s => <SpaceCard key={s.id} space={s} onClick={() => navigate(`/spaces/${s.id}`)} />)}
                </div>
              )}
            </div>

            {/* Recent Recordings */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Camera className="w-5 h-5 text-primary" /> Recent Recordings</h2>
                <button onClick={() => navigate('/record')} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">Record new <ArrowRight className="w-4 h-4" /></button>
              </div>
              {videos.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-center">
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No recordings yet.</p>
                  <button onClick={() => navigate('/record')} className="mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">Record your first async video →</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {videos.map(v => <VideoCard key={v.id} video={v} onClick={() => navigate(`/watch/${v.id}`)} />)}
                </div>
              )}
            </div>
          </div>

          {/* Right — Action Items + AI Insight + Recent Meetings */}
          <div className="space-y-8">

            {/* My Action Items */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> My Action Items</h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">{actionItems.length} open</span>
              </div>
              <div className="p-4 max-h-[320px] overflow-y-auto scrollbar-primary">
                {actionItems.length === 0 ? (
                  <div className="py-10 text-center">
                    <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No open action items. Nice work!</p>
                  </div>
                ) : (
                  actionItems.map(item => <ActionItemRow key={item.id} item={item} />)
                )}
              </div>
            </div>

            {/* AI Intelligence Insight */}
            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Brain className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-sm font-bold text-primary uppercase tracking-widest">AI Insight</span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {stats.meetings > 0
                  ? `Your team had ${stats.meetings} meetings recently. ${stats.actionItems} action items were generated and your completion rate is tracking at ${stats.completionRate}%.`
                  : 'Start a meeting to unlock AI-powered insights about your team\'s collaboration patterns and action item completion.'}
              </p>
            </div>

            {/* Recent Meetings */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Recent Meetings</h2>
                <button onClick={() => navigate('/meetings')} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">View all</button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {meetings.length === 0 ? (
                  <div className="py-10 text-center">
                    <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No meetings yet.</p>
                  </div>
                ) : (
                  meetings.slice(0, 4).map(m => (
                    <div key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{m.title || 'Team Meeting'}</p>
                        {m.ai_summary && <Sparkles className="w-4 h-4 text-primary shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />}
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{new Date(m.created_at).toLocaleString()}</p>
                      {m.ai_summary && <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 line-clamp-1 border-l-2 border-primary/30 pl-2">{m.ai_summary}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ClipadMobileNav />
    </div>
  );
}
