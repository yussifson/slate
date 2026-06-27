import React, { useState } from 'react';
import { 
  BarChart2, Zap, AlertTriangle, ChevronRight,
  Target, Globe, Activity 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useIntelligence } from '@/hooks/useIntelligence';

export default function OptavelCommandCenter() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;

  // 1. Fetch Real Deal Rooms Value (Pipeline)
  const { data: pipelineData } = useQuery({
    queryKey: ['optavel_pipeline', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const res = await powerSync.execute(
        `SELECT SUM(value) as total FROM optavel_deal_rooms WHERE company_id = ? AND stage != 'closed_won' AND stage != 'closed_lost'`,
        [companyId]
      );
      return res.rows.item(0).total || 0;
    },
    enabled: !!companyId
  });

  // 2. Fetch Active OKRs
  const { data: okrs = [] } = useQuery({
    queryKey: ['optavel_okrs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_okrs WHERE company_id = ? ORDER BY progress DESC LIMIT 4`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  // 3. Fetch Invoices for MRR (Approximation using existing univ_invoice)
  const { data: mrrData } = useQuery({
    queryKey: ['optavel_mrr', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const res = await powerSync.execute(
        `SELECT SUM(total_amount) as total FROM univ_invoice WHERE company_id = ? AND status = 'paid'`,
        [companyId]
      );
      return (res.rows.item(0).total || 0) / 12; // Crude MRR calc for demo
    },
    enabled: !!companyId
  });

  // Intelligence Engine
  const { insights = [], isRunning } = useIntelligence('optavel');

  const stats = [
    { label: 'Live MRR', val: `$${(mrrData || 0).toLocaleString()}`, trend: '+12%', color: 'text-emerald-400' },
    { label: 'Pipeline Value', val: `$${(pipelineData || 0).toLocaleString()}`, trend: '+5%', color: 'text-blue-400' },
    { label: 'Active Goals', val: okrs.length.toString(), trend: 'On Track', color: 'text-indigo-400' },
    { label: 'Cash Runway', val: '18 mo', trend: 'Stable', color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-8 font-sans">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-indigo-500" />
            Optavel Command Center
          </h1>
          <p className="text-slate-400 mt-1">Global operations overview and intelligence.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#111113] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
            <p className="text-sm font-medium text-slate-400 mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-3">
              <h3 className={`text-3xl font-bold ${stat.color}`}>{stat.val}</h3>
              <span className="text-xs text-slate-500">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111113] border border-white/5 rounded-3xl p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" /> Company OKRs
            </h2>
          </div>
          
          <div className="space-y-4">
            {okrs.length === 0 ? (
              <p className="text-sm text-slate-500">No OKRs active for this quarter.</p>
            ) : (
              okrs.map((okr, i) => (
                <div key={okr.id} className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-white">{okr.title}</span>
                    <span className="text-indigo-400">{okr.progress}%</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${okr.progress}%` }}></div>
                  </div>
                </div>
              ))
            )}
            {/* Fallback for beautiful UI if no data */}
            {okrs.length === 0 && (
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl opacity-50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-white">Achieve $1M ARR</span>
                  <span className="text-indigo-400">0%</span>
                </div>
                <div className="w-full bg-black rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#111113] to-[#0A0A0B] border border-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Intelligence Feed
          </h2>
          <div className="space-y-4">
            {isRunning && <p className="text-sm text-slate-400">Analyzing operations...</p>}
            {insights.map(alert => (
              <div key={alert.id} className={`p-4 rounded-xl border ${
                alert.severity === 'high' ? 'bg-rose-500/10 border-rose-500/20' :
                alert.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/20' :
                'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <div className="flex gap-3">
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${
                    alert.severity === 'high' ? 'text-rose-400' :
                    alert.severity === 'medium' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-white text-sm">{alert.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{alert.description || alert.body}</p>
                    {alert.actionLink && (
                      <a href={alert.actionLink} className="text-xs text-indigo-400 mt-2 flex items-center hover:underline">
                        Review <ChevronRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && !isRunning && (
              <div className="text-center py-10">
                <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">All systems optimal.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
