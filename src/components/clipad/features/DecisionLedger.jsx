import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { ShieldAlert, CheckCircle, Clock, Archive } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function DecisionLedger({ workspaceId, spaceId, hasFullIntelligence }) {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // RBAC checks
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'company_admin';
  const isCompanyAdmin = user?.role === 'super_admin' || user?.role === 'company_admin';

  useEffect(() => {
    if (!spaceId) return;

    const fetchDecisions = async () => {
      setLoading(true);
      // Query by spaceId (always available). workspaceId is used for multi-tenant isolation when available.
      let query = supabase
        .from('clipad_decisions')
        .select('*')
        .eq('team_space_id', spaceId)
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;
      if (error) console.warn('DecisionLedger:', error.message);
      if (data) setDecisions(data);
      setLoading(false);
    };

    fetchDecisions();
  }, [workspaceId, spaceId, hasFullIntelligence]);

  const handleSupersede = async (decisionId) => {
    if (!isAdmin) return;
    // In a real flow, you'd prompt for the reasoning and the new decision, but for now we just mark superseded
    const { error } = await supabase
      .from('clipad_decisions')
      .update({ status: 'superseded' })
      .eq('id', decisionId)
      .eq('workspace_id', workspaceId); // Enforce tenant isolation

    if (!error) {
      setDecisions(decisions.map(d => d.id === decisionId ? { ...d, status: 'superseded' } : d));
    }
  };

  if (!hasFullIntelligence) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-slate-700/50 rounded-xl bg-slate-800/20">
        <ShieldAlert className="w-12 h-12 text-indigo-400 mb-4" />
        <h3 className="text-xl font-medium text-slate-200 mb-2">Decision Ledger is Locked</h3>
        <p className="text-slate-400 max-w-md">
          Upgrade to Pro or Enterprise to access the Full Intelligence Layer and maintain an immutable ledger of team decisions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Decision Ledger</h2>
          <p className="text-sm text-slate-400 mt-1">Immutable record of team decisions to prevent relitigation.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : decisions.length === 0 ? (
        <div className="p-8 text-center text-slate-400 border border-slate-700/50 rounded-xl bg-slate-800/30">
          No decisions logged yet. Decisions are automatically extracted from meetings and chats via AI.
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map(decision => (
            <div key={decision.id} className={`p-5 rounded-xl border transition-colors ${decision.status === 'active' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-700/50 bg-slate-800/20 opacity-70'}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {decision.status === 'active' ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded-full">
                        <Archive className="w-3 h-3" /> Superseded
                      </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(decision.created_at).toLocaleDateString()}
                    </span>
                    {decision.reversal_cost && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${decision.reversal_cost === 'high' ? 'border-rose-500/30 text-rose-400' : decision.reversal_cost === 'medium' ? 'border-amber-500/30 text-amber-400' : 'border-slate-500/30 text-slate-400'}`}>
                        {decision.reversal_cost} Reversal Cost
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-medium text-slate-200 mb-2">{decision.decision_text}</h4>
                  {decision.reasoning_text && (
                    <p className="text-sm text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                      <span className="font-medium text-slate-300 block mb-1">Reasoning:</span>
                      {decision.reasoning_text}
                    </p>
                  )}
                </div>
                {isAdmin && decision.status === 'active' && (
                  <button 
                    onClick={() => handleSupersede(decision.id)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Mark Superseded
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
