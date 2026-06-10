import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, UtensilsCrossed, Plus, MoreHorizontal, CheckCircle2, XCircle, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivMenu() {
  const companyId = useCompanyId();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchMenus();
      const channel = supabase.channel('menus_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_menus', filter: `company_id=eq.${companyId}` }, () => {
          fetchMenus();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_menus')
        .select('*')
        .eq('company_id', companyId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setMenus(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setMenus([
          { id: '1', item_name: 'Grilled Salmon', category: 'Main Course', price: 28.50, is_available: true, dietary_info: 'Gluten-Free' },
          { id: '2', item_name: 'Caesar Salad', category: 'Appetizer', price: 12.00, is_available: true, dietary_info: 'Contains Dairy' },
          { id: '3', item_name: 'Chocolate Lava Cake', category: 'Dessert', price: 9.00, is_available: false, dietary_info: 'Vegetarian' },
          { id: '4', item_name: 'Craft Lemonade', category: 'Beverage', price: 5.50, is_available: true, dietary_info: 'Vegan' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    const newItem = {
      company_id: companyId,
      item_name: 'New Menu Item',
      category: 'Main Course',
      price: 15.00,
      is_available: true
    };
    try {
      const { error } = await supabase.from('univ_menus').insert(newItem);
      if (error) throw error;
      toast.success('Menu item added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add item');
    }
  };

  const filtered = menus.filter(m => 
    `${m.item_name} ${m.category}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Restaurant Menu</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage food and beverage items, pricing, and availability.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={m.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm relative group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="bg-primary/10 text-primary p-2 rounded-xl">
                      <UtensilsCrossed className="w-5 h-5" />
                   </div>
                   <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                     <button className="text-muted-foreground hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                     <button className="text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mt-2">{m.item_name}</h3>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{m.category}</div>
                
                {m.dietary_info && (
                  <div className="text-xs text-muted-foreground bg-muted w-fit px-2 py-1 rounded mb-4">
                    {m.dietary_info}
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-xl font-black text-foreground">${Number(m.price).toFixed(2)}</span>
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
                    m.is_available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {m.is_available ? <><CheckCircle2 className="w-3 h-3"/> Available</> : <><XCircle className="w-3 h-3"/> Sold Out</>}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No menu items found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
