import React from 'react';
import { motion} from 'framer-motion';

export default function GenericKanban({ data, statusKey, titleKey}) {
 if (!data || data.length === 0) return <div className="p-8 text-center text-muted-foreground">No data for Kanban view.</div>;
 
 const statuses = [...new Set(data.map(d => d[statusKey]).filter(Boolean))];
 if (statuses.length === 0) return <div className="p-8 text-center text-muted-foreground">No valid status field found for Kanban.</div>;

 return (
 <div className="flex gap-6 p-6 overflow-x-auto min-h-[600px] bg-muted/5 rounded-xl border border-border/50">
 {statuses.map(status => {
 const items = data.filter(d => d[statusKey] === status);
 return (
 <div key={status} className="flex-shrink-0 w-[320px] bg-muted/30 border border-border/60 rounded-3xl p-4 flex flex-col h-full ">
 <div className="flex justify-between items-center mb-5 px-2">
 <h3 className="font-extrabold text-foreground tracking-tight uppercase text-sm">{status}</h3>
 <span className="bg-background text-foreground text-xs font-bold px-2.5 py-1 rounded-full border border-border">{items.length}</span>
 </div>
 <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
 {items.map((item, i) => (
 <motion.div key={item.id || i} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-card border border-border p-4 rounded-2xl -[0_2px_8px_-2px_rgba(0,0,0,0.05)] -[0_4px_12px_-4px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing">
 <h4 className="font-bold text-sm text-foreground mb-3 leading-snug">{item[titleKey] || 'Untitled'}</h4>
 <div className="flex flex-wrap gap-1.5">
 {Object.keys(item).filter(k => k !== 'company_id' && k !== 'id' && k !== 'created_at' && k !== statusKey && k !== titleKey).slice(0, 3).map(k => (
 <span key={k} className="bg-muted text-muted-foreground font-medium text-[10px] px-2 py-1 rounded-md capitalize truncate max-w-[120px]">{String(item[k] || '')}</span>
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
