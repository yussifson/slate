import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, BarChart3, Plus, MapPin, DollarSign, Calendar, Home } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

export default function MarketIntelligence() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [trends, setTrends] = useState([]);
  const [comparables, setComparables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompForm, setShowCompForm] = useState(false);
  const [compFormData, setCompFormData] = useState({
    subjectAddress: '',
    subjectPrice: 0,
    comp1Address: '',
    comp1Price: 0,
    comp1Adjustment: 0,
    comp2Address: '',
    comp2Price: 0,
    comp2Adjustment: 0,
    comp3Address: '',
    comp3Price: 0,
    comp3Adjustment: 0,
    confidenceLevel: 80,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trendsData = await RealEstateAPI.getMarketTrends(companyId);
        const compsData = await RealEstateAPI.getComparableAnalysis(companyId);
        setTrends(trendsData);
        setComparables(compsData);
      } catch (e) {
        console.error('[MarketIntelligence] Fetch failed:', e);
        toast.error('Failed to load market data');
      }
      setIsLoading(false);
    };

    if (companyId) fetchData();
  }, [companyId]);

  const handleCompSubmit = async (e) => {
    e.preventDefault();
    try {
      const estimatedValue = (
        (compFormData.comp1Price + compFormData.comp1Adjustment +
         compFormData.comp2Price + compFormData.comp2Adjustment +
         compFormData.comp3Price + compFormData.comp3Adjustment) / 3
      );

      await RealEstateAPI.createComparableAnalysis(companyId, {
        ...compFormData,
        estimatedValue,
        confidenceLevel: parseInt(compFormData.confidenceLevel),
      }, user.id);

      toast.success('Comparable analysis created');
      setShowCompForm(false);
      setCompFormData({
        subjectAddress: '', subjectPrice: 0, comp1Address: '', comp1Price: 0, comp1Adjustment: 0,
        comp2Address: '', comp2Price: 0, comp2Adjustment: 0, comp3Address: '', comp3Price: 0,
        comp3Adjustment: 0, confidenceLevel: 80,
      });

      const data = await RealEstateAPI.getComparableAnalysis(companyId);
      setComparables(data);
    } catch (e) {
      console.error('[MarketIntelligence] Submit failed:', e);
      toast.error('Failed to save analysis');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const avgPrices = trends.length > 0 ? {
    current: trends[0]?.avg_price || 0,
    median: trends[0]?.median_price || 0,
    trend: trends[0]?.price_change_percent || 0,
  } : { current: 0, median: 0, trend: 0 };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Market Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">Market trends and comparable analysis</p>
        </div>
        <Button onClick={() => setShowCompForm(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4" /> New Analysis
        </Button>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 border-t-2 border-t-green-600">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-700 text-xs font-semibold uppercase mb-1">Avg Price</p>
                <p className="text-3xl font-bold">${(avgPrices.current / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-2 border-t-orange-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-600 text-xs font-semibold uppercase mb-1">Median Price</p>
                <p className="text-3xl font-bold">${(avgPrices.median / 1000).toFixed(0)}K</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-xs font-semibold uppercase mb-1">Price Trend</p>
                <p className="text-3xl font-bold">{avgPrices.trend > 0 ? '+' : ''}{avgPrices.trend.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparable Analysis */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Comparable Analysis</h2>
        {comparables.length === 0 ? (
          <Card className="text-center py-12">
            <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No comparable analysis yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparables.map((comp) => (
              <Card key={comp.id} className="hover:shadow transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {comp.subject_address}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Subject Price</p>
                      <p className="text-lg font-bold">${Number(comp.subject_price).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Value</p>
                      <p className="text-lg font-bold text-green-600">${Number(comp.estimated_value).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-2 text-xs">
                    <p><span className="font-semibold">Confidence:</span> {comp.confidence_level}%</p>
                    <p><span className="font-semibold">Analysis Date:</span> {new Date(comp.analysis_date).toLocaleDateString()}</p>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-semibold mb-2">Comparables</p>
                    <div className="space-y-1 text-xs">
                      <p>{comp.comparable_1_address}: ${Number(comp.comparable_1_price).toLocaleString()}</p>
                      <p>{comp.comparable_2_address}: ${Number(comp.comparable_2_price).toLocaleString()}</p>
                      <p>{comp.comparable_3_address}: ${Number(comp.comparable_3_price).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Market Trends */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Market Trends (Last 12 Months)</h2>
        {trends.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-muted-foreground">No trend data available</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.slice(0, 6).map((trend) => (
              <Card key={trend.id} className="hover:shadow transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{trend.city}, {trend.state}</p>
                      <p className="text-xs text-muted-foreground">{new Date(trend.metric_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Price:</span>
                      <span className="font-semibold">${Number(trend.avg_price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Median Price:</span>
                      <span className="font-semibold">${Number(trend.median_price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days on Market:</span>
                      <span className="font-semibold">{trend.avg_days_on_market}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Market:</span>
                      <span className="font-semibold text-orange-600">{trend.market_condition}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Comparable Form */}
      <Sheet open={showCompForm} onOpenChange={setShowCompForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Comparable Analysis</SheetTitle>
            <SheetDescription>Compare subject property with recent sales</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleCompSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Subject Property Address</label>
              <Input value={compFormData.subjectAddress} onChange={(e) => setCompFormData({ ...compFormData, subjectAddress: e.target.value })} required />
            </div>

            <div>
              <label className="text-sm font-medium">Subject Property Price</label>
              <Input type="number" step="0.01" value={compFormData.subjectPrice} onChange={(e) => setCompFormData({ ...compFormData, subjectPrice: parseFloat(e.target.value) })} />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Comparable 1</h3>
              <Input placeholder="Address" value={compFormData.comp1Address} onChange={(e) => setCompFormData({ ...compFormData, comp1Address: e.target.value })} className="mb-2" />
              <Input type="number" step="0.01" placeholder="Price" value={compFormData.comp1Price} onChange={(e) => setCompFormData({ ...compFormData, comp1Price: parseFloat(e.target.value) })} className="mb-2" />
              <Input type="number" step="0.01" placeholder="Adjustment" value={compFormData.comp1Adjustment} onChange={(e) => setCompFormData({ ...compFormData, comp1Adjustment: parseFloat(e.target.value) })} />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Comparable 2</h3>
              <Input placeholder="Address" value={compFormData.comp2Address} onChange={(e) => setCompFormData({ ...compFormData, comp2Address: e.target.value })} className="mb-2" />
              <Input type="number" step="0.01" placeholder="Price" value={compFormData.comp2Price} onChange={(e) => setCompFormData({ ...compFormData, comp2Price: parseFloat(e.target.value) })} className="mb-2" />
              <Input type="number" step="0.01" placeholder="Adjustment" value={compFormData.comp2Adjustment} onChange={(e) => setCompFormData({ ...compFormData, comp2Adjustment: parseFloat(e.target.value) })} />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Comparable 3</h3>
              <Input placeholder="Address" value={compFormData.comp3Address} onChange={(e) => setCompFormData({ ...compFormData, comp3Address: e.target.value })} className="mb-2" />
              <Input type="number" step="0.01" placeholder="Price" value={compFormData.comp3Price} onChange={(e) => setCompFormData({ ...compFormData, comp3Price: parseFloat(e.target.value) })} className="mb-2" />
              <Input type="number" step="0.01" placeholder="Adjustment" value={compFormData.comp3Adjustment} onChange={(e) => setCompFormData({ ...compFormData, comp3Adjustment: parseFloat(e.target.value) })} />
            </div>

            <div>
              <label className="text-sm font-medium">Confidence Level (%)</label>
              <Input type="number" min="0" max="100" value={compFormData.confidenceLevel} onChange={(e) => setCompFormData({ ...compFormData, confidenceLevel: e.target.value })} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                Create Analysis
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCompForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
