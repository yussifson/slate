import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Database, Search, Bot, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { generateText } from '@/lib/cloudflareAI';

export default function InstitutionalMemoryVault({ workspaceId }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      // 1. Fetch real organizational context from the database
      const [meetingsRes, decisionsRes, blockersRes, videosRes, tasksRes] = await Promise.all([
        supabase
          .from('clipad_meeting_records')
          .select('meeting_title, ai_summary, created_at, ended_at, host_id')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('clipad_decisions')
          .select('decision_text, rationale, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('clipad_blockers')
          .select('description, status, detected_at, resolved_at')
          .order('detected_at', { ascending: false })
          .limit(10),
        supabase
          .from('clipad_videos')
          .select('title, ai_summary, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('clipad_action_items')
          .select('title, is_complete, created_at')
          .order('created_at', { ascending: false })
          .limit(15),
      ]);

      // 2. Build a rich context document from real data
      const meetings = meetingsRes.data || [];
      const decisions = decisionsRes.data || [];
      const blockers = blockersRes.data || [];
      const videos = videosRes.data || [];
      const tasks = tasksRes.data || [];

      const contextParts = [];

      if (meetings.length > 0) {
        contextParts.push('=== MEETING HISTORY ===');
        meetings.forEach(m => {
          contextParts.push(`Meeting: "${m.meeting_title || 'Untitled'}" on ${new Date(m.created_at).toLocaleDateString()}`);
          if (m.ai_summary && m.ai_summary !== 'Generating summary...' && m.ai_summary !== 'No transcript recorded.') {
            contextParts.push(`  Summary: ${m.ai_summary}`);
          }
        });
      }

      if (decisions.length > 0) {
        contextParts.push('\n=== TEAM DECISIONS ===');
        decisions.forEach(d => {
          contextParts.push(`Decision [${d.status || 'active'}]: ${d.decision_text}`);
          if (d.rationale) contextParts.push(`  Rationale: ${d.rationale}`);
          contextParts.push(`  Date: ${new Date(d.created_at).toLocaleDateString()}`);
        });
      }

      if (blockers.length > 0) {
        contextParts.push('\n=== BLOCKERS & RESOLUTIONS ===');
        blockers.forEach(b => {
          contextParts.push(`Blocker [${b.status}]: ${b.description}`);
          if (b.resolved_at) contextParts.push(`  Resolved: ${new Date(b.resolved_at).toLocaleDateString()}`);
        });
      }

      if (videos.length > 0) {
        contextParts.push('\n=== ASYNC VIDEO RECORDINGS ===');
        videos.forEach(v => {
          contextParts.push(`Video: "${v.title}" (${new Date(v.created_at).toLocaleDateString()})`);
          if (v.ai_summary) contextParts.push(`  Summary: ${v.ai_summary}`);
        });
      }

      if (tasks.length > 0) {
        contextParts.push('\n=== ACTION ITEMS ===');
        tasks.forEach(t => {
          contextParts.push(`[${t.is_complete ? 'DONE' : 'OPEN'}] ${t.title}`);
        });
      }

      if (contextParts.length === 0) {
        setResponse("No organizational data has been recorded yet. Start by running meetings, recording decisions, or logging blockers — the Knowledge Graph will build from your team's real activity.");
        setLoading(false);
        return;
      }

      const knowledgeContext = contextParts.join('\n');

      // 3. Query the real AI with full organizational context
      const aiResponse = await generateText([
        {
          role: 'system',
          content: `You are an Enterprise Knowledge Graph AI assistant. Your job is to answer questions about an organization based ONLY on the real data provided below. Do NOT make up facts, names, dates, or events that aren't in the data. If the data doesn't contain the answer, say "I don't have enough recorded data to answer that yet — as your team adds more meetings, decisions, and recordings, the Knowledge Graph will grow richer."\n\nORGANIZATIONAL KNOWLEDGE BASE:\n${knowledgeContext}`
        },
        {
          role: 'user',
          content: query
        }
      ]);

      setResponse(typeof aiResponse === 'string' ? aiResponse : aiResponse?.response || 'Unable to generate a response.');
    } catch (err) {
      console.error('Knowledge Graph error:', err);
      setError('Failed to query the Knowledge Graph. Please check your AI configuration.');
    }

    setLoading(false);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-primary/30 shadow-sm bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-900 dark:to-primary/10 p-6 md:p-8">
      <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 dark:opacity-10 pointer-events-none">
        <Database className="w-40 h-40 text-primary dark:text-primary" />
      </div>
      
      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Admin Workspace</span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3 tracking-tight">
          Enterprise Knowledge Graph
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          Unlock your organization's collective intelligence. Query the entire historical context of decisions, past blockers, and team signals to instantly find answers.
        </p>

        <form onSubmit={handleQuery} className="relative shadow-sm rounded-xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'Why did we decide to use this approach?' or 'What blockers did we resolve last month?'"
            className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base transition-all"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {response && (
          <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 flex gap-4 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
            <div className="mt-0.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{response}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
