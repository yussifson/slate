import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText, Send, Download, MoreVertical, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivInvoice() {
  const companyId = useCompanyId();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchInvoices();
      const channel = supabase.channel('invoice_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_invoices', filter: `company_id=eq.${companyId}` }, () => {
          fetchInvoices();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error(err);
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    const newInv = {
      company_id: companyId,
      client_name: 'New Client',
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      amount: 0,
      status: 'Draft',
    };
    try {
      const { error } = await supabase.from('univ_invoices').insert(newInv);
      if (error) throw error;
      toast.success('Draft invoice created');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to create invoice');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400';
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';
      case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400';
      case 'Overdue': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filtered = invoices.filter(i => 
    `${i.invoice_number} ${i.client_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <button onClick={handleCreateInvoice} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">$45,231.00</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">$12,400.00</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">$3,150.00</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-2">Client</div>
          <div>Invoice #</div>
          <div>Amount</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(inv => (
            <div key={inv.id} className="grid grid-cols-6 gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-2 flex flex-col">
                <span className="font-semibold text-sm text-foreground">{inv.client_name}</span>
                {inv.due_date && <span className="text-xs text-muted-foreground">Due: {inv.due_date}</span>}
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{inv.invoice_number}</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                ${Number(inv.amount).toLocaleString()} {inv.currency}
              </div>
              <div>
                <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${getStatusColor(inv.status)}`}>
                  {inv.status}
                </span>
              </div>
              <div className="text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted rounded-md" title="Send">
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted rounded-md" title="Download PDF">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors bg-muted rounded-md">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No invoices found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
