import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Play, Square, Plus, FileText,
  Brain, Tag, DollarSign, Calendar, Search, 
  Trash2, Edit3, AlertTriangle
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import TimeRemindersTab from '@/components/shared/TimeRemindersTab';

const formatDuration = (minutes) => {
  if (!minutes) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const formatTimeFromSeconds = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function TimeTracking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDescription, setTimerDescription] = useState('');
  const [timerProject, setTimerProject] = useState('');
  const [timerBillable, setTimerBillable] = useState(true);

  // Idle Detection State
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  const [formData, setFormData] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    project_id: '',
    is_billable: 1,
    hourly_rate: 50,
    currency: user?.company_currency || 'USD',
    status: 'Logged'
  });

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('my-timesheets');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time_tracking', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute('SELECT * FROM univ_time_tracking WHERE company_id = ? ORDER BY date DESC, created_at DESC', [companyId]);
      return res.rows._array || [];
    },
    enabled: !!companyId
  });

  const { data: reminders = [], isLoading: isLoadingReminders } = useQuery({
    queryKey: ['time_reminders', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute('SELECT * FROM univ_time_reminders WHERE company_id = ? ORDER BY remind_at ASC', [companyId]);
      return res.rows._array || [];
    },
    enabled: !!companyId
  });

  // Reminders Alert Logic
  useEffect(() => {
    const playReminderSound = (soundType) => {
      if (!soundType || soundType === 'none') return;
      try {
        const audio = new Audio(`/sounds/${soundType}.mp3`);
        audio.play().catch(e => console.log('Audio play blocked:', e));
      } catch (err) {
        console.error('Audio error:', err);
      }
    };

    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(r => {
        if (r.status === 'Pending' && r.remind_at) {
          const remindTime = new Date(r.remind_at);
          // Alert if within the last 60 seconds of the minute
          if (now >= remindTime && now.getTime() - remindTime.getTime() < 60000) {
            toast({ title: `🔔 Reminder: ${r.title}`, description: r.description || 'Time to check your task!', duration: 10000 });
            playReminderSound(r.sound);
          }
        }
      });
    }, 60000);
    
    // Check once immediately on load if anything is due right now
    const timeout = setTimeout(() => {
      const now = new Date();
      reminders.forEach(r => {
        if (r.status === 'Pending' && r.remind_at) {
          const remindTime = new Date(r.remind_at);
          if (now >= remindTime && now.getTime() - remindTime.getTime() < 60000) {
            toast({ title: `🔔 Reminder: ${r.title}`, description: r.description || 'Time to check your task!', duration: 10000 });
            playReminderSound(r.sound);
          }
        }
      });
    }, 3000);
    
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [reminders, toast]);

  // Track user activity for idle detection
  useEffect(() => {
    const handleActivity = () => {
      setLastActiveTime(Date.now());
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  // Timer & Idle Logic
  useEffect(() => {
    const fetchTimer = async () => {
       if (!companyId || !user?.email) return;
       const res = await powerSync.execute('SELECT * FROM active_timers WHERE company_id = ? AND created_by = ? LIMIT 1', [companyId, user.email]);
       if (res.rows.length > 0) {
          const parsed = res.rows.item(0);
          const startTime = new Date(parsed.start_time).getTime();
          const elapsedSinceStart = Math.floor((Date.now() - startTime) / 1000);
          setTimerSeconds((parsed.accumulated_seconds || 0) + elapsedSinceStart);
          setTimerDescription(parsed.description || '');
          setTimerProject(parsed.case_id || '');
          setTimerBillable(parsed.is_billable === 1);
          setIsTimerRunning(true);
       }
    };
    fetchTimer();
  }, [companyId, user?.email]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now - lastActiveTime > IDLE_THRESHOLD && !showIdleWarning) {
          setIsTimerRunning(false);
          setShowIdleWarning(true);
          setIdleSeconds(Math.floor((now - lastActiveTime) / 1000));
        } else if (!showIdleWarning) {
          setTimerSeconds(s => s + 1);
          if (timerSeconds % 5 === 0 && companyId && user?.email) {
             const timerId = `timer-${user.email}`;
             const startTimeIso = new Date(Date.now() - timerSeconds * 1000).toISOString();
             powerSync.execute(
                 `INSERT OR REPLACE INTO active_timers (id, company_id, description, case_id, start_time, accumulated_seconds, is_billable, created_by, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                 [
                    timerId, companyId, timerDescription, timerProject, 
                    startTimeIso, timerSeconds, timerBillable ? 1 : 0, user.email, new Date().toISOString()
                 ]
             );
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerDescription, timerProject, timerBillable, lastActiveTime, showIdleWarning, companyId, user?.email]);

  const handleKeepIdleTime = () => {
    setTimerSeconds(s => s + idleSeconds);
    setShowIdleWarning(false);
    setLastActiveTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleDiscardIdleTime = () => {
    setShowIdleWarning(false);
    setLastActiveTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setLastActiveTime(Date.now());
    if (companyId && user?.email) {
        const timerId = `timer-${user.email}`;
        powerSync.execute(
            `INSERT OR REPLACE INTO active_timers (id, company_id, description, case_id, start_time, accumulated_seconds, is_billable, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
               timerId, companyId, timerDescription, timerProject, 
               new Date().toISOString(), timerSeconds, timerBillable ? 1 : 0, user.email, new Date().toISOString()
            ]
        );
    }
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    if (companyId && user?.email) {
        powerSync.execute(`DELETE FROM active_timers WHERE id = ?`, [`timer-${user.email}`]);
    }
    
    if (timerSeconds < 60) {
      toast({ title: "Timer too short", description: "Time logged must be at least 1 minute.", variant: "default" });
      setTimerSeconds(0);
      setTimerDescription('');
      setTimerProject('');
      return;
    }

    const minutes = Math.ceil(timerSeconds / 60);
    
    if (timerDescription.trim().length > 0) {
       saveMutation.mutate({
          description: timerDescription,
          project_id: timerProject,
          duration_minutes: minutes,
          date: new Date().toISOString().split('T')[0],
          is_billable: timerBillable ? 1 : 0,
          hourly_rate: 50,
          currency: 'USD',
          status: 'Logged'
       });
       setTimerSeconds(0);
       setTimerDescription('');
       setTimerProject('');
    } else {
       openModal({
         description: timerDescription,
         project_id: timerProject,
         duration_minutes: minutes,
         date: new Date().toISOString().split('T')[0],
         is_billable: timerBillable ? 1 : 0,
         hourly_rate: 50,
         currency: 'USD',
         status: 'Logged'
       });
       setTimerSeconds(0);
       setTimerDescription('');
       setTimerProject('');
    }
  };

  const handleDiscardTimer = () => {
      setIsTimerRunning(false);
      localStorage.removeItem('slate_active_timer');
      setTimerSeconds(0);
      setTimerDescription('');
      setTimerProject('');
      toast({ description: "Timer discarded." });
  };

  const openModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        description: entry.description || '',
        date: entry.date || new Date().toISOString().split('T')[0],
        duration_minutes: entry.duration_minutes || 60,
        project_id: entry.project_id || '',
        is_billable: entry.is_billable !== undefined ? entry.is_billable : 1,
        hourly_rate: entry.hourly_rate || 50,
        currency: entry.currency || user?.company_currency || 'USD',
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
        hourly_rate: 50,
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
      toast({ title: "Success", description: "Time entry saved successfully." });
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute('UPDATE univ_time_tracking SET status = ? WHERE id = ?', [status, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time_tracking', companyId]);
      toast({ title: "Status Updated", description: "Timesheet status successfully updated." });
    }
  });

  const handleAiInsights = async (entry) => {
    setIsAiProcessing(true);
    toast({ title: "AI Analysis", description: "Analyzing time entry context..." });
    try {
      const prompt = `Analyze this time tracking description: "${entry.description}". 
      Task: Generate a concise, professional 1-sentence summary of the work done suitable for client billing reports.
      Also provide 2-3 relevant categorization tags separated by commas. 
      Format EXACTLY as: SUMMARY: [summary] | TAGS: [tags]`;
      
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
      toast({ title: "Insights Generated", description: "AI summary and tags attached." });
    } catch (e) {
      toast({ title: "AI Error", description: "Could not generate insights.", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSave = () => {
    if (!formData.description || formData.duration_minutes <= 0) {
      toast({ title: "Required Fields", description: "Please enter a valid description and duration.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(formData);
  };

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (activeTab === 'my-timesheets') {
      filtered = filtered.filter(e => e.user_id === user?.id || e.user_id === 'system');
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        (e.description || '').toLowerCase().includes(q) || 
        (e.project_id || '').toLowerCase().includes(q) ||
        (e.ai_tags || '').toLowerCase().includes(q) ||
        (e.user_name || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [entries, searchQuery, activeTab, user]);

  const profitabilityData = useMemo(() => {
    const projectMap = {};
    entries.forEach(e => {
      if (!e.project_id) return;
      if (!projectMap[e.project_id]) projectMap[e.project_id] = { project: e.project_id, revenue: 0, hours: 0 };
      projectMap[e.project_id].revenue += e.total_amount || 0;
      projectMap[e.project_id].hours += (e.duration_minutes || 0) / 60;
    });
    return Object.values(projectMap).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
  }, [entries]);

  const totalHoursThisWeek = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return filteredEntries
      .filter(e => new Date(e.date) >= startOfWeek)
      .reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / 60;
  }, [filteredEntries]);

  const totalBillableAmount = useMemo(() => {
     return filteredEntries.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  }, [filteredEntries]);

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen p-3 sm:p-6 lg:p-8 space-y-5 animate-in fade-in duration-500 pb-24 text-foreground bg-background">
      {/* Header & 2x2 Mobile Native Stats */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Time Tracker</h1>
              <p className="text-xs text-muted-foreground font-medium">{filteredEntries.length} entries recorded</p>
            </div>
          </div>
          <Button onClick={() => openModal()} className="bg-[#005A9C] hover:bg-[#00477D] text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5 shadow-sm shrink-0">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Manual Entry</span><span className="sm:hidden">Log</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">This Week</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-foreground">{totalHoursThisWeek.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground font-medium">hrs</span>
            </div>
          </div>

          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Billable Total</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">${totalBillableAmount.toFixed(2)}</span>
          </div>

          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Logged Days</span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{new Set(filteredEntries.map(e => e.date)).size}</span>
          </div>

          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
            <span className={cn("text-xs font-black uppercase inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full mt-1", isTimerRunning ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
              <span className={cn("w-2 h-2 rounded-full", isTimerRunning ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
              {isTimerRunning ? "Running" : "Idle"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Timer Widget - Native Mobile & Responsive */}
      <div className="bg-card/95 backdrop-blur-xl border border-border/90 p-3 sm:p-4 rounded-[22px] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full max-w-full">
        <div className="flex-1 min-w-0">
           <Input 
             placeholder="What are you working on?" 
             value={timerDescription}
             onChange={e => setTimerDescription(e.target.value)}
             className="w-full bg-transparent border-none text-sm sm:text-base focus-visible:ring-0 px-1 h-9 placeholder:text-muted-foreground/60 text-foreground"
           />
           <div className="flex items-center gap-2 pt-1 sm:pt-0">
             <div className="relative">
               <Input 
                 placeholder="Project" 
                 value={timerProject}
                 onChange={e => setTimerProject(e.target.value)}
                 className="w-28 sm:w-32 h-7.5 border-border/80 text-xs rounded-lg bg-background text-foreground"
               />
             </div>
             <button 
               type="button"
               className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors text-xs font-semibold"
               onClick={() => setTimerBillable(!timerBillable)}
             >
               <DollarSign className={`w-3.5 h-3.5 ${timerBillable ? 'text-emerald-500' : 'text-muted-foreground'}`} />
               <span className={timerBillable ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                 {timerBillable ? 'Billable' : 'Non-billable'}
               </span>
             </button>
           </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border/70 sm:pl-4 shrink-0">
          <div className={`text-2xl sm:text-3xl font-mono font-black tracking-tight shrink-0 ${isTimerRunning ? 'text-[#005A9C] dark:text-[#FF6B00]' : 'text-foreground'}`}>
            {formatTimeFromSeconds(timerSeconds)}
          </div>
          
          <div className="flex items-center gap-2">
            {timerSeconds > 0 && !isTimerRunning && (
              <Button onClick={handleDiscardTimer} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            {!isTimerRunning ? (
              <Button 
                onClick={handleStartTimer} 
                className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider shadow-sm gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> START
              </Button>
            ) : (
              <Button 
                onClick={handleStopTimer} 
                variant="destructive"
                className="h-10 px-5 rounded-xl font-bold text-xs tracking-wider shadow-sm gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> STOP
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-10 border border-border/60 shrink-0 inline-flex min-w-full sm:min-w-0">
            <TabsTrigger value="my-timesheets" className="rounded-lg text-xs font-bold px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs whitespace-nowrap">My Timesheets</TabsTrigger>
            <TabsTrigger value="approvals" className="rounded-lg text-xs font-bold px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs whitespace-nowrap">Team Approvals</TabsTrigger>
            <TabsTrigger value="profitability" className="rounded-lg text-xs font-bold px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs whitespace-nowrap">Project Budgets</TabsTrigger>
            <TabsTrigger value="reminders" className="rounded-lg text-xs font-bold px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs whitespace-nowrap">Reminders</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="my-timesheets" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
              <Input 
                placeholder="Search descriptions, tags, or projects..." 
                className="pl-10 h-10 rounded-xl bg-card border-border text-foreground"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button onClick={() => openModal()} className="flex-1 sm:flex-none gap-2 h-10 rounded-xl px-5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Manual Entry
              </Button>
            </div>
          </div>
          
          <TimeEntriesTable 
             entries={filteredEntries} 
             isLoading={isLoading} 
             onAiInsights={handleAiInsights}
             onEdit={openModal}
             onDelete={(id) => deleteMutation.mutate(id)}
             isAiProcessing={isAiProcessing}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
              <Input 
                placeholder="Search employee names or projects..." 
                className="pl-10 h-10 rounded-xl bg-card border-border text-foreground"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-widest font-semibold border-b border-border">
                    <tr>
                    <th className="px-6 py-4">Employee & Activity</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 max-w-[250px]">
                                <span className="font-medium text-foreground">{entry.user_name}</span>
                                <span className="text-muted-foreground text-xs truncate">{entry.description || '(No description)'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                <Tag className="w-3 h-3" /> {entry.project_id || 'N/A'}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className="font-mono font-bold text-base text-foreground bg-muted/50 px-2 py-1 rounded">
                                {formatDuration(entry.duration_minutes)}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${entry.status === 'Approved' ? 'bg-green-100 text-green-700' : entry.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {entry.status || 'Pending'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatusMutation.mutate({ id: entry.id, status: 'Approved' })}>Approve</Button>
                                <Button size="sm" variant="outline" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateStatusMutation.mutate({ id: entry.id, status: 'Rejected' })}>Reject</Button>
                             </div>
                        </td>
                    </tr>
                    ))}
                    {filteredEntries.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-muted-foreground">No entries found for approval.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Top Projects by Revenue</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitabilityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1}/>
                      <XAxis dataKey="project" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => `$${value}`} cursor={{fill: 'transparent'}}/>
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Budget Utilization (Mock)</h3>
                <p className="text-muted-foreground text-sm mb-4">Tracking actuals against project budgets.</p>
                <div className="space-y-4">
                   {profitabilityData.map(p => (
                      <div key={p.project} className="space-y-2">
                         <div className="flex justify-between text-sm">
                            <span className="font-medium">{p.project}</span>
                            <span className="text-muted-foreground">${p.revenue.toFixed(0)} / $10,000</span>
                         </div>
                         <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(100, (p.revenue / 10000) * 100)}%`}} />
                         </div>
                      </div>
                   ))}
                </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <TimeRemindersTab reminders={reminders} isLoading={isLoadingReminders} />
        </TabsContent>
      </Tabs>

      {/* Manual Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-border shadow-xl bg-card flex flex-col max-h-[85vh] md:max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30 shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
              <FileText className="w-5 h-5 text-primary" />
              {editingEntry ? 'Edit Time Entry' : 'Manual Time Entry'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="What did you work on?"
                className="h-10 bg-background text-foreground"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="h-10 bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duration (Mins)</Label>
                <Input 
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                  className="h-10 bg-background font-mono text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Project / Client</Label>
              <Input 
                value={formData.project_id}
                onChange={e => setFormData({...formData, project_id: e.target.value})}
                placeholder="e.g. Project Apollo"
                className="h-10 bg-background text-foreground"
              />
            </div>

            <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-foreground">Billable Work</Label>
                  <p className="text-xs text-muted-foreground">Charge this time to the client</p>
                </div>
                <Switch 
                  checked={formData.is_billable === 1}
                  onCheckedChange={(c) => setFormData({...formData, is_billable: c ? 1 : 0})}
                />
              </div>
              
              <AnimatePresence>
                {formData.is_billable === 1 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border mt-2 space-y-3">
                      <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hourly Rate</Label>
                          <div className="flex rounded-md shadow-sm">
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({...formData, currency: e.target.value})}
                                className="h-10 px-3 bg-muted border border-border rounded-l-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="CAD">CAD ($)</option>
                                <option value="AUD">AUD ($)</option>
                                <option value="ZAR">ZAR (R)</option>
                                <option value="NGN">NGN (₦)</option>
                                <option value="KES">KES (KSh)</option>
                            </select>
                            <Input 
                                type="number"
                                min="0"
                                value={formData.hourly_rate}
                                onChange={e => setFormData({...formData, hourly_rate: parseFloat(e.target.value) || 0})}
                                className="h-10 bg-background text-foreground rounded-l-none border-l-0 focus-visible:ring-1"
                            />
                          </div>
                      </div>
                      <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                        <span className="text-sm font-medium text-muted-foreground">Calculated Total</span>
                        <span className="text-lg font-bold text-foreground">
                            {formData.currency} {((formData.duration_minutes / 60) * formData.hourly_rate).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 shrink-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
            >
              {saveMutation.isPending ? <OrbitLoader size="sm" /> : (editingEntry ? 'Save Changes' : 'Add Entry')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Idle Warning Modal */}
      <Dialog open={showIdleWarning} onOpenChange={setShowIdleWarning}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
               <AlertTriangle className="w-5 h-5" /> Idle Detected
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <p className="text-foreground">You've been inactive for {Math.floor(idleSeconds / 60)} minutes. The timer has been paused.</p>
             <p className="text-muted-foreground text-sm mt-2">Do you want to keep this idle time or discard it?</p>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={handleDiscardIdleTime}>Discard Idle Time</Button>
             <Button onClick={handleKeepIdleTime}>Keep Idle Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimeEntriesTable({ entries, isLoading, onAiInsights, onEdit, onDelete, isAiProcessing }) {
    if (isLoading) {
        return <div className="p-12 flex justify-center"><OrbitLoader /></div>;
    }
    if (entries.length === 0) {
        return (
            <div className="bg-card border border-dashed border-border rounded-[22px] p-10 text-center flex flex-col items-center shadow-xs">
              <div className="w-14 h-14 bg-muted/60 rounded-2xl flex items-center justify-center mb-3">
                  <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-extrabold text-foreground">No time entries recorded</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">Use the timer above or log historical hours to populate your timesheet.</p>
            </div>
        );
    }
    return (
        <div className="space-y-3">
          {/* Mobile Native List Cards (< md) */}
          <div className="md:hidden space-y-2.5">
            {entries.map(entry => (
              <div
                key={entry.id}
                onClick={() => onEdit(entry)}
                className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-transform space-y-2.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground text-sm leading-snug line-clamp-2">{entry.description || '(No description)'}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{entry.date}</span>
                      {entry.user_name && <span>· {entry.user_name}</span>}
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm text-foreground bg-muted/60 px-2.5 py-1 rounded-xl shrink-0">
                    {formatDuration(entry.duration_minutes)}
                  </span>
                </div>

                {entry.ai_summary && (
                  <p className="text-[11px] text-primary bg-primary/5 p-2 rounded-xl border border-primary/10 leading-snug">
                    ✨ {entry.ai_summary}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.project_id && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg">
                        <Tag className="w-3 h-3" /> {entry.project_id}
                      </span>
                    )}
                    {entry.is_billable === 1 ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3" /> ${entry.total_amount?.toFixed(2) || '0.00'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">Non-billable</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {!entry.ai_summary && (
                      <Button
                        onClick={() => onAiInsights(entry)}
                        variant="ghost"
                        size="icon"
                        disabled={isAiProcessing}
                        className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                      >
                        <Brain className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button onClick={() => onEdit(entry)} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg">
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button onClick={() => onDelete(entry.id)} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop High-Density Table (>= md) */}
          <div className="hidden md:block bg-card border border-border/80 rounded-[22px] shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left text-foreground">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-extrabold border-b border-border/80">
                <tr>
                  <th className="px-5 py-3.5">Activity</th>
                  <th className="px-4 py-3.5">Project / Tags</th>
                  <th className="px-4 py-3.5">Billing</th>
                  <th className="px-4 py-3.5 text-right">Duration</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 max-w-[300px]">
                        <span className="font-bold text-foreground text-sm truncate">{entry.description || '(No description)'}</span>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Calendar className="w-3 h-3" /> {entry.date}
                        </div>
                        {entry.ai_summary && (
                          <p className="text-[11px] text-primary/80 bg-primary/5 p-1.5 rounded-lg border border-primary/10 leading-snug">
                            ✨ {entry.ai_summary}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        {entry.project_id && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                            <Tag className="w-3 h-3" /> {entry.project_id}
                          </span>
                        )}
                        {entry.ai_tags && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {entry.ai_tags.split(',').map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded font-medium">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {entry.is_billable === 1 ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold w-fit border border-emerald-500/20">
                            <DollarSign className="w-3 h-3" /> Billable
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-1 font-medium">${entry.hourly_rate}/hr &rarr; <span className="font-bold text-foreground">${entry.total_amount?.toFixed(2)}</span></span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                          Non-billable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono font-black text-sm text-foreground bg-muted/60 px-2 py-1 rounded-lg">
                        {formatDuration(entry.duration_minutes)}
                      </span>
                      <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                        {entry.status || 'Logged'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!entry.ai_summary && (
                          <Button 
                            onClick={() => onAiInsights(entry)}
                            variant="ghost" 
                            size="icon" 
                            disabled={isAiProcessing}
                            className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                            title="Generate AI Insights"
                          >
                            <Brain className="w-4 h-4" />
                          </Button>
                        )}
                        <Button onClick={() => onEdit(entry)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => onDelete(entry.id)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    );
}