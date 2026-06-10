import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivInventory() {
  const companyId = useCompanyId();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newQuantity, setNewQuantity] = useState(0);
  const [newPrice, setNewPrice] = useState(0);

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
      // Mock data removed
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem = {
      company_id: companyId,
      item_name: newItemName,
      sku: newSku || `SKU-${Math.floor(Math.random() * 10000)}`,
      quantity: Number(newQuantity),
      unit_price: Number(newPrice),
      status: Number(newQuantity) > 0 ? 'In Stock' : 'Out of Stock'
    };
    try {
      const { error } = await supabase.from('univ_inventory').insert(newItem);
      if (error) throw error;
      toast.success('Item added to inventory');
      setIsAdding(false);
      setNewItemName('');
      setNewSku('');
      setNewQuantity(0);
      setNewPrice(0);
    } catch (err) {
      toast.error('Failed to add item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const { error } = await supabase.from('univ_inventory').delete().eq('id', id);
      if (error) throw error;
      toast.success('Item deleted');
    } catch (err) {
      toast.error('Failed to delete item');
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
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-card border border-primary/20 rounded-2xl shadow-sm mx-1">
          <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-[2]">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Item Name</label>
              <input 
                autoFocus
                type="text" 
                value={newItemName} 
                onChange={e => setNewItemName(e.target.value)} 
                placeholder="Product name..." 
                className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">SKU</label>
              <input 
                type="text" 
                value={newSku} 
                onChange={e => setNewSku(e.target.value)} 
                placeholder="SKU-123..." 
                className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Qty</label>
              <input 
                type="number" 
                value={newQuantity} 
                onChange={e => setNewQuantity(e.target.value)} 
                className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={newPrice} 
                onChange={e => setNewPrice(e.target.value)} 
                className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" 
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">Save</button>
              <button type="button" onClick={() => setIsAdding(false)} className="h-10 px-4 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 border border-border">Cancel</button>
            </div>
          </form>
        </div>
      )}

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
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
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
