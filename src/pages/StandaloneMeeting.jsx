import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useToast } from '@/components/ui/use-toast';
import { DailyProvider } from '@daily-co/daily-react';
import VideoRoom from '@/components/video/VideoRoom';
import { useAuth } from '@/lib/AuthContext';

import { Video, Keyboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

function StandaloneMeetingInner({ url, roomName, onLeave, onToast }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [guestName, setGuestName] = useState('');

  if (!hasJoined) {
    return (
      <div className="w-screen h-screen bg-white dark:bg-[#090E17] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white">Ready to join?</h1>
            <p className="text-slate-500 mt-2">{roomName || 'Secure Meeting'}</p>
          </div>
          
          <div className="space-y-4 pt-4">
            <input
              type="text"
              placeholder="What's your name?"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-black border border-slate-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <Button 
              className="w-full py-6 text-lg rounded-xl"
              disabled={!guestName.trim()}
              onClick={() => {
                // we can pass guestName to VideoRoom or use daily.setUserName later
                setHasJoined(true);
              }}
            >
              Ask to join
            </Button>
            <div className="pt-2">
              <Button 
                variant="ghost" 
                className="w-full text-slate-500"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  if (onToast) {
                    onToast({ title: 'Copied', description: 'Meeting link copied to clipboard.' });
                  }
                }}
              >
                Copy meeting link
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // We use VideoRoom component directly but configured for full screen
  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col relative">
      <DailyProvider url={url}>
        <VideoRoom 
          roomUrl={url} 
          onLeave={onLeave} 
          isPipMode={false} 
          togglePipMode={() => {}} 
        />
      </DailyProvider>
    </div>
  );
}

export default function StandaloneMeeting() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [scheduledData, setScheduledData] = useState(null);
  const [countdown, setCountdown] = useState('');
  
  // Try to get current user if logged in, but allow anonymous guests
  const { user } = useAuth() || {};

  useEffect(() => {
    if (!roomId) return;
    handleJoin();
  }, [roomId]);

  useEffect(() => {
    if (!scheduledData) return;
    const targetDate = new Date(scheduledData.scheduled_start_time).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setCountdown('Starting now...');
        // Maybe auto-refresh to check if meeting is active now
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

  const handleJoin = async () => {
    try {
      let room = null;
      let fetchError = null;

      // Retry logic: Try 3 times with 1.5s delay to handle Edge Function/DB replication delays
      for (let i = 0; i < 3; i++) {
        const { data, error } = await supabase
          .from('video_rooms')
          .select('*')
          .eq('id', roomId)
          .single();
        
        if (data) {
          room = data;
          fetchError = null;
          break;
        } else {
          fetchError = error;
          await new Promise(res => setTimeout(res, 1500));
        }
      }

      if (fetchError || !room) {
        throw new Error('Meeting not found or has ended.');
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
      let isPrivate = room.privacy_type === 'private';
      let finalRoomName = room.title || room.daily_room_name;

      if (isPrivate) {
        const userName = user ? user.full_name : 'Guest';
        const userId = user ? user.id : 'anonymous';
        
        const { data, error: tokenError } = await supabase.functions.invoke('generate-daily-token', {
          body: { roomName: room.daily_room_name, userName: userName, userId: userId }
        });

        if (tokenError || !data?.token) {
          throw new Error('You do not have permission to join this private meeting.');
        }

        joinUrl = `${joinUrl}?t=${data.token}`;
      }

      setScheduledData(null); // Clear scheduled mode if we are joining
      setRoomName(finalRoomName);
      setMeetingUrl(joinUrl);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to join meeting.');
      toast({ title: 'Join Error', description: err.message, variant: 'destructive' });
    }
  };

  if (error) {
    console.log("StandaloneMeeting rendering error state:", error, typeof error);
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl text-rose-500 mb-4">Access Denied</h1>
        <p className="text-slate-500 mb-6">{String(error)}</p>
        <Button onClick={() => navigate('/')} className="rounded-full px-6 py-2">Go to Homepage</Button>
      </div>
    );
  }

  if (scheduledData) {
    return (
      <div className="w-screen h-screen bg-slate-50 dark:bg-[#090E17] flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-10 shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-slate-900 dark:text-white mb-2">{scheduledData.title}</h1>
            <p className="text-slate-500 text-lg">Scheduled for {new Date(scheduledData.scheduled_start_time).toLocaleString()}</p>
          </div>
          <div className="py-8 bg-slate-50 dark:bg-black/50 rounded-2xl border border-slate-100 dark:border-white/5">
            <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-widest">Meeting starts in</p>
            <div className="text-5xl font-light text-primary tabular-nums tracking-tight">
              {countdown || 'Loading...'}
            </div>
          </div>
          <Button variant="outline" className="w-full h-12 text-base rounded-xl" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    document.title = roomName ? `${roomName} - Optavel Meet` : "Joining Room - Optavel Meet";
  }, [roomName]);

  if (!meetingUrl) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-white dark:bg-[#090E17]">
        <div className="w-20 h-20 relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <Video className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="mt-8 text-slate-500 font-medium tracking-wide animate-pulse">Preparing your secure meeting...</p>
      </div>
    );
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
