import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Clock, Plus, Search, Filter, Play, Square,
  CalendarDays, Tag, CheckCircle2, User, Pause,
  Edit3, Trash2
} from 'lucide-react';

export default function UnivTimeTracking({
  title = 'Time Tracking',
  companyId,
  pageName,
  tableName
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hookCompanyId = useCompanyId();
  const effectiveCompanyId = companyId || hookCompanyId;
  const effectivePageName = pageName || 'time';
  const targetTable = tableName || 'industry_records';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Live Timer State
  const [activeTimer, setActiveTimer] = useState(null); // holds entry id if timer is running
  const [elapsedTime, setElapsedTime] = useState(0);

  const [formState, setFormState] = useState({
    project: '',
    task: '',
    user_name: 'Current User',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 0,
    status: 'Logged', // Logged, Running
    notes: ''
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time_entries', effectiveCompanyId, effectivePageName],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      let query = supabase.from(targetTable).select('*').eq('company_id', effectiveCompanyId);
      if (targetTable === 'industry_records') {
        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_entries`);
      }
      const { data, error } = await query;
      if (error && error.code !== '42P01') throw error;
      return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r) }));
    },
    enabled: !!effectiveCompanyId
  });

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        (e.project || '').toLowerCase().includes(q) || 
        (e.task || '').toLowerCase().includes(q) ||
        (e.user_name || '').toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01'));
  }, [entries, searchQuery]);

  const saveMutation = useMutation({
    mutationFn: async (entryData) => {
      const isNew = !entryData.id;
      let payload;
      if (targetTable === 'industry_records') {
        payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_entries`, data: entryData };
      } else {
        payload = { ...entryData, company_id: effectiveCompanyId };
      }

      if (isNew) {
        const { error, data } = await supabase.from(targetTable).insert([payload]).select().single();
        if (error) throw error;
        return data;
      } else {
        const updatePayload = targetTable === 'industry_records' ? { data: entryData } : entryData;
        const { error, data } = await supabase.from(targetTable).update(updatePayload).eq('id', entryData.id).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['time_entries', effectiveCompanyId, effectivePageName]);
      setIsModalOpen(false);
      
      // If we just started a timer
      if (data && (targetTable === 'industry_records' ? data.data?.status : data.status) === 'Running') {
        setActiveTimer(data.id);
        setElapsedTime(0);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(targetTable).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time_entries', effectiveCompanyId, effectivePageName]);
      toast({ title: 'Entry deleted.' });
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!formState.project) return;
    saveMutation.mutate(formState);
  };

  const openNewModal = () => {
    setEditingEntry(null);
    setFormState({
      project: '',
      task: '',
      user_name: 'Current User',
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 60,
      status: 'Logged',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const startLiveTimer = () => {
    setEditingEntry(null);
    setFormState({
      project: 'Ad-hoc Task',
      task: 'Working',
      user_name: 'Current User',
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 0,
      status: 'Running',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const stopTimer = () => {
    if (!activeTimer) return;
    const runningEntry = entries.find(e => e.id === activeTimer);
    if (!runningEntry) return;

    saveMutation.mutate({
      ...runningEntry,
      status: 'Logged',
      duration_minutes: Math.ceil(elapsedTime / 60)
    });
    setActiveTimer(null);
    setElapsedTime(0);
  };

  // Timer Effect
  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatSeconds = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Stats
  const totalMinutes = entries.reduce((acc, e) => acc + (Number(e.duration_minutes) || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Re-sync active timer from DB if exists
  useEffect(() => {
    if (entries.length > 0 && !activeTimer) {
      const running = entries.find(e => e.status === 'Running');
      if (running) {
        setActiveTimer(running.id);
        // Approximation: if it was started, we'd need a start timestamp. For UI demo, just start at 0 or use its current duration.
        setElapsedTime((Number(running.duration_minutes) || 0) * 60);
      }
    }
  }, [entries, activeTimer]);

  return (
    <div className="flex flex-col h-full bg-background font-sans">
      
      {/* Header */}
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Track billable hours, timesheets, and project capacity.</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTimer ? (
              <button 
                onClick={stopTimer}
                className="px-6 py-2 bg-red-500 text-white rounded-full text-sm font-bold shadow-sm hover:bg-red-600 transition-colors flex items-center gap-2 animate-pulse"
              >
                <Square className="w-4 h-4" /> Stop Timer ({formatSeconds(elapsedTime)})
              </button>
            ) : (
              <button 
                onClick={startLiveTimer}
                className="px-6 py-2 bg-emerald-500 text-white rounded-full text-sm font-bold shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> Start Timer
              </button>
            )}
            
            <button 
              onClick={openNewModal}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2 ml-2"
            >
              <Plus className="w-4 h-4" /> Manual Entry
            </button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Hours</div>
            <div className="text-3xl font-black text-foreground">{totalHours} <span className="text-lg font-medium text-muted-foreground">hrs</span></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-center">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Entries</div>
            <div className="text-2xl font-bold text-foreground">{entries.length}</div>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search projects or tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="h-10 px-4 bg-background border border-border rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground" /> Filter
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-foreground">No time entries</h3>
              <p className="text-sm mt-1">Start a timer or log hours manually.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-border">
                {filteredEntries.map(entry => {
                  const isRunning = entry.status === 'Running';
                  return (
                    <div key={entry.id} className={cn("p-4 sm:p-5 flex items-center justify-between group hover:bg-muted/30 transition-colors", isRunning && "bg-emerald-50/50 dark:bg-emerald-900/10")}>
                      <div className="flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5", isRunning ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                          {isRunning ? <Play className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={cn("text-base font-bold text-foreground", isRunning && "text-emerald-700 dark:text-emerald-400")}>{entry.project}</h3>
                            <span className="text-muted-foreground text-sm px-1.5 py-0.5 bg-muted rounded font-medium">{entry.task}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {entry.user_name}</span>
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(entry.date).toLocaleDateString()}</span>
                            {entry.notes && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {entry.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className={cn("text-xl font-mono font-bold text-right min-w-[80px]", isRunning ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                          {isRunning ? formatSeconds(elapsedTime) : formatDuration(entry.duration_minutes)}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isRunning && <button onClick={() => openEditModal(entry)} className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>}
                          <button onClick={() => { if(window.confirm('Delete entry?')) deleteMutation.mutate(entry.id); }} className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {formState.status === 'Running' ? 'Start Timer' : editingEntry ? 'Edit Time Entry' : 'Manual Time Entry'}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="time-form" onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Project *</label>
                      <input required type="text" value={formState.project} onChange={e => setFormState({...formState, project: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Task</label>
                      <input type="text" value={formState.task} onChange={e => setFormState({...formState, task: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Date</label>
                      <input type="date" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none" />
                    </div>
                    {formState.status !== 'Running' && (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Duration (mins)</label>
                        <input type="number" min="1" value={formState.duration_minutes} onChange={e => setFormState({...formState, duration_minutes: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-mono focus:border-primary focus:outline-none" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Notes</label>
                    <textarea value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full h-24 p-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none resize-none" />
                  </div>

                </form>
              </div>
              
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" form="time-form" disabled={saveMutation.isPending} className={cn("px-6 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50", formState.status === 'Running' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90")}>
                  {saveMutation.isPending ? 'Saving...' : formState.status === 'Running' ? 'Start Timer' : 'Save Entry'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
