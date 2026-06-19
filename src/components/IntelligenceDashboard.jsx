// src/components/IntelligenceDashboard.jsx
// The main Intelligence Dashboard panel — displays all computed insights
// Can be embedded in any page or used standalone

import { useState } from 'react';
import { Brain, Sparkles, RefreshCw, Shield, AlertTriangle, TrendingUp, Info, Filter, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InsightCard from '@/components/InsightCard';
import { useIntelligence } from '@/hooks/useIntelligence';
import { useCompany } from '@/hooks/useCompanyId';

const SEVERITY_FILTERS = [
  { key: 'all', label: 'All', icon: null },
  { key: 'critical', label: 'Critical', icon: Shield, color: 'text-red-600' },
  { key: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-600' },
  { key: 'positive', label: 'Positive', icon: TrendingUp, color: 'text-emerald-600' },
  { key: 'info', label: 'Info', icon: Info, color: 'text-blue-600' },
];

const TYPE_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'anomaly', label: 'Anomalies' },
  { key: 'prediction', label: 'Predictions' },
  { key: 'recommendation', label: 'Recommendations' },
  { key: 'risk', label: 'Risks' },
  { key: 'pattern', label: 'Patterns' },
];

export default function IntelligenceDashboard({ vertical: verticalOverride, compact = false, maxItems = null }) {
  const { company } = useCompany();
  const effectiveVertical = verticalOverride || company?.industry_type || null;

  const {
    insights,
    isLoading,
    isRunning,
    lastRun,
    criticalCount,
    warningCount,
    positiveCount,
    runEngine,
    dismissInsight,
  } = useIntelligence(effectiveVertical);

  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredInsights = insights.filter(i => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && i.insight_type !== typeFilter) return false;
    return true;
  });

  const displayInsights = maxItems ? filteredInsights.slice(0, maxItems) : filteredInsights;

  // Compact mode for embedding in other dashboards
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-card-foreground">Intelligence</h3>
            {criticalCount > 0 && (
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {criticalCount} critical
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={() => runEngine(effectiveVertical)}
            disabled={isRunning}
          >
            <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-[#71717a] text-sm py-4 justify-center">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Loading intelligence...
          </div>
        ) : displayInsights.length === 0 ? (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 mx-auto text-[#71717a]/30 mb-2" />
            <p className="text-sm text-[#71717a]">No insights yet</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-1.5 text-xs"
              onClick={() => runEngine(effectiveVertical)}
              disabled={isRunning}
            >
              <Zap className="w-3 h-3" />
              Run Analysis
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayInsights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={dismissInsight}
                compact
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full dashboard mode
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">
                Intelligence Center
              </h1>
              <p className="text-sm text-[#71717a] mt-0.5">
                AI-powered insights from your real data
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => runEngine(effectiveVertical)}
          disabled={isRunning}
          className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing Data...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Full Analysis
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{insights.length}</p>
            <p className="text-xs text-[#71717a]">Total Insights</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{criticalCount}</p>
            <p className="text-xs text-[#71717a]">Critical</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{warningCount}</p>
            <p className="text-xs text-[#71717a]">Warnings</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{positiveCount}</p>
            <p className="text-xs text-[#71717a]">Positive</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 bg-card rounded-lg border p-1">
          {SEVERITY_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setSeverityFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                severityFilter === f.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-[#71717a] hover:text-card-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-xs border rounded-lg px-3 py-2 bg-card text-card-foreground"
        >
          {TYPE_FILTERS.map(f => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        {lastRun && (
          <span className="text-[10px] text-[#71717a] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Last run: {new Date(lastRun.completed_at || lastRun.started_at).toLocaleString()}
            {lastRun.status === 'completed' && ` — ${lastRun.insights_created} insights`}
          </span>
        )}
      </div>

      {/* Insight List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-violet-600 animate-pulse" />
          </div>
          <p className="text-sm text-[#71717a]">Loading intelligence data...</p>
        </div>
      ) : displayInsights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-violet-600/40" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground mb-1">Building Intelligence</h3>
          <p className="text-sm text-[#71717a] text-center max-w-md">
            {insights.length === 0
              ? "Click 'Run Full Analysis' to scan your data and generate AI-powered insights."
              : 'No insights match your current filters. Try adjusting the filters above.'}
          </p>
          {insights.length === 0 && (
            <Button
              onClick={() => runEngine(effectiveVertical)}
              disabled={isRunning}
              className="mt-4 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
            >
              <Zap className="w-4 h-4" />
              {isRunning ? 'Analyzing...' : 'Generate Insights Now'}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {displayInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={dismissInsight}
            />
          ))}
        </div>
      )}
    </div>
  );
}
