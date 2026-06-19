import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Tag, Plus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { motion } from 'framer-motion';

export default function CampusMarketplace() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const { data: items = [] } = useQuery({
    queryKey: ['school_marketplace_item', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_marketplace_item', companyId);
      return all;
    },
    enabled: !!companyId
  });

  const listItem = useMutation({
    mutationFn: () => {
      if (!newItemName.trim() || !newItemPrice.trim()) throw new Error("Name and Price required");
      return base44.createEntity({
        company_id: companyId,
        case_type: 'school_marketplace_item',
        client_id: session?.user?.id,
        title: newItemName,
        status: 'available',
        data: { price: parseFloat(newItemPrice) }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_marketplace_item', companyId] });
      setNewItemName('');
      setNewItemPrice('');
      toast.success("Item listed successfully!");
    },
    onError: (err) => toast.error(err.message)
  });

  // Mock initial items if none exist
  const displayItems = items.length > 0 ? items : [
    { id: 'm1', title: 'Calculus Textbook 9th Ed', data: { price: 45.00 }, status: 'available' },
    { id: 'm2', title: 'TI-84 Graphing Calculator', data: { price: 80.00 }, status: 'available' },
    { id: 'm3', title: 'Dorm Mini Fridge', data: { price: 65.00 }, status: 'available' },
    { id: 'm4', title: 'Biology Lab Coat (Size M)', data: { price: 15.00 }, status: 'available' }
  ];

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto font-dmsans bg-[#f4fdf8] min-h-screen p-4 md:p-8 text-slate-900">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase flex items-center gap-3 tracking-[-0.02em] tracking-[0.04em]">
            <ShoppingBag className="w-10 h-10 text-emerald-600" /> Campus Market
          </h1>
          <p className="text-emerald-700 font-medium text-lg mt-1">Buy & Sell verified student gear</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-emerald-900 border-4 border-emerald-900 p-8 sticky top-6 text-white">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight tracking-[-0.02em] tracking-[0.04em]"><Tag className="w-8 h-8 text-emerald-400" /> Sell Item</h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-emerald-300 uppercase tracking-widest mb-2 block tracking-[0.04em]">Item Name</label>
                <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Physics Book" className="h-14 font-semibold border-2 border-emerald-700 rounded-md-none bg-emerald-800 text-white placeholder:text-emerald-500 focus-visible:ring-0 focus-visible:border-white" />
              </div>
              <div>
                <label className="text-xs font-black text-emerald-300 uppercase tracking-widest mb-2 block tracking-[0.04em]">Price ($)</label>
                <Input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0.00" className="h-14 font-semibold border-2 border-emerald-700 rounded-md-none bg-emerald-800 text-white placeholder:text-emerald-500 focus-visible:ring-0 focus-visible:border-white" />
              </div>
              <Button onClick={() => listItem.mutate()} disabled={listItem.isPending} className="w-full h-16 rounded-md-none bg-emerald-400 hover:bg-emerald-300 text-emerald-900 border-2 border-emerald-400 font-black text-xl uppercase tracking-widest mt-6 transition-colors tracking-[0.04em]">
                <Plus className="w-6 h-6 mr-2" /> List Item
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayItems.map((item, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={item.id} className="bg-white border-4 border-emerald-900 hover:bg-emerald-50 transition-colors flex flex-col h-full group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <div className="h-48 bg-emerald-100 border-b-4 border-emerald-900 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#064e3b_2px,transparent_2px)] [background-size:16px_16px]"></div>
                  <ShoppingBag className="w-20 h-20 text-emerald-900 opacity-20 relative z-10 group-hover:scale-110 transition-transform" />
                  <div className="absolute top-4 right-4 bg-emerald-900 text-white text-xl font-black px-4 py-2 border-2 border-emerald-900 transition-all z-20">
                    ${item.data?.price?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 border-2 border-emerald-200 inline-block px-2 py-1 tracking-[0.04em]">{item.status}</p>
                    <h3 className="font-black text-2xl text-emerald-900 mb-6 line-clamp-2 uppercase leading-tight tracking-[-0.02em] tracking-[0.04em]">{item.title}</h3>
                  </div>
                  <Button variant="outline" className="w-full h-14 rounded-md-none border-2 border-emerald-900 font-black text-lg uppercase tracking-widest hover:bg-emerald-900 hover:text-white transition-colors tracking-[0.04em]">
                    <MessageCircle className="w-5 h-5 mr-3" /> Contact
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
