import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Activity, TrendingDown, TrendingUp, Users } from 'lucide-react';

export default function MeetingNecessityWidget({ workspaceId }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      fetchMetrics();
      
      const sub = supabase
        .channel('public:clipad_meeting_metrics')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clipad_meeting_metrics', filter: `workspace_id=eq.${workspaceId}` }, fetchMetrics)
        .subscribe();
        
      return () => supabase.removeChannel(sub);
    }
  }, [workspaceId]);

  const fetchMetrics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clipad_meeting_metrics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) console.warn('MeetingNecessityWidget:', error.message);
    if (data) setMetrics(data);
    setLoading(false);
  };

  if (loading) return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>;

  const avgScore = metrics.length > 0 
    ? Math.round(metrics.reduce((acc, m) => acc + (m.necessity_score || 0), 0) / metrics.length)
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Meeting Necessity Index
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI analysis of meeting ROI and engagement.</p>
        </div>
        <div className={`text-2xl font-bold flex flex-col items-end ${avgScore > 70 ? 'text-emerald-600 dark:text-emerald-400' : avgScore > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
          {avgScore}
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Score</span>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No recent meetings analyzed.</p>
        ) : (
          metrics.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                  {m.clipad_meeting_records?.meeting_title || m.meeting_title || 'Untitled Meeting'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {m.engagement_metrics?.participant_count || 0}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    m.necessity_score > 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                    m.necessity_score > 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {m.recommendation || 'Optimal'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${m.necessity_score > 70 ? 'bg-emerald-500' : m.necessity_score > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${m.necessity_score || 0}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">
                  {m.necessity_score}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
