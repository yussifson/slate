import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, ClipboardList, Plus, CheckCircle2, XCircle, AlertTriangle, Clock, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivQualityControl() {
  const companyId = useCompanyId();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchInspections();
      const channel = supabase.channel('qc_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_quality_control', filter: `company_id=eq.${companyId}` }, () => {
          fetchInspections();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_quality_control')
        .select('*')
        .eq('company_id', companyId)
        .order('inspection_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setInspections(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddInspection = async () => {
    const newInspection = {
      company_id: companyId,
      batch_number: `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
      inspector_name: 'Current Inspector',
      inspection_date: new Date().toISOString().split('T')[0],
      result: 'Pending',
      notes: ''
    };
    try {
      const { error } = await supabase.from('univ_quality_control').insert(newInspection);
      if (error) throw error;
      toast.success('Inspection logged');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to log inspection');
    }
  };

  const filtered = inspections.filter(i => 
    `${i.batch_number} ${i.inspector_name} ${i.result}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Quality Control</h2>
           <p className="text-sm text-muted-foreground mt-1">Log QA inspections, test results, and compliance.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddInspection} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> New Inspection
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search batches, inspectors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((i, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={i.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary" /> <span className="line-clamp-1">{i.batch_number}</span>
                    </h3>
                    <div className="text-sm font-medium text-muted-foreground mt-1">
                      Inspector: {i.inspector_name || '—'}
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"><MoreHorizontal className="w-4 h-4" /></button>
                </div>

                <div className="flex-1 mb-4">
                   <div className="mb-3">
                     <span className={`px-3 py-1.5 text-xs uppercase tracking-wider font-bold rounded-md border flex items-center justify-center gap-1.5 w-full ${
                       i.result === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                       i.result === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 
                       i.result === 'Rework' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                       'bg-slate-50 text-slate-700 border-slate-200'
                     }`}>
                       {i.result === 'Pass' && <CheckCircle2 className="w-4 h-4" />}
                       {i.result === 'Fail' && <XCircle className="w-4 h-4" />}
                       {i.result === 'Rework' && <AlertTriangle className="w-4 h-4" />}
                       {i.result === 'Pending' && <Clock className="w-4 h-4" />}
                       Result: {i.result}
                     </span>
                   </div>
                   
                   <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                     <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Notes</div>
                     {i.notes || <span className="text-muted-foreground italic">No notes provided.</span>}
                   </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Date:</span>
                   <span className="font-semibold text-foreground">{i.inspection_date || '—'}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No QC inspections found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
