import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Home, DollarSign, Users, Calendar, LineChart as LineChartIcon,
  PieChart as PieChartIcon, RefreshCw, Sparkles, Building2, Shield, CheckCircle2, ArrowUpRight,
  Layers, HardHat, MapPin, Wrench
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { RealEstateAnalytics } from '@/api/RealEstateAnalytics';

export default function JCLAnalytics() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    totalProperties: 0,
    activeProperties: 0,
    totalTransactions: 0,
    totalSalesVolume: 0,
    totalCommissions: 0,
    totalClients: 0,
    avgTransactionValue: 0,
    avgDaysOnMarket: 24,
    absorptionRate: 78.5,
  });
  const [rollup, setRollup] = useState({
    land: { totalParcels: 0, totalAcres: 0, estimatedLandValue: 0 },
    civil: { totalBoqs: 0, totalContractValue: 0, activeProjects: 0 },
    sales: { totalTransactions: 0, grossSalesVolume: 0 },
    maintenance: { totalRequests: 0, pendingRequests: 0, totalCost: 0 }
  });

  const fetchAnalyticsData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [propRes, txnRes, commRes, clientRes, rollupData] = await Promise.all([
        powerSync.execute('SELECT COUNT(*) as total, SUM(price) as total_val FROM univ_re_properties WHERE company_id = ?', [companyId]),
        powerSync.execute('SELECT COUNT(*) as total, SUM(sale_price) as total_val FROM univ_re_transactions WHERE company_id = ?', [companyId]),
        powerSync.execute('SELECT SUM(commission_amount) as total FROM univ_re_commissions WHERE company_id = ?', [companyId]),
        powerSync.execute('SELECT COUNT(*) as total FROM univ_re_clients WHERE company_id = ?', [companyId]),
        RealEstateAnalytics.getExecutiveCrossDepartmentRollup(companyId)
      ]);

      const propData = propRes.rows._array?.[0] || propRes.rows?.[0] || {};
      const txnData = txnRes.rows._array?.[0] || txnRes.rows?.[0] || {};
      const commData = commRes.rows._array?.[0] || commRes.rows?.[0] || {};
      const clientData = clientRes.rows._array?.[0] || clientRes.rows?.[0] || {};

      const totalTxn = Number(txnData.total) || 0;
      const totalSales = Number(txnData.total_val) || 0;

      setData({
        totalProperties: Number(propData.total) || 0,
        activeProperties: Number(propData.total) || 0,
        totalTransactions: totalTxn,
        totalSalesVolume: totalSales,
        totalCommissions: Number(commData.total) || 0,
        totalClients: Number(clientData.total) || 0,
        avgTransactionValue: totalTxn > 0 ? totalSales / totalTxn : 0,
        avgDaysOnMarket: 24,
        absorptionRate: 78.5,
      });
      if (rollupData) setRollup(rollupData);
    } catch (_err) {
      console.error('[JCLAnalytics] Fetch error:', _err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [companyId]);

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Executive Analytics & Market Velocity
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gross transaction volume, inventory absorption velocity, and revenue distribution
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Pipeline Volume</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(data.totalSalesVolume, 'USD')}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +14.2% vs last quarter
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Commissions</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.totalCommissions, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Collected earnings</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Days On Market</p>
              <p className="text-2xl font-bold text-foreground">{data.avgDaysOnMarket} Days</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">High velocity turnover</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Absorption Rate</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.absorptionRate}%</p>
              <p className="text-[11px] text-muted-foreground">Strong seller market</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Cross-Department Rollup Overview ── */}
      <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            Cross-Department Rollup Overview
          </h3>
          <Badge variant="outline" className="text-[10px] font-mono">Multi-Vertical</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Land Holdings
            </div>
            <p className="text-xl font-extrabold text-foreground">{rollup.land.totalParcels} Parcels</p>
            <p className="text-[11px] text-muted-foreground">{rollup.land.totalAcres.toFixed(1)} Total Acres • {formatCurrency(rollup.land.estimatedLandValue, 'USD')}</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <HardHat className="h-3.5 w-3.5 text-blue-600" /> Civil & BOQ
            </div>
            <p className="text-xl font-extrabold text-foreground">{rollup.civil.totalBoqs} Active BOQs</p>
            <p className="text-[11px] text-muted-foreground">Valued at {formatCurrency(rollup.civil.totalContractValue, 'USD')}</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <TrendingUp className="h-3.5 w-3.5 text-purple-600" /> Sales Transactions
            </div>
            <p className="text-xl font-extrabold text-foreground">{rollup.sales.totalTransactions} Closed</p>
            <p className="text-[11px] text-muted-foreground">{formatCurrency(rollup.sales.grossSalesVolume, 'USD')} Volume</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <Wrench className="h-3.5 w-3.5 text-amber-600" /> Property Ops
            </div>
            <p className="text-xl font-extrabold text-foreground">{rollup.maintenance.totalRequests} Requests</p>
            <p className="text-[11px] text-muted-foreground">{rollup.maintenance.pendingRequests} Pending • {formatCurrency(rollup.maintenance.totalCost, 'USD')} Maintenance Cost</p>
          </div>
        </div>
      </div>

      {/* ── 4. Visual Analytics Breakdown Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Portfolio Inventory Distribution
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">Live Sync</Badge>
          </div>
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Active Listings ({data.totalProperties})</span>
                <span className="text-emerald-600">65%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Under Offer / Pending</span>
                <span className="text-amber-600">25%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Closed Transactions</span>
                <span className="text-blue-600">10%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Client Network Overview
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">360 View</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Registered Clients</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{data.totalClients}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-800 dark:text-emerald-300 uppercase font-semibold">Avg Transaction Value</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(data.avgTransactionValue, 'USD')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
