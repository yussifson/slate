import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { MessageSquare, ThumbsUp, Send, Play, Pause, FastForward, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function WatchVideo() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [newComment, setNewComment] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      fetchComments();
      fetchReactions();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    const { data, error } = await supabase.from('clipad_videos').select('*').eq('id', videoId).single();
    if (!error) setVideo(data);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('clipad_video_comments')
      .select('*, user:user_id(full_name, avatar_url)')
      .eq('video_id', videoId)
      .order('timestamp_seconds', { ascending: true });
    if (!error) setComments(data || []);
  };

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('clipad_video_reactions')
      .select('*')
      .eq('video_id', videoId);
    if (!error) setReactions(data || []);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !videoRef.current) return;
    const timestamp = videoRef.current.currentTime;
    
    const { data, error } = await supabase.from('clipad_video_comments').insert({
      video_id: videoId,
      user_id: user.id,
      content: newComment,
      timestamp_seconds: timestamp
    }).select('*, user:user_id(full_name, avatar_url)').single();

    if (!error) {
      setComments(prev => [...prev, data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
      setNewComment("");
    }
  };

  const handleAddReaction = async (emoji) => {
    if (!user || !videoRef.current) return;
    const timestamp = videoRef.current.currentTime;
    
    const { data, error } = await supabase.from('clipad_video_reactions').insert({
      video_id: videoId,
      user_id: user.id,
      emoji: emoji,
      timestamp_seconds: timestamp
    }).select('*').single();

    if (!error) {
      setReactions(prev => [...prev, data]);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!video) return <div className="p-8">Loading video...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      {/* Video Player Side */}
      <div className="flex-[2] flex flex-col gap-4">
        <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative shadow-2xl group">
          <video 
            ref={videoRef} 
            src={video.video_url} 
            className="w-full h-full object-contain"
            controls
          />
          {/* Reaction Overlay Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {/* Logic to render floating emojis based on videoRef.current.currentTime could go here */}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{video.title || 'Untitled Video'}</h1>
          {video.ai_summary && (
            <div className="mt-4 p-4 bg-muted/50 rounded-xl">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" /> AI Summary
              </h3>
              <p className="text-sm text-muted-foreground">{video.ai_summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Side (Comments & Reactions) */}
      <div className="flex-1 bg-card rounded-2xl border shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-6rem)]">
        <div className="p-4 border-b font-semibold flex justify-between items-center bg-muted/20">
          <span>Comments</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={() => handleAddReaction('🔥')}>🔥</Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={() => handleAddReaction('👍')}>👍</Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={() => handleAddReaction('❤️')}>❤️</Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user?.full_name}`} alt="Avatar" className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{comment.user?.full_name || 'Anonymous'}</span>
                  <button 
                    onClick={() => { if(videoRef.current) videoRef.current.currentTime = comment.timestamp_seconds; }}
                    className="text-xs text-primary font-medium hover:underline bg-primary/10 px-1.5 py-0.5 rounded"
                  >
                    @{formatTime(comment.timestamp_seconds)}
                  </button>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center text-muted-foreground text-sm my-auto opacity-70">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No comments yet. Be the first!
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/20 flex gap-2">
          <Input 
            placeholder="Add a timestamped comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
          />
          <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
