import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video, Loader2, X, ShieldAlert, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

const TYPE_META = {
  meeting:    { icon: Calendar,      label: 'Meeting',    color: 'text-blue-500',   bg: 'bg-blue-500/10',    route: (id) => `/clipad/meetings/${id}` },
  video:      { icon: Video,         label: 'Video',      color: 'text-purple-500', bg: 'bg-purple-500/10',  route: (id) => `/clipad/videos/${id}` },
  doc:        { icon: FileText,      label: 'Doc',        color: 'text-emerald-500',bg: 'bg-emerald-500/10', route: () => null },
  task:       { icon: CheckCircle,   label: 'Task',       color: 'text-amber-500',  bg: 'bg-amber-500/10',   route: () => null },
  message:    { icon: MessageSquare, label: 'Chat',       color: 'text-indigo-500', bg: 'bg-indigo-500/10',  route: () => null },
  decision:   { icon: ShieldAlert,   label: 'Decision',   color: 'text-rose-500',   bg: 'bg-rose-500/10',    route: () => null },
  blocker:    { icon: AlertTriangle, label: 'Blocker',    color: 'text-orange-500', bg: 'bg-orange-500/10',  route: () => null },
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        supabase.from('clipad_tasks').select('id, title, description').ilike('title', term).limit(4),
        supabase.from('clipad_messages').select('id, content, space_id').ilike('content', term).limit(4),
        supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id').ilike('title', term).limit(4),
        supabase.from('clipad_decisions').select('id, decision_text, rationale, status').ilike('decision_text', term).limit(4),
        supabase.from('clipad_videos').select('id, title, ai_summary').ilike('title', term).limit(4),
        supabase.from('clipad_blockers').select('id, description, status, severity').ilike('description', term).limit(3),
      ]);

      const formatted = [
        ...(docs.data || []).map(d => ({ ...d, type: 'doc', label: d.title, snippet: d.content?.substring(0, 100) })),
        ...(tasks.data || []).map(t => ({ ...t, type: 'task', label: t.title, snippet: t.description?.substring(0, 100) })),
        ...(messages.data || []).map(m => ({ ...m, type: 'message', label: m.content?.substring(0, 50), snippet: m.content?.substring(0, 100) })),
        ...(meetings.data || []).map(m => ({ ...m, type: 'meeting', label: m.title, snippet: m.ai_summary?.substring(0, 100) })),
        ...(decisions.data || []).map(d => ({ ...d, type: 'decision', label: d.decision_text, snippet: d.rationale?.substring(0, 100) })),
        ...(videos.data || []).map(v => ({ ...v, type: 'video', label: v.title, snippet: v.ai_summary?.substring(0, 100) })),
        ...(blockers.data || []).map(b => ({ ...b, type: 'blocker', label: b.description, snippet: `Severity: ${b.severity || 'medium'} · Status: ${b.status}` })),
      ];

      setResults(formatted);

      // Auto-synthesize when results exist
      if (formatted.length > 0) {
        setIsSynthesizing(true);
        const context = formatted.map(r => `[${r.type.toUpperCase()} ID:${r.id}] ${r.label}: ${r.snippet || ''}`).join('\n');
        const raw = await generateText([
          {
            role: 'system',
            content: `You are the ClipPad organizational intelligence assistant. Answer the user's question based ONLY on the provided workspace data. Be concise (2-4 sentences). After your answer, list the IDs of the most relevant sources as JSON like: SOURCES:[{"id":"<id>","type":"<type>"}]. If you cannot answer from the data, say so honestly.`,
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (res) => {
    const meta = TYPE_META[res.type];
    const route = meta?.route(res.id);
    if (route) { navigate(route); setIsOpen(false); }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-all border border-slate-200 dark:border-slate-700/50 w-64 lg:w-96"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm flex-1 text-left">Search or ask anything...</span>
        <span className="text-xs font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">⌘K</span>
      </button>

      <button onClick={() => setIsOpen(true)} className="md:hidden p-2 text-slate-500">
        <Search className="w-5 h-5" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border-border rounded-2xl gap-0">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex items-center px-4 py-4 border-b border-border bg-secondary/30">
            <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything — decisions, meetings, videos, blockers..."
              className="flex-1 bg-transparent border-none focus:outline-none text-foreground text-base placeholder-muted-foreground"
            />
            {(isSearching || isSynthesizing) && <Loader2 className="w-5 h-5 animate-spin text-primary ml-2 shrink-0" />}
            {query && !isSearching && (
              <button type="button" onClick={() => { setQuery(''); setResults([]); setAiAnswer(''); }}>
                <X className="w-4 h-4 text-muted-foreground ml-2" />
              </button>
            )}
          </form>

          <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4">
            {/* AI Answer Panel */}
            {(aiAnswer || isSynthesizing) && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">AI Answer</h3>
                </div>
                {isSynthesizing ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" /> Analyzing workspace data...
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground leading-relaxed">{aiAnswer}</p>
                    {aiSources.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Sources:</span>
                        {aiSources.map((src, i) => {
                          const meta = TYPE_META[src.type];
                          const Icon = meta?.icon;
                          return (
                            <button
                              key={i}
                              onClick={() => handleResultClick(src)}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${meta?.bg} ${meta?.color} hover:opacity-80 transition-opacity`}
                            >
                              {Icon && <Icon className="w-3 h-3" />}
                              {src.label?.substring(0, 30)}
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* No Results */}
            {results.length === 0 && query && !isSearching && !isSynthesizing && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No results found for "<strong>{query}</strong>"
              </div>
            )}

            {/* Empty State */}
            {!query && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Search across meetings, decisions, videos, tasks, docs and more</p>
                <p className="text-xs mt-1 opacity-70">Try: "pricing decision last month" or "open blockers in marketing"</p>
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
