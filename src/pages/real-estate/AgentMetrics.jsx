import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Trophy, Award, TrendingDown, Eye, Heart, Share2, AlertCircle, RefreshCw, Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAnalytics } from '@/api/RealEstateAnalytics';
import { toast } from 'react-hot-toast';

export default function AgentMetrics() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    loadAgentData();
  }, [companyId, timeRange]);

  const loadAgentData = async () => {
    try {
      setLoading(true);
      // Mock comprehensive agent data
      const mockAgents = [
        {
          id: 1,
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          photo: '👩‍💼',
          listingsActive: 12,
          listingsClosed: 28,
          totalGrossSales: 8500000,
          totalCommission: 425000,
          avgDaysOnMarket: 31,
          clientSatisfaction: 4.8,
          conversionRate: 68,
          leads: 45,
          leadsConverted: 18,
          pricePerSqFt: 385,
          avgSalesPrice: 450000,
          topProperty: '456 Main St - $1,200,000',
          monthlyGrowth: 12,
          performanceRank: 1,
          tier: 'Diamond',
          commission: { jan: 35000, feb: 38000, mar: 42000, apr: 41000, may: 45000, jun: 47000 },
        },
        {
          id: 2,
          name: 'Mike Davis',
          email: 'mike@example.com',
          photo: '👨‍💼',
          listingsActive: 8,
          listingsClosed: 22,
          totalGrossSales: 6200000,
          totalCommission: 310000,
          avgDaysOnMarket: 38,
          clientSatisfaction: 4.6,
          conversionRate: 55,
          leads: 40,
          leadsConverted: 12,
          pricePerSqFt: 320,
          avgSalesPrice: 380000,
          topProperty: '789 Oak Ave - $950,000',
          monthlyGrowth: 8,
          performanceRank: 2,
          tier: 'Platinum',
          commission: { jan: 28000, feb: 31000, mar: 35000, apr: 32000, may: 38000, jun: 42000 },
        },
        {
          id: 3,
          name: 'Emily Wilson',
          email: 'emily@example.com',
          photo: '👩‍💼',
          listingsActive: 5,
          listingsClosed: 15,
          totalGrossSales: 4100000,
          totalCommission: 205000,
          avgDaysOnMarket: 45,
          clientSatisfaction: 4.5,
          conversionRate: 50,
          leads: 30,
          leadsConverted: 8,
          pricePerSqFt: 280,
          avgSalesPrice: 320000,
          topProperty: '321 Pine Rd - $750,000',
          monthlyGrowth: 5,
          performanceRank: 3,
          tier: 'Gold',
          commission: { jan: 18000, feb: 19000, mar: 21000, apr: 20000, may: 22000, jun: 23000 },
        },
      ];
      
      setAgents(mockAgents);
      setSelectedAgent(mockAgents[0]);
    } catch (error) {
      console.error('[v0] Agent metrics error:', error);
      toast.error('Failed to load agent metrics');
    } finally {
      setLoading(false);
    }
  };

  const commissionTrendData = useMemo(() => {
    if (!selectedAgent) return [];
    return Object.entries(selectedAgent.commission).map(([month, value]) => ({
      month: month.charAt(0).toUpperCase() + month.slice(1),
      commission: value,
    }));
  }, [selectedAgent]);

  const performanceData = useMemo(() => {
    return agents.map(agent => ({
      name: agent.name.split(' ')[0],
      sales: agent.listingsClosed,
      commission: agent.totalCommission / 1000,
      satisfaction: agent.clientSatisfaction * 20,
    }));
  }, [agents]);

  const teamStats = useMemo(() => {
    return {
      totalAgents: agents.length,
      totalListings: agents.reduce((sum, a) => sum + a.listingsClosed, 0),
      totalSales: agents.reduce((sum, a) => sum + a.totalGrossSales, 0),
      totalCommission: agents.reduce((sum, a) => sum + a.totalCommission, 0),
      avgConversion: Math.round(agents.reduce((sum, a) => sum + a.conversionRate, 0) / agents.length),
      avgSatisfaction: (agents.reduce((sum, a) => sum + a.clientSatisfaction, 0) / agents.length).toFixed(1),
    };
  }, [agents]);

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
              <div className="p-2 bg-purple-100 rounded-lg"><Trophy className="w-8 h-8 text-purple-600" /></div>
              Agent Performance Metrics
            </h1>
            <p className="text-slate-600 mt-2">Track sales, commissions, and performance KPIs</p>
          </div>
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white h-11">
            <Download className="w-5 h-5" />
            Export Report
          </Button>
        </div>

        {/* Team Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Agents</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{teamStats.totalAgents}</p>
                </div>
                <Users className="w-10 h-10 text-blue-100 p-2 bg-blue-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Closed</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{teamStats.totalListings}</p>
                </div>
                <Target className="w-10 h-10 text-green-100 p-2 bg-green-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Gross Sales</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">${(teamStats.totalSales / 1000000).toFixed(1)}M</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-100 p-2 bg-green-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700">Total Commission</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">${(teamStats.totalCommission / 1000).toFixed(0)}K</p>
                </div>
                <Award className="w-10 h-10 text-purple-200 p-2 bg-purple-200 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Avg Conversion</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{teamStats.avgConversion}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-amber-100 p-2 bg-amber-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{teamStats.avgSatisfaction}⭐</p>
                </div>
                <Heart className="w-10 h-10 text-red-100 p-2 bg-red-50 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="individual">Individual Performance</TabsTrigger>
            <TabsTrigger value="commission">Commission Tracking</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6">
            <div className="grid grid-cols-3 gap-6">
              <Card className="col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Agent Leaderboard</CardTitle>
                  <CardDescription>Ranked by total commission this month</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Rank</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Agent</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Closed</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Gross Sales</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Commission</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agents.map((agent, idx) => (
                          <tr key={agent.id} className="border-b hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                            <td className="px-6 py-3"><Badge className="bg-slate-200 text-slate-900">{agent.performanceRank}</Badge></td>
                            <td className="px-6 py-3"><div className="font-medium text-slate-900">{agent.photo} {agent.name}</div></td>
                            <td className="px-6 py-3"><div className="text-sm text-slate-600">{agent.listingsClosed}</div></td>
                            <td className="px-6 py-3"><div className="font-medium text-slate-900">${(agent.totalGrossSales / 1000000).toFixed(1)}M</div></td>
                            <td className="px-6 py-3"><div className="font-bold text-green-600">${(agent.totalCommission / 1000).toFixed(0)}K</div></td>
                            <td className="px-6 py-3"><Badge className="bg-purple-100 text-purple-900">{agent.tier}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Performance Breakdown</CardTitle>
                  <CardDescription>Sales vs Commission vs Satisfaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid stroke="#e2e8f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      <Legend />
                      <Bar dataKey="sales" fill="#3b82f6" />
                      <Bar dataKey="commission" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Individual Performance Tab */}
          <TabsContent value="individual" className="mt-6">
            {selectedAgent && (
              <div className="space-y-6">
                <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{selectedAgent.photo} {selectedAgent.name}</p>
                        <p className="text-slate-600 mt-1">{selectedAgent.email}</p>
                        <div className="flex gap-2 mt-3">
                          <Badge className="bg-purple-100 text-purple-900">{selectedAgent.tier}</Badge>
                          <Badge className="bg-blue-100 text-blue-900">Rank #{selectedAgent.performanceRank}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Growth This Month</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">+{selectedAgent.monthlyGrowth}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-4 gap-4">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-slate-600">Active Listings</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{selectedAgent.listingsActive}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-slate-600">Closed Listings</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{selectedAgent.listingsClosed}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-slate-600">Days on Market</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{selectedAgent.avgDaysOnMarket}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-slate-600">Satisfaction</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{selectedAgent.clientSatisfaction}⭐</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle>Conversion Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Lead Conversion Rate</span>
                            <span className="font-bold text-slate-900">{selectedAgent.conversionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${selectedAgent.conversionRate}%` }} />
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-xs text-slate-600">Total Leads: {selectedAgent.leads}</p>
                          <p className="text-xs text-slate-600">Converted: {selectedAgent.leadsConverted}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle>Pricing Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-600">Average Sale Price</p>
                          <p className="text-2xl font-bold text-slate-900">${(selectedAgent.avgSalesPrice / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Price per Sq Ft</p>
                          <p className="text-2xl font-bold text-slate-900">${selectedAgent.pricePerSqFt}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Commission Tracking Tab */}
          <TabsContent value="commission" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Commission Trend</CardTitle>
                    <CardDescription>Last 6 months commission tracking</CardDescription>
                  </div>
                  <Select value={selectedAgent?.id.toString() || '1'} onValueChange={(val) => setSelectedAgent(agents.find(a => a.id.toString() === val))}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{agents.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={commissionTrendData}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    <Legend />
                    <Area type="monotone" dataKey="commission" fill="#a78bfa" stroke="#7c3aed" fillOpacity={0.3} />
                    <Bar dataKey="commission" fill="#7c3aed" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Sales Quality Score</CardTitle>
                  <CardDescription>Average price achieved vs market</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={agents.map(a => ({ name: a.name.split(' ')[0], x: a.avgDaysOnMarket, y: a.pricePerSqFt }))}>
                      <CartesianGrid stroke="#e2e8f0" />
                      <XAxis dataKey="x" name="Days on Market" />
                      <YAxis dataKey="y" name="Price/SqFt" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#f8fafc' }} />
                      <Scatter name="Agents" data={agents.map(a => ({ x: a.avgDaysOnMarket, y: a.pricePerSqFt, name: a.name.split(' ')[0] }))} fill="#7c3aed" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Market Segment Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { segment: 'Luxury ($750K+)', agents: 2, avgPrice: 1050000, growth: 15 },
                      { segment: 'Upper-Mid ($450-750K)', agents: 5, avgPrice: 580000, growth: 12 },
                      { segment: 'Mid-Range ($300-450K)', agents: 8, avgPrice: 375000, growth: 8 },
                    ].map((seg, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">{seg.segment}</span>
                          <Badge className="bg-green-100 text-green-900">+{seg.growth}%</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{seg.agents} agents | Avg: ${(seg.avgPrice / 1000).toFixed(0)}K</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
