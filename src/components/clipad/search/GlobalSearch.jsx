import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video,
  Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink, Zap, Lock,
  Command, CommandIcon, Bot, CornerDownLeft
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { buildOrgContext } from '@/lib/clipadIntelligence';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isSpaceman } from '@/lib/constants';
import { OrbitIcon } from '@/components/ui/OrbitIcon';

const TYPE_META = {
  meeting:  { icon: Calendar,      label: 'Meeting',   color: 'text-blue-500',   bg: 'bg-blue-500/10',    route: (id) => `/meetings/${id}` },
  video:    { icon: Video,         label: 'Video',     color: 'text-purple-500', bg: 'bg-purple-500/10',  route: (id) => `/watch/${id}` },
  doc:      { icon: FileText,      label: 'Doc',       color: 'text-emerald-500',bg: 'bg-emerald-500/10', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=docs&docId=${id}` : null },
  task:     { icon: CheckCircle,   label: 'Task',      color: 'text-amber-500',  bg: 'bg-amber-500/10',   route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=tasks&taskId=${id}` : null },
  message:  { icon: MessageSquare, label: 'Chat',      color: 'text-indigo-500', bg: 'bg-indigo-500/10',  route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=chat` : null },
  decision: { icon: ShieldAlert,   label: 'Decision',  color: 'text-rose-500',   bg: 'bg-rose-500/10',    route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=decisions` : null },
  blocker:  { icon: AlertTriangle, label: 'Blocker',   color: 'text-orange-500', bg: 'bg-orange-500/10',  route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=overview` : null },
  standup:  { icon: Zap,           label: 'Standup',   color: 'text-teal-500',   bg: 'bg-teal-500/10',    route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=standup` : null },
};

const SUGGESTIONS = [
  'What decisions were made last week?',
  'Show me overdue tasks',
  'Find recent meetings about pricing',
  'Any blockers in engineering?',
  'What videos were recorded this month?',
];

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(id);
    }, 15);
    return () => clearInterval(id);
  }, [text]);
  return <span>{displayed}</span>;
}

/**
 * Fetches the set of space IDs the current user can access.
 * - Admins: all spaces in company.
 * - Spacemans & members: public spaces + private spaces they're explicitly in.
 */
async function fetchAccessibleSpaceIds(user) {
  if (!user?.company_id) return new Set();
  if (isAdmin(user)) {
    const { data } = await supabase.from('clipad_spaces').select('id').eq('company_id', user.company_id);
    return new Set((data || []).map(s => s.id));
  }
  const { data: memberships } = await supabase.from('clipad_space_members').select('space_id').eq('user_id', user.id);
  const memberSpaceIds = new Set((memberships || []).map(m => m.space_id));
  const { data: publicSpaces } = await supabase.from('clipad_spaces').select('id').eq('company_id', user.company_id).eq('is_private', false);
  (publicSpaces || []).forEach(s => memberSpaceIds.add(s.id));
  return memberSpaceIds;
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiSources, setAiSources] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(v => !v);
      }
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    const handleCustomOpen = () => setIsOpen(true);
    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('open-global-search', handleCustomOpen);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('open-global-search', handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setQuery(''); setResults([]); setAiAnswer(''); setAiSources([]); setHasSearched(false); setFocusedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSearch = useCallback(async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setIsSearching(true);
    setResults([]);
    setAiAnswer('');
    setAiSources([]);
    setHasSearched(true);
    setFocusedIndex(-1);

    try {
      // === CONTEXT-AWARE SECURITY ===
      const accessibleSpaceIds = await fetchAccessibleSpaceIds(user);
      const spaceIdArr = Array.from(accessibleSpaceIds);
      const term = `%${q}%`;

      let formatted = [];

      if (term) {
        const spaceIdsStr = spaceIdArr.length > 0 ? spaceIdArr.join(',') : '00000000-0000-0000-0000-000000000000';
        const isUserAdmin = isAdmin(user);
        const cid = user.company_id;

        const getFilter = () => isUserAdmin ? `company_id.eq.${cid}` : `space_id.in.(${spaceIdsStr})`;
        const getWsFilter = () => isUserAdmin ? `workspace_id.eq.${cid}` : `space_id.in.(${spaceIdsStr})`;
        
        const videoFilter = isUserAdmin ? `company_id.eq.${cid}` : `space_id.in.(${spaceIdsStr}),creator_id.eq.${user.id}`;
        const meetingFilter = isUserAdmin ? `workspace_id.eq.${cid}` : `space_id.in.(${spaceIdsStr}),host_id.eq.${user.id}`;
        const decisionFilter = isUserAdmin ? `workspace_id.eq.${cid}` : `team_space_id.in.(${spaceIdsStr})`;
        const blockerFilter = isUserAdmin ? `workspace_id.eq.${cid}` : `team_space_id.in.(${spaceIdsStr})`;

        const [docs, tasks, messages, meetings, decisions, videos, blockers, standups] = await Promise.all([
          supabase.from('clipad_docs').select('id, title, content, space_id').or(getFilter()).ilike('title', term).limit(5),
          supabase.from('clipad_action_items').select('id, title, context, space_id').or(getWsFilter()).ilike('title', term).limit(5),
          supabase.from('clipad_messages').select('id, content, space_id').in('space_id', spaceIdArr).ilike('content', term).limit(3),
          supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id').or(meetingFilter).ilike('title', term).limit(5),
          supabase.from('clipad_decisions').select('id, decision_text, team_space_id').or(decisionFilter).ilike('decision_text', term).limit(3),
          supabase.from('clipad_videos').select('id, title, ai_summary, space_id').or(videoFilter).ilike('title', term).limit(5),
          supabase.from('clipad_blockers').select('id, description, team_space_id').or(blockerFilter).ilike('description', term).limit(3),
          spaceIdArr.length > 0
            ? supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').in('space_id', spaceIdArr).or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(5)
            : supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(5),
        ]);

        formatted = [
          ...(docs.data || []).map(d => ({ type: 'doc', id: d.id, space_id: d.space_id, label: d.title, snippet: d.content?.substring(0, 120) })),
          ...(tasks.data || []).map(t => ({ type: 'task', id: t.id, space_id: t.space_id, label: t.title, snippet: t.context?.substring(0, 120) })),
          ...(messages.data || []).map(m => ({ type: 'message', id: m.id, space_id: m.space_id, label: 'Chat Message', snippet: m.content?.substring(0, 120) })),
          ...(meetings.data || []).map(m => ({ type: 'meeting', id: m.id, space_id: m.space_id, label: m.title || 'Team Meeting', snippet: m.ai_summary?.substring(0, 120) })),
          ...(decisions.data || []).map(d => ({ type: 'decision', id: d.id, space_id: d.team_space_id, label: 'Decision', snippet: d.decision_text?.substring(0, 120) })),
          ...(videos.data || []).map(v => ({ type: 'video', id: v.id, space_id: v.space_id, label: v.title || 'Video', snippet: v.ai_summary?.substring(0, 120) })),
          ...(blockers.data || []).map(b => ({ type: 'blocker', id: b.id, space_id: b.team_space_id, label: 'Blocker', snippet: b.description?.substring(0, 120) })),
          ...(standups.data || []).map(s => ({ type: 'standup', id: s.id, space_id: s.space_id, label: `Standup \u2014 ${s.user_name || 'Team member'} (${s.created_at?.slice(0,10)})`, snippet: s.today?.substring(0, 120) })),
        ];
      }

      setResults(formatted);
      setIsSearching(false);

      // === AI synthesis ===
      setIsSynthesizing(true);
      const userRole = isAdmin(user) ? 'Company Admin' : isSpaceman(user) ? 'Spaceman (Space Admin)' : 'Member';

      let fullOrgContext = '';
      try {
        const { contextText } = await buildOrgContext({ limit: 25, spaceIds: spaceIdArr, companyId: user.company_id });
        if (contextText && contextText.length > 50) fullOrgContext = contextText;
      } catch (ctxErr) {
        console.warn('[GlobalSearch] Could not load full org context:', ctxErr.message);
      }

      const keywordResultsContext = formatted.length > 0
        ? `\\n\\nKEYWORD SEARCH RESULTS (${formatted.length} records matched "${q}"):\\n` +
          formatted.map(r => `[${r.type.toUpperCase()} ID:${r.id}] ${r.label}: ${r.snippet || ''}`).join('\\n')
        : `\\n\\nKEYWORD SEARCH: No records matched "${q}" directly \u2014 but check the org context above.`;

      const raw = await generateText([
        {
          role: 'system',
          content: `You are OrbitFlow, the AI intelligence assistant with deep knowledge of this organization.

CRITICAL SECURITY: You are responding to "${user?.full_name || 'a user'}" who has the role "${userRole}".
You ONLY have access to data from the ${spaceIdArr.length} spaces this user is authorized to see.
NEVER reveal data from spaces this user is NOT in.

You have access to the FULL LIVE organizational memory below. Use it to answer the user's question thoroughly.
If the answer exists in the data, say so clearly with specifics (names, dates, details).
If it does NOT exist, say "I don't see any [X] in your accessible spaces right now."
NEVER say something doesn't exist if the data shows it does.

${fullOrgContext ? `FULL ORG CONTEXT:\\n${fullOrgContext}` : ''}
${keywordResultsContext}

Be concise but informative (2-4 sentences). Focus on actionable insights.
After your answer, list the IDs of the most relevant sources as JSON: SOURCES:[{"id":"<id>","type":"<type>"}].`,
        },
        { role: 'user', content: `Query: "${q}"` },
      ]);

      const sourcesMatch = (raw || '').match(/SOURCES:\s*(\[.*?\])/s);
      let sources = [];
      let answer = (raw || '').replace(/SOURCES:.*$/s, '').trim();
      if (sourcesMatch) {
        try { sources = JSON.parse(sourcesMatch[1]); } catch { /* ignore */ }
      }
      setAiAnswer(answer);
      setAiSources(sources.map(s => formatted.find(r => r.id === s.id)).filter(Boolean));
    } catch (err) {
      console.error('[GlobalSearch]', err);
      setIsSearching(false);
    } finally {
      setIsSynthesizing(false);
    }
  }, [query, user]);

  const handleResultClick = (res) => {
    const meta = TYPE_META[res.type];
    const route = meta?.route(res.id, res.space_id);
    if (route) { navigate(route); setIsOpen(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, -1)); }
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 h-9 bg-slate-100 dark:bg-secondary/60 hover:bg-slate-200 dark:hover:bg-secondary text-slate-500 dark:text-muted-foreground rounded-xl transition-all border border-slate-200 dark:border-border/60 w-full max-w-xs min-w-[120px] active:scale-[0.98]"
        >
          <Search className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="text-sm flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">Search or ask...</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-card px-1.5 py-0.5 rounded-md text-slate-400 border border-slate-200 dark:border-border shrink-0 hidden lg:block tracking-widest font-semibold shadow-sm">⌘K</kbd>
        </button>
        <button onClick={() => setIsOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-foreground transition-colors active:scale-90">
          <Search className="w-5 h-5" />
        </button>
      </>
    );
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[8vh] px-4 pb-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onMouseDown={(e) => { if (e.target === overlayRef.current) setIsOpen(false); }}
    >
      <style>{`
        @keyframes spotlightIn {
          0% { opacity: 0; transform: scale(0.96) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
      <div
        className="w-full max-w-[720px] flex flex-col rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#0F1420]/95 backdrop-blur-2xl relative"
        style={{ animation: 'spotlightIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Animated Gradient Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-500 to-indigo-500 opacity-80"></div>

        {/* Search Input Row */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.04] dark:border-white/[0.06] relative">
          {isSearching || isSynthesizing ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0 relative" style={{ animation: aiAnswer ? 'glowPulse 2s infinite' : 'none' }}>
              <OrbitIcon className="w-4 h-4 text-white fill-white" />
            </div>
          )}
          
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask OrbitFlow or search your workspace..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white text-[18px] font-medium placeholder-slate-400 min-w-0"
            style={{ paddingLeft: 0, paddingRight: 0, caretColor: '#10b981' }}
          />
          
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setAiAnswer(''); setHasSearched(false); inputRef.current?.focus(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isSearching}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-white dark:text-slate-900 text-[13px] font-bold transition-all shadow-md active:scale-[0.98]"
            >
              Ask AI
              <CornerDownLeft className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden scrollbar-none pb-2">
          
          {/* Initial Suggestion State */}
          {!hasSearched && !isSearching && (
            <div className="p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Ask OrbitFlow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20 transition-all group text-left active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <span className="text-[14px] text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{s}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center gap-2 justify-center">
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="text-[12px] text-slate-400 font-medium">
                  Secure context: <span className="text-slate-700 dark:text-slate-200">{isAdmin(user) ? 'Entire Organization' : 'Your Accessible Spaces'}</span>
                </span>
              </div>
            </div>
          )}

          {/* AI Response Card (Premium Glassmorphic) */}
          {(aiAnswer || isSynthesizing) && !isSearching && (
            <div className="mx-4 mt-4 mb-2 p-[1px] rounded-3xl bg-gradient-to-br from-emerald-400/30 via-teal-500/10 to-transparent">
              <div className="rounded-[23px] bg-white dark:bg-[#151B28] p-5 shadow-inner">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                    <OrbitIcon className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                  <span className="text-[15px] font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">OrbitFlow Analysis</span>
                  {isSynthesizing && (
                    <div className="flex items-center gap-1.5 ml-auto bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </div>
                
                <div className="pl-1">
                  {isSynthesizing ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-full w-full" />
                      <div className="h-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-full w-5/6" />
                      <div className="h-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-full w-3/4" />
                    </div>
                  ) : (
                    <div className="text-[16px] leading-relaxed text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                      <TypewriterText text={aiAnswer} />
                    </div>
                  )}
                </div>

                {/* Sources Chips */}
                {aiSources.length > 0 && !isSynthesizing && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">Sources</span>
                    {aiSources.map((src, i) => {
                      const meta = TYPE_META[src.type];
                      const Icon = meta?.icon || FileText;
                      return (
                        <button
                          key={i}
                          onClick={() => handleResultClick(src)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/10 transition-all hover:scale-105 active:scale-95 group"
                        >
                          <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-500'}`} />
                          <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{src.label}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regular Search Results List */}
          {results.length > 0 && !isSearching && (
            <div className="px-4 py-3">
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Direct Matches</h4>
              <div className="space-y-1">
                {results.map((res, i) => {
                  const meta = TYPE_META[res.type] || {};
                  const Icon = meta.icon || Search;
                  const isFocused = focusedIndex === i;
                  return (
                    <button
                      key={`${res.type}-${res.id}-${i}`}
                      onClick={() => handleResultClick(res)}
                      className={`w-full text-left px-4 py-3.5 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group border ${isFocused ? 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${meta.bg || 'bg-slate-100'} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-4.5 h-4.5 ${meta.color || 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{res.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${meta.bg} ${meta.color} tracking-wide uppercase`}>{meta.label}</span>
                        </div>
                        {res.snippet && <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 truncate pr-4">{res.snippet}</p>}
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results State */}
          {hasSearched && !isSearching && !isSynthesizing && results.length === 0 && !aiAnswer && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center mb-5">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-[17px] font-bold text-slate-900 dark:text-white">No matches found</p>
              <p className="text-[14px] mt-1 text-slate-500 dark:text-slate-400 max-w-sm">
                OrbitFlow couldn't find any direct matches in your accessible spaces.
              </p>
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <div className="px-6 py-3 border-t border-black/[0.04] dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#0B0F19]/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded-md border border-slate-200 dark:border-white/10 shadow-sm font-sans">↑↓</kbd> navigate
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded-md border border-slate-200 dark:border-white/10 shadow-sm font-sans">↵</kbd> open
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded-md border border-slate-200 dark:border-white/10 shadow-sm font-sans">esc</kbd> close
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-500">
            Powered by Orbit
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
