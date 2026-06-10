import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, MapPin, Navigation, User, Plus, Clock, CheckCircle2, AlertCircle, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivDispatch() {
  const companyId = useCompanyId();
  const [dispatch, setDispatch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchDispatch();
      const channel = supabase.channel('dispatch_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_dispatch', filter: `company_id=eq.${companyId}` }, () => {
          fetchDispatch();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchDispatch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_dispatch')
        .select('*')
        .eq('company_id', companyId)
        .order('driver_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setDispatch(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setDispatch([
          { id: '1', driver_name: 'Mike Johnson', status: 'On Route', current_location: 'Downtown District', updated_at: new Date().toISOString() },
          { id: '2', driver_name: 'Sarah Connor', status: 'Available', current_location: 'Main Depot', updated_at: new Date().toISOString() },
          { id: '3', driver_name: 'Tom Hardy', status: 'Off Duty', current_location: 'Home', updated_at: new Date(Date.now() - 86400000).toISOString() }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    const newDispatch = {
      company_id: companyId,
      driver_name: 'New Driver',
      status: 'Available',
      current_location: 'Depot'
    };
    try {
      const { error } = await supabase.from('univ_dispatch').insert(newDispatch);
      if (error) throw error;
      toast.success('Driver assigned');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to assign driver');
    }
  };

  const filtered = dispatch.filter(d => 
    `${d.driver_name} ${d.status} ${d.current_location}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Driver Dispatch</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage driver assignments and real-time status.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAssign} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">On Route</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{dispatch.filter(d => d.status === 'On Route').length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Navigation className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Available</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{dispatch.filter(d => d.status === 'Available').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Off Duty</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{dispatch.filter(d => d.status === 'Off Duty').length}</h3>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl"><Clock className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search drivers, locations..."
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
                <th className="p-4 font-semibold">Driver Name</th>
                <th className="p-4 font-semibold">Current Location</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Last Updated</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={d.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> {d.driver_name}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {d.current_location || 'Unknown'}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      d.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      d.status === 'On Route' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      d.status === 'Resting' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {d.status === 'Available' && <CheckCircle2 className="w-3 h-3" />}
                      {d.status === 'On Route' && <Navigation className="w-3 h-3" />}
                      {d.status === 'Resting' && <Clock className="w-3 h-3" />}
                      {d.status === 'Off Duty' && <AlertCircle className="w-3 h-3" />}
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {new Date(d.updated_at).toLocaleString()}
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
