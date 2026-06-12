import React, { useState, useMemo } from 'react';

import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  ShieldAlert, Plus, Search, Filter, AlertTriangle, 
  CheckCircle2, AlertCircle, ShieldCheck, Edit3, Trash2,
  TrendingUp, Activity, Crosshair
} from 'lucide-react';

// Impact (1-5), Likelihood (1-5)
const RISK_SCORES = {
  Low: { min: 1, max: 4, color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800', badge: 'bg-emerald-500' },
  Medium: { min: 5, max: 12, color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800', badge: 'bg-amber-500' },
  High: { min: 15, max: 20, color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800', badge: 'bg-orange-500' },
  Extreme: { min: 25, max: 25, color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800', badge: 'bg-red-500' }
};

const getRiskLevel = (score) => {
  if (score >= 25) return 'Extreme';
  if (score >= 15) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
};

export default function UnivRiskManagement({
  title = 'Risk Management',
  companyId,
  pageName,
  tableName
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hookCompanyId = useCompanyId();
  const effectiveCompanyId = companyId || hookCompanyId;
  const effectivePageName = pageName || 'risks';
  const targetTable = tableName || 'industry_records';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [view, setView] = useState('list'); // list or matrix

  const [formState, setFormState] = useState({
    title: '',
    category: 'Operational',
    impact: 3,
    likelihood: 3,
    status: 'Open',
    owner: '',
    mitigation_plan: ''
  });

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks', effectiveCompanyId, effectivePageName],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
      if (targetTable === 'industry_records') {
        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_risks`);
      }
      const { data, error } = await query;
      if (error && error.code !== '42P01') throw error;
      return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r) }));
    },
    enabled: !!effectiveCompanyId
  });

  const filteredRisks = useMemo(() => {
    let filtered = risks;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.title || '').toLowerCase().includes(q) || 
        (r.category || '').toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => (Number(b.impact) * Number(b.likelihood)) - (Number(a.impact) * Number(a.likelihood)));
  }, [risks, searchQuery]);

  const saveMutation = useMutation({
    mutationFn: async (riskData) => {
      const isNew = !riskData.id;
      let payload;
      if (targetTable === 'industry_records') {
        payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_risks`, data: riskData };
      } else {
        payload = { ...riskData, company_id: effectiveCompanyId };
      }

      if (isNew) {
        const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO targetTable (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
        if (error) throw error;
      } else {
        const updatePayload = targetTable === 'industry_records' ? { data: riskData } : riskData;
        await (async () => { const _p = updatePayload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, riskData.id]); })();
      const error = null; const data = [];
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['risks', effectiveCompanyId, effectivePageName]);
      setIsModalOpen(false);
      toast({ title: 'Risk record saved successfully.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute(`DELETE FROM targetTable WHERE id = ?`, [id]);
      const error = null;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['risks', effectiveCompanyId, effectivePageName]);
      toast({ title: 'Risk deleted.' });
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!formState.title) return;
    saveMutation.mutate(formState);
  };

  const openNewModal = () => {
    setEditingRisk(null);
    setFormState({
      title: '',
      category: 'Operational',
      impact: 3,
      likelihood: 3,
      status: 'Open',
      owner: '',
      mitigation_plan: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (risk) => {
    setEditingRisk(risk);
    setFormState({ ...risk });
    setIsModalOpen(true);
  };

  // Matrix generation
  const matrixCells = useMemo(() => {
    const cells = [];
    for (let i = 5; i >= 1; i--) { // Impact (y-axis)
      for (let j = 1; j <= 5; j++) { // Likelihood (x-axis)
        const score = i * j;
        const level = getRiskLevel(score);
        const cellRisks = filteredRisks.filter(r => Number(r.impact) === i && Number(r.likelihood) === j && r.status === 'Open');
        cells.push({ impact: i, likelihood: j, score, level, risks: cellRisks });
      }
    }
    return cells;
  }, [filteredRisks]);

  return (
    <div className="flex flex-col h-full bg-background font-sans">
      
      {/* Header */}
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" /> {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Identify, assess, and mitigate enterprise risks.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted p-1 rounded-lg">
              <button onClick={() => setView('list')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", view === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Register</button>
              <button onClick={() => setView('matrix')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", view === 'matrix' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Matrix</button>
            </div>
            <button 
              onClick={openNewModal}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Risk
            </button>
          </div>
        </div>

        {view === 'list' && (
          <div className="mt-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search risks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button className="h-10 px-4 bg-background border border-border rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors shadow-sm">
              <Filter className="w-4 h-4 text-muted-foreground" /> Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          {view === 'list' ? (
            filteredRisks.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-foreground">No risks identified</h3>
                <p className="text-sm mt-1">Add risks to build your register.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Risk Title & Category</th>
                      <th className="px-6 py-4 font-semibold text-center">Score (I × L)</th>
                      <th className="px-6 py-4 font-semibold">Risk Level</th>
                      <th className="px-6 py-4 font-semibold">Owner</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRisks.map(risk => {
                      const score = Number(risk.impact) * Number(risk.likelihood);
                      const level = getRiskLevel(score);
                      const levelConfig = RISK_SCORES[level];

                      return (
                        <tr key={risk.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground">{risk.title}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Crosshair className="w-3 h-3" /> {risk.category}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="font-mono font-bold text-lg">{score}</div>
                            <div className="text-[10px] text-muted-foreground">I:{risk.impact} × L:{risk.likelihood}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border", levelConfig.color)}>
                              {level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-foreground font-medium">{risk.owner || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={cn("flex items-center gap-1.5 text-xs font-semibold", risk.status === 'Open' ? "text-amber-600" : "text-emerald-600")}>
                              {risk.status === 'Open' ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              {risk.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(risk)} className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => { if(window.confirm('Delete risk?')) deleteMutation.mutate(risk.id); }} className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/30">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // MATRIX VIEW
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-10">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Risk Heatmap</h2>
                  <p className="text-sm text-muted-foreground">Mapping open risks based on Impact (Y) and Likelihood (X).</p>
                </div>
                <div className="flex gap-4">
                  {Object.entries(RISK_SCORES).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                      <div className={cn("w-3 h-3 rounded-full", config.badge)}></div> {key}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative pl-8 pb-8">
                {/* Y-Axis Label */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-bold uppercase tracking-widest text-muted-foreground origin-center h-4 w-32 text-center -ml-16">
                  Impact (Severity)
                </div>

                <div className="grid grid-cols-5 gap-2 h-[500px]">
                  {matrixCells.map((cell, idx) => {
                    const levelConfig = RISK_SCORES[cell.level];
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "rounded-xl border flex flex-col p-2 relative overflow-hidden transition-all hover:ring-2 ring-primary/50",
                          levelConfig.color.split(' ')[0], // bg color
                          levelConfig.color.split(' ')[2], // border color
                          "bg-opacity-30 dark:bg-opacity-20"
                        )}
                      >
                        <div className="text-[10px] font-bold opacity-40 absolute top-2 left-2">{cell.impact}×{cell.likelihood}</div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-1 pt-4">
                          {cell.risks.length > 0 ? (
                            <>
                              <div className="text-2xl font-black text-foreground">{cell.risks.length}</div>
                              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Risks</div>
                            </>
                          ) : (
                            <span className="opacity-20">-</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* X-Axis Label */}
                <div className="absolute bottom-0 left-8 right-0 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground h-8 pt-4">
                  Likelihood (Probability)
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit/New Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  {editingRisk ? 'Edit Risk Record' : 'Log New Risk'}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="risk-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Risk Title *</label>
                      <input required type="text" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Category</label>
                      <select value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none">
                        <option>Operational</option>
                        <option>Financial</option>
                        <option>Strategic</option>
                        <option>Compliance</option>
                        <option>Cybersecurity</option>
                        <option>Reputational</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Owner</label>
                      <input type="text" value={formState.owner} onChange={e => setFormState({...formState, owner: e.target.value})} placeholder="Person/Team responsible" className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-xl p-4 grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-3">Impact (Severity)</label>
                      <input type="range" min="1" max="5" value={formState.impact} onChange={e => setFormState({...formState, impact: parseInt(e.target.value)})} className="w-full accent-primary" />
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-1">
                        <span>1: Negligible</span>
                        <span>5: Catastrophic</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-3">Likelihood (Probability)</label>
                      <input type="range" min="1" max="5" value={formState.likelihood} onChange={e => setFormState({...formState, likelihood: parseInt(e.target.value)})} className="w-full accent-primary" />
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-1">
                        <span>1: Rare</span>
                        <span>5: Almost Certain</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-between bg-card border border-border rounded-lg p-3">
                      <span className="text-sm font-bold text-foreground">Calculated Risk Score:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xl">{formState.impact * formState.likelihood}</span>
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border", RISK_SCORES[getRiskLevel(formState.impact * formState.likelihood)].color)}>
                          {getRiskLevel(formState.impact * formState.likelihood)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Mitigation Plan</label>
                    <textarea value={formState.mitigation_plan} onChange={e => setFormState({...formState, mitigation_plan: e.target.value})} placeholder="Steps taken to reduce probability or impact..." className="w-full h-24 p-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none resize-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Status</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormState({...formState, status: 'Open'})} className={cn("flex-1 h-10 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors border", formState.status === 'Open' ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800" : "bg-background text-muted-foreground border-border")}>Open</button>
                      <button type="button" onClick={() => setFormState({...formState, status: 'Closed/Mitigated'})} className={cn("flex-1 h-10 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors border", formState.status === 'Closed/Mitigated' ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800" : "bg-background text-muted-foreground border-border")}>Closed / Mitigated</button>
                    </div>
                  </div>

                </form>
              </div>
              
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" form="risk-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving...' : 'Save Risk'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
