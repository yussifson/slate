import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { formatCurrency } from '@/lib/constants';
import { usePowerSync } from '@powersync/react';
import {
  Award, TrendingUp, DollarSign, Calendar, Users, Star, BarChart3, RefreshCw, Filter, CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function JCLAgentMetrics() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useViewPreference('re_agentmetrics_jcl', 'grid');

  const loadData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_agent_metrics WHERE company_id = ? ORDER BY sales_volume DESC',
        [companyId]
      );
      setMetrics(res.rows._array || Array.from(res.rows || []));
    } catch (e) {
      console.error('[JCLAgentMetrics] Error loading metrics:', e);
      toast.error('Failed to load agent performance metrics');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const totalSalesVolume = useMemo(() => {
    return metrics.reduce((sum, m) => sum + (m.sales_volume || 0), 0);
  }, [metrics]);

  const totalCommissionsEarned = useMemo(() => {
    return metrics.reduce((sum, m) => sum + (m.commission_earned || 0), 0);
  }, [metrics]);

  const totalListingsSold = useMemo(() => {
    return metrics.reduce((sum, m) => sum + (m.listings_sold_count || 0), 0);
  }, [metrics]);

  const avgSatisfaction = useMemo(() => {
    if (!metrics.length) return 0;
    return (metrics.reduce((sum, m) => sum + (m.average_client_rating || 0), 0) / metrics.length).toFixed(1);
  }, [metrics]);

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Broker Leaderboard & Agent Metrics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Closed sales volume leaderboards, commission earnings, and client rating scorecards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={view} setView={setView} />
          <Button variant="outline" size="sm" onClick={loadData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh Scorecard
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sales Volume</p>
            <p className="text-2xl font-extrabold text-foreground font-mono tracking-tight">
              {formatCurrency(totalSalesVolume, 'USD')}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Cumulative brokerage volume
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commissions Earned</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {formatCurrency(totalCommissionsEarned, 'USD')}
            </p>
            <p className="text-[11px] text-emerald-600/80 font-medium">Gross agent earnings</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Award className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closed Deals</p>
            <p className="text-3xl font-extrabold text-foreground">{totalListingsSold}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Total properties sold</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CheckCircle2 className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Satisfaction Rating</p>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              {avgSatisfaction} <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </p>
            <p className="text-[11px] text-amber-600/80 font-medium">Avg client score</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Star className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Main Grid Scorecards */}
      {loading ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-xs text-muted-foreground">Calculating broker leaderboards...</p>
        </div>
      ) : metrics.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">No Agent Metrics Logged</p>
          <p className="text-xs text-muted-foreground mt-1">Closed transactions will automatically populate agent performance scorecards.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {metrics.map((m, idx) => {
            const rankColors = idx === 0
              ? 'from-amber-500 via-yellow-400 to-orange-400'
              : idx === 1
              ? 'from-slate-500 via-slate-400 to-slate-300'
              : idx === 2
              ? 'from-orange-700 via-orange-600 to-amber-600'
              : 'from-emerald-700 via-emerald-600 to-teal-500';
            return (
              <div key={m.id || idx} className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                {/* Gradient Banner */}
                <div className={cn('relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br', rankColors)}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                  <div className="flex items-start justify-between relative z-10">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                      Rank #{idx + 1} · {m.metric_period || 'Annual'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-white" />
                      {m.average_client_rating || '5.0'} / 5
                    </span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-white font-extrabold text-sm leading-snug">Agent ID: {m.agent_id || 'Broker'}</p>
                    <p className="text-white/80 text-[11px] font-mono font-bold">{formatCurrency(m.sales_volume || 0, 'USD')} closed volume</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* 4 Quick Stat Strip */}
                  <div className="grid grid-cols-4 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/20 text-center py-2.5">
                    <div>
                      <span className="text-sm font-extrabold text-foreground block">{m.listings_taken_count || 0}</span>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground">Listings</span>
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">{m.listings_sold_count || 0}</span>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground">Sold</span>
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-foreground block">{m.client_count || 0}</span>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground">Clients</span>
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-foreground block">{m.average_days_on_market || 0}d</span>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground">DOM</span>
                    </div>
                  </div>

                  {/* Financial box */}
                  <div className="p-3.5 rounded-xl bg-muted/40 space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-sans">Avg Sale Price:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(m.average_sale_price || 0, 'USD')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-border/50">
                      <span className="text-muted-foreground font-sans">Commission Earned:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(m.commission_earned || 0, 'USD')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Agent ID</th>
                  <th className="text-right py-3 px-4">Sales Volume</th>
                  <th className="text-right py-3 px-4">Commission</th>
                  <th className="text-center py-3 px-4">Listings</th>
                  <th className="text-center py-3 px-4">Sold</th>
                  <th className="text-center py-3 px-4">Avg DOM</th>
                  <th className="text-center py-3 px-4">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {metrics.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">#{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-foreground">{m.agent_id}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-foreground">{formatCurrency(m.sales_volume || 0, 'USD')}</td>
                    <td className="py-3 px-4 text-right font-extrabold font-mono text-emerald-600">{formatCurrency(m.commission_earned || 0, 'USD')}</td>
                    <td className="py-3 px-4 text-center font-semibold">{m.listings_taken_count || 0}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{m.listings_sold_count || 0}</td>
                    <td className="py-3 px-4 text-center font-mono">{m.average_days_on_market || 0} days</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{m.average_client_rating || '5.0'} / 5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
