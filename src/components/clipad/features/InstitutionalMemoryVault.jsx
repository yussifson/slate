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
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl shadow-lg border border-indigo-900/50 p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Database className="w-32 h-32 text-indigo-400" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Admin Restricted</span>
        </div>
        
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          Institutional Memory Vault
        </h2>
        <p className="text-sm text-indigo-200 mb-6 max-w-md">
          Query the entire historical context of decisions, blockers, and signals across your organization.
        </p>

        <form onSubmit={handleQuery} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'Why did John decide to use Redis in 2024?'"
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500 text-sm"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md px-3 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {response && (
          <div className="mt-4 bg-slate-800/80 border border-slate-700 rounded-lg p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="mt-0.5">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                <Bot className="w-3 h-3" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-200 leading-relaxed">{response}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
