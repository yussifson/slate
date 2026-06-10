import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, Video } from 'lucide-react';

export default function UnivCalendar({
  events = [],
  title = "Calendar",
  subtitle = "Manage your schedule and appointments."
}) {
  const [view, setView] = useState('Month'); // Month, Week, Day

  // Mock events if none provided
  const displayEvents = events.length > 0 ? events : [
    { id: 1, title: 'Team Standup', time: '10:00 AM', type: 'internal' },
    { id: 2, title: 'Client Meeting', time: '02:00 PM', type: 'external' },
    { id: 3, title: 'Project Review', time: '04:30 PM', type: 'internal' }
  ];

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
            <button className="p-1.5 hover:bg-background rounded-md text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-semibold px-3">Today</span>
            <button className="p-1.5 hover:bg-background rounded-md text-slate-500 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col bg-card overflow-y-auto">
           {view === 'Month' && (
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
                 {days.map((d, i) => (
                   <div key={i} className={`border-r border-b border-border p-2 ${d.inactive ? 'bg-muted/10' : 'bg-card hover:bg-muted/5'} transition-colors relative min-h-[100px]`}>
                     {d.day && (
                       <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${d.isToday ? 'bg-primary text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}`}>
                         {d.day}
                       </span>
                     )}
                     {/* Mock events on day 10 */}
                     {d.isToday && (
                       <div className="mt-2 space-y-1">
                         {displayEvents.map(ev => (
                           <motion.div 
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             key={ev.id} 
                             className={`px-2 py-1 text-[10px] font-bold rounded truncate cursor-pointer ${ev.type === 'internal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}
                           >
                             {ev.time} {ev.title}
                           </motion.div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}
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
             {displayEvents.map((ev, i) => (
               <div key={i} className="bg-card border border-border p-3 rounded-xl shadow-sm hover:border-primary/30 transition-colors group cursor-pointer">
                 <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{ev.title}</h4>
                 <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                   <Clock className="w-3.5 h-3.5" /> {ev.time}
                 </div>
                 <div className="mt-3 flex gap-2">
                   <button className="flex-1 bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground text-xs py-1.5 rounded-lg transition-colors font-medium">View</button>
                   <button className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground rounded-lg transition-colors"><Video className="w-3.5 h-3.5" /></button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
