import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Search, Filter, MapPin, DollarSign, Home, Calendar, BarChart3, Activity } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

export default function MarketData() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [marketData, setMarketData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  // Fetch market data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_market_data WHERE company_id = ? ORDER BY data_date DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setMarketData(data);
      } catch (e) {
        console.error('[MarketData] Fetch failed:', e);
        toast.error('Failed to load market data');
      }
      setIsLoading(false);
    };

    if (companyId) fetchData();
  }, [companyId]);

  // Filter data
  useEffect(() => {
    let filtered = marketData;
    if (search) {
      filtered = filtered.filter(m =>
        m.market_region?.toLowerCase().includes(search.toLowerCase()) ||
        m.market_city?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (trendFilter !== 'all') {
      filtered = filtered.filter(m => m.market_trend === trendFilter);
    }
    if (levelFilter !== 'all') {
      filtered = filtered.filter(m => m.market_level === levelFilter);
    }
    setFilteredData(filtered);
  }, [marketData, search, trendFilter, levelFilter]);

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'down': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch(trend) {
      case 'up': return 'bg-green-100 text-green-800';
      case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate aggregate metrics
  const avgPrice = marketData.length > 0 
    ? (marketData.reduce((sum, m) => sum + (m.average_price || 0), 0) / marketData.length).toFixed(0)
    : 0;
  const avgDaysOnMarket = marketData.length > 0
    ? (marketData.reduce((sum, m) => sum + (m.days_on_market_average || 0), 0) / marketData.length).toFixed(1)
    : 0;
  const totalActiveListing = marketData.reduce((sum, m) => sum + (m.active_listings_count || 0), 0);
  const totalSoldListings = marketData.reduce((sum, m) => sum + (m.sold_listings_count || 0), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Market Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">View market trends and data for your regions</p>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Avg Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(avgPrice / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground mt-1">Across all markets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Days on Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDaysOnMarket}</div>
            <p className="text-xs text-muted-foreground mt-1">Average days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Home className="w-4 h-4" />
              Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveListing}</div>
            <p className="text-xs text-muted-foreground mt-1">For sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Sold Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSoldListings}</div>
            <p className="text-xs text-muted-foreground mt-1">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by region, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={trendFilter} onValueChange={setTrendFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trends</SelectItem>
            <SelectItem value="up">Trending Up</SelectItem>
            <SelectItem value="down">Trending Down</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
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

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.length === 0 ? (
          <Card className="text-center col-span-full py-12">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No market data found matching your criteria</p>
          </Card>
        ) : (
          filteredData.map(market => (
            <Card key={market.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {market.market_region}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{market.market_level} Market</p>
                  </div>
                  <Badge className={getTrendColor(market.market_trend)}>
                    <span className="flex items-center gap-1">
                      {getTrendIcon(market.market_trend)}
                      {market.market_trend}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Average Price</p>
                    <p className="font-bold text-blue-600">${(market.average_price / 1000000).toFixed(2)}M</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Median Price</p>
                    <p className="font-bold text-purple-600">${(market.median_price / 1000000).toFixed(2)}M</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Price/SqFt</p>
                    <p className="font-bold text-green-600">${market.price_per_sqft?.toFixed(0)}</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Days on Market</p>
                    <p className="font-bold text-orange-600">{market.days_on_market_average?.toFixed(0)} days</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 border rounded">
                    <p className="text-muted-foreground text-xs">Sold</p>
                    <p className="font-bold">{market.sold_listings_count}</p>
                  </div>
                  <div className="text-center p-2 border rounded">
                    <p className="text-muted-foreground text-xs">Active</p>
                    <p className="font-bold">{market.active_listings_count}</p>
                  </div>
                  <div className="text-center p-2 border rounded">
                    <p className="text-muted-foreground text-xs">Pending</p>
                    <p className="font-bold">{market.pending_listings_count || 0}</p>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium">Data Date:</span> {new Date(market.data_date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Source:</span> {market.data_source || 'Internal'}</p>
                  {market.market_city && (
                    <p><span className="font-medium">City:</span> {market.market_city}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Table View for Detailed Analysis */}
      {filteredData.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Detailed Market Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Region</th>
                    <th className="text-right py-3 px-4 font-medium">Avg Price</th>
                    <th className="text-right py-3 px-4 font-medium">Median Price</th>
                    <th className="text-right py-3 px-4 font-medium">Price/SqFt</th>
                    <th className="text-center py-3 px-4 font-medium">Active</th>
                    <th className="text-center py-3 px-4 font-medium">Sold</th>
                    <th className="text-center py-3 px-4 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(market => (
                    <tr key={market.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{market.market_region}</td>
                      <td className="py-3 px-4 text-right">${(market.average_price / 1000000).toFixed(2)}M</td>
                      <td className="py-3 px-4 text-right">${(market.median_price / 1000000).toFixed(2)}M</td>
                      <td className="py-3 px-4 text-right">${market.price_per_sqft?.toFixed(0)}</td>
                      <td className="py-3 px-4 text-center font-bold">{market.active_listings_count}</td>
                      <td className="py-3 px-4 text-center font-bold">{market.sold_listings_count}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getTrendColor(market.market_trend)}>
                          {market.market_trend}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
