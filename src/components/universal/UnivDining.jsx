import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, ChefHat, Plus, CheckCircle2, Clock, Check, MoreHorizontal, Utensils, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivDining() {
  const companyId = useCompanyId();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchOrders();
      const channel = supabase.channel('dining_orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_dining_orders', filter: `company_id=eq.${companyId}` }, () => {
          fetchOrders();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_dining_orders')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setOrders(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async () => {
    const newOrder = {
      company_id: companyId,
      order_number: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      table_number: 'T-01',
      order_type: 'Dine-In',
      status: 'Received',
      total_amount: Number(25.00) || 0,
      items: [{name: 'Burger', qty: 1}, {name: 'Fries', qty: 1}]
    };
    try {
      const { error } = await supabase.from('univ_dining_orders').insert(newOrder);
      if (error) throw error;
      toast.success('Order created');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = orders.filter(o => 
    `${o.order_number} ${o.table_number || ''} ${o.room_number || ''} ${o.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Dining Orders</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage restaurant dine-in, takeaway, and room service orders.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddOrder} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((o, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={o.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm flex flex-col h-full group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-primary" /> {o.order_number}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1 font-medium">
                      {o.order_type === 'Room Service' ? `Room ${o.room_number}` : `Table ${o.table_number}`} • {o.order_type}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
                    o.status === 'Received' ? 'bg-red-50 text-red-700 border-red-200' : 
                    o.status === 'Preparing' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                    o.status === 'Served' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {o.status === 'Received' && <Clock className="w-3 h-3" />}
                    {o.status === 'Preparing' && <ChefHat className="w-3 h-3" />}
                    {o.status === 'Served' && <Utensils className="w-3 h-3" />}
                    {o.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                    {o.status}
                  </span>
                </div>

                <div className="flex-1">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Items</h4>
                  <ul className="space-y-2 mb-4">
                    {Array.isArray(o.items) && o.items.map((item, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-foreground"><span className="text-primary font-bold">{item.qty}x</span> {item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-xl font-black text-foreground">${Number(o.total_amount).toFixed(2)}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-bold rounded hover:bg-primary hover:text-white transition-colors">Update</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No orders found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
