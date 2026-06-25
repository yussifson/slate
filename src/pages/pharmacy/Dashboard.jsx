import { useState, useEffect } from 'react';
import { BarChart3, Pill, Users, TrendingUp, AlertCircle, DollarSign, Package, Clock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PharmacyAPI from '@/api/PharmacyAPI';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6F00FF', '#9400FF', '#cd99ff', '#e1ccff'];

export default function Dashboard() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [analytics, setAnalytics] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState({ total: 0, lowStock: 0, expiring: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get analytics
        const analyticsResult = await PharmacyAPI.getAnalytics(companyId);
        setAnalytics(analyticsResult);

        // Get inventory overview
        const inventoryResult = await powerSync.execute(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN quantity_available <= reorder_level THEN 1 END) as low_stock FROM univ_pharmacy_inventory WHERE company_id = ?',
          [companyId]
        );
        const invData = inventoryResult.rows._array?.[0] || {};
        setInventoryStatus({
          total: invData.total || 0,
          lowStock: invData.low_stock || 0,
          expiring: 0
        });

        // Get recent sales
        const salesResult = await powerSync.execute(
          'SELECT DATE(sale_date) as date, SUM(grand_total) as total FROM univ_pharmacy_sales WHERE company_id = ? GROUP BY DATE(sale_date) ORDER BY date DESC LIMIT 7',
          [companyId]
        );
        setSalesData((salesResult.rows._array || []).reverse());

        // Get top products
        const productsResult = await powerSync.execute(
          'SELECT d.drug_name, COUNT(si.id) as sales_count FROM univ_pharmacy_sale_items si JOIN univ_pharmacy_drugs d ON si.drug_id = d.id WHERE si.company_id = ? GROUP BY d.id ORDER BY sales_count DESC LIMIT 5',
          [companyId]
        );
        setTopProducts(productsResult.rows._array || []);

      } catch (e) {
        console.error('[Dashboard] Error:', e);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchDashboardData();
    }
  }, [companyId, powerSync]);

  const StatCard = ({ icon: Icon, title, value, trend, color }) => (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.email}. Here's your pharmacy performance overview.</p>
        </div>

        {/* Top Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            title="Total Sales (Today)"
            value={`$${(analytics?.total_sales || 0).toFixed(2)}`}
            trend={12}
            color="bg-gradient-to-br from-purple-600 to-purple-700"
          />
          <StatCard
            icon={TrendingUp}
            title="Transactions"
            value={analytics?.total_transactions || 0}
            trend={8}
            color="bg-gradient-to-br from-insurance-600 to-insurance-700"
          />
          <StatCard
            icon={Package}
            title="Inventory Items"
            value={inventoryStatus.total}
            color="bg-gradient-to-br from-blue-600 to-blue-700"
          />
          <StatCard
            icon={AlertCircle}
            title="Low Stock Items"
            value={inventoryStatus.lowStock}
            trend={-5}
            color="bg-gradient-to-br from-orange-600 to-orange-700"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Trend */}
          <Card className="lg:col-span-2 p-6 border border-border bg-card">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Sales Trend (Last 7 Days)</h2>
              <p className="text-sm text-muted-foreground mt-1">Daily revenue overview</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6F00FF"
                  strokeWidth={3}
                  dot={{ fill: '#6F00FF', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Products */}
          <Card className="p-6 border border-border bg-card">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Top Products</h2>
              <p className="text-sm text-muted-foreground mt-1">Most sold drugs</p>
            </div>
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-sm font-medium text-foreground truncate">{product.drug_name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{product.sales_count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 border border-border bg-card">
          <h2 className="text-xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium">
              <Pill className="w-4 h-4 mr-2" />
              Manage Drugs
            </Button>
            <Button variant="outline" className="h-12">
              <Package className="w-4 h-4 mr-2" />
              Check Inventory
            </Button>
            <Button variant="outline" className="h-12">
              <Users className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
            <Button variant="outline" className="h-12">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
