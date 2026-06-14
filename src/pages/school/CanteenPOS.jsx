import React, { useState} from 'react';
import { useTranslation} from 'react-i18next';
import { Coffee, ShoppingCart, Plus, Minus, CreditCard, Pizza, Apple, Clock} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { useAuth} from "@/lib/AuthContext";
import { toast} from "react-hot-toast";

export default function CanteenPOS() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { session} = useAuth();
 const queryClient = useQueryClient();
 const [cart, setCart] = useState({});

 const { data: menu = []} = useQuery({
 queryKey: ['school_canteen_item', companyId],
 queryFn: async () => {
 const items = await base44.getEntities('school_canteen_item', companyId);
 return items.map(item => ({
 id: item.id,
 name: item.title,
 price: item.data?.price || 0,
 icon: Pizza // Fallback icon since icons aren't stored in DB easily
}));
},
 enabled: !!companyId
});

 const { data: orderHistory = []} = useQuery({
 queryKey: ['school_canteen_order', companyId],
 queryFn: async () => {
 const all = await base44.getEntities('school_canteen_order', companyId);
 return all.filter(o => o.client_id === session?.user?.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
},
 enabled: !!companyId && !!session?.user?.id
});

 const placeOrder = useMutation({
 mutationFn: (total) => {
 return base44.createEntity({
 company_id: companyId,
 case_type: 'school_canteen_order',
 client_id: session?.user?.id,
 title: `Canteen Order - $${total.toFixed(2)}`,
 status: 'completed',
 data: { items: cart, total}
});
},
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['school_canteen_order', companyId]});
 setCart({});
 toast.success("Payment successful! Order placed.");
}
});

 const addToCart = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1}));
 const removeFromCart = (id) => setCart(prev => {
 const newCart = { ...prev};
 if (newCart[id] > 1) newCart[id]--; else delete newCart[id];
 return newCart;
});

 const total = Object.entries(cart).reduce((sum, [id, qty]) => {
 const item = menu.find(m => m.id === id);
 return sum + (item ? item.price * qty : 0);
}, 0);

 return (
 <div className="space-y-6 pb-20 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
 <div className="flex-1 space-y-6">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl school-heading font-extrabold tracking-tight">Canteen POS</h1>
 <p className="text-sm text-muted-foreground mt-0.5">Order food directly from your device</p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
 {menu.map(item => (
 <div key={item.id} onClick={() => addToCart(item.id)} className="bg-card rounded-xl border border-primary/40 p-6 cursor-pointer hover:border-primary/30 transition-colors group select-none">
 <div className={`w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 text-primary dark:text-primary/30 flex items-center justify-center mb-4`}>
 <item.icon className="w-6 h-6" />
 </div>
 <h3 className="font-bold text-lg mb-1">{item.name}</h3>
 <div className="flex justify-between items-center mt-4">
 <span className="font-bold text-primary dark:text-primary/70">${item.price.toFixed(2)}</span>
 <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
 <Plus className="w-4 h-4" />
 </div>
 </div>
 </div>
 ))}
 </div>

 {orderHistory.length > 0 && (
 <div className="bg-card rounded-xl border border-primary/40 p-6 ">
 <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> Recent Orders</h3>
 <div className="space-y-3">
 {orderHistory.slice(0, 3).map(o => (
 <div key={o.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-primary/40">
 <div className="font-medium text-sm">{o.title}</div>
 <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 <div className="w-full lg:w-96 shrink-0">
 <div className="bg-card rounded-xl border border-primary/40 p-6 sticky top-6">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
 <ShoppingCart className="w-5 h-5 text-muted-foreground" />
 </div>
 <h2 className="text-xl font-bold">Your Order</h2>
 </div>

 <div className="space-y-4 mb-8 min-h-[150px]">
 {Object.entries(cart).length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
 <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
 <p className="font-medium text-sm">Cart is empty</p>
 </div>
 ) : (
 Object.entries(cart).map(([id, qty]) => {
 const item = menu.find(m => m.id === id);
 if (!item) return null;
 return (
 <div key={id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
 <div>
 <div className="font-bold text-sm">{item.name}</div>
 <div className="text-xs text-primary dark:text-primary/70 font-bold">${(item.price * qty).toFixed(2)}</div>
 </div>
 <div className="flex items-center gap-3 bg-background rounded-full p-1 border border-primary/40 ">
 <button onClick={() => removeFromCart(id)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted"><Minus className="w-3 h-3" /></button>
 <span className="font-bold text-sm w-4 text-center">{qty}</span>
 <button onClick={() => addToCart(id)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted"><Plus className="w-3 h-3" /></button>
 </div>
 </div>
 );
})
 )}
 </div>

 <div className="border-t border-primary/40 pt-6">
 <div className="flex justify-between items-center mb-6">
 <span className="text-muted-foreground font-bold">Total</span>
 <span className="text-2xl font-bold text-foreground">${total.toFixed(2)}</span>
 </div>
 <Button 
 disabled={total === 0 || placeOrder.isPending}
 onClick={() => placeOrder.mutate(total)}
 className="w-full h-12 rounded-xl bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold font-bold"
 >
 <CreditCard className="w-5 h-5 mr-2" /> Pay Now
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}
