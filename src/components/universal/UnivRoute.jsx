import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Map, Navigation, CheckCircle2, Clock, MapPin, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivRoute() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchRoutes();
      const channel = supabase.channel('routes_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_routes', filter: `company_id=eq.${companyId}` }, () => {
          fetchRoutes();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_routes')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setRoutes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async () => {
    const newRoute = {
      company_id: companyId,
      route_name: `Route ${Math.floor(100 + Math.random() * 900)}`,
      start_location: 'Warehouse',
      end_location: 'Destination',
      estimated_distance: Number(Math.floor(20 + Math.random() * 200)) || 0,
      estimated_duration: '2h',
      status: 'Planned'
    };
    try {
      const { error } = await (async () => {
        const _p = newRoute;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_routes (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
      if (error) throw error;
      toast.success('Route added');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to add route');
    }
  };

  const filtered = routes.filter(r => 
    `${r.route_name || ''} ${r.start_location || ''} ${r.end_location || ''} ${r.status || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
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
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Route Planning</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage delivery routes, distances, and status.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        <div className="flex bg-muted p-1 rounded-lg border border-border mr-2 hidden sm:flex">
          {["Default","Grid","Kanban","Dashboard"].map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleAddRoute} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Plan Route
          </button>
      </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((r, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={r.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                       <Map className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{r.route_name}</h3>
                      <span className={`px-2 py-0.5 mt-1 text-[10px] uppercase tracking-wider font-bold rounded-md border inline-flex w-fit ${
                        r.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        'bg-background text-foreground border-border'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"><MoreHorizontal className="w-4 h-4" /></button>
                </div>

                <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/50 relative">
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border z-0"></div>
                  
                  <div className="flex items-start gap-3 relative z-10 mb-6">
                    <div className="w-4 h-4 rounded-full bg-background border-2 border-primary flex-shrink-0 mt-0.5"></div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Origin</p>
                      <p className="text-sm font-medium text-foreground">{r.start_location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <MapPin className="w-2 h-2 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Destination</p>
                      <p className="text-sm font-medium text-foreground">{r.end_location}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                   <div className="flex items-center gap-1.5"><Navigation className="w-4 h-4" /> {r.estimated_distance} mi</div>
                   <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {r.estimated_duration}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Map className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No routes found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
