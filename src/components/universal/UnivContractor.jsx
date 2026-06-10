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
        .select('*')
        .eq('company_id', companyId)
        .order('contractor_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setContractors(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setContractors([
          { id: '1', contractor_name: 'Apex Electricals', trade_specialty: 'Electrical', contact_email: 'info@apexelectric.com', contact_phone: '555-0100', status: 'Active', rating: 4.8 },
          { id: '2', contractor_name: 'Solid Foundations Ltd', trade_specialty: 'Concrete & Masonry', contact_email: 'contact@solidfoundations.co', contact_phone: '555-0200', status: 'Active', rating: 4.5 },
          { id: '3', contractor_name: 'Blue Sky Plumbing', trade_specialty: 'Plumbing', contact_email: 'service@bluesky.com', contact_phone: '555-0300', status: 'Suspended', rating: 2.1 }
        ]);
      }
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
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add contractor');
    }
  };

  const filtered = contractors.filter(c => 
    `${c.contractor_name} ${c.trade_specialty} ${c.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Contractors & Subcontractors</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage vendor profiles, specialties, and performance ratings.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddContractor} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Contractor
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                    'bg-slate-50 text-slate-700 border-slate-200'
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
