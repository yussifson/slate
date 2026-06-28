import React, { useState } from 'react';
import { Target, TrendingUp, Users, Plus, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export default function OptavelExecutive() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newDecision, setNewDecision] = useState('');

  const { data: decisions = [] } = useQuery({
    queryKey: ['optavel_decisions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_decisions WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const addDecision = useMutation({
    mutationFn: async () => {
      if (!newDecision) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_decisions (id, company_id, title, status) VALUES (?, ?, ?, ?)`,
        [id, companyId, newDecision, 'approved']
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_decisions']);
      setNewDecision('');
    }
  });

  const updateDecisionStatus = async (id, status) => {
    await powerSync.execute(`UPDATE optavel_decisions SET status = ? WHERE id = ?`, [status, id]);
    queryClient.invalidateQueries(['optavel_decisions']);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Target className="w-8 h-8 text-emerald-500" />
          Executive Layer
        </h1>
        <p className="text-slate-400 mt-1">OKR & Goals Management, Strategic Decision Log, and Board Reporting.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Strategic Decision Log</h2>
            <div className="flex gap-2">
              <input 
                type="text" placeholder="Decision..." 
                className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-emerald-500"
                value={newDecision} onChange={e => setNewDecision(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDecision.mutate()}
              />
              <button onClick={() => addDecision.mutate()} className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-slate-900 dark:text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {decisions.length === 0 ? <p className="text-sm text-slate-500">No strategic decisions logged.</p> : decisions.map(decision => (
              <div key={decision.id} className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{decision.title}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => updateDecisionStatus(decision.id, 'approved')} className={`p-1 rounded ${decision.status === 'approved' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:bg-slate-200 dark:bg-white/10'}`}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => updateDecisionStatus(decision.id, 'rejected')} className={`p-1 rounded ${decision.status === 'rejected' ? 'text-orange-400 bg-orange-400/10' : 'text-slate-500 hover:bg-slate-200 dark:bg-white/10'}`}>
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {decision.context && <p className="text-sm text-slate-400 mt-1">{decision.context}</p>}
                <div className="mt-3 flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${decision.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : decision.status === 'rejected' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-200 dark:bg-white/10 text-slate-300'}`}>
                    {decision.status}
                  </span>
                  <span className="px-2 py-1 bg-slate-200 dark:bg-white/10 text-slate-300 text-xs rounded">{new Date(decision.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Board & Investor Reporting</h2>
          <div className="space-y-4">
            <button className="w-full text-left p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:bg-white/10 transition-colors flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Q3 2026 Board Deck</h3>
                <p className="text-sm text-slate-400 mt-1">Generated automatically from live metrics</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </button>
            <button className="w-full text-left p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:bg-white/10 transition-colors flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Live Cap Table</h3>
                <p className="text-sm text-slate-400 mt-1">View equity distribution and vesting</p>
              </div>
              <Users className="w-5 h-5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
