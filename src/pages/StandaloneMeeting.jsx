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

function StandaloneMeetingInner({ url, roomName, onLeave }) {
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
  
  // Try to get current user if logged in, but allow anonymous guests
  const { user } = useAuth() || {};

  useEffect(() => {
    if (!roomId) return;
    handleJoin();
  }, [roomId]);

  const handleJoin = async () => {
    try {
      const { data: room, error: fetchError } = await supabase
        .from('video_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError || !room) {
        throw new Error('Meeting not found or has ended.');
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

      setRoomName(finalRoomName);
      setMeetingUrl(joinUrl);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to join meeting.');
      toast({ title: 'Join Error', description: err.message, variant: 'destructive' });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center space-y-4 p-4">
        <h1 className="text-2xl font-semibold text-rose-500">Access Denied</h1>
        <p className="text-slate-600 max-w-md">{error}</p>
        <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          Go to Homepage
        </button>
      </div>
    );
  }

  if (!meetingUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <OrbitLoader />
        <p className="text-slate-500 animate-pulse font-medium">Connecting to secure meeting...</p>
      </div>
    );
  }

  return (
    <StandaloneMeetingInner 
      url={meetingUrl} 
      roomName={roomName}
      onLeave={() => {
        window.location.href = '/'; // redirect after meeting ends
      }}
    />
  );
}
