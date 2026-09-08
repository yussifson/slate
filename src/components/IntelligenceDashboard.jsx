import React, { useState } from 'react';
import { Brain, Sparkles, RefreshCw, Shield, AlertTriangle, TrendingUp, Info, Filter, Zap, FileText, Activity, Database, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InsightCard from '@/components/InsightCard';
import { useIntelligence } from '@/hooks/useIntelligence';
import { useCompany } from '@/hooks/useCompanyId';

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
    submitFeedback,
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
            onClick={() => runEngine(effectiveVertical)}
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
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 font-sans">
      <Tabs defaultValue="insights" className="w-full">
        {/* Luxury Navigation Header */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/80 rounded-2xl p-2 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex flex-wrap gap-1 border-0">
            <TabsTrigger 
              value="insights" 
              className="gap-2 rounded-lg py-2.5 px-4 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Insights Engine
            </TabsTrigger>
            <TabsTrigger 
              value="oracle" 
              className="gap-2 rounded-lg py-2.5 px-4 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Bot className="w-4 h-4 text-indigo-500" />
              Data Oracle AI
            </TabsTrigger>
            <TabsTrigger 
              value="report" 
              className="gap-2 rounded-lg py-2.5 px-4 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              Report Generator
            </TabsTrigger>
            <TabsTrigger 
              value="anomaly" 
              className="gap-2 rounded-lg py-2.5 px-4 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Activity className="w-4 h-4 text-rose-500" />
              Anomaly Scanner
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 px-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground">Neural Engine Online</span>
          </div>
        </div>

        {/* TAB 1: INSIGHTS ENGINE */}
        <TabsContent value="insights" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Executive Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Autonomous Analytics & Market Intelligence
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Executive Intelligence & Pattern Recognition
                </h2>
                <p className="text-sm text-slate-300 max-w-xl font-normal">
                  Continuous deep-learning audit of operational workflows, client behavior, anomalies, and financial performance.
                </p>
              </div>

              <Button
                onClick={() => runEngine(effectiveVertical)}
                disabled={isRunning}
                className="gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-6 py-6 rounded-2xl shadow-lg shadow-emerald-900/40 border-0 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                {isRunning ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Deep Scanning Workspace...</>
                ) : (
                  <><Zap className="w-5 h-5 fill-current" /> Execute Full Diagnostics</>
                )}
              </Button>
            </div>
          </div>

          {/* 4 Stat Metric Hero Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Discoveries</p>
                <p className="text-3xl font-extrabold text-foreground">{insights.length}</p>
                <p className="text-[11px] text-muted-foreground">Active pattern markers</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Critical Escalations</p>
                <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{criticalCount}</p>
                <p className="text-[11px] text-rose-600/80">Immediate attention</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warning Flags</p>
                <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{warningCount}</p>
                <p className="text-[11px] text-amber-600/80">Threshold alerts</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Positive Signals</p>
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{positiveCount}</p>
                <p className="text-[11px] text-emerald-600/80">Growth indicators</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
                {SEVERITY_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setSeverityFilter(f.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      severityFilter === f.key
                        ? 'bg-background text-foreground shadow-xs'
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
                className="text-xs border border-border/80 rounded-lg px-3 py-2 bg-background text-foreground font-medium"
              >
                {TYPE_FILTERS.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>

            {lastRun && (
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 px-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Last audit: {(lastRun.completed_at || lastRun.started_at) ? new Date(lastRun.completed_at || lastRun.started_at).toLocaleString() : "Live continuous"}
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
                  ? "Execute full diagnostics to evaluate your workspace and retrieve predictive AI insights."
                  : 'No pattern markers match your currently selected filters.'}
              </p>
              {insights.length === 0 && (
                <Button
                  onClick={() => runEngine(effectiveVertical)}
                  disabled={isRunning}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md border-0"
                >
                  <Zap className="w-4 h-4" />
                  {isRunning ? 'Analyzing...' : 'Execute Diagnostics Now'}
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
