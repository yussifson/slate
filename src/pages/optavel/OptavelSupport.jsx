import React, { useState } from 'react';
import { LifeBuoy, Inbox, BookOpen, MessageCircle, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export default function OptavelSupport() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newTicket, setNewTicket] = useState('');

  // Re-use bugs table for support tickets for demo brevity, or you can query a specific tickets table if created
  const { data: tickets = [] } = useQuery({
    queryKey: ['optavel_bugs', companyId, 'support'],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_bugs WHERE company_id = ? AND product = 'support' ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!newTicket) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_bugs (id, company_id, title, severity, status, product, reporter_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, newTicket, 'medium', 'open', 'support', user.id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_bugs']);
      setNewTicket('');
    }
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <LifeBuoy className="w-8 h-8 text-cyan-500" />
          Customer Support
        </h1>
        <p className="text-slate-400 mt-1">Ticket System, Knowledge Base, and NPS Tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Inbox className="w-5 h-5 text-cyan-400" /> Ticket Queue</h2>
            <div className="flex gap-2">
              <input 
                type="text" placeholder="New ticket..." 
                className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-cyan-500"
                value={newTicket} onChange={e => setNewTicket(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createTicket.mutate()}
              />
              <button onClick={() => createTicket.mutate()} className="p-1.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-slate-900 dark:text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {tickets.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">Queue is empty.</p>
            ) : tickets.map(ticket => (
              <div key={ticket.id} className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex justify-between items-center hover:bg-slate-200 dark:bg-white/10 transition-colors cursor-pointer">
                <div>
                  <div className="text-xs text-slate-500 mb-1">T-{ticket.id.split('-')[0]}</div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{ticket.title}</h3>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${ticket.severity === 'high' ? 'text-orange-400' : 'text-amber-400'}`}>{ticket.severity}</div>
                  <div className="text-xs text-slate-400">{ticket.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-emerald-400" /> NPS Score</h2>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-6xl font-black text-emerald-400 mb-2">68</div>
            <p className="text-sm text-slate-400">Excellent • +2 this month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
