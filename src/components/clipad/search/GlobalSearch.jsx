import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video, Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

const TYPE_META = {
  meeting:    { icon: Calendar,      label: 'Meeting',    color: 'text-blue-500',   bg: 'bg-blue-500/10',    route: (id) => `/meetings/${id}` },
  video:      { icon: Video,         label: 'Video',      color: 'text-purple-500', bg: 'bg-purple-500/10',  route: (id) => `/videos/${id}` },
  doc:        { icon: FileText,      label: 'Doc',        color: 'text-emerald-500',bg: 'bg-emerald-500/10', route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=docs&docId=${id}` : null },
  task:       { icon: CheckCircle,   label: 'Task',       color: 'text-amber-500',  bg: 'bg-amber-500/10',   route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=tasks&taskId=${id}` : null },
  message:    { icon: MessageSquare, label: 'Chat',       color: 'text-indigo-500', bg: 'bg-indigo-500/10',  route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=chat` : null },
  decision:   { icon: ShieldAlert,   label: 'Decision',   color: 'text-rose-500',   bg: 'bg-rose-500/10',    route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=decisions` : null },
  blocker:    { icon: AlertTriangle, label: 'Blocker',    color: 'text-orange-500', bg: 'bg-orange-500/10',  route: (id, spaceId) => spaceId ? `/spaces/${spaceId}?tab=overview` : null },
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiSources, setAiSources] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    
    const handleCustomOpen = () => setIsOpen(true);

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-global-search', handleCustomOpen);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-global-search', handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
    else { setQuery(''); setResults([]); setAiAnswer(''); setAiSources([]); }
  }, [isOpen]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResults([]);
    setAiAnswer('');
    setAiSources([]);

    try {
      const term = `%${query.trim()}%`;

      const [docs, tasks, messages, meetings, decisions, videos, blockers] = await Promise.all([
        supabase.from('clipad_docs').select('id, title, content, space_id').ilike('title', term).limit(4),
        supabase.from('clipad_action_items').select('id, title, context, space_id').ilike('title', term).limit(4),
        supabase.from('clipad_messages').select('id, content, space_id').ilike('content', term).limit(4),
        supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id').ilike('title', term).limit(4),
        supabase.from('clipad_decisions').select('id, decision_text, team_space_id').ilike('decision_text', term).limit(4),
        supabase.from('clipad_videos').select('id, title, ai_summary, space_id').ilike('title', term).limit(4),
        supabase.from('clipad_blockers').select('id, description, team_space_id').ilike('description', term).limit(4),
      ]);

      const formatted = [
        ...(docs.data || []).map(d => ({ type: 'doc', id: d.id, space_id: d.space_id, label: d.title, snippet: d.content?.substring(0, 100) })),
        ...(tasks.data || []).map(t => ({ type: 'task', id: t.id, space_id: t.space_id, label: t.title, snippet: t.context?.substring(0, 100) })),
        ...(messages.data || []).map(m => ({ type: 'message', id: m.id, space_id: m.space_id, label: 'Chat Message', snippet: m.content?.substring(0, 100) })),
        ...(meetings.data || []).map(m => ({ type: 'meeting', id: m.id, space_id: m.space_id, label: m.title, snippet: m.ai_summary?.substring(0, 100) })),
        ...(decisions.data || []).map(d => ({ type: 'decision', id: d.id, space_id: d.team_space_id, label: 'Decision', snippet: d.decision_text?.substring(0, 100) })),
        ...(videos.data || []).map(v => ({ type: 'video', id: v.id, space_id: v.space_id, label: v.title, snippet: v.ai_summary?.substring(0, 100) })),
        ...(blockers.data || []).map(b => ({ type: 'blocker', id: b.id, space_id: b.team_space_id, label: 'Blocker', snippet: b.description?.substring(0, 100) })),
      ];

      setResults(formatted);

      // ALWAYS run AI synthesis, even if no exact matches are found, so the user gets an intelligent fallback.
      setIsSynthesizing(true);
      const context = formatted.length > 0 
        ? formatted.map(r => `[${r.type.toUpperCase()} ID:${r.id}] ${r.label}: ${r.snippet || ''}`).join('\n')
        : 'No exact database records found for this query.';

      const raw = await generateText([
        {
          role: 'system',
          content: `You are OrbitFlow, the ClipPad organizational intelligence assistant. Answer the user's question based on the provided workspace data. Be concise and helpful (2-4 sentences). If there is no workspace data, try to be helpful or explain you cannot find exact records. After your answer, list the IDs of the most relevant sources as JSON like: SOURCES:[{"id":"<id>","type":"<type>"}].`,
        },
        { role: 'user', content: `Question: "${query}"\n\nWorkspace Data:\n${context}` },
      ]);

      // Parse AI answer + sources
      const sourcesMatch = (raw || '').match(/SOURCES:\s*(\[.*?\])/s);
      let sources = [];
      let answer = raw || '';
      if (sourcesMatch) {
        try { sources = JSON.parse(sourcesMatch[1]); } catch { /* ignore */ }
        answer = answer.replace(/SOURCES:.*$/s, '').trim();
      }
      setAiAnswer(answer);
      setAiSources(
        sources
          .map(s => formatted.find(r => r.id === s.id))
          .filter(Boolean)
      );
      setIsSynthesizing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (res) => {
    const meta = TYPE_META[res.type];
    const route = meta?.route(res.id, res.space_id);
    if (route) { navigate(route); setIsOpen(false); }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 lg:px-4 h-9 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-all border border-slate-200 dark:border-slate-700/50 w-48 lg:w-64"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="text-sm flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">Search or ask anything...</span>
        <span className="text-xs font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 shrink-0">⌘K</span>
      </button>

      <button onClick={() => setIsOpen(true)} className="md:hidden p-2 text-slate-500">
        <Search className="w-5 h-5" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl gap-0">
          {/* Premium Search Input */}
          <form onSubmit={handleSearch} className="flex items-center px-6 py-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="w-6 h-6 text-emerald-500 mr-4 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask OrbitFlow anything — search across meetings, tasks, spaces..."
              className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 dark:text-white text-xl placeholder-slate-400 dark:placeholder-slate-500 font-medium"
            />
            {(isSearching || isSynthesizing) ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500 ml-3 shrink-0" />
            ) : query && (
              <button type="button" onClick={() => { setQuery(''); setResults([]); setAiAnswer(''); }} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </form>

          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* AI Answer Panel */}
            {(aiAnswer || isSynthesizing) && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-5 space-y-4 shadow-inner">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">OrbitFlow AI</h3>
                </div>
                {isSynthesizing ? (
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> OrbitFlow is thinking and searching the workspace...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{aiAnswer}</p>
                    {aiSources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/10 mt-3">
                        <span className="text-[10px] font-bold uppercase text-emerald-600/70 dark:text-emerald-400/70 tracking-widest">Sources:</span>
                        {aiSources.map((src, i) => {
                          const meta = TYPE_META[src.type];
                          const Icon = meta?.icon;
                          return (
                            <button
                              key={i}
                              onClick={() => handleResultClick(src)}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${meta?.bg} ${meta?.color} hover:shadow-sm transition-all border border-transparent hover:border-emerald-500/20`}
                            >
                              {Icon && <Icon className="w-3.5 h-3.5" />}
                              {src.label?.substring(0, 30)}
                              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* No Results (Only if no AI answer is available and no results) */}
            {results.length === 0 && query && !isSearching && !isSynthesizing && !aiAnswer && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No direct matches found</p>
                <p className="text-sm opacity-70 mt-1">Try rewording your query or asking OrbitFlow a broader question.</p>
              </div>
            )}

            {/* Empty State */}
            {!query && results.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20 text-emerald-500" />
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">How can I help you today?</p>
                <p className="text-sm mt-2 opacity-70 max-w-sm mx-auto">Search for specific documents, action items, or ask questions about recent team decisions.</p>
              </div>
            )}

            {/* Result Groups */}
            {results.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-1">{results.length} Results</p>
                {results.map((res, i) => {
                  const meta = TYPE_META[res.type] || {};
                  const Icon = meta.icon || Search;
                  return (
                    <button
                      key={`${res.type}-${res.id}-${i}`}
                      onClick={() => handleResultClick(res)}
                      className="w-full text-left p-3 rounded-xl hover:bg-secondary cursor-pointer transition-colors group flex items-start gap-3"
                    >
                      <div className={`p-2 rounded-lg ${meta.bg} shrink-0 mt-0.5`}>
                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground truncate">{res.label}</h4>
                        {res.snippet && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{res.snippet}</p>}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
