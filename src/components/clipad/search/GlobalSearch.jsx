import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video,
  Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink, Zap, Lock,
  Command, Bot, CornerDownLeft, Filter, Check, Layers, ChevronRight
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { buildOrgContext } from '@/lib/clipadIntelligence';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isSpaceman } from '@/lib/constants';
import { OrbitIcon } from '@/components/ui/OrbitIcon';

const TYPE_META = {
  meeting:     { icon: Calendar,      label: 'Meeting',   color: 'text-blue-500 dark:text-blue-400',       bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',     route: (id) => `/meetings/${id}` },
  video:       { icon: Video,         label: 'Video',     color: 'text-purple-500 dark:text-purple-400',   bg: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20', route: (id) => `/watch/${id}` },
  doc:         { icon: FileText,      label: 'Doc',       color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=docs&docId=${id}` : null },
  task:        { icon: CheckCircle,   label: 'Task',      color: 'text-amber-500 dark:text-amber-400',     bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',   route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=tasks&taskId=${id}` : null },
  message:     { icon: MessageSquare, label: 'Chat',      color: 'text-indigo-500 dark:text-indigo-400',   bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=chat` : null },
  decision:    { icon: ShieldAlert,   label: 'Decision',  color: 'text-rose-500 dark:text-rose-400',       bg: 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20',     route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=decisions` : null },
  blocker:     { icon: AlertTriangle, label: 'Blocker',   color: 'text-orange-500 dark:text-orange-400',   bg: 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=overview` : null },
  standup:     { icon: Zap,           label: 'Standup',   color: 'text-teal-500 dark:text-teal-400',       bg: 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20',     route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=standup` : null },
  integration: { icon: ExternalLink,  label: 'Imported',  color: 'text-slate-500 dark:text-slate-400',     bg: 'bg-slate-500/10 dark:bg-slate-500/20 border-slate-500/20',   route: (id) => `/integrations` },
};

const SUGGESTIONS = [
  { text: 'What decisions were made last week?', type: 'decision', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { text: 'Show me overdue tasks across spaces', type: 'task', icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { text: 'Find recent meetings about pricing', type: 'meeting', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { text: 'Any active blockers in engineering?', type: 'blocker', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { text: 'What videos were recorded this month?', type: 'video', icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { text: 'Summarize key updates from standups', type: 'standup', icon: Zap, color: 'text-teal-500', bg: 'bg-teal-500/10' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'doc', label: 'Docs' },
  { id: 'task', label: 'Tasks' },
  { id: 'meeting', label: 'Meetings' },
  { id: 'decision', label: 'Decisions' },
  { id: 'message', label: 'Chats' },
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
    }, 12);
    return () => clearInterval(id);
  }, [text]);
  return <span>{displayed}</span>;
}

/**
 * Fetches accessible space IDs for security scoping
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
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiSources, setAiSources] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [lastQuery, setLastQuery] = useState('');

  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Keyboard listener (⌘K / Ctrl+K)
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
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('open-global-search', handleCustomOpen);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('open-global-search', handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery(''); setResults([]); setAiAnswer(''); setAiSources([]); setHasSearched(false); setFocusedIndex(-1); setSelectedFilter('all');
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

    if (q === lastQuery && hasSearched && (aiAnswer || isSynthesizing)) return;
    setLastQuery(q);

    setIsSearching(true);
    setResults([]);
    setAiAnswer('');
    setAiSources([]);
    setHasSearched(true);
    setFocusedIndex(-1);

    try {
      const accessibleSpaceIds = await fetchAccessibleSpaceIds(user);
      const spaceIdArr = Array.from(accessibleSpaceIds);
      const term = `%${q}%`;

      let formatted = [];

      if (term) {
        const spaceIdsStr = spaceIdArr.length > 0 ? spaceIdArr.join(',') : '00000000-0000-0000-0000-000000000000';
        const cid = user.company_id;

        const getSpaceFilter = () => `space_id.in.(${spaceIdsStr})`;
        const getTeamSpaceFilter = () => `team_space_id.in.(${spaceIdsStr})`;
        
        const videoFilter = `space_id.in.(${spaceIdsStr})`;
        const meetingFilter = `space_id.in.(${spaceIdsStr})`;

        const [docs, tasks, messages, meetings, decisions, videos, blockers, standups, integrations] = await Promise.all([
          supabase.from('clipad_docs').select('id, title, content, space_id').or(getSpaceFilter()).ilike('title', term).limit(5),
          supabase.from('clipad_action_items').select('id, title, context, space_id').or(getSpaceFilter()).ilike('title', term).limit(5),
          supabase.from('clipad_messages').select('id, content, space_id').in('space_id', spaceIdArr).ilike('content', term).limit(3),
          supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id').or(meetingFilter).ilike('title', term).limit(5),
          supabase.from('clipad_decisions').select('id, decision_text, team_space_id').or(getTeamSpaceFilter()).ilike('decision_text', term).limit(3),
          supabase.from('clipad_videos').select('id, title, ai_summary, space_id').or(videoFilter).ilike('title', term).limit(5),
          supabase.from('clipad_blockers').select('id, description, team_space_id').or(getTeamSpaceFilter()).ilike('description', term).limit(3),
          spaceIdArr.length > 0
            ? supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').in('space_id', spaceIdArr).or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(5)
            : supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(5),
          supabase.from('clipad_imported_knowledge').select('id, title, content, provider, content_type').eq('company_id', cid).or(`title.ilike.${term},content.ilike.${term}`).limit(5),
        ]);

        formatted = [
          ...(docs.data || []).map(d => ({ type: 'doc', id: d.id, space_id: d.space_id, label: d.title, snippet: d.content?.substring(0, 140) })),
          ...(tasks.data || []).map(t => ({ type: 'task', id: t.id, space_id: t.space_id, label: t.title, snippet: t.context?.substring(0, 140) })),
          ...(messages.data || []).map(m => ({ type: 'message', id: m.id, space_id: m.space_id, label: 'Chat Message', snippet: m.content?.substring(0, 140) })),
          ...(meetings.data || []).map(m => ({ type: 'meeting', id: m.id, space_id: m.space_id, label: m.title || 'Team Meeting', snippet: m.ai_summary?.substring(0, 140) })),
          ...(decisions.data || []).map(d => ({ type: 'decision', id: d.id, space_id: d.team_space_id, label: 'Decision', snippet: d.decision_text?.substring(0, 140) })),
          ...(videos.data || []).map(v => ({ type: 'video', id: v.id, space_id: v.space_id, label: v.title || 'Video', snippet: v.ai_summary?.substring(0, 140) })),
          ...(blockers.data || []).map(b => ({ type: 'blocker', id: b.id, space_id: b.team_space_id, label: 'Blocker', snippet: b.description?.substring(0, 140) })),
          ...(standups.data || []).map(s => ({ type: 'standup', id: s.id, space_id: s.space_id, label: `Standup \u2014 ${s.user_name || 'Team member'} (${s.created_at?.slice(0,10)})`, snippet: s.today?.substring(0, 140) })),
          ...(integrations.data || []).map(i => ({ type: 'integration', id: i.id, space_id: null, label: `[${i.provider}] ${i.title}`, snippet: i.content?.substring(0, 140) })),
        ];
      }

      setResults(formatted);
      setIsSearching(false);

      // AI Synthesis
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
        : `\\n\\nKEYWORD SEARCH: No records matched "${q}" directly \u2014 check org context.`;

      const now = new Date();
      const timeContext = `CURRENT DATE & TIME: ${now.toLocaleDateString()} ${now.toLocaleTimeString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
      const userDepartment = user?.department ? ` in the ${user.department} department` : '';
      const userIndustry = user?.company_industry ? ` in the ${user.company_industry} industry` : '';

      const raw = await generateText([
        {
          role: 'system',
          content: `You are OrbitFlow AI, an enterprise intelligence assistant.

CRITICAL CONTEXT: 
- ${timeContext}.
- Responding to "${user?.full_name || 'a user'}".
- Role: "${userRole}"${userDepartment}${userIndustry}. 
- Access scoped strictly to ${spaceIdArr.length} authorized spaces.

ORGANIZATIONAL CONTEXT:
${fullOrgContext ? `FULL ORG CONTEXT:\n${fullOrgContext}` : ''}
${keywordResultsContext}

Instructions:
Be clear, direct, and concise (2-4 sentences). Focus on actionable enterprise answers.
If the requested data is found, state exact details, assignees, or dates.
After your answer, list source IDs as JSON: SOURCES:[{"id":"<id>","type":"<type>"}].`,
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
  }, [query, user, lastQuery, hasSearched, aiAnswer, isSynthesizing]);

  const handleResultClick = (res) => {
    const meta = TYPE_META[res.type];
    const route = meta?.route(res.id, res.space_id);
    if (route) { navigate(route); setIsOpen(false); }
  };

  const filteredResults = results.filter(r => selectedFilter === 'all' || r.type === selectedFilter);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && filteredResults[focusedIndex]) {
        handleResultClick(filteredResults[focusedIndex]);
      } else {
        handleSearch();
      }
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, filteredResults.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, -1)); }
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3.5 h-9 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded-xl transition-all border border-slate-200/80 dark:border-slate-800/80 w-full max-w-xs min-w-[140px] shadow-sm hover:shadow active:scale-[0.99] group"
        >
          <Search className="w-4 h-4 shrink-0 text-emerald-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">Search or ask OrbitFlow...</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0 hidden lg:flex items-center gap-0.5 tracking-wider font-semibold shadow-2xs">
            ⌘K
          </kbd>
        </button>
        <button 
          onClick={() => setIsOpen(true)} 
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </>
    );
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[7vh] sm:pt-[10vh] px-3 sm:px-4 pb-6"
      style={{ background: 'rgba(5, 8, 15, 0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onMouseDown={(e) => { if (e.target === overlayRef.current) setIsOpen(false); }}
    >
      <style>{`
        @keyframes spotlightScale {
          0% { opacity: 0; transform: scale(0.97) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes aiGlowPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
      
      <div
        className="w-full max-w-[700px] flex flex-col rounded-2xl overflow-hidden shadow-[0_24px_80px_-15px_rgba(0,0,0,0.4)] border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0C1017] backdrop-blur-2xl relative"
        style={{ animation: 'spotlightScale 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Top Radiant Shimmer Accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 shrink-0" />

        {/* Search Header Row */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] relative bg-slate-50/50 dark:bg-white/[0.01]">
          {isSearching || isSynthesizing ? (
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div 
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 relative transition-transform hover:scale-105"
              style={{ animation: aiAnswer ? 'aiGlowPulse 2.5s infinite' : 'none' }}
            >
              <OrbitIcon className="w-5 h-5 text-white" />
            </div>
          )}
          
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask OrbitFlow AI or search docs, tasks, meetings..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 text-[17px] font-medium placeholder-slate-400/80 min-w-0 tracking-tight"
            style={{ caretColor: '#10b981' }}
          />
          
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setAiAnswer(''); setHasSearched(false); inputRef.current?.focus(); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              ESC
            </span>
          </div>
        </div>

        {/* Filter Bar (Only visible when user starts typing or has results) */}
        {hasSearched && (
          <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/80 dark:bg-white/[0.02] overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1 shrink-0 uppercase tracking-wider">
              <Filter className="w-3 h-3" /> Scope
            </span>
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                  selectedFilter === tab.id
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Modal Body */}
        <div className="max-h-[58vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {/* Zero State Suggestions Grid */}
          {!hasSearched && !isSearching && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Suggested AI Queries
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Click to run query</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTIONS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => { setQuery(item.text); handleSearch(item.text); }}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.06] border border-slate-200/60 dark:border-white/[0.05] hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all text-left active:scale-[0.99] shadow-2xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                          {item.text}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Response Card (Enterprise Glass Box) */}
          {(aiAnswer || isSynthesizing) && !isSearching && (
            <div className="mx-4 sm:mx-5 mt-4 mb-3 p-[1px] rounded-2xl bg-gradient-to-br from-emerald-500/30 via-teal-500/15 to-indigo-500/30">
              <div className="rounded-[15px] bg-slate-50/90 dark:bg-[#111622] p-4 sm:p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/50 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                      OrbitFlow Intelligence
                    </span>
                  </div>
                  
                  {isSynthesizing && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Synthesizing</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </div>
                
                <div>
                  {isSynthesizing ? (
                    <div className="space-y-2.5 py-1 animate-pulse">
                      <div className="h-3.5 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-md w-full" />
                      <div className="h-3.5 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-md w-11/12" />
                      <div className="h-3.5 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-md w-4/5" />
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                      <TypewriterText text={aiAnswer} />
                    </div>
                  )}
                </div>

                {/* Sources Section */}
                {aiSources.length > 0 && !isSynthesizing && (
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
                      Verified Sources ({aiSources.length})
                    </span>
                    {aiSources.map((src, i) => {
                      const meta = TYPE_META[src.type];
                      const Icon = meta?.icon || FileText;
                      return (
                        <button
                          key={i}
                          onClick={() => handleResultClick(src)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.05] hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                        >
                          <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-500'}`} />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[160px] truncate">{src.label}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors ml-0.5" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Results List */}
          {filteredResults.length > 0 && !isSearching && (
            <div className="px-4 sm:px-5 py-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {selectedFilter === 'all' ? 'All Matches' : `${TYPE_META[selectedFilter]?.label || selectedFilter} Matches`} ({filteredResults.length})
                </h4>
              </div>
              <div className="space-y-1">
                {filteredResults.map((res, i) => {
                  const meta = TYPE_META[res.type] || {};
                  const Icon = meta.icon || Search;
                  const isFocused = focusedIndex === i;
                  return (
                    <button
                      key={`${res.type}-${res.id}-${i}`}
                      onClick={() => handleResultClick(res)}
                      className={`w-full text-left px-3.5 py-3 rounded-xl cursor-pointer transition-all flex items-center gap-3.5 group border ${
                        isFocused
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-100 shadow-2xs'
                          : 'border-transparent hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl ${meta.bg || 'bg-slate-100'} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-4 h-4 ${meta.color || 'text-slate-500'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{res.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.color} tracking-wider uppercase border border-current/20 shrink-0`}>
                            {meta.label}
                          </span>
                        </div>
                        {res.snippet && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 truncate pr-2">
                            {res.snippet}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Jump</span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results Empty State */}
          {hasSearched && !isSearching && !isSynthesizing && filteredResults.length === 0 && !aiAnswer && (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center mb-4 text-slate-400">
                <Search className="w-7 h-7 stroke-[1.5]" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">No matches found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                No direct records matched "{query}". Try adjusting keywords or filtering by a different space.
              </p>
            </div>
          )}
        </div>

        {/* Enterprise Footer Status Bar */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/90 dark:bg-[#090C13] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 font-mono text-[10px] font-semibold shadow-2xs">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 font-mono text-[10px] font-semibold shadow-2xs">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 font-mono text-[10px] font-semibold shadow-2xs">esc</kbd>
              <span>Dismiss</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium border-r border-slate-200 dark:border-white/10 pr-3">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Context: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{isAdmin(user) ? 'Entire Organization' : 'Authorized Spaces'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                OrbitFlow AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
