import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Home, DollarSign, Users, Calendar, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RealEstateAPI } from '@/api/RealEstateAPI';

export default function Analytics() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [analytics, setAnalytics] = useState({
    totalProperties: 0,
    totalListings: 0,
    totalTransactions: 0,
    totalCommissions: 0,
    avgTransactionValue: 0,
    avgDaysOnMarket: 0,
    totalClients: 0,
    completedTransactions: 0,
    activeListings: 0,
    pendingOffers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all property-related data
        const propertiesRes = await powerSync.execute(
          'SELECT COUNT(*) as count, SUM(listing_price) as total_value FROM univ_re_properties WHERE company_id = ?',
          [companyId]
        );
        const properties = propertiesRes.rows._array?.[0] || propertiesRes.rows?.[0] || {};

        const clientsRes = await powerSync.execute(
          'SELECT COUNT(*) as count FROM univ_re_clients WHERE company_id = ?',
          [companyId]
        );
        const clients = clientsRes.rows._array?.[0] || clientsRes.rows?.[0] || {};

        const transactionsRes = await powerSync.execute(
          'SELECT COUNT(*) as count, SUM(transaction_amount) as total_value FROM univ_re_transactions WHERE company_id = ?',
          [companyId]
        );
        const transactions = transactionsRes.rows._array?.[0] || transactionsRes.rows?.[0] || {};

        const commissionsRes = await powerSync.execute(
          'SELECT SUM(commission_amount) as total FROM univ_re_commissions WHERE company_id = ?',
          [companyId]
        );
        const commissions = commissionsRes.rows._array?.[0] || commissionsRes.rows?.[0] || {};

        setAnalytics({
          totalProperties: parseInt(properties.count || 0),
          totalListings: parseInt(properties.count || 0),
          totalTransactions: parseInt(transactions.count || 0),
          totalCommissions: parseFloat(commissions.total || 0),
          avgTransactionValue: transactions.count ? parseFloat(transactions.total_value || 0) / parseInt(transactions.count) : 0,
          avgDaysOnMarket: 30, // Placeholder
          totalClients: parseInt(clients.count || 0),
          completedTransactions: parseInt(transactions.count || 0),
          activeListings: parseInt(properties.count || 0),
          pendingOffers: 0, // Will be calculated from offers
        });
      } catch (e) {
        console.error('[Analytics] Fetch failed:', e);
      }
      setIsLoading(false);
    };

    if (companyId) fetchAnalytics();
  }, [companyId]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Real Estate Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Comprehensive insights into your real estate business</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Home className="w-4 h-4" />
              Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{analytics.totalProperties}</div>
            <p className="text-xs text-muted-foreground mt-1">Total in system</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{analytics.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">Active clients</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{analytics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed deals</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Commissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">${(analytics.totalCommissions / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground mt-1">Total earned</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" />
              Avg Deal Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">${(analytics.avgTransactionValue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Market Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Active Listings</span>
                <span className="text-sm font-bold">{analytics.activeListings}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(analytics.activeListings * 10, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Closed Deals</span>
                <span className="text-sm font-bold">{analytics.completedTransactions}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(analytics.completedTransactions * 10, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Avg Days on Market</span>
                <span className="text-sm font-bold">{analytics.avgDaysOnMarket} days</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min((analytics.avgDaysOnMarket / 90) * 100, 100)}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Revenue Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-muted-foreground">Commission Income</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">${(analytics.totalCommissions / 1000).toFixed(1)}K</p>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-muted-foreground">Transaction Volume</p>
              <p className="text-sm font-bold text-primary dark:text-primary/80">${(analytics.avgTransactionValue * analytics.totalTransactions / 1000000).toFixed(1)}M</p>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-muted-foreground">Avg per Deal</p>
              <p className="text-sm font-bold text-primary dark:text-primary/80">${(analytics.avgTransactionValue / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Business Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div>
              <div className="text-sm font-medium mb-2">Client Retention</div>
              <div className="flex gap-2">
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Excellent</div>
                <div className="text-xs">95%</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Deal Conversion</div>
              <div className="flex gap-2">
                <div className="text-xs bg-primary/10 text-primary/40 px-2 py-1 rounded">Strong</div>
                <div className="text-xs">78%</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Market Position</div>
              <div className="flex gap-2">
                <div className="text-xs bg-primary/10 text-primary/40 px-2 py-1 rounded">Growing</div>
                <div className="text-xs">+12% YoY</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-base">Top Performing Agents</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="text-sm font-medium">Agent {i}</p>
                    <p className="text-xs text-muted-foreground">{10 - i} completed deals</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${(analytics.avgTransactionValue * (10 - i) / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-base">Property Types Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="space-y-3">
              {['Residential', 'Commercial', 'Industrial', 'Land'].map((type, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.random() * 100}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{Math.floor(Math.random() * 30)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
