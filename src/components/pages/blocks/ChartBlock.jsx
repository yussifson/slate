import React from 'react';
import { useQuery} from '@tanstack/react-query';
import { base44} from '@/api/base44Client';
import { cn} from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid} from 'recharts';

export default function ChartBlock({ dataConfig, styleConfig}) {
 const { table, filter, xAxis, yAxis, chartType = 'bar'} = dataConfig;
 const { theme, padding, height = 300} = styleConfig || {};

 const { data = [], isLoading} = useQuery({
 queryKey: ['dynamic_chart', table, filter],
 queryFn: () => base44.entities[table].filter(filter || {}),
 enabled: !!table
});

 const bgClass = theme === 'dark' ? 'bg-slate-900 text-white border-primary/40' : 'bg-card text-card-foreground border-primary/40';
 const padClass = padding || 'p-4';

 // Aggregate data for the chart
 const aggregatedData = React.useMemo(() => {
 if (!xAxis || !yAxis) return data;
 const agg = {};
 data.forEach(item => {
 const xVal = item[xAxis] || 'Unknown';
 if (!agg[xVal]) agg[xVal] = 0;
 agg[xVal] += Number(item[yAxis]) || 1; // Sum or Count
});
 return Object.keys(agg).map(k => ({ [xAxis]: k, [yAxis]: agg[k]}));
}, [data, xAxis, yAxis]);

 return (
 <div className={cn("rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 flex flex-col", bgClass, padClass)}>
 {isLoading ? (
 <div className="flex-1 flex items-center justify-center text-[#71717a] dark:text-gray-400" style={{ height}}>
 Loading chart data...
 </div>
 ) : (
 <div style={{ width: '100%', height}}>
 <ResponsiveContainer width="100%" height="100%">
 {chartType === 'line' ? (
 <LineChart data={aggregatedData}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
 <XAxis dataKey={xAxis} stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
 <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
 <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
 <Line type="monotone" dataKey={yAxis} stroke="#4f46e5" strokeWidth={3} dot={{ r: 4}} activeDot={{ r: 6}} />
 </LineChart>
 ) : (
 <BarChart data={aggregatedData}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
 <XAxis dataKey={xAxis} stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
 <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
 <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9'}} />
 <Bar dataKey={yAxis} fill="#4f46e5" radius={[4, 4, 0, 0]} />
 </BarChart>
 )}
 </ResponsiveContainer>
 </div>
 )}
 </div>
 );
}
