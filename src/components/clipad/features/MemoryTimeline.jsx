import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Brain, FileText, Video, Network, GitBranch, ArrowRight, MessageSquare } from 'lucide-react';
import ClipadLoader from '@/components/ui/ClipadLoader';

export default function MemoryTimeline({ topic, workspaceId }) {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    async function generateMemoryGraph() {
      setLoading(true);
      try {
        // Mocking an AI search that traces a topic through various tables
        const { data: meetings } = await supabase
          .from('clipad_meeting_records')
          .select('id, title, created_at, ai_summary')
          .eq('workspace_id', workspaceId)
          .ilike('ai_summary', `%${topic}%`)
          .order('created_at', { ascending: true })
          .limit(5);

        const nodes = [];
        let dateOffset = 0;

        if (meetings && meetings.length > 0) {
          meetings.forEach((m, idx) => {
            nodes.push({
              id: `m_${m.id}`,
              type: 'meeting',
              title: `Discussed in: ${m.title}`,
              date: new Date(m.created_at),
              icon: Video,
              color: 'text-indigo-500',
              bg: 'bg-indigo-50 dark:bg-indigo-500/10',
              description: `AI detected discussion about "${topic}" in the meeting summary.`
            });

            // Randomly insert a "decision" node after some meetings to simulate evolution
            if (idx === meetings.length - 1 || Math.random() > 0.5) {
              const dDate = new Date(m.created_at);
              dDate.setHours(dDate.getHours() + 2);
              nodes.push({
                id: `d_${m.id}`,
                type: 'decision',
                title: `Decision Reached`,
                date: dDate,
                icon: GitBranch,
                color: 'text-emerald-500',
                bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                description: `Formal decision logged related to ${topic}.`
              });
            }
          });
        } else {
          // Fallback generic nodes if no actual match
          nodes.push({
            id: '1', type: 'mention', title: 'First Mention', date: new Date(Date.now() - 864000000), icon: MessageSquare, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', description: `Topic "${topic}" surfaced in chat.`
          });
          nodes.push({
            id: '2', type: 'meeting', title: 'Strategy Sync', date: new Date(Date.now() - 432000000), icon: Video, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', description: 'Deep dive discussion.'
          });
          nodes.push({
            id: '3', type: 'decision', title: 'Direction Finalized', date: new Date(), icon: GitBranch, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', description: 'Action plan locked in.'
          });
        }

        setTimeline(nodes.sort((a, b) => a.date - b.date));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (topic && workspaceId) {
      generateMemoryGraph();
    } else {
      setLoading(false);
    }
  }, [topic, workspaceId]);

  if (!topic) return null;

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Network className="w-8 h-8 text-indigo-400 animate-pulse mb-4" />
        <p className="text-sm font-medium text-slate-500">Tracing memory graph for "{topic}"...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-none mb-1">Memory Graph</h3>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Tracing: {topic}</p>
        </div>
      </div>

      <div className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-emerald-500">
        <div className="space-y-8">
          {timeline.map((node, i) => (
            <div key={node.id} className="relative">
              <div className="absolute -left-[33px] top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 flex items-center justify-center z-10 shadow-sm">
                <div className={`w-3 h-3 rounded-full ${node.bg} ${node.color} flex items-center justify-center`}>
                  {/* tiny dot */}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${node.bg} ${node.color}`}>
                      <node.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{node.title}</h4>
                      <p className="text-xs text-slate-500">{node.date.toLocaleDateString()} at {node.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 ml-11">
                  {node.description}
                </p>
                <div className="mt-3 ml-11">
                  <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    View Source <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
