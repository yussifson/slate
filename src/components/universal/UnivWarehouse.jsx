import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Warehouse, Plus, Layers, AlertCircle, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivWarehouse() {
  const companyId = useCompanyId();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchZones();
      const channel = supabase.channel('warehouse_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_warehouses', filter: `company_id=eq.${companyId}` }, () => {
          fetchZones();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_warehouses')
        .select('*')
        .eq('company_id', companyId)
        .order('zone_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setZones(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    const newZone = {
      company_id: companyId,
      zone_name: 'New Zone',
      bay_number: `BAY-${Math.floor(10 + Math.random() * 90)}`,
      capacity: 500,
      current_occupancy: 0,
      status: 'Active'
    };
    try {
      const { error } = await supabase.from('univ_warehouses').insert(newZone);
      if (error) throw error;
      toast.success('Zone added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add zone');
    }
  };

  const filtered = zones.filter(z => 
    `${z.zone_name} ${z.bay_number} ${z.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Warehouse Zones</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage storage capacity, bays, and utilization.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddZone} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Zone/Bay
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search zones, bays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((z, idx) => {
              const utilPercent = Math.min(100, Math.round((z.current_occupancy / z.capacity) * 100)) || 0;
              const isHighUtil = utilPercent > 85;
              
              return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                key={z.id} 
                className="bg-background border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors shadow-sm group"
              >
                <div className="flex justify-between items-start mb-3">
                   <div className="flex flex-col">
                     <span className="font-bold text-lg text-foreground">{z.bay_number}</span>
                     <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{z.zone_name}</span>
                   </div>
                   <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Capacity Used</span>
                    <span className={`text-xs font-bold ${isHighUtil ? 'text-red-500' : 'text-emerald-500'}`}>{utilPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isHighUtil ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${utilPercent}%` }}></div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 text-right">
                    {z.current_occupancy} / {z.capacity} units
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded border ${
                    z.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {z.status}
                  </span>
                  {isHighUtil && <AlertCircle className="w-4 h-4 text-red-500" title="High Utilization" />}
                </div>
              </motion.div>
            )})}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No warehouse zones found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
