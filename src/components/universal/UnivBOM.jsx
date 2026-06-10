import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Layers, Plus, Calculator, Settings, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivBOM() {
  const companyId = useCompanyId();
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchBOMs();
      const channel = supabase.channel('boms_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_boms', filter: `company_id=eq.${companyId}` }, () => {
          fetchBOMs();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchBOMs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_boms')
        .select('*')
        .eq('company_id', companyId)
        .order('product_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setBoms(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddBOM = async () => {
    const newBOM = {
      company_id: companyId,
      product_name: 'New Product',
      material_name: 'Raw Material A',
      quantity_required: 10,
      unit: 'kg',
      cost_per_unit: 5.00,
      total_cost: 50.00,
      status: 'Active'
    };
    try {
      const { error } = await supabase.from('univ_boms').insert(newBOM);
      if (error) throw error;
      toast.success('BOM added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add BOM');
    }
  };

  const filtered = boms.filter(b => 
    `${b.product_name} ${b.material_name} ${b.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Bill of Materials (BOM)</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage components, raw materials, and assembly costs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddBOM} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Component
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search assemblies or materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Assembly / Product</th>
                <th className="p-4 font-semibold">Material Name</th>
                <th className="p-4 font-semibold text-right">Qty</th>
                <th className="p-4 font-semibold">Unit</th>
                <th className="p-4 font-semibold text-right">Unit Cost</th>
                <th className="p-4 font-semibold text-right">Total Component Cost</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={b.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> {b.product_name}
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {b.material_name}
                  </td>
                  <td className="p-4 font-mono font-semibold text-right">
                    {Number(b.quantity_required).toLocaleString()}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs uppercase tracking-wider">
                    {b.unit}
                  </td>
                  <td className="p-4 font-mono text-muted-foreground text-right">
                    ${Number(b.cost_per_unit).toFixed(2)}
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-600 text-right">
                    ${Number(b.total_cost).toFixed(2)}
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
