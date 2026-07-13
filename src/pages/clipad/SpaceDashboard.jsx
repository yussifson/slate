import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { getLimit } from '@/lib/clipadPricing';
import { useAuth } from '@/lib/AuthContext';
import {
  Users, Video, Calendar, Plus, Play, Monitor, Activity,
  Brain, FileText, CheckCircle, Search, Settings, ArrowLeft,
  Clock, MessageSquare, Sparkles, Camera, Layers, Target,
  ChevronRight, X, Edit3, Trash2, User, Lock, ShieldAlert
} from 'lucide-react';
import SpaceNotes from '@/components/clipad/SpaceNotes';
import MeetingInsights from '@/components/clipad/MeetingInsights';
import { getSpaceIcon } from '@/utils/spaceIcons';
import ClipadLoader from '@/components/ui/ClipadLoader';
import { useToast } from '@/components/ui/use-toast';
import TaskBoard from '@/components/clipad/tasks/TaskBoard';
import SpaceChat from '@/components/clipad/chat/SpaceChat';
import SpaceDocs from '@/components/clipad/docs/SpaceDocs';
import SpaceCalendar from '@/components/clipad/calendar/SpaceCalendar';
import CanvasWhiteboard from '@/components/clipad/CanvasWhiteboard';
import SpaceAutomations from '@/components/clipad/SpaceAutomations';
import DecisionLedger from '@/components/clipad/features/DecisionLedger';
import ContextCapsule from '@/components/clipad/features/ContextCapsule';
import BlockerRadar from '@/components/clipad/features/BlockerRadar';
import RedundantWorkAlert from '@/components/clipad/features/RedundantWorkAlert';
import CommitmentTracker from '@/components/clipad/features/CommitmentTracker';

const TABS = [
  { id: 'overview', icon: Layers, label: 'Overview' },
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'videos', icon: Camera, label: 'Videos' },
  { id: 'meetings', icon: Calendar, label: 'Meetings' },
  { id: 'tasks', icon: CheckCircle, label: 'Action Board' },
  { id: 'decisions', icon: ShieldAlert, label: 'Decisions' },
  { id: 'docs', icon: FileText, label: 'Docs' },
  { id: 'canvas', icon: Sparkles, label: 'Canvas' },
  { id: 'automations', icon: Settings, label: 'Automations' },
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
    <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-secondary transition-colors group">
      <button onClick={handle} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-primary'}`}>
        {done && <CheckCircle className="w-3.5 h-3.5 text-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-muted-foreground' : 'text-gray-200'}`}>{item.title}</p>
        <div className="flex items-center gap-3 mt-1">
          {item.assignedUser?.full_name && <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> {item.assignedUser.full_name}</span>}
          {item.due_date && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.due_date).toLocaleDateString()}</span>}
        </div>
      </div>
      {item.context && (
        <span className="hidden group-hover:block text-[10px] text-muted-foreground max-w-[140px] text-right line-clamp-2">{item.context}</span>
      )}
    </div>
  );
}

const getVideoColor = (id) => {
  const colors = [
    'from-blue-500 to-blue-700', 
    'from-indigo-500 to-indigo-700', 
    'from-purple-500 to-purple-700', 
    'from-fuchsia-500 to-fuchsia-700',
    'from-rose-500 to-rose-700', 
    'from-orange-500 to-orange-700', 
    'from-emerald-500 to-emerald-700', 
    'from-cyan-500 to-cyan-700'
  ];
  if (!id) return colors[0];
  const charCodeSum = String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
};

function VideoCard({ video, onClick }) {
  return (
    <div onClick={onClick} className="group cursor-pointer rounded-2xl overflow-hidden bg-[#0D1117] border border-border hover:border-white/12 transition-all hover:-translate-y-0.5">
      <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={video.title} />
        ) : (
          <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${getVideoColor(video.id)} group-hover:scale-105 transition-transform duration-500 opacity-90`}>
          </div>
        )}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 text-primary dark:text-white fill-current ml-1" />
          </div>
        </div>
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-foreground text-[10px] font-mono px-2 py-0.5 rounded">
            {Math.floor(video.duration_seconds/60)}:{String(video.duration_seconds%60).padStart(2,'0')}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-foreground line-clamp-1">{video.title || 'Untitled'}</p>
        <p className="text-xs text-muted-foreground mt-1">{new Date(video.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default function SpaceDashboard() {
  const { spaceId } = useParams();
  const { user, isLoadingAuth } = useAuth();
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
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [spaceMembers, setSpaceMembers] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const { toast } = useToast();

  useEffect(() => { if (spaceId) fetchAll(); }, [spaceId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [spaceRes, videosRes, meetingsRes, tasksRes, membersRes, profilesRes] = await Promise.all([
        supabase.from('clipad_spaces').select('*').eq('id', spaceId).single(),
        supabase.from('clipad_videos').select('*, creator:creator_id(full_name, avatar_url)').eq('space_id', spaceId).order('created_at', { ascending: false }).limit(12),
        supabase.from('clipad_meeting_records').select('*').eq('space_id', spaceId).order('created_at', { ascending: false }).limit(20),
        supabase.from('clipad_action_items').select('*, assignedUser:assigned_to(full_name)').eq('space_id', spaceId).order('created_at', { ascending: false }),
        supabase.from('clipad_space_members').select('*').eq('space_id', spaceId),
        supabase.from('profiles').select('id, full_name, email, avatar_url').eq('company_id', user.company_id)
      ]);
      if (spaceRes.data) {
        setSpace(spaceRes.data);
        setEditName(spaceRes.data.name);
        setEditDesc(spaceRes.data.description || '');
        setEditIsPrivate(spaceRes.data.is_private || false);
      }
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
      if (membersRes.data) setSpaceMembers(membersRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleJoinMeeting = async () => {
    try {
      const { data } = await supabase.functions.invoke('create-daily-room', { body: { instant: true, max_participants: getLimit(user, 'maxParticipants') } });
      if (data?.name || data?.roomName) {
        // Update space with room info
        await supabase.from('clipad_spaces').update({ meeting_url: data.url }).eq('id', spaceId);
        navigate(`/join/${data.name || data.roomName}?spaceId=${spaceId}`);
      }
    } catch { navigate(`/join/${spaceId}?spaceId=${spaceId}`); }
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

  const handleEditSpace = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      const { data, error } = await supabase.from('clipad_spaces').update({
        name: editName.trim(),
        description: editDesc.trim(),
        is_private: editIsPrivate,
      }).eq('id', spaceId).select().single();
      if (error) throw error;
      setSpace(data);
      setShowEdit(false);
      toast({ title: 'Space updated successfully' });
    } catch (err) { console.error(err); }
    finally { setSavingEdit(false); }
  };

  const handleDeleteSpace = async () => {
    if (!window.confirm('Are you sure you want to delete this space? All associated videos and tasks will be removed. This cannot be undone.')) return;
    try {
      await supabase.from('clipad_spaces').delete().eq('id', spaceId);
      toast({ title: 'Space deleted' });
      navigate('/spaces');
    } catch (err) { console.error(err); }
  };

  const toggleMember = async (profileId) => {
    const isMember = spaceMembers.some(m => m.user_id === profileId);
    try {
      if (isMember) {
        await supabase.from('clipad_space_members').delete().match({ space_id: spaceId, user_id: profileId });
        setSpaceMembers(prev => prev.filter(m => m.user_id !== profileId));
      } else {
        const { data, error } = await supabase.from('clipad_space_members').insert({ space_id: spaceId, user_id: profileId }).select().single();
        if (error) throw error;
        if (data) setSpaceMembers(prev => [...prev, data]);
      }
    } catch (err) { console.error(err); }
  };

  const colorIndex = space?.name?.charCodeAt(0) % COLORS.length || 0;
  const color = COLORS[colorIndex];

  if (loading || isLoadingAuth) {
    return <ClipadLoader fullScreen text="Loading space dashboard..." />;
  }

  if (!space) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter flex items-center justify-center text-foreground">
        <div className="text-center">
          <Layers className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-muted-foreground">Space not found.</p>
          <button onClick={() => navigate('/spaces')} className="mt-4 text-primary hover:text-primary/80 text-sm transition-colors">← Back to Spaces</button>
        </div>
      </div>
    );
  }

  const openTasks = tasks.filter(t => !t.is_complete);
  const doneTasks = tasks.filter(t => t.is_complete);
  
  const isAdmin = user?.clipad_plan === 'enterprise' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'company_admin';
  const canEdit = space.created_by === user?.id || isAdmin;
  const isMember = spaceMembers.some(m => m.user_id === user?.id);

  if (space.is_private && !canEdit && !isMember) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter flex items-center justify-center text-foreground">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">Private Space</h2>
          <p className="text-muted-foreground text-sm">You don't have permission to view this space.</p>
          <button onClick={() => navigate('/spaces')} className="mt-4 text-primary hover:text-primary/80 text-sm transition-colors font-medium">← Back to Spaces</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter text-foreground overflow-x-hidden pb-24 md:pb-8">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-background page-enter/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/spaces')} className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-0.5"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm`}>
            {React.createElement(getSpaceIcon(space.name), { className: "w-4 h-4" })}
          </div>
          <span className="font-semibold text-foreground">{space.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/chat')} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button onClick={() => navigate('/record')} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all flex items-center gap-2">
            <Camera className="w-4 h-4" /> Record
          </button>
          <button
            onClick={handleJoinMeeting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${isLive ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25 animate-pulse' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'}`}
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
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-xl shrink-0`}>
              {React.createElement(getSpaceIcon(space.name), { className: "w-7 h-7" })}
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
                {space.name}
                {space.is_private && <Lock className="w-5 h-5 text-slate-400" />}
                {canEdit && (
                  <div className="flex items-center gap-2 ml-2 opacity-50 hover:opacity-100 transition-opacity">
                    <button onClick={() => setShowEdit(true)} className="p-1.5 hover:bg-white/20 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors" title="Edit Space">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={handleDeleteSpace} className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-500 transition-colors" title="Delete Space">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">{space.description || 'A shared space for meetings, videos, and collaboration.'}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {meetings.length} meetings</span>
                <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> {videos.length} videos</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {openTasks.length} open tasks</span>
                {space.is_private && canEdit && (
                  <button onClick={() => setShowMembers(true)} className="flex items-center gap-1 ml-2 text-primary hover:text-primary/80 font-semibold transition-colors">
                    <Users className="w-3.5 h-3.5" /> Manage Members
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-6 md:px-10 border-b border-border">
        <div className="flex gap-1 -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id ? 'border-indigo-500 text-primary' : 'border-transparent text-muted-foreground hover:text-gray-300 hover:border-white/20'}`}
              >
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">

        {/* OVERVIEW (BENTO GRID REDESIGN) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <RedundantWorkAlert workspaceId={space.company_id} currentSpaceId={spaceId} />
            <MeetingInsights spaceId={spaceId} />

            {/* Premium Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
              
              {/* Context Capsule (Large span) */}
              <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col h-full relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative h-full flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden z-10 hover:shadow-md transition-shadow">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${color}`}></div>
                  <div className="p-1 flex-1">
                    <ContextCapsule 
                      spaceId={spaceId} 
                      hasFullIntelligence={user?.clipad_plan === 'pro' || user?.clipad_plan === 'enterprise'} 
                    />
                  </div>
                </div>
              </div>

              {/* Blocker Radar (Vertical span) */}
              <div className="md:col-span-1 lg:col-span-1 xl:col-span-1 flex flex-col h-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden z-10 hover:shadow-md transition-shadow">
                <div className="p-1 flex-1">
                  <BlockerRadar 
                    workspaceId={space.company_id} 
                    spaceId={spaceId} 
                    isWorkspaceView={true}
                    hasFullIntelligence={user?.clipad_plan === 'pro' || user?.clipad_plan === 'enterprise'} 
                  />
                </div>
              </div>

              {/* Commitment Tracker */}
              <div className="md:col-span-1 lg:col-span-3 xl:col-span-1 flex flex-col h-full rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden z-10 hover:shadow-md transition-shadow">
                <div className="p-1 flex-1">
                  <CommitmentTracker spaceId={spaceId} />
                </div>
              </div>

              {/* Decision Ledger (Full width bottom span) */}
              <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden z-10 hover:shadow-md transition-shadow">
                <div className="p-1">
                  <DecisionLedger 
                    workspaceId={space.company_id} 
                    spaceId={spaceId} 
                    hasFullIntelligence={user?.clipad_plan === 'pro' || user?.clipad_plan === 'enterprise'} 
                    teamColor={color}
                  />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
              {/* Recent Videos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Camera className="w-4 h-4 text-primary" /> Recent Videos</h2>
                  <button onClick={() => setActiveTab('videos')} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">View all →</button>
                </div>
                {videos.length === 0
                  ? <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-900/50">No videos yet. <button className="text-primary font-medium hover:text-primary/80 transition-colors" onClick={() => navigate('/record')}>Record one →</button></div>
                  : <div className="grid grid-cols-2 gap-3">{videos.slice(0,4).map(v => <VideoCard key={v.id} video={v} onClick={() => navigate(`/watch/${v.id}`)} />)}</div>
                }
              </div>

              {/* Recent Meetings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Recent Meetings</h2>
                  <button onClick={() => setActiveTab('meetings')} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">View all →</button>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
                  {meetings.length === 0
                    ? <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-900/50">No meetings yet.</div>
                    : meetings.slice(0,5).map(m => (
                        <div key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{m.title || 'Team Meeting'}</p>
                            {m.ai_summary && <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 opacity-70 group-hover:opacity-100" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{new Date(m.created_at).toLocaleString()}</p>
                          {m.ai_summary && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 border-l-2 border-primary/30 pl-2">{m.ai_summary}</p>}
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
              <h2 className="text-xl font-bold text-foreground">{videos.length} Videos</h2>
              <button onClick={() => navigate('/record')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg transition-all">
                <Camera className="w-4 h-4" /> Record New
              </button>
            </div>
            {videos.length === 0 ? (
              <div className="text-center py-20">
                <Camera className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No videos in this space yet.</p>
                <button onClick={() => navigate('/record')} className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all">Record Async Video</button>
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
              <h2 className="text-xl font-bold text-foreground">{meetings.length} Meetings</h2>
              <button onClick={handleJoinMeeting} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg transition-all">
                <Video className="w-4 h-4" /> Start Meeting
              </button>
            </div>
            {meetings.length === 0 ? (
              <div className="text-center py-20">
                <Calendar className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                <p className="text-muted-foreground">No meeting records yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map(m => (
                  <div key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} className="p-5 rounded-2xl bg-card border border-border hover:border-white/12 cursor-pointer transition-all group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{m.title || 'Team Meeting'}</h3>
                          {m.ai_summary && <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-primary text-[10px] font-semibold flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> AI Summary</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                        {m.ai_summary && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{m.ai_summary}</p>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DECISIONS */}
        {activeTab === 'decisions' && (
          <DecisionLedger 
            workspaceId={space.company_id} 
            spaceId={spaceId} 
            hasFullIntelligence={user?.clipad_plan === 'pro' || user?.clipad_plan === 'enterprise'} 
            teamColor={color}
          />
        )}

        {/* CHAT */}
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-140px)] -mt-6 -mx-8 sm:-mx-12">
             <SpaceChat spaceId={spaceId} />
          </div>
        )}

        {/* ACTION BOARD */}
        {activeTab === 'tasks' && (
          <div className="h-[calc(100vh-140px)]">
             <TaskBoard spaceId={spaceId} />
          </div>
        )}

        {/* CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="h-[calc(100vh-140px)]">
             <SpaceCalendar spaceId={spaceId} />
          </div>
        )}

        {/* DOCS */}
        {activeTab === 'docs' && (
          <div className="h-[calc(100vh-140px)] -mt-6 -mx-8 sm:-mx-12">
            <SpaceDocs spaceId={spaceId} />
          </div>
        )}

        {/* CANVAS */}
        {activeTab === 'canvas' && (
          <div className="h-[calc(100vh-140px)] -mt-6 -mx-8 sm:-mx-12 border border-border rounded-xl overflow-hidden shadow-sm relative bg-[#0D1117]">
            <CanvasWhiteboard onClose={() => {}} />
          </div>
        )}

        {/* AUTOMATIONS */}
        {activeTab === 'automations' && (
          <div className="h-[calc(100vh-140px)] overflow-y-auto">
            <SpaceAutomations spaceId={spaceId} />
          </div>
        )}

      </div>
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Edit Space</h2>
            <form onSubmit={handleEditSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Space Name *</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>
              <div onClick={() => setEditIsPrivate(!editIsPrivate)} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className={`w-10 h-6 rounded-full transition-colors relative ${editIsPrivate ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${editIsPrivate ? 'left-5' : 'left-1'}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Private Space
                  </div>
                  <div className="text-[11px] text-slate-500">Only invited members can access.</div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all border border-slate-200 dark:border-slate-700 shadow-sm">Cancel</button>
                <button type="submit" disabled={savingEdit} className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Manage Members</h2>
              <button onClick={() => setShowMembers(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search users by name or email..."
                value={searchMember}
                onChange={e => setSearchMember(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {profiles
                .filter(p => p.id !== space.created_by && (p.full_name?.toLowerCase().includes(searchMember.toLowerCase()) || p.email?.toLowerCase().includes(searchMember.toLowerCase())))
                .map(p => {
                  const isMem = spaceMembers.some(m => m.user_id === p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.full_name}`} alt={p.full_name} className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.full_name}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleMember(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isMem ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30' : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'}`}
                      >
                        {isMem ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              {profiles.filter(p => p.id !== space.created_by && (p.full_name?.toLowerCase().includes(searchMember.toLowerCase()) || p.email?.toLowerCase().includes(searchMember.toLowerCase()))).length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">No users found.</p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setShowMembers(false)} className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity">Done</button>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
