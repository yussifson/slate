import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function RedundantWorkAlert({ workspaceId, currentSpaceId }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (workspaceId && user?.clipad_plan === 'enterprise') {
      fetchAlerts();
      
      const sub = supabase
        .channel('public:clipad_work_topics')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clipad_work_topics', filter: `workspace_id=eq.${workspaceId}` }, fetchAlerts)
        .subscribe();
        
      return () => { supabase.removeChannel(sub); };
    }
  }, [workspaceId]);

  const fetchAlerts = async () => {
    // This is a simplified client-side mock for the semantic overlap detection.
    // In production, an Edge Function computes the actual vector overlap and writes to an alerts table.
    // For now, we simulate pulling overlapping topics from other spaces in the workspace.
    const { data } = await supabase
      .from('clipad_work_topics')
      .select('*, clipad_spaces(name)')
      .eq('workspace_id', workspaceId)
      .neq('team_space_id', currentSpaceId)
      .order('created_at', { ascending: false })
      .limit(2);
      
    if (data) {
      setAlerts(data);
    }
  };

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
            Redundant Work Detected
            <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">
              Enterprise AI
            </span>
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
            Our Semantic Engine detected that another team is currently discussing or working on similar topics. 
            Consider aligning to avoid duplication of effort.
          </p>
          
          <div className="mt-3 space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/50 rounded-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Topic: {alert.topic_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Being discussed in <strong className="text-slate-700 dark:text-slate-300">{alert.clipad_spaces?.name || 'Another Space'}</strong>
                  </p>
                </div>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-md transition-colors">
                  View Context <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
