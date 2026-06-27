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

  // Full dashboard mode with Tabs for powerful tools
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-emerald-500 to-teal-600 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-primary/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity"></div>
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              AI Intelligence Hub
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Powerful active AI tools and continuous passive data insights
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="mb-8 flex flex-wrap sm:grid w-full sm:grid-cols-4 max-w-4xl bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
          <TabsTrigger value="insights" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-semibold"><Sparkles className="w-4 h-4"/> Insights Engine</TabsTrigger>
          <TabsTrigger value="oracle" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800 data-[state=active]:text-blue-500 data-[state=active]:shadow-md transition-all font-semibold"><Bot className="w-4 h-4"/> Data Oracle</TabsTrigger>
          <TabsTrigger value="report" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800 data-[state=active]:text-purple-500 data-[state=active]:shadow-md transition-all font-semibold"><FileText className="w-4 h-4"/> Report Generator</TabsTrigger>
          <TabsTrigger value="anomaly" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800 data-[state=active]:text-red-500 data-[state=active]:shadow-md transition-all font-semibold"><Activity className="w-4 h-4"/> Anomaly Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-2xl border-[0.5px] border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/20 dark:shadow-none bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950/50 relative overflow-hidden gap-4">
            <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="font-extrabold text-xl text-foreground tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                Passive Insights Engine
              </h3>
              <p className="text-sm text-muted-foreground mt-1 ml-10 font-medium">Continuous AI scanning of your data for hidden patterns</p>
            </div>
            <Button
              onClick={() => runEngine(effectiveVertical)}
              disabled={isRunning}
              className="relative z-10 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl shadow-orange-500/25 border-0 font-bold px-6 py-5 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              {isRunning ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing Workspace...</>
              ) : (
                <><Zap className="w-5 h-5 fill-current" /> Run Full Analysis</>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
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
                Last run: {(lastRun.completed_at || lastRun.started_at) ? new Date(lastRun.completed_at || lastRun.started_at).toLocaleString() : "Unknown"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-[#71717a]">Loading intelligence data...</p>
            </div>
          ) : displayInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-1">Building Intelligence</h3>
              <p className="text-sm text-[#71717a] text-center max-w-md mb-4">
                {insights.length === 0
                  ? "Click 'Run Full Analysis' to scan your data and generate AI-powered insights."
                  : 'No insights match your current filters. Try adjusting the filters above.'}
              </p>
              {insights.length === 0 && (
                <Button
                  onClick={() => runEngine(effectiveVertical)}
                  disabled={isRunning}
                  className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border-0"
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
