import React from 'react';
import { useQuery} from '@tanstack/react-query';
import { base44} from '@/api/base44Client';
import { cn} from '@/lib/utils';
import { Activity, Users, DollarSign, Calendar, FileText} from 'lucide-react';

const ICON_MAP = {
 Activity, Users, DollarSign, Calendar, FileText
};

export default function MetricCardBlock({ dataConfig, styleConfig}) {
 const { table, filter, aggregation, label, icon} = dataConfig;
 const { theme, padding} = styleConfig || {};

 const { data = [], isLoading} = useQuery({
 queryKey: ['dynamic_metric', table, filter],
 queryFn: () => base44.entities[table].filter(filter || {}),
 enabled: !!table
});

 let value = 0;
 if (!isLoading) {
 if (aggregation === 'count') {
 value = data.length;
} else if (aggregation === 'sum' && dataConfig.sumField) {
 value = data.reduce((acc, curr) => acc + (Number(curr[dataConfig.sumField]) || 0), 0);
}
}

 const IconComponent = ICON_MAP[icon] || Activity;

 // Basic styling interpretations from JSON
 const bgClass = theme === 'dark' ? 'bg-slate-900 text-white border-slate-800' : 'bg-card text-card-foreground border-border';
 const padClass = padding || 'p-5';

 return (
 <div className={cn("rounded-xl border flex items-center gap-4", bgClass, padClass)}>
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
 <IconComponent className="w-6 h-6" />
 </div>
 <div>
 <p className="text-3xl font-bold">{isLoading ? '...' : value}</p>
 <p className="text-sm opacity-80 font-medium">{label || 'Metric'}</p>
 </div>
 </div>
 );
}
