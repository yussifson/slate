import React, { useState } from 'react';
import { LifeBuoy, Inbox, BookOpen, MessageCircle, Plus, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

export default function OptavelSupport() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newTicket, setNewTicket] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['optavel_support_tickets', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_support_tickets WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: npsData = [] } = useQuery({
    queryKey: ['optavel_nps_responses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT AVG(score) as avg_score, COUNT(*) as total FROM optavel_nps_responses WHERE company_id = ?`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const npsScore = npsData[0]?.avg_score ? Math.round(npsData[0].avg_score) : null;
  const npsTotal = npsData[0]?.total ?? 0;

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!newTicket) return;
      const id = uuidv4();
      const now = new Date().toISOString();
      await powerSync.execute(
        `INSERT INTO optavel_support_tickets (id, company_id, title, description, severity, status, reporter_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, newTicket, newDesc, newSeverity, 'open', user.id, now, now]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_support_tickets']);
      setNewTicket('');
      setNewDesc('');
      setNewSeverity('medium');
    }
  });

  const resolveTicket = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute(
        `UPDATE optavel_support_tickets SET status = 'resolved', updated_at = ? WHERE id = ?`,
        [new Date().toISOString(), id]
      );
    },
    onSuccess: () => queryClient.invalidateQueries(['optavel_support_tickets'])
  });

  const severityColor = {
    low: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    high: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    critical: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'
  };

  const openTickets = tickets.filter(t => t.status === 'open');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <LifeBuoy className="w-8 h-8 text-cyan-500" />
          Customer Support
        </h1>
        <p className="text-slate-400 mt-1">Ticket System, Knowledge Base, and NPS Tracking.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{openTickets.length}</p>
          <p className="text-xs text-slate-500 mt-1">Open Tickets</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-500">{resolvedTickets.length}</p>
          <p className="text-xs text-slate-500 mt-1">Resolved</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-cyan-500">{npsScore !== null ? npsScore : '–'}</p>
          <p className="text-xs text-slate-500 mt-1">NPS Score (live)</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{npsTotal}</p>
          <p className="text-xs text-slate-500 mt-1">NPS Responses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Ticket Panel */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" /> New Ticket
          </h2>
          <div className="space-y-3">
            <input
              type="text" placeholder="Ticket title..."
              className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              value={newTicket} onChange={e => setNewTicket(e.target.value)}
            />
            <textarea
              placeholder="Describe the issue..."
              className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 h-24 resize-none"
              value={newDesc} onChange={e => setNewDesc(e.target.value)}
            />
            <select
              value={newSeverity} onChange={e => setNewSeverity(e.target.value)}
              className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            >
              <option value="low">Low Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="high">High Severity</option>
              <option value="critical">Critical</option>
            </select>
            <Button
              onClick={() => createTicket.mutate()}
              disabled={createTicket.isPending || !newTicket}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
            >
              {createTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Ticket
            </Button>
          </div>
        </div>

        {/* Ticket Queue */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 col-span-1 md:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-cyan-400" /> Ticket Queue
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">Queue is empty.</p>
            ) : tickets.map(ticket => (
              <div key={ticket.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl flex justify-between items-center shadow-sm group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {ticket.status === 'resolved'
                    ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    : ticket.severity === 'critical' || ticket.severity === 'high'
                      ? <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      : <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  }
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 mb-0.5">T-{ticket.id.split('-')[0]}</div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{ticket.title}</h3>
                    {ticket.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{ticket.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${severityColor[ticket.severity] || 'text-slate-500 bg-slate-100'}`}>
                    {ticket.severity}
                  </span>
                  {ticket.status !== 'resolved' && (
                    <button
                      onClick={() => resolveTicket.mutate(ticket.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Mark Resolved"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
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
