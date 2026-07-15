import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowLeft, Send, Smile, Clock, Play, Pause, Volume2, VolumeX,
  Maximize2, Share2, Copy, Check, Sparkles, MessageSquare, Heart,
  ThumbsUp, Zap, Star, BookOpen, ChevronRight, Eye, MoreHorizontal, PictureInPicture, RotateCcw, RotateCw, Edit3, Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ClipadLoader from '@/components/ui/ClipadLoader';
import VideoDownloadModal from '@/components/clipad/VideoDownloadModal';
import { Download } from 'lucide-react';
import DictationButton from '@/components/ui/DictationButton';
import LockWall from '@/components/clipad/LockWall';

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
  const { user, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(null); // { type: 'manual'|'scheduled'|'private', unlockAt? }
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [activeCommentFilter, setActiveCommentFilter] = useState('all'); // 'all' | 'comments' | 'reactions'
  const [views, setViews] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const lastReactionTime = useRef(-1);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (videoId && user && !viewTracked.current) {
      viewTracked.current = true;
      supabase.from('clipad_video_views').insert({ video_id: videoId, viewer_id: user.id }).select().then(() => {
        // Refresh view count after inserting
        supabase.from('clipad_video_views').select('id', { count: 'exact', head: true }).eq('video_id', videoId).then(({ count }) => {
          setViews(count || 0);
        });
      }).catch(err => console.error(err));
    }
  }, [videoId, user]);

  useEffect(() => {
    fetchAll();

    const channel = supabase.channel(`video_${videoId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clipad_video_comments', filter: `video_id=eq.${videoId}` }, payload => {
        // Refetch to get nested relations like author
        fetchAll();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clipad_video_reactions', filter: `video_id=eq.${videoId}` }, payload => {
        setReactions(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [videoId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [videoRes, commentsRes, reactionsRes] = await Promise.all([
        supabase.from('clipad_videos').select('*, creator:creator_id(full_name, avatar_url)').eq('id', videoId).single(),
        supabase.from('clipad_video_comments').select('*').eq('video_id', videoId).order('timestamp_seconds', { ascending: true }),
        supabase.from('clipad_video_reactions').select('*').eq('video_id', videoId),
      ]);
      if (videoRes.data) {
        setVideo(videoRes.data);
        setEditTitle(videoRes.data.title || '');
        setEditDesc(videoRes.data.description || '');
        
        // We stream directly from the storage URL for performance and range requests.

        // --- ACCESS CONTROL LOGIC ---
        const v = videoRes.data;
        const isCreator = user && v.creator_id === user.id;
        
        // 1. Check Space Privacy
        const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'company_admin';
        if (v.space_id && !isCreator && !isAdminUser) {
          const { data: space } = await supabase.from('clipad_spaces').select('is_private').eq('id', v.space_id).single();
          if (space?.is_private) {
            const { data: member } = await supabase.from('clipad_space_members').select('id').eq('space_id', v.space_id).eq('user_id', user?.id || '').single();
            if (!member) {
              setAccessDenied({ type: 'private' });
              setLoading(false);
              return;
            }
          }
        }

        // 2. Check Locks
        if (!isCreator) {
          if (v.is_locked && v.unlock_at) {
            if (new Date(v.unlock_at) > new Date()) {
              setAccessDenied({ type: 'scheduled', unlockAt: v.unlock_at });
              setLoading(false);
              return;
            }
          } else if (v.is_locked) {
            setAccessDenied({ type: 'manual' });
            setLoading(false);
            return;
          }
        }
      }
      
      let finalComments = commentsRes.data || [];
      let finalReactions = reactionsRes.data || [];
      
      // Fetch profiles manually to bypass missing schema relation
      const userIds = [...new Set([...finalComments.map(c => c.user_id), ...finalReactions.map(r => r.user_id)])].filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
        const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        finalComments = finalComments.map(c => ({ ...c, author: profileMap[c.user_id] }));
        finalReactions = finalReactions.map(r => ({ ...r, author: profileMap[r.user_id] }));
      }
      
      setComments(finalComments);
      setReactions(finalReactions);

      // Get initial view count without logging
      const { count } = await supabase.from('clipad_video_views').select('id', { count: 'exact', head: true }).eq('video_id', videoId);
      if (!viewTracked.current) {
        setViews(count || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const ct = videoRef.current.currentTime;
      setCurrentTime(ct);
      
      const dur = videoRef.current.duration;
      if (dur && dur !== Infinity && !isNaN(dur) && dur !== duration) {
        setDuration(dur);
      }
      
      const sec = Math.floor(ct);
      if (sec !== lastReactionTime.current && playing) {
        lastReactionTime.current = sec;
        const currentReactions = reactions.filter(r => r.timestamp_seconds === sec);
        if (currentReactions.length > 0) {
          currentReactions.forEach((r, idx) => {
            setTimeout(() => {
              const x = Math.random() * 60 + 20;
              const y = Math.random() * 40 + 30;
              setFloatingReactions(prev => [...prev, { id: `${Date.now()}-${idx}`, emoji: r.emoji, x: `${x}%`, y: `${y}%` }]);
            }, idx * 150);
          });
        }
      }
    }
  }, [reactions, playing, duration]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  const seekTo = (t) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrentTime(t);
      if (!playing) {
        videoRef.current.play().then(() => setPlaying(true)).catch(console.error);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const handleEditVideo = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    try {
      const { data, error } = await supabase.from('clipad_videos').update({
        title: editTitle.trim(),
        description: editDesc.trim() || null,
      }).eq('id', videoId).select('*, creator:creator_id(full_name, avatar_url)').single();
      if (error) throw error;
      setVideo(data);
      setShowEdit(false);
    } catch (err) { console.error(err); }
    finally { setSavingEdit(false); }
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;
    try {
      await supabase.from('clipad_videos').delete().eq('id', videoId);
      navigate(video.space_id ? `/spaces/${video.space_id}` : '/dashboard');
    } catch (err) { console.error(err); }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'company_admin';
  const canEdit = video?.creator_id === user?.id || isAdmin;

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullScreen = () => {
    if (!playerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    } else {
      playerRef.current.requestFullscreen().catch(err => console.error(err));
    }
  };

  const changeSpeed = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const skip = (amount) => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration && videoRef.current.duration !== Infinity && !isNaN(videoRef.current.duration) 
      ? videoRef.current.duration 
      : 999999;
    const newTime = Math.max(0, Math.min(dur, videoRef.current.currentTime + amount));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed', err);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setSubmitting(true);
    try {
      const ts = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
      const contentToSave = isAnonymous ? `[ANON]${commentText.trim()}` : commentText.trim();
      const { data, error } = await supabase.from('clipad_video_comments').insert({
        video_id: videoId,
        user_id: user.id,
        content: contentToSave,
        timestamp_seconds: ts,
      }).select('*').single();
      if (error) throw error;
      
      // Add author manually to state
      const commentWithAuthor = { ...data, author: { full_name: user.full_name, avatar_url: user.avatar_url } };
      setComments(prev => [...prev, commentWithAuthor].sort((a,b) => a.timestamp_seconds - b.timestamp_seconds));
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
      const emojiToSave = isAnonymous ? `[ANON]${emoji}` : emoji;
      await supabase.from('clipad_video_reactions').insert({ video_id: videoId, user_id: user.id, emoji: emojiToSave, timestamp_seconds: ts });
      // Realtime subscription will handle updating the state and showing it for everyone else!
      setReactions(prev => [...prev, { emoji: emojiToSave, timestamp_seconds: ts, user_id: user.id, author: { full_name: user.full_name, avatar_url: user.avatar_url } }]);
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

  if (loading || isLoadingAuth) {
    return <ClipadLoader fullScreen text="Loading video..." />;
  }

  if (accessDenied) {
    return <LockWall type={accessDenied.type} unlockAt={accessDenied.unlockAt} title={video?.title || 'this video'} />;
  }

  if (!video) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-slate-100 text-center p-6">
        <div className="max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied or Video Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
            This video may not exist, or it belongs to another organization. You must be logged in with an authorized account from the same company to view this recording.
          </p>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-xl hover:-translate-y-0.5 transition-all mx-auto">
            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
          </button>
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

      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 page-enter overflow-x-hidden pb-24 md:pb-8">
        {/* Nav */}
        <nav className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-0.5">
            <ArrowLeft className="w-4 h-4 text-slate-500" /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium"><Eye className="w-3.5 h-3.5" /> {views} views</span>
            <button onClick={copyShareLink} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all border ${copied ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
            </button>
          </div>
        </nav>

        <VideoDownloadModal 
          open={showDownloadModal} 
          onOpenChange={setShowDownloadModal} 
          videoId={video.id} 
          videoUrl={video.video_url}
          videoTitle={video.title}
          spaceId={video.space_id}
        />
        
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
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                disablePictureInPicture={false}
              />

              {/* Floating reactions overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {floatingReactions.map(r => (
                  <FloatingReaction key={r.id} emoji={r.emoji} x={r.x} y={r.y} onDone={() => removeFloatingReaction(r.id)} />
                ))}
              </div>

              {/* Click to play/pause */}
              <div className="absolute inset-0 cursor-pointer z-10" onClick={togglePlay} />

              {/* Controls overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
                {/* Progress bar */}
                <div className="px-4 mb-2 pointer-events-auto">
                  {/* Comment markers on timeline */}
                  <div className="relative h-1 mb-1">
                    {comments.map(c => (
                      <button
                        key={c.id}
                        onClick={() => seekTo(c.timestamp_seconds)}
                        title={c.body}
                        className="absolute top-0 w-2 h-2 -mt-0.5 rounded-full bg-indigo-400 hover:scale-150 transition-transform shadow-sm"
                        style={{ left: `${(c.timestamp_seconds / (duration && duration !== Infinity ? duration : 1)) * 100}%` }}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration && duration !== Infinity && !isNaN(duration) ? duration : Math.max(100, currentTime)}
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
                  <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-white/80 hover:text-white transition-colors" title="Backward 10s">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-white/80 hover:text-white transition-colors" title="Forward 10s">
                    <RotateCw className="w-5 h-5" />
                  </button>
                  <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors ml-2">
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <span className="text-white/90 text-sm font-mono font-medium ml-2">
                    {formatTime(currentTime)} / {duration === Infinity || isNaN(duration) ? '--:--' : formatTime(duration)}
                  </span>
                  <div className="flex-1" />
                  {/* Emoji reaction bar in controls */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={(evt) => { evt.stopPropagation(); addReaction(e); }} className="text-lg hover:scale-125 transition-transform active:scale-150">{e}</button>
                    ))}
                  </div>
                  <div className="w-px h-5 bg-white/20 mx-2" />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-white/90 hover:text-white transition-colors text-sm font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md" title="Playback Speed">
                        {playbackRate}x
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-24 bg-white/10 backdrop-blur-xl border-white/10 text-white" align="end">
                      {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                        <DropdownMenuItem key={rate} onClick={() => changeSpeed(rate)} className="hover:bg-white/20 cursor-pointer text-sm">
                          {rate}x
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button onClick={(e) => { e.stopPropagation(); togglePiP(); }} className="text-white/80 hover:text-white transition-colors" title="Picture-in-Picture">
                    <PictureInPicture className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }} className="text-white/80 hover:text-white transition-colors" title="Full Screen">
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video info */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{video.title || 'Untitled Recording'}</h1>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowDownloadModal(true)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors" title="Download">
                    <Download className="w-5 h-5" />
                  </button>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => setShowEdit(true)} className="cursor-pointer gap-2">
                          <Edit3 className="w-4 h-4" /> Edit Video
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeleteVideo} className="cursor-pointer gap-2 text-rose-500 focus:text-rose-500">
                          <Trash2 className="w-4 h-4" /> Delete Video
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={video.creator?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${video.creator?.full_name}`}
                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 object-cover"
                  alt="Creator"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{video.creator?.full_name || 'Unknown'}</span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(video.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* AI Summary */}
            {(() => {
              if (!video.ai_summary) return null;
              let summaryData;
              try { summaryData = JSON.parse(video.ai_summary); }
              catch { summaryData = { summary: video.ai_summary }; }
              return (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950/40 to-white dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-sm mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">AI Copilot</span>
                  </div>
                  
                  <div className="space-y-6">
                    {summaryData.summary && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Key Summary</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{summaryData.summary}</p>
                      </div>
                    )}
                    
                    {summaryData.decisions?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Decisions Made</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                          {summaryData.decisions.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                    )}

                    {summaryData.actionItems?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Action Items</h4>
                        <div className="space-y-2">
                          {summaryData.actionItems.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 dark:text-white font-medium">{a.task}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assignee: {a.assignee} {a.deadline && `• Due: ${a.deadline}`}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right: Comments & Reactions */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {[['all','All'],['comments','Comments'],['reactions','Reactions']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setActiveCommentFilter(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeCommentFilter === val ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Comment input */}
            {user && (
              <form onSubmit={submitComment}>
                <div className="relative">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={`Comment at ${formatTime(currentTime)}…`}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-primary/50 shadow-sm transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <DictationButton onResult={txt => setCommentText(prev => (prev + ' ' + txt).trim())} isRecording={isRecording} setIsRecording={setIsRecording} />
                    <button type="submit" disabled={submitting || !commentText.trim()} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-2 px-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                    <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded text-primary focus:ring-primary w-3.5 h-3.5" />
                    Post Anonymously
                  </label>
                </div>
              </form>
            )}

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[60vh]">
              {(activeCommentFilter === 'all' || activeCommentFilter === 'reactions') && reactions.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  {EMOJIS.map(e => {
                    const count = reactions.filter(r => {
                      const cleanEmoji = r.emoji?.startsWith('[ANON]') ? r.emoji.slice(6) : r.emoji;
                      return cleanEmoji === e;
                    }).length;
                    if (!count) return null;
                    return (
                      <button key={e} onClick={() => addReaction(e)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium transition-all shadow-sm border border-slate-200 dark:border-slate-700">
                        {e} <span className="text-xs text-slate-500 dark:border-slate-400">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {(activeCommentFilter === 'all' || activeCommentFilter === 'comments') && (
                comments.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 px-4">No comments yet. Pause the video and type to leave a timestamped comment.</p>
                  </div>
                ) : (
                  comments.map(c => {
                    const isAnon = c.content?.startsWith('[ANON]');
                    const cleanContent = isAnon ? c.content.slice(6) : c.content;
                    return (
                    <div key={c.id} className="flex gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                      {isAnon ? (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">?</span>
                        </div>
                      ) : (
                        <img
                          src={c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.author?.full_name || 'U'}`}
                          className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 object-cover"
                          alt="Author"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {isAnon ? 'Anonymous' : (c.author?.full_name || 'User')}
                          </span>
                          <button
                            onClick={() => seekTo(c.timestamp_seconds)}
                            className="text-[10px] font-bold font-mono text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-0.5 rounded-md"
                          >
                            @{formatTime(c.timestamp_seconds)}
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{cleanContent}</p>
                      </div>
                    </div>
                  )})
                )
              )}
            </div>
          </div>
        </div>

      {/* Edit Video Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Edit Video</h2>
            <form onSubmit={handleEditVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Video Title *</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all border border-slate-200 dark:border-slate-700 shadow-sm">Cancel</button>
                <button type="submit" disabled={savingEdit} className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            </div>
    </>
  );
}
