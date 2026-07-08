import React, { useState } from 'react';
import { BarChart2, Target, CheckCircle, XCircle, Plus, TrendingUp, Users, DollarSign, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

const CARD = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6';
const HEAD = 'text-lg font-bold text-white flex items-center gap-2 mb-5';

export default function OptavelExecutive() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [okrModal, setOkrModal] = useState(false);
  const [decisionModal, setDecisionModal] = useState(false);
  const [editOkr, setEditOkr] = useState(null);
  const [okrForm, setOkrForm] = useState({ objective: '', key_result: '', owner: '', due_date: '', progress: 0, status: 'on_track' });
  const [decisionForm, setDecisionForm] = useState({ title: '', description: '', status: 'approved', decided_by: '' });

  const { data: okrs = [] } = useQuery({
    queryKey: ['optavel_okrs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_okrs WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['optavel_decisions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_decisions WHERE company_id = ? ORDER BY created_at DESC LIMIT 20`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: capTable = [] } = useQuery({
    queryKey: ['optavel_cap_table', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_cap_table WHERE company_id = ? ORDER BY equity_percentage DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['optavel_transactions_exec', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_transactions WHERE company_id = ? ORDER BY date ASC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  // Build chart data — last 6 months
  const chartData = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const label = months[d.getMonth()];
      const filtered = transactions.filter(t => t.date && t.date.startsWith(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`));
      const revenue = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount)||0), 0);
      const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount)||0), 0);
      return { label, revenue, expense };
    });
  })();

  const submitOkr = async () => {
    if (!okrForm.objective) return toast.error('Objective is required');
    const id = editOkr ? editOkr.id : uuidv4();
    if (editOkr) {
      await powerSync.execute(`UPDATE optavel_okrs SET objective=?, key_result=?, owner=?, due_date=?, progress=?, status=?, updated_at=? WHERE id=?`,
        [okrForm.objective, okrForm.key_result, okrForm.owner, okrForm.due_date, Number(okrForm.progress), okrForm.status, new Date().toISOString(), id]);
    } else {
      await powerSync.execute(`INSERT INTO optavel_okrs (id, company_id, objective, key_result, owner, due_date, progress, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [id, companyId, okrForm.objective, okrForm.key_result, okrForm.owner, okrForm.due_date, Number(okrForm.progress), okrForm.status, new Date().toISOString(), new Date().toISOString()]);
    }
    toast.success(editOkr ? 'OKR updated!' : 'OKR created!');
    setOkrModal(false); setEditOkr(null);
    setOkrForm({ objective: '', key_result: '', owner: '', due_date: '', progress: 0, status: 'on_track' });
    queryClient.invalidateQueries(['optavel_okrs']);
  };

  const deleteOkr = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_okrs WHERE id=?`, [id]);
    toast.success('OKR deleted'); queryClient.invalidateQueries(['optavel_okrs']);
  };

  const updateOkrProgress = async (id, delta) => {
    const okr = okrs.find(o => o.id === id);
    if (!okr) return;
    const newProg = Math.min(100, Math.max(0, (Number(okr.progress)||0) + delta));
    await powerSync.execute(`UPDATE optavel_okrs SET progress=?, updated_at=? WHERE id=?`, [newProg, new Date().toISOString(), id]);
    queryClient.invalidateQueries(['optavel_okrs']);
  };

  const submitDecision = async () => {
    if (!decisionForm.title) return toast.error('Title is required');
    await powerSync.execute(`INSERT INTO optavel_decisions (id, company_id, title, description, status, decided_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, decisionForm.title, decisionForm.description, decisionForm.status, decisionForm.decided_by, new Date().toISOString(), new Date().toISOString()]);
    toast.success('Decision logged!'); setDecisionModal(false);
    setDecisionForm({ title: '', description: '', status: 'approved', decided_by: '' });
    queryClient.invalidateQueries(['optavel_decisions']);
  };

  const updateDecision = async (id, status) => {
    await powerSync.execute(`UPDATE optavel_decisions SET status=?, updated_at=? WHERE id=?`, [status, new Date().toISOString(), id]);
    queryClient.invalidateQueries(['optavel_decisions']);
  };

  const totalEquity = capTable.reduce((s, r) => s + (Number(r.equity_percentage)||0), 0);
  const avgProgress = okrs.length ? Math.round(okrs.reduce((s, o) => s + (Number(o.progress)||0), 0) / okrs.length) : 0;

  const statusColor = (s) => ({ on_track: 'text-emerald-400 bg-emerald-400/10', at_risk: 'text-amber-400 bg-amber-400/10', off_track: 'text-red-400 bg-red-400/10' }[s] || 'text-slate-400 bg-white/5');

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'radial-gradient(ellipse at top left, #0d1f3c 0%, #0a0f1e 60%, #000 100%)' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-xl"><BarChart2 className="w-7 h-7 text-violet-400" /></div>
            Executive Command
          </h1>
          <p className="text-slate-400 mt-1 text-sm">OKRs · Decisions · Revenue · Cap Table</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setDecisionModal(true)} variant="outline" className="border-white/10 text-white hover:bg-white/10 gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" /> Log Decision
          </Button>
          <Button onClick={() => { setEditOkr(null); setOkrForm({ objective:'', key_result:'', owner:'', due_date:'', progress:0, status:'on_track' }); setOkrModal(true); }}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Plus className="w-4 h-4" /> New OKR
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active OKRs', val: okrs.length, icon: Target, color: 'violet' },
          { label: 'Avg Progress', val: `${avgProgress}%`, icon: TrendingUp, color: 'emerald' },
          { label: 'Decisions', val: decisions.length, icon: CheckCircle, color: 'blue' },
          { label: 'Shareholders', val: capTable.length, icon: Users, color: 'amber' },
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} className={`${CARD} relative overflow-hidden`}>
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-${color}-500/10 blur-xl`} />
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-3xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* OKRs */}
        <div className={`${CARD} xl:col-span-2`}>
          <div className={HEAD}><Target className="w-5 h-5 text-violet-400" /> Company Objectives (OKRs)</div>
          <div className="space-y-4">
            {okrs.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No OKRs yet. Create your first company objective.</div>
            ) : okrs.map(okr => (
              <div key={okr.id} className="p-4 bg-white/5 rounded-xl border border-white/5 group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm mb-0.5 truncate">{okr.objective}</h4>
                    {okr.key_result && <p className="text-xs text-slate-500 truncate">KR: {okr.key_result}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {okr.owner && <span className="text-xs text-slate-500">👤 {okr.owner}</span>}
                      {okr.due_date && <span className="text-xs text-slate-500">📅 {okr.due_date}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => updateOkrProgress(okr.id, -10)} className="p-1 text-slate-400 hover:text-white rounded"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => updateOkrProgress(okr.id, 10)} className="p-1 text-slate-400 hover:text-white rounded"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => { setEditOkr(okr); setOkrForm({ objective: okr.objective, key_result: okr.key_result||'', owner: okr.owner||'', due_date: okr.due_date||'', progress: okr.progress||0, status: okr.status||'on_track' }); setOkrModal(true); }}
                      className="p-1 text-slate-400 hover:text-violet-400 rounded"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteOkr(okr.id)} className="p-1 text-slate-400 hover:text-red-400 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-700"
                      style={{ width: `${Math.min(100, Number(okr.progress)||0)}%` }} />
                  </div>
                  <span className="text-sm font-black text-white w-10 text-right">{Number(okr.progress)||0}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${statusColor(okr.status)}`}>
                    {(okr.status||'').replace('_',' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className={CARD}>
          <div className={HEAD}><TrendingUp className="w-5 h-5 text-emerald-400" /> Revenue vs Expense</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} name="Revenue" />
              <Bar dataKey="expense" fill="#8b5cf6" radius={[4,4,0,0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Revenue</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />Expense</span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {/* Decision Log */}
        <div className={CARD}>
          <div className={HEAD}><CheckCircle className="w-5 h-5 text-blue-400" /> Strategic Decision Log</div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {decisions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No decisions logged yet.</div>
            ) : decisions.map(d => (
              <div key={d.id} className="p-3 bg-white/5 rounded-xl border border-white/5 group flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{d.title}</p>
                  {d.description && <p className="text-xs text-slate-500 truncate">{d.description}</p>}
                  {d.decided_by && <p className="text-xs text-slate-600 mt-0.5">By: {d.decided_by}</p>}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${d.status === 'approved' ? 'bg-emerald-400/10 text-emerald-400' : d.status === 'rejected' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-400'}`}>{d.status}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => updateDecision(d.id, 'approved')} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded"><CheckCircle className="w-3.5 h-3.5" /></button>
                    <button onClick={() => updateDecision(d.id, 'rejected')} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><XCircle className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cap Table */}
        <div className={CARD}>
          <div className={HEAD}><DollarSign className="w-5 h-5 text-amber-400" /> Cap Table</div>
          {capTable.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No shareholders recorded.</div>
          ) : (
            <div className="space-y-3">
              {capTable.map(row => (
                <div key={row.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {(row.shareholder_name||row.user_id||'?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-white truncate">{row.shareholder_name || row.user_id || 'Unknown'}</span>
                      <span className="text-amber-400 font-black">{Number(row.equity_percentage).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${totalEquity > 0 ? (Number(row.equity_percentage)/totalEquity)*100 : 0}%` }} />
                    </div>
                    {row.share_class && <p className="text-xs text-slate-600 mt-0.5">{row.share_class} · {row.vesting_schedule||''}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OKR Modal */}
      <Dialog open={okrModal} onOpenChange={setOkrModal}>
        <DialogContent className="bg-[#0f172a] border border-white/10 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editOkr ? 'Edit OKR' : 'Create Company Objective'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300">Objective *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Reach $1M ARR by Q4" value={okrForm.objective} onChange={e => setOkrForm({...okrForm, objective: e.target.value})} /></div>
            <div><Label className="text-slate-300">Key Result</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. 20 new enterprise clients" value={okrForm.key_result} onChange={e => setOkrForm({...okrForm, key_result: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Owner</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Team or person" value={okrForm.owner} onChange={e => setOkrForm({...okrForm, owner: e.target.value})} /></div>
              <div><Label className="text-slate-300">Due Date</Label><Input type="date" className="bg-white/5 border-white/10 text-white mt-1" value={okrForm.due_date} onChange={e => setOkrForm({...okrForm, due_date: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Progress ({okrForm.progress}%)</Label><Input type="range" min="0" max="100" className="mt-2 w-full accent-violet-500" value={okrForm.progress} onChange={e => setOkrForm({...okrForm, progress: e.target.value})} /></div>
              <div><Label className="text-slate-300">Status</Label>
                <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm" value={okrForm.status} onChange={e => setOkrForm({...okrForm, status: e.target.value})}>
                  <option value="on_track">On Track</option><option value="at_risk">At Risk</option><option value="off_track">Off Track</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitOkr} className="bg-violet-600 hover:bg-violet-700 text-white">{editOkr ? 'Update OKR' : 'Create OKR'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decision Modal */}
      <Dialog open={decisionModal} onOpenChange={setDecisionModal}>
        <DialogContent className="bg-[#0f172a] border border-white/10 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Log Strategic Decision</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300">Decision Title *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Approve Q3 hiring plan" value={decisionForm.title} onChange={e => setDecisionForm({...decisionForm, title: e.target.value})} /></div>
            <div><Label className="text-slate-300">Details / Context</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Why was this decided?" value={decisionForm.description} onChange={e => setDecisionForm({...decisionForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Decided By</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Name or role" value={decisionForm.decided_by} onChange={e => setDecisionForm({...decisionForm, decided_by: e.target.value})} /></div>
              <div><Label className="text-slate-300">Status</Label>
                <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm" value={decisionForm.status} onChange={e => setDecisionForm({...decisionForm, status: e.target.value})}>
                  <option value="approved">Approved</option><option value="rejected">Rejected</option><option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitDecision} className="bg-blue-600 hover:bg-blue-700 text-white">Log Decision</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
