import React from 'react';
import { useTranslation } from "react-i18next";
import { DollarSign, Package, Users, TrendingUp, AlertCircle, Clock, ShoppingCart } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RetailDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: orders = [], isLoading: isOrdersLoading } = useIndustryRecords('order');
  const { data: products = [], isLoading: isProductsLoading } = useIndustryRecords('product');
  const { data: shifts = [], isLoading: isShiftsLoading } = useIndustryRecords('shift');

  const isLoading = isOrdersLoading || isProductsLoading || isShiftsLoading;

  // Calculate Metrics
  const today = new Date().toISOString().split('T')[0];
  const todaysOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(today));
  const todayRevenue = todaysOrders.reduce((sum, o) => sum + (Number(o.data?.total) || 0), 0);
  
  const lowStockProducts = products.filter(p => {
    const stock = Number(p.data?.quantity) || 0;
    const reorderLevel = Number(p.data?.reorderLevel) || 10;
    return stock <= reorderLevel;
  });

  const activeShifts = shifts.filter(s => s.status === 'active' || s.data?.status === 'active');

  // Chart data (last 7 days revenue)
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const dayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(date));
    const revenue = dayOrders.reduce((sum, o) => sum + (Number(o.data?.total) || 0), 0);
    return {
      date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      revenue
    };
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-sm border border-white/10 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Manager'}!</h1>
              <p className="text-orange-100 font-medium text-lg">{t("retail_desc", "Live metrics from your retail operations.")}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              <span className="text-xs font-bold uppercase tracking-wider text-white px-3">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("today_revenue", "Today's Revenue")}</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${todayRevenue.toFixed(2)}</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {todaysOrders.length} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_products", "Total Products")}</CardTitle>
              <Package className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{products.length}</div>
              <p className="text-xs text-slate-500 mt-1">
                Active in inventory
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("low_stock", "Low Stock Alerts")}</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{lowStockProducts.length}</div>
              <p className="text-xs text-red-600 mt-1">
                Needs restocking
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("active_shifts", "Active Shifts")}</CardTitle>
              <Users className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{activeShifts.length}</div>
              <p className="text-xs text-slate-500 mt-1">
                Staff on duty
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="col-span-2 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>{t("revenue_last_7_days", "Revenue (Last 7 Days)")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Low Stock Widget */}
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  {t("low_stock_items", "Low Stock Items")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No low stock items</p>
                  ) : (
                    lowStockProducts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.data?.name}</p>
                          <p className="text-xs text-slate-500">SKU: {p.data?.sku || 'N/A'}</p>
                        </div>
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">
                          {p.data?.quantity || 0} left
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Orders Widget */}
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <ShoppingCart className="w-4 h-4 text-orange-500 mr-2" />
                  {t("recent_orders", "Recent Orders")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
                  ) : (
                    orders.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{o.data?.orderNumber || 'ORD'}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          ${Number(o.data?.total || 0).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
