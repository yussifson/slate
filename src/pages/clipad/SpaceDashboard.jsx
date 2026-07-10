import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import {
  Users, Video, Calendar, Plus, Play, Monitor, Activity,
  Brain, FileText, CheckCircle, Search, Settings, ArrowLeft,
  Clock, MessageSquare, Sparkles, Camera, Layers, Target,
  ChevronRight, X, Edit3, Trash2, User
} from 'lucide-react';
import SpaceNotes from '@/components/clipad/SpaceNotes';
import MeetingInsights from '@/components/clipad/MeetingInsights';

const TABS = [
  { id: 'overview', icon: Layers, label: 'Overview' },
  { id: 'videos', icon: Camera, label: 'Videos' },
  { id: 'meetings', icon: Calendar, label: 'Meetings' },
  { id: 'tasks', icon: CheckCircle, label: 'Action Items' },
  { id: 'notes', icon: FileText, label: 'Notes' },
];

const COLORS = ['from-indigo-500 to-violet-500','from-cyan-500 to-blue-500','from-pink-500 to-rose-500','from-emerald-500 to-teal-500','from-amber-500 to-orange-500'];

function TaskRow({ item, onToggle }) {
  const [done, setDone] = useState(item.is_complete);
  const handle = async () => {
    const next = !done;
    setDone(next);
    await supabase.from('clipad_action_items').update({ is_complete: next }).eq('id', item.id);
    onToggle?.(item.id, next);
  };
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-white/[0.03] transition-colors group">
      <button onClick={handle} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-indigo-400'}`}>
        {done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-gray-600' : 'text-gray-200'}`}>{item.title}</p>
        <div className="flex items-center gap-3 mt-1">
          {item.assigned_to && <span className="text-xs text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> {item.assigned_to}</span>}
          {item.due_date && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.due_date).toLocaleDateString()}</span>}
        </div>
      </div>
      {item.context && (
        <span className="hidden group-hover:block text-[10px] text-gray-600 max-w-[140px] text-right line-clamp-2">{item.context}</span>
      )}
    </div>
  );
}

function VideoCard({ video, onClick }) {
  return (
    <div onClick={onClick} className="group cursor-pointer rounded-2xl overflow-hidden bg-[#0D1117] border border-white/[0.06] hover:border-white/12 transition-all hover:-translate-y-0.5">
      <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center">
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} className="w-full h-full object-cover" alt={video.title} />
          : <Camera className="w-8 h-8 text-gray-700" />
        }
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
            {Math.floor(video.duration_seconds/60)}:{String(video.duration_seconds%60).padStart(2,'0')}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-white line-clamp-1">{video.title || 'Untitled'}</p>
        <p className="text-xs text-gray-500 mt-1">{new Date(video.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default function SpaceDashboard() {
  const { spaceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => { if (spaceId) fetchAll(); }, [spaceId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [spaceRes, videosRes, meetingsRes, tasksRes] = await Promise.all([
        supabase.from('clipad_spaces').select('*').eq('id', spaceId).single(),
        supabase.from('clipad_videos').select('*, creator:creator_id(full_name, avatar_url)').eq('space_id', spaceId).order('created_at', { ascending: false }).limit(12),
        supabase.from('clipad_meeting_records').select('*').eq('space_id', spaceId).order('created_at', { ascending: false }).limit(20),
        supabase.from('clipad_action_items').select('*').eq('space_id', spaceId).order('created_at', { ascending: false }),
      ]);
      if (spaceRes.data) setSpace(spaceRes.data);
      if (videosRes.data) setVideos(videosRes.data);
      if (meetingsRes.data) {
        setMeetings(meetingsRes.data);
        // Check if any meeting happened within last 2 hours
        const recent = meetingsRes.data[0];
        if (recent && Date.now() - new Date(recent.created_at).getTime() < 7200000) {
          setIsLive(true);
        }
      }
      if (tasksRes.data) setTasks(tasksRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleJoinMeeting = async () => {
    try {
      const { data } = await supabase.functions.invoke('create-daily-room', { body: { instant: true } });
      if (data?.name) {
        // Update space with room info
        await supabase.from('clipad_spaces').update({ meeting_url: data.url }).eq('id', spaceId);
        navigate(`/join/${data.name}`);
      }
    } catch { navigate(`/join/${spaceId}`); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;
    setCreatingTask(true);
    try {
      const { data, error } = await supabase.from('clipad_action_items').insert({
        space_id: spaceId,
        assigned_to: user.id,
        title: newTaskTitle.trim(),
        is_complete: false,
      }).select().single();
      if (error) throw error;
      setTasks(prev => [data, ...prev]);
      setNewTaskTitle('');
      setShowNewTask(false);
    } catch (err) { console.error(err); }
    finally { setCreatingTask(false); }
  };

  const colorIndex = space?.name?.charCodeAt(0) % COLORS.length || 0;
  const color = COLORS[colorIndex];

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#050A15] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!space) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#050A15] flex items-center justify-center text-white">
        <div className="text-center">
          <Layers className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Space not found.</p>
          <button onClick={() => navigate('/spaces')} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">← Back to Spaces</button>
        </div>
      </div>
    );
  }

  const openTasks = tasks.filter(t => !t.is_complete);
  const doneTasks = tasks.filter(t => t.is_complete);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#050A15] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-[#050A15]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/spaces')} className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-sm font-bold`}>{space.name?.[0]}</div>
          <span className="font-semibold text-white">{space.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/record')} className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-2">
            <Camera className="w-4 h-4" /> Record
          </button>
          <button
            onClick={handleJoinMeeting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${isLive ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25 animate-pulse' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25'}`}
          >
            {isLive ? <Activity className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            {isLive ? 'Join Live' : 'Start Meeting'}
          </button>
        </div>
      </nav>

      {/* Space header */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
        <div className="relative px-6 md:px-10 py-8">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl font-black shadow-xl shrink-0`}>{space.name?.[0]}</div>
            <div>
              <h1 className="text-2xl font-black text-white">{space.name}</h1>
              <p className="text-gray-400 mt-1">{space.description || 'A shared space for meetings, videos, and collaboration.'}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {meetings.length} meetings</span>
                <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> {videos.length} videos</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {openTasks.length} open tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-6 md:px-10 border-b border-white/5">
        <div className="flex gap-1 -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/20'}`}
              >
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <MeetingInsights spaceId={spaceId} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Videos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-white flex items-center gap-2"><Camera className="w-4 h-4 text-cyan-400" /> Recent Videos</h2>
                  <button onClick={() => setActiveTab('videos')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</button>
                </div>
                {videos.length === 0
                  ? <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-gray-600 text-sm">No videos yet. <button className="text-cyan-400 hover:text-cyan-300 transition-colors" onClick={() => navigate('/record')}>Record one →</button></div>
                  : <div className="grid grid-cols-2 gap-3">{videos.slice(0,4).map(v => <VideoCard key={v.id} video={v} onClick={() => navigate(`/watch/${v.id}`)} />)}</div>
                }
              </div>

              {/* Recent Meetings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400" /> Recent Meetings</h2>
                  <button onClick={() => setActiveTab('meetings')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</button>
                </div>
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl divide-y divide-white/5 overflow-hidden">
                  {meetings.length === 0
                    ? <div className="p-8 text-center text-gray-600 text-sm">No meetings yet.</div>
                    : meetings.slice(0,5).map(m => (
                        <div key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} className="px-5 py-4 hover:bg-white/[0.03] cursor-pointer transition-colors">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{m.title || 'Team Meeting'}</p>
                            {m.ai_summary && <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{new Date(m.created_at).toLocaleString()}</p>
                          {m.ai_summary && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.ai_summary}</p>}
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIDEOS */}
        {activeTab === 'videos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{videos.length} Videos</h2>
              <button onClick={() => navigate('/record')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg transition-all">
                <Camera className="w-4 h-4" /> Record New
              </button>
            </div>
            {videos.length === 0 ? (
              <div className="text-center py-20">
                <Camera className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No videos in this space yet.</p>
                <button onClick={() => navigate('/record')} className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all">Record Async Video</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map(v => <VideoCard key={v.id} video={v} onClick={() => navigate(`/watch/${v.id}`)} />)}
              </div>
            )}
          </div>
        )}

        {/* MEETINGS */}
        {activeTab === 'meetings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{meetings.length} Meetings</h2>
              <button onClick={handleJoinMeeting} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg transition-all">
                <Video className="w-4 h-4" /> Start Meeting
              </button>
            </div>
            {meetings.length === 0 ? (
              <div className="text-center py-20">
                <Calendar className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                <p className="text-gray-500">No meeting records yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map(m => (
                  <div key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} className="p-5 rounded-2xl bg-[#111827] border border-white/[0.06] hover:border-white/12 cursor-pointer transition-all group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{m.title || 'Team Meeting'}</h3>
                          {m.ai_summary && <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-semibold flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> AI Summary</span>}
                        </div>
                        <p className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</p>
                        {m.ai_summary && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{m.ai_summary}</p>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTION ITEMS */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{openTasks.length} Open Actions</h2>
                <p className="text-sm text-gray-500 mt-0.5">{doneTasks.length} completed</p>
              </div>
              <button onClick={() => setShowNewTask(!showNewTask)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg transition-all">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>

            {showNewTask && (
              <form onSubmit={addTask} className="mb-4 flex gap-3">
                <input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                  autoFocus
                />
                <button type="submit" disabled={creatingTask} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all disabled:opacity-60">Add</button>
                <button type="button" onClick={() => setShowNewTask(false)} className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/8 text-gray-400 transition-all"><X className="w-4 h-4" /></button>
              </form>
            )}

            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/5">
              {tasks.length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-800 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No action items yet. Add one or start a meeting to generate them automatically.</p>
                </div>
              ) : (
                tasks.map(item => <TaskRow key={item.id} item={item} onToggle={(id, val) => setTasks(prev => prev.map(t => t.id === id ? { ...t, is_complete: val } : t))} />)
              )}
            </div>
          </div>
        )}

        {/* NOTES */}
        {activeTab === 'notes' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-400" /> Shared Notes</h2>
            <SpaceNotes spaceId={spaceId} />
          </div>
        )}

      </div>
    </div>
  );
}
