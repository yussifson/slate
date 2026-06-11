import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, FlaskConical, Plus, CheckCircle2, Clock, MoreHorizontal, User, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivLab() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchLabs();
      const channel = supabase.channel('labs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_labs', filter: `company_id=eq.${companyId}` }, () => {
          fetchLabs();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_labs')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setLabs(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleOrderTest = async () => {
    const newTest = {
      company_id: companyId,
      patient_id: '00000000-0000-0000-0000-000000000000',
      test_name: 'New Lab Test',
      test_date: new Date().toISOString(),
      status: 'Pending',
      result_value: 'Patient: temp-patient-id'
    };
    try {
      const { error } = await supabase.from('univ_labs').insert(newTest);
      if (error) throw error;
      toast.success('Lab test ordered');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to order test');
    }
  };

  const filtered = labs.filter(l => 
    `${l.patient_name} ${l.test_name} ${l.status}`.toLowerCase().includes(searchTerm.toLowerCase())
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
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Lab Results</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage lab test orders, processing, and final results.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleOrderTest} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Order Test
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
              placeholder="Search tests, patients..."
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
                <th className="p-4 font-semibold">Test Name</th>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Date Ordered</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Result / Range</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={l.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                       <FlaskConical className="w-4 h-4 text-emerald-500" /> {l.test_name}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {l.patient_name || 'Patient'}</div>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(l.test_date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      l.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      l.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-background text-foreground border-border'
                    }`}>
                      {l.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                      {l.status === 'Processing' && <Clock className="w-3 h-3" />}
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {l.status === 'Completed' ? (
                      <div>
                        <div className="font-bold text-foreground">{l.result_value}</div>
                        <div className="text-[10px] text-muted-foreground">Ref: {l.reference_range}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Awaiting Result...</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><FileText className="w-4 h-4" /></button>
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
