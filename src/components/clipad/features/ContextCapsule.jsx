import React, { useState } from 'react';
import { supabase } from '../../../api/supabaseClient';
import { Sparkles, Brain, FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function ContextCapsule({ spaceId, hasFullIntelligence }) {
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateCapsule = async () => {
    if (!spaceId || !hasFullIntelligence) return;
    setLoading(true);
    setError(null);
    
    try {
      // 1. Check cache first
      const { data: cacheData, error: cacheError } = await supabase
        .from('clipad_context_capsule_cache')
        .select('*')
        .eq('team_space_id', spaceId)
        .single();
        
      if (!cacheError && cacheData && new Date(cacheData.expires_at) > new Date()) {
        setCapsule(cacheData.content);
        setLoading(false);
        return;
      }

      // 2. Fetch fresh data to assemble
      const [decisionsRes, blockersRes, tasksRes] = await Promise.all([
        supabase.from('clipad_decisions').select('*').eq('team_space_id', spaceId).eq('status', 'active').order('created_at', { ascending: false }).limit(5),
        supabase.from('clipad_blockers').select('*').eq('team_space_id', spaceId).eq('status', 'open').limit(5),
        supabase.from('clipad_tasks').select('*').eq('status', 'todo').order('created_at', { ascending: false }).limit(5)
      ]);

      const content = {
        decisions: decisionsRes.data || [],
        blockers: blockersRes.data || [],
        tasks: tasksRes.data || [],
        generated_at: new Date().toISOString()
      };

      // 3. Cache it (TTL 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      await supabase.from('clipad_context_capsule_cache').upsert({
        team_space_id: spaceId,
        content: content,
        expires_at: expiresAt.toISOString(),
        generated_at: new Date().toISOString()
      });

      setCapsule(content);
    } catch (err) {
      console.error(err);
      setError("Failed to generate context capsule");
    }
    setLoading(false);
  };

  if (!hasFullIntelligence) {
    return (
      <button 
        className="w-full py-3 px-4 rounded-xl border border-slate-700/50 bg-slate-800/30 flex items-center justify-center gap-2 text-slate-400 cursor-not-allowed opacity-70"
        title="Upgrade to Pro or Enterprise to access AI Context Capsules"
      >
        <ShieldAlert className="w-5 h-5 text-indigo-400" />
        Context Capsules Locked
      </button>
    );
  }

  return (
    <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-5">
      {!capsule ? (
        <div className="text-center">
          <Brain className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">Need to get up to speed?</h3>
          <p className="text-sm text-slate-400 mb-4">
            Generate an AI Context Capsule to instantly summarize active decisions, open blockers, and pending tasks in this space.
          </p>
          <button 
            onClick={generateCapsule}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Capsule
              </>
            )}
          </button>
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Context Capsule
            </h3>
            <span className="text-xs text-slate-500">Generated {new Date(capsule.generated_at).toLocaleTimeString()}</span>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Active Decisions
            </h4>
            {capsule.decisions.length === 0 ? (
              <p className="text-xs text-slate-500">No active decisions recorded recently.</p>
            ) : (
              <ul className="space-y-2">
                {capsule.decisions.map(d => (
                  <li key={d.id} className="text-sm text-slate-300 bg-slate-900/40 p-2 rounded border border-slate-700/30">
                    {d.decision_text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Open Blockers
            </h4>
            {capsule.blockers.length === 0 ? (
              <p className="text-xs text-slate-500">No active blockers detected.</p>
            ) : (
              <ul className="space-y-2">
                {capsule.blockers.map(b => (
                  <li key={b.id} className="text-sm text-amber-200/80 bg-amber-500/5 p-2 rounded border border-amber-500/20">
                    {b.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Recent Pending Tasks
            </h4>
            {capsule.tasks.length === 0 ? (
              <p className="text-xs text-slate-500">No open tasks right now.</p>
            ) : (
              <ul className="space-y-2">
                {capsule.tasks.map(t => (
                  <li key={t.id} className="text-sm text-slate-300 bg-slate-900/40 p-2 rounded border border-slate-700/30">
                    {t.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button 
            onClick={generateCapsule}
            className="text-xs text-indigo-400 hover:text-indigo-300 w-full text-center mt-2"
          >
            Refresh Capsule
          </button>
        </div>
      )}
    </div>
  );
}
