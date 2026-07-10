import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowLeft, Send, Smile, Clock, Play, Pause, Volume2, VolumeX,
  Maximize2, Share2, Copy, Check, Sparkles, MessageSquare, Heart,
  ThumbsUp, Zap, Star, BookOpen, ChevronRight, Eye, MoreHorizontal
} from 'lucide-react';

const EMOJIS = ['👍','❤️','🔥','😂','🎉','🤯'];

function formatTime(s) {
  if (!s && s !== 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function FloatingReaction({ emoji, x, y, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="absolute pointer-events-none text-2xl z-50 animate-bounce"
      style={{ left: x, top: y, animation: 'floatUp 2.5s ease-out forwards' }}
    >
      {emoji}
    </div>
  );
}

export default function WatchVideo() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [activeCommentFilter, setActiveCommentFilter] = useState('all'); // 'all' | 'comments' | 'reactions'
  const [views, setViews] = useState(0);

  useEffect(() => { fetchAll(); }, [videoId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [videoRes, commentsRes, reactionsRes] = await Promise.all([
        supabase.from('clipad_videos').select('*, creator:creator_id(full_name, avatar_url)').eq('id', videoId).single(),
        supabase.from('clipad_video_comments').select('*, author:user_id(full_name, avatar_url)').eq('video_id', videoId).order('timestamp_seconds', { ascending: true }),
        supabase.from('clipad_video_reactions').select('*').eq('video_id', videoId),
      ]);
      if (videoRes.data) setVideo(videoRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
      if (reactionsRes.data) setReactions(reactionsRes.data);

      // Log a view
      if (user) {
        await supabase.from('clipad_video_views').insert({ video_id: videoId, viewer_id: user.id, watch_percent: 0 }).select();
      }
      // Get view count
      const { count } = await supabase.from('clipad_video_views').select('id', { count: 'exact', head: true }).eq('video_id', videoId);
      setViews(count || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  const seekTo = (t) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setSubmitting(true);
    try {
      const ts = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
      const { data, error } = await supabase.from('clipad_video_comments').insert({
        video_id: videoId,
        user_id: user.id,
        body: commentText.trim(),
        timestamp_seconds: ts,
      }).select('*, author:user_id(full_name, avatar_url)').single();
      if (error) throw error;
      setComments(prev => [...prev, data].sort((a,b) => a.timestamp_seconds - b.timestamp_seconds));
      setCommentText('');
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const addReaction = async (emoji) => {
    if (!user) return;
    const ts = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
    // Show floating reaction
    const x = Math.random() * 60 + 20;
    const y = Math.random() * 40 + 30;
    const id = Date.now();
    setFloatingReactions(prev => [...prev, { id, emoji, x: `${x}%`, y: `${y}%` }]);
    // Save to DB
    try {
      await supabase.from('clipad_video_reactions').insert({ video_id: videoId, user_id: user.id, emoji, timestamp_seconds: ts });
      setReactions(prev => [...prev, { emoji, timestamp_seconds: ts, user_id: user.id }]);
    } catch (err) { console.error(err); }
  };

  const removeFloatingReaction = useCallback((id) => {
    setFloatingReactions(prev => prev.filter(r => r.id !== id));
  }, []);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get reactions at current timestamp (within 5s window)
  const nearbyReactions = reactions.filter(r => Math.abs(r.timestamp_seconds - currentTime) < 5);

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter flex items-center justify-center text-foreground text-center">
        <div>
          <p className="text-muted-foreground mb-4">Video not found.</p>
          <button onClick={() => navigate('/dashboard')} className="text-primary hover:text-primary/80 transition-colors text-sm">← Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.4); }
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter text-foreground">
        {/* Nav */}
        <nav className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 bg-background page-enter/90 backdrop-blur-xl border-b border-border">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {views} views</span>
            <button onClick={copyShareLink} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${copied ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-gray-300 border-border bg-secondary hover:bg-secondary'}`}>
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Video Player */}
          <div className="lg:col-span-2 space-y-4">
            {/* Player */}
            <div ref={playerRef} className="relative rounded-2xl overflow-hidden bg-black aspect-video group">
              <video
                ref={videoRef}
                src={video.video_url}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />

              {/* Floating reactions overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {floatingReactions.map(r => (
                  <FloatingReaction key={r.id} emoji={r.emoji} x={r.x} y={r.y} onDone={() => removeFloatingReaction(r.id)} />
                ))}
              </div>

              {/* Controls overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Progress bar */}
                <div className="px-4 mb-2">
                  {/* Comment markers on timeline */}
                  <div className="relative h-1 mb-1">
                    {comments.map(c => (
                      <button
                        key={c.id}
                        onClick={() => seekTo(c.timestamp_seconds)}
                        title={c.body}
                        className="absolute top-0 w-2 h-2 -mt-0.5 rounded-full bg-indigo-400 hover:scale-150 transition-transform"
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
                    className="w-full h-1 rounded-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 px-4 pb-4">
                  <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                    {playing ? <Pause className="w-4 h-4 text-foreground" /> : <Play className="w-4 h-4 text-foreground fill-white" />}
                  </button>
                  <button onClick={toggleMute} className="text-foreground/70 hover:text-foreground transition-colors">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-foreground/60 text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  <div className="flex-1" />
                  {/* Emoji reaction bar in controls */}
                  <div className="flex items-center gap-1">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => addReaction(e)} className="text-base hover:scale-125 transition-transform active:scale-150">{e}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Click to play/pause */}
              <div className="absolute inset-0 cursor-pointer" onClick={togglePlay} />
            </div>

            {/* Video info */}
            <div>
              <h1 className="text-xl font-bold text-foreground mb-2">{video.title || 'Untitled Recording'}</h1>
              <div className="flex items-center gap-3">
                <img
                  src={video.creator?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${video.creator?.full_name}`}
                  className="w-8 h-8 rounded-full bg-slate-700"
                  alt="Creator"
                />
                <span className="text-sm text-muted-foreground">{video.creator?.full_name || 'Unknown'}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{new Date(video.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* AI Summary */}
            {video.ai_summary && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/15">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary/80 uppercase tracking-wider">AI Summary</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{video.ai_summary}</p>
              </div>
            )}
          </div>

          {/* Right: Comments & Reactions */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-secondary rounded-xl">
              {[['all','All'],['comments','Comments'],['reactions','Reactions']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setActiveCommentFilter(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${activeCommentFilter === val ? 'bg-secondary/80 text-foreground' : 'text-muted-foreground hover:text-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Comment input */}
            {user && (
              <form onSubmit={submitComment} className="relative">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={`Comment at ${formatTime(currentTime)}…`}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                />
                <button type="submit" disabled={submitting || !commentText.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[60vh]">
              {(activeCommentFilter === 'all' || activeCommentFilter === 'reactions') && reactions.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/[0.03] border border-border">
                  {EMOJIS.map(e => {
                    const count = reactions.filter(r => r.emoji === e).length;
                    if (!count) return null;
                    return (
                      <button key={e} onClick={() => addReaction(e)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-all">
                        {e} <span className="text-xs text-muted-foreground">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {(activeCommentFilter === 'all' || activeCommentFilter === 'comments') && (
                comments.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-800 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No comments yet. Pause the video and type to leave a timestamped comment.</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3 p-3 rounded-xl hover:bg-secondary transition-colors group">
                      <img
                        src={c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.author?.full_name || 'U'}`}
                        className="w-7 h-7 rounded-full bg-slate-700 shrink-0 mt-0.5"
                        alt="Author"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-300">{c.author?.full_name || 'Anonymous'}</span>
                          <button
                            onClick={() => seekTo(c.timestamp_seconds)}
                            className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors bg-primary/10 px-1.5 py-0.5 rounded"
                          >
                            @{formatTime(c.timestamp_seconds)}
                          </button>
                        </div>
                        <p className="text-sm text-gray-300 leading-snug">{c.body}</p>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
