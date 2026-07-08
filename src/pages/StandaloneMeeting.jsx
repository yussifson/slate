import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import VideoRoom from '@/components/video/VideoRoom';
import PreJoinScreen from '@/components/video/PreJoinScreen';
import { useAuth } from '@/lib/AuthContext';
import { Video, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { OrbitLoader } from '@/components/ui/orbit-loader';

function MeetLoader({ label = 'Preparing your secure meeting...' }) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#030712] relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-primary/10 to-blue-500/10 blur-[100px] dark:from-primary/5 dark:to-blue-500/5 mix-blend-multiply dark:mix-blend-screen" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-12 rounded-[2.5rem] shadow-2xl"
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px] shadow-lg shadow-primary/30">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
              <Video className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">Just a moment</h2>
        <div className="flex items-center gap-3 bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/50 dark:border-white/10 px-6 py-3 rounded-full shadow-inner">
          <OrbitLoader size="sm" />
          <span className="text-sm font-semibold text-primary tracking-wide">{label}</span>
        </div>
      </motion.div>
    </div>
  );
}

// --- Pre-join screen + in-meeting screen ---
function StandaloneMeetingInner({ url, roomName, onLeave, onToast }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [joinConfig, setJoinConfig] = useState({ name: '', micOn: true, videoOn: true });

  const handleJoin = (config) => {
    setJoinConfig(config);
    setHasJoined(true);
  };

  if (!hasJoined) {
    return (
      <PreJoinScreen 
        roomName={roomName} 
        onJoin={handleJoin} 
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-[#F8FAFC] dark:bg-[#030712] overflow-hidden flex flex-col relative font-sans">
      <VideoRoom
        roomUrl={url}
        userName={joinConfig.name}
        initialAudio={joinConfig.micOn}
        initialVideo={joinConfig.videoOn}
        onLeave={onLeave}
        isPipMode={false}
        togglePipMode={() => {}}
        initialBackground={joinConfig.backgroundConfig}
      />
    </div>
  );
}

// --- Main StandaloneMeeting ---
export default function StandaloneMeeting() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [error, setError] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [scheduledData, setScheduledData] = useState(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!roomId) return;
    handleJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    const oldHref = window.location.href;
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = '/orbit-logo.svg';
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = '/orbit-logo.svg';
      document.head.appendChild(newLink);
    }
    return () => {
      document.title = "Slate Workspace";
      if (link && oldHref) link.href = oldHref;
    };
  }, []);

  useEffect(() => {
    if (!scheduledData) return;
    const targetDate = new Date(scheduledData.scheduled_start_time).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setCountdown('Starting now...');
        handleJoin();
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(
        (days > 0 ? `${days}d ` : '') +
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledData]);

  useEffect(() => {
    document.title = roomName ? `${roomName} - Optavel Meet` : 'Joining Room - Optavel Meet';
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = '/orbit-logo.svg';
    }
  }, [roomName]);

  const handleJoin = async () => {
    try {
      let room = null;
      let lastError = null;

      for (let i = 0; i < 5; i++) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
        let query = supabase.from('video_rooms').select('*');
        if (isUUID) {
          query = query.eq('id', roomId);
        } else {
          query = query.eq('daily_room_name', roomId);
        }
        
        const { data, error: queryError } = await query.maybeSingle();

        if (data) {
          room = data;
          lastError = null;
          break;
        }

        if (queryError && queryError.code !== 'PGRST116') {
          lastError = queryError;
        }

        if (i < 4) {
          await new Promise((res) => setTimeout(res, 2000));
        }
      }

      if (!room) {
        throw new Error(
          lastError
            ? `Database error: ${lastError.message}`
            : 'Meeting not found or has ended.'
        );
      }

      if (room.status === 'scheduled' && room.scheduled_start_time) {
        const targetDate = new Date(room.scheduled_start_time).getTime();
        if (targetDate > new Date().getTime()) {
          setScheduledData(room);
          return;
        }
      }

      let joinUrl = room.daily_room_url;
      const isPrivate = room.privacy_type === 'private';
      const finalRoomName = room.title || room.daily_room_name;

      if (isPrivate) {
        const userName = user ? user.full_name : 'Guest';
        const userId = user ? user.id : 'anonymous';

        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('generate-daily-token', {
          body: { roomName: room.daily_room_name, userName, userId },
        });

        if (tokenError || !tokenData?.token) {
          throw new Error('You do not have permission to join this private meeting.');
        }

        joinUrl = `${joinUrl}?t=${tokenData.token}`;
      }

      setScheduledData(null);
      setRoomName(finalRoomName);
      setMeetingUrl(joinUrl);
    } catch (err) {
      console.error('StandaloneMeeting handleJoin error:', err);
      const msg = err?.message || 'Failed to join meeting.';
      setError(msg);
      toast({ title: 'Join Error', description: msg, variant: 'destructive' });
    }
  };

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#030712] relative overflow-hidden font-sans p-6">
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-rose-500/10 to-orange-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen" 
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 w-full max-w-md bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-2xl p-10 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-full bg-rose-100/50 dark:bg-rose-900/30 flex items-center justify-center mb-6 border border-rose-200 dark:border-rose-800/50 shadow-inner">
            <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">Meeting Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
            {error}
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="w-full rounded-xl h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (scheduledData) {
    return (
      <div className="w-screen h-screen bg-[#F8FAFC] dark:bg-[#030712] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-primary/10 to-teal-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen" 
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 max-w-lg w-full bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner border border-white/50 dark:border-white/5">
            <Sparkles className="w-10 h-10 text-primary dark:text-teal-400 drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{scheduledData.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
              Scheduled for {new Date(scheduledData.scheduled_start_time).toLocaleString()}
            </p>
          </div>
          
          <div className="py-10 bg-white/50 dark:bg-black/30 rounded-3xl border border-white/60 dark:border-white/5 shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 pointer-events-none" />
            <p className="text-sm font-bold text-primary dark:text-teal-400 mb-3 uppercase tracking-widest drop-shadow-sm">Meeting starts in</p>
            <div className="text-5xl font-extrabold text-slate-800 dark:text-white tabular-nums tracking-tighter drop-shadow-md">
              {countdown || 'Loading...'}
            </div>
          </div>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-14 rounded-xl border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold hover:bg-white/80 dark:hover:bg-white/10 transition-colors backdrop-blur-md"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!meetingUrl) {
    return <MeetLoader />;
  }

  return (
    <StandaloneMeetingInner
      url={meetingUrl}
      roomName={roomName}
      onToast={toast}
      onLeave={() => navigate('/')}
    />
  );
}
