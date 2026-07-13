import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Globe, Clock, AlertCircle } from 'lucide-react';

export default function TimezoneFairnessWidget({ workspaceId }) {
  const [fairnessData, setFairnessData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      fetchFairnessData();
    }
  }, [workspaceId]);

  const fetchFairnessData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clipad_timezone_fairness')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) console.warn('TimezoneFairnessWidget:', error.message);
    if (data) setFairnessData(data);
    setLoading(false);
  };

  if (loading) return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>;

  const totalPenalty = fairnessData.reduce((acc, d) => acc + (d.fairness_penalty_score || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            Timezone Fairness
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyzing out-of-hours meeting burden.
          </p>
        </div>
        <div className={`p-2 rounded-lg ${totalPenalty > 20 ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : totalPenalty > 5 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'}`}>
          <AlertCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-3">
        {totalPenalty === 0 ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-sm text-center border border-emerald-100 dark:border-emerald-900/30">
            Perfect! Meetings are scheduled fairly across all timezones.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Recent Penalty Scores:</p>
            {fairnessData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700/50">
                <span className="text-slate-600 dark:text-slate-400 truncate pr-4">
                  {d.clipad_meeting_records?.meeting_title || 'Meeting'}
                </span>
                <span className={`font-bold ${d.fairness_penalty_score > 5 ? 'text-red-500' : 'text-amber-500'}`}>
                  +{d.fairness_penalty_score} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
