import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Calendar, Video, Search, Clock, Users, ArrowRight, Sparkles, Filter, CheckCircle, Flame } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function MeetingsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'summary', 'actions'
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    // In a real app we'd fetch meetings for spaces the user is in. For now, fetch all.
    const { data } = await supabase.from('clipad_meeting_records')
      .select('*, space:space_id(name)')
      .order('created_at', { ascending: false });
    
    // Fetch action items count for each meeting
    const { data: actions } = await supabase.from('clipad_action_items').select('meeting_id, is_complete');
    
    if (data) {
      const enhanced = data.map(m => {
        const mActions = actions?.filter(a => a.meeting_id === m.id) || [];
        return {
          ...m,
          actions_total: mActions.length,
          actions_open: mActions.filter(a => !a.is_complete).length
        };
      });
      setMeetings(enhanced);
    }
    setLoading(false);
  };

  const startInstantMeeting = async () => {
    setIsCreating(true);
    try {
      const { data } = await supabase.functions.invoke('create-daily-room', { body: { instant: true } });
      if (data?.name) navigate(`/join/${data.name}`);
      else navigate(`/join/${Math.random().toString(36).substring(2, 10)}`);
    } catch {
      navigate(`/join/${Math.random().toString(36).substring(2, 10)}`);
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = meetings.filter(m => {
    if (search && !m.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'summary' && !m.ai_summary) return false;
    if (filter === 'actions' && m.actions_open === 0) return false;
    return true;
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter text-foreground">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-background page-enter/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Video className="w-4 h-4 text-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">CliPad</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Dashboard</button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-1 flex items-center gap-3"><Calendar className="w-7 h-7 text-primary" /> Meetings History</h1>
            <p className="text-muted-foreground text-sm">Past meetings, AI summaries, and pending action items.</p>
          </div>
          <button
            onClick={startInstantMeeting}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-foreground text-sm font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-60"
          >
            {isCreating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Video className="w-4 h-4" />}
            Start Instant Meeting
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search meetings..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2 p-1 bg-secondary rounded-xl border border-border shrink-0">
            {[{id: 'all', label: 'All'}, {id: 'summary', label: 'Has AI Summary'}, {id: 'actions', label: 'Open Actions'}].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${filter === f.id ? 'bg-secondary/80 text-foreground' : 'text-muted-foreground hover:text-gray-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-3xl">
            <Calendar className="w-16 h-16 text-gray-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground mb-2">No meetings found</h3>
            <p className="text-muted-foreground text-sm">Start a meeting to see it appear here with full AI summaries and action items.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(m => (
              <div
                key={m.id}
                onClick={() => navigate(`/meetings/${m.id}`)}
                className="group p-5 rounded-2xl bg-card border border-border hover:border-white/12 cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-foreground truncate">{m.title || 'Team Meeting'}</h3>
                    {m.space && <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] uppercase font-bold">{m.space.name}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(m.created_at).toLocaleDateString()} at {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    {m.duration_seconds > 0 && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{Math.floor(m.duration_seconds/60)}m {m.duration_seconds%60}s</span>}
                    {m.participant_count > 0 && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{m.participant_count} joined</span>}
                  </div>
                  {m.ai_summary && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-1 border-l-2 border-pink-500/30 pl-3 italic">
                      "{m.ai_summary.split('\n')[0]}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 md:w-48 justify-end shrink-0">
                  {m.actions_open > 0 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
                      <Target className="w-3.5 h-3.5" /> {m.actions_open} open tasks
                    </div>
                  ) : m.actions_total > 0 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> All tasks done
                    </div>
                  ) : null}
                  {m.ai_summary && <Sparkles className="w-4 h-4 text-primary shrink-0" />}
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
