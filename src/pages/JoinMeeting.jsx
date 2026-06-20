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

      if (room.privacy_type === 'private') {
        const { data, error: tokenError } = await supabase.functions.invoke('generate-daily-token', {
          body: { roomName: room.daily_room_name, userName: user?.full_name, userId: user?.id }
        });

        if (tokenError || !data?.token) {
          throw new Error('You do not have permission to join this private meeting.');
        }

        joinUrl = `${joinUrl}?t=${data.token}`;
      }

      joinRoom(joinUrl);
      navigate('/board'); // redirect to board where video is overlaid
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to join meeting.');
      toast({ title: 'Join Error', description: err.message, variant: 'destructive' });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h1 className="text-2xl font-semibold text-rose-500">Access Denied</h1>
        <p className="text-muted-foreground">{error}</p>
        <button onClick={() => navigate('/')} className="text-primary hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <OrbitLoader />
      <p className="text-muted-foreground animate-pulse">Connecting to meeting...</p>
    </div>
  );
}
