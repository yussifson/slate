import React from 'react';
import { useQuery} from '@tanstack/react-query';
import { base44} from '@/api/base44Client';
import { cn} from '@/lib/utils';
import { Badge} from '@/components/ui/badge';

export default function KanbanBlock({ dataConfig, styleConfig}) {
 const { table, filter, groupBy, columns} = dataConfig;
 const { theme, padding} = styleConfig || {};

 const { data = [], isLoading} = useQuery({
 queryKey: ['dynamic_kanban', table, filter],
 queryFn: () => base44.entities[table].filter(filter || {}),
 enabled: !!table && !!groupBy
});

 const bgClass = theme === 'dark' ? 'bg-slate-900 text-white border-primary/40' : 'bg-card text-card-foreground border-primary/40';
 const padClass = padding || 'p-4';

 const groupedData = data.reduce((acc, curr) => {
 const key = curr[groupBy] || 'Uncategorized';
 if (!acc[key]) acc[key] = [];
 acc[key].push(curr);
 return acc;
}, {});

 const allColumns = columns || Object.keys(groupedData);

 return (
 <div className={cn("rounded-xl border-[0.5px] border-black/9 dark:border-white/8 overflow-x-auto", bgClass, padClass)}>
 {isLoading ? (
 <div className="py-10 text-center text-[#71717a] dark:text-gray-400">Loading Kanban...</div>
 ) : (
 <div className="flex gap-4 min-w-max pb-2">
 {allColumns.map((colName) => {
 const items = groupedData[colName] || [];
 return (
 <div key={colName} className="w-80 flex-shrink-0 flex flex-col bg-muted/30 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-3">
 <div className="flex items-center justify-between mb-3 px-1">
 <h3 className="font-semibold text-sm capitalize">{colName.replace(/_/g, ' ')}</h3>
 <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
 </div>
 <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
 {items.map((item, i) => (
 <div key={item.id || i} className={cn("p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 cursor-grab active:cursor-grabbing", theme === 'dark' ? 'bg-slate-800 border-primary/40' : 'bg-background border-primary/40')}>
 <div className="font-medium text-sm mb-1">{item.name || item.title || item.subject || `Record ${item.id.slice(0,5)}`}</div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 line-clamp-2 tracking-[0.04em]">{item.description || item.email || item.notes || ''}</div>
 </div>
 ))}
 {items.length === 0 && (
 <div className="py-6 text-center text-xs text-[#71717a] dark:text-gray-400 border-2 border-dashed border-primary/40 rounded-xl tracking-[0.04em]">
 No items
 </div>
 )}
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 );
}
