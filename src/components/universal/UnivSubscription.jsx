import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Repeat, CreditCard, ArrowUpRight, ArrowDownRight, User, MoreHorizontal, Download, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivSubscription() {
  const companyId = useCompanyId();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchSubscriptions();
      const channel = supabase.channel('subs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_subscriptions', filter: `company_id=eq.${companyId}` }, () => {
          fetchSubscriptions();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setSubscriptions(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setSubscriptions([
          { id: '1', plan_name: 'Pro Tier', customer_name: 'Acme Corp', status: 'Active', billing_cycle: 'Monthly', amount: 99.00, next_billing_date: '2026-07-01' },
          { id: '2', plan_name: 'Enterprise', customer_name: 'TechStars', status: 'Active', billing_cycle: 'Annually', amount: 999.00, next_billing_date: '2027-01-01' },
          { id: '3', plan_name: 'Starter', customer_name: 'SmallBiz LLC', status: 'Past Due', billing_cycle: 'Monthly', amount: 29.00, next_billing_date: '2026-06-01' },
          { id: '4', plan_name: 'Pro Tier', customer_name: 'Churned Inc', status: 'Canceled', billing_cycle: 'Monthly', amount: 99.00, next_billing_date: null }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSub = async () => {
    const newSub = {
      company_id: companyId,
      plan_name: 'Pro Tier',
      customer_name: 'New Customer',
      status: 'Active',
      billing_cycle: 'Monthly',
      amount: 99.00,
      next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    };
    try {
      const { error } = await supabase.from('univ_subscriptions').insert(newSub);
      if (error) throw error;
      toast.success('Subscription added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add subscription');
    }
  };

  const filtered = subscriptions.filter(s => 
    `${s.plan_name} ${s.customer_name} ${s.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mrr = subscriptions.filter(s => s.status === 'Active').reduce((sum, s) => sum + Number(s.amount) / (s.billing_cycle === 'Annually' ? 12 : 1), 0);
  const activeCount = subscriptions.filter(s => s.status === 'Active').length;
  const churnedCount = subscriptions.filter(s => s.status === 'Canceled').length;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Subscriptions</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage recurring billing and plans.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddSub} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Repeat className="w-4 h-4" /> New Subscription
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Estimated MRR</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">${mrr.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Active Subscribers</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{activeCount}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><User className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Churned</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{churnedCount}</h3>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search customers, plans..."
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
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Plan</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Next Billing</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={s.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground">{s.customer_name}</div>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {s.plan_name} <span className="text-xs ml-1 opacity-70">({s.billing_cycle})</span>
                  </td>
                  <td className="p-4 font-bold text-foreground">
                    ${Number(s.amount).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border ${
                      s.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      s.status === 'Past Due' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm flex items-center gap-2">
                    {s.next_billing_date ? <><Calendar className="w-3.5 h-3.5" /> {s.next_billing_date}</> : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted-foreground">
                    <Repeat className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                    No subscriptions found.
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
