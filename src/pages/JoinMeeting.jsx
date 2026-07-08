import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useVideo } from '@/lib/VideoContext';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
      let query = supabase.from('video_rooms').select('*');
      if (isUUID) {
        query = query.eq('id', roomId);
      } else {
        query = query.eq('daily_room_name', roomId);
      }
      
      const { data: room, error: fetchError } = await query.single();

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Fluid Background Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-primary/10 to-blue-500/10 blur-[100px] dark:from-primary/5 dark:to-blue-500/5 mix-blend-multiply dark:mix-blend-screen" 
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-2xl p-10 flex flex-col items-center text-center overflow-hidden"
        >
          {error ? (
            <>
              <div className="w-20 h-20 rounded-full bg-rose-100/50 dark:bg-rose-900/30 flex items-center justify-center mb-6 border border-rose-200 dark:border-rose-800/50 shadow-inner">
                <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">Access Denied</h1>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                {error}
              </p>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full rounded-xl h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </>
          ) : (
            <>
              {/* Dynamic Loading Avatar */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px] shadow-lg shadow-primary/30">
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                    <Video className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                Preparing your meeting
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                Securing connection...
              </p>
              
              <div className="flex items-center gap-3 bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/50 dark:border-white/10 px-6 py-3 rounded-full shadow-inner">
                <OrbitLoader size="sm" />
                <span className="text-sm font-semibold text-primary tracking-wide">Connecting</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
