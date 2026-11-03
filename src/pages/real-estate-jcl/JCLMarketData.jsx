import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Search, Filter, MapPin, DollarSign, Home, Calendar,
  BarChart3, Activity, RefreshCw, Sparkles, Plus, Layers, ArrowUpRight, ArrowDownRight, Building2, CheckCircle2
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function JCLMarketData() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [marketData, setMarketData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [view, setView] = useViewPreference('re_marketdata_jcl', 'grid');

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_market_data WHERE company_id = ? ORDER BY data_date DESC',
        [companyId]
      );
      setMarketData(res.rows._array || Array.from(res.rows || []));
    } catch (e) {
      console.error('[JCLMarketData] Fetch failed:', e);
      toast.error('Failed to load market intelligence data');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const filteredData = useMemo(() => {
    let filtered = marketData;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.market_region?.toLowerCase().includes(q) ||
        m.market_city?.toLowerCase().includes(q)
      );
    }
    if (trendFilter !== 'all') {
      filtered = filtered.filter(m => m.market_trend === trendFilter);
    }
    if (levelFilter !== 'all') {
      filtered = filtered.filter(m => m.market_level === levelFilter);
    }
    return filtered;
  }, [marketData, search, trendFilter, levelFilter]);

  // Aggregate metrics
  const avgPrice = useMemo(() => {
    if (!marketData.length) return 0;
    return marketData.reduce((sum, m) => sum + (m.average_price || 0), 0) / marketData.length;
  }, [marketData]);

  const avgDaysOnMarket = useMemo(() => {
    if (!marketData.length) return 0;
    return (marketData.reduce((sum, m) => sum + (m.days_on_market_average || 0), 0) / marketData.length).toFixed(0);
  }, [marketData]);

  const totalActiveListings = useMemo(() => {
    return marketData.reduce((sum, m) => sum + (m.active_listings_count || 0), 0);
  }, [marketData]);

  const totalSoldListings = useMemo(() => {
    return marketData.reduce((sum, m) => sum + (m.sold_listings_count || 0), 0);
  }, [marketData]);

  const getTrendBadge = (trend) => {
    switch (trend) {
      case 'up':
        return (
          <Badge className="bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30 gap-1 text-[10px] font-bold uppercase tracking-wider">
            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
            Trending Up
          </Badge>
        );
      case 'down':
        return (
          <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 text-[10px] font-bold uppercase tracking-wider">
            <ArrowDownRight className="h-3 w-3 text-rose-600" />
            Trending Down
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30 gap-1 text-[10px] font-bold uppercase tracking-wider">
            <Activity className="h-3 w-3 text-slate-500" />
            Stable
          </Badge>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Market Intelligence & Index Feeds
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Regional absorption rates, average price-per-sqft indicators, and historical trend feeds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={view} setView={setView} />
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh Feeds
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Market Price</p>
            <p className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(avgPrice, 'USD')}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Across active regions
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
            <DollarSign className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Days on Market</p>
            <p className="text-2xl font-extrabold text-foreground tracking-tight">
              {avgDaysOnMarket} <span className="text-sm font-semibold text-muted-foreground">Days</span>
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">Turnaround speed</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Inventory</p>
            <p className="text-2xl font-extrabold text-foreground tracking-tight">
              {totalActiveListings.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">Currently listed</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Home className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Sales</p>
            <p className="text-2xl font-extrabold text-[#005A9C] dark:text-[#FF6B00] tracking-tight">
              {totalSoldListings.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600/80 font-medium">Closed volume</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <CheckCircle2 className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search region or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-muted/30 border-border/60 focus:bg-background"
          />
        </div>

        <Select value={trendFilter} onValueChange={setTrendFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs border-border/60 bg-muted/30">
            <SelectValue placeholder="Trend" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trends</SelectItem>
            <SelectItem value="up">Trending Up</SelectItem>
            <SelectItem value="down">Trending Down</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs border-border/60 bg-muted/30">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="national">National</SelectItem>
            <SelectItem value="state">State</SelectItem>
            <SelectItem value="county">County</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="neighborhood">Neighborhood</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Aggregating market indicators...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">No market data feeds found</p>
          <p className="text-xs text-muted-foreground mt-1">Adjust filters or search parameters to view region data.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map(m => (
            <div key={m.id} className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 transition-all shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    {m.market_region || 'Regional Market'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                    {m.market_level} Market Level {m.market_city && `• ${m.market_city}`}
                  </p>
                </div>
                {getTrendBadge(m.market_trend)}
              </div>

              {/* Price Stats */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 font-mono">
                <div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground block mb-0.5">Average Price</span>
                  <span className="text-sm font-bold text-[#005A9C] dark:text-[#FF6B00]">
                    {formatCurrency(m.average_price || 0, 'USD')}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground block mb-0.5">Median Price</span>
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(m.median_price || 0, 'USD')}
                  </span>
                </div>
              </div>

              {/* Specs & Velocity */}
              <div className="grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/20 text-center py-2">
                <div>
                  <span className="text-xs font-bold text-foreground block">{m.price_per_sqft ? `$${Math.round(m.price_per_sqft)}` : '—'}</span>
                  <span className="text-[9px] uppercase text-muted-foreground font-semibold">$/SqFt</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">{m.days_on_market_average ? Math.round(m.days_on_market_average) : '—'}</span>
                  <span className="text-[9px] uppercase text-muted-foreground font-semibold">Avg Days</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">{m.active_listings_count || 0}</span>
                  <span className="text-[9px] uppercase text-muted-foreground font-semibold">Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                <span>Source: <strong className="text-foreground font-semibold">{m.data_source || 'MLS Feed'}</strong></span>
                <span>Date: {m.data_date ? new Date(m.data_date).toLocaleDateString() : 'Recent'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left py-3 px-4">Region</th>
                  <th className="text-left py-3 px-4">Level</th>
                  <th className="text-right py-3 px-4">Avg Price</th>
                  <th className="text-right py-3 px-4">Median Price</th>
                  <th className="text-right py-3 px-4">Price / SqFt</th>
                  <th className="text-center py-3 px-4">Active</th>
                  <th className="text-center py-3 px-4">Sold</th>
                  <th className="text-center py-3 px-4">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredData.map(m => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{m.market_region}</td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">{m.market_level}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#005A9C] dark:text-[#FF6B00] font-mono">
                      {formatCurrency(m.average_price || 0, 'USD')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold font-mono text-foreground">
                      {formatCurrency(m.median_price || 0, 'USD')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">${m.price_per_sqft ? Math.round(m.price_per_sqft) : '—'}</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">{m.active_listings_count || 0}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{m.sold_listings_count || 0}</td>
                    <td className="py-3 px-4 text-center">{getTrendBadge(m.market_trend)}</td>
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
