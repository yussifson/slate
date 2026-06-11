import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Users, ShieldCheck, ShieldAlert, CreditCard, MoreHorizontal, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivClientPortal() {
  const companyId = useCompanyId();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchClients();
      const channel = supabase.channel('client_portal_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_client_portal', filter: `company_id=eq.${companyId}` }, () => {
          fetchClients();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_client_portal')
        .select('*')
        .eq('company_id', companyId)
        .order('client_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setClients(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccess = async (clientId, currentAccess) => {
    try {
      const { error } = await supabase.from('univ_client_portal').update({ portal_access: !currentAccess }).eq('id', clientId);
      if (error) throw error;
      toast.success('Access updated');
      fetchClients();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = clients.filter(c => 
    `${c.client_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Client Portal Access</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage client access to their case files, billing, and secure messages.</p>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search clients..."
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
                <th className="p-4 font-semibold">Client Name</th>
                <th className="p-4 font-semibold">Portal Access</th>
                <th className="p-4 font-semibold">Last Login</th>
                <th className="p-4 font-semibold text-right">Outstanding Balance</th>
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
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                         <UserCheck className="w-4 h-4" />
                      </div>
                      {c.client_name}
                    </div>
                  </td>
                  <td className="p-4">
                    {c.portal_access ? (
                       <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit bg-emerald-50 text-emerald-700 border-emerald-200">
                         <ShieldCheck className="w-3 h-3" /> Enabled
                       </span>
                    ) : (
                       <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit bg-red-50 text-red-700 border-red-200">
                         <ShieldAlert className="w-3 h-3" /> Disabled
                       </span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {c.last_login ? new Date(c.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td className="p-4 text-right">
                    <div className={`font-mono font-bold flex items-center justify-end gap-1.5 ${c.outstanding_balance > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      <CreditCard className="w-3.5 h-3.5" /> ${Number(c.outstanding_balance).toFixed(2)}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleAccess(c.id, c.portal_access); }}
                      className="text-xs font-bold text-primary hover:underline mr-4"
                    >
                      Toggle Access
                    </button>
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
