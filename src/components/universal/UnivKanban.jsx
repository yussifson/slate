import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, AlignLeft } from 'lucide-react';

export default function UnivKanban({ 
  stages = ['To Do', 'In Progress', 'In Review', 'Done'],
  data = [],
  title = "Kanban Board",
  searchPlaceholder = "Search tasks..."
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Default mock data
  const displayData = data.length > 0 ? data : [
    { id: 1, title: 'Design landing page', stage: 'To Do', priority: 'High', assignee: 'Alice' },
    { id: 2, title: 'Setup database schema', stage: 'In Progress', priority: 'Critical', assignee: 'Bob' },
    { id: 3, title: 'Implement Auth', stage: 'In Review', priority: 'Medium', assignee: 'Charlie' },
    { id: 4, title: 'Write tests', stage: 'Done', priority: 'Low', assignee: 'Alice' },
  ];

  const filteredData = displayData.filter(item => {
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-500/10 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-500/10 border-orange-200';
      case 'Medium': return 'text-blue-600 bg-blue-100 dark:bg-blue-500/10 border-blue-200';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center justify-between mb-6 shrink-0 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">Visualize your workflows and drag to update.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64 hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Card
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex gap-4 pb-4 custom-scrollbar snap-x">
        {stages.map(stage => {
          const stageItems = filteredData.filter(item => item.stage === stage);
          return (
            <div key={stage} className="flex-shrink-0 w-80 bg-muted/30 border border-border rounded-2xl flex flex-col snap-center">
              <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/40 rounded-t-2xl">
                <h3 className="font-bold text-sm text-foreground tracking-tight">{stage}</h3>
                <span className="px-2 py-0.5 rounded-full bg-background border border-border text-xs font-medium text-muted-foreground shadow-sm">
                  {stageItems.length}
                </span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                <AnimatePresence>
                  {stageItems.map(item => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item.id} 
                      className="bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md border ${getPriorityColor(item.priority)}`}>
                          {item.priority || 'Normal'}
                        </span>
                        <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground leading-snug">{item.title}</h4>
                      {item.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2"><AlignLeft className="w-3 h-3 inline mr-1" />{item.description}</p>}
                      <div className="mt-4 flex items-center justify-between">
                         <div className="flex -space-x-2">
                           <div className="w-7 h-7 rounded-full border-2 border-card bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                             {item.assignee ? item.assignee.charAt(0) : 'U'}
                           </div>
                         </div>
                         <div className="flex gap-2">
                             {stage !== stages[0] && <button className="hover:text-primary text-xs text-muted-foreground">&larr;</button>}
                             {stage !== stages[stages.length-1] && <button className="hover:text-primary text-xs text-muted-foreground">&rarr;</button>}
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {stageItems.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-xs text-muted-foreground font-medium bg-card/20">
                    No cards
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
