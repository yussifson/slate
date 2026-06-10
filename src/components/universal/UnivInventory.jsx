import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivInventory() {
  const companyId = useCompanyId();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchInventory();
      const channel = supabase.channel('inv_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_inventory', filter: `company_id=eq.${companyId}` }, () => {
          fetchInventory();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_inventory')
        .select('*')
        .eq('company_id', companyId)
        .order('item_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setInventory(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    const newItem = {
      company_id: companyId,
      item_name: 'New Item',
      sku: `SKU-${Math.floor(Math.random() * 10000)}`,
      quantity: 0,
      unit_price: 0,
      status: 'Out of Stock'
    };
    try {
      const { error } = await supabase.from('univ_inventory').insert(newItem);
      if (error) throw error;
      toast.success('Item added to inventory');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add item');
    }
  };

  const filtered = inventory.filter(i => 
    `${i.item_name} ${i.sku} ${i.category}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = inventory.filter(i => i.quantity <= i.reorder_level).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search items, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Items</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{inventory.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Package className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm ring-1 ring-orange-500/20">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{lowStockCount}</h3>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Inventory Value</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              ${inventory.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Item Name & SKU</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(item => {
            const isLow = item.quantity <= item.reorder_level;
            return (
              <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-border shrink-0">
                    <Package className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{item.item_name}</span>
                    <span className="text-xs text-muted-foreground">{item.sku}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.category || '—'}</span>
                </div>
                <div className="col-span-2 text-right flex flex-col items-end">
                  <span className={`text-sm font-bold ${isLow ? 'text-orange-600' : 'text-foreground'}`}>{item.quantity}</span>
                  {isLow && <span className="text-[10px] text-orange-600 font-medium">Reorder: {item.reorder_level}</span>}
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-foreground">
                  ${Number(item.unit_price).toFixed(2)}
                </div>
                <div className="col-span-2 text-right flex justify-end items-center gap-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                    item.quantity === 0 ? 'bg-red-50 text-red-700 border-red-200' : 
                    isLow ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {item.quantity === 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                  </span>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
             <div className="p-8 text-center text-muted-foreground">No inventory items found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
