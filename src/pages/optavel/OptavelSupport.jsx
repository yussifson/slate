import React, { useState } from 'react';
import { LifeBuoy, AlertCircle, Plus, X, MessageSquare, Clock, HeartPulse } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CARD = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6';
const HEAD = 'text-lg font-bold text-white flex items-center gap-2 mb-5';

const SEV_COLORS = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function OptavelSupport() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [ticketModal, setTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', severity: 'medium', status: 'open', customer_name: '' });

  const { data: tickets = [] } = useQuery({
    queryKey: ['optavel_support_tickets', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_support_tickets WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: nps = [] } = useQuery({
    queryKey: ['optavel_nps_responses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_nps_responses WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const submitTicket = async () => {
    if (!ticketForm.title) return toast.error('Title is required');
    await powerSync.execute(
      `INSERT INTO optavel_support_tickets (id, company_id, title, description, severity, status, customer_name, reporter_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, ticketForm.title, ticketForm.description, ticketForm.severity, ticketForm.status, ticketForm.customer_name, user.id, new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Ticket created!');
    setTicketModal(false);
    setTicketForm({ title: '', description: '', severity: 'medium', status: 'open', customer_name: '' });
    queryClient.invalidateQueries(['optavel_support_tickets']);
  };

  const deleteTicket = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_support_tickets WHERE id=?`, [id]);
    queryClient.invalidateQueries(['optavel_support_tickets']);
  };

  const updateStatus = async (id, status) => {
    await powerSync.execute(`UPDATE optavel_support_tickets SET status=?, updated_at=? WHERE id=?`, [status, new Date().toISOString(), id]);
    queryClient.invalidateQueries(['optavel_support_tickets']);
  };

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const avgNps = nps.length ? Math.round(nps.reduce((s, n) => s + (Number(n.score)||0), 0) / nps.length) : 0;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'radial-gradient(ellipse at center, #1e3a5f 0%, #0a0f1e 50%, #000 100%)' }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl"><LifeBuoy className="w-7 h-7 text-blue-400" /></div>
            Support & CX
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Helpdesk · NPS · Customer Health</p>
        </div>
        <Button onClick={() => setTicketModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tickets', val: tickets.length, color: 'blue' },
          { label: 'Open Tickets', val: openTickets, color: 'red' },
          { label: 'NPS Score', val: avgNps ? `+${avgNps}` : 'N/A', color: 'emerald' },
          { label: 'Avg Response', val: '2.4 hrs', color: 'amber' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${CARD}`}>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-2xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 ${CARD}`}>
          <div className={HEAD}><AlertCircle className="w-5 h-5 text-blue-400" /> Ticket Queue</div>
          {tickets.length === 0 ? (
            <div className="text-center py-16 text-slate-500">Inbox zero!</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="pb-3 pr-4">Ticket</th><th className="pb-3 pr-4">Customer</th><th className="pb-3 pr-4">Severity</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.map(t => (
                  <tr key={t.id} className="group">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-white truncate max-w-xs">{t.title}</p>
                      {t.description && <p className="text-xs text-slate-500 truncate max-w-xs">{t.description}</p>}
                    </td>
                    <td className="py-3 pr-4 text-slate-300 text-xs">{t.customer_name || 'Unknown'}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold capitalize ${SEV_COLORS[t.severity] || 'bg-white/5 text-slate-400 border-white/10'}`}>{t.severity}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white">
                        <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <button onClick={() => deleteTicket(t.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={CARD}>
          <div className={HEAD}><HeartPulse className="w-5 h-5 text-emerald-400" /> Recent NPS</div>
          {nps.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No feedback received yet.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nps.map(n => (
                <div key={n.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-white text-sm">{n.customer_name || 'Anonymous'}</span>
                    <span className={`font-black ${Number(n.score) >= 9 ? 'text-emerald-400' : Number(n.score) >= 7 ? 'text-amber-400' : 'text-red-400'}`}>{n.score}/10</span>
                  </div>
                  {n.feedback && <p className="text-xs text-slate-400 italic">"{n.feedback}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={ticketModal} onOpenChange={setTicketModal}>
        <DialogContent className="bg-[#0f172a] border border-white/10 text-white">
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300">Title *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Issue summary" value={ticketForm.title} onChange={e => setTicketForm({...ticketForm, title: e.target.value})} /></div>
            <div><Label className="text-slate-300">Customer Name</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Who is reporting this?" value={ticketForm.customer_name} onChange={e => setTicketForm({...ticketForm, customer_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Severity</Label>
                <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm" value={ticketForm.severity} onChange={e => setTicketForm({...ticketForm, severity: e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div><Label className="text-slate-300">Status</Label>
                <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm" value={ticketForm.status} onChange={e => setTicketForm({...ticketForm, status: e.target.value})}>
                  <option value="open">Open</option><option value="in_progress">In Progress</option>
                </select>
              </div>
            </div>
            <div><Label className="text-slate-300">Description</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Details..." value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={submitTicket} className="bg-blue-600 hover:bg-blue-700 text-white">Create Ticket</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
