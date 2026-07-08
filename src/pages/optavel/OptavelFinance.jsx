import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, X, BarChart2, Briefcase, Activity } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CARD = 'bg-card border border-border rounded-2xl p-6 shadow-sm';
const HEAD = 'text-lg font-bold text-foreground flex items-center gap-2 mb-5';

export default function OptavelFinance() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [txModal, setTxModal] = useState(false);
  const [tab, setTab] = useState('transactions');

  const [txForm, setTxForm] = useState({ type: 'income', amount: '', category: 'software', date: new Date().toISOString().split('T')[0], description: '' });

  const { data: transactions = [] } = useQuery({
    queryKey: ['optavel_transactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_transactions WHERE company_id = ? ORDER BY date DESC, created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const submitTx = async () => {
    if (!txForm.amount) return toast.error('Amount is required');
    await powerSync.execute(
      `INSERT INTO optavel_transactions (id, company_id, type, amount, category, date, description, created_at) VALUES (?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, txForm.type, parseFloat(txForm.amount), txForm.category, txForm.date, txForm.description, new Date().toISOString()]
    );
    toast.success('Transaction logged!');
    setTxModal(false);
    setTxForm({ type: 'income', amount: '', category: 'software', date: new Date().toISOString().split('T')[0], description: '' });
    queryClient.invalidateQueries(['optavel_transactions']);
  };

  const deleteTx = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_transactions WHERE id=?`, [id]);
    queryClient.invalidateQueries(['optavel_transactions']);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount)||0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount)||0), 0);
  const netIncome = totalIncome - totalExpense;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-background text-foreground" >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><DollarSign className="w-7 h-7 text-primary" /></div>
            Finance & Ledger
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Revenue · Expenses · Cashflow</p>
        </div>
        <Button onClick={() => setTxModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> New Transaction
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', val: `$${totalIncome.toLocaleString()}`, color: 'emerald' },
          { label: 'Total Expenses', val: `$${totalExpense.toLocaleString()}`, color: 'red' },
          { label: 'Net Income', val: `$${netIncome.toLocaleString()}`, color: netIncome >= 0 ? 'emerald' : 'red' },
          { label: 'Runway (Est)', val: '12 mos', color: 'blue' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${CARD}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-2xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      <div className={CARD}>
        <div className={HEAD}><BarChart2 className="w-5 h-5 text-primary" /> Transaction Ledger</div>
        {transactions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No transactions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="pb-3 pr-4">Date</th><th className="pb-3 pr-4">Description</th><th className="pb-3 pr-4">Category</th><th className="pb-3 pr-4">Amount</th><th className="pb-3">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map(tx => (
                <tr key={tx.id} className="group">
                  <td className="py-3 pr-4 text-muted-foreground">{tx.date}</td>
                  <td className="py-3 pr-4 font-medium text-foreground">{tx.description}</td>
                  <td className="py-3 pr-4 capitalize text-muted-foreground">{tx.category}</td>
                  <td className={`py-3 pr-4 font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <button onClick={() => deleteTx(tx.id)} className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={txModal} onOpenChange={setTxModal}>
        <DialogContent className="bg-background border border-border text-foreground">
          <DialogHeader><DialogTitle>Log Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Type</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})}>
                  <option value="income">Income</option><option value="expense">Expense</option>
                </select>
              </div>
              <div><Label className="text-muted-foreground">Amount ($) *</Label><Input type="number" className="bg-muted border-border text-foreground mt-1" placeholder="1000" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Category</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Software, Salaries, etc." value={txForm.category} onChange={e => setTxForm({...txForm, category: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Date</Label><Input type="date" className="bg-muted border-border text-foreground mt-1" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} /></div>
            </div>
            <div><Label className="text-muted-foreground">Description</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="What was this for?" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={submitTx} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Transaction</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
