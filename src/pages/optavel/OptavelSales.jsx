import React, { useState } from 'react';
import { TrendingUp, DollarSign, Plus, X, MessageSquare, Phone, Mail, FileText, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CARD = 'bg-card border border-border rounded-2xl p-5 shadow-sm';

const STAGES = [
  { id: 'lead', label: 'New Lead', color: 'slate' },
  { id: 'contacted', label: 'Contacted', color: 'blue' },
  { id: 'demo', label: 'Demo', color: 'violet' },
  { id: 'negotiating', label: 'Negotiating', color: 'amber' },
  { id: 'closed_won', label: 'Won ✓', color: 'emerald' },
];

const STAGE_STYLE = {
  lead: 'border-slate-500/30 bg-slate-500/5',
  contacted: 'border-blue-500/30 bg-blue-500/5',
  demo: 'border-violet-500/30 bg-violet-500/5',
  negotiating: 'border-amber-500/30 bg-amber-500/5',
  closed_won: 'border-emerald-500/30 bg-emerald-500/5',
};

const ACT_ICONS = { call: Phone, email: Mail, note: FileText, meeting: MessageSquare };

export default function OptavelSales() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [dealModal, setDealModal] = useState(false);
  const [activityModal, setActivityModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const [dealForm, setDealForm] = useState({ lead_name: '', value: '', contact_email: '', contact_phone: '', notes: '' });
  const [actForm, setActForm] = useState({ activity_type: 'call', notes: '' });

  const { data: deals = [] } = useQuery({
    queryKey: ['optavel_deals', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_deal_rooms WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['optavel_deal_activities', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_deal_activities WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const createDeal = async () => {
    if (!dealForm.lead_name || !dealForm.value) return toast.error('Lead name and value required');
    await powerSync.execute(
      `INSERT INTO optavel_deal_rooms (id, company_id, lead_name, value, stage, probability, contact_email, contact_phone, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, dealForm.lead_name, parseFloat(dealForm.value), 'lead', 10, dealForm.contact_email, dealForm.contact_phone, dealForm.notes, new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Deal created!');
    setDealModal(false);
    setDealForm({ lead_name:'', value:'', contact_email:'', contact_phone:'', notes:'' });
    queryClient.invalidateQueries(['optavel_deals']);
  };

  const logActivity = async () => {
    if (!actForm.notes) return toast.error('Notes are required');
    await powerSync.execute(
      `INSERT INTO optavel_deal_activities (id, company_id, deal_id, activity_type, notes, created_by, created_at) VALUES (?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, selectedDeal?.id, actForm.activity_type, actForm.notes, user.id, new Date().toISOString()]
    );
    toast.success('Activity logged!');
    setActivityModal(false);
    setActForm({ activity_type: 'call', notes: '' });
    queryClient.invalidateQueries(['optavel_deal_activities']);
  };

  const moveStage = async (dealId, newStage) => {
    await powerSync.execute(`UPDATE optavel_deal_rooms SET stage=?, updated_at=? WHERE id=?`, [newStage, new Date().toISOString(), dealId]);
    queryClient.invalidateQueries(['optavel_deals']);
  };

  const deleteDeal = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_deal_rooms WHERE id=?`, [id]);
    if (selectedDeal?.id === id) setSelectedDeal(null);
    queryClient.invalidateQueries(['optavel_deals']);
    toast.success('Deal removed');
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    if (dragging) moveStage(dragging, stageId);
    setDragging(null); setDragOver(null);
  };

  const pipelineValue = deals.filter(d => d.stage !== 'closed_won').reduce((s, d) => s + (Number(d.value)||0), 0);
  const wonValue = deals.filter(d => d.stage === 'closed_won').reduce((s, d) => s + (Number(d.value)||0), 0);
  const winRate = deals.length ? Math.round((deals.filter(d => d.stage === 'closed_won').length / deals.length) * 100) : 0;
  const dealActivities = activities.filter(a => a.deal_id === selectedDeal?.id);

  return (
    <div className="min-h-screen p-6 md:p-8 bg-background text-foreground" >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><TrendingUp className="w-7 h-7 text-primary" /></div>
            Sales Pipeline
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">CRM · Deal Rooms · Activity Log</p>
        </div>
        <Button onClick={() => setDealModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> New Deal
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pipeline Value', val: `$${pipelineValue.toLocaleString()}`, color: 'emerald' },
          { label: 'Won Revenue', val: `$${wonValue.toLocaleString()}`, color: 'blue' },
          { label: 'Win Rate', val: `${winRate}%`, color: 'violet' },
          { label: 'Total Deals', val: deals.length, color: 'amber' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${CARD}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-2xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Pipeline Kanban */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {STAGES.map(stage => {
              const stageDeal = deals.filter(d => d.stage === stage.id);
              const stageVal = stageDeal.reduce((s, d) => s + (Number(d.value)||0), 0);
              return (
                <div key={stage.id}
                  className={`w-60 rounded-2xl border-2 transition-all min-h-[400px] ${dragOver === stage.id ? `border-emerald-500/50 bg-emerald-500/5` : `border-white/8 bg-muted/50`}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, stage.id)}>
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-foreground text-xs">{stage.label}</h3>
                      <span className="text-xs text-muted-foreground">{stageDeal.length}</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-bold mt-0.5">${stageVal.toLocaleString()}</p>
                  </div>
                  <div className="p-2 space-y-2">
                    {stageDeal.map(deal => (
                      <div key={deal.id}
                        draggable
                        onDragStart={() => setDragging(deal.id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        onClick={() => setSelectedDeal(deal)}
                        className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing group transition-all hover:bg-muted/80 ${selectedDeal?.id === deal.id ? 'ring-2 ring-emerald-500' : ''} ${STAGE_STYLE[deal.stage] || 'border-border bg-muted'}`}>
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-foreground leading-snug flex-1 min-w-0 pr-2">{deal.lead_name}</p>
                          <button onClick={e => { e.stopPropagation(); deleteDeal(deal.id); }} className="p-1.5 -m-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm font-black text-emerald-400 mt-1">${Number(deal.value||0).toLocaleString()}</p>
                        {deal.contact_email && <p className="text-xs text-muted-foreground mt-1 truncate">{deal.contact_email}</p>}
                        <button onClick={e => { e.stopPropagation(); setSelectedDeal(deal); setActivityModal(true); }}
                          className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Plus className="w-3 h-3" /> Log Activity
                        </button>
                      </div>
                    ))}
                    {stageDeal.length === 0 && <div className="text-center py-8 text-slate-700 text-xs">Drop deals here</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deal Detail Panel */}
        {selectedDeal && (
          <div className="w-72 shrink-0">
            <div className={`${CARD} sticky top-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-sm">{selectedDeal.lead_name}</h3>
                <button onClick={() => setSelectedDeal(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-2xl font-black text-emerald-400 mb-4">${Number(selectedDeal.value||0).toLocaleString()}</p>
              {selectedDeal.contact_email && <p className="text-xs text-muted-foreground mb-1">📧 {selectedDeal.contact_email}</p>}
              {selectedDeal.contact_phone && <p className="text-xs text-muted-foreground mb-1">📞 {selectedDeal.contact_phone}</p>}
              {selectedDeal.notes && <p className="text-xs text-muted-foreground mt-2 mb-3 border-t border-border pt-3">{selectedDeal.notes}</p>}
              <Button size="sm" onClick={() => setActivityModal(true)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-xs mt-3">
                <Plus className="w-3 h-3" /> Log Activity
              </Button>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Activity Log</p>
                {dealActivities.length === 0 ? (
                  <p className="text-xs text-slate-600">No activities yet.</p>
                ) : dealActivities.map(act => {
                  const Icon = ACT_ICONS[act.activity_type] || FileText;
                  return (
                    <div key={act.id} className="flex gap-2 p-2 bg-muted rounded-lg">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-foreground font-medium capitalize">{act.activity_type}</p>
                        <p className="text-xs text-muted-foreground">{act.notes}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{act.created_at?.split('T')[0]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Deal Modal */}
      <Dialog open={dealModal} onOpenChange={setDealModal}>
        <DialogContent className="bg-background border border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Create Deal Room</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Lead / Company Name *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Acme Corp" value={dealForm.lead_name} onChange={e => setDealForm({...dealForm, lead_name: e.target.value})} /></div>
            <div><Label className="text-muted-foreground">Deal Value ($) *</Label><Input type="number" className="bg-muted border-border text-foreground mt-1" placeholder="50000" value={dealForm.value} onChange={e => setDealForm({...dealForm, value: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Email</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="contact@acme.com" value={dealForm.contact_email} onChange={e => setDealForm({...dealForm, contact_email: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Phone</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="+1 555 0000" value={dealForm.contact_phone} onChange={e => setDealForm({...dealForm, contact_phone: e.target.value})} /></div>
            </div>
            <div><Label className="text-muted-foreground">Notes</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Context about this deal" value={dealForm.notes} onChange={e => setDealForm({...dealForm, notes: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={createDeal} className="bg-primary hover:bg-primary/90 text-primary-foreground">Create Deal</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Modal */}
      <Dialog open={activityModal} onOpenChange={setActivityModal}>
        <DialogContent className="bg-background border border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Log Activity — {selectedDeal?.lead_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Activity Type</Label>
              <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={actForm.activity_type} onChange={e => setActForm({...actForm, activity_type: e.target.value})}>
                <option value="call">📞 Call</option><option value="email">📧 Email</option><option value="meeting">💬 Meeting</option><option value="note">📝 Note</option>
              </select>
            </div>
            <div><Label className="text-muted-foreground">Notes *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="What happened?" value={actForm.notes} onChange={e => setActForm({...actForm, notes: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={logActivity} className="bg-primary hover:bg-primary/90 text-primary-foreground">Log Activity</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
