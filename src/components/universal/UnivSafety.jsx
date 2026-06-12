import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, Plus, AlertTriangle, AlertCircle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivSafety() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchIncidents();
      const channel = supabase.channel('safety_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_safety', filter: `company_id=eq.${companyId}` }, () => {
          fetchIncidents();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_safety')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('report_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setIncidents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncident = async () => {
    const newIncident = {
      company_id: companyId,
      incident_type: 'Hazard',
      description: 'New hazard observed',
      reported_by: 'Current User',
      status: 'Open',
      severity: 'Medium'
    };
    try {
      const { error } = await (async () => {
        const _p = newIncident;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_safety (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
      if (error) throw error;
      toast.success('Incident logged');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to log incident');
    }
  };

  const filtered = incidents.filter(i => 
    `${i.incident_type || ''} ${i.description || ''} ${i.status || ''} ${i.severity || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
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
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Safety & Incidents</h2>
           <p className="text-sm text-muted-foreground mt-1">Log and track safety hazards, near misses, and injuries.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleAddIncident} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-500/20">
            <Plus className="w-4 h-4" /> Report Incident
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
              placeholder="Search incidents..."
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
                <th className="p-4 font-semibold">Incident Type</th>
                <th className="p-4 font-semibold">Severity</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Reported By</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((i, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={i.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-bold text-foreground flex items-center gap-2">
                    <ShieldAlert className={`w-4 h-4 ${i.severity === 'Critical' ? 'text-red-600' : 'text-primary'}`} /> {i.incident_type}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      i.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                      i.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      i.severity === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      'bg-background text-foreground border-border'
                    }`}>
                      {i.severity}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground truncate max-w-xs">
                    {i.description}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {i.reported_by}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {i.report_date ? new Date(i.report_date).toLocaleString() : '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      i.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      i.status === 'Investigating' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {i.status === 'Resolved' && <CheckCircle2 className="w-3 h-3" />}
                      {i.status === 'Investigating' && <AlertCircle className="w-3 h-3" />}
                      {i.status === 'Open' && <AlertTriangle className="w-3 h-3" />}
                      {i.status}
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
