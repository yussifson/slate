import { supabase} from '@/api/supabaseClient';
import React, { useState, useEffect} from "react";
import { useTranslation} from "react-i18next";
import {Video, Plus, Calendar, Clock, Users, Copy, Sparkles, LayoutGrid} from "lucide-react";
import { Button} from "@/components/ui/button";
import VideoRoom from "@/components/video/VideoRoom";
import ScheduleMeetingDialog from "@/components/video/ScheduleMeetingDialog";
import { useToast} from "@/components/ui/use-toast";
import { powerSync} from "@/api/PowerSyncConnector";
import { useAuth} from "@/lib/AuthContext";
import { useCompanyId} from "@/hooks/useCompanyId";
import { format} from "date-fns";
import { useVideo} from "@/lib/VideoContext";
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function Board() {
 const { t} = useTranslation();
 const { toast} = useToast();
 const { user} = useAuth();
 const companyId = useCompanyId();
 const { activeRoomUrl, joinRoom} = useVideo();
 
 const [rooms, setRooms] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isCreating, setIsCreating] = useState(false);
 const [quickConnectEmail, setQuickConnectEmail] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

 const handleQuickConnect = async () => {
 if (!quickConnectEmail.trim()) {
 toast({ title: "Error", description: "Please enter an email address.", variant: "destructive"});
 return;
}
 
 let urlToShare = activeRoomUrl;
 if (!urlToShare) {
 urlToShare = await handleStartCall();
}
 
 if (!urlToShare) return;

 navigator.clipboard.writeText(urlToShare);
 const subject = encodeURIComponent("You're invited to a secure video meeting");
 const body = encodeURIComponent(`Please join my video meeting here:\n${urlToShare}\n\nNo account is required. When you click the link, just type your name to join!`);
 window.location.href = `mailto:${quickConnectEmail}?subject=${subject}&body=${body}`;

 toast({ title: "Email Client Opened", description: `Link copied to clipboard and drafted for ${quickConnectEmail}.`});
 setQuickConnectEmail("");
};
 
 // Generate a unique, secure Jitsi Meet room URL for the company using a public instance without embed limits
 const getRoomUrl = (id) => `https://meet.ffmuc.net/slate-${companyId}-${id.slice(0,8)}`;

 useEffect(() => {
 if (!companyId) return;
 loadRooms();

 const roomSub = supabase.channel('video-rooms')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'video_rooms', filter: `company_id=eq.${companyId}`}, () => {
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
 const { data} = await supabase
 .from('video_rooms')
 .select('*')
 .eq('company_id', companyId)
 .order('created_at', { ascending: false});
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
 const roomName = `room-${Math.random().toString(36).substring(2, 10)}`;
 
 // Call our Supabase Edge function to create a Daily room securely
 const { data: dailyData, error: functionError} = await supabase.functions.invoke('create-daily-room', {
 body: { roomName}
});
 
 if (functionError) {
 throw new Error(functionError.message || "Failed to create Daily room via edge function");
}

 const realUrl = dailyData.url;

 // Create new room record
 await (async () => {
 const _payload = {
  id: crypto.randomUUID(),
  company_id: companyId,
  title: `${user?.full_name?.split(' ')[0] || 'User'}'s Instant Meeting`,
  daily_room_url: realUrl,
  daily_room_name: dailyData.name || roomName,
  host_id: user.id,
  status: 'active'
 };
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO video_rooms (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
})();
  // Record creation logic was executed above
  const error = null;

 joinRoom(realUrl);
 return realUrl;
} catch (err) {
 console.error(err);
 toast({ title: "Error", description: err.message || "Failed to start call", variant: "destructive"});
 return null;
} finally {
 setIsCreating(false);
}
};

 const joinCall = (url) => {
 joinRoom(url);
};

 const copyLink = (url) => {
 navigator.clipboard.writeText(url);
 toast({
 title: "Link Copied",
 description: "Meeting link copied to clipboard."});
};

 if (activeRoomUrl) {
 return (
 <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -mt-4 -mb-6 md:-mb-0 md:-mt-0">
 {/* Video is rendered globally via GlobalVideoOverlay */}
 </div>
 );
}

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2 tracking-[-0.02em]">
 <LayoutGrid className="w-6 h-6 text-primary" />
 {t("custom_board", "Meeting Board")}
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1">Start or schedule enterprise-grade video calls instantly.</p>
 </div>
 <div className="flex items-center gap-3">
 <Button variant="outline" className="gap-2" onClick={() => setIsScheduleOpen(true)}>
 <Calendar className="w-4 h-4" /> Schedule Call
 </Button>
 <Button onClick={handleStartCall} disabled={isCreating} className="gap-2 ">
 {isCreating ? <OrbitLoader size="sm" /> : <Video className="w-4 h-4" />} 
 Start Instant Call
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Left Column: Active / Scheduled */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
 <Clock className="w-5 h-5 text-[#71717a] dark:text-gray-400" /> Recent & Active Meetings
 </h2>
 <div className="space-y-3">
 {isLoading ? (
 <div className="flex justify-center p-8"><OrbitLoader size="md" /></div>
 ) : rooms.length > 0 ? (
 rooms.map(room => (
 <div key={room.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background hover:border-primary/30 transition-colors">
 <div className="flex items-start gap-3">
 <div className="mt-0.5">
 {room.status === 'active' ? (
 <span className="flex h-3 w-3 relative">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500/10"></span>
 </span>
 ) : (
 <div className="w-3 h-3 rounded-full bg-primary/20 border-[0.5px] border-black/9 dark:border-white/8 border-primary"></div>
 )}
 </div>
 <div>
 <h3 className="font-semibold text-foreground leading-tight">{room.title}</h3>
 <div className="flex items-center gap-3 mt-1.5 text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
 <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {format(new Date(room.created_at), 'MMM d, h:mm a')}</span>
 <span className="flex items-center gap-2"><Users className="w-3 h-3" /> Room ID: {room.id.slice(0,6)}</span>
 </div>
 </div>
 </div>
 <div className="mt-4 sm:mt-0 flex gap-2">
 {room.status === 'active' ? (
 <Button size="sm" onClick={() => joinCall(room)} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
 Join Now
 </Button>
 ) : (
  <span className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground flex items-center">Ended</span>
 )}
 <Button size="sm" variant="ghost" onClick={() => copyLink(room.daily_room_url)}><Copy className="w-4 h-4" /></Button>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center text-[#71717a] dark:text-gray-400 p-8">No meetings found. Start an instant call above!</div>
 )}
 </div>
 </div>
 </div>

 {/* Right Column: AI Insights */}
 <div className="space-y-6">
 <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-5 text-white relative overflow-hidden">
 <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-white/70" /> Orbit Meeting AI
 </h3>
 <p className="text-sm text-white/80 mb-4">Your AI assistant is ready to join your calls to transcribe, summarize, and extract action items.</p>
 <ul className="space-y-2 text-sm text-white/90">
 <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60"></div> Real-time transcription</li>
 <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60"></div> Post-meeting summaries</li>
 <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60"></div> Action item detection</li>
 </ul>
 </div>
 
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="font-semibold mb-3">Quick Connect</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-4">Invite external clients or guests instantly without them needing an account.</p>
 <div className="flex gap-2">
 <input 
 type="email" 
 placeholder="guest@email.com" 
 className="flex-1 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-3 text-sm focus:outline-none focus:border-primary"
 value={quickConnectEmail}
 onChange={(e) => setQuickConnectEmail(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleQuickConnect()}
 />
 <Button size="sm" onClick={handleQuickConnect} disabled={isCreating}>Invite</Button>
 </div>
 </div>
 </div>

 </div>
   <ScheduleMeetingDialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen} onScheduled={loadRooms} />
  </div>
  );
}
