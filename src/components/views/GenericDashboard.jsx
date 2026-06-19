import React from 'react';
import { TrendingUp, DollarSign, Activity, PieChart} from 'lucide-react';

export default function GenericDashboard({ data, metricKeys}) {
 if (!data || data.length === 0) return <div className="p-8 text-center text-[#71717a] dark:text-gray-400">No data for Dashboard view.</div>;

 const totals = metricKeys.reduce((acc, key) => {
 acc[key] = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
 return acc;
}, {});

 const icons = [<DollarSign className="w-5 h-5"/>, <TrendingUp className="w-5 h-5"/>, <Activity className="w-5 h-5"/>, <PieChart className="w-5 h-5"/>];

 return (
 <div className="p-4 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {metricKeys.slice(0, 4).map((key, i) => (
 <div key={key} className="bg-card p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-start mb-4">
 <span className="text-sm font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{key.replace(/_/g, ' ')}</span>
 <div className="p-2 bg-primary/10 text-primary rounded-xl">{icons[i % icons.length]}</div>
 </div>
 <h3 className="text-3xl font-black text-foreground tracking-[-0.02em]">
 {key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('price') || key.toLowerCase().includes('spend') ? '$' : ''}
 {totals[key].toLocaleString(undefined, { maximumFractionDigits: 2})}
 </h3>
 </div>
 ))}
 {Array.from({ length: Math.max(0, 4 - metricKeys.length)}).map((_, i) => (
 <div key={'empty-'+i} className="bg-muted/10 p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400">
 <span className="text-xs font-semibold uppercase tracking-widest opacity-50 tracking-[0.04em]">Empty Metric</span>
 </div>
 ))}
 </div>
 
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-6 h-[400px] flex items-center justify-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="text-center">
 <Activity className="w-12 h-12 text-[#71717a] dark:text-gray-400/30 mx-auto mb-4" />
 <p className="text-[#71717a] dark:text-gray-400 font-medium">Chart visualization would render here.</p>
 </div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-6 h-[400px] overflow-y-auto custom-scrollbar hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h4 className="font-semibold text-lg mb-4 text-foreground">Top Records</h4>
 <div className="space-y-3">
 {data.slice(0, 8).map((item, i) => (
 <div key={item.id || i} className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <span className="font-medium text-sm truncate max-w-[150px]">{item[Object.keys(item).find(k => typeof item[k] === 'string' && k !== 'id' && k !== 'company_id')] || 'Record '+(i+1)}</span>
 <span className="font-semibold text-primary text-sm">{item[metricKeys[0]] || 0}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
