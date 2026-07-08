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

const CARD = 'bg-card border border-border rounded-2xl p-6 shadow-sm';
const HEAD = 'text-lg font-bold text-foreground flex items-center gap-2 mb-5';

const SEV_COLORS = {
  critical: 'bg-primary/10 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-primary/10 text-amber-400 border-amber-500/30',
  low: 'bg-slate-500/20 text-muted-foreground border-slate-500/30',
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
    <div className="min-h-screen p-6 md:p-8 bg-background text-foreground" >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><LifeBuoy className="w-7 h-7 text-primary" /></div>
            Support & CX
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Helpdesk · NPS · Customer Health</p>
        </div>
        <Button onClick={() => setTicketModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
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
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-2xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 ${CARD}`}>
          <div className={HEAD}><AlertCircle className="w-5 h-5 text-primary" /> Ticket Queue</div>
          {tickets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">Inbox zero!</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="pb-3 pr-4">Ticket</th><th className="pb-3 pr-4">Customer</th><th className="pb-3 pr-4">Severity</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.map(t => (
                  <tr key={t.id} className="group">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-foreground truncate max-w-xs">{t.title}</p>
                      {t.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{t.description}</p>}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">{t.customer_name || 'Unknown'}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold capitalize ${SEV_COLORS[t.severity] || 'bg-muted text-muted-foreground border-border'}`}>{t.severity}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                        className="bg-muted border border-border rounded-md px-2 py-1 text-xs text-foreground">
                        <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <button onClick={() => deleteTicket(t.id)} className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={CARD}>
          <div className={HEAD}><HeartPulse className="w-5 h-5 text-primary" /> Recent NPS</div>
          {nps.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No feedback received yet.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nps.map(n => (
                <div key={n.id} className="p-3 bg-muted rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-foreground text-sm">{n.customer_name || 'Anonymous'}</span>
                    <span className={`font-black ${Number(n.score) >= 9 ? 'text-emerald-400' : Number(n.score) >= 7 ? 'text-amber-400' : 'text-red-400'}`}>{n.score}/10</span>
                  </div>
                  {n.feedback && <p className="text-xs text-muted-foreground italic">"{n.feedback}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={ticketModal} onOpenChange={setTicketModal}>
        <DialogContent className="bg-background border border-border text-foreground">
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Title *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Issue summary" value={ticketForm.title} onChange={e => setTicketForm({...ticketForm, title: e.target.value})} /></div>
            <div><Label className="text-muted-foreground">Customer Name</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Who is reporting this?" value={ticketForm.customer_name} onChange={e => setTicketForm({...ticketForm, customer_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Severity</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={ticketForm.severity} onChange={e => setTicketForm({...ticketForm, severity: e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div><Label className="text-muted-foreground">Status</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={ticketForm.status} onChange={e => setTicketForm({...ticketForm, status: e.target.value})}>
                  <option value="open">Open</option><option value="in_progress">In Progress</option>
                </select>
              </div>
            </div>
            <div><Label className="text-muted-foreground">Description</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Details..." value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={submitTicket} className="bg-primary hover:bg-primary/90 text-primary-foreground">Create Ticket</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
