import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, ShoppingCart, DollarSign, Clock, CheckCircle2, XCircle, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivProcurement() {
  const companyId = useCompanyId();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchOrders();
      const channel = supabase.channel('procurement_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_procurement', filter: `company_id=eq.${companyId}` }, () => {
          fetchOrders();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_procurement')
        .select('*')
        .eq('company_id', companyId)
        .order('order_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setOrders(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async () => {
    const newPO = {
      company_id: companyId,
      po_number: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      supplier: 'New Supplier',
      total_amount: Math.floor(Math.random() * 5000),
      status: 'Pending',
      order_date: new Date().toISOString().split('T')[0]
    };
    try {
      const { error } = await supabase.from('univ_procurement').insert(newPO);
      if (error) throw error;
      toast.success('Purchase Order Created');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to create PO');
    }
  };

  const filtered = orders.filter(o => 
    `${o.po_number} ${o.supplier} ${o.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Procurement</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage purchase orders and suppliers.</p>
        </div>
        <button onClick={handleCreatePO} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search PO number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">PO Number</th>
                <th className="p-4 font-semibold">Supplier</th>
                <th className="p-4 font-semibold">Total Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Order Date</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={o.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-mono font-semibold text-foreground">
                    {o.po_number}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {o.supplier}
                  </td>
                  <td className="p-4 font-bold text-foreground">
                    ${Number(o.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center w-fit gap-1 ${
                      o.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      o.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      o.status === 'Canceled' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {o.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {o.status === 'Received' && <CheckCircle2 className="w-3 h-3" />}
                      {o.status === 'Canceled' && <XCircle className="w-3 h-3" />}
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {o.order_date}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
