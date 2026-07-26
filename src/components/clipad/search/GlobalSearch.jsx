import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video,
  Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink, Zap, Lock,
  Command, Bot, CornerDownLeft, Filter, Check, Layers, ChevronRight, Copy, CheckCheck, Folder, Clock
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { buildOrgContext } from '@/lib/clipadIntelligence';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isSpaceman } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import ThinkingAccordion, { parseThinking } from '@/components/chat/ThinkingAccordion';

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

const DEFAULT_SUGGESTIONS = [
  { key: '1', text: 'What decisions were made last week?', type: 'decision', icon: ShieldAlert, color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60' },
  { key: '2', text: 'Show me overdue tasks across spaces', type: 'task', icon: CheckCircle, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60' },
  { key: '3', text: 'Find recent meetings about pricing', type: 'meeting', icon: Calendar, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60' },
  { key: '4', text: 'Any active blockers in engineering?', type: 'blocker', icon: AlertTriangle, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60' },
  { key: '5', text: 'What videos were recorded this month?', type: 'video', icon: Video, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60' },
  { key: '6', text: 'Summarize key updates from standups', type: 'standup', icon: Zap, color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'doc', label: 'Docs', icon: FileText },
  { id: 'task', label: 'Tasks', icon: CheckCircle },
  { id: 'meeting', label: 'Meetings', icon: Calendar },
  { id: 'decision', label: 'Decisions', icon: ShieldAlert },
  { id: 'message', label: 'Chats', icon: MessageSquare },
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
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clipad_recent_searches')) || []; } catch { return []; }
  });
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
  const [dynamicSuggestions, setDynamicSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [accessibleCount, setAccessibleCount] = useState(0);
  const [showAllResults, setShowAllResults] = useState(false); // expanded mode
  const [totalMatchCount, setTotalMatchCount] = useState(0);  // total across all types

  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  const handleResultClick = useCallback((res) => {
    const meta = TYPE_META[res.type];
    const route = meta?.route(res.id, res.space_id);
    if (route) { navigate(route); setIsOpen(false); }
  }, [navigate]);

  // Load space names map for context chips
  useEffect(() => {
    if (!user?.company_id) return;
    
    // Fetch spaces
    supabase.from('clipad_spaces').select('id, name').eq('company_id', user.company_id).then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(s => { map[s.id] = s.name; });
        setSpacesMap(map);
      }
    });

    // Fetch integrations for dynamic suggestions
    supabase.from('clipad_integrations')
      .select('provider')
      .eq('company_id', user.company_id)
      .eq('status', 'active')
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        
        const activeProviders = data.map(d => d.provider);
        const newSuggestions = [...DEFAULT_SUGGESTIONS];
        
        if (activeProviders.includes('gmail') || activeProviders.includes('google_workspace') || activeProviders.includes('outlook')) {
          newSuggestions.unshift({ key: 'dyn1', text: 'Find recent emails about invoices', type: 'integration', icon: FileText, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60' });
        }
        if (activeProviders.includes('jira') || activeProviders.includes('linear')) {
          newSuggestions.unshift({ key: 'dyn2', text: 'Show me my active Jira tickets', type: 'integration', icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60' });
        }
        if (activeProviders.includes('slack') || activeProviders.includes('ms_teams')) {
          newSuggestions.unshift({ key: 'dyn3', text: 'Summarize recent Slack messages', type: 'message', icon: MessageSquare, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60' });
        }
        if (activeProviders.includes('zoom')) {
          newSuggestions.unshift({ key: 'dyn4', text: 'What was discussed in the last Zoom meeting?', type: 'video', icon: Video, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60' });
        }
        if (activeProviders.includes('confluence') || activeProviders.includes('sharepoint')) {
          newSuggestions.unshift({ key: 'dyn5', text: 'Search Confluence for architecture docs', type: 'doc', icon: FileText, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60' });
        }
        
        // Ensure keys are correctly mapped 1-6
        const finalSuggestions = newSuggestions.slice(0, 6).map((item, index) => ({
          ...item,
          key: (index + 1).toString()
        }));
        
        setDynamicSuggestions(finalSuggestions);
      });
  }, [user]);

  // Global Keyboard listener (⌘K / Ctrl+K + Navigation)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(v => !v);
        return;
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(i => {
          const next = Math.min(i + 1, results.filter(r => matchesFilter(r.type, selectedFilter)).length - 1);
          // Scroll into view
          const el = document.getElementById(`search-item-${next}`);
          if (el) el.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(i => {
          const prev = Math.max(i - 1, -1);
          const el = document.getElementById(`search-item-${prev}`);
          if (el) el.scrollIntoView({ block: 'nearest' });
          return prev;
        });
      } else if (e.key === 'Enter') {
        const filtered = results.filter(r => matchesFilter(r.type, selectedFilter));
        if (focusedIndex >= 0 && filtered[focusedIndex]) {
          e.preventDefault();
          handleResultClick(filtered[focusedIndex]);
        }
      }
    };
    const handleCustomOpen = () => setIsOpen(true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('open-global-search', handleCustomOpen);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('open-global-search', handleCustomOpen);
    };
  }, [isOpen, results, selectedFilter, focusedIndex, handleResultClick]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery(''); setResults([]); setAiAnswer(''); setAiSources([]); setHasSearched(false); setFocusedIndex(-1); setSelectedFilter('all'); setCopiedAnswer(false); setShowAllResults(false); setTotalMatchCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSearch = useCallback(async (forcedQuery) => {
    const q = (forcedQuery || query).trim();
    if (!q) return;

    if (q) {
      setRecentSearches(prev => {
        const newSearches = [q, ...prev.filter(s => s !== q)].slice(0, 3);
        localStorage.setItem('clipad_recent_searches', JSON.stringify(newSearches));
        return newSearches;
      });
    }

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

      // ── Run all queries with the given limit ────────────────────────────
      const runQueries = async (limit) => {
        const [docs, tasks, messages, meetings, decisions, videos, blockers, standups, integrations] = await Promise.all([
          supabase.from('clipad_docs').select('id, title, content, space_id').or(getSpaceFilter()).ilike('title', term).limit(limit),
          supabase.from('clipad_action_items').select('id, title, context, space_id').or(getSpaceFilter()).ilike('title', term).limit(limit),
          supabase.from('clipad_messages').select('id, content, space_id').in('space_id', spaceIdArr).ilike('content', term).limit(limit),
          supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id').or(meetingFilter).ilike('title', term).limit(limit),
          supabase.from('clipad_decisions').select('id, decision_text, team_space_id').or(getTeamSpaceFilter()).ilike('decision_text', term).limit(limit),
          supabase.from('clipad_videos').select('id, title, ai_summary, space_id').or(videoFilter).ilike('title', term).limit(limit),
          supabase.from('clipad_blockers').select('id, description, team_space_id').or(getTeamSpaceFilter()).ilike('description', term).limit(limit),
          spaceIdArr.length > 0
            ? supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').in('space_id', spaceIdArr).or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(limit)
            : supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(limit),
          supabase.from('clipad_imported_knowledge').select('id, title, content, provider, content_type').eq('company_id', cid).or(`title.ilike.${term},content.ilike.${term}`).limit(limit),
        ]);
        return [
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
      };

      formatted = await runQueries(5);

      // Background count: run at limit=50 to know if more exist
      runQueries(50).then(all => setTotalMatchCount(all.length)).catch(() => {});

      }

      setResults(formatted);
      setIsSearching(false);

      // AI Synthesis
      setIsSynthesizing(true);
      const userRole = isAdmin(user) ? 'Company Admin' : isSpaceman(user) ? 'Spaceman (Space Admin)' : 'Member';

      let fullOrgContext = '';
      try {
        const { contextText } = await buildOrgContext({ limit: 25, spaceIds: spaceIdArr, companyId: user.company_id, userId: user.id, userRole: user?.role || 'member' });
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
          content: `You are Orbit AI, an enterprise intelligence assistant.

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
Wrap any internal reasoning inside <think>...</think> tags before providing your answer.
If the requested data is found, state exact details, assignees, or dates.
DO NOT mention internal IDs (e.g. M-123, I-456, or UUIDs) in your text response. Use titles instead.
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
      // Strip reasoning BEFORE storing — parseThinking separates thinking from the clean answer
      const { content: cleanAnswer } = parseThinking(answer);
      setAiAnswer(cleanAnswer || answer);
      setAiSources(sources.map(s => formatted.find(r => r.id === s.id)).filter(Boolean));
    } catch (err) {
      console.error('[GlobalSearch]', err);
      setIsSearching(false);
    } finally {
      setIsSynthesizing(false);
    }
  }, [query, user, lastQuery, hasSearched, aiAnswer, isSynthesizing]);

  const handleLoadMore = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const accessibleSpaceIds = await fetchAccessibleSpaceIds(user);
      const spaceIdArr = Array.from(accessibleSpaceIds);
      const term = `%${q}%`;
      const cid = user.company_id;
      const spaceIdsStr = spaceIdArr.length > 0 ? spaceIdArr.join(',') : '00000000-0000-0000-0000-000000000000';
      const getSpaceFilter = () => `space_id.in.(${spaceIdsStr})`;
      const getTeamSpaceFilter = () => `team_space_id.in.(${spaceIdsStr})`;
      const [docs, tasks, messages, meetings, decisions, videos, blockers, standups, integrations] = await Promise.all([
        supabase.from('clipad_docs').select('id, title, content, space_id').or(getSpaceFilter()).ilike('title', term).limit(50),
        supabase.from('clipad_action_items').select('id, title, context, space_id').or(getSpaceFilter()).ilike('title', term).limit(50),
        supabase.from('clipad_messages').select('id, content, space_id').in('space_id', spaceIdArr).ilike('content', term).limit(30),
        supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id').or(getSpaceFilter()).ilike('title', term).limit(50),
        supabase.from('clipad_decisions').select('id, decision_text, team_space_id').or(getTeamSpaceFilter()).ilike('decision_text', term).limit(30),
        supabase.from('clipad_videos').select('id, title, ai_summary, space_id').or(getSpaceFilter()).ilike('title', term).limit(50),
        supabase.from('clipad_blockers').select('id, description, team_space_id').or(getTeamSpaceFilter()).ilike('description', term).limit(30),
        spaceIdArr.length > 0
          ? supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').in('space_id', spaceIdArr).or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(30)
          : supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(30),
        supabase.from('clipad_imported_knowledge').select('id, title, content, provider, content_type').eq('company_id', cid).or(`title.ilike.${term},content.ilike.${term}`).limit(50),
      ]);
      const all = [
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
      setResults(all);
      setTotalMatchCount(all.length);
      setShowAllResults(true);
    } catch (err) {
      console.error('[GlobalSearch] loadMore error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [query, user]);

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
        <div className="hidden md:block w-full max-w-sm rounded-full p-[1.5px] bg-gradient-to-r from-blue-500 to-pink-500 hover:shadow-md transition-shadow cursor-text group">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center h-10 w-full bg-white dark:bg-slate-900 rounded-full px-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Search className="w-[18px] h-[18px] shrink-0" />
            <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-3 shrink-0" />
            <span className="text-[14px] font-medium flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis tracking-tight text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400">
              Search for a document
            </span>
            <kbd className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0 hidden lg:block tracking-wider font-bold shadow-sm">
              ⌘K
            </kbd>
          </button>
        </div>
        <button 
          onClick={() => setIsOpen(true)} 
          className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </>
    );
  }  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[6vh] sm:pt-[9vh] px-3 sm:px-4 pb-6 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === overlayRef.current) setIsOpen(false); }}
    >
      <style>{`
        @keyframes spotlightFadeIn {
          0% { opacity: 0; transform: scale(0.98) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      
      {/* Container */}
      <div
        className="w-full max-w-[720px] flex flex-col relative"
        style={{ animation: 'spotlightFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Gradient Search Input Box */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-400 to-amber-500 p-[1.5px] rounded-xl shadow-lg relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-[10px] flex items-center px-4 py-3 h-[52px]">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tap to start search..."
              className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 text-[16px] font-medium placeholder:text-slate-400 min-w-0 border-0 outline-none ring-0 shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none"
              style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
            />
            {query || isSearching ? (
              <button onClick={() => { setQuery(''); setResults([]); setAiAnswer(''); setHasSearched(false); inputRef.current?.focus(); }} className="text-slate-400 hover:text-slate-600 ml-2">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            ) : (
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 ml-2">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white dark:bg-background rounded-b-xl shadow-xl border-x border-b border-slate-200 dark:border-slate-800 mt-[-10px] pt-[10px] relative z-10 flex flex-col min-h-[300px]">
          
          {/* Filters Row */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
            <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Filter Results</h4>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> All
              </button>
              {FILTER_TABS.slice(1).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedFilter === tab.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 max-h-[42vh] overflow-y-auto">
            {/* Zero State (No Search) */}
            {!hasSearched && query.length === 0 && (
              <div className="pb-4">
                <div className="px-6 py-4">
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Recent</h4>
                      </div>
                      <div className="space-y-2">
                        {recentSearches.map((search, idx) => (
                          <button 
                            key={`recent-${idx}`}
                            onClick={() => { setQuery(search); handleSearch(search); }}
                            className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white leading-relaxed">{search}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Suggested AI Queries</h4>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">Press 1-6 or click</span>
                  </div>
                  <div className="space-y-2">
                    {dynamicSuggestions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button 
                          key={item.key} 
                          onClick={() => { setQuery(item.text); handleSearch(item.text); }} 
                          className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white leading-relaxed">{item.text}</span>
                            <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <kbd className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-2xs">
                                {item.key}
                              </kbd>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* AI Answer & Results List (when searching) */}
            {(hasSearched || query.length > 0) && (
              <div className="px-6 py-4">
                {isSynthesizing ? (
                  <div className="space-y-3 py-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/5 animate-pulse" />
                  </div>
                ) : aiAnswer ? (() => {
                  const { thinking, content: cleanAnswer, isThinkingDone } = parseThinking(aiAnswer);
                  return (
                    <div className="mb-6">
                      <h4 className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">AI Answer</h4>
                      {thinking && <ThinkingAccordion thinking={thinking} isThinkingDone={isThinkingDone} />}
                      {cleanAnswer && <p className="text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed"><TypewriterText text={cleanAnswer} /></p>}
                    </div>
                  );
                })() : null}

                {filteredResults.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Results</h4>
                      {hasSearched && (
                        <span className="text-[10px] text-slate-400">
                          {showAllResults ? `${filteredResults.length} results` : `Top ${filteredResults.length} of ${totalMatchCount > filteredResults.length ? `${totalMatchCount}+` : filteredResults.length}`}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {filteredResults.map((res, i) => {
                        const meta = TYPE_META[res.type] || {};
                        const Icon = meta.icon || FileText;
                        const isFocused = focusedIndex === i;
                        return (
                          <button
                            key={i}
                            id={`search-item-${i}`}
                            onClick={() => handleResultClick(res)}
                            className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${
                              isFocused 
                                ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-primary/45 border-transparent' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg ${meta.bg || 'bg-slate-100'} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-4 h-4 ${meta.color || 'text-slate-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{res.label}</span>
                                <span className="text-[10px] text-slate-400 shrink-0">{meta.label}</span>
                              </div>
                              {res.snippet && <p className="text-[12px] text-slate-500 truncate mt-0.5">{res.snippet}</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* View All / Show More Results button */}
                    {!showAllResults && totalMatchCount > filteredResults.length && (
                      <button
                        onClick={handleLoadMore}
                        disabled={isSearching}
                        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary hover:bg-primary/5 transition-all text-[12px] font-semibold group"
                      >
                        {isSearching ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading more...</>
                        ) : (
                          <><ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /> View all {totalMatchCount}+ results for "{query}"</>
                        )}
                      </button>
                    )}
                    {showAllResults && (
                      <div className="mt-3 text-center text-[11px] text-slate-400">
                        Showing all {filteredResults.length} results
                      </div>
                    )}
                  </div>
                )}
                
                {hasSearched && filteredResults.length === 0 && !aiAnswer && !isSynthesizing && (
                  <div className="text-center py-12 text-slate-500 text-[13px]">
                    No matches found for "{query}".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="bg-slate-50/80 dark:bg-card border-t border-slate-100 dark:border-slate-800/60 px-6 py-3.5 flex items-center justify-between rounded-b-xl shrink-0 mt-auto">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <kbd className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-sans font-bold text-slate-600 dark:text-slate-400 shadow-sm">↓</kbd>
                  <kbd className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-sans font-bold text-slate-600 dark:text-slate-400 shadow-sm">↑</kbd>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="w-6 h-5 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-sans font-bold text-slate-600 dark:text-slate-400 shadow-sm">↵</kbd>
                <span className="text-[11px] text-slate-500 font-medium">Select</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-sans font-bold text-slate-600 dark:text-slate-400 shadow-sm">Esc</kbd>
              <span className="text-[11px] text-slate-500 font-medium">Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
