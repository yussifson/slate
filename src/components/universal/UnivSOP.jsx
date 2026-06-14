import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useMemo } from 'react';

import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  BookOpen, Plus, Search, ChevronRight, CheckCircle2, 
  Circle, Play, Pause, RefreshCw, FileText, Settings,
  AlertCircle, MoreVertical, Edit3, Trash2
} from 'lucide-react';

export default function UnivSOP({
  title = 'Standard Operating Procedures',
  companyId,
  pageName,
  tableName
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hookCompanyId = useCompanyId();
  const effectiveCompanyId = companyId || hookCompanyId;
  const effectivePageName = pageName || 'sop';
  const targetTable = tableName || 'industry_records';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSOPId, setActiveSOPId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSOP, setEditingSOP] = useState(null);

  // Active Execution State
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const { data: sops = [], isLoading } = useQuery({
    queryKey: ['sops', effectiveCompanyId, effectivePageName],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
      if (targetTable === 'industry_records') {
        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_sops`);
      }
      const { data, error } = await query;
      if (error && error.code !== '42P01') throw error;
      return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r) }));
    },
    enabled: !!effectiveCompanyId
  });

  const filteredSOPs = useMemo(() => {
    let filtered = sops;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (s.title || '').toLowerCase().includes(q) || 
        (s.department || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [sops, searchQuery]);

  const activeSOP = useMemo(() => sops.find(s => s.id === activeSOPId), [sops, activeSOPId]);

  const saveMutation = useMutation({
    mutationFn: async (sopData) => {
      const isNew = !sopData.id;
      let payload;
      if (targetTable === 'industry_records') {
        payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_sops`, data: sopData };
      } else {
        payload = { ...sopData, company_id: effectiveCompanyId };
      }

      if (isNew) {
        await (async () => { const _p = payload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); const _pl = _k.map(()=>'?').join(', '); await powerSync.execute(`INSERT INTO ${targetTable} (${_k.join(', ')}) VALUES (${_pl})`, _v); })();
      const error = null; const data = [];
        if (error) throw error;
        return data;
      } else {
        const updatePayload = targetTable === 'industry_records' ? { data: sopData } : sopData;
        await (async () => { const _p = updatePayload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, sopData.id]); })();
      const error = null; const data = [];
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['sops', effectiveCompanyId, effectivePageName]);
      setIsEditMode(false);
      toast({ title: 'SOP saved successfully.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
      const error = null;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sops', effectiveCompanyId, effectivePageName]);
      setActiveSOPId(null);
      toast({ title: 'SOP deleted.' });
    }
  });

  const handleCreateNew = () => {
    setEditingSOP({
      title: 'New Standard Operating Procedure',
      department: 'General',
      description: '',
      steps: [{ title: 'First Step', content: 'Describe the action here.' }]
    });
    setIsEditMode(true);
    setActiveSOPId(null);
  };

  const handleEdit = () => {
    setEditingSOP(JSON.parse(JSON.stringify(activeSOP))); // Deep copy
    setIsEditMode(true);
  };

  const handleSave = () => {
    saveMutation.mutate(editingSOP);
  };

  const toggleStepComplete = (index) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter(i => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
      if (index === activeStepIndex) {
        setActiveStepIndex(Math.min(activeStepIndex + 1, (activeSOP?.steps?.length || 1) - 1));
      }
    }
  };

  const resetExecution = () => {
    setActiveStepIndex(0);
    setCompletedSteps([]);
  };

  return (
    <div className="flex h-full w-full bg-background font-sans overflow-hidden">
      
      {/* Sidebar - SOP Library */}
      <div className="w-80 border-r border-border bg-card flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> {title}
            </h1>
            <button 
              onClick={handleCreateNew}
              className="p-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search procedures..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {filteredSOPs.map(sop => (
            <button
              key={sop.id}
              onClick={() => { setActiveSOPId(sop.id); setIsEditMode(false); resetExecution(); }}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all",
                activeSOPId === sop.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted"
              )}
            >
              <div className="font-semibold text-sm line-clamp-1">{sop.title}</div>
              <div className={cn("text-xs mt-1", activeSOPId === sop.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {sop.department} • {sop.steps?.length || 0} steps
              </div>
            </button>
          ))}
          {filteredSOPs.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No procedures found.
            </div>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-muted/10">
        
        {isEditMode && editingSOP ? (
          // BUILDER MODE
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">SOP Builder</h2>
                  <p className="text-sm text-muted-foreground">Define the procedure and steps.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsEditMode(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                  <button onClick={handleSave} disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 disabled:opacity-50">
                    {saveMutation.isPending ? 'Saving...' : 'Save SOP'}
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Procedure Title</label>
                    <input type="text" value={editingSOP.title} onChange={e => setEditingSOP({...editingSOP, title: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Department</label>
                    <input type="text" value={editingSOP.department} onChange={e => setEditingSOP({...editingSOP, department: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:border-primary outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Description / Goal</label>
                    <textarea value={editingSOP.description} onChange={e => setEditingSOP({...editingSOP, description: e.target.value})} className="w-full h-20 p-3 rounded-xl border border-border bg-background text-sm focus:border-primary outline-none resize-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center justify-between">
                  Execution Steps
                  <button onClick={() => setEditingSOP({...editingSOP, steps: [...(editingSOP.steps || []), {title: 'New Step', content: ''}]})} className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
                    <Plus className="w-4 h-4" /> Add Step
                  </button>
                </h3>
                
                {(editingSOP.steps || []).map((step, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0">{idx + 1}</div>
                    <div className="flex-1 space-y-3">
                      <input 
                        type="text" value={step.title} placeholder="Step Title"
                        onChange={e => {
                          const newSteps = [...editingSOP.steps];
                          newSteps[idx].title = e.target.value;
                          setEditingSOP({...editingSOP, steps: newSteps});
                        }} 
                        className="w-full bg-transparent text-foreground font-bold outline-none border-b border-transparent focus:border-primary pb-1" 
                      />
                      <textarea 
                        value={step.content} placeholder="Step details, commands, or checks..."
                        onChange={e => {
                          const newSteps = [...editingSOP.steps];
                          newSteps[idx].content = e.target.value;
                          setEditingSOP({...editingSOP, steps: newSteps});
                        }} 
                        className="w-full h-20 bg-muted/30 border border-border rounded-lg p-2 text-sm outline-none focus:border-primary resize-y" 
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newSteps = editingSOP.steps.filter((_, i) => i !== idx);
                        setEditingSOP({...editingSOP, steps: newSteps});
                      }}
                      className="text-muted-foreground hover:text-red-500 p-2 self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeSOP ? (
          // EXECUTION MODE
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="border-b border-border bg-card px-8 py-6 shrink-0 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                  <FileText className="w-4 h-4" /> {activeSOP.department}
                </div>
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{activeSOP.title}</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">{activeSOP.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleEdit} className="p-2 border border-border bg-background rounded-lg hover:bg-muted text-muted-foreground transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => { if(window.confirm('Delete SOP?')) deleteMutation.mutate(activeSOP.id); }} className="p-2 border border-border bg-background rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-muted-foreground transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Interactive Steps */}
            <div className="flex-1 p-8 overflow-y-auto bg-muted/10 custom-scrollbar">
              <div className="max-w-4xl mx-auto flex gap-12">
                
                {/* Progress Sidebar */}
                <div className="w-64 shrink-0 hidden lg:block">
                  <div className="sticky top-0 bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-foreground">Progress</h3>
                      <button onClick={resetExecution} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(completedSteps.length / (activeSOP.steps?.length || 1)) * 100}%` }}></div>
                    </div>
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {(activeSOP.steps || []).map((step, idx) => {
                        const isDone = completedSteps.includes(idx);
                        const isActive = activeStepIndex === idx;
                        return (
                          <div key={idx} className="relative flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-colors", isDone ? "bg-emerald-500 text-white" : isActive ? "bg-primary text-white ring-4 ring-primary/20" : "bg-muted text-muted-foreground")}>
                                {isDone ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                              </div>
                              <span className={cn("text-sm transition-colors line-clamp-1", isDone ? "text-muted-foreground line-through" : isActive ? "font-bold text-foreground" : "text-muted-foreground")}>
                                {step.title}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Step Content Area */}
                <div className="flex-1 space-y-6">
                  {(activeSOP.steps || []).map((step, idx) => {
                    const isDone = completedSteps.includes(idx);
                    const isActive = activeStepIndex === idx;
                    const isUpcoming = idx > activeStepIndex && !isDone;

                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "rounded-2xl border transition-all duration-300",
                          isActive ? "bg-card border-primary/50 shadow-lg ring-1 ring-primary/20 scale-[1.02]" : "bg-card/50 border-border opacity-70 hover:opacity-100 cursor-pointer"
                        )}
                        onClick={() => { if (!isActive) setActiveStepIndex(idx); }}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className={cn("text-xl font-bold mb-4", isActive ? "text-foreground" : "text-muted-foreground")}>
                              {idx + 1}. {step.title}
                            </h3>
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleStepComplete(idx); }}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm",
                                isDone 
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-background border border-border hover:border-primary hover:text-primary"
                              )}
                            >
                              {isDone ? <><CheckCircle2 className="w-4 h-4" /> Completed</> : <><Circle className="w-4 h-4" /> Mark Complete</>}
                            </button>
                          </div>
                          
                          <div className={cn("prose dark:prose-invert max-w-none text-muted-foreground", !isActive && !isDone && "line-clamp-2")}>
                            {step.content.split('\n').map((line, i) => (
                              <p key={i} className="mb-2">{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {completedSteps.length === (activeSOP.steps?.length || 0) && activeSOP.steps?.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">Procedure Completed!</h3>
                      <p className="text-emerald-600 dark:text-emerald-400 mb-6">All steps have been successfully marked as done.</p>
                      <button onClick={resetExecution} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                        Restart SOP
                      </button>
                    </motion.div>
                  )}

                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-foreground mb-1">Interactive SOPs</h3>
            <p>Select a procedure from the sidebar to execute or edit.</p>
          </div>
        )}
      </div>

    </div>
  );
}
