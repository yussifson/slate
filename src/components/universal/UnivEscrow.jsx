import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Plus, Download, MoreHorizontal, Briefcase, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivEscrow() {
  const companyId = useCompanyId();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('univ_escrow_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_escrow', filter: `company_id=eq.${companyId}` }, () => {
          fetchData();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from('univ_escrow')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setData(fetchedData || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const newItem = {
      company_id: companyId,
      account_name: 'New Escrow',
      balance: 'Sample Data',
      last_transaction: 'Sample Data',
      status: 'Active'
    };
    try {
      const { error } = await supabase.from('univ_escrow').insert({ ...newItem, company_id: companyId });
      if (error) throw error;
      toast.success('Escrow added');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = data.filter(item => 
    String(item.account_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Escrow</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage your escrow records.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Escrow
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search..."
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
                <th className="p-4 font-semibold capitalize">account name</th>
                <th className="p-4 font-semibold capitalize">balance</th>
                <th className="p-4 font-semibold capitalize">last transaction</th>
                <th className="p-4 font-semibold capitalize">status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={item.id || idx} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> {item.account_name}</div>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /> {item.balance}</div>
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> {item.last_transaction}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center w-fit gap-1 ${
                      item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
