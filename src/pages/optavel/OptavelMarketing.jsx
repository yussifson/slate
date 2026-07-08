import React, { useState } from 'react';
import { Megaphone, Search, TrendingUp, TrendingDown, Plus, X, Edit2, BarChart2, DollarSign } from 'lucide-react';
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

const STATUS_COLOR = {
  active: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
  paused: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  draft: 'bg-slate-500/15 text-muted-foreground border-slate-500/30',
  completed: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
};

const CHANNELS = ['SEO', 'Paid Ads', 'Email', 'Social', 'Content', 'Events', 'Partnerships', 'PR'];

export default function OptavelMarketing() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('campaigns');
  const [campaignModal, setCampaignModal] = useState(false);
  const [seoModal, setSeoModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [search, setSearch] = useState('');

  const [campaignForm, setCampaignForm] = useState({ title: '', channel: 'SEO', status: 'draft', budget: '', spent: '', goal: '', start_date: '', end_date: '' });
  const [seoForm, setSeoForm] = useState({ keyword: '', rank: '', previous_rank: '', search_volume: '', url: '' });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['optavel_campaigns', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_campaigns WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: seoKeywords = [] } = useQuery({
    queryKey: ['optavel_seo', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_seo_tracking WHERE company_id = ? ORDER BY rank ASC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const submitCampaign = async () => {
    if (!campaignForm.title) return toast.error('Title is required');
    if (editCampaign) {
      await powerSync.execute(`UPDATE optavel_campaigns SET title=?,channel=?,status=?,budget=?,spent=?,goal=?,start_date=?,end_date=?,updated_at=? WHERE id=?`,
        [campaignForm.title, campaignForm.channel, campaignForm.status, Number(campaignForm.budget)||0, Number(campaignForm.spent)||0, campaignForm.goal, campaignForm.start_date, campaignForm.end_date, new Date().toISOString(), editCampaign.id]);
      toast.success('Campaign updated!');
    } else {
      await powerSync.execute(`INSERT INTO optavel_campaigns (id, company_id, title, channel, status, budget, spent, goal, start_date, end_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), companyId, campaignForm.title, campaignForm.channel, campaignForm.status, Number(campaignForm.budget)||0, Number(campaignForm.spent)||0, campaignForm.goal, campaignForm.start_date, campaignForm.end_date, new Date().toISOString(), new Date().toISOString()]);
      toast.success('Campaign created!');
    }
    setCampaignModal(false); setEditCampaign(null);
    setCampaignForm({ title: '', channel: 'SEO', status: 'draft', budget: '', spent: '', goal: '', start_date: '', end_date: '' });
    queryClient.invalidateQueries(['optavel_campaigns']);
  };

  const submitSeo = async () => {
    if (!seoForm.keyword) return toast.error('Keyword is required');
    await powerSync.execute(`INSERT INTO optavel_seo_tracking (id, company_id, keyword, rank, previous_rank, search_volume, url, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, seoForm.keyword, Number(seoForm.rank)||0, Number(seoForm.previous_rank)||0, Number(seoForm.search_volume)||0, seoForm.url, new Date().toISOString(), new Date().toISOString()]);
    toast.success('Keyword tracked!'); setSeoModal(false);
    setSeoForm({ keyword: '', rank: '', previous_rank: '', search_volume: '', url: '' });
    queryClient.invalidateQueries(['optavel_seo']);
  };

  const deleteCampaign = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_campaigns WHERE id=?`, [id]);
    toast.success('Deleted'); queryClient.invalidateQueries(['optavel_campaigns']);
  };

  const deleteSeo = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_seo_tracking WHERE id=?`, [id]);
    queryClient.invalidateQueries(['optavel_seo']);
  };

  const totalBudget = campaigns.reduce((s, c) => s + (Number(c.budget)||0), 0);
  const totalSpent = campaigns.reduce((s, c) => s + (Number(c.spent)||0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  const filtered = campaigns.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-6 md:p-8 bg-background text-foreground" >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><Megaphone className="w-7 h-7 text-primary" /></div>
            Marketing Hub
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Campaigns · SEO · Budget Tracker</p>
        </div>
        <div className="flex gap-2">
          {tab === 'campaigns' && (
            <Button onClick={() => { setEditCampaign(null); setCampaignForm({ title:'', channel:'SEO', status:'draft', budget:'', spent:'', goal:'', start_date:'', end_date:'' }); setCampaignModal(true); }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Campaign
            </Button>
          )}
          {tab === 'seo' && (
            <Button onClick={() => setSeoModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm">
              <Plus className="w-4 h-4" /> Track Keyword
            </Button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Campaigns', val: campaigns.length, color: 'pink' },
          { label: 'Active', val: activeCampaigns, color: 'emerald' },
          { label: 'Total Budget', val: `$${totalBudget.toLocaleString()}`, color: 'blue' },
          { label: 'Total Spent', val: `$${totalSpent.toLocaleString()}`, color: 'amber' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${CARD}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-2xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit border border-border">
        {[['campaigns','Campaigns'], ['seo','SEO Tracker']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-pink-600 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Campaigns Tab */}
      {tab === 'campaigns' && (
        <div className={CARD}>
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search campaigns..." className="pl-9 bg-muted border-border text-foreground" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No campaigns yet. Launch your first campaign.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => {
                const budgetPct = c.budget > 0 ? Math.min(100, Math.round((Number(c.spent)||0) / Number(c.budget) * 100)) : 0;
                return (
                  <div key={c.id} className="p-4 bg-muted rounded-xl border border-border group flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-foreground text-sm">{c.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold capitalize ${STATUS_COLOR[c.status] || 'bg-muted text-muted-foreground border-border'}`}>{c.status}</span>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">{c.channel}</span>
                      </div>
                      {c.goal && <p className="text-xs text-muted-foreground mb-2">Goal: {c.goal}</p>}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-1.5 max-w-xs">
                          <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500" style={{ width: `${budgetPct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">${Number(c.spent||0).toLocaleString()} / ${Number(c.budget||0).toLocaleString()}</span>
                        <span className="text-xs font-bold text-pink-400">{budgetPct}% spent</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditCampaign(c); setCampaignForm({ title:c.title, channel:c.channel||'SEO', status:c.status||'draft', budget:c.budget||'', spent:c.spent||'', goal:c.goal||'', start_date:c.start_date||'', end_date:c.end_date||'' }); setCampaignModal(true); }}
                        className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteCampaign(c.id)} className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-400/10"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SEO Tab */}
      {tab === 'seo' && (
        <div className={CARD}>
          <div className={HEAD}><BarChart2 className="w-5 h-5 text-primary" /> SEO Keyword Tracker</div>
          {seoKeywords.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No keywords tracked yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="pb-3 pr-4">Keyword</th><th className="pb-3 pr-4">Rank</th><th className="pb-3 pr-4">Change</th><th className="pb-3 pr-4">Vol/mo</th><th className="pb-3 pr-4">URL</th><th className="pb-3">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {seoKeywords.map(kw => {
                  const delta = (Number(kw.previous_rank)||0) - (Number(kw.rank)||0);
                  return (
                    <tr key={kw.id} className="group">
                      <td className="py-3 pr-4 font-semibold text-foreground">{kw.keyword}</td>
                      <td className="py-3 pr-4 text-2xl font-black text-violet-400">#{kw.rank}</td>
                      <td className="py-3 pr-4">
                        {delta > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs"><TrendingUp className="w-3.5 h-3.5" />+{delta}</span>
                        ) : delta < 0 ? (
                          <span className="flex items-center gap-1 text-red-400 font-semibold text-xs"><TrendingDown className="w-3.5 h-3.5" />{delta}</span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">{Number(kw.search_volume||0).toLocaleString()}</td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs truncate max-w-[150px]">{kw.url || '—'}</td>
                      <td className="py-3">
                        <button onClick={() => deleteSeo(kw.id)} className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Campaign Modal */}
      <Dialog open={campaignModal} onOpenChange={setCampaignModal}>
        <DialogContent className="bg-background border border-border text-foreground max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editCampaign ? 'Edit Campaign' : 'New Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-muted-foreground">Campaign Title *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="e.g. Q3 Launch Campaign" value={campaignForm.title} onChange={e => setCampaignForm({...campaignForm, title: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Channel</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={campaignForm.channel} onChange={e => setCampaignForm({...campaignForm, channel: e.target.value})}>
                  {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
              <div><Label className="text-muted-foreground">Status</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={campaignForm.status} onChange={e => setCampaignForm({...campaignForm, status: e.target.value})}>
                  <option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div><Label className="text-muted-foreground">Goal / Objective</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="What's the campaign goal?" value={campaignForm.goal} onChange={e => setCampaignForm({...campaignForm, goal: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Budget ($)</Label><Input type="number" className="bg-muted border-border text-foreground mt-1" placeholder="10000" value={campaignForm.budget} onChange={e => setCampaignForm({...campaignForm, budget: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Spent ($)</Label><Input type="number" className="bg-muted border-border text-foreground mt-1" placeholder="0" value={campaignForm.spent} onChange={e => setCampaignForm({...campaignForm, spent: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Start Date</Label><Input type="date" className="bg-muted border-border text-foreground mt-1" value={campaignForm.start_date} onChange={e => setCampaignForm({...campaignForm, start_date: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">End Date</Label><Input type="date" className="bg-muted border-border text-foreground mt-1" value={campaignForm.end_date} onChange={e => setCampaignForm({...campaignForm, end_date: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitCampaign} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editCampaign ? 'Update' : 'Create Campaign'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEO Modal */}
      <Dialog open={seoModal} onOpenChange={setSeoModal}>
        <DialogContent className="bg-background border border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Track SEO Keyword</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Keyword *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="e.g. construction management software" value={seoForm.keyword} onChange={e => setSeoForm({...seoForm, keyword: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-muted-foreground">Current Rank</Label><Input type="number" className="bg-muted border-border text-foreground mt-1" placeholder="1" value={seoForm.rank} onChange={e => setSeoForm({...seoForm, rank: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Prev. Rank</Label><Input type="number" className="bg-muted border-border text-foreground mt-1" placeholder="5" value={seoForm.previous_rank} onChange={e => setSeoForm({...seoForm, previous_rank: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Volume/mo</Label><Input type="number" className="bg-muted border-border text-foreground mt-1" placeholder="1200" value={seoForm.search_volume} onChange={e => setSeoForm({...seoForm, search_volume: e.target.value})} /></div>
            </div>
            <div><Label className="text-muted-foreground">Target URL</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="https://..." value={seoForm.url} onChange={e => setSeoForm({...seoForm, url: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={submitSeo} className="bg-primary hover:bg-primary/90 text-primary-foreground">Track Keyword</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
