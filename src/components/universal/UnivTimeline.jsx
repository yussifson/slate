import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Circle, Flag, Calendar, Plus } from 'lucide-react';

export default function UnivTimeline({
  title = "Project Timeline",
  subtitle = "Track milestones and phase completion.",
  milestones = [
    { id: 1, title: 'Project Kickoff', date: '2026-06-01', status: 'completed', description: 'Initial requirements gathering and team alignment.' },
    { id: 2, title: 'Phase 1 Delivery', date: '2026-06-15', status: 'current', description: 'Core generic UI components deployed to staging.' },
    { id: 3, title: 'Client Review', date: '2026-06-20', status: 'upcoming', description: 'Feedback loop with stakeholders.' },
    { id: 4, title: 'Final Launch', date: '2026-07-01', status: 'upcoming', description: 'Production deployment and hand-off.' }
  ]
}) {
  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl w-full mx-auto py-8 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
             <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
             <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
             <Plus className="w-4 h-4" /> Add Milestone
          </button>
        </div>

        <div className="relative border-l-2 border-border ml-3 sm:ml-6 space-y-8 pb-12">
          {milestones.map((ms, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={ms.id} 
              className="relative pl-8 sm:pl-12 group"
            >
              {/* Timeline Node */}
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-background transition-colors ${
                ms.status === 'completed' ? 'bg-emerald-500 text-white' : 
                ms.status === 'current' ? 'bg-primary text-white' : 
                'bg-muted border-2 border-border text-transparent'
              }`}>
                {ms.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {ms.status === 'current' && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </div>

              {/* Content Card */}
              <div className={`bg-card border rounded-2xl p-5 sm:p-6 transition-all duration-300 ${ms.status === 'current' ? 'border-primary shadow-md' : 'border-border shadow-sm group-hover:border-primary/40'}`}>
                 <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                   <h3 className="text-lg font-bold text-foreground">{ms.title}</h3>
                   <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                     <Calendar className="w-3.5 h-3.5" /> {ms.date}
                   </span>
                 </div>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   {ms.description}
                 </p>
                 
                 {/* Decorative elements based on status */}
                 {ms.status === 'completed' && (
                   <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                     <CheckCircle2 className="w-4 h-4" /> Completed on time
                   </div>
                 )}
                 {ms.status === 'current' && (
                   <div className="mt-4">
                     <div className="flex justify-between text-xs font-semibold mb-1">
                       <span className="text-primary">In Progress</span>
                       <span className="text-muted-foreground">65%</span>
                     </div>
                     <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-primary rounded-full w-[65%]"></div>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          ))}
          
          {/* End Flag */}
          <div className="absolute -left-[11px] bottom-0 w-5 h-5 rounded-full bg-muted border-2 border-border flex items-center justify-center ring-4 ring-background text-muted-foreground">
             <Flag className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
