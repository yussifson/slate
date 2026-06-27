import React, { useState } from 'react';
import { TrendingUp, Users, DollarSign, Target, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export default function OptavelSales() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newDealName, setNewDealName] = useState('');
  const [newDealValue, setNewDealValue] = useState('');

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['optavel_deal_rooms', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_deal_rooms WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const createDeal = useMutation({
    mutationFn: async () => {
      if (!newDealName || !newDealValue) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_deal_rooms (id, company_id, lead_name, value, stage, probability) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, companyId, newDealName, parseFloat(newDealValue), 'lead', 10]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_deal_rooms']);
      setNewDealName('');
      setNewDealValue('');
    }
  });

  const updateDealStage = async (id, stage) => {
    await powerSync.execute(`UPDATE optavel_deal_rooms SET stage = ? WHERE id = ?`, [stage, id]);
    queryClient.invalidateQueries(['optavel_deal_rooms']);
  };

  const stages = [
    { id: 'lead', title: 'New Lead' },
    { id: 'contacted', title: 'Contacted' },
    { id: 'demo', title: 'Demo Scheduled' },
    { id: 'negotiating', title: 'Negotiating' },
    { id: 'closed_won', title: 'Closed Won' }
  ];

  const totalPipeline = deals.filter(d => d.stage !== 'closed_won').reduce((sum, d) => sum + (d.value || 0), 0);
  const activeDeals = deals.filter(d => d.stage !== 'closed_won').length;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-emerald-500" />
          Sales & CRM
        </h1>
        <p className="text-slate-400 mt-1">CRM Pipeline, Growth Partner Management, and Deal Rooms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111113] border border-white/5 rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-slate-400">Total Pipeline</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-bold text-white">${totalPipeline.toLocaleString()}</h3>
        </div>
        <div className="bg-[#111113] border border-white/5 rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-slate-400">Active Deals</span>
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-3xl font-bold text-white">{activeDeals}</h3>
        </div>
        <div className="bg-[#111113] border border-white/5 rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-slate-400">Top Growth Partner</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Sarah Jenkins</h3>
          <p className="text-xs text-amber-400">$45k Commission MTD</p>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Kanban Pipeline</h2>
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Deal Name..." 
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-emerald-500 w-32"
              value={newDealName} onChange={e => setNewDealName(e.target.value)}
            />
            <input 
              type="number" placeholder="Value..." 
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-emerald-500 w-24"
              value={newDealValue} onChange={e => setNewDealValue(e.target.value)}
            />
            <button onClick={() => createDeal.mutate()} className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 h-[500px] overflow-x-auto pb-4 custom-scrollbar">
          {stages.map(stage => (
            <div key={stage.id} className="w-72 bg-white/5 rounded-xl border border-white/5 flex flex-col flex-shrink-0"
                 onDragOver={e => e.preventDefault()}
                 onDrop={e => {
                   const id = e.dataTransfer.getData('dealId');
                   if (id) updateDealStage(id, stage.id);
                 }}>
              <div className="p-3 border-b border-white/5">
                <h3 className="font-semibold text-white">{stage.title} <span className="text-slate-500 text-xs font-normal">({deals.filter(d => d.stage === stage.id).length})</span></h3>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {deals.filter(d => d.stage === stage.id).map(deal => (
                  <div 
                    key={deal.id} 
                    draggable
                    onDragStart={e => e.dataTransfer.setData('dealId', deal.id)}
                    className="bg-[#111113] p-3 rounded-lg border border-white/10 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 transition-colors"
                  >
                    <h4 className="font-semibold text-white text-sm">{deal.lead_name}</h4>
                    <p className="text-emerald-400 font-mono text-xs mt-1">${(deal.value || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
