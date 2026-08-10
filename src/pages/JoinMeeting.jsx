import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useVideo } from '@/lib/VideoContext';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useToast } from '@/components/ui/use-toast';

export default function JoinMeeting() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinRoom } = useVideo();
  const { toast } = useToast();
  const [error, setError] = useState(null);
  // Fix #10 — step-by-step status so the user sees progress instead of a blank spinner
  const [status, setStatus] = useState('Looking up meeting room…');

  useEffect(() => {
    if (!roomId) return;
    handleJoin();
  }, [roomId]);

  const handleJoin = async () => {
    try {
      setStatus('Looking up meeting room…');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
      let query = supabase.from('video_rooms').select('*');
      if (isUUID) {
        query = query.eq('id', roomId);
      } else {
        query = query.eq('daily_room_name', roomId);
      }
      
      const { data: room, error: fetchError } = await query.maybeSingle();

      let joinUrl;

      if (!fetchError && room) {
        joinUrl = room.daily_room_url;

        if (room.privacy_type === 'private') {
          setStatus('Generating secure access token…');
          try {
            const { data, error: tokenError } = await supabase.functions.invoke('generate-daily-token', {
              body: { roomName: room.daily_room_name, userName: user?.full_name, userId: user?.id }
            });
            if (!tokenError && data?.token) {
              joinUrl = `${joinUrl}?t=${data.token}`;
            }
          } catch (_) { /* token generation failed — join without token */ }
        }
      } else {
        // Room not in DB yet (race condition or edge function was down) — join directly
        joinUrl = `https://optavel.daily.co/${roomId}`;
      }

      setStatus('Connecting to meeting…');
      joinRoom(joinUrl);
      navigate('/board');
    } catch (err) {
      // Ultimate fallback — always try to join
      console.error(err);
      try {
        joinRoom(`https://optavel.daily.co/${roomId}`);
        navigate('/board');
      } catch (_) {
        setError(err.message || 'Failed to join meeting.');
        toast({ title: 'Join Error', description: err.message, variant: 'destructive' });
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h1 className="text-2xl font-semibold text-rose-500">Access Denied</h1>
        <p className="text-muted-foreground">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <OrbitLoader />
      <p className="text-muted-foreground animate-pulse">{status}</p>
    </div>
  );
}
