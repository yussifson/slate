import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Video, Plus, Calendar, Clock, Users, Copy, Sparkles, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoRoom from "@/components/video/VideoRoom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { format } from "date-fns";

export default function Board() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = useCompanyId();
  
  const [activeRoomUrl, setActiveRoomUrl] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // For demonstration, use a public Daily.co room. 
  // In production, this would be generated via the Daily.co REST API using a secure backend function.
  const getDemoUrl = (id) => `https://optalflow.daily.co/demo-${id.slice(0,8)}`;

  useEffect(() => {
    if (!companyId) return;
    loadRooms();

    const roomSub = supabase.channel('video-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_rooms', filter: `company_id=eq.${companyId}` }, () => {
        loadRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
    };
  }, [companyId]);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('video_rooms')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      setRooms(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCall = async () => {
    setIsCreating(true);
    try {
      // Create new room record
      const { data: newRoom, error } = await supabase.from('video_rooms').insert({
        company_id: companyId,
        title: `${user?.full_name?.split(' ')[0] || 'User'}'s Instant Meeting`,
        daily_room_url: 'pending', // We will update it after generating UUID
        daily_room_name: 'pending',
        host_id: user.id,
        status: 'active'
      }).select().single();

      if (error) throw error;

      const realUrl = getDemoUrl(newRoom.id);
      await supabase.from('video_rooms').update({
        daily_room_url: realUrl,
        daily_room_name: `demo-${newRoom.id.slice(0,8)}`
      }).eq('id', newRoom.id);

      setActiveRoomUrl(realUrl);
    } catch (err) {
      toast({ title: "Error", description: "Failed to start call", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const joinCall = (url) => {
    setActiveRoomUrl(url);
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard.",
    });
  };

  if (activeRoomUrl) {
    return (
      <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -mt-4 -mb-6 md:-mb-0 md:-mt-0">
        <VideoRoom roomUrl={activeRoomUrl} onLeave={() => setActiveRoomUrl(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary" />
            {t("custom_board", "Meeting Board")}
          </h1>
          <p className="text-muted-foreground mt-1">Start or schedule enterprise-grade video calls instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" /> Schedule Call
          </Button>
          <Button onClick={handleStartCall} disabled={isCreating} className="gap-2 shadow-sm">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />} 
            Start Instant Call
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active / Scheduled */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" /> Recent & Active Meetings
            </h2>
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : rooms.length > 0 ? (
                rooms.map(room => (
                  <div key={room.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {room.status === 'active' ? (
                          <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight">{room.title}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(room.created_at), 'MMM d, h:mm a')}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Room ID: {room.id.slice(0,6)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex gap-2">
                      {room.status === 'active' ? (
                        <Button size="sm" onClick={() => joinCall(room.daily_room_url)} className="gap-2">
                          Join Now
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => joinCall(room.daily_room_url)}>Rejoin</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => copyLink(room.daily_room_url)}><Copy className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground p-8">No meetings found. Start an instant call above!</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" /> Orbit Meeting AI
            </h3>
            <p className="text-sm text-indigo-200 mb-4">Your AI assistant is ready to join your calls to transcribe, summarize, and extract action items.</p>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Real-time transcription</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Post-meeting summaries</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Action item detection</li>
            </ul>
          </div>
          
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
             <h3 className="font-semibold mb-3">Quick Connect</h3>
             <p className="text-sm text-muted-foreground mb-4">Invite external clients or guests instantly without them needing an account.</p>
             <div className="flex gap-2">
               <input type="email" placeholder="guest@email.com" className="flex-1 bg-background border border-border rounded-md px-3 text-sm" />
               <Button size="sm">Invite</Button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
