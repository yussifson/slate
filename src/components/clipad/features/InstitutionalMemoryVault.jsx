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
      setResponse(`Based on the Institutional Memory Vault, the decision to migrate to PostgreSQL was made 8 months ago during the 'Q3 Architecture Sync'. The primary blockers resolved were cost and scalability compared to MongoDB. The stakeholders involved were Sarah (Lead Eng) and Michael (CTO).`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-indigo-900/50 shadow-sm bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 p-6">
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
        <Database className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Admin Restricted</span>
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          Institutional Memory Vault
        </h2>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-6 max-w-md">
          Query the entire historical context of decisions, blockers, and signals across your organization.
        </p>

        <form onSubmit={handleQuery} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'Why did John decide to use Redis in 2024?'"
            className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {response && (
          <div className="mt-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="mt-0.5">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                <Bot className="w-3 h-3" />
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
