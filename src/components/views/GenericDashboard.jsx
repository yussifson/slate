import React from 'react';
import { TrendingUp, DollarSign, Activity, PieChart} from 'lucide-react';

export default function GenericDashboard({ data, metricKeys}) {
 if (!data || data.length === 0) return <div className="p-8 text-center text-muted-foreground">No data for Dashboard view.</div>;

 const totals = metricKeys.reduce((acc, key) => {
 acc[key] = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
 return acc;
}, {});

 const icons = [<DollarSign className="w-5 h-5"/>, <TrendingUp className="w-5 h-5"/>, <Activity className="w-5 h-5"/>, <PieChart className="w-5 h-5"/>];

 return (
 <div className="p-4 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {metricKeys.slice(0, 4).map((key, i) => (
 <div key={key} className="bg-card p-6 rounded-2xl border border-border flex flex-col">
 <div className="flex justify-between items-start mb-4">
 <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
 <div className="p-2 bg-primary/10 text-primary rounded-lg">{icons[i % icons.length]}</div>
 </div>
 <h3 className="text-3xl font-black text-foreground">
 {key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('price') || key.toLowerCase().includes('spend') ? '$' : ''}
 {totals[key].toLocaleString(undefined, { maximumFractionDigits: 2})}
 </h3>
 </div>
 ))}
 {Array.from({ length: Math.max(0, 4 - metricKeys.length)}).map((_, i) => (
 <div key={'empty-'+i} className="bg-muted/10 p-6 rounded-2xl border border-dashed border-primary/50 flex flex-col items-center justify-center text-muted-foreground">
 <span className="text-xs font-semibold uppercase tracking-widest opacity-50">Empty Metric</span>
 </div>
 ))}
 </div>
 
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 h-[400px] flex items-center justify-center">
 <div className="text-center">
 <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
 <p className="text-muted-foreground font-medium">Chart visualization would render here.</p>
 </div>
 </div>
 <div className="bg-card border border-border rounded-2xl p-6 h-[400px] overflow-y-auto custom-scrollbar">
 <h4 className="font-bold text-lg mb-4 text-foreground">Top Records</h4>
 <div className="space-y-3">
 {data.slice(0, 8).map((item, i) => (
 <div key={item.id || i} className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border border-border/50">
 <span className="font-medium text-sm truncate max-w-[150px]">{item[Object.keys(item).find(k => typeof item[k] === 'string' && k !== 'id' && k !== 'company_id')] || 'Record '+(i+1)}</span>
 <span className="font-bold text-primary text-sm">{item[metricKeys[0]] || 0}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
