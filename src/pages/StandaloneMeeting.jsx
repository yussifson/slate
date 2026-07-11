import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import VideoRoom from '@/components/video/VideoRoom';
import PreJoinScreen from '@/components/video/PreJoinScreen';
import { useAuth } from '@/lib/AuthContext';
import { Video, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CliPadLogo } from '@/components/ui/CliPadLogo';

function MeetLoader({ label = 'Preparing your secure meeting...' }) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="w-24 h-24 relative flex items-center justify-center animate-pulse">
        <CliPadLogo className="w-20 h-20" />
      </div>
      <p className="mt-8 text-slate-500 font-medium tracking-wide animate-pulse">{label}</p>
    </div>
  );
}

// ─── Pre-join screen + in-meeting screen ──────────────────────────────────────
function StandaloneMeetingInner({ url, roomName, onLeave, onToast, spaceId }) {
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
    <div className="w-screen h-screen bg-white dark:bg-[#090E17] overflow-hidden flex flex-col relative">
      {/* VideoRoom creates its own DailyProvider + callObject internally — do NOT wrap in another DailyProvider */}
      <VideoRoom
        roomUrl={url}
        userName={joinConfig.name || 'Guest'}
        initialAudio={joinConfig.micOn}
        initialVideo={joinConfig.videoOn}
        onLeave={onLeave}
        isPipMode={false}
        togglePipMode={() => {}}
        spaceId={spaceId}
      />
    </div>
  );
}

// ─── Main StandaloneMeeting ────────────────────────────────────────────────────
// CRITICAL: All hooks MUST be called before any conditional returns (Rules of Hooks).
export default function StandaloneMeeting() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const spaceId = searchParams.get('spaceId');
  const { toast } = useToast();

  // All state declarations first — no hooks after early returns
  const [error, setError] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [scheduledData, setScheduledData] = useState(null);
  const [countdown, setCountdown] = useState('');

  // Try to get current user if logged in, but allow anonymous guests
  const authResult = useAuth();
  const user = authResult?.user ?? null;

  // Effect 1: Fetch room on mount — MUST be before any conditional returns
  useEffect(() => {
    if (!roomId) return;
    handleJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Favicon and document title are handled by the global AuthProvider logic

  // Effect 2: Countdown timer for scheduled meetings
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledData]);

  // ── Async handler ────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    try {
      let room = null;
      let lastError = null;

      // Retry up to 5 times with 2s delay to handle Edge Function / DB replication lag
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

        // If there's a real DB error (not just "no rows"), capture it
        if (queryError && queryError.code !== 'PGRST116') {
          lastError = queryError;
        }

        // Wait before retrying
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

      // If scheduled and start time is in the future
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

  // ── Conditional renders AFTER all hooks ──────────────────────────────────────

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-white dark:bg-[#090E17] p-4">
        <div className="max-w-md w-full bg-slate-50 dark:bg-card border border-red-100 dark:border-red-500/20 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white mb-2">Meeting Not Found</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (scheduledData) {
    return (
      <div className="w-screen h-screen bg-slate-50 dark:bg-[#090E17] flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-10 shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-slate-900 dark:text-white mb-2">{scheduledData.title}</h1>
            <p className="text-slate-500 text-lg">
              Scheduled for {new Date(scheduledData.scheduled_start_time).toLocaleString()}
            </p>
          </div>
          <div className="py-8 bg-slate-50 dark:bg-black/50 rounded-2xl border border-slate-100 dark:border-white/5">
            <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-widest">Meeting starts in</p>
            <div className="text-5xl font-light text-primary tabular-nums tracking-tight">
              {countdown || 'Loading...'}
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            Back to Home
          </button>
        </div>
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
      onLeave={() => navigate('/dashboard')}
    />
  );
}
