import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video,
  Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink, Zap, Lock,
  Command, Bot, Filter, Check, Layers, ChevronRight, Copy, CheckCheck, Folder, Clock,
  Users, RefreshCw, SlidersHorizontal, ArrowUpRight, ChevronDown, UserCheck, Shield,
  Share2, CornerDownLeft, Sparkle, Compass, Terminal, Cpu, Lightbulb, ArrowRightCircle,
  Brain, FileSearch, SparklesIcon, Send
} from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { buildOrgContext } from '@/lib/clipadIntelligence';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isSpaceman } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import ThinkingAccordion, { parseThinking } from '@/components/chat/ThinkingAccordion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TYPE_META = {
  person:      { icon: Users,         label: 'Person',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
  meeting:     { icon: Calendar,      label: 'Meeting',   color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20', route: (id) => `/meetings/${id}` },
  video:       { icon: Video,         label: 'Video',     color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border border-purple-500/20', route: (id) => `/watch/${id}` },
  doc:         { icon: FileText,      label: 'Doc',       color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=docs&docId=${id}` : null },
  task:        { icon: CheckCircle,   label: 'Task',      color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=tasks&taskId=${id}` : null },
  message:     { icon: MessageSquare, label: 'Chat',      color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 border border-indigo-500/20', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=chat` : null },
  decision:    { icon: ShieldAlert,   label: 'Decision',  color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border border-rose-500/20', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=decisions` : null },
  blocker:     { icon: AlertTriangle, label: 'Blocker',   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 border border-orange-500/20', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=overview` : null },
  standup:     { icon: Zap,           label: 'Standup',   color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 border border-teal-500/20', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=standup` : null },
  integration: { icon: ExternalLink,  label: 'Imported',  color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border border-sky-500/20', route: () => `/integrations` },
};

const FILTER_TABS = [
  { id: 'all', label: 'All Knowledge', icon: Layers },
  { id: 'person', label: 'People', icon: Users },
  { id: 'doc', label: 'Documents', icon: FileText },
  { id: 'task', label: 'Tasks', icon: CheckCircle },
  { id: 'meeting', label: 'Meetings', icon: Calendar },
  { id: 'decision', label: 'Decisions', icon: ShieldAlert },
  { id: 'message', label: 'Conversations', icon: MessageSquare },
  { id: 'integration', label: 'Integrations', icon: ExternalLink },
];

const SUGGESTED_PROMPTS = [
  { title: "Blockers Summary", desc: "Summarize key active blockers across engineering spaces", icon: AlertTriangle },
  { title: "Strategic Decisions", desc: "Show recent decisions regarding Q3 roadmap & infrastructure", icon: ShieldAlert },
  { title: "Standup Highlights", desc: "What were the main highlights from yesterday's standups?", icon: Zap },
  { title: "Action Items", desc: "Find all active action items assigned to team members", icon: CheckCircle }
];

const FILTER_TYPE_MAP = {
  all: null,
  person: ['person'],
  doc: ['doc', 'integration'],
  task: ['task', 'blocker', 'standup'],
  meeting: ['meeting', 'video'],
  decision: ['decision', 'blocker'],
  message: ['message'],
  integration: ['integration'],
};

const matchesFilter = (itemType, filterId) => {
  if (!filterId || filterId === 'all') return true;
  const allowed = FILTER_TYPE_MAP[filterId];
  return allowed ? allowed.includes(itemType) : itemType === filterId;
};

const _spaceIdCache = new Map();
async function fetchAccessibleSpaceIds(user) {
  if (!user?.company_id) return new Set();
  const cacheKey = `${user.id}:${user.company_id}`;
  const cached = _spaceIdCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) return cached.ids;

  let ids;
  if (isAdmin(user)) {
    const { data } = await supabase.from('clipad_spaces').select('id').eq('company_id', user.company_id);
    ids = new Set((data || []).map(s => s.id));
  } else {
    const { data: memberships } = await supabase.from('clipad_space_members').select('space_id').eq('user_id', user.id);
    const memberSpaceIds = new Set((memberships || []).map(m => m.space_id));
    const { data: publicSpaces } = await supabase.from('clipad_spaces').select('id').eq('company_id', user.company_id).eq('is_private', false);
    (publicSpaces || []).forEach(s => memberSpaceIds.add(s.id));
    ids = memberSpaceIds;
  }
  _spaceIdCache.set(cacheKey, { ids, expiry: Date.now() + 60_000 });
  return ids;
}

export default function SearchHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeFilter, setActiveFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // AI State
  const [aiAnswer, setAiAnswer] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);

  const companyId = user?.company_id;

  const safeQuery = (promise) => Promise.resolve(promise).then(res => res.data || []).catch(err => {
    console.warn('[SearchHub] Query err:', err);
    return [];
  });

  const searchPeople = async (qTerm, cid) => {
    if (!cid) return [];
    const term = `%${qTerm}%`;
    const data = await safeQuery(
      supabase.from('profiles').select('id, full_name, email, role, avatar_url').eq('company_id', cid).or(`full_name.ilike.${term},email.ilike.${term}`).limit(5)
    );
    return (data || []).map(u => ({
      type: 'person',
      id: u.id,
      label: u.full_name || u.email,
      snippet: `${u.role || 'Member'} (${u.email})`,
      avatar_url: u.avatar_url,
      raw: u
    }));
  };

  // Ref to track the current synthesis session — prevents double-firing
  const synthSessionRef = React.useRef(0);
  const lastQueryRef = React.useRef('');

  const runSearch = useCallback(async (qTerm) => {
    const q = (qTerm !== undefined ? qTerm : query).trim();
    if (!q || !companyId) return;

    lastQueryRef.current = q;
    setHasPerformedSearch(true);
    setIsSearching(true);
    setResults([]);
    setSelectedResult(null);
    setChatHistory([]);
    setAiAnswer('');

    const accessibleSpaceIds = await fetchAccessibleSpaceIds(user);
    const spaceIdArr = Array.from(accessibleSpaceIds);
    const term = `%${q}%`;
    const cid = companyId;

    const [docs, tasks, messages, meetings, decisions, videos, blockers, standups, integrations, people] = await Promise.all([
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_docs').select('id, title, content, space_id, created_at').in('space_id', spaceIdArr).ilike('title', term).limit(20) : []),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_action_items').select('id, title, context, space_id, created_at').in('space_id', spaceIdArr).ilike('title', term).limit(20) : []),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_messages').select('id, content, space_id, created_at').in('space_id', spaceIdArr).ilike('content', term).limit(20) : []),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id, created_at').in('space_id', spaceIdArr).ilike('title', term).limit(20) : []),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_decisions').select('id, decision_text, team_space_id, created_at').in('team_space_id', spaceIdArr).ilike('decision_text', term).limit(20) : []),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_videos').select('id, title, ai_summary, space_id, created_at').in('space_id', spaceIdArr).eq('company_id', cid).ilike('title', term).limit(20) : []),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_blockers').select('id, description, team_space_id, detected_at').in('team_space_id', spaceIdArr).ilike('description', term).limit(20) : []),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').in('space_id', spaceIdArr).ilike('today', term).limit(20) : []),
      safeQuery(supabase.from('clipad_imported_knowledge').select('id, title, content, provider, content_type, updated_at').eq('company_id', cid).ilike('title', term).limit(20)),
      searchPeople(q, cid)
    ]);

    const raw = [
      ...(people || []),
      ...(docs || []).map(d => ({ type: 'doc', id: d.id, space_id: d.space_id, label: d.title, snippet: d.content, created_at: d.created_at })),
      ...(tasks || []).map(t => ({ type: 'task', id: t.id, space_id: t.space_id, label: t.title, snippet: t.context, created_at: t.created_at })),
      ...(messages || []).map(m => ({ type: 'message', id: m.id, space_id: m.space_id, label: 'Chat Message', snippet: m.content, created_at: m.created_at })),
      ...(meetings || []).map(m => ({ type: 'meeting', id: m.id, space_id: m.space_id, label: m.title || 'Team Meeting', snippet: m.ai_summary, created_at: m.created_at })),
      ...(decisions || []).map(d => ({ type: 'decision', id: d.id, space_id: d.team_space_id, label: 'Decision', snippet: d.decision_text, created_at: d.created_at })),
      ...(videos || []).map(v => ({ type: 'video', id: v.id, space_id: v.space_id, label: v.title || 'Video', snippet: v.ai_summary, created_at: v.created_at })),
      ...(blockers || []).map(b => ({ type: 'blocker', id: b.id, space_id: b.team_space_id, label: 'Blocker', snippet: b.description, created_at: b.detected_at })),
      ...(standups || []).map(s => ({ type: 'standup', id: s.id, space_id: s.space_id, label: `Standup — ${s.user_name || 'Team member'} (${s.created_at?.slice(0, 10)})`, snippet: s.today, created_at: s.created_at })),
      ...(integrations || []).map(i => ({ type: 'integration', id: i.id, space_id: null, label: `[${i.provider}] ${i.title}`, snippet: i.content, created_at: i.updated_at, provider: i.provider })),
    ];

    setResults(raw);
    setIsSearching(false);
    if (raw.length > 0) setSelectedResult(raw[0]);

    // AI Executive Synthesis — bump session id to prevent stale callbacks
    runAISynthesis(q, raw, spaceIdArr);
  }, [query, companyId, user]);

  const runAISynthesis = async (q, matchedResults, spaceIdArr) => {
    const sessionId = ++synthSessionRef.current;
    setIsSynthesizing(true);
    setChatHistory([]);

    try {
      const orgCtx = await buildOrgContext({
        limit: 25,
        companyId: user?.company_id,
        userId: user?.id,
        userRole: user?.role || 'member',
        spaceIds: spaceIdArr,
      }).catch(() => ({ contextText: '' }));

      // Bail if a newer synthesis has started
      if (synthSessionRef.current !== sessionId) return;

      const resContext = matchedResults.length > 0
        ? matchedResults.map(r => `[${r.type.toUpperCase()} ID:${r.id}] ${r.label}: ${r.snippet?.substring(0, 180) || ''}`).join('\n')
        : 'No direct database records matched.';

      const promptMessages = [
        {
          role: 'system',
          content: `You are Orbit AI, an elite enterprise intelligence assistant. Give a concise, authoritative synthesis in clean markdown. Use bullet points for lists. Bold key terms. Be direct and high-signal. Do not repeat the query.`
        },
        {
          role: 'user',
          content: `Search query: "${q}"\n\nMATCHED RECORDS:\n${resContext}\n\nORGANIZATIONAL CONTEXT:\n${orgCtx.contextText || 'None'}`
        }
      ];

      const cleanText = (raw) => {
        return raw
          .replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, '')
          .replace(/<(think|thought)>[\s\S]*$/gi, '')
          .replace(/<\/(think|thought)>/gi, '')
          // Clean up raw backslash escaped quotes, braces, brackets, and raw backslash characters
          .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
          // Strip out typical malformed token artifacts or corrupt byte markers sometimes outputted by LLMs
          .replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
          .trim();
      };

      let fullText = '';
      await generateText(promptMessages, (accumulated) => {
        if (synthSessionRef.current !== sessionId) return; // stale stream
        const clean = cleanText(accumulated);
        fullText = clean;
        // Update chatHistory in real-time so streaming text is visible immediately
        setChatHistory([{ role: 'assistant', content: clean }]);
      });

      if (synthSessionRef.current === sessionId) {
        setChatHistory([{ role: 'assistant', content: fullText }]);
      }
    } catch (e) {
      if (synthSessionRef.current === sessionId) {
        console.error('[SearchHub] AI error:', e);
        setChatHistory([{ role: 'assistant', content: 'Unable to generate AI synthesis at this time.' }]);
      }
    } finally {
      if (synthSessionRef.current === sessionId) {
        setIsSynthesizing(false);
      }
    }
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpInput.trim() || isSynthesizing) return;
    const userMsg = followUpInput.trim();
    setFollowUpInput('');

    // Build the full conversation including user's question
    const updatedHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(updatedHistory);
    setIsSynthesizing(true);

    try {
      const messages = [
        {
          role: 'system',
          content: `You are Orbit AI. The user searched for: "${lastQueryRef.current || 'unknown'}". Answer their follow-up question based on the conversation context. Use clear markdown formatting.`
        },
        // Include prior conversation (exclude system messages that might be in history)
        ...updatedHistory.filter(m => m.role === 'user' || m.role === 'assistant')
      ];

      const cleanText = (raw) => {
        return raw
          .replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, '')
          .replace(/<(think|thought)>[\s\S]*$/gi, '')
          .replace(/<\/(think|thought)>/gi, '')
          .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
          .replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
          .trim();
      };

      let answer = '';
      await generateText(messages, (accumulated) => {
        const clean = cleanText(accumulated);
        answer = clean;
        // Stream answer in real time
        setChatHistory([...updatedHistory, { role: 'assistant', content: answer }]);
      });

      // Finalise
      setChatHistory([...updatedHistory, { role: 'assistant', content: answer }]);
    } catch (err) {
      console.error('[SearchHub] Follow-up error:', err);
      toast({ title: 'Error', description: 'Could not fetch response.', variant: 'destructive' });
      setChatHistory([...updatedHistory, { role: 'assistant', content: 'Sorry, I could not process your follow-up.' }]);
    } finally {
      setIsSynthesizing(false);
    }
  };

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam) {
      setQuery(qParam);
      runSearch(qParam);
    }
  }, [searchParams]);

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const filteredResults = useMemo(() => results.filter(r => matchesFilter(r.type, activeFilter)), [results, activeFilter]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f19] text-foreground font-sans selection:bg-primary/20 selection:text-primary">

      {/* ── ZERO STATE: Centered hero ── */}
      {!hasPerformedSearch && (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-20 -mt-12">

          {/* Orbit icon mark */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm">
            <CliPadLogo size={36} className="text-primary" />
          </div>

          {/* Greeting heading — minimal like ChatGPT */}
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white text-center mb-1 tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-10">
            Search everything across your organization, or ask Orbit AI anything.
          </p>

          {/* Central Search Bar */}
          <div className="w-full max-w-2xl">
            <form onSubmit={(e) => { e.preventDefault(); setSearchParams({ q: query }); runSearch(); }}>
              <div className="relative flex items-center bg-slate-100 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-1 shadow-sm hover:border-slate-300 dark:hover:border-white/20 focus-within:border-primary dark:focus-within:border-primary focus-within:shadow-md transition-all">
                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mr-3" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Orbit AI or search across your workspace..."
                  className="flex-1 bg-transparent border-0 outline-none ring-0 text-[15px] font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 py-3.5 text-slate-900 dark:text-white"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mr-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-30 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95 shrink-0"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>

            {/* Suggestion chips — compact, clean, horizontal */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {SUGGESTED_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => { setQuery(item.desc); setSearchParams({ q: item.desc }); runSearch(item.desc); }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all group"
                  >
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH STATE: Compact bar at top + results below ── */}
      {hasPerformedSearch && (
        <div>
          {/* Sticky top search bar */}
          <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/5 px-4 md:px-8 py-3">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); setSearchParams({ q: query }); runSearch(); }}>
                <div className="relative flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-1 focus-within:border-primary dark:focus-within:border-primary transition-all">
                  <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search or ask Orbit AI..."
                    className="flex-1 bg-transparent border-0 outline-none ring-0 text-sm font-normal placeholder:text-slate-400 py-2.5 text-slate-900 dark:text-white"
                  />
                  {query && (
                    <button type="button" onClick={() => { setQuery(''); setResults([]); setSelectedResult(null); setHasPerformedSearch(false); setSearchParams({}); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mr-1.5">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Filter tabs + scope */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-5 pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {FILTER_TABS.map(tab => {
                  const Icon = tab.icon;
                  const count = results.filter(r => matchesFilter(r.type, tab.id)).length;
                  const active = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                        active
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${active ? 'bg-primary/15' : 'bg-slate-100 dark:bg-white/10'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400 shrink-0">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Workspace scoped
              </div>
            </div>
          </div>

          {/* Results + AI panel */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left: Results list */}
              <div className="lg:col-span-7 space-y-2.5">
                {isSearching ? (
                  <div className="flex items-center gap-3 py-16 justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Searching your workspace...</p>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="py-16 text-center">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No records matched</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Orbit AI is synthesizing an answer on the right.</p>
                  </div>
                ) : (
                  filteredResults.map(item => {
                    const meta = TYPE_META[item.type] || TYPE_META.doc;
                    const Icon = meta.icon;
                    const isSelected = selectedResult?.id === item.id;
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => setSelectedResult(item)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/5 border-primary/30 dark:border-primary/40'
                            : 'bg-white dark:bg-white/[0.03] border-slate-200/80 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${meta.bg} ${meta.color}`}>
                              <Icon className="w-3 h-3" />
                              {meta.label}
                            </span>
                            {item.provider && (
                              <span className="text-[10px] font-mono text-slate-400 truncate">
                                {item.provider}
                              </span>
                            )}
                          </div>
                          {item.created_at && (
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug mb-1">
                          {item.label}
                        </h4>
                        {item.snippet && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right: AI Synthesis Panel */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/8 rounded-xl p-5 sticky top-[72px]">
                  
                  {/* Header */}
                  <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-slate-100 dark:border-white/8">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CliPadLogo size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Orbit AI</h3>
                      <p className="text-[11px] text-slate-400">Executive synthesis</p>
                    </div>
                    {isSynthesizing && (
                      <div className="ml-auto flex items-center gap-1.5 text-[11px] text-primary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Thinking
                      </div>
                    )}
                  </div>

                  {/* AI Content */}
                  {isSynthesizing && !aiAnswer ? (
                    <div className="space-y-2 py-4">
                      <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full animate-pulse w-full" />
                      <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full animate-pulse w-4/5" />
                      <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full animate-pulse w-full mt-2" />
                      <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full animate-pulse w-2/3" />
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium'
                            : 'prose prose-xs dark:prose-invert max-w-none text-slate-700 dark:text-slate-300'
                        }`}>
                          {msg.role === 'user' ? (
                            <div className="flex items-start gap-2">
                              <span className="text-primary font-bold text-[10px] uppercase tracking-wider mt-0.5">You</span>
                              <span>{msg.content}</span>
                            </div>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-up input */}
                  <form onSubmit={handleFollowUp} className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/8">
                    <input
                      value={followUpInput}
                      onChange={e => setFollowUpInput(e.target.value)}
                      placeholder="Ask a follow-up question..."
                      className="flex-1 text-xs px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSynthesizing || !followUpInput.trim()}
                      className="px-3.5 py-2.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Selected record detail */}
                {selectedResult && (
                  <div className="bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/8 rounded-xl p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Record detail</span>
                      {TYPE_META[selectedResult.type]?.route && (
                        <button
                          onClick={() => {
                            const route = TYPE_META[selectedResult.type].route(selectedResult.id, selectedResult.space_id);
                            if (route) navigate(route);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Open <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                      {selectedResult.label}
                    </h3>
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-h-48 overflow-y-auto">
                      {selectedResult.snippet || 'No content preview available.'}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
