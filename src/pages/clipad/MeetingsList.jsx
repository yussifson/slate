import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Calendar, Video, Search, Clock, Users, ArrowRight, Sparkles, Filter, CheckCircle, Flame, ArrowLeft, Target } from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { useAuth } from '@/lib/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import NotificationsDropdown from '@/components/clipad/NotificationsDropdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ClipadMobileNav from '@/components/clipad/ClipadMobileNav';

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

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 page-enter overflow-x-hidden pb-24 md:pb-8">
      {/* Sleek top nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm text-primary">
            <CliPadLogo size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:block">CliPad</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          <button onClick={() => navigate('/spaces')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Spaces</button>
          <button onClick={() => navigate('/meetings')} className="hidden md:block px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg transition-colors">Meetings</button>
          <button onClick={() => navigate('/chat')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Chat</button>
          <button onClick={() => navigate('/analytics')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">Analytics</button>
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
          
          <ThemeToggle />
          <NotificationsDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center font-bold text-sm text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95 ml-1 overflow-hidden border border-primary/20">
                {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <img src={user.avatar_url || user.user_metadata.avatar_url} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                  firstName[0]?.toUpperCase()
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800">
              <div className="px-3 py-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="font-semibold text-sm truncate">{user?.full_name || user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl py-2.5 px-3 cursor-pointer">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem onClick={() => window.location.href = 'https://account.optavel.com'} className="rounded-xl py-2.5 px-3 cursor-pointer text-slate-500">
                <UserCircle className="w-4 h-4 mr-2" /> Go to Optavel Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 flex items-center gap-3"><Calendar className="w-7 h-7 text-primary" /> Meetings History</h1>
            <p className="text-slate-500 dark:text-slate-400">Past meetings, AI summaries, and pending action items.</p>
          </div>
          <button
            onClick={startInstantMeeting}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md shadow-primary/20 transition-all disabled:opacity-60 shrink-0"
          >
            {isCreating ? <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" /> : <Video className="w-4 h-4" />}
            Start Instant Meeting
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search meetings..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-primary/50 shadow-sm transition-all"
            />
          </div>
          <div className="flex gap-2 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            {[{id: 'all', label: 'All'}, {id: 'summary', label: 'Has AI Summary'}, {id: 'actions', label: 'Open Actions'}].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${filter === f.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-white dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl">
            <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-2">No meetings found</h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Start a meeting to see it appear here with full AI summaries and action items.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(m => (
              <div
                key={m.id}
                onClick={() => navigate(`/meetings/${m.id}`)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{m.title || 'Team Meeting'}</h3>
                    {m.space && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">{m.space.name}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(m.created_at).toLocaleDateString()} at {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    {m.duration_seconds > 0 && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{Math.floor(m.duration_seconds/60)}m {m.duration_seconds%60}s</span>}
                    {m.participant_count > 0 && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{m.participant_count} joined</span>}
                  </div>
                  {m.ai_summary && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-1 border-l-2 border-primary/30 pl-3 italic">
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
      <ClipadMobileNav />
    </div>
  );
}
