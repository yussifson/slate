import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, DollarSign, FileText, User, MoreHorizontal, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivPayroll() {
  const companyId = useCompanyId();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchPayrolls();
      const channel = supabase.channel('payroll_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_payroll', filter: `company_id=eq.${companyId}` }, () => {
          fetchPayrolls();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_payroll')
        .select('*')
        .eq('company_id', companyId)
        .order('period_start', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setPayrolls(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const filtered = payrolls.filter(p => 
    `${p.employee_name} ${p.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Payroll</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage salaries and payslips.</p>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search employee..."
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
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Period</th>
                <th className="p-4 font-semibold">Base / Net</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={p.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" /> {p.employee_name || 'Unknown'}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs font-mono">
                    {p.period_start} <br/> {p.period_end}
                  </td>
                  <td className="p-4">
                    <div className="text-muted-foreground text-xs line-through">${p.base_salary}</div>
                    <div className="font-bold text-foreground text-sm flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> {p.net_pay}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border w-fit ${
                      p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      p.status === 'Processed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {p.status}
                    </span>
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
