import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, PictureInPicture, Send, MessageSquare } from 'lucide-react';
import { supabase as db } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const EMOJIS = ['👍', '👎', '❤️', '😂', '🔥', '🎉', '💡', '🤔'];

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const FloatingReaction = ({ emoji, x, y, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="absolute text-3xl z-50 pointer-events-none drop-shadow-xl select-none"
      style={{ left: `${x}%`, top: `${y}%`, animation: 'floatUp 2s cubic-bezier(0.1, 1, 0.2, 1) forwards' }}
    >
      {emoji}
    </div>
  );
};

export default function RichVideoPlayer({ videoUrl }) {
  const { user } = useAuth();
  const [videoRecord, setVideoRecord] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [floatingReactions, setFloatingReactions] = useState([]);
  
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  // 1. Fetch video record by URL
  useEffect(() => {
    if (!videoUrl) return;
    async function loadVideo() {
      const { data, error } = await db.from('clipad_videos').select('*').eq('video_url', videoUrl).single();
      if (!error && data) {
        setVideoRecord(data);
      }
    }
    loadVideo();
  }, [videoUrl]);

  // 2. Fetch comments and reactions for this video
  useEffect(() => {
    if (!videoRecord?.id) return;

    async function loadData() {
      const [{ data: cData }, { data: rData }] = await Promise.all([
        db.from('clipad_video_comments').select('*, author:auth.users(full_name, avatar_url)').eq('video_id', videoRecord.id).order('timestamp_seconds', { ascending: true }),
        db.from('clipad_video_reactions').select('*').eq('video_id', videoRecord.id)
      ]);
      if (cData) setComments(cData);
      if (rData) setReactions(rData);
    }
    loadData();

    // Setup realtime subscription
    const sub = db.channel(`video_${videoRecord.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clipad_video_comments', filter: `video_id=eq.${videoRecord.id}` }, (payload) => {
        loadData(); // Re-fetch to get author info
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clipad_video_reactions', filter: `video_id=eq.${videoRecord.id}` }, (payload) => {
        setReactions(prev => [...prev, payload.new]);
        const x = 10 + Math.random() * 80;
        const y = 50 + Math.random() * 30;
        setFloatingReactions(prev => [...prev, { id: Date.now() + Math.random(), emoji: payload.new.emoji, x, y }]);
      })
      .subscribe();

    return () => { db.removeChannel(sub); };
  }, [videoRecord?.id]);

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) videoRef.current.pause();
      else videoRef.current.play();
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const skip = (amount) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + amount, duration));
    }
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      if (!playing) togglePlay();
    }
  };

  const changeSpeed = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const togglePiP = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled && videoRef.current) {
      await videoRef.current.requestPictureInPicture();
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user || !videoRecord) return;
    setSubmitting(true);
    
    // Pause video when commenting
    if (playing) togglePlay();

    try {
      await db.from('clipad_video_comments').insert({
        video_id: videoRecord.id,
        user_id: user.id,
        timestamp_seconds: currentTime,
        content: commentText.trim()
      });
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const addReaction = async (emoji) => {
    if (!user || !videoRecord) return;
    const x = 10 + Math.random() * 80;
    const y = 50 + Math.random() * 30;
    setFloatingReactions(prev => [...prev, { id: Date.now(), emoji, x, y }]);
    
    try {
      await db.from('clipad_video_reactions').insert({
        video_id: videoRecord.id,
        user_id: user.id,
        timestamp_seconds: currentTime,
        emoji
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-4">
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.4); }
        }
      `}</style>
      {/* Player (Left) */}
      <div className="lg:col-span-2">
        <div ref={playerRef} className="relative rounded-2xl overflow-hidden bg-black aspect-video group shadow-xl border border-white/10">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            controlsList="nodownload"
          />

          {/* Floating reactions */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {floatingReactions.map(r => (
              <FloatingReaction key={r.id} emoji={r.emoji} x={r.x} y={r.y} onDone={() => setFloatingReactions(p => p.filter(x => x.id !== r.id))} />
            ))}
          </div>

          <div className="absolute inset-0 cursor-pointer z-10" onClick={togglePlay} />

          {/* Controls */}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
            <div className="px-4 mb-2 pointer-events-auto">
              <div className="relative h-1 mb-1">
                {comments.map(c => (
                  <button
                    key={c.id}
                    onClick={() => seekTo(c.timestamp_seconds)}
                    title={c.content}
                    className="absolute top-0 w-2 h-2 -mt-0.5 rounded-full bg-indigo-400 hover:scale-150 transition-transform shadow-sm"
                    style={{ left: `${(c.timestamp_seconds / (duration || 1)) * 100}%` }}
                  />
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={e => seekTo(Number(e.target.value))}
                onClick={e => e.stopPropagation()}
                className="w-full h-1.5 rounded-full accent-emerald-500 cursor-pointer bg-white/20 hover:h-2 transition-all"
              />
            </div>

            <div className="flex items-center gap-4 px-4 pb-4 pointer-events-auto">
              <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 hover:scale-105 transition-all shadow-lg border border-white/10">
                {playing ? <Pause className="w-4 h-4 text-white" fill="currentColor" /> : <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-white/80 hover:text-white transition-colors">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-white/80 hover:text-white transition-colors">
                <RotateCw className="w-5 h-5" />
              </button>
              <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors ml-2">
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-white/90 text-sm font-mono font-medium ml-2">
                {formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}
              </span>
              <div className="flex-1" />
              
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {EMOJIS.map(e => (
                  <button key={e} onClick={(evt) => { evt.stopPropagation(); addReaction(e); }} className="text-lg hover:scale-125 transition-transform active:scale-150">{e}</button>
                ))}
              </div>
              
              <div className="w-px h-5 bg-white/20 mx-2" />
              
              <select 
                value={playbackRate} 
                onChange={e => changeSpeed(Number(e.target.value))}
                className="bg-transparent text-white text-sm font-bold border-none outline-none cursor-pointer"
              >
                <option value={0.5} className="text-black">0.5x</option>
                <option value={1} className="text-black">1x</option>
                <option value={1.25} className="text-black">1.25x</option>
                <option value={1.5} className="text-black">1.5x</option>
                <option value={2} className="text-black">2x</option>
              </select>

              <button onClick={(e) => { e.stopPropagation(); togglePiP(); }} className="text-white/80 hover:text-white transition-colors ml-2">
                <PictureInPicture className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }} className="text-white/80 hover:text-white transition-colors">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments (Right) */}
      <div className="flex flex-col h-[500px] bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Comments</h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
          {comments.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No comments yet.</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {c.author?.full_name || 'User'}
                  </span>
                  <button
                    onClick={() => seekTo(c.timestamp_seconds)}
                    className="text-[10px] font-bold font-mono text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-0.5 rounded-md"
                  >
                    @{formatTime(c.timestamp_seconds)}
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{c.content}</p>
              </div>
            ))
          )}
        </div>

        {videoRecord ? (
          <form onSubmit={submitComment} className="relative">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={`Comment at ${formatTime(currentTime)}...`}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-primary/50 shadow-sm transition-all"
            />
            <button type="submit" disabled={submitting || !commentText.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 disabled:text-slate-400">
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <p className="text-xs text-slate-500 text-center italic">Video metadata not found, comments disabled.</p>
        )}
      </div>
    </div>
  );
}
