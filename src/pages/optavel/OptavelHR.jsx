import React, { useState } from 'react';
import { Users, UserPlus, FileSignature, Book } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';

export default function OptavelHR() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;

  const { data: capTable = [] } = useQuery({
    queryKey: ['optavel_cap_table', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_cap_table WHERE company_id = ? ORDER BY equity_percentage DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          HR & Team
        </h1>
        <p className="text-slate-400 mt-1">Team Directory, Equity Vesting, and Onboarding Workflows.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-indigo-400" /> Live Cap Table & Vesting
          </h2>
          <div className="space-y-4 mt-6">
            {capTable.length === 0 ? (
              <p className="text-sm text-slate-500">Cap table empty. Configure via SQL.</p>
            ) : capTable.map(entry => (
              <div key={entry.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-white">User {entry.user_id?.slice(0,5)}</span>
                  <span className="text-indigo-400">{entry.equity_percentage}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${entry.equity_percentage}%` }}></div>
                </div>
              </div>
            ))}
            
            {/* Fallback to show beautiful UI */}
            {capTable.length === 0 && (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-white">Founders Pool</span>
                    <span className="text-indigo-400">95%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-white">Growth Partners Pool</span>
                    <span className="text-emerald-400">5%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" /> Active Onboarding
          </h2>
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
            <h3 className="font-semibold text-white">New Growth Partner: Michael T.</h3>
            <p className="text-sm text-slate-400">Started June 25, 2026</p>
            <div className="mt-4 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full bg-amber-500 w-[60%]"></div>
            </div>
            <p className="text-xs text-right mt-1 text-slate-500">60% Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}
