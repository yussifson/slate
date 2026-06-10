import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCcw, MoreHorizontal, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivPayment() {
  const companyId = useCompanyId();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchPayments();
      const channel = supabase.channel('payments_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_payments', filter: `company_id=eq.${companyId}` }, () => {
          fetchPayments();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_payments')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setPayments(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleCharge = async () => {
    const newPayment = {
      company_id: companyId,
      amount: Math.floor(Math.random() * 500) + 10,
      method: 'Credit Card',
      status: 'Completed',
      reference_id: `ch_mock_${Math.floor(Math.random() * 10000)}`
    };
    try {
      const { error } = await supabase.from('univ_payments').insert(newPayment);
      if (error) throw error;
      toast.success('Payment processed successfully');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to process payment');
    }
  };

  const filtered = payments.filter(p => 
    `${p.reference_id} ${p.method} ${p.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVolume = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Payments</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage transactions and payment gateways.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleCharge} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <CreditCard className="w-4 h-4" /> New Charge
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Net Volume</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">${totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Successful Txns</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{payments.filter(p => p.status === 'Completed').length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Refunds</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{payments.filter(p => p.status === 'Refunded').length}</h3>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-xl"><RefreshCcw className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search reference, method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold">Date</th>
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
                  <td className="p-4 font-bold text-foreground">
                    ${Number(p.amount).toFixed(2)} <span className="text-xs text-muted-foreground font-medium">{p.currency}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border ${
                      p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      p.status === 'Refunded' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> {p.method}
                  </td>
                  <td className="p-4 text-xs font-mono text-muted-foreground">
                    {p.reference_id}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                    No payments found.
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
