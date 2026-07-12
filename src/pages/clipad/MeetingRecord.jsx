import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowLeft, Brain, CheckCircle, Clock, Users, FileText,
  Sparkles, MessageSquare, Target, ChevronDown, ChevronUp,
  User, Calendar, Copy, Check, Download, Zap, AlertCircle,
  Play, BarChart3, Video, Edit3, Trash2, Lock, MoreHorizontal
} from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import ClipadLoader from '@/components/ui/ClipadLoader';
import ClipadMobileNav from '@/components/clipad/ClipadMobileNav';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all ${copied ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-gray-300 bg-secondary hover:bg-secondary'}`}>
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

function SectionCard({ icon: Icon, iconColor, title, badge, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <span className="font-bold text-foreground">{title}</span>
          {badge && <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border px-6 py-4">{children}</div>}
    </div>
  );
}

import RichVideoPlayer from '@/components/video/RichVideoPlayer';

function ActionItemRow({ item, onUpdate }) {
  const [done, setDone] = useState(item.is_complete);
  const toggle = async () => {
    const next = !done;
    setDone(next);
    await supabase.from('clipad_action_items').update({ is_complete: next }).eq('id', item.id);
    onUpdate?.(item.id, next);
  };
  return (
    <div className="flex items-start gap-3 py-3">
      <button
        onClick={toggle}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-primary'}`}
      >
        {done && <Check className="w-3 h-3 text-foreground" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-muted-foreground' : 'text-gray-200'}`}>{item.title}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          {item.assigned_to && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" /> {item.assigned_to_name || item.assigned_to}
            </span>
          )}
          {item.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Due {new Date(item.due_date).toLocaleDateString()}
            </span>
          )}
          {item.context && (
            <span className="text-xs text-muted-foreground italic line-clamp-1">"{item.context}"</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetingRecord() {
  const { meetingId } = useParams();
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const { toast } = useToast();

  useEffect(() => { if (meetingId) fetchMeeting(); }, [meetingId]);

  const fetchMeeting = async () => {
    setLoading(true);
    try {
      const [meetingRes, actionsRes, transcriptRes] = await Promise.all([
        supabase.from('clipad_meeting_records').select('*').eq('id', meetingId).single(),
        supabase.from('clipad_action_items').select('*').eq('meeting_id', meetingId).order('created_at', { ascending: true }),
        supabase.from('clipad_transcripts').select('*').eq('meeting_id', meetingId).order('start_time', { ascending: true }),
      ]);
      if (meetingRes.data) {
        setMeeting(meetingRes.data);
        setEditTitle(meetingRes.data.title || '');
      }
      if (actionsRes.data) setActionItems(actionsRes.data);
      if (transcriptRes.data) setTranscript(transcriptRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateAISummary = async () => {
    if (!meeting) return;
    setGeneratingAI(true);
    try {
      const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
      const { data, error } = await supabase.functions.invoke('ai-meeting-summary', {
        body: {
          meeting_id: meetingId,
          transcript: transcriptText || meeting.raw_transcript || '',
          title: meeting.title,
        },
      });
      if (error) throw error;
      if (data) {
        setMeeting(prev => ({ ...prev, ...data }));
        if (data.action_items?.length) {
          // Find or create default board for this space
          let boardId = null;
          if (meeting.space_id) {
            let { data: board } = await supabase.from('clipad_task_boards').select('id').eq('space_id', meeting.space_id).limit(1).single();
            if (!board) {
              const { data: newBoard } = await supabase.from('clipad_task_boards').insert({ space_id: meeting.space_id, name: 'Main Board' }).select('id').single();
              board = newBoard;
            }
            if (board) boardId = board.id;
          }

          // Insert action items into the new tasks system
          const inserts = data.action_items.map(ai => ({
            meeting_id: meetingId,
            board_id: boardId,
            title: ai.title,
            description: ai.context || null,
            assignee_id: ai.owner || null,
            status: 'todo',
            source: 'ai_generated',
          }));
          const { data: newItems } = await supabase.from('clipad_tasks').insert(inserts).select();
          if (newItems) setActionItems(prev => [...prev, ...newItems]);
        }

        // Pipe meeting notes to a new Doc in the Knowledge Layer
        if (meeting.space_id && data.summary) {
          const { data: newDoc } = await supabase.from('clipad_docs').insert({
            space_id: meeting.space_id,
            title: `Meeting Notes: ${meeting.title || 'Untitled'}`,
            content: `**AI Summary:**\n\n${data.summary}\n\n**Decisions:**\n${data.decisions?.join('\n') || 'None'}`,
            created_by: user?.id || null
          }).select().single();
          
          if (newDoc) {
            // Link the doc to the meeting
            await supabase.from('clipad_doc_links').insert({
              doc_id: newDoc.id,
              target_id: meetingId,
              target_type: 'meeting'
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const getMeetingDuration = () => {
    if (!meeting?.duration_seconds) return null;
    const m = Math.floor(meeting.duration_seconds / 60);
    const s = meeting.duration_seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading || isLoadingAuth) {
    return <ClipadLoader fullScreen text="Loading meeting record..." />;
  }

  if (!meeting) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter flex items-center justify-center text-foreground">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Meeting not found.</p>
          <button onClick={() => navigate('/meetings')} className="text-primary hover:text-primary/80 text-sm transition-colors">← Meetings</button>
        </div>
      </div>
    );
  }

  const openItems = actionItems.filter(i => !i.is_complete);
  const doneItems = actionItems.filter(i => i.is_complete);

  const handleEditMeeting = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    try {
      const { data, error } = await supabase.from('clipad_meeting_records').update({
        title: editTitle.trim()
      }).eq('id', meetingId).select().single();
      if (error) throw error;
      setMeeting(data);
      setShowEdit(false);
      toast({ title: 'Meeting updated' });
    } catch (err) { console.error(err); }
    finally { setSavingEdit(false); }
  };

  const handleDeleteMeeting = async () => {
    if (!window.confirm('Are you sure you want to delete this meeting record? This cannot be undone.')) return;
    try {
      await supabase.from('clipad_meeting_records').delete().eq('id', meetingId);
      toast({ title: 'Meeting deleted' });
      navigate(meeting.space_id ? `/spaces/${meeting.space_id}` : '/meetings');
    } catch (err) { console.error(err); }
  };

  const isAdmin = user?.subscription_tier === 'enterprise' || user?.role === 'admin' || user?.role === 'super_admin';
  const canEdit = meeting?.created_by === user?.id || isAdmin;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter text-foreground overflow-x-hidden pb-24 md:pb-8">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 bg-background page-enter/90 backdrop-blur-xl border-b border-border">
          <button onClick={() => navigate('/meetings')} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-0.5">
            <ArrowLeft className="w-4 h-4 text-slate-500" /> Meetings
          </button>
        <div className="flex items-center gap-2">
          {!meeting.ai_summary && (
            <button
              onClick={generateAISummary}
              disabled={generatingAI}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-foreground text-xs font-bold shadow-lg shadow-pink-500/20 transition-all disabled:opacity-60"
            >
              {generatingAI
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                : <><Sparkles className="w-3.5 h-3.5" /> Generate AI Summary</>
              }
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">

        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center gap-3 mb-2">
            {meeting.ai_summary && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-primary text-xs font-bold">
                <Sparkles className="w-3 h-3" /> AI Summary Ready
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-black text-foreground">{meeting.title || 'Team Meeting'}</h1>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors mt-1">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem onClick={() => setShowEdit(true)} className="cursor-pointer gap-2">
                    <Edit3 className="w-4 h-4" /> Edit Meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteMeeting} className="cursor-pointer gap-2 text-rose-500 focus:text-rose-500">
                    <Trash2 className="w-4 h-4" /> Delete Meeting
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(meeting.created_at).toLocaleString()}</span>
            {getMeetingDuration() && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{getMeetingDuration()}</span>}
            {meeting.participant_count && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{meeting.participant_count} participants</span>}
          </div>
          <div className="mt-4">
            {meeting.video_url ? (
              <RichVideoPlayer videoUrl={meeting.video_url} />
            ) : (
              <button 
                onClick={() => {
                  toast({ title: 'Recording Loading', description: 'Your recording is being processed by the cloud provider and will be available shortly.' });
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all hover:-translate-y-0.5 mt-4 mb-8"
              >
                <Video className="w-4 h-4" /> Recording Pending...
              </button>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {meeting.ai_summary && (
          <SectionCard icon={Brain} iconColor="from-pink-500 to-rose-500" title="AI Meeting Summary" defaultOpen>
            <div className="flex justify-end mb-3">
              <CopyButton text={meeting.ai_summary === '00' ? 'No summary generated.' : meeting.ai_summary} />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {meeting.ai_summary === '00' ? 'No meaningful transcript recorded to generate a summary.' : meeting.ai_summary}
            </p>
          </SectionCard>
        )}

        {/* Key Decisions */}
        {meeting.key_decisions && meeting.key_decisions.length > 0 && (
          <SectionCard icon={Zap} iconColor="from-amber-500 to-orange-500" title="Key Decisions" badge={meeting.key_decisions.length}>
            <ul className="space-y-2">
              {meeting.key_decisions.map((d, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{d}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Action Items */}
        <SectionCard
          icon={CheckCircle}
          iconColor="from-emerald-500 to-teal-500"
          title="Action Items"
          badge={`${openItems.length} open · ${doneItems.length} done`}
        >
          {actionItems.length === 0 ? (
            <div className="py-8 text-center">
              <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No action items yet.</p>
              {!meeting.ai_summary && (
                <button onClick={generateAISummary} disabled={generatingAI} className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">
                  Generate AI summary to extract action items →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {actionItems.map(item => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  onUpdate={(id, val) => setActionItems(prev => prev.map(i => i.id === id ? { ...i, is_complete: val } : i))}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Open Questions */}
        {meeting.open_questions && meeting.open_questions.length > 0 && (
          <SectionCard icon={AlertCircle} iconColor="from-cyan-500 to-blue-500" title="Open Questions" badge={meeting.open_questions.length}>
            <ul className="space-y-2">
              {meeting.open_questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{q}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Transcript */}
        {(transcript.length > 0 || meeting.raw_transcript) && (
          <SectionCard icon={FileText} iconColor="from-violet-500 to-purple-500" title="Transcript" defaultOpen={false}>
            <div className="flex justify-between mb-4">
              <span className="text-xs text-muted-foreground">{transcript.length} segments</span>
              <CopyButton text={transcript.map(t => `[${t.speaker}]: ${t.text}`).join('\n') || meeting.raw_transcript || ''} />
            </div>
            <div className={`space-y-3 overflow-hidden transition-all ${showFullTranscript ? '' : 'max-h-72'}`}>
              {transcript.length > 0 ? (
                transcript.map((seg, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="shrink-0 w-16 text-right">
                      <span className="text-[10px] font-mono text-muted-foreground">{seg.start_time ? `${Math.floor(seg.start_time/60)}:${String(Math.floor(seg.start_time%60)).padStart(2,'0')}` : ''}</span>
                    </div>
                    <div>
                      {seg.speaker && <p className="text-xs font-bold text-primary mb-0.5">{seg.speaker}</p>}
                      <p className="text-sm text-gray-300 leading-relaxed">{seg.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{meeting.raw_transcript}</p>
              )}
            </div>
            {(transcript.length > 5 || (meeting.raw_transcript && meeting.raw_transcript.length > 400)) && (
              <button
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                {showFullTranscript ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show full transcript</>}
              </button>
            )}
          </SectionCard>
        )}

      </div>
      
      {/* Edit Meeting Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Edit Meeting</h2>
            <form onSubmit={handleEditMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Meeting Title *</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                  required
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

      <ClipadMobileNav />
    </div>
  );
}
