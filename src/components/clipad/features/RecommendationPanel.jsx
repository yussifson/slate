import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Brain, Sparkles, MessageSquare, Plus, FileText, X } from 'lucide-react';

export default function RecommendationPanel({ contextText, workspaceId, onInsert }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    // Debounce the analysis so we don't spam the DB/AI on every keystroke
    const timer = setTimeout(() => {
      if (!contextText || contextText.length < 10) {
        setRecommendations([]);
        return;
      }
      
      analyzeContext();
    }, 1500);

    return () => clearTimeout(timer);
  }, [contextText, workspaceId]);

  async function analyzeContext() {
    setLoading(true);
    try {
      // Mocking context analysis
      // Real implementation would pass `contextText` to invokeCloudflareAi to search `clipad_meeting_records` and `clipad_decisions`
      
      const keywords = contextText.toLowerCase().split(' ').filter(w => w.length > 4);
      if (keywords.length === 0) return;

      const { data: decisions } = await supabase
        .from('clipad_decisions')
        .select('title, context')
        .limit(3);

      const generatedRecs = [];

      // Simple mock logic: if user types words that match recent decisions, surface them
      if (decisions && decisions.length > 0 && Math.random() > 0.3) {
        const d = decisions[0];
        generatedRecs.push({
          id: `dec_${Date.now()}`,
          type: 'decision',
          title: 'Related Decision Found',
          content: `The team recently decided on "${d.title}".`,
          snippet: `[Decision: ${d.title}] - ${d.context || 'Refer to organizational guidelines.'}`,
          icon: FileText
        });
      }

      // Mock transcript quote
      if (Math.random() > 0.5) {
        generatedRecs.push({
          id: `quote_${Date.now()}`,
          type: 'quote',
          title: 'Relevant Meeting Quote',
          content: 'In the latest sync, Sarah mentioned pricing strategy changes.',
          snippet: `"We are moving to a tier-based pricing model starting Q3 to better capture enterprise value." - Sarah, Strategy Sync`,
          icon: MessageSquare
        });
      }

      setRecommendations(generatedRecs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (recommendations.length === 0 && !loading) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-80 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl shadow-2xl transition-all duration-300 ${minimized ? 'translate-y-[calc(100%-60px)]' : 'translate-y-0'}`}>
      
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-t-2xl"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {loading && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>}
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Context Engine</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className={`w-4 h-4 transition-transform ${minimized ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse mb-2" />
              <p className="text-xs font-medium text-slate-500">Analyzing your context...</p>
            </div>
          ) : (
            recommendations.map(rec => (
              <div key={rec.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <rec.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{rec.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{rec.content}</p>
                  </div>
                </div>
                
                <div className="mt-3 bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 italic">
                  {rec.snippet}
                </div>
                
                {onInsert && (
                  <button 
                    onClick={() => onInsert(rec.snippet)}
                    className="w-full mt-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-3 h-3" /> Insert Context
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
