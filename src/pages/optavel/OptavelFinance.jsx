import React, { useState } from 'react';
import { DollarSign, Wallet, CreditCard, FileText, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export default function OptavelFinance() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newCommissionAmt, setNewCommissionAmt] = useState('');

  const { data: commissions = [], isLoading } = useQuery({
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

  const addCommission = useMutation({
    mutationFn: async () => {
      if (!newCommissionAmt) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_commissions (id, company_id, amount, status, month) VALUES (?, ?, ?, ?, ?)`,
        [id, companyId, parseFloat(newCommissionAmt), 'unpaid', 'June 2026']
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_commissions']);
      setNewCommissionAmt('');
    }
  });

  const markPaid = async (id) => {
    await powerSync.execute(`UPDATE optavel_commissions SET status = 'paid' WHERE id = ?`, [id]);
    queryClient.invalidateQueries(['optavel_commissions']);
  };

  const pendingTotal = commissions.filter(c => c.status === 'unpaid').reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-amber-500" />
          Finance
        </h1>
        <p className="text-slate-400 mt-1">Revenue Dashboard, Cash Flow, and Commission Ledger.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111113] border border-white/5 rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-slate-400">Pending Commissions</span>
            <FileText className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className="text-3xl font-bold text-white">${pendingTotal.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 min-h-[300px]">
          <h2 className="text-xl font-bold text-white mb-4">Paystack Integration Sync</h2>
          <div className="flex items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
            <span className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Live Sync Active
            </span>
          </div>
        </div>
        
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Commission Ledger</h2>
            <div className="flex gap-2">
              <input 
                type="number" placeholder="Amount..." 
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-amber-500 w-24"
                value={newCommissionAmt} onChange={e => setNewCommissionAmt(e.target.value)}
              />
              <button onClick={() => addCommission.mutate()} className="p-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {commissions.length === 0 ? <p className="text-sm text-slate-500">No commissions recorded.</p> : commissions.map(c => (
              <div key={c.id} className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-white">Partner {c.partner_id?.slice(0,4) || 'Unknown'}</h4>
                  <p className="text-xs text-slate-400">{c.month}</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="font-bold text-emerald-400">${(c.amount || 0).toLocaleString()}</div>
                    <div className={`text-[10px] ${c.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{c.status}</div>
                  </div>
                  {c.status === 'unpaid' && (
                    <button onClick={() => markPaid(c.id)} className="text-xs px-2 py-1 bg-white/10 hover:bg-emerald-500 hover:text-white rounded">Mark Paid</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
