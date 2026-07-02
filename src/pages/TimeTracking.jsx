import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Play, Square, Pause, Plus, FileText, 
  Brain, Tag, DollarSign, Calendar, Search, 
  Trash2, Edit3, CheckCircle2, ChevronDown, ListFilter
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { generateText } from '@/lib/cloudflareAI';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TimeTracking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Live Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDescription, setTimerDescription] = useState('');
  const [timerProject, setTimerProject] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    project_id: '',
    task_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 0,
    is_billable: 1,
    hourly_rate: 0,
    status: 'Logged'
  });

  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Load Time Entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time_tracking', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute('SELECT * FROM univ_time_tracking WHERE company_id = ? ORDER BY date DESC, created_at DESC', [companyId]);
      return res.rows._array || [];
    },
    enabled: !!companyId
  });

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        (e.description || '').toLowerCase().includes(q) || 
        (e.project_id || '').toLowerCase().includes(q) ||
        (e.ai_tags || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [entries, searchQuery]);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleStopTimer = () => {
    setIsTimerRunning(false);
    if (timerSeconds < 60) {
      toast({ title: "Timer too short", description: "Time logged must be at least 1 minute." });
      return;
    }
    const minutes = Math.ceil(timerSeconds / 60);
    openModal({
      description: timerDescription,
      project_id: timerProject,
      duration_minutes: minutes,
      date: new Date().toISOString().split('T')[0],
      is_billable: 1,
      hourly_rate: 0,
      status: 'Logged'
    });
    setTimerSeconds(0);
    setTimerDescription('');
    setTimerProject('');
  };

  const openModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        project_id: entry.project_id || '',
        task_id: entry.task_id || '',
        description: entry.description || '',
        date: entry.date || new Date().toISOString().split('T')[0],
        duration_minutes: entry.duration_minutes || 0,
        is_billable: entry.is_billable ?? 1,
        hourly_rate: entry.hourly_rate || 0,
        status: entry.status || 'Logged'
      });
    } else {
      setEditingEntry(null);
      setFormData({
        project_id: '',
        task_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        duration_minutes: 0,
        is_billable: 1,
        hourly_rate: 0,
        status: 'Logged'
      });
    }
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const totalAmount = data.is_billable ? (data.duration_minutes / 60) * data.hourly_rate : 0;
      const isNew = !editingEntry?.id;
      
      const payload = {
        ...data,
        total_amount: totalAmount,
        company_id: companyId,
        user_id: user?.id || 'system',
        user_name: user?.full_name || user?.email || 'User'
      };

      if (isNew) {
        payload.id = crypto.randomUUID();
        payload.created_at = new Date().toISOString();
        const keys = Object.keys(payload);
        const vals = Object.values(payload);
        const plhdr = keys.map(() => '?').join(', ');
        await powerSync.execute(`INSERT INTO univ_time_tracking (${keys.join(', ')}) VALUES (${plhdr})`, vals);
      } else {
        const keys = Object.keys(payload);
        const vals = Object.values(payload);
        await powerSync.execute(`UPDATE univ_time_tracking SET ${keys.map(k => k + ' = ?').join(', ')} WHERE id = ?`, [...vals, editingEntry.id]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time_tracking', companyId]);
      setIsModalOpen(false);
      toast({ title: "Success", description: "Time entry saved." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_time_tracking WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time_tracking', companyId]);
      toast({ title: "Deleted", description: "Time entry removed." });
    }
  });

  const handleAiInsights = async (entry) => {
    setIsAiProcessing(true);
    toast({ title: "AI Analysis", description: "Generating summary and tags..." });
    try {
      const prompt = `Analyze this time entry description: "${entry.description}". Generate a short, professional 1-sentence summary of the work done, and provide 2-3 relevant tags separated by commas. Format exactly as: SUMMARY: [summary] | TAGS: [tags]`;
      const response = await generateText(prompt);
      
      const parts = response.split('|');
      let summary = response;
      let tags = '';
      if (parts.length > 1) {
        summary = parts[0].replace('SUMMARY:', '').trim();
        tags = parts[1].replace('TAGS:', '').trim();
      }

      await powerSync.execute('UPDATE univ_time_tracking SET ai_summary = ?, ai_tags = ? WHERE id = ?', [summary, tags, entry.id]);
      queryClient.invalidateQueries(['time_tracking', companyId]);
      toast({ title: "AI Insights Ready", description: "Summary and tags updated." });
    } catch (e) {
      toast({ title: "AI Error", description: "Could not generate insights.", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSave = () => {
    if (!formData.description || formData.duration_minutes <= 0) {
      toast({ title: "Required Fields", description: "Please enter a description and duration.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header & Live Timer */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-6 rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" /> Time Tracking
          </h1>
          <p className="text-muted-foreground mt-2">Track billable hours, manage projects, and log activities.</p>
        </div>
        
        {/* Live Timer Widget */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-[0.5px] border-primary/20 p-4 rounded-2xl w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 shadow-inner">
          <div className="flex-1 min-w-[200px]">
            <Input 
              placeholder="What are you working on?" 
              value={timerDescription}
              onChange={e => setTimerDescription(e.target.value)}
              className="bg-white dark:bg-slate-800 border-none shadow-sm text-sm h-10"
            />
          </div>
          <div className="text-3xl font-mono font-bold tracking-tighter text-primary w-32 text-center">
            {formatTime(timerSeconds)}
          </div>
          <div className="flex items-center gap-2">
            {!isTimerRunning ? (
              <Button onClick={handleStartTimer} size="icon" className="w-12 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md transition-transform active:scale-95">
                <Play className="w-6 h-6 ml-1 fill-current" />
              </Button>
            ) : (
              <Button onClick={handlePauseTimer} size="icon" variant="outline" className="w-12 h-12 rounded-xl border-primary/50 text-primary hover:bg-primary/10 transition-transform active:scale-95">
                <Pause className="w-6 h-6 fill-current" />
              </Button>
            )}
            {(timerSeconds > 0 || isTimerRunning) && (
              <Button onClick={handleStopTimer} size="icon" variant="destructive" className="w-12 h-12 rounded-xl shadow-md transition-transform active:scale-95">
                <Square className="w-5 h-5 fill-current" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <Input 
            placeholder="Search descriptions, projects, or AI tags..." 
            className="pl-10 h-10 rounded-xl bg-card border-[0.5px] border-black/9 dark:border-white/8 shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button onClick={() => openModal()} className="flex-1 sm:flex-none gap-2 h-10 rounded-xl px-5 bg-foreground text-background hover:bg-foreground/90 shadow-md">
            <Plus className="w-4 h-4" /> Log Time Manually
          </Button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-card rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 flex justify-center"><OrbitLoader /></div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Clock className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No time entries found</h3>
            <p className="text-muted-foreground mt-1">Start the timer above or log time manually.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold border-b border-black/5 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4 rounded-tl-3xl">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Billing</th>
                  <th className="px-6 py-4">AI Intelligence</th>
                  <th className="px-6 py-4 text-right rounded-tr-3xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Calendar className="w-4 h-4 text-primary" />
                        {entry.date}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{entry.user_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground max-w-[200px] truncate">{entry.description}</div>
                      {entry.project_id && <div className="text-xs text-primary mt-1 flex items-center gap-1"><Tag className="w-3 h-3" /> {entry.project_id}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">
                      {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}m
                    </td>
                    <td className="px-6 py-4">
                      {entry.is_billable === 1 ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-semibold w-fit">
                            <DollarSign className="w-3 h-3" /> Billable
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">${entry.hourly_rate}/hr (${entry.total_amount?.toFixed(2)})</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold w-fit">
                          Non-billable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[350px]">
                      {entry.ai_summary ? (
                        <div className="space-y-1.5">
                          <p className="text-xs text-foreground bg-primary/5 p-2 rounded-lg leading-relaxed border-[0.5px] border-primary/20">
                            {entry.ai_summary}
                          </p>
                          {entry.ai_tags && (
                            <div className="flex flex-wrap gap-1">
                              {entry.ai_tags.split(',').map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] rounded-md uppercase tracking-widest font-semibold">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleAiInsights(entry)}
                          variant="ghost" 
                          size="sm" 
                          disabled={isAiProcessing}
                          className="text-xs h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30 gap-1.5 rounded-lg border-[0.5px] border-indigo-200 dark:border-indigo-800/50"
                        >
                          <Brain className="w-3.5 h-3.5" /> Generate AI Insights
                        </Button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button onClick={() => openModal(entry)} variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => deleteMutation.mutate(entry.id)} variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editingEntry ? 'Edit Time Entry' : 'Log Time Manually'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description *</label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="What did you work on?"
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-black/5 dark:border-white/5 focus-visible:ring-primary/40"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-black/5 dark:border-white/5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Duration (Mins) *</label>
                <Input 
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-black/5 dark:border-white/5"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Project / Client (Optional)</label>
              <Input 
                value={formData.project_id}
                onChange={e => setFormData({...formData, project_id: e.target.value})}
                placeholder="e.g. Project Apollo"
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-black/5 dark:border-white/5"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-[0.5px] border-black/5 dark:border-white/5 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Billable Time</span>
                  <span className="text-xs text-muted-foreground">Charge client for this work</span>
                </div>
                <button 
                  onClick={() => setFormData({...formData, is_billable: formData.is_billable === 1 ? 0 : 1})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_billable === 1 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_billable === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <AnimatePresence>
                {formData.is_billable === 1 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t-[0.5px] border-black/5 dark:border-white/5 mt-3">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Hourly Rate ($)</label>
                      <Input 
                        type="number"
                        min="0"
                        value={formData.hourly_rate}
                        onChange={e => setFormData({...formData, hourly_rate: parseFloat(e.target.value) || 0})}
                        className="h-11 rounded-xl bg-white dark:bg-slate-950 border-black/10 dark:border-white/10"
                      />
                      <div className="mt-2 text-sm font-semibold text-primary">
                        Total Amount: <span className="font-bold">${((formData.duration_minutes / 60) * formData.hourly_rate).toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className="w-full h-12 rounded-xl font-semibold bg-foreground text-background hover:bg-foreground/90 mt-4 shadow-md transition-all active:scale-[0.98]"
            >
              {saveMutation.isPending ? <OrbitLoader size="sm" /> : (editingEntry ? 'Update Entry' : 'Save Entry')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
