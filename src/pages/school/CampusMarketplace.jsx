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
      queryClient.invalidateQueries(['school_marketplace_item', companyId]);
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
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Campus Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Buy, sell, and trade safely with verified students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-sm sticky top-6">
            <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2"><Tag className="w-5 h-5 text-emerald-500" /> Sell an Item</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Physics Textbook" className="mt-1 bg-white/50 dark:bg-background/50 border-slate-200 dark:border-slate-800 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Price ($)</label>
                <Input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0.00" className="mt-1 bg-white/50 dark:bg-background/50 border-slate-200 dark:border-slate-800 rounded-xl" />
              </div>
              <Button onClick={() => listItem.mutate()} disabled={listItem.isPending} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/20 mt-4">
                <Plus className="w-4 h-4 mr-2" /> List Item
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayItems.map(item => (
              <div key={item.id} className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden shadow-sm hover:shadow-sm hover:-translate-y-1 transition-all group flex flex-col">
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative">
                  <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                    ${item.data?.price?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4">{item.status}</p>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl border-slate-200 dark:border-slate-800 font-bold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-800">
                    <MessageCircle className="w-4 h-4 mr-2" /> Contact Seller
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
