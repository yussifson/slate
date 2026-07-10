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
    <div className="p-6 rounded-2xl bg-[#111827] border border-white/[0.06] hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function SpaceCard({ space, onClick }) {
  const colors = ['from-indigo-500 to-violet-500', 'from-cyan-500 to-blue-500', 'from-pink-500 to-rose-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500'];
  const color = colors[space.name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div
      onClick={onClick}
      className="group p-5 rounded-2xl bg-[#111827] border border-white/[0.06] hover:border-white/12 cursor-pointer transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
          {space.name?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{space.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{space.description || 'Team space'}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1,2,3].map(i => (
            <div key={i} className={`w-6 h-6 rounded-full bg-gradient-to-br ${colors[i % colors.length]} border-2 border-[#111827] flex items-center justify-center text-[9px] font-bold text-white`}>
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-600 font-mono">{new Date(space.created_at || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function VideoCard({ video, onClick }) {
  return (
    <div onClick={onClick} className="group cursor-pointer rounded-2xl overflow-hidden bg-[#111827] border border-white/[0.06] hover:border-white/12 transition-all hover:-translate-y-0.5">
      <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center overflow-hidden">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} className="w-full h-full object-cover" alt={video.title} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-700">
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
        <p className="text-xs font-semibold text-white line-clamp-1">{video.title || 'Untitled Recording'}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{new Date(video.created_at).toLocaleDateString()}</p>
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
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
      <button onClick={toggle} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-indigo-400'}`}>
        {done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-gray-600' : 'text-gray-200'}`}>{item.title}</p>
        {item.due_date && <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(item.due_date).toLocaleDateString()}</p>}
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
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#050A15] text-white">
      {/* Fixed top nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-[#050A15]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">CliPad</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/spaces')} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Spaces</button>
          <button onClick={() => navigate('/meetings')} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Meetings</button>
          <button onClick={() => navigate('/analytics')} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Analytics</button>
          <button onClick={() => navigate('/settings')} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm cursor-pointer">
            {firstName[0]?.toUpperCase()}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">

        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-1">{greeting()}, {firstName} 👋</h1>
          <p className="text-gray-400">Here's what's happening across your spaces.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <button
            onClick={startInstantMeeting}
            disabled={isCreatingMeeting}
            className="group p-5 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-violet-600/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all text-left hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              {isCreatingMeeting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Video className="w-5 h-5 text-white" />}
            </div>
            <h3 className="font-bold text-white mb-1">New Meeting</h3>
            <p className="text-xs text-indigo-300/70">Start an instant HD meeting</p>
          </button>

          <button
            onClick={() => navigate('/record')}
            className="group p-5 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/15 border border-cyan-500/20 hover:border-cyan-500/40 transition-all text-left hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white mb-1">Record Video</h3>
            <p className="text-xs text-cyan-300/70">Camera, screen, or picture-in-picture</p>
          </button>

          <button
            onClick={() => navigate('/spaces')}
            className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/15 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-left hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white mb-1">Create Space</h3>
            <p className="text-xs text-emerald-300/70">Persistent team room</p>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Calendar} color="from-indigo-500 to-violet-500" value={stats.meetings} label="Meetings this week" trend={12} />
          <StatCard icon={Camera} color="from-cyan-500 to-blue-500" value={stats.recordings} label="Video recordings" trend={8} />
          <StatCard icon={Target} color="from-pink-500 to-rose-500" value={stats.actionItems} label="Open action items" />
          <StatCard icon={TrendingUp} color="from-emerald-500 to-teal-500" value={`${stats.completionRate}%`} label="Completion rate" trend={5} />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — Spaces + Videos */}
          <div className="lg:col-span-2 space-y-8">

            {/* Spaces */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-400" /> Team Spaces</h2>
                <button onClick={() => navigate('/spaces')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">View all <ArrowRight className="w-3 h-3" /></button>
              </div>
              {spaces.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center">
                  <Layers className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No spaces yet.</p>
                  <button onClick={() => navigate('/spaces')} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Create your first space →</button>
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
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Camera className="w-5 h-5 text-cyan-400" /> Recent Recordings</h2>
                <button onClick={() => navigate('/record')} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">Record new <ArrowRight className="w-3 h-3" /></button>
              </div>
              {videos.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center">
                  <Camera className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No recordings yet.</p>
                  <button onClick={() => navigate('/record')} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Record your first async video →</button>
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
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="font-bold text-white text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> My Action Items</h2>
                <span className="text-xs text-gray-500">{actionItems.length} open</span>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto">
                {actionItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <Star className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">No open action items. Nice work!</p>
                  </div>
                ) : (
                  actionItems.map(item => <ActionItemRow key={item.id} item={item} />)
                )}
              </div>
            </div>

            {/* AI Intelligence Insight */}
            <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">AI Insight</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {stats.meetings > 0
                  ? `Your team had ${stats.meetings} meetings recently. ${stats.actionItems} action items were generated and your completion rate is tracking at ${stats.completionRate}%.`
                  : 'Start a meeting to unlock AI-powered insights about your team\'s collaboration patterns and action item completion.'}
              </p>
            </div>

            {/* Recent Meetings */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="font-bold text-white text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400" /> Recent Meetings</h2>
                <button onClick={() => navigate('/meetings')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all</button>
              </div>
              <div className="divide-y divide-white/5">
                {meetings.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">No meetings yet.</p>
                  </div>
                ) : (
                  meetings.slice(0, 4).map(m => (
                    <div key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} className="px-5 py-3.5 hover:bg-white/[0.03] cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-white">{m.title || 'Team Meeting'}</p>
                        {m.ai_summary && <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</p>
                      {m.ai_summary && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{m.ai_summary}</p>}
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
