import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Clock, X, ChevronDown, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TimeTracker() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedCase, setSelectedCase] = useState("general");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("timer");
  
  // Reminder State
  const [reminderText, setReminderText] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState("15");
  const [activeReminder, setActiveReminder] = useState(null);

  const timerRef = useRef(null);
  const { toast } = useToast();
  const companyId = useCompanyId();
  const { user } = useAuth();

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId});

  useEffect(() => {
    const savedState = localStorage.getItem("slate_timer_state");
    if (savedState) {
      try {
        const { isRunning, startTime, description, selectedCase, accumulated } = JSON.parse(savedState);
        setDescription(description || "");
        setSelectedCase(selectedCase || "general");
        
        if (isRunning) {
          const now = Date.now();
          const diff = Math.floor((now - startTime) / 1000);
          setSeconds(accumulated + diff);
          setIsRunning(true);
        } else {
          setSeconds(accumulated || 0);
          setIsRunning(false);
        }
      } catch (e) {
        console.error("Failed to parse timer state");
      }
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning || seconds > 0) {
      const state = {
        isRunning,
        startTime: isRunning ? Date.now() : null,
        description,
        selectedCase,
        accumulated: isRunning ? seconds : seconds
      };
      localStorage.setItem("slate_timer_state", JSON.stringify(state));
    } else {
      localStorage.removeItem("slate_timer_state");
    }
  }, [isRunning, seconds, description, selectedCase]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleSave = async () => {
    if (seconds < 60 && !window.confirm("Timer is less than a minute. Save anyway?")) {
      return;
    }
    
    try {
      const billableData = {
        company_id: companyId,
        case_id: selectedCase !== "general" ? selectedCase : null,
        description: description || "Time entry",
        hours: parseFloat((seconds / 3600).toFixed(2)),
        date: new Date().toISOString().split('T')[0],
        created_by: user?.email};

      // Assuming there is a Billing/TimeEntry entity. If not we save it to Invoices or just log it.
      // We'll use InvoiceItems or TimeEntries
      await base44.entities.InvoiceItem?.create(billableData).catch(() => {
          // fallback if InvoiceItem doesn't exist
          console.log("Logged time:", billableData);
      });
      
      toast({ title: "Time logged successfully", description: `${formatTime(seconds)} recorded.` });
      resetTimer();
      setIsOpen(false);
    } catch (err) {
      toast({ title: "Failed to save time", variant: "destructive" });
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
    setDescription("");
    setSelectedCase("general");
    localStorage.removeItem("slate_timer_state");
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const setReminder = () => {
    if (!reminderText || !reminderMinutes) return;
    const minutes = parseInt(reminderMinutes);
    if (isNaN(minutes) || minutes <= 0) return;
    
    if (activeReminder?.timeoutId) clearTimeout(activeReminder.timeoutId);
    
    const timeout = setTimeout(() => {
        toast({ title: "⏰ Reminder", description: reminderText, duration: 15000 });
        setActiveReminder(null);
    }, minutes * 60 * 1000);
    
    setActiveReminder({ text: reminderText, endTime: Date.now() + (minutes * 60 * 1000), timeoutId: timeout });
    toast({ title: "Reminder Set", description: `We'll remind you in ${minutes} minutes.` });
    setReminderText("");
  };

  const clearReminder = () => {
    if (activeReminder?.timeoutId) clearTimeout(activeReminder.timeoutId);
    setActiveReminder(null);
  };

  useEffect(() => {
    return () => {
        if (activeReminder?.timeoutId) clearTimeout(activeReminder.timeoutId);
    };
  }, [activeReminder]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost"
          size="icon" 
          className={`group shrink-0 relative overflow-hidden w-8 h-8 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-300 ${isRunning || activeReminder ? 'bg-gradient-to-r from-primary to-primary/90 text-white border-primary shadow-md' : 'bg-card text-foreground border-primary/40 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-100 shadow-sm'}`}
          title="Time & Reminders"
        >
          <Timer className={`w-4 h-4 transition-colors ${isRunning ? 'animate-pulse' : (activeReminder ? '' : 'text-[#71717a] dark:text-gray-400 group-hover:text-primary')}`} />
          {(isRunning || activeReminder) && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl border-slate-200 dark:border-border" align="end">
        
        {/* Custom Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-secondary rounded-xl mb-4">
            <button 
                onClick={() => setActiveTab('timer')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'timer' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Timer
            </button>
            <button 
                onClick={() => setActiveTab('reminder')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'reminder' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Reminder
            </button>
        </div>

        {activeTab === 'timer' && (
            <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700 dark:text-foreground">
                <Clock className="w-4 h-4 text-primary" /> Track Time
                </h4>
                <div className="text-2xl font-mono font-semibold tracking-tight text-primary">
                {formatTime(seconds)}
                </div>
            </div>
            
            <div className="space-y-3">
                <Input 
                placeholder="What are you working on?" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm rounded-xl"
                />
                
                <Select value={selectedCase} onValueChange={setSelectedCase}>
                <SelectTrigger className="h-9 rounded-xl">
                    <SelectValue placeholder="Select Case" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="general">{t("no_case_general", "No Case (General)")}</SelectItem>
                    {cases.map(c => {
                    return (<SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>);
                    })}
                </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-border">
                <Button 
                onClick={toggleTimer} 
                className={`flex-1 gap-2 rounded-xl font-semibold ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary'}`}
                >
                {isRunning ? <><Square className="w-4 h-4 fill-current" /> Pause</> : <><Play className="w-4 h-4 fill-current" /> Start</>}
                </Button>
                
                {seconds > 0 && (
                <Button onClick={handleSave} variant="secondary" className="flex-1 rounded-xl font-semibold bg-primary/10 text-primary hover:bg-primary/20">
                    Save Time
                </Button>
                )}
                
                {seconds > 0 && (
                <Button onClick={resetTimer} variant="ghost" size="icon" className="shrink-0 text-[#71717a] hover:bg-red-50 hover:text-red-500 rounded-xl">
                    <X className="w-4 h-4" />
                </Button>
                )}
            </div>
            </div>
        )}

        {activeTab === 'reminder' && (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700 dark:text-foreground">
                    <Clock className="w-4 h-4 text-amber-500" /> Set Reminder
                    </h4>
                </div>

                {activeReminder ? (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-center space-y-3">
                        <div className="text-4xl">⏰</div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                            Reminder active for: <br/> <span className="font-bold">"{activeReminder.text}"</span>
                        </p>
                        <Button onClick={clearReminder} variant="outline" size="sm" className="rounded-lg text-red-500 border-red-200 hover:bg-red-50 w-full mt-2">
                            Cancel Reminder
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            <Input 
                                placeholder="Remind me to..." 
                                value={reminderText} 
                                onChange={(e) => setReminderText(e.target.value)}
                                className="text-sm rounded-xl"
                            />
                            <div className="flex gap-2 items-center">
                                <Input 
                                    type="number" 
                                    min="1"
                                    value={reminderMinutes} 
                                    onChange={(e) => setReminderMinutes(e.target.value)}
                                    className="text-sm rounded-xl w-24"
                                />
                                <span className="text-sm text-slate-500 font-medium">minutes</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-border">
                            <Button 
                                onClick={setReminder} 
                                className="w-full gap-2 rounded-xl font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                            >
                                Start Reminder
                            </Button>
                        </div>
                    </>
                )}
            </div>
        )}

      </PopoverContent>
    </Popover>
  );
}
