import React, { useState, useEffect } from 'react';
import { Search, Sparkles, FileText, CheckCircle, MessageSquare, Calendar, Video, Loader2, X } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [aiSynthesis, setAiSynthesis] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setResults([]);
    setAiSynthesis('');
    
    try {
      const term = `%${query.trim()}%`;
      
      const [docs, tasks, messages, meetings] = await Promise.all([
        supabase.from('clipad_docs').select('id, title, content, space_id').ilike('title', term).limit(3),
        supabase.from('clipad_tasks').select('id, title, description, space_id:board_id(space_id)').ilike('title', term).limit(3),
        supabase.from('clipad_messages').select('id, content, space_id').ilike('content', term).limit(3),
        supabase.from('clipad_meeting_records').select('id, title, ai_summary, space_id').ilike('title', term).limit(3)
      ]);

      const formattedResults = [
        ...(docs.data || []).map(d => ({ ...d, type: 'doc', icon: FileText, label: d.title, snippet: d.content?.substring(0, 80) })),
        ...(tasks.data || []).map(t => ({ ...t, type: 'task', icon: CheckCircle, label: t.title, snippet: t.description?.substring(0, 80) })),
        ...(messages.data || []).map(m => ({ ...m, type: 'message', icon: MessageSquare, label: m.content?.substring(0, 40), snippet: m.content?.substring(0, 80) })),
        ...(meetings.data || []).map(m => ({ ...m, type: 'meeting', icon: Video, label: m.title, snippet: m.ai_summary?.substring(0, 80) }))
      ];
      
      setResults(formattedResults);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSynthesize = async () => {
    if (results.length === 0) return;
    setIsSynthesizing(true);
    
    const context = results.map(r => `[${r.type.toUpperCase()}] ${r.label}: ${r.snippet}`).join('\n');
    const prompt = `Based on the following workspace data, answer the user's query: "${query}"\n\nData:\n${context}`;
    
    try {
      const res = await generateText(prompt);
      setAiSynthesis(res.result?.response || 'No synthesis generated.');
    } catch (err) {
      console.error(err);
      setAiSynthesis('Failed to synthesize results.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-all border border-slate-200 dark:border-slate-700/50 w-64 lg:w-96"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm flex-1 text-left">Search everything...</span>
        <span className="text-xs font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">⌘K</span>
      </button>

      <button onClick={() => setIsOpen(true)} className="md:hidden p-2 text-slate-500">
        <Search className="w-5 h-5" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border-border rounded-2xl gap-0">
          <form onSubmit={handleSearch} className="flex items-center px-4 py-4 border-b border-border bg-secondary/30">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything or search..."
              className="flex-1 bg-transparent border-none focus:outline-none text-foreground text-lg placeholder-muted-foreground"
            />
            {isSearching && <Loader2 className="w-5 h-5 animate-spin text-primary ml-2" />}
          </form>

          <div className="max-h-[60vh] overflow-y-auto p-4">
            {results.length > 0 && (
              <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> AI Synthesis
                  </h3>
                  {!aiSynthesis && !isSynthesizing && (
                    <button 
                      onClick={handleSynthesize}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Synthesize Results
                    </button>
                  )}
                </div>
                
                {isSynthesizing && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" /> Analyzing workspace data...
                  </div>
                )}
                
                {aiSynthesis && (
                  <div className="text-sm text-foreground prose prose-sm dark:prose-invert">
                    {aiSynthesis}
                  </div>
                )}
              </div>
            )}

            {results.length === 0 && query && !isSearching && (
              <div className="text-center py-10 text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            <div className="space-y-2">
              {results.map((res, i) => (
                <div key={`${res.type}-${res.id}-${i}`} className="p-3 rounded-xl hover:bg-secondary cursor-pointer transition-colors group flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary group-hover:bg-background transition-colors text-muted-foreground">
                    <res.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{res.label}</h4>
                    {res.snippet && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{res.snippet}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
