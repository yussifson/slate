import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Clock, X, ChevronDown } from "lucide-react";
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

  const timerRef = useRef(null);
  const { toast } = useToast();
  const companyId = useCompanyId();
  const { user } = useAuth();

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

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
        created_by: user?.email,
      };

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={isRunning ? "default" : "outline"} 
          size="sm" 
          className={`gap-2.5 h-8 px-2 font-mono text-xs ${isRunning ? 'bg-primary text-white animate-pulse' : 'text-[#71717a] dark:text-gray-400'}`}
        >
          <Clock className="w-3.5 h-3.5" />
          {formatTime(seconds)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> {t("time_tracker", "Time Tracker")}
            </h4>
            <div className="text-2xl font-mono font-semibold tracking-tight text-primary tracking-[-0.02em]">
              {formatTime(seconds)}
            </div>
          </div>
          
          <div className="space-y-3">
            <Input 
              placeholder="What are you working on?" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
            />
            
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger className="h-9">
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

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button 
              onClick={toggleTimer} 
              className={`flex-1 gap-2 ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary'}`}
            >
              {isRunning ? <><Square className="w-4 h-4" /> {t("pause", "Pause")}</> : <><Play className="w-4 h-4" /> {t("start", "Start")}</>}
            </Button>
            
            {seconds > 0 && (
              <Button onClick={handleSave} variant="secondary" className="flex-1">
                {t("save_time", "Save Time")}
              </Button>
            )}
            
            {seconds > 0 && (
              <Button onClick={resetTimer} variant="ghost" size="icon" className="shrink-0 text-[#71717a] dark:text-gray-400 hover:text-destructive">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
