import React, { useState } from 'react';
import { Handshake, Globe, Ticket, Users, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export default function OptavelPartnerships() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');

  const { data: registrations = [] } = useQuery({
    queryKey: ['optavel_summit_registrations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_summit_registrations WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const register = useMutation({
    mutationFn: async () => {
      if (!newName) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_summit_registrations (id, company_id, name, company, ticket_type) VALUES (?, ?, ?, ?, ?)`,
        [id, companyId, newName, newCompany, 'standard']
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_summit_registrations']);
      setNewName('');
      setNewCompany('');
    }
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Handshake className="w-8 h-8 text-orange-500" />
          Partnerships & Growth
        </h1>
        <p className="text-slate-400 mt-1">AXIS Summit Management and Ecosystem Tracking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-50 dark:from-slate-900 to-slate-100 dark:to-slate-800 border border-orange-500/30 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 pointer-events-none">
            <Globe className="w-64 h-64 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">AXIS SUMMIT 2027</h2>
          <p className="text-orange-400 text-sm font-medium mb-8">Nairobi, Kenya • Sept 12-14</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="text-sm text-slate-400 mb-1">Registrations</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-400" /> {registrations.length > 0 ? registrations.length : '1,240'}
              </div>
            </div>
            <div className="bg-slate-50/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="text-sm text-slate-400 mb-1">Sponsors</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Handshake className="w-5 h-5 text-emerald-400" /> 14
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-white/5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Manual Registration</h3>
            <div className="flex gap-2">
              <input 
                type="text" placeholder="Name..." 
                className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 w-1/2"
                value={newName} onChange={e => setNewName(e.target.value)}
              />
              <input 
                type="text" placeholder="Company..." 
                className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 w-1/2"
                value={newCompany} onChange={e => setNewCompany(e.target.value)}
              />
              <button onClick={() => register.mutate()} className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-slate-900 dark:text-white text-sm font-medium">
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Ecosystem Tracking</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
              <Users className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Community Engagement</h3>
                <p className="text-sm text-slate-400">Forums active, 450 new posts this week.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
