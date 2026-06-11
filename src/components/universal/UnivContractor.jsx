import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Users, Plus, Star, Phone, Mail, CheckCircle2, AlertCircle, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivContractor() {
  const companyId = useCompanyId();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchContractors();
      const channel = supabase.channel('contractors_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_contractors', filter: `company_id=eq.${companyId}` }, () => {
          fetchContractors();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_contractors')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('contractor_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setContractors(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch contractors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContractor = async () => {
    const newContractor = {
      company_id: companyId,
      contractor_name: 'New Contractor Ltd',
      trade_specialty: 'General',
      contact_email: 'new@contractor.com',
      contact_phone: '555-0000',
      status: 'Active',
      rating: 0
    };
    try {
      const { error } = await supabase.from('univ_contractors').insert(newContractor);
      if (error) throw error;
      toast.success('Contractor added');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = contractors.filter(c => 
    `${c.contractor_name} ${c.trade_specialty} ${c.status}`.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Contractors & Subcontractors</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage vendor profiles, specialties, and performance ratings.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleAddContractor} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Contractor
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
              placeholder="Search contractors, trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((c, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={c.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                
                <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">{c.contractor_name}</h3>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{c.trade_specialty}</p>

                <div className="space-y-2 mb-6">
                  {c.contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {c.contact_phone}
                    </div>
                  )}
                  {c.contact_email && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Mail className="w-4 h-4 text-muted-foreground" /> <span className="truncate">{c.contact_email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                    c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    c.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-200' : 
                    'bg-background text-foreground border-border'
                  }`}>
                    {c.status === 'Active' && <CheckCircle2 className="w-3 h-3" />}
                    {c.status === 'Suspended' && <AlertCircle className="w-3 h-3" />}
                    {c.status}
                  </span>
                  
                  {c.rating > 0 && (
                    <div className="flex items-center gap-1 font-bold text-sm text-foreground">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {c.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No contractors found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
