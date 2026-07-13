import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { CheckCircle2, Clock, XCircle, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function CommitmentTracker({ spaceId }) {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (spaceId) {
      fetchCommitments();
      const sub = supabase
        .channel(`commitments:${spaceId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'clipad_commitments',
          filter: `team_space_id=eq.${spaceId}`,
        }, fetchCommitments)
        .subscribe();
      return () => supabase.removeChannel(sub);
    }
  }, [spaceId]);

  const fetchCommitments = async () => {
    setLoading(true);
    // Removed the clipad_meeting_records join — that FK doesn't exist yet.
    // Pull commitment data flat and display meeting_id info where available.
    const { data, error } = await supabase
      .from('clipad_commitments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('team_space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) console.warn('CommitmentTracker:', error.message);
    if (data) setCommitments(data);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('clipad_commitments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setCommitments(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Commitment Tracker</h2>
        </div>
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
        AI Commitment Tracker
      </h2>

      <div className="space-y-3">
        {commitments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No informal commitments detected yet. Commitments are auto-extracted from meeting transcripts.
          </p>
        ) : (
          commitments.map(c => (
            <div
              key={c.id}
              className={`p-3 rounded-lg border ${
                c.status === 'met'
                  ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30'
                  : c.status === 'missed'
                  ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'
                  : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden shrink-0">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        {c.profiles?.full_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {c.profiles?.full_name || 'Someone'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {c.assignee_id === user?.id && c.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(c.id, 'met')}
                        className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                        title="Mark Met"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(c.id, 'missed')}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Mark Missed"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {c.status !== 'pending' && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      c.status === 'met'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {c.status}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 pl-8 relative">
                <span className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                "{c.commitment_text}"
              </p>

              {c.due_date && (
                <div className="mt-2 pl-8">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Due: {new Date(c.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
