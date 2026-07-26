import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video,
  Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink, Zap, Lock,
  Command, Bot, Filter, Check, Layers, ChevronRight, Copy, CheckCheck, Folder, Clock,
  Users, RefreshCw, SlidersHorizontal, ArrowUpRight, ChevronDown, UserCheck, Shield,
  Share2, CornerDownLeft, Sparkle, Compass, Terminal, Cpu, Lightbulb, ArrowRightCircle
} from 'lucide-react';
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
  "Summarize key active blockers across engineering spaces",
  "Show recent decisions regarding Q3 roadmap & infrastructure",
  "What were the main highlights from yesterday's standups?",
  "Find all active action items assigned to team members"
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

  const runSearch = useCallback(async (qTerm) => {
    const q = (qTerm !== undefined ? qTerm : query).trim();
    if (!q || !companyId) return;

    setHasPerformedSearch(true);
    setIsSearching(true);
    setResults([]);
    setSelectedResult(null);

    const accessibleSpaceIds = await fetchAccessibleSpaceIds(user);
    const spaceIdArr = Array.from(accessibleSpaceIds);
    const term = `%${q}%`;
    const cid = companyId;

    const [docs, tasks, messages, meetings, decisions, videos, blockers, standups, integrations, people] = await Promise.all([
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_docs').select('id, title, content, space_id, created_at').in('space_id', spaceIdArr).or(`title.ilike.${term},content.ilike.${term}`).limit(20) : supabase.from('clipad_docs').select('id, title, content, space_id, created_at').or(`title.ilike.${term},content.ilike.${term}`).limit(20)),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_action_items').select('id, title, context, space_id, created_at').in('space_id', spaceIdArr).or(`title.ilike.${term},context.ilike.${term}`).limit(20) : supabase.from('clipad_action_items').select('id, title, context, space_id, created_at').or(`title.ilike.${term},context.ilike.${term}`).limit(20)),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_messages').select('id, content, space_id, created_at').in('space_id', spaceIdArr).ilike('content', term).limit(20) : supabase.from('clipad_messages').select('id, content, space_id, created_at').ilike('content', term).limit(20)),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id, created_at').in('space_id', spaceIdArr).or(`title.ilike.${term},ai_summary.ilike.${term}`).limit(20) : supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id, created_at').or(`title.ilike.${term},ai_summary.ilike.${term}`).limit(20)),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_decisions').select('id, decision_text, team_space_id, created_at').in('team_space_id', spaceIdArr).ilike('decision_text', term).limit(20) : supabase.from('clipad_decisions').select('id, decision_text, team_space_id, created_at').ilike('decision_text', term).limit(20)),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_videos').select('id, title, ai_summary, space_id, created_at').in('space_id', spaceIdArr).or(`title.ilike.${term},ai_summary.ilike.${term}`).limit(20) : supabase.from('clipad_videos').select('id, title, ai_summary, space_id, created_at').or(`title.ilike.${term},ai_summary.ilike.${term}`).limit(20)),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_blockers').select('id, description, team_space_id, created_at').in('team_space_id', spaceIdArr).ilike('description', term).limit(20) : supabase.from('clipad_blockers').select('id, description, team_space_id, created_at').ilike('description', term).limit(20)),
      safeQuery(spaceIdArr.length > 0 ? supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').in('space_id', spaceIdArr).or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(20) : supabase.from('clipad_standups').select('id, user_name, today, yesterday, blockers, space_id, created_at').or(`today.ilike.${term},yesterday.ilike.${term},user_name.ilike.${term}`).limit(20)),
      safeQuery(supabase.from('clipad_imported_knowledge').select('id, title, content, provider, content_type, created_at').eq('company_id', cid).ilike('title', term).limit(20)),
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
      ...(blockers || []).map(b => ({ type: 'blocker', id: b.id, space_id: b.team_space_id, label: 'Blocker', snippet: b.description, created_at: b.created_at })),
      ...(standups || []).map(s => ({ type: 'standup', id: s.id, space_id: s.space_id, label: `Standup — ${s.user_name || 'Team member'} (${s.created_at?.slice(0, 10)})`, snippet: s.today, created_at: s.created_at })),
      ...(integrations || []).map(i => ({ type: 'integration', id: i.id, space_id: null, label: `[${i.provider}] ${i.title}`, snippet: i.content, created_at: i.created_at, provider: i.provider })),
    ];

    setResults(raw);
    setIsSearching(false);
    if (raw.length > 0) setSelectedResult(raw[0]);

    // AI Executive Synthesis
    runAISynthesis(q, raw, spaceIdArr);
  }, [query, companyId, user]);

  const runAISynthesis = async (q, matchedResults, spaceIdArr) => {
    setIsSynthesizing(true);
    setAiAnswer('');
    setChatHistory([]);

    try {
      const userRole = isAdmin(user) ? 'Company Admin' : isSpaceman(user) ? 'Spaceman (Space Admin)' : 'Member';
      const orgCtx = await buildOrgContext({ limit: 25, companyId: user?.company_id, userId: user?.id, userRole: user?.role || 'member' }).catch(() => ({ contextText: '' }));

      const resContext = matchedResults.length > 0
        ? matchedResults.map(r => `[${r.type.toUpperCase()} ID:${r.id}] ${r.label}: ${r.snippet?.substring(0, 180) || ''}`).join('\n')
        : 'No direct database records matched.';

      const promptMessages = [
        {
          role: 'system',
          content: `You are Orbit AI, an elite enterprise intelligence engine. Provide a sleek, authoritative executive synthesis based on organizational signals. Format nicely with markdown bullet points. Be direct, clear, and high signal.`
        },
        {
          role: 'user',
          content: `Query: "${q}"\n\nMATCHED RECORDS:\n${resContext}\n\nORGANIZATIONAL CONTEXT:\n${orgCtx.contextText || 'None'}`
        }
      ];

      let fullText = '';
      await generateText(promptMessages, (accumulated) => {
        const clean = accumulated.replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, '').replace(/<(think|thought)>[\s\S]*$/gi, '').replace(/<\/(think|thought)>/gi, '');
        setAiAnswer(clean);
        fullText = clean;
      });

      setChatHistory([{ role: 'assistant', content: fullText }]);
    } catch (e) {
      console.error('[SearchHub] AI error:', e);
      setAiAnswer('Unable to generate AI synthesis at this time.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpInput.trim() || isSynthesizing) return;
    const userMsg = followUpInput.trim();
    setFollowUpInput('');
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHistory);
    setIsSynthesizing(true);

    try {
      const messages = [
        { role: 'system', content: 'You are Orbit AI. Answer follow-up questions about the search results directly and clearly using markdown.' },
        ...newHistory
      ];
      let answer = '';
      await generateText(messages, (accumulated) => {
        const clean = accumulated.replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, '').replace(/<(think|thought)>[\s\S]*$/gi, '').replace(/<\/(think|thought)>/gi, '');
        answer = clean;
        setChatHistory([...newHistory, { role: 'assistant', content: answer }]);
      });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not fetch response.', variant: 'destructive' });
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

  const filteredResults = useMemo(() => results.filter(r => matchesFilter(r.type, activeFilter)), [results, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary pb-16">
      
      {/* Premium Hero & Search Section */}
      <div className="max-w-5xl mx-auto pt-8 md:pt-14 px-4 md:px-8">
        
        {/* Zero State Header / Title */}
        {!hasPerformedSearch ? (
          <div className="text-center space-y-4 mb-8 animate-in fade-in duration-300">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Enterprise Search & Intelligence
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              What do you want to <span className="text-primary">discover today?</span>
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
              Search across Slack, Google Drive, Notion, Meetings, Code, and Team Members in one unified AI command center.
            </p>
          </div>
        ) : null}

        {/* Central Sleek Command Search Input */}
        <div className="relative group max-w-3xl mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); setSearchParams({ q: query }); runSearch(); }}>
            <div className="relative flex items-center bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-2 shadow-lg shadow-black/[0.03] dark:shadow-none focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
              <div className="pl-3.5 pr-2 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Orbit AI or search company knowledge..."
                className="w-full bg-transparent border-0 outline-none ring-0 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 py-2 pr-3 text-foreground"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setResults([]); setSelectedResult(null); setHasPerformedSearch(false); setSearchParams({}); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg mr-1">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Execute</span>
              </button>
            </div>
          </form>
        </div>

        {/* Suggested Prompts Cards (When zero state) */}
        {!hasPerformedSearch && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto mt-6 text-left">
            {SUGGESTED_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => { setQuery(promptText); setSearchParams({ q: promptText }); runSearch(promptText); }}
                className="p-4 rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 hover:border-primary/40 shadow-sm hover:shadow-md transition-all group flex items-start gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Lightbulb className="w-4 h-4 text-primary group-hover:text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white leading-relaxed">
                  {promptText}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Filter Pills Bar (When searching) */}
        {hasPerformedSearch && (
          <div className="flex items-center justify-between gap-4 mt-6 border-b border-slate-200/80 dark:border-border pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {FILTER_TABS.map(tab => {
                const Icon = tab.icon;
                const count = results.filter(r => matchesFilter(r.type, tab.id)).length;
                const active = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-white dark:bg-card border border-slate-200/80 dark:border-border text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${active ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 shrink-0">
              <Shield className="w-3.5 h-3.5 text-primary" /> Company Scoped
            </div>
          </div>
        )}
      </div>

      {/* Main Results Grid */}
      {hasPerformedSearch && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Results Feed (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              {isSearching ? (
                <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-12 text-center shadow-sm">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Searching your enterprise graph...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-12 text-center shadow-sm">
                  <Search className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="font-bold text-base mb-1">No direct matching records</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Orbit AI on the right is synthesizing answers from your workspace context.</p>
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
                      className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-card ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 shadow-md'
                          : 'border-slate-200/80 dark:border-border hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${meta.bg} ${meta.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                          {item.provider && (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              [{item.provider}]
                            </span>
                          )}
                        </div>
                        {item.created_at && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug mb-1.5">
                        {item.label}
                      </h4>

                      {item.snippet && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                          {item.snippet}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: AI Intelligence Briefing (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Executive AI Briefing Box */}
              <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-6 shadow-sm space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">Orbit AI Executive Synthesis</h3>
                      <p className="text-[11px] text-slate-400">Cross-platform intelligence summary</p>
                    </div>
                  </div>
                </div>

                {isSynthesizing && !aiAnswer ? (
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Synthesizing organizational knowledge...
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`text-xs leading-relaxed ${msg.role === 'user' ? 'bg-slate-100 dark:bg-secondary p-3 rounded-xl font-bold' : 'prose prose-xs dark:prose-invert max-w-none'}`}>
                        {msg.role === 'user' ? (
                          <div>Q: {msg.content}</div>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up input */}
                <form onSubmit={handleFollowUp} className="flex gap-2 pt-3 border-t border-slate-100 dark:border-border">
                  <input
                    value={followUpInput}
                    onChange={e => setFollowUpInput(e.target.value)}
                    placeholder="Ask a follow-up..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-secondary border border-slate-200 dark:border-border focus:outline-none focus:border-primary"
                  />
                  <button type="submit" disabled={isSynthesizing} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                    Ask
                  </button>
                </form>
              </div>

              {/* Selected Record Inspection Drawer */}
              {selectedResult && (
                <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-6 shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Record Detail
                    </span>
                    {TYPE_META[selectedResult.type]?.route && (
                      <button
                        onClick={() => {
                          const route = TYPE_META[selectedResult.type].route(selectedResult.id, selectedResult.space_id);
                          if (route) navigate(route);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        Open Source <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {selectedResult.label}
                  </h3>

                  <div className="p-3.5 bg-slate-50 dark:bg-secondary/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
                    {selectedResult.snippet || 'No expanded content preview available for this record.'}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
