import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Coffee, ShoppingCart, Plus, Minus, CreditCard, Pizza, Apple, Clock, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from 'framer-motion';

export default function CanteenPOS() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState({});

  const { data: menu = [] } = useQuery({
    queryKey: ['school_canteen_item', companyId],
    queryFn: async () => {
      const items = await base44.getEntities('school_canteen_item', companyId);
      return items.map(item => ({
        id: item.id,
        name: item.title,
        price: item.data?.price || 0,
        icon: Utensils // Fallback icon
      }));
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
      queryClient.invalidateQueries({ queryKey: ['school_canteen_order', companyId] });
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
    <div className="space-y-6 pb-20 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 font-dmsans bg-[#f4fdf8] min-h-screen p-4 md:p-8 text-slate-900">
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase flex items-center gap-3 tracking-[-0.02em] tracking-[0.04em]">
              <Coffee className="w-10 h-10 text-[#1E3A8A] dark:text-blue-400" /> Canteen POS
            </h1>
            <p className="text-[#1E3A8A] dark:text-blue-400 font-medium text-lg mt-1">Touch-optimized quick checkout</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {menu.map(item => (
            <motion.div whileTap={{ scale: 0.95 }} key={item.id} onClick={() => addToCart(item.id)} className="bg-white border-4 border-emerald-900 p-4 cursor-pointer hover:bg-[#F0F4FF] dark:bg-blue-900/20 transition-colors group select-none flex flex-col items-center text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-900 text-emerald-900 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="font-black text-lg mb-2 text-emerald-900 uppercase leading-tight line-clamp-2 tracking-[0.04em]">{item.name}</h3>
              <div className="mt-auto pt-2 w-full flex justify-between items-center">
                <span className="font-black text-[#1E3A8A] dark:text-blue-400 text-xl">${item.price.toFixed(2)}</span>
                <div className="w-8 h-8 bg-emerald-900 flex items-center justify-center text-white">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
          {menu.length === 0 && (
            <div className="col-span-full py-20 text-center border-4 border-dashed border-emerald-900 bg-[#F0F4FF] dark:bg-blue-900/20">
              <Utensils className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
              <p className="font-black text-2xl text-emerald-900 uppercase tracking-[-0.02em] tracking-[0.04em]">Menu Empty</p>
            </div>
          )}
        </div>

        {orderHistory.length > 0 && (
          <div className="bg-[#F0F4FF] dark:bg-blue-900/20 border-4 border-emerald-900 p-6">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-emerald-900 uppercase tracking-widest tracking-[0.04em]"><Clock className="w-6 h-6 text-[#1E3A8A] dark:text-blue-400" /> History</h3>
            <div className="space-y-4">
              {orderHistory.slice(0, 3).map(o => (
                <div key={o.id} className="flex justify-between items-center p-4 bg-white border-2 border-emerald-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                  <div className="font-black text-emerald-900">{o.title}</div>
                  <div className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 border-2 border-emerald-200 px-2 py-1">{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full lg:w-[400px] shrink-0">
        <div className="bg-emerald-900 border-4 border-emerald-900 p-6 sticky top-6 text-emerald-50 flex flex-col h-[calc(100vh-3rem)]">
          <div className="flex items-center gap-4 mb-8 border-b-2 border-emerald-700 pb-6">
            <div className="w-12 h-12 bg-emerald-500/10 flex items-center justify-center text-white">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white tracking-[-0.02em] tracking-[0.04em]">Current Ticket</h2>
          </div>

          <div className="space-y-4 mb-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <AnimatePresence>
              {Object.entries(cart).length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-[#1E3A8A] dark:text-blue-400 py-12">
                  <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-black text-xl uppercase tracking-widest tracking-[0.04em]">Ticket Empty</p>
                </motion.div>
              ) : (
                Object.entries(cart).map(([id, qty]) => {
                  const item = menu.find(m => m.id === id);
                  if (!item) return null;
                  return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key={id} className="flex flex-col bg-white text-emerald-900 border-2 border-emerald-900 p-3 relative group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-black text-lg leading-tight w-2/3 uppercase tracking-[0.04em]">{item.name}</div>
                        <div className="text-xl text-[#1E3A8A] dark:text-blue-400 font-black">${(item.price * qty).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center justify-between border-t-2 border-emerald-100 pt-3">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest tracking-[0.04em]">${item.price.toFixed(2)} EACH</span>
                        <div className="flex items-center bg-emerald-100 border-2 border-emerald-900">
                          <button onClick={() => removeFromCart(id)} className="w-10 h-10 flex items-center justify-center hover:bg-emerald-200 active:bg-emerald-300 transition-colors"><Minus className="w-5 h-5 text-emerald-900" /></button>
                          <span className="font-black text-lg w-10 text-center bg-white h-10 flex items-center justify-center border-x-2 border-emerald-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{qty}</span>
                          <button onClick={() => addToCart(id)} className="w-10 h-10 flex items-center justify-center hover:bg-emerald-200 active:bg-emerald-300 transition-colors"><Plus className="w-5 h-5 text-emerald-900" /></button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          <div className="border-t-4 border-emerald-700 pt-6 mt-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="text-emerald-300 font-black uppercase tracking-widest text-lg tracking-[0.04em]">Total Due</span>
              <span className="text-4xl font-black text-white tracking-[-0.02em]">${total.toFixed(2)}</span>
            </div>
            <Button 
              disabled={total === 0 || placeOrder.isPending}
              onClick={() => placeOrder.mutate(total)}
              className="w-full h-20 rounded-none bg-emerald-500/10 hover:bg-emerald-400 text-emerald-900 font-black text-2xl uppercase tracking-widest border-2 border-white transition-colors disabled:opacity-50 disabled:bg-emerald-800 disabled:text-[#1E3A8A] dark:text-blue-400 disabled:border-emerald-700 tracking-[-0.02em] tracking-[0.04em]"
            >
              <CreditCard className="w-8 h-8 mr-3" /> Pay Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
