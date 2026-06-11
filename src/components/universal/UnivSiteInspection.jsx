import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, ClipboardCheck, Plus, AlertCircle, CheckCircle2, Clock, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivSiteInspection() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchInspections();
      const channel = supabase.channel('inspections_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_site_inspections', filter: `company_id=eq.${companyId}` }, () => {
          fetchInspections();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_site_inspections')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('inspection_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setInspections(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInspection = async () => {
    const newInspection = {
      company_id: companyId,
      project_id: '00000000-0000-0000-0000-000000000000',
      inspector_name: 'Current User',
      inspection_date: new Date().toISOString().split('T')[0] || null,
      findings: 'Initial site walkthrough completed',
      snag_list: 'List items here...',
      status: 'Pending Review'
    };
    try {
      const { error } = await supabase.from('univ_site_inspections').insert(newInspection);
      if (error) throw error;
      toast.success('Inspection logged');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to log inspection');
    }
  };

  const filtered = inspections.filter(i => 
    `${i.inspector_name || ''} ${i.findings || ''} ${i.status || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
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
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Site Inspections</h2>
           <p className="text-sm text-muted-foreground mt-1">Log site walk-throughs, findings, and snag lists.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleAddInspection} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Log Inspection
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
              placeholder="Search inspections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="space-y-4">
            {filtered.map((insp, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={insp.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Inspection Report</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="font-medium">By: {insp.inspector_name}</span>
                        <span>•</span>
                        <span>Date: {insp.inspection_date || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      insp.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      insp.status === 'Addressed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {insp.status === 'Closed' && <CheckCircle2 className="w-3 h-3" />}
                      {insp.status === 'Pending Review' && <Clock className="w-3 h-3" />}
                      {insp.status}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Findings</h4>
                    <p className="text-sm text-foreground">{insp.findings || 'No specific findings recorded.'}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Snag List</h4>
                    <p className="text-sm text-foreground">{insp.snag_list || 'None'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No site inspections recorded.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
