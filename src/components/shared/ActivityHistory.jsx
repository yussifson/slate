import { useTranslation } from "react-i18next";
import { useQuery } from '@tanstack/react-query';
import { Clock, UserCircle, Edit, Trash2, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

const ACTION_CONFIG = {
  CREATE: { label: 'Created', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400', icon: Plus },
  UPDATE: { label: 'Updated', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400', icon: Edit },
  DELETE: { label: 'Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', icon: Trash2 },
};

export default function ActivityHistory({ recordId, recordType }) {
  const { t } = useTranslation();
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit_logs', recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!recordId
  });

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[...Array(3)].map((_, i) => {
          return (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-2 bg-muted rounded w-2/3" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">{t("no_activity_recorded_yet", "No activity recorded yet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 mt-2">
      {logs.map((log, idx) => {
        const config = ACTION_CONFIG[log.action?.toUpperCase()] || ACTION_CONFIG.UPDATE;
        const Icon = config.icon;
        return (
          <div key={log.id} className="flex items-start gap-3 group">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {idx < logs.length - 1 && <div className="w-px flex-1 min-h-[16px] bg-border mt-1" />}
            </div>
            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserCircle className="w-3 h-3" />
                  {log.user_email || 'System'}
                </span>
                <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </div>
              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="mt-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md p-2 font-mono overflow-x-auto">
                  {Object.entries(log.changes).map(([key, val]) => {
                    return (<div key={key}><span className="text-primary">{key}</span>: {String(val)}</div>);
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
