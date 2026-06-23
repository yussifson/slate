import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, TrendingUp, Home, Calendar, DollarSign, AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePaywall } from '@/hooks/usePaywall';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateText } from '@/lib/cloudflareAI';
import { OrbitLoader } from '@/components/ui/orbit-loader';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RealEstateDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const { isProOrAbove } = usePaywall();

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [leases, setLeases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [propRes, clientRes, viewRes, txnRes, leaseRes] = await Promise.all([
          powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC', [companyId]),
        ]);

        if (active) {
          setProperties(propRes.rows._array || Array.from(propRes.rows));
          setClients(clientRes.rows._array || Array.from(clientRes.rows));
          setViewings(viewRes.rows._array || Array.from(viewRes.rows));
          setTransactions(txnRes.rows._array || Array.from(txnRes.rows));
          setLeases(leaseRes.rows._array || Array.from(leaseRes.rows));
        }
      } catch (e) {
        console.error('[RE Dashboard] Data fetch failed:', e);
      }
      setIsLoading(false);
    };

    if (companyId) fetchData();
    return () => { active = false; };
  }, [companyId]);

  // Calculate metrics
  const activeProperties = properties.filter(p => p.status === 'active').length;
  const activeBuyers = clients.filter(c => c.type === 'buyer' && c.status === 'active').length;
  const activeLeases = leases.filter(l => l.status === 'active').length;
  
  const thisMonthTransactions = transactions.filter(t => {
    const txnDate = new Date(t.closing_date);
    const now = new Date();
    return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
  });
  
  const monthlyRevenue = thisMonthTransactions.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0);
  
  const thisMonthViewings = viewings.filter(v => {
    const viewDate = new Date(v.viewing_date);
    const now = new Date();
    return viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear();
  }).length;

  const propertyStatus = {
    active: properties.filter(p => p.status === 'active').length,
    pending: properties.filter(p => p.status === 'pending').length,
    sold: properties.filter(p => p.status === 'sold').length,
  };

  const statusData = [
    { name: 'Active', value: propertyStatus.active },
    { name: 'Pending', value: propertyStatus.pending },
    { name: 'Sold', value: propertyStatus.sold },
  ];

  const handleAIInsight = async () => {
    if (!isProOrAbove) return;
    setIsGenerating(true);
    setAiInsight('');
    try {
      const prompt = `You are a Real Estate Market Analyst. Provide a brief daily market insight based on: 
        Active Properties: ${activeProperties}, Active Buyers: ${activeBuyers}, This Month's Sales: ${thisMonthTransactions.length}, 
        Active Leases: ${activeLeases}. Give 2-3 actionable recommendations.`;
      const response = await generateText(prompt);
      setAiInsight(typeof response === 'string' ? response : JSON.stringify(response));
    } catch (e) {
      console.error('[AI] Insight generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <OrbitLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Real Estate Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage properties, clients, and transactions</p>
        </div>
        <Button onClick={handleAIInsight} disabled={isGenerating || !isProOrAbove} variant="outline">
          {isGenerating ? 'Generating...' : '✨ AI Insight'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProperties}</div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBuyers}</div>
            <p className="text-xs text-muted-foreground">Active prospects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Viewings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthViewings}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(monthlyRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Monthly sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Home className="w-4 h-4" /> Leases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeases}</div>
            <p className="text-xs text-muted-foreground">Active rentals</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Market Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{aiInsight}</p>
          </CardContent>
        </Card>
      )}

      {/* Charts and Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Property Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={{ fontSize: 12 }} outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/real-estate/properties" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="w-4 h-4 mr-2" /> Manage Properties
                </Button>
              </Link>
              <Link to="/real-estate/clients" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" /> Manage Clients
                </Button>
              </Link>
              <Link to="/real-estate/viewings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" /> Schedule Viewings
                </Button>
              </Link>
              <Link to="/real-estate/leases" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Home className="w-4 h-4 mr-2" /> Manage Leases
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {thisMonthTransactions.slice(0, 5).map(txn => (
                <div key={txn.id} className="flex items-start justify-between p-2 bg-muted rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{txn.property_address}</p>
                    <p className="text-xs text-muted-foreground">{txn.buyer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">${Number(txn.sale_price).toLocaleString()}</p>
                    <Badge variant="secondary" className="text-xs">{txn.status}</Badge>
                  </div>
                </div>
              ))}
              {thisMonthTransactions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No sales this month</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Properties', href: '/real-estate/properties', count: activeProperties },
          { icon: Users, label: 'Clients', href: '/real-estate/clients', count: clients.length },
          { icon: Calendar, label: 'Viewings', href: '/real-estate/viewings', count: thisMonthViewings },
          { icon: DollarSign, label: 'Transactions', href: '/real-estate/transactions', count: thisMonthTransactions.length },
        ].map((item, idx) => (
          <Link key={idx} to={item.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <item.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-lg font-bold text-primary">{item.count}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
