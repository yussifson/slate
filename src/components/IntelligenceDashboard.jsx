import React, { useState } from 'react';
import {
  Brain, Sparkles, RefreshCw, Shield, AlertTriangle, TrendingUp, Info,
  Filter, Zap, FileText, Activity, Database, Bot, CheckCircle2, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InsightCard from '@/components/InsightCard';
import { useIntelligence } from '@/hooks/useIntelligence';
import { useCompany } from '@/hooks/useCompanyId';
import { toast } from 'react-hot-toast';

import DataOracle from '@/components/intelligence/DataOracle';
import ReportGenerator from '@/components/intelligence/ReportGenerator';
import AnomalyScanner from '@/components/intelligence/AnomalyScanner';

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
  const effectiveVertical = verticalOverride || company?.industry_type || company?.industry || 'universal';

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
    submitFeedback,
    refetch,
  } = useIntelligence(effectiveVertical);

  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredInsights = insights.filter(i => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && i.insight_type !== typeFilter) return false;
    return true;
  });

  const displayInsights = maxItems ? filteredInsights.slice(0, maxItems) : filteredInsights;

  const handleRunDiagnostics = async () => {
    try {
      toast.loading('Scanning workspace & executing neural diagnostics...', { id: 'diag-toast' });
      await runEngine(effectiveVertical);
      await refetch();
      toast.success(`Full workspace diagnostics complete! ${insights.length} pattern discoveries evaluated.`, { id: 'diag-toast' });
    } catch (err) {
      console.error('[Diagnostics] Failed:', err);
      toast.error('Diagnostics scan encountered an issue. Re-evaluating cached records.', { id: 'diag-toast' });
    }
  };

  // Compact mode for embedding in other dashboards
  if (compact) {
    if (!isRunning && displayInsights.length === 0) {
      return null;
    }
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 border border-primary/20 backdrop-blur-sm flex items-center justify-center">
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
            onClick={handleRunDiagnostics}
            disabled={isRunning}
          >
            <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading || isRunning ? (
          <div className="flex flex-col items-center gap-3 text-[#71717a] text-sm py-8 justify-center animate-in fade-in zoom-in duration-300">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <p className="font-medium bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Analyzing your workspace...</p>
          </div>
        ) : displayInsights.length === 0 ? (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 mx-auto text-[#71717a]/30 mb-2" />
            <p className="text-sm text-[#71717a]">No insights found for this period.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayInsights.map(insight => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                onDismiss={dismissInsight} 
                onFeedback={(id, type) => submitFeedback({ insightId: id, feedbackType: type })}
                compact={true} 
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-5 sm:space-y-6 pb-24 sm:pb-12 animate-in fade-in duration-500 font-sans">
      <Tabs defaultValue="insights" className="w-full">
        {/* Mobile-Native Responsive Navigation Header with Diagnostics Trigger */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/80 rounded-2xl p-2 sm:p-2.5 mb-5 sm:mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex flex-nowrap sm:flex-wrap gap-1 border-0 min-w-max">
              <TabsTrigger 
                value="insights" 
                className="gap-2 rounded-lg py-2 sm:py-2.5 px-3 sm:px-4 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                Insights Engine
              </TabsTrigger>
              <TabsTrigger 
                value="oracle" 
                className="gap-2 rounded-lg py-2 sm:py-2.5 px-3 sm:px-4 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm shrink-0"
              >
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                Data Oracle AI
              </TabsTrigger>
              <TabsTrigger 
                value="report" 
                className="gap-2 rounded-lg py-2 sm:py-2.5 px-3 sm:px-4 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm shrink-0"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                Report Generator
              </TabsTrigger>
              <TabsTrigger 
                value="anomaly" 
                className="gap-2 rounded-lg py-2 sm:py-2.5 px-3 sm:px-4 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm shrink-0"
              >
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                Anomaly Scanner
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 px-1 sm:px-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-muted-foreground">Live Engine</span>
            </div>

            <Button
              onClick={handleRunDiagnostics}
              disabled={isRunning}
              size="sm"
              className="h-8 sm:h-9 gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-3 sm:px-4 rounded-xl shadow-md shadow-emerald-900/20 text-xs border-0 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              {isRunning ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning...</>
              ) : (
                <><Zap className="w-3.5 h-3.5 fill-current" /> Run Diagnostics</>
              )}
            </Button>
          </div>
        </div>

        {/* TAB 1: INSIGHTS ENGINE */}
        <TabsContent value="insights" className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Top 4 Stat Metric Cards - Mobile Native 2x2 Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-5 shadow-xs flex items-center justify-between group hover:border-blue-500/40 transition-all">
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Discoveries</p>
                <p className="text-xl sm:text-3xl font-extrabold text-foreground tracking-tight">{insights.length}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Pattern markers</p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-5 shadow-xs flex items-center justify-between group hover:border-rose-500/40 transition-all">
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Critical</p>
                <p className="text-xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">{criticalCount}</p>
                <p className="text-[10px] sm:text-[11px] text-rose-600/80 font-medium truncate">Immediate action</p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-5 shadow-xs flex items-center justify-between group hover:border-amber-500/40 transition-all">
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Warnings</p>
                <p className="text-xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">{warningCount}</p>
                <p className="text-[10px] sm:text-[11px] text-amber-600/80 font-medium truncate">Threshold alerts</p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-5 shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Positive</p>
                <p className="text-xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">{positiveCount}</p>
                <p className="text-[10px] sm:text-[11px] text-emerald-600/80 font-medium truncate">Growth indicators</p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          {/* Filters Bar with Scrollable Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 p-2.5 sm:p-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 shrink-0">
                {SEVERITY_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setSeverityFilter(f.key)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                      severityFilter === f.key
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="text-xs border border-border/80 rounded-lg px-2.5 sm:px-3 py-1.5 bg-background text-foreground font-medium shrink-0 h-8"
              >
                {TYPE_FILTERS.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>

            {lastRun && (
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1.5 px-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Audit: {(lastRun.completed_at || lastRun.started_at) ? new Date(lastRun.completed_at || lastRun.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live continuous"}
              </span>
            )}
          </div>

          {/* Body Cards List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border/80 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-emerald-600 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-foreground">Extracting intelligence vectors...</p>
              <p className="text-xs text-muted-foreground mt-1">Cross-referencing historical operational metrics</p>
            </div>
          ) : displayInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-dashed border-border/80 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-emerald-600/70" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Intelligence Database Ready</h3>
              <p className="text-xs text-muted-foreground max-w-md mb-6">
                {insights.length === 0
                  ? "Execute full diagnostics to evaluate your workspace and retrieve predictive AI insights across all active modules."
                  : 'No pattern markers match your currently selected filters.'}
              </p>
              {insights.length === 0 && (
                <Button
                  onClick={handleRunDiagnostics}
                  disabled={isRunning}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md border-0"
                >
                  <Zap className="w-4 h-4" />
                  {isRunning ? 'Analyzing Workspace...' : 'Execute Diagnostics Now'}
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
                  onFeedback={(id, type) => submitFeedback({ insightId: id, feedbackType: type })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="oracle">
          <DataOracle />
        </TabsContent>

        <TabsContent value="report">
          <ReportGenerator />
        </TabsContent>

        <TabsContent value="anomaly">
          <AnomalyScanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
