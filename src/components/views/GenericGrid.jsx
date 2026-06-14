import React from 'react';
import { LayoutGrid} from 'lucide-react';
import { motion} from 'framer-motion';

export default function GenericGrid({ data}) {
 if (!data || data.length === 0) return <div className="p-8 text-center text-muted-foreground">No data for Grid view.</div>;

 return (
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-muted/5">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
 {data.map((item, i) => {
 // Exclude internal IDs and long text
 const entries = Object.entries(item).filter(([k, v]) => 
 k !== 'id' && k !== 'company_id' && typeof v !== 'object' && String(v).length < 50
 ).slice(0, 5);
 
 return (
 <motion.div 
 key={item.id || i}
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 transition={{ delay: i * 0.02}}
 className="bg-card border border-primary/40 p-5 rounded-2xl transition-all group flex flex-col h-full"
 >
 <div className="flex items-start justify-between mb-4">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
 <LayoutGrid className="w-5 h-5" />
 </div>
 </div>
 <div className="flex-1 space-y-3">
 {entries.map(([k, v]) => (
 <div key={k} className="flex flex-col">
 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{k.replace(/_/g, ' ')}</span>
 <span className="text-sm font-medium text-foreground truncate">{String(v || '—')}</span>
 </div>
 ))}
 </div>
 </motion.div>
 );
})}
 </div>
 </div>
 );
}
