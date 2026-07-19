import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video,
  Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink, Zap, Lock
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isSpaceman } from '@/lib/constants';

const TYPE_META = {
  meeting:  { icon: Calendar,      label: 'Meeting',   color: 'text-blue-500',   bg: 'bg-blue-500/10',    route: (id) => `/meetings/${id}` },
  video:    { icon: Video,         label: 'Video',     color: 'text-purple-500', bg: 'bg-purple-500/10',  route: (id) => `/watch/${id}` },
  doc:      { icon: FileText,      label: 'Doc',       color: 'text-emerald-500',bg: 'bg-emerald-500/10', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=docs&docId=${id}` : null },
  task:     { icon: CheckCircle,   label: 'Task',      color: 'text-amber-500',  bg: 'bg-amber-500/10',   route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=tasks&taskId=${id}` : null },
  message:  { icon: MessageSquare, label: 'Chat',      color: 'text-indigo-500', bg: 'bg-indigo-500/10',  route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=chat` : null },
  decision: { icon: ShieldAlert,   label: 'Decision',  color: 'text-rose-500',   bg: 'bg-rose-500/10',    route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=decisions` : null },
  blocker:  { icon: AlertTriangle, label: 'Blocker',   color: 'text-orange-500', bg: 'bg-orange-500/10',  route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=overview` : null },
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
    }, 10);
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

  // Admins can see all company spaces
  if (isAdmin(user)) {
    const { data } = await supabase
      .from('clipad_spaces')
      .select('id')
      .eq('company_id', user.company_id);
    return new Set((data || []).map(s => s.id));
  }

  // Spacemans & members — fetch their memberships
  const { data: memberships } = await supabase
    .from('clipad_space_members')
    .select('space_id')
    .eq('user_id', user.id);
  const memberSpaceIds = new Set((memberships || []).map(m => m.space_id));

  // Also include all PUBLIC spaces in the company
  const { data: publicSpaces } = await supabase
    .from('clipad_spaces')
    .select('id')
    .eq('company_id', user.company_id)
    .eq('is_private', false);

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
    // Use capture phase to intercept before other handlers (like CommandDialog)
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('open-global-search', handleCustomOpen);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('open-global-search', handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
    else { setQuery(''); setResults([]); setAiAnswer(''); setAiSources([]); setHasSearched(false); setFocusedIndex(-1); }
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
      // === CONTEXT-AWARE SECURITY: resolve accessible space IDs first ===
      const accessibleSpaceIds = await fetchAccessibleSpaceIds(user);
      const spaceIdArr = Array.from(accessibleSpaceIds);
      const term = `%${q}%`;

      let formatted = [];

      if (spaceIdArr.length > 0) {
        // All queries are scoped to accessible spaces only — no bypassing possible
        const [docs, tasks, messages, meetings, decisions, videos, blockers] = await Promise.all([
          supabase.from('clipad_docs').select('id, title, content, space_id').in('space_id', spaceIdArr).ilike('title', term).limit(5),
          supabase.from('clipad_action_items').select('id, title, context, space_id').in('space_id', spaceIdArr).ilike('title', term).limit(5),
          supabase.from('clipad_messages').select('id, content, space_id').in('space_id', spaceIdArr).ilike('content', term).limit(3),
          supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id').in('space_id', spaceIdArr).ilike('title', term).limit(5),
          supabase.from('clipad_decisions').select('id, decision_text, team_space_id').in('team_space_id', spaceIdArr).ilike('decision_text', term).limit(3),
          supabase.from('clipad_videos').select('id, title, ai_summary, space_id').in('space_id', spaceIdArr).ilike('title', term).limit(5),
          supabase.from('clipad_blockers').select('id, description, team_space_id').in('team_space_id', spaceIdArr).ilike('description', term).limit(3),
        ]);

        formatted = [
          ...(docs.data || []).map(d => ({ type: 'doc', id: d.id, space_id: d.space_id, label: d.title, snippet: d.content?.substring(0, 120) })),
          ...(tasks.data || []).map(t => ({ type: 'task', id: t.id, space_id: t.space_id, label: t.title, snippet: t.context?.substring(0, 120) })),
          ...(messages.data || []).map(m => ({ type: 'message', id: m.id, space_id: m.space_id, label: 'Chat Message', snippet: m.content?.substring(0, 120) })),
          ...(meetings.data || []).map(m => ({ type: 'meeting', id: m.id, space_id: m.space_id, label: m.title || 'Team Meeting', snippet: m.ai_summary?.substring(0, 120) })),
          ...(decisions.data || []).map(d => ({ type: 'decision', id: d.id, space_id: d.team_space_id, label: 'Decision', snippet: d.decision_text?.substring(0, 120) })),
          ...(videos.data || []).map(v => ({ type: 'video', id: v.id, space_id: v.space_id, label: v.title || 'Video', snippet: v.ai_summary?.substring(0, 120) })),
          ...(blockers.data || []).map(b => ({ type: 'blocker', id: b.id, space_id: b.team_space_id, label: 'Blocker', snippet: b.description?.substring(0, 120) })),
        ];
      }

      setResults(formatted);
      setIsSearching(false);

      // === AI synthesis — context injected with user role for privacy-aware response ===
      setIsSynthesizing(true);
      const userRole = isAdmin(user) ? 'Company Admin' : isSpaceman(user) ? 'Spaceman (Space Admin)' : 'Member';
      const context = formatted.length > 0
        ? formatted.map(r => `[${r.type.toUpperCase()} ID:${r.id}] ${r.label}: ${r.snippet || ''}`).join('\n')
        : 'No records found in this user\'s accessible spaces.';

      const raw = await generateText([
        {
          role: 'system',
          content: `You are OrbitFlow, the CliPad AI intelligence assistant.

CRITICAL SECURITY RULE: You are responding to "${user?.full_name || 'a user'}" who has the role "${userRole}". 
You ONLY have access to data from the ${spaceIdArr.length} spaces this user is authorized to see.
NEVER reveal, reference, or speculate about data from spaces or teams this user is not part of.
If data was not found, say so — do not guess or fabricate.

Answer the user's question based ONLY on the workspace data provided below. Be concise (2-3 sentences). Focus on actionable insights.
After your answer, list the IDs of the most relevant sources as JSON: SOURCES:[{"id":"<id>","type":"<type>"}].`,
        },
        { role: 'user', content: `Query: "${q}"\n\nMy accessible workspace data:\n${context}` },
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

  // Trigger bar (shown in nav)
  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 h-9 bg-slate-100 dark:bg-secondary/60 hover:bg-slate-200 dark:hover:bg-secondary text-slate-500 dark:text-muted-foreground rounded-xl transition-all border border-slate-200 dark:border-border/60 w-full max-w-xs min-w-[120px]"
        >
          <Search className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="text-sm flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">Search…</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-card px-1.5 py-0.5 rounded-md text-slate-400 border border-slate-200 dark:border-border shrink-0 hidden lg:block">⌘K</kbd>
        </button>
        <button onClick={() => setIsOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-foreground transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </>
    );
  }

  // Spotlight modal using Portal to escape nav overflow constraints
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[8vh] px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      onMouseDown={(e) => { if (e.target === overlayRef.current) setIsOpen(false); }}
    >
      <div
        className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white/10"
        style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(24px)' }}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          {isSearching || isSynthesizing ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500 shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask OrbitFlow anything about your workspace…"
            className="flex-1 bg-transparent border-none outline-none text-slate-900 text-[17px] font-medium placeholder-slate-400 min-w-0"
            style={{ caretColor: '#10b981' }}
          />
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setAiAnswer(''); setHasSearched(false); inputRef.current?.focus(); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isSearching}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm shadow-emerald-500/25"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[62vh] overflow-y-auto">

          {/* Empty / suggestion state */}
          {!hasSearched && !isSearching && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Try asking…</span>
              </div>
              <div className="space-y-1">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-[14px] text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{s}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 ml-auto transition-colors" />
                  </button>
                ))}
              </div>
              {/* Role badge */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] text-slate-400">
                  Searching within <span className="font-semibold text-slate-600">your authorized spaces</span> only
                </span>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isSearching && (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
              <p className="text-xs text-center text-slate-400 pt-2 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                Searching your authorized spaces…
              </p>
            </div>
          )}

          {/* AI Answer */}
          {(aiAnswer || isSynthesizing) && !isSearching && (
            <div className="mx-5 mt-5 rounded-2xl overflow-hidden border border-emerald-100" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(20,184,166,0.03))' }}>
              <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-emerald-100/60">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">OrbitFlow AI</span>
                {isSynthesizing && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                    <span className="text-[11px] text-emerald-600/70 font-medium ml-0.5">Thinking…</span>
                  </div>
                )}
              </div>
              <div className="px-5 py-4">
                {isSynthesizing ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3.5 bg-emerald-100 rounded-full w-full" />
                    <div className="h-3.5 bg-emerald-100 rounded-full w-4/5" />
                    <div className="h-3.5 bg-emerald-100 rounded-full w-3/5" />
                  </div>
                ) : (
                  <p className="text-[15px] text-slate-800 leading-relaxed font-medium">
                    <TypewriterText text={aiAnswer} />
                  </p>
                )}
                {aiSources.length > 0 && !isSynthesizing && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-emerald-100/80">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 self-center">Sources:</span>
                    {aiSources.map((src, i) => {
                      const meta = TYPE_META[src.type];
                      const Icon = meta?.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => handleResultClick(src)}
                          className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg ${meta?.bg} ${meta?.color} hover:shadow-md transition-all hover:scale-105 active:scale-100`}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          <span className="max-w-[140px] truncate">{src.label}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-50 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !isSearching && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{results.length} Result{results.length !== 1 ? 's' : ''}</span>
                <span className="text-[11px] text-slate-400">↑↓ navigate · ↵ open</span>
              </div>
              <div className="space-y-1">
                {results.map((res, i) => {
                  const meta = TYPE_META[res.type] || {};
                  const Icon = meta.icon || Search;
                  const isFocused = focusedIndex === i;
                  return (
                    <button
                      key={`${res.type}-${res.id}-${i}`}
                      onClick={() => handleResultClick(res)}
                      className={`w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 group border ${isFocused ? 'bg-slate-50 border-slate-200 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                        <p className="text-[14px] font-semibold text-slate-900 truncate">{res.label}</p>
                        {res.snippet && <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">{res.snippet}</p>}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-2.5 transition-all group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results */}
          {hasSearched && !isSearching && !isSynthesizing && results.length === 0 && !aiAnswer && (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-600">No matches found</p>
              <p className="text-sm mt-1 text-slate-400">Try different keywords or rephrase your question</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px]">⌘K</kbd> toggle
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px]">Esc</kbd> close
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600/70 font-semibold">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
              OrbitFlow AI · Context-Aware
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
