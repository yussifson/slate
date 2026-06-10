import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Briefcase, Plus, Scale, CheckCircle2, AlertCircle, Clock, MoreHorizontal, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivCaseManagement() {
  const companyId = useCompanyId();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchCases();
      const channel = supabase.channel('cases_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_cases', filter: `company_id=eq.${companyId}` }, () => {
          fetchCases();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_cases')
        .select('*')
        .eq('company_id', companyId)
        .order('filed_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setCases(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddCase = async () => {
    const newCase = {
      company_id: companyId,
      case_number: `CAS-${Math.floor(1000 + Math.random() * 9000)}`,
      client_name: 'New Client',
      case_type: 'General Litigation',
      status: 'Open',
      filed_date: new Date().toISOString().split('T')[0],
      court_jurisdiction: 'Local Court'
    };
    try {
      const { error } = await supabase.from('univ_cases').insert(newCase);
      if (error) throw error;
      toast.success('Case added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add case');
    }
  };

  const filtered = cases.filter(c => 
    `${c.case_number} ${c.client_name} ${c.case_type} ${c.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Case Management</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage legal cases, client files, and jurisdictions.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddCase} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Open New Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Cases</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{cases.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Briefcase className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Open Cases</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{cases.filter(c => c.status === 'Open').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><Scale className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">In Progress</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{cases.filter(c => c.status === 'In Progress').length}</h3>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-xl"><Clock className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Closed</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{cases.filter(c => c.status === 'Closed').length}</h3>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search cases, clients..."
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
                <th className="p-4 font-semibold">Case Info</th>
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold">Jurisdiction</th>
                <th className="p-4 font-semibold">Filed Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={c.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" /> {c.case_number}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.case_type}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted-foreground"/> {c.client_name}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> {c.court_jurisdiction || 'N/A'}</div>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {c.filed_date || '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      c.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      c.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      c.status === 'Closed' ? 'bg-slate-100 text-slate-700 border-slate-300' : 
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {c.status}
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
