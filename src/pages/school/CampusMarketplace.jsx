import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Tag, Plus, MessageCircle, DollarSign, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { motion } from 'framer-motion';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function CampusMarketplace() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const { data: items = [], isLoading } = useQuery({
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

  const displayItems = items.length > 0 ? items : [
    { id: 'm1', title: 'Calculus Textbook 9th Ed', data: { price: 45.00 }, status: 'available' },
    { id: 'm2', title: 'TI-84 Graphing Calculator', data: { price: 80.00 }, status: 'available' },
    { id: 'm3', title: 'Dorm Mini Fridge', data: { price: 65.00 }, status: 'available' },
    { id: 'm4', title: 'Biology Lab Coat (Size M)', data: { price: 15.00 }, status: 'available' }
  ];

  return (
    <SchoolPageShell
      title="Campus Market"
      subtitle="Buy & sell verified student gear and textbooks"
      breadcrumb={['School', 'Marketplace']}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sell Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm sticky top-6">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
              <Tag className="w-4 h-4 text-indigo-600" /> List an Item
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item Name *</label>
                <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Physics Textbook" className="mt-1.5 h-10 text-sm border-border/50 bg-background" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price ($) *</label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0.00" className="pl-9 h-10 text-sm border-border/50 bg-background" />
                </div>
              </div>
              <Button onClick={() => listItem.mutate()} disabled={listItem.isPending} className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm text-sm font-semibold mt-2">
                <Plus className="w-4 h-4 mr-1.5" /> List Item
              </Button>
            </div>
          </div>
        </div>

        {/* Catalog */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Loading marketplace...</div>
          ) : displayItems.length === 0 ? (
            <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No items listed on the campus market yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayItems.map((item, i) => (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={item.id} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col group">
                  <div className="h-40 bg-muted/30 flex items-center justify-center relative overflow-hidden">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground/30 group-hover:scale-105 transition-transform" />
                    <div className="absolute top-3 right-3 bg-card border border-border/50 text-indigo-600 font-bold px-3 py-1 rounded-lg text-sm shadow-sm">
                      ${item.data?.price?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">
                        {item.status || 'available'}
                      </span>
                      <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug">{item.title}</h3>
                    </div>
                    <Button variant="outline" className="w-full h-9 border-border/50 hover:bg-muted text-sm font-semibold mt-5 rounded-lg flex items-center justify-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-indigo-600" /> Contact Seller
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SchoolPageShell>
  );
}
