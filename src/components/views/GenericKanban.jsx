import React from 'react';
import { motion} from 'framer-motion';

export default function GenericKanban({ data, statusKey, titleKey}) {
 if (!data || data.length === 0) return <div className="p-8 text-center text-[#71717a] dark:text-gray-400">No data for Kanban view.</div>;
 
 const statuses = [...new Set(data.map(d => d[statusKey]).filter(Boolean))];
 if (statuses.length === 0) return <div className="p-8 text-center text-[#71717a] dark:text-gray-400">No valid status field found for Kanban.</div>;

 return (
 <div className="flex gap-6 p-6 overflow-x-auto min-h-[600px] bg-muted/5 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 {statuses.map(status => {
 const items = data.filter(d => d[statusKey] === status);
 return (
 <div key={status} className="flex-shrink-0 w-[320px] bg-muted/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-3xl p-4 flex flex-col h-full ">
 <div className="flex justify-between items-center mb-5 px-2">
 <h3 className="font-extrabold text-foreground tracking-tight uppercase text-sm tracking-[0.04em]">{status}</h3>
 <span className="bg-background text-foreground text-xs font-semibold px-2.5 py-1 rounded-md-full border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 tracking-[0.04em]">{items.length}</span>
 </div>
 <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
 {items.map((item, i) => (
 <motion.div key={item.id || i} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-md-2xl -[0_2px_8px_-2px_rgba(0,0,0,0.05)] -[0_4px_12px_-4px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h4 className="font-semibold text-sm text-foreground mb-3 leading-snug">{item[titleKey] || 'Untitled'}</h4>
 <div className="flex flex-wrap gap-2.5">
 {Object.keys(item).filter(k => k !== 'company_id' && k !== 'id' && k !== 'created_at' && k !== statusKey && k !== titleKey).slice(0, 3).map(k => (
 <span key={k} className="bg-muted text-[#71717a] dark:text-gray-400 font-medium text-[10px] px-2 py-1 rounded-lg capitalize truncate max-w-[120px]">{String(item[k] || '')}</span>
 ))}
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 );
})}
 </div>
 );
}
