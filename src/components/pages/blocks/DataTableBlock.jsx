import React from 'react';
import { useQuery} from '@tanstack/react-query';
import { base44} from '@/api/base44Client';
import { cn} from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';

export default function DataTableBlock({ dataConfig, styleConfig}) {
 const { table, filter, sort, limit, columns} = dataConfig;
 const { theme, padding} = styleConfig || {};

 const { data = [], isLoading} = useQuery({
 queryKey: ['dynamic_table', table, filter, sort, limit],
 queryFn: async () => {
 let res = await base44.entities[table].filter(filter || {}, sort);
 if (limit) res = res.slice(0, limit);
 return res;
},
 enabled: !!table
});

 const bgClass = theme === 'dark' ? 'bg-slate-900 text-white border-primary/40' : 'bg-card text-card-foreground border-primary/40';
 const padClass = padding || 'p-0';

 return (
 <div className={cn("rounded-xl border overflow-hidden", bgClass, padClass)}>
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className={theme === 'dark' ? 'border-primary/40 hover:bg-slate-800/50' : ''}>
 {columns.map((col, i) => (
 <TableHead key={i} className="font-bold whitespace-nowrap">
 {col.label || col.field}
 </TableHead>
 ))}
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
 Loading data...
 </TableCell>
 </TableRow>
 ) : data.length === 0 ? (
 <TableRow>
 <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
 No records found
 </TableCell>
 </TableRow>
 ) : (
 data.map((row, i) => (
 <TableRow key={row.id || i} className={theme === 'dark' ? 'border-primary/40 hover:bg-slate-800/50' : ''}>
 {columns.map((col, j) => (
 <TableCell key={j}>
 {row[col.field]}
 </TableCell>
 ))}
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 );
}
