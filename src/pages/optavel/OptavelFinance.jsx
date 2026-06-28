import React, { useState } from 'react';
import { DollarSign, FileText, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function OptavelFinance() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newTransactionAmt, setNewTransactionAmt] = useState('');
  const [newTransactionDesc, setNewTransactionDesc] = useState('');
  const [transactionType, setTransactionType] = useState('income');

  const { data: transactions = [] } = useQuery({
    queryKey: ['optavel_transactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_transactions WHERE company_id = ? ORDER BY date DESC, created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['optavel_commissions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_commissions WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const addTransaction = useMutation({
    mutationFn: async () => {
      if (!newTransactionAmt || !newTransactionDesc) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_transactions (id, company_id, amount, type, description, date) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, companyId, parseFloat(newTransactionAmt), transactionType, newTransactionDesc, new Date().toISOString()]
      );
    },
    onError: (e) => { console.error('Mutation Error:', e); alert('Error: ' + e.message); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [] });
      setNewTransactionAmt('');
      setNewTransactionDesc('');
    }
  });

  // Calculate stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const netRevenue = totalIncome - totalExpenses;
  const pendingCommissions = commissions.filter(c => c.status === 'unpaid').reduce((sum, c) => sum + (c.amount || 0), 0);

  // Group transactions by month for chart
  const monthlyData = transactions.reduce((acc, t) => {
    const d = new Date(t.date || t.created_at);
    const month = d.toLocaleString('default', { month: 'short' });
    if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
    if (t.type === 'income') acc[month].income += t.amount || 0;
    else acc[month].expense += t.amount || 0;
    return acc;
  }, {});

  // Reverse so it's chronological if we assume DESC sort earlier, or sort by actual date
  const chartData = Object.values(monthlyData).reverse();
  
  // Dummy data if empty so the chart looks good empty
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Jan', income: 0, expense: 0 },
    { name: 'Feb', income: 0, expense: 0 }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-amber-500" />
          Finance
        </h1>
        <p className="text-slate-400 mt-1">Real-Time Global Revenue Dashboard and Ledger.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Net Revenue', val: `$${netRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Total Income', val: `$${totalIncome.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Total Expenses', val: `$${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: 'text-orange-400' },
          { label: 'Pending Commissions', val: `$${pendingCommissions.toLocaleString()}`, icon: FileText, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-400">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Financial Performance</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#f97316" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaction Ledger</h2>
          </div>
          
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-2">
            <input 
              type="text" placeholder="Description..." 
              className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 md:col-span-2"
              value={newTransactionDesc} onChange={e => setNewTransactionDesc(e.target.value)}
            />
            <input 
              type="number" placeholder="Amount..." 
              className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              value={newTransactionAmt} onChange={e => setNewTransactionAmt(e.target.value)}
            />
            <div className="flex gap-2">
              <select 
                className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex-1"
                value={transactionType} onChange={e => setTransactionType(e.target.value)}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <button onClick={() => addTransaction.mutate()} className="p-2 bg-amber-500 hover:bg-amber-600 transition-colors rounded-lg text-white shadow-sm shadow-amber-500/20">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {transactions.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">No transactions recorded.</p> : transactions.map(t => (
              <div key={t.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl flex justify-between items-center shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                    {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{t.description}</h4>
                    <p className="text-xs text-slate-400">{new Date(t.date || t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                  {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
