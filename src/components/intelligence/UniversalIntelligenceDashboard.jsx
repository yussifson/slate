import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Search, Activity, AlertTriangle, CheckCircle2, 
  TrendingUp, Shield, ArrowRight, RefreshCw, Layers, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UniversalSearchService } from '@/services/UniversalSearchService';
import { BusinessExceptionService } from '@/services/BusinessExceptionService';
import { NaturalLanguageQueryService } from '@/services/NaturalLanguageQueryService';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function UniversalIntelligenceDashboard() {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadIntelligenceData();
  }, [companyId]);

  const loadIntelligenceData = async () => {
    setLoading(true);
    try {
      const [health, excList] = await Promise.all([
        BusinessExceptionService.getProcessHealthMetrics(companyId),
        BusinessExceptionService.getOpenExceptions(companyId)
      ]);
      setHealthMetrics(health);
      setExceptions(excList);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskOrbit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setSearching(true);
    try {
      const res = await NaturalLanguageQueryService.executeNaturalLanguageQuery(companyId, prompt, user);
      setQueryResult(res);
    } catch (err) {
      toast({
        title: 'Query Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-[#E2E8F0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--slate-v2-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Universal Intelligence & Insights
          </h1>
          <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
            Cross-domain relationship discovery, operational exception detection, and verified process health telemetry.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Engine: <span className="text-indigo-400 font-semibold">Deterministic + Governed Orbit</span>
        </div>
      </div>

      {/* Natural Language Ask Bar */}
      <Card className="bg-[var(--slate-v2-surface-1)] border-indigo-500/30 text-white">
        <CardContent className="p-4">
          <form onSubmit={handleAskOrbit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask business intelligence: 'What approvals are waiting?', 'Show overdue accounts', or search..."
                className="pl-9 bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs h-10"
              />
            </div>
            <Button 
              type="submit" 
              disabled={searching}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 gap-1.5"
            >
              {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Ask Orbit
            </Button>
          </form>

          {queryResult && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{queryResult.summary}</span>
                <span className="text-[10px] font-mono text-indigo-300 uppercase px-2 py-0.5 rounded bg-indigo-500/20">
                  {queryResult.intent}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Source: {queryResult.provenance}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Process Health</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {healthMetrics?.healthScore || 100} / 100
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              Grade: {healthMetrics?.statusGrade || 'Optimal'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Workflow Success</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {healthMetrics?.workflowSuccessRate || '100%'}
            </div>
            <div className="text-[11px] text-slate-400">
              {healthMetrics?.totalWorkflowExecutions || 0} total runs
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Open Exceptions</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {exceptions.length}
            </div>
            <div className="text-[11px] text-rose-400">
              Requires attention
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pending Approvals</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {healthMetrics?.pendingApprovalsCount || 0}
            </div>
            <div className="text-[11px] text-amber-400">
              Waiting in Action Center
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Business Exceptions Table */}
      <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
        <CardHeader className="pb-3 border-b border-[var(--slate-v2-border-subtle)]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Deterministic Business Exceptions</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Auto-scanned conditions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--slate-v2-surface-2)] text-slate-300 border-b border-[var(--slate-v2-border-subtle)]">
                <tr>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Exception Title</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Detected At</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--slate-v2-border-subtle)]">
                {exceptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-emerald-400/80">
                      No business exceptions detected. Operations are running within normal parameters.
                    </td>
                  </tr>
                ) : (
                  exceptions.map(exc => (
                    <tr key={exc.id} className="hover:bg-[var(--slate-v2-surface-2)]/40 transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          exc.severity === 'critical' || exc.severity === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {exc.severity}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">{exc.title}</td>
                      <td className="p-3 font-mono text-slate-400">{exc.entity_type}</td>
                      <td className="p-3 text-slate-400">{new Date(exc.created_at || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3 text-slate-300 capitalize">{exc.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
