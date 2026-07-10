import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Users, Video, Calendar, Plus, ExternalLink, Play, Monitor, PlusCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MeetingInsights from '@/components/clipad/MeetingInsights';
import SpaceNotes from '@/components/clipad/SpaceNotes';

export default function SpaceDashboard() {
  const { spaceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (spaceId) {
      fetchSpaceData();
    }
  }, [spaceId]);

  const fetchSpaceData = async () => {
    setLoading(true);
    try {
      const [spaceRes, videosRes, meetingsRes] = await Promise.all([
        supabase.from('clipad_spaces').select('*').eq('id', spaceId).single(),
        supabase.from('clipad_videos').select('*, creator:creator_id(full_name, avatar_url)').order('created_at', { ascending: false }).limit(10),
        supabase.from('clipad_meeting_records').select('*').eq('space_id', spaceId).order('created_at', { ascending: false }).limit(10)
      ]);

      if (spaceRes.data) setSpace(spaceRes.data);
      if (videosRes.data) setVideos(videosRes.data);
      if (meetingsRes.data) setMeetings(meetingsRes.data);

      // Check if space has an active meeting (mocking active presence for now based on recent meetings within last hour)
      if (meetingsRes.data && meetingsRes.data.length > 0) {
        const lastMeetingTime = new Date(meetingsRes.data[0].created_at).getTime();
        if (Date.now() - lastMeetingTime < 3600000) {
          setIsLive(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLive = () => {
    navigate(`/clipad/meet/${space?.daily_room_url?.split('/').pop() || spaceId}`);
  };

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto space-y-8"><Skeleton className="h-64 w-full rounded-3xl" /><Skeleton className="h-96 w-full rounded-3xl" /></div>;
  }

  if (!space) {
    return <div className="p-8 text-center text-muted-foreground">Space not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Space Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/90 to-blue-900 text-white p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4 uppercase tracking-wider">
            <Users className="w-4 h-4" /> Team Space
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">{space.name}</h1>
          <p className="text-primary-100 text-lg max-w-2xl">{space.description || 'A unified workspace for live meetings, asynchronous video updates, and AI-driven insights.'}</p>
        </div>

        <div className="relative z-10 shrink-0 flex flex-col gap-3 w-full md:w-auto">
          {isLive ? (
            <Button onClick={handleJoinLive} size="lg" className="bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 shadow-lg border-none group animate-pulse">
              <Activity className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Join Live Room
            </Button>
          ) : (
            <Button onClick={handleJoinLive} size="lg" variant="secondary" className="shadow-xl group">
              <Video className="w-5 h-5 mr-2" />
              Start Meeting
            </Button>
          )}
          <Button variant="outline" className="bg-transparent border-white/30 hover:bg-white/10 text-white" onClick={() => navigate('/clipad/record')}>
            <Monitor className="w-4 h-4 mr-2" /> Record Async Update
          </Button>
        </div>
      </div>

      {/* Intelligence Layer Integration */}
      <MeetingInsights spaceId={spaceId} />

      {/* Unified Timeline Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        
        {/* Main Feed (Async Videos) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Play className="w-6 h-6 text-primary" /> Async Video Thread</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/clipad/record')}><PlusCircle className="w-4 h-4 mr-2"/> New Video</Button>
          </div>
          
          {videos.length === 0 ? (
            <div className="text-center p-12 bg-muted/30 rounded-2xl border border-dashed border-primary/20 text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No async videos yet. Be the first to share an update!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map(v => (
                <div key={v.id} className="group relative rounded-2xl overflow-hidden bg-card border shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/clipad/watch/${v.id}`)}>
                  <div className="aspect-video bg-slate-900 relative">
                    <video src={v.video_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
                      <div className="bg-white text-black p-3 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex gap-3">
                    <img src={v.creator?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${v.creator?.full_name}`} className="w-10 h-10 rounded-full bg-muted" alt="Author" />
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-1">{v.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.creator?.full_name || 'Anonymous'} • {new Date(v.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Feed (Meeting Records) */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Past Meetings</h2>
          </div>
          
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {meetings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No meeting records found.
              </div>
            ) : (
              meetings.map((m, idx) => (
                <div key={m.id} className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${idx !== meetings.length -1 ? 'border-b' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-sm">Team Sync</h5>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Recorded</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{new Date(m.created_at).toLocaleString()}</div>
                  
                  {m.ai_summary && (
                    <p className="text-sm line-clamp-2 text-slate-600 dark:text-slate-300 bg-muted/30 p-2 rounded-lg border border-primary/5">{m.ai_summary}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Calendar className="w-5 h-5 text-primary" /> Space Notes</h2>
            <SpaceNotes spaceId={spaceId} />
          </div>
        </div>

      </div>
    </div>
  );
}
