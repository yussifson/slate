import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video,
  Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink, Zap, Lock,
  Command, Bot, Filter, Check, Layers, ChevronRight, Copy, CheckCheck, Folder, Clock,
  Users, RefreshCw, SlidersHorizontal, ArrowUpRight, ChevronDown, UserCheck, Shield
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
  person:      { icon: Users,         label: 'Person',    color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50' },
  meeting:     { icon: Calendar,      label: 'Meeting',   color: 'text-blue-700 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50',     route: (id) => `/meetings/${id}` },
  video:       { icon: Video,         label: 'Video',     color: 'text-purple-700 dark:text-purple-400',   bg: 'bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50', route: (id) => `/watch/${id}` },
  doc:         { icon: FileText,      label: 'Doc',       color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50',route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=docs&docId=${id}` : null },
  task:        { icon: CheckCircle,   label: 'Task',      color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50',   route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=tasks&taskId=${id}` : null },
  message:     { icon: MessageSquare, label: 'Chat',      color: 'text-indigo-700 dark:text-indigo-400',   bg: 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/50', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=chat` : null },
  decision:    { icon: ShieldAlert,   label: 'Decision',  color: 'text-rose-700 dark:text-rose-400',       bg: 'bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/50',     route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=decisions` : null },
  blocker:     { icon: AlertTriangle, label: 'Blocker',   color: 'text-orange-700 dark:text-orange-400',   bg: 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=overview` : null },
  standup:     { icon: Zap,           label: 'Standup',   color: 'text-teal-700 dark:text-teal-400',       bg: 'bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700/50',     route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=standup` : null },
  integration: { icon: ExternalLink,  label: 'Imported',  color: 'text-slate-700 dark:text-slate-400',     bg: 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',   route: () => `/integrations` },
};

const FILTER_TABS = [
  { id: 'all', label: 'All Results', icon: Layers },
  { id: 'person', label: 'People', icon: Users },
  { id: 'doc', label: 'Docs', icon: FileText },
  { id: 'task', label: 'Tasks', icon: CheckCircle },
  { id: 'meeting', label: 'Meetings', icon: Calendar },
  { id: 'decision', label: 'Decisions', icon: ShieldAlert },
  { id: 'message', label: 'Chats', icon: MessageSquare },
  { id: 'integration', label: 'Integrations', icon: ExternalLink },
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
  const [aiSources, setAiSources] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');

  const companyId = user?.company_id;

  const safeQuery = (promise) => Promise.resolve(promise).then(res => res.data || []).catch(err => {
    console.warn('[SearchHub] Query err:', err);
    return [];
  });

  const searchPeople = async (qTerm, cid) => {
    if (!cid) return [];
    const term = `%${qTerm}%`;
    const data = await safeQuery(
      supabase.from('clipad_users').select('id, full_name, email, role, department, avatar_url').eq('company_id', cid).or(`full_name.ilike.${term},email.ilike.${term},department.ilike.${term}`).limit(5)
    );
    return (data || []).map(u => ({
      type: 'person',
      id: u.id,
      label: u.full_name || u.email,
      snippet: `${u.role || 'Member'} ${u.department ? '· ' + u.department : ''} (${u.email})`,
      avatar_url: u.avatar_url,
      raw: u
    }));
  };

  const runSearch = useCallback(async (qTerm) => {
    const q = (qTerm !== undefined ? qTerm : query).trim();
    if (!q || !companyId) return;

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
      safeQuery(supabase.from('clipad_imported_knowledge').select('id, title, content, provider, content_type, created_at').eq('company_id', cid).or(`title.ilike.${term},content.ilike.${term}`).limit(20)),
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
    setAiSources([]);
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
          content: `You are Orbit AI, an enterprise intelligence assistant. Provide an executive-level synthesized briefing based on the organizational context and search results. Use markdown with bullet points. Be thorough, clear, and actionable.`
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
    } fontally {
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
        { role: 'system', content: 'You are Orbit AI. Answer follow-up questions about the enterprise search results directly and clearly using markdown.' },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-8">
      {/* Search Header Bar */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <form onSubmit={(e) => { e.preventDefault(); setSearchParams({ q: query }); runSearch(); }} className="flex items-center gap-3 w-full md:w-[600px]">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search enterprise knowledge, emails, chats, documents, or team members..."
              className="flex-1 bg-transparent border-0 outline-none ring-0 text-base font-medium placeholder:text-slate-400"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setResults([]); setSelectedResult(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm">
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Search
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Company Scoped</span>
            <span>·</span>
            <span>{results.length} records found</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map(tab => {
            const Icon = tab.icon;
            const count = results.filter(r => matchesFilter(r.type, tab.id)).length;
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Pane Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Results List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {isSearching ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="font-bold text-sm">Searching across all integrations & workspace spaces...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="font-bold text-base mb-1">No matching results found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Try typing a document name, colleague, meeting topic, or ask Orbit AI on the right pane.</p>
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${meta.bg} ${meta.color}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      {item.provider && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          [{item.provider}]
                        </span>
                      )}
                    </div>
                    {item.created_at && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mb-1">
                    {item.label}
                  </h4>

                  {item.snippet && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: AI Intelligence Briefing & Detail Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Executive AI Briefing Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Orbit AI Executive Synthesis</h3>
                  <p className="text-[10px] text-slate-400">Cross-platform intelligence summary</p>
                </div>
              </div>
            </div>

            {isSynthesizing && !aiAnswer ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                Synthesizing organizational knowledge...
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`text-xs leading-relaxed ${msg.role === 'user' ? 'bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-bold' : 'prose prose-xs dark:prose-invert max-w-none'}`}>
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
            <form onSubmit={handleFollowUp} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                value={followUpInput}
                onChange={e => setFollowUpInput(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
              <button type="submit" disabled={isSynthesizing} className="px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50">
                Ask
              </button>
            </form>
          </div>

          {/* Selected Record Detail Panel */}
          {selectedResult && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Record Inspection
                </span>
                {TYPE_META[selectedResult.type]?.route && (
                  <button
                    onClick={() => {
                      const route = TYPE_META[selectedResult.type].route(selectedResult.id, selectedResult.space_id);
                      if (route) navigate(route);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Open Record <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                {selectedResult.label}
              </h3>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
                {selectedResult.snippet || 'No expanded content preview available for this record.'}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
