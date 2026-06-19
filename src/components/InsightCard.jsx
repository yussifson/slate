// src/components/InsightCard.jsx
// Individual insight card with severity color-coding, dismiss, and CTA

import { useState } from 'react';
import { 
  AlertTriangle, AlertCircle, TrendingUp, Info, X, 
  ChevronDown, ChevronUp, ExternalLink, Sparkles, Brain 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    accent: 'border-l-red-500',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    label: 'Critical',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    accent: 'border-l-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    label: 'Warning',
  },
  positive: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    accent: 'border-l-emerald-500',
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    label: 'Positive',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    accent: 'border-l-blue-500',
    icon: Info,
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    label: 'Info',
  },
};

const TYPE_LABELS = {
  anomaly: 'Anomaly Detected',
  prediction: 'Prediction',
  recommendation: 'Recommendation',
  risk: 'Risk Alert',
  summary: 'Summary',
  pattern: 'Pattern Detected',
};

export default function InsightCard({ insight, onDismiss, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
  const Icon = config.icon;

  const timeAgo = getTimeAgo(insight.computed_at);

  if (compact) {
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border} transition-all hover:shadow-sm`}>
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground leading-tight">{insight.title}</p>
          <p className="text-xs text-[#71717a] mt-0.5">{timeAgo}</p>
        </div>
        {onDismiss && (
          <button onClick={() => onDismiss(insight.id)} className="text-[#71717a] hover:text-card-foreground flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-[0.5px] ${config.border} ${config.bg} border-l-4 ${config.accent} overflow-hidden transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.badge}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${config.badge}`}>
                  {TYPE_LABELS[insight.insight_type] || insight.insight_type}
                </span>
                {insight.confidence && (
                  <span className="text-[10px] text-[#71717a] font-mono">
                    {insight.confidence}% confidence
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-card-foreground mt-1.5 leading-tight">
                {insight.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[#71717a] hover:text-card-foreground p-1 rounded-lg hover:bg-black/5"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {onDismiss && (
              <button
                onClick={() => onDismiss(insight.id)}
                className="text-[#71717a] hover:text-card-foreground p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-card-foreground/80 leading-relaxed pl-11">
              {insight.body}
            </p>

            {insight.data_snapshot && (
              <div className="pl-11">
                <details className="text-xs">
                  <summary className="text-[#71717a] cursor-pointer hover:text-card-foreground font-medium">
                    View underlying data
                  </summary>
                  <pre className="mt-1 p-2 bg-black/5 dark:bg-white/5 rounded-lg overflow-x-auto text-[10px] font-mono">
                    {JSON.stringify(insight.data_snapshot, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {insight.action_label && (
              <div className="pl-11">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                  <ExternalLink className="w-3 h-3" />
                  {insight.action_label}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pl-11">
          <span className="text-[10px] text-[#71717a] font-medium">{timeAgo}</span>
          <div className="flex items-center gap-1 text-[10px] text-[#71717a]">
            <Sparkles className="w-3 h-3" />
            <span>AI Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
