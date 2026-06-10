import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, FileSpreadsheet, Plus, CheckCircle2, Clock, Calculator, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivBOQ() {
  const companyId = useCompanyId();
  const [boqs, setBoqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchBOQs();
      const channel = supabase.channel('boqs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_boqs', filter: `company_id=eq.${companyId}` }, () => {
          fetchBOQs();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchBOQs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_boqs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setBoqs(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setBoqs([
          { id: '1', item_description: 'Concrete Grade C30', unit: 'm3', quantity: 500, unit_rate: 120, total_amount: 60000, status: 'Approved' },
          { id: '2', item_description: 'Steel Reinforcement 16mm', unit: 'ton', quantity: 50, unit_rate: 850, total_amount: 42500, status: 'Procuring' },
          { id: '3', item_description: 'Formwork Timber', unit: 'm2', quantity: 1200, unit_rate: 15, total_amount: 18000, status: 'Draft' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    const newItem = {
      company_id: companyId,
      project_id: 'temp-project-id',
      item_description: 'New Material Item',
      unit: 'pcs',
      quantity: 100,
      unit_rate: 50,
      total_amount: 5000,
      status: 'Draft'
    };
    try {
      const { error } = await supabase.from('univ_boqs').insert(newItem);
      if (error) throw error;
      toast.success('BOQ item added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add BOQ item');
    }
  };

  const filtered = boqs.filter(b => 
    `${b.item_description} ${b.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Bill of Quantities (BOQ)</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage project materials, quantities, rates, and costs.</p>
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
              placeholder="Search BOQ items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Total Value: <span className="text-emerald-600">${filtered.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold text-right">Quantity</th>
                <th className="p-4 font-semibold">Unit</th>
                <th className="p-4 font-semibold text-right">Rate</th>
                <th className="p-4 font-semibold text-right">Total Amount</th>
                <th className="p-4 font-semibold">Status</th>
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
                  <td className="p-4 font-medium text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-primary/60" /> {b.item_description}
                  </td>
                  <td className="p-4 font-mono font-semibold text-right">
                    {Number(b.quantity).toLocaleString()}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {b.unit}
                  </td>
                  <td className="p-4 font-mono text-right text-muted-foreground">
                    ${Number(b.unit_rate).toLocaleString()}
                  </td>
                  <td className="p-4 font-mono font-bold text-right text-emerald-600 dark:text-emerald-500">
                    ${Number(b.total_amount).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      b.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      b.status === 'Procuring' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {b.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                      {b.status === 'Procuring' && <Clock className="w-3 h-3" />}
                      {b.status}
                    </span>
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
