import React, { useState, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, Video, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function UnivCalendar({
  title = "Calendar",
  subtitle = "Manage your schedule and appointments.",
  companyId,
  pageName,
  tableName
}) {

  const [view, setView] = useState('Month'); // Month, Week, Day
  const [isAdding, setIsAdding] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const targetTable = tableName || 'industry_records';

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['orbit_records', companyId, pageName, targetTable],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase.from(targetTable).select('*').eq('company_id', companyId);
      if (targetTable === 'industry_records') {
        query = query.eq('industry', 'orbit_build_data').eq('record_type', pageName);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      return data || [];
    },
    enabled: !!companyId
  });

  const addMutation = useMutation({
    mutationFn: async (newData) => {
      let payload;
      if (targetTable === 'industry_records') {
        payload = { company_id: companyId, industry: 'orbit_build_data', record_type: pageName, data: newData, search_text: Object.values(newData).join(' ') };
      } else {
        payload = { ...newData, company_id: companyId };
      }
      const { data, error } = await supabase.from(targetTable).insert([payload]);
      if (error) throw error;
      return data;
    },
    onError: (err) => {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
      queryClient.invalidateQueries(['orbit_dynamic_records', companyId]);
      setIsAdding(false);
      setNewEventTitle('');
      toast({ title: 'Success', description: 'Event added successfully.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(targetTable).delete().eq('id', id);
      if (error) throw error;
    },
    onError: (err) => {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
      queryClient.invalidateQueries(['orbit_dynamic_records', companyId]);
      toast({ title: 'Deleted', description: 'Event removed.' });
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    addMutation.mutate({
      title: newEventTitle,
      time: '12:00 PM',
      type: 'internal',
      day: 10 // Mock placing it on the 10th for demonstration
    });
  };

  const displayEvents = React.useMemo(() => {
    return records.map(r => targetTable === 'industry_records' ? { id: r.id, ...r.data } : r);
  }, [records, targetTable]);

  // Simple mock month view generation
  const days = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - 2; // offset to simulate start of month
    if (dayNum < 1) return { day: '', inactive: true };
    if (dayNum > 31) return { day: '', inactive: true };
    return { day: dayNum, inactive: false, isToday: dayNum === 10 };
  });

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden border border-border shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-border bg-card flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl hidden sm:block">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            {['Month', 'Week', 'Day'].map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)} 
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button className="p-1.5 hover:bg-background rounded-md text-muted-foreground transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-semibold px-3">Today</span>
            <button className="p-1.5 hover:bg-background rounded-md text-muted-foreground transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="p-4 bg-card border-b border-border shadow-sm shrink-0">
          <form onSubmit={handleAdd} className="flex items-end gap-4 max-w-2xl">
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Event Title</label>
              <input 
                autoFocus
                type="text" 
                value={newEventTitle} 
                onChange={e => setNewEventTitle(e.target.value)} 
                placeholder="Enter event title..." 
                className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" 
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="h-10 rounded-xl">Cancel</Button>
            <Button type="submit" disabled={addMutation.isPending} className="h-10 bg-primary text-white rounded-xl">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Event'}
            </Button>
          </form>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col bg-card overflow-y-auto">
           {isLoading ? (
             <div className="flex-1 flex items-center justify-center">
               <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
             </div>
           ) : view === 'Month' && (
             <div className="flex-1 flex flex-col min-w-[600px]">
               {/* Days of week header */}
               <div className="grid grid-cols-7 border-b border-border bg-muted/30 shrink-0">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                   <div key={day} className="py-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border last:border-r-0">
                     {day}
                   </div>
                 ))}
               </div>
               {/* Calendar Grid */}
               <div className="flex-1 grid grid-cols-7 grid-rows-5">
                 {days.map((d, i) => {
                   const dayEvents = displayEvents.filter(ev => (ev.day || 10) === d.day);
                   return (
                     <div key={i} className={`border-r border-b border-border p-2 ${d.inactive ? 'bg-muted/10' : 'bg-card hover:bg-muted/5'} transition-colors relative min-h-[100px]`}>
                       {d.day && (
                         <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${d.isToday ? 'bg-primary text-white shadow-sm' : 'text-foreground dark:text-slate-300'}`}>
                           {d.day}
                         </span>
                       )}
                       {!d.inactive && dayEvents.length > 0 && (
                         <div className="mt-2 space-y-1">
                           {dayEvents.map(ev => (
                             <motion.div 
                               initial={{ opacity: 0, scale: 0.95 }}
                               animate={{ opacity: 1, scale: 1 }}
                               key={ev.id} 
                               className={`px-2 py-1 flex justify-between items-center text-[10px] font-bold rounded group cursor-pointer ${ev.type === 'internal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}
                             >
                               <span className="truncate">{ev.time} {ev.title}</span>
                               <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(ev.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 ml-1">
                                 <Trash2 className="w-3 h-3" />
                               </button>
                             </motion.div>
                           ))}
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             </div>
           )}
           {view !== 'Month' && (
             <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center flex-col gap-3">
               <CalendarIcon className="w-12 h-12 text-muted-foreground/30" />
               <p>{view} view placeholder. Full schedule layout renders here.</p>
             </div>
           )}
        </div>

        {/* Sidebar Schedule (Upcoming) */}
        <div className="w-72 border-l border-border bg-muted/20 hidden xl:flex flex-col">
          <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0">
            <h3 className="font-bold text-sm text-foreground">Upcoming Today</h3>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
             {displayEvents.filter(ev => (ev.day || 10) === 10).map((ev, i) => (
               <div key={ev.id} className="bg-card border border-border p-3 rounded-xl shadow-sm hover:border-primary/30 transition-colors group cursor-pointer relative">
                 <button onClick={() => deleteMutation.mutate(ev.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                 </button>
                 <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors pr-6">{ev.title}</h4>
                 <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                   <Clock className="w-3.5 h-3.5" /> {ev.time}
                 </div>
                 <div className="mt-3 flex gap-2">
                   <button className="flex-1 bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground text-xs py-1.5 rounded-lg transition-colors font-medium">View</button>
                   <button className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground rounded-lg transition-colors"><Video className="w-3.5 h-3.5" /></button>
                 </div>
               </div>
             ))}
             {!isLoading && displayEvents.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">No upcoming events.</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

