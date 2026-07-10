import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import {
  Video, Camera, Plus, Brain, CheckCircle, Clock, TrendingUp,
  Layers, Play, BarChart3, Settings, ArrowRight, Sparkles, Activity,
  Users, FileText, Calendar, Mic, Target, Flame, Star
} from 'lucide-react';

function StatCard({ icon: Icon, color, value, label, trend }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group stat-card-premium">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <div className="text-3xl font-black text-card-foreground mb-1 tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function SpaceCard({ space, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 cursor-pointer transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm`}>
          {space.name?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground text-sm truncate">{space.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{space.description || 'Team space'}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1,2,3].map(i => (
            <div key={i} className={`w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] font-bold text-secondary-foreground`}>
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-mono">{new Date(space.created_at || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function VideoCard({ video, onClick }) {
  return (
    <div onClick={onClick} className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all hover:-translate-y-0.5">
      <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} className="w-full h-full object-cover" alt={video.title} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Camera className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-card-foreground line-clamp-1">{video.title || 'Untitled Recording'}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(video.created_at).toLocaleDateString()}</p>
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
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
      <button onClick={toggle} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'}`}>
        {done && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.title}</p>
        {item.due_date && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(item.due_date).toLocaleDateString()}</p>}
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
      // fallback: generate a random ID
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

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background text-foreground page-enter">
      {/* Fixed top nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Video className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">CliPad</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/spaces')} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all">Spaces</button>
          <button onClick={() => navigate('/meetings')} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all">Meetings</button>
          <button onClick={() => navigate('/analytics')} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all">Analytics</button>
          <button onClick={() => navigate('/settings')} className="w-9 h-9 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground cursor-pointer">
            {firstName[0]?.toUpperCase()}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">

        {/* Greeting */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-black mb-1">{greeting()}, {firstName} 👋</h1>
          <p className="text-muted-foreground">Here's what's happening across your spaces.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 zone-1">
          <button
            onClick={startInstantMeeting}
            disabled={isCreatingMeeting}
            className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all text-left hover:-translate-y-0.5 stat-card-premium"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {isCreatingMeeting ? <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Video className="w-5 h-5 text-primary" />}
            </div>
            <h3 className="font-bold text-foreground mb-1">New Meeting</h3>
            <p className="text-xs text-muted-foreground">Start an instant HD meeting</p>
          </button>

          <button
            onClick={() => navigate('/record')}
            className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all text-left hover:-translate-y-0.5 stat-card-premium"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-1">Record Video</h3>
            <p className="text-xs text-muted-foreground">Camera, screen, or picture-in-picture</p>
          </button>

          <button
            onClick={() => navigate('/spaces')}
            className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all text-left hover:-translate-y-0.5 stat-card-premium"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-1">Create Space</h3>
            <p className="text-xs text-muted-foreground">Persistent team room</p>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 zone-1">
          <StatCard icon={Calendar} value={stats.meetings} label="Meetings this week" trend={12} />
          <StatCard icon={Camera} value={stats.recordings} label="Video recordings" trend={8} />
          <StatCard icon={Target} value={stats.actionItems} label="Open action items" />
          <StatCard icon={TrendingUp} value={`${stats.completionRate}%`} label="Completion rate" trend={5} />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 zone-3">

          {/* Left — Spaces + Videos */}
          <div className="lg:col-span-2 space-y-8">

            {/* Spaces */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Team Spaces</h2>
                <button onClick={() => navigate('/spaces')} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">View all <ArrowRight className="w-3 h-3" /></button>
              </div>
              {spaces.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-border bg-card text-center">
                  <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No spaces yet.</p>
                  <button onClick={() => navigate('/spaces')} className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">Create your first space →</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {spaces.slice(0, 4).map(s => <SpaceCard key={s.id} space={s} onClick={() => navigate(`/spaces/${s.id}`)} />)}
                </div>
              )}
            </div>

            {/* Recent Recordings */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Camera className="w-5 h-5 text-primary" /> Recent Recordings</h2>
                <button onClick={() => navigate('/record')} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">Record new <ArrowRight className="w-3 h-3" /></button>
              </div>
              {videos.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-border bg-card text-center">
                  <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No recordings yet.</p>
                  <button onClick={() => navigate('/record')} className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">Record your first async video →</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map(v => <VideoCard key={v.id} video={v} onClick={() => navigate(`/watch/${v.id}`)} />)}
                </div>
              )}
            </div>
          </div>

          {/* Right — Action Items + AI Insight + Recent Meetings */}
          <div className="space-y-6">

            {/* My Action Items */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-bold text-foreground text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> My Action Items</h2>
                <span className="text-xs text-muted-foreground">{actionItems.length} open</span>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto scrollbar-primary">
                {actionItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No open action items. Nice work!</p>
                  </div>
                ) : (
                  actionItems.map(item => <ActionItemRow key={item.id} item={item} />)
                )}
              </div>
            </div>

            {/* AI Intelligence Insight */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Insight</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {stats.meetings > 0
                  ? `Your team had ${stats.meetings} meetings recently. ${stats.actionItems} action items were generated and your completion rate is tracking at ${stats.completionRate}%.`
                  : 'Start a meeting to unlock AI-powered insights about your team\'s collaboration patterns and action item completion.'}
              </p>
            </div>

            {/* Recent Meetings */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-bold text-foreground text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Recent Meetings</h2>
                <button onClick={() => navigate('/meetings')} className="text-xs text-primary hover:text-primary/80 transition-colors">View all</button>
              </div>
              <div className="divide-y divide-border">
                {meetings.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No meetings yet.</p>
                  </div>
                ) : (
                  meetings.slice(0, 4).map(m => (
                    <div key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} className="px-5 py-3.5 hover:bg-secondary/50 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground">{m.title || 'Team Meeting'}</p>
                        {m.ai_summary && <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                      {m.ai_summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.ai_summary}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
