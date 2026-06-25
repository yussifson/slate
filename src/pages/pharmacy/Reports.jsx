import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Calendar } from 'lucide-react';

const COLORS = ['#6F00FF', '#9400FF', '#cd99ff', '#e1ccff'];

export default function Reports() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [dateRange, setDateRange] = useState('30days');
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [companyId, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const getDaysBack = () => {
        switch(dateRange) {
          case '7days': return 7;
          case '30days': return 30;
          case '90days': return 90;
          default: return 30;
        }
      };

      const daysBack = getDaysBack();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const salesResult = await powerSync.execute(
        'SELECT DATE(sale_date) as date, SUM(grand_total) as total FROM univ_pharmacy_sales WHERE company_id = ? AND sale_date >= ? GROUP BY DATE(sale_date)',
        [companyId, startDate.toISOString()]
      );

      setSalesData((salesResult.rows._array || []).map(r => ({
        date: r.date,
        total: parseFloat(r.total || 0)
      })));

      const productsResult = await powerSync.execute(
        'SELECT d.drug_name, COUNT(si.id) as sales_count, SUM(si.line_total) as revenue FROM univ_pharmacy_sale_items si JOIN univ_pharmacy_drugs d ON si.drug_id = d.id WHERE si.company_id = ? GROUP BY d.id ORDER BY revenue DESC LIMIT 10',
        [companyId]
      );

      setTopProducts(productsResult.rows._array || []);
    } catch (e) {
      console.error('[Reports] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2">Business intelligence and performance metrics</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Card className="p-6 mb-8 border border-border bg-card">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">Loading reports...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 border border-border bg-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Sales Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} />
                    <Line type="monotone" dataKey="total" stroke="#6F00FF" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 border border-border bg-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Top Products</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="drug_name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} />
                    <Bar dataKey="sales_count" fill="#6F00FF" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-6 border border-border bg-card">
              <h2 className="text-xl font-bold text-foreground mb-4">Top 10 Products by Revenue</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-medium text-foreground">Drug Name</th>
                      <th className="text-left p-3 font-medium text-foreground">Sales</th>
                      <th className="text-left p-3 font-medium text-foreground">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="p-3 font-medium text-foreground">{p.drug_name}</td>
                        <td className="p-3">{p.sales_count}</td>
                        <td className="p-3 font-bold text-primary">${parseFloat(p.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
