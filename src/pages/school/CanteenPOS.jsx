import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Coffee, ShoppingCart, Plus, Minus, CreditCard, Pizza, Apple, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

export default function CanteenPOS() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState({});

  const { data: menu = [
    { id: '1', name: 'Margherita Pizza', price: 4.50, icon: Pizza, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
    { id: '2', name: 'Fresh Apple', price: 1.00, icon: Apple, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
    { id: '3', name: 'Iced Coffee', price: 3.50, icon: Coffee, color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30' }
  ] } = useQuery({
    queryKey: ['school_canteen_menu', companyId],
    queryFn: async () => {
      // In a real scenario we'd fetch this. We use a mock default if empty.
      return [
        { id: '1', name: 'Margherita Pizza', price: 4.50, icon: Pizza, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
        { id: '2', name: 'Fresh Apple', price: 1.00, icon: Apple, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
        { id: '3', name: 'Iced Coffee', price: 3.50, icon: Coffee, color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30' }
      ];
    },
    enabled: !!companyId
  });

  const { data: orderHistory = [] } = useQuery({
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
        data: { items: cart, total }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['school_canteen_order', companyId]);
      setCart({});
      toast.success("Payment successful! Order placed.");
    }
  });

  const addToCart = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(prev => {
    const newCart = { ...prev };
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
        <div className="flex items-center gap-4 bg-white/60 dark:bg-card/60 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-sm shadow-orange-500/30">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Canteen POS</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Order food directly from your device</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {menu.map(item => (
            <div key={item.id} onClick={() => addToCart(item.id)} className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-sm transition-all group select-none">
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg mb-1">{item.name}</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="font-extrabold text-orange-600 dark:text-orange-400">${item.price.toFixed(2)}</span>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {orderHistory.length > 0 && (
          <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-sm">
            <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2"><Clock className="text-slate-400" /> Recent Orders</h3>
            <div className="space-y-3">
              {orderHistory.slice(0, 3).map(o => (
                <div key={o.id} className="flex justify-between items-center p-3 bg-white/50 dark:bg-background/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full lg:w-96 shrink-0">
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-sm sticky top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <h2 className="text-2xl font-extrabold">Your Order</h2>
          </div>

          <div className="space-y-4 mb-8 min-h-[150px]">
            {Object.entries(cart).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                <p className="font-medium text-sm">Cart is empty</p>
              </div>
            ) : (
              Object.entries(cart).map(([id, qty]) => {
                const item = menu.find(m => m.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-2xl">
                    <div>
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-xs text-orange-600 font-bold">${(item.price * qty).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-card rounded-full p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <button onClick={() => removeFromCart(id)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold text-sm w-4 text-center">{qty}</span>
                      <button onClick={() => addToCart(id)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-bold">Total</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">${total.toFixed(2)}</span>
            </div>
            <Button 
              disabled={total === 0 || placeOrder.isPending}
              onClick={() => placeOrder.mutate(total)}
              className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-extrabold text-lg shadow-sm shadow-slate-900/20 dark:shadow-white/20 transition-all"
            >
              <CreditCard className="w-5 h-5 mr-2" /> Pay Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
