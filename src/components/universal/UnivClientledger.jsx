import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Download, MoreHorizontal, BookOpen, DollarSign, Activity, CheckCircle2, ArrowUpRight, ArrowDownRight, Edit2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivClientledger() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);
  const [ledgerForm, setLedgerForm] = useState({ client_name: '', status: 'Active' });

  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txnForm, setTxnForm] = useState({ transaction_type: 'deposit', amount: '', date: new Date().toISOString().split('T')[0], description: '' });

  useEffect(() => {
    if (companyId) {
      fetchLedgers();
      const channel = supabase.channel('clientledger_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_clientledger', filter: `company_id=eq.${companyId}` }, () => fetchLedgers())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_trust_transactions', filter: `company_id=eq.${companyId}` }, () => {
           if (selectedLedger) fetchTransactions(selectedLedger.id);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId, selectedLedger]);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_clientledger WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      setLedgers(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch ledgers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (clientId) => {
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_trust_transactions WHERE client_id = ? ORDER BY date DESC, created_at DESC`, [clientId]);
      setTransactions(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
    }
  };

  const openLedgerModal = (l = null) => {
    if (l) {
      setEditingLedger(l);
      setLedgerForm({ ...l });
    } else {
      setEditingLedger(null);
      setLedgerForm({ client_name: '', status: 'Active' });
    }
    setIsLedgerModalOpen(true);
  };

  const saveLedger = async (e) => {
    e.preventDefault();
    try {
      if (editingLedger) {
        await powerSync.execute(`UPDATE univ_clientledger SET client_name = ?, status = ? WHERE id = ?`, [ledgerForm.client_name, ledgerForm.status, editingLedger.id]);
        toast.success('Ledger updated');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(`INSERT INTO univ_clientledger (id, company_id, client_name, account_balance, last_activity, status) VALUES (?, ?, ?, ?, ?, ?)`, 
          [id, companyId, ledgerForm.client_name, '0.00', new Date().toISOString().split('T')[0], ledgerForm.status]);
        toast.success('Ledger created');
      }
      setIsLedgerModalOpen(false);
      fetchLedgers();
    } catch (err) {
      toast.error(err.message || 'Failed to save ledger');
    }
  };

  const deleteLedger = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this ledger? All trust transactions will be deleted.')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_trust_transactions WHERE client_id = ?`, [id]);
      await powerSync.execute(`DELETE FROM univ_clientledger WHERE id = ?`, [id]);
      toast.success('Ledger deleted');
      fetchLedgers();
    } catch (err) {
      toast.error('Failed to delete ledger');
    }
  };

  const openTransactions = (l) => {
    setSelectedLedger(l);
    fetchTransactions(l.id);
    setIsTransactionsOpen(true);
  };

  const saveTransaction = async (e) => {
    e.preventDefault();
    if (!txnForm.amount || isNaN(Number(txnForm.amount))) return toast.error('Invalid amount');
    try {
      await powerSync.execute(
        `INSERT INTO univ_trust_transactions (id, company_id, client_id, transaction_type, amount, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), companyId, selectedLedger.id, txnForm.transaction_type, parseFloat(txnForm.amount), txnForm.date, txnForm.description]
      );
      toast.success('Transaction added');
      setTxnForm({ transaction_type: 'deposit', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchTransactions(selectedLedger.id);
    } catch (err) {
      toast.error('Failed to add transaction');
    }
  };

  const deleteTransaction = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_trust_transactions WHERE id = ?`, [id]);
      fetchTransactions(selectedLedger.id);
    } catch (err) {
      toast.error('Failed to delete transaction');
    }
  };

  const filtered = ledgers.filter(l => String(l.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Client Trust Ledger</h2>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage client IOLTA accounts and operating balances.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openLedgerModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
            <Plus className="w-4 h-4" /> New Ledger
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <input 
              type="text" placeholder="Search ledgers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#71717a] dark:text-gray-400 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4">Client Name</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                  key={l.id} onClick={() => openTransactions(l)}
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> {l.client_name}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg ${l.status==='Active'?'bg-emerald-50 text-emerald-700':'bg-muted text-foreground'}`}>{l.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openLedgerModal(l); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteLedger(l.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                 <tr><td colSpan="3" className="p-8 text-center text-[#71717a]">No ledgers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Modal */}
      <AnimatePresence>
        {isLedgerModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-card w-full max-w-sm rounded-2xl flex flex-col shadow-xl border-[0.5px] border-black/9 dark:border-white/8">
              <div className="p-5 border-b border-primary/40 flex justify-between items-center">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingLedger ? 'Edit Ledger' : 'New Ledger'}</h2>
                <button onClick={() => setIsLedgerModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveLedger} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Client Name</label>
                  <input required value={ledgerForm.client_name} onChange={e=>setLedgerForm({...ledgerForm, client_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                  <select value={ledgerForm.status} onChange={e=>setLedgerForm({...ledgerForm, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>Active</option>
                    <option>Closed</option>
                  </select>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsLedgerModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Ledger</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions Sidebar */}
      <AnimatePresence>
        {isTransactionsOpen && selectedLedger && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 flex justify-end bg-background/80 backdrop-blur-sm">
            <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring', damping:25, stiffness:200}} className="w-full max-w-lg bg-card border-l border-border/40 h-full flex flex-col shadow-2xl">
              <div className="p-6 border-b border-border/40 flex justify-between items-center bg-muted/20">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{selectedLedger.client_name}</h2>
                  <p className="text-sm text-[#71717a]">Trust Account Transactions</p>
                </div>
                <button onClick={() => setIsTransactionsOpen(false)} className="p-2 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <div className="p-6 flex-1 overflow-auto bg-background">
                <div className="bg-card p-5 rounded-2xl border-[0.5px] border-primary/40 shadow-sm mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#71717a]">Current Trust Balance</p>
                    <h3 className="text-3xl font-bold tracking-tight mt-1 text-foreground">
                      ${transactions.reduce((acc, curr) => acc + (curr.transaction_type === 'deposit' ? Number(curr.amount) : -Number(curr.amount)), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </h3>
                  </div>
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <DollarSign className="w-8 h-8" />
                  </div>
                </div>

                <form onSubmit={saveTransaction} className="bg-muted/30 p-4 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 mb-6 space-y-4">
                  <h3 className="text-sm font-semibold">Post Transaction</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <select required value={txnForm.transaction_type} onChange={e=>setTxnForm({...txnForm, transaction_type: e.target.value})} className="h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option value="deposit">Deposit Funds</option>
                      <option value="withdrawal">Withdraw Funds</option>
                    </select>
                    <input required type="number" step="0.01" placeholder="Amount" value={txnForm.amount} onChange={e=>setTxnForm({...txnForm, amount: e.target.value})} className="h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="date" value={txnForm.date} onChange={e=>setTxnForm({...txnForm, date: e.target.value})} className="h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <input required placeholder="Description / Memo" value={txnForm.description} onChange={e=>setTxnForm({...txnForm, description: e.target.value})} className="h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <button type="submit" className="w-full h-10 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Post to Ledger</button>
                </form>

                <div className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-widest mb-3">Ledger History</h3>
                  {transactions.map(t => (
                    <div key={t.id} className="p-4 rounded-xl border-[0.5px] border-border/40 bg-card flex items-center justify-between group">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${t.transaction_type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {t.transaction_type === 'deposit' ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{t.description}</p>
                          <p className="text-[11px] text-[#71717a] mt-0.5">{t.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-semibold text-sm ${t.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.transaction_type === 'deposit' ? '+' : '-'}${Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                        <button onClick={() => deleteTransaction(t.id)} className="text-[#71717a] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center p-8 text-[#71717a] text-sm">No transactions yet.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
