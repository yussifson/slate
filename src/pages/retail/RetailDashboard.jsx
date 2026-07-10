import React, { useState, useEffect } from 'react';
import { useTranslation} from "react-i18next";
import { DollarSign, Package, Users, TrendingUp, AlertCircle, Clock, ShoppingCart, Globe, Store, Barcode, Truck, BarChart2, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIndustryRecords} from '@/hooks/useIndustryData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import { Badge} from "@/components/ui/badge";
import { useAuth} from "@/lib/AuthContext";
import { usePaywall } from '@/hooks/usePaywall';
import { generateText } from '@/lib/cloudflareAI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function RetailDashboard() {
  const { t} = useTranslation();
  const { user} = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isProOrAbove } = usePaywall();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const orderRes = await powerSync.execute('SELECT * FROM univ_retail_orders WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setOrders(orderRes.rows._array || Array.from(orderRes.rows));

        const prodRes = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ?', [companyId]);
        if(active) setProducts(prodRes.rows._array || Array.from(prodRes.rows));

        const shiftRes = await powerSync.execute('SELECT * FROM univ_retail_shifts WHERE company_id = ?', [companyId]);
        if(active) setShifts(shiftRes.rows._array || Array.from(shiftRes.rows));
      } catch(e){}
      setIsLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);

 // Calculate Metrics
 
  const handleAIBriefing = async () => {
    if (!isProOrAbove) {
      // toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    setIsGenerating(true);
    setAiInsight('');
    try {
      const prompt = `You are a Retail Store Manager AI. Today's orders: ${orders.length}, Low stock items: ${lowStockProducts.length}. Write a 2-sentence morning briefing to the store team.`;
      const response = await generateText(prompt);
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);
      setAiInsight(responseText);
    } catch (e) {
      console.error('AI Briefing failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isLoading && orders.length >= 0) {
      // Optionally auto-generate or wait for button click. We'll wait for button click.
    }
  }, [isLoading]);

  const today = new Date().toISOString().split('T')[0];
  const todaysOrders = orders.filter(o => o.created_at && o.created_at.startsWith(today));
  const todayRevenue = todaysOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  
  const lowStockProducts = products.filter(p => {
    const stock = Number(p.stock) || 0;
    const reorderLevel = 10;
    return stock <= reorderLevel;
  });

  const activeShifts = shifts.filter(s => s.status === 'Active' || s.status === 'active');

 // Chart data (last 7 days revenue)
 const last7Days = Array.from({length: 7}, (_, i) => {
 const d = new Date();
 d.setDate(d.getDate() - (6 - i));
 return d.toISOString().split('T')[0];
});

 const chartData = last7Days.map(date => {
 const dayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(date));
 const revenue = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
 return {
 date: new Date(date).toLocaleDateString(undefined, { weekday: 'short'}),
 revenue
};
});

 if (isLoading) {
 return (
 <div className="flex-1 p-6 flex items-center justify-center">
 <OrbitLoader size="md" />
 </div>
 );
}

 return (
 <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-transparent">
 <div className="max-w-7xl mx-auto space-y-6">
 <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-6 text-white mb-6">
 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
 <div className="text-center md:text-left">
 <h1 className="text-2xl font-semibold tracking-tight tracking-[-0.02em]">Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Manager'}!</h1>
 <p className="text-white/80 text-sm mt-1">{t("retail_desc", "Live metrics from your retail operations.")}</p>
 </div>
 <div className="flex items-center bg-white dark:bg-card/40/15 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'})}
 </div>
 </div>
 </div>

 {/* Metrics Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card className=" border-primary/40">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("today_revenue", "Today's Revenue")}</CardTitle>
 <DollarSign className="w-4 h-4 text-primary" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">${todayRevenue.toFixed(2)}</div>
 <p className="text-xs text-primary flex items-center mt-1 tracking-[0.04em]">
 <TrendingUp className="w-3 h-3 mr-1" />
 {todaysOrders.length} transactions
 </p>
 </CardContent>
 </Card>
 
 <Card className=" border-primary/40">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("total_products", "Total Products")}</CardTitle>
 <Package className="w-4 h-4 text-orange-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{products.length}</div>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tracking-[0.04em]">
 Active in inventory
 </p>
 </CardContent>
 </Card>
 
 <Card className=" border-primary/40">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("low_stock", "Low Stock Alerts")}</CardTitle>
 <AlertCircle className="w-4 h-4 text-red-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{lowStockProducts.length}</div>
 <p className="text-xs text-red-600 mt-1 tracking-[0.04em]">
 Needs restocking
 </p>
 </CardContent>
 </Card>

 <Card className=" border-primary/40">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("active_shifts", "Active Shifts")}</CardTitle>
 <Users className="w-4 h-4 text-orange-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{activeShifts.length}</div>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tracking-[0.04em]">
 Staff on duty
 </p>
 </CardContent>
 </Card>
 </div>

 {/* Enterprise Retail Modules Navigation Grid */}
 <div className="space-y-4">
   <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Enterprise Modules</h2>
   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
     <Link to="/retail-hq" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Briefcase className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">Retail HQ</span>
     </Link>
     <Link to="/barcodes" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Barcode className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">Barcodes</span>
     </Link>
     <Link to="/wms-dashboard" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Truck className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">WMS</span>
     </Link>
     <Link to="/store-builder" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Globe className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">Store Builder</span>
     </Link>
     <Link to="/b2b-portal" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Store className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">B2B Portal</span>
     </Link>
     <Link to="/marketplaces" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ShoppingCart className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">Marketplaces</span>
     </Link>
     <Link to="/checkout" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><DollarSign className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">Unified Checkout</span>
     </Link>
     <Link to="/wms-picking" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Package className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">WMS Picking</span>
     </Link>
     <Link to="/demand-forecast" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform"><BarChart2 className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">AI Forecasting</span>
     </Link>
     <Link to="/rmas" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 text-center group">
       <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform"><AlertCircle className="w-5 h-5"/></div>
       <span className="text-sm font-semibold">Returns (RMA)</span>
     </Link>
   </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Revenue Chart */}
 <Card className="col-span-2 border-primary/40">
 <CardHeader>
 <CardTitle>{t("revenue_last_7_days", "Revenue (Last 7 Days)")}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0}}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b'}} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `$${val}`} />
 <Tooltip 
 contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
 formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
 />
 <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2}} activeDot={{ r: 6}} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </CardContent>
 </Card>

 <div className="space-y-6 school-page-enter font-dmsans">
 {/* Low Stock Widget */}
 <Card className=" border-primary/40">
 <CardHeader>
 <CardTitle className="text-base flex items-center">
 <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
 {t("low_stock_items", "Low Stock Items")}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {lowStockProducts.length === 0 ? (
 <p className="text-sm text-[#71717a] dark:text-gray-400 text-center py-4">No low stock items</p>
 ) : (
 lowStockProducts.slice(0, 5).map(p => (
 <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40">
 <div>
 <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 tracking-[0.04em]">SKU: {p.sku || 'N/A'}</p>
 </div>
 <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">
 {p.stock || 0} left
 </Badge>
 </div>
 ))
 )}
 </div>
 </CardContent>
 </Card>
 
 {/* Recent Orders Widget */}
 <Card className=" border-primary/40">
 <CardHeader>
 <CardTitle className="text-base flex items-center">
 <ShoppingCart className="w-4 h-4 text-orange-500 mr-2" />
 {t("recent_orders", "Recent Orders")}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {orders.length === 0 ? (
 <p className="text-sm text-[#71717a] dark:text-gray-400 text-center py-4">No recent orders</p>
 ) : (
 orders.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(o => (
 <div key={o.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40">
 <div>
 <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{o.order_id || 'ORD'}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 tracking-[0.04em]">
 {new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
 </p>
 </div>
 <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
 ${Number(o.total || 0).toFixed(2)}
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
