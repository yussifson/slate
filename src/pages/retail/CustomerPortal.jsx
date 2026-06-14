import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { ShoppingBag, Star, TrendingUp, Search, Package, MapPin, Tag} from 'lucide-react';
import { useIndustryRecords} from '@/hooks/useIndustryData';
import { Button} from "@/components/ui/button";
import { Badge} from "@/components/ui/badge";
import { useAuth} from '@/lib/AuthContext';
import { Link} from 'react-router-dom';

export default function CustomerPortal() {
 const { t} = useTranslation();
 const { user} = useAuth();

 // Real Database Hooks
 const { data: dbSales = [], isLoading: isSalesLoading} = useIndustryRecords('retail_sale');
 const { data: dbCustomers = [], isLoading: isCustLoading} = useIndustryRecords('customer');

 // Find customer profile linked to the logged-in user
 // In a real app, this maps by user.email or user.id
 const customerProfile = dbCustomers.find(c => c.data?.email === user?.email || c.data?.name === user?.name) 
 || { data: { totalSpent: 0, orders: 0, segment: 'New'}};

 const loyaltyPoints = Math.floor((parseFloat(customerProfile.data?.totalSpent) || 0) * 10);

 // Filter sales/orders for this customer (mocked here, should filter properly on backend)
 const myOrders = dbSales.map(r => ({ id: r.id, status: r.status, ...r.data}));

 const isLoading = isSalesLoading || isCustLoading;

 if (isLoading) {
 return <div className="py-12 text-center text-muted-foreground">{t("loading_your_retail_profile", "Loading your retail profile...")}</div>;
}

 return (
 <div className="space-y-6 max-w-5xl mx-auto">
 {/* Header Profile */}
 <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
 <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold mb-1">{t("welcome_back", "Welcome back,")} {user?.name || 'Shopper'}</h1>
 <p className="text-primary/10 max-w-xl text-sm">{t(
 "view_your_purchase_history_tra",
 "View your purchase history, track active orders, and check your loyalty rewards."
 )}</p>
 </div>
 <div className="bg-white dark:bg-slate-900/40/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center min-w-[150px]">
 <p className="text-xs uppercase font-bold tracking-wider text-primary/10 mb-1">{t("loyalty_points", "Loyalty Points")}</p>
 <p className="text-3xl font-black flex items-center justify-center gap-2">
 <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" /> {loyaltyPoints}
 </p>
 <p className="text-[10px] text-primary/20 mt-1">{t("10_pts_1_spent", "10 pts / $1 spent")}</p>
 </div>
 </div>
 <div className="absolute left-[-20px] top-[-20px] opacity-10 pointer-events-none">
 <ShoppingBag className="w-64 h-64" />
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="col-span-1 md:col-span-2 space-y-6">
 <div className="bg-card rounded-xl border border-primary/40 overflow-hidden">
 <div className="p-4 md:p-5 border-b border-primary/40 bg-muted/50 flex justify-between items-center">
 <h3 className="font-bold text-card-foreground flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /> {t("recent_purchases", "Recent Purchases")}</h3>
 <Button variant="ghost" size="sm" className="text-xs text-primary">{t("view_all", "View All")}</Button>
 </div>
 <div className="p-0">
 {myOrders.length === 0 ? (
 <div className="py-12 text-center text-muted-foreground">
 <Package className="w-10 h-10 mx-auto mb-3 opacity-30 text-primary" />
 <p className="font-semibold text-card-foreground">{t("no_purchase_history_found", "No purchase history found.")}</p>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {myOrders.map(order => {
 return (
 <div key={order.id} className="p-5 hover:bg-muted/30 transition-colors">
 <div className="flex justify-between items-start mb-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h4 className="font-bold text-base text-foreground">{t("order", "Order")} {order.saleId || `SAL-${order.id.slice(0,4)}`}</h4>
 <Badge variant="outline" className={`${order.status === 'Completed' ? 'bg-slate-100 text-primary/90 border-primary/20' : 'bg-muted text-muted-foreground'}`}>{order.status || 'Completed'}</Badge>
 </div>
 <p className="text-xs text-muted-foreground">{order.timestamp ? new Date(order.timestamp).toLocaleString() : 'Recent'}</p>
 </div>
 <div className="text-right">
 <p className="font-black text-lg text-foreground">${(parseFloat(order.total) || 0).toFixed(2)}</p>
 <p className="text-[10px] text-muted-foreground">{order.items?.length || 0} {t("items", "items")}</p>
 </div>
 </div>
 <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm mt-3 border border-primary/40">
 {order.items?.map((item, idx) => {
 return (
 <div key={idx} className="flex justify-between text-xs">
 <span className="font-medium">{item.qty}x {item.name}</span>
 <span className="text-muted-foreground">${(item.price * item.qty).toFixed(2)}</span>
 </div>
 );
})}
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-card rounded-xl border border-primary/40 p-5">
 <h3 className="font-bold text-card-foreground flex items-center gap-2 mb-4"><Tag className="w-5 h-5 text-amber-500" /> {t("available_offers", "Available Offers")}</h3>
 <div className="space-y-3">
 <div className="border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 relative overflow-hidden">
 <div className="absolute right-[-10px] top-[-10px] w-8 h-8 bg-amber-200 rounded-full opacity-50"></div>
 <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">{t("loyalty_reward", "Loyalty Reward")}</p>
 <p className="font-black text-lg text-amber-900 dark:text-amber-100">{t("15_off", "15% OFF")}</p>
 <p className="text-[10px] text-amber-700/80 mt-1">{t("unlock_for_1_000_points", "Unlock for 1,000 points")}</p>
 <Button size="sm" className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white h-7 text-xs" disabled={loyaltyPoints < 1000}>{t("redeem", "Redeem")}</Button>
 </div>
 <div className="border border-primary/40 bg-card rounded-lg p-3">
 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("seasonal_sale", "Seasonal Sale")}</p>
 <p className="font-black text-foreground">{t("free_shipping", "Free Shipping")}</p>
 <p className="text-[10px] text-muted-foreground mt-1">{t("on_orders_over_50", "On orders over $50")}</p>
 </div>
 </div>
 </div>

 <div className="bg-card rounded-xl border border-primary/40 p-5 text-center">
 <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
 <h4 className="font-bold text-sm">{t("find_a_store", "Find a Store")}</h4>
 <p className="text-xs text-muted-foreground mt-1 mb-3">{t(
 "looking_for_something_specific",
 "Looking for something specific? Check local availability."
 )}</p>
 <Button variant="outline" className="w-full text-primary/90 border-primary/20 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-primary/60">{t("store_locator", "Store Locator")}</Button>
 </div>
 </div>
 </div>
 </div>
 );
}
