import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Sparkles, TrendingUp, Users, AlertCircle, CheckCircle2, Target, MapPin, DollarSign, Calendar, RefreshCw, ArrowUp, ArrowDown, Lightbulb } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAnalytics } from '@/api/RealEstateAnalytics';
import { toast } from 'react-hot-toast';

export default function Recommendations() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [timeFrame, setTimeFrame] = useState('30days');

  useEffect(() => {
    loadData();
  }, [companyId, timeFrame]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Mock comprehensive market intelligence and recommendations
      const mockRecommendations = [
        {
          id: 1,
          type: 'agent_match',
          title: 'Match Sarah Johnson with James Wilson',
          description: 'Sarah specializes in luxury properties and has 95% success rate with similar profiles',
          confidence: 92,
          impact: 'High',
          status: 'pending',
          property: '456 Main St - $1.2M',
          client: 'James Wilson',
          action: 'Review Match',
        },
        {
          id: 2,
          type: 'price_optimization',
          title: 'Price adjustment for 789 Oak Ave',
          description: 'Market data suggests price can be increased by 5% based on comparable sales',
          confidence: 85,
          impact: 'Medium',
          status: 'pending',
          originalPrice: 480000,
          suggestedPrice: 504000,
          savings: 24000,
          action: 'Apply',
        },
        {
          id: 3,
          type: 'market_opportunity',
          title: 'High demand - Downtown district',
          description: 'Average days on market decreased 40% this quarter. Recommend listing more properties here',
          confidence: 88,
          impact: 'High',
          status: 'pending',
          district: 'Downtown',
          avgDaysOnMarket: 18,
          avgPrice: 520000,
          action: 'Explore',
        },
        {
          id: 4,
          type: 'lead_prediction',
          title: 'High-value lead predicted for Mike Davis',
          description: 'Robert Chen shows 87% likelihood to purchase in next 60 days based on interaction patterns',
          confidence: 87,
          impact: 'High',
          status: 'approved',
          leadName: 'Robert Chen',
          agent: 'Mike Davis',
          estimatedDealValue: 650000,
          action: 'Prioritize',
        },
      ];

      const mockMarketData = [
        { metric: 'Q1', avgPrice: 380000, daysOnMarket: 42, volume: 45 },
        { metric: 'Q2', avgPrice: 395000, daysOnMarket: 38, volume: 52 },
        { metric: 'Q3', avgPrice: 410000, daysOnMarket: 35, volume: 58 },
        { metric: 'Q4', avgPrice: 425000, daysOnMarket: 32, volume: 65 },
      ];

      setRecommendations(mockRecommendations);
      setMarketData(mockMarketData);
      setSelectedProperty(mockRecommendations[0]);
    } catch (error) {
      console.error('[v0] Recommendations error:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalRecommendations: recommendations.length,
      implemented: recommendations.filter(r => r.status === 'approved').length,
      pendingReview: recommendations.filter(r => r.status === 'pending').length,
      avgConfidence: Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length),
    };
  }, [recommendations]);

  const marketTrendData = [
    { month: 'Jan', priceGrowth: 0, volumeGrowth: 0, domGrowth: 0 },
    { month: 'Feb', priceGrowth: 1.2, volumeGrowth: 2.1, domGrowth: -5 },
    { month: 'Mar', priceGrowth: 2.5, volumeGrowth: 5.3, domGrowth: -8 },
    { month: 'Apr', priceGrowth: 3.8, volumeGrowth: 8.9, domGrowth: -12 },
    { month: 'May', priceGrowth: 4.2, volumeGrowth: 12.1, domGrowth: -15 },
    { month: 'Jun', priceGrowth: 4.8, volumeGrowth: 15.6, domGrowth: -18 },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Sparkles className="w-8 h-8 text-blue-600" /></div>
              AI-Powered Recommendations
            </h1>
            <p className="text-slate-600 mt-2">Market intelligence and smart recommendations to maximize success</p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-11">
            <RefreshCw className="w-5 h-5" />
            Refresh Data
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Recommendations</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalRecommendations}</p>
                </div>
                <Lightbulb className="w-10 h-10 text-yellow-100 p-2 bg-yellow-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Implemented</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">{stats.implemented}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-200 p-2 bg-green-200 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Pending Review</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.pendingReview}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-amber-100 p-2 bg-amber-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Avg Confidence</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.avgConfidence}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-100 p-2 bg-blue-50 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recommendations" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="market">Market Intelligence</TabsTrigger>
            <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                {recommendations.map(rec => (
                  <Card key={rec.id} className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition ${selectedProperty?.id === rec.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelectedProperty(rec)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={rec.type === 'agent_match' ? 'bg-purple-100 text-purple-900' : rec.type === 'price_optimization' ? 'bg-green-100 text-green-900' : rec.type === 'market_opportunity' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'}>{rec.type.replace('_', ' ')}</Badge>
                            <Badge className={rec.status === 'approved' ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'}>{rec.status}</Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">{rec.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                        </div>
                        <Badge className={rec.impact === 'High' ? 'bg-red-100 text-red-900' : 'bg-yellow-100 text-yellow-900'}>{rec.impact} Impact</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">{rec.confidence}% confidence</span>
                        </div>
                        <Button variant="outline" size="sm">{rec.action}</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedProperty && (
                <Card className="border-0 shadow-sm h-fit sticky top-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-medium text-slate-600 mb-1">Type</p>
                      <p className="font-semibold text-slate-900">{selectedProperty.type.replace('_', ' ')}</p>
                    </div>
                    {selectedProperty.confidence && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-600 mb-1">Confidence Score</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${selectedProperty.confidence}%` }} />
                          </div>
                          <span className="font-bold text-slate-900">{selectedProperty.confidence}%</span>
                        </div>
                      </div>
                    )}
                    {selectedProperty.suggestedPrice && (
                      <>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs font-medium text-slate-600 mb-1">Original Price</p>
                          <p className="font-semibold text-slate-900">${(selectedProperty.originalPrice / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs font-medium text-green-700 mb-1">Suggested Price</p>
                          <p className="font-semibold text-green-900">${(selectedProperty.suggestedPrice / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-green-600 mt-1">Potential gain: ${(selectedProperty.savings / 1000).toFixed(0)}K</p>
                        </div>
                      </>
                    )}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Accept & Apply</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Market Intelligence Tab */}
          <TabsContent value="market" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Market Trends (YTD)</CardTitle>
                  <CardDescription>Price and volume growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={marketTrendData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      <Area type="monotone" dataKey="priceGrowth" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Market Segments</CardTitle>
                  <CardDescription>Performance by price range</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { segment: 'Luxury ($750K+)', demand: 'High', growth: '+18%', avgDOM: 22 },
                      { segment: 'Upper-Mid ($450-750K)', demand: 'Very High', growth: '+24%', avgDOM: 18 },
                      { segment: 'Mid-Range ($300-450K)', demand: 'High', growth: '+15%', avgDOM: 25 },
                      { segment: 'Entry-Level (<$300K)', demand: 'Medium', growth: '+8%', avgDOM: 32 },
                    ].map((seg, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">{seg.segment}</span>
                          <Badge className="bg-green-100 text-green-900">{seg.growth}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Demand: {seg.demand}</span>
                          <span>Avg DOM: {seg.avgDOM} days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Predictions Tab */}
          <TabsContent value="predictions" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Lead Purchase Predictions (Next 60 Days)</CardTitle>
                <CardDescription>ML-powered conversion likelihood</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Lead Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Assigned Agent</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Purchase Likelihood</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Est. Deal Value</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Key Factors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { lead: 'Robert Chen', agent: 'Mike Davis', likelihood: 87, value: 650000, factors: 'High engagement, ready to buy' },
                        { lead: 'Michelle Brown', agent: 'Sarah Johnson', likelihood: 82, value: 520000, factors: 'Pre-approved, active viewing' },
                        { lead: 'David Martinez', agent: 'Emily Wilson', likelihood: 76, value: 385000, factors: 'Serious inquiries, good credit' },
                        { lead: 'Lisa Anderson', agent: 'Sarah Johnson', likelihood: 71, value: 450000, factors: 'Price conscious, flexible timing' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50 transition">
                          <td className="px-6 py-3 font-medium text-slate-900">{row.lead}</td>
                          <td className="px-6 py-3 text-slate-600">{row.agent}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2 w-20">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${row.likelihood}%` }} />
                              </div>
                              <span className="text-sm font-bold text-slate-900">{row.likelihood}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 font-semibold text-slate-900">${(row.value / 1000).toFixed(0)}K</td>
                          <td className="px-6 py-3 text-sm text-slate-600">{row.factors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
