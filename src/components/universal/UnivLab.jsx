import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, FlaskConical, Plus, CheckCircle2, Clock, MoreHorizontal, User, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivLab() {
  const companyId = useCompanyId();
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
        .select('*')
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
      patient_id: 'temp-patient-id',
      test_name: 'New Lab Test',
      test_date: new Date().toISOString(),
      status: 'Pending'
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

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Lab Results</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage lab test orders, processing, and final results.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleOrderTest} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Order Test
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                      'bg-slate-50 text-slate-700 border-slate-200'
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
