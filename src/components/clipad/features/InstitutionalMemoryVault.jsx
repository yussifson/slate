import React, { useState } from 'react';
import { Database, Search, Bot, Lock, ArrowRight } from 'lucide-react';

export default function InstitutionalMemoryVault({ workspaceId }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    // Simulate AI querying the aggregated memory vault
    setTimeout(() => {
      setResponse(`Based on the Enterprise Knowledge Graph, the decision to migrate to PostgreSQL was made 8 months ago during the 'Q3 Architecture Sync'. The primary blockers resolved were cost and scalability compared to MongoDB. The stakeholders involved were Sarah (Lead Eng) and Michael (CTO).`);
      setLoading(false);
    }, 1500);
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
            placeholder="e.g., 'Why did John decide to use Redis in 2024?'"
            className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base transition-all"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {response && (
          <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 flex gap-4 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
            <div className="mt-0.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{response}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
