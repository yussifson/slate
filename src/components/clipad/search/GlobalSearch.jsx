import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video,
  Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink, Zap, Lock,
  Command, Bot, CornerDownLeft, Filter, Check, Layers, ChevronRight, Copy, CheckCheck, Folder
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { buildOrgContext } from '@/lib/clipadIntelligence';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isSpaceman } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

const TYPE_META = {
  meeting:     { icon: Calendar,      label: 'Meeting',   color: 'text-blue-700 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50',     route: (id) => `/meetings/${id}` },
  video:       { icon: Video,         label: 'Video',     color: 'text-purple-700 dark:text-purple-400',   bg: 'bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50', route: (id) => `/watch/${id}` },
  doc:         { icon: FileText,      label: 'Doc',       color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50',route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=docs&docId=${id}` : null },
  task:        { icon: CheckCircle,   label: 'Task',      color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50',   route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=tasks&taskId=${id}` : null },
  message:     { icon: MessageSquare, label: 'Chat',      color: 'text-indigo-700 dark:text-indigo-400',   bg: 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/50', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=chat` : null },
  decision:    { icon: ShieldAlert,   label: 'Decision',  color: 'text-rose-700 dark:text-rose-400',       bg: 'bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/50',     route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=decisions` : null },
  blocker:     { icon: AlertTriangle, label: 'Blocker',   color: 'text-orange-700 dark:text-orange-400',   bg: 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=overview` : null },
  standup:     { icon: Zap,           label: 'Standup',   color: 'text-teal-700 dark:text-teal-400',       bg: 'bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700/50',     route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=standup` : null },
  integration: { icon: ExternalLink,  label: 'Imported',  color: 'text-slate-700 dark:text-slate-400',     bg: 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',   route: (id) => `/integrations` },
};

const SUGGESTIONS = [
  { key: '1', text: 'What decisions were made last week?', type: 'decision', icon: ShieldAlert, color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60' },
  { key: '2', text: 'Show me overdue tasks across spaces', type: 'task', icon: CheckCircle, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60' },
  { key: '3', text: 'Find recent meetings about pricing', type: 'meeting', icon: Calendar, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60' },
  { key: '4', text: 'Any active blockers in engineering?', type: 'blocker', icon: AlertTriangle, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60' },
  { key: '5', text: 'What videos were recorded this month?', type: 'video', icon: Video, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60' },
  { key: '6', text: 'Summarize key updates from standups', type: 'standup', icon: Zap, color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'doc', label: 'Docs' },
  { id: 'task', label: 'Tasks' },
  { id: 'meeting', label: 'Meetings' },
  { id: 'decision', label: 'Decisions' },
  { id: 'message', label: 'Chats' },
];

const FILTER_TYPE_MAP = {
  all: null,
  doc: ['doc', 'integration'],
  task: ['task', 'blocker', 'standup'],
  meeting: ['meeting', 'video'],
  decision: ['decision', 'blocker'],
  message: ['message'],
};

const matchesFilter = (itemType, filterId) => {
  if (!filterId || filterId === 'all') return true;
  const allowed = FILTER_TYPE_MAP[filterId];
  return allowed ? allowed.includes(itemType) : itemType === filterId;
};

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
    }, 10);
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
  const { toast } = useToast();

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
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [spacesMap, setSpacesMap] = useState({});
  const [accessibleCount, setAccessibleCount] = useState(0);

  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Load space names map for context chips
  useEffect(() => {
    if (!user?.company_id) return;
    supabase.from('clipad_spaces').select('id, name').eq('company_id', user.company_id).then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(s => { map[s.id] = s.name; });
        setSpacesMap(map);
      }
    });
  }, [user]);

  // Global Keyboard listener (⌘K / Ctrl+K)
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
      setQuery(''); setResults([]); setAiAnswer(''); setAiSources([]); setHasSearched(false); setFocusedIndex(-1); setSelectedFilter('all'); setCopiedAnswer(false);
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
      setAccessibleCount(spaceIdArr.length);
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

  const filteredResults = results.filter(r => matchesFilter(r.type, selectedFilter));

  // Number key shortcuts on zero state (1..6)
  const handleKeyDown = (e) => {
    if (!hasSearched && !query && ['1','2','3','4','5','6'].includes(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      if (SUGGESTIONS[idx]) {
        e.preventDefault();
        setQuery(SUGGESTIONS[idx].text);
        handleSearch(SUGGESTIONS[idx].text);
        return;
      }
    }
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

  const handleCopyAnswer = () => {
    if (!aiAnswer) return;
    navigator.clipboard.writeText(aiAnswer);
    setCopiedAnswer(true);
    toast({ title: 'Copied', description: 'AI answer copied to clipboard.' });
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const getScopeCount = (filterId) => {
    if (filterId === 'all') return results.length;
    return results.filter(r => matchesFilter(r.type, filterId)).length;
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3.5 h-9 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-all border border-slate-200 dark:border-slate-800 w-full max-w-xs min-w-[140px] shadow-2xs hover:shadow-xs active:scale-[0.99] group"
        >
          <Search className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">Search or ask OrbitFlow...</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shrink-0 hidden lg:flex items-center gap-0.5 tracking-wider font-bold shadow-2xs">
            ⌘K
          </kbd>
        </button>
        <button 
          onClick={() => setIsOpen(true)} 
          className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[6vh] sm:pt-[9vh] px-3 sm:px-4 pb-6"
      style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onMouseDown={(e) => { if (e.target === overlayRef.current) setIsOpen(false); }}
    >
      <style>{`
        @keyframes spotlightFadeIn {
          0% { opacity: 0; transform: scale(0.98) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      
      {/* Crisp, clean, enterprise modal container — no logo, center-aligned input */}
      <div
        className="w-full max-w-[720px] flex flex-col rounded-xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1117] relative"
        style={{ animation: 'spotlightFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Search Header Row — Spacious, 20px font, premium Spotlight input */}
        <div className="flex items-center justify-between gap-4 px-7 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0D1117] relative">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            {isSearching || isSynthesizing ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 stroke-[2]" />
            )}
          </div>
          
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask OrbitFlow AI or search docs, tasks, meetings..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-50 text-[19px] sm:text-[20px] font-semibold placeholder:text-slate-400/90 dark:placeholder:text-slate-500 placeholder:font-normal min-w-0 tracking-tight text-center placeholder:text-center h-9"
            style={{ caretColor: '#10b981' }}
          />
          
          <div className="flex items-center gap-2 shrink-0 min-w-[56px] justify-end">
            {query ? (
              <button
                onClick={() => { setQuery(''); setResults([]); setAiAnswer(''); setHasSearched(false); inputRef.current?.focus(); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-2xs">
                ESC
              </span>
            )}
          </div>
        </div>

        {/* Scope Filter Tabs Bar (Shown when typing or after search) */}
        {(hasSearched || query.length > 0) && (
          <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-2 flex items-center gap-1 shrink-0 uppercase tracking-wider">
              <Filter className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Scope
            </span>
            {FILTER_TABS.map(tab => {
              const count = getScopeCount(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => { setSelectedFilter(tab.id); setFocusedIndex(-1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedFilter === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      selectedFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="max-h-[58vh] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-[#0D1117]">
          
          {/* Zero State Suggestions Grid (Clean rectangular cards with high-contrast colors) */}
          {!hasSearched && !isSearching && query.length === 0 && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Suggested AI Queries
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">Press 1-6 or click</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setQuery(item.text); handleSearch(item.text); }}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-900/60 dark:hover:bg-emerald-950/30 border border-slate-200/90 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-700/60 transition-all text-left active:scale-[0.99] shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-8.5 h-8.5 rounded-lg ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {item.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <kbd className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shadow-2xs">
                          {item.key}
                        </kbd>
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* OrbitFlow AI Answer Box */}
          {(aiAnswer || isSynthesizing) && !isSearching && (
            <div className="mx-6 mt-5 mb-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-emerald-500/30 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    OrbitFlow Intelligence {selectedFilter !== 'all' ? `\u2022 ${FILTER_TABS.find(t => t.id === selectedFilter)?.label}` : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {isSynthesizing ? (
                    <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 px-2.5 py-0.5 rounded-full">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Synthesizing</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  ) : (
                    aiAnswer && (
                      <button
                        onClick={handleCopyAnswer}
                        className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        title="Copy answer"
                      >
                        {copiedAnswer ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[11px] font-semibold">{copiedAnswer ? 'Copied' : 'Copy'}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
              
              <div>
                {isSynthesizing ? (
                  <div className="space-y-2.5 py-1 animate-pulse">
                    <div className="h-3.5 bg-emerald-200/60 dark:bg-emerald-900/40 rounded-md w-full" />
                    <div className="h-3.5 bg-emerald-200/60 dark:bg-emerald-900/40 rounded-md w-11/12" />
                    <div className="h-3.5 bg-emerald-200/60 dark:bg-emerald-900/40 rounded-md w-4/5" />
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 font-medium whitespace-pre-wrap">
                    <TypewriterText text={aiAnswer} />
                  </div>
                )}
              </div>

              {/* Verified Sources Chips */}
              {aiSources.length > 0 && !isSynthesizing && (
                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
                    Verified Sources ({aiSources.length})
                  </span>
                  {aiSources.map((src, i) => {
                    const meta = TYPE_META[src.type];
                    const Icon = meta?.icon || FileText;
                    return (
                      <button
                        key={i}
                        onClick={() => handleResultClick(src)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-2xs"
                      >
                        <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-600'}`} />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[160px] truncate">{src.label}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors ml-0.5" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Filter Empty Notice */}
          {selectedFilter !== 'all' && filteredResults.length === 0 && results.length > 0 && !isSearching && (
            <div className="mx-6 my-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                No {FILTER_TABS.find(t => t.id === selectedFilter)?.label} matched "{query}"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                There are {results.length} result{results.length > 1 ? 's' : ''} in other categories.
              </p>
              <button
                onClick={() => setSelectedFilter('all')}
                className="mt-2.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                Show All ({results.length}) Results
              </button>
            </div>
          )}

          {/* Search Results List */}
          {filteredResults.length > 0 && !isSearching && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {selectedFilter === 'all' ? 'All Matches' : `${FILTER_TABS.find(t => t.id === selectedFilter)?.label || selectedFilter} Matches`} ({filteredResults.length})
                </h4>
              </div>
              <div className="space-y-1.5">
                {filteredResults.map((res, i) => {
                  const meta = TYPE_META[res.type] || {};
                  const Icon = meta.icon || Search;
                  const isFocused = focusedIndex === i;
                  const spaceName = res.space_id ? spacesMap[res.space_id] : null;

                  return (
                    <button
                      key={`${res.type}-${res.id}-${i}`}
                      onClick={() => handleResultClick(res)}
                      className={`w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all flex items-center gap-3.5 group border ${
                        isFocused
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 shadow-2xs'
                          : 'bg-white dark:bg-[#0D1117] border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg ${meta.bg || 'bg-slate-100'} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-4 h-4 ${meta.color || 'text-slate-600'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{res.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} tracking-wider uppercase shrink-0`}>
                            {meta.label}
                          </span>
                          {spaceName && (
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[140px]">
                              <Folder className="w-3 h-3 shrink-0 text-slate-400" />
                              {spaceName}
                            </span>
                          )}
                        </div>
                        {res.snippet && (
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1 truncate pr-2">
                            {res.snippet}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Jump</span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Results State */}
          {hasSearched && !isSearching && !isSynthesizing && results.length === 0 && !aiAnswer && (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4 text-slate-400">
                <Search className="w-7 h-7 stroke-[1.5]" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">No matches found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                No direct records matched "{query}". Try adjusting keywords or filtering by a different space.
              </p>
            </div>
          )}
        </div>

        {/* Enterprise Status Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-[#080B10] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">esc</kbd>
              <span>Dismiss</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold border-r border-slate-200 dark:border-slate-800 pr-3.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Context: <strong className="text-slate-900 dark:text-slate-100 font-bold">{isAdmin(user) ? 'Entire Organization' : `${accessibleCount || 'Authorized'} Spaces`}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
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
