import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Factory, Plus, Settings, CheckCircle2, Clock, PlayCircle, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivProduction() {
  const companyId = useCompanyId();
  const [production, setProduction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchProduction();
      const channel = supabase.channel('production_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_production', filter: `company_id=eq.${companyId}` }, () => {
          fetchProduction();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchProduction = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_production')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setProduction(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    const newBatch = {
      company_id: companyId,
      batch_number: `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
      product_name: 'New Product Line',
      quantity: 1000,
      status: 'Planned',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
    };
    try {
      const { error } = await supabase.from('univ_production').insert(newBatch);
      if (error) throw error;
      toast.success('Production batch created');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to create batch');
    }
  };

  const filtered = production.filter(p => 
    `${p.batch_number} ${p.product_name} ${p.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Production Runs</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage manufacturing batches, timelines, and statuses.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCreateBatch} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search batches, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={p.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm group"
              >
                <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Factory className="w-4 h-4 text-primary" /> {p.batch_number}
                    </h3>
                    <div className="text-sm font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                      {p.product_name}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
                    p.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    p.status === 'QA' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                    p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {p.status === 'In Progress' && <PlayCircle className="w-3 h-3" />}
                    {p.status === 'QA' && <Settings className="w-3 h-3" />}
                    {p.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                    {p.status === 'Planned' && <Clock className="w-3 h-3" />}
                    {p.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target Quantity</span>
                    <span className="font-bold font-mono">{Number(p.quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-medium">{p.start_date || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. End Date</span>
                    <span className="font-medium">{p.end_date || '—'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                   <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Manage <MoreHorizontal className="w-3 h-3" />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Factory className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No production batches found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
