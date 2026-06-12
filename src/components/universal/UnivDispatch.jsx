import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, MapPin, Navigation, User, Plus, Clock, CheckCircle2, AlertCircle, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivDispatch() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
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
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('driver_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setDispatch(data || []);
    } catch (err) {
      // Mock data removed for production empty states
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
      const { error } = await (async () => {
        const _p = newDispatch;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_dispatch (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
      if (error) throw error;
      toast.success('Driver assigned');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = dispatch.filter(d => 
    `${d.driver_name} ${d.status} ${d.current_location}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  const handleExport = () => {
    const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Driver Dispatch</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage driver assignments and real-time status.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleAssign} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
      </div>
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
          <div className="p-3 bg-muted dark:bg-slate-800 text-muted-foreground rounded-xl"><Clock className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                      'bg-background text-foreground border-border'
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
