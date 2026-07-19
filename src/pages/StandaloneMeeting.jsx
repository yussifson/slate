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
import ClipadLoader from '@/components/ui/ClipadLoader';



// ─── Pre-join screen + in-meeting screen ──────────────────────────────────────
function StandaloneMeetingInner({ url, roomName, userName, onLeave, onToast, spaceId }) {
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
        defaultName={userName || 'Guest'}
      />
    );
  }

  return (
    <div className="w-full h-full min-h-full bg-white dark:bg-background overflow-hidden flex flex-col relative">
      {/* VideoRoom creates its own DailyProvider + callObject internally — do NOT wrap in another DailyProvider */}
      <VideoRoom
        roomUrl={url}
        userName={joinConfig.name || userName || 'Guest'}
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
  const [authError, setAuthError] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [scheduledData, setScheduledData] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [guestName, setGuestName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [nameSubmitted, setNameSubmitted] = useState(false);

  // Fetch user to enforce organization access
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

      // Enforce organization access for private/internal meetings
      if (room.privacy_type !== 'public') {
        if (!user) {
          setAuthError('unauthenticated');
          return;
        }

        const userCompanyId = user.user_metadata?.company_id || user.company_id;
        if (room.company_id && userCompanyId !== room.company_id) {
          setAuthError('unauthorized');
          return;
        }
      } else {
        if (!user) {
          setNeedsName(true);
        }
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
      const isPrivate = room.privacy_type !== 'public';
      const finalRoomName = room.title || room.daily_room_name;

      // Give token to anyone logged in, to make them owners or let them join private meetings
      if (user) {
        const userName = user.full_name;
        const userId = user.id;
        const userCompanyId = user.user_metadata?.company_id || user.company_id;
        const isOwner = userCompanyId === room.company_id;

        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('generate-daily-token', {
          body: { roomName: room.daily_room_name, userName, userId, isOwner },
        });

        if (!tokenError && tokenData?.token) {
          joinUrl = `${joinUrl}?t=${tokenData.token}`;
        } else if (isPrivate) {
          throw new Error('You do not have permission to join this private meeting.');
        }
      } else if (isPrivate) {
        throw new Error('You do not have permission to join this private meeting.');
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

  if (authError === 'unauthenticated') {
    return (
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1121] p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/5 dark:bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md w-full bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-10 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Login Required</h1>
            <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">This is a secure meeting. You must be logged in to your organization's workspace to join.</p>
          </div>
          <button
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25"
          >
            Log In to Join
          </button>
        </div>
      </div>
    );
  }

  if (authError === 'unauthorized') {
    return (
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1121] p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-red-500/5 dark:bg-red-500/10 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md w-full bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-10 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Access Denied</h1>
            <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">You do not have permission to join this meeting because you are not part of the host organization.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1121] p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-red-500/5 dark:bg-red-500/10 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md w-full bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-10 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Meeting Not Found</h1>
            <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (scheduledData) {
    return (
      <div className="w-full h-full min-h-full bg-slate-50 dark:bg-background flex flex-col items-center justify-center p-4">
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
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-foreground font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (needsName && !nameSubmitted) {
    return (
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1121] p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/5 dark:bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md w-full bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-10 shadow-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Join Meeting</h1>
            <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">Please enter your name to join this public meeting.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (guestName.trim()) setNameSubmitted(true); }} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              autoFocus
            />
            <button
              type="submit"
              disabled={!guestName.trim()}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!meetingUrl) {
    return <ClipadLoader fullScreen text="Preparing your secure meeting..." />;
  }

  return (
    <StandaloneMeetingInner
      url={meetingUrl}
      roomName={roomName}
      userName={user ? user.full_name : guestName}
      onToast={toast}
      onLeave={() => {
        const base = window.location.pathname.startsWith('/clipad') ? '/clipad' : '';
        navigate(`${base}/save-meeting/${roomId}`);
      }}
      spaceId={spaceId}
    />
  );
}
