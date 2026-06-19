import React, { useMemo} from 'react';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Users, BookOpen, Banknote, TrendingUp, PlayCircle, Award, Star} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';

export default function OnlineDashboard() {
 const companyId = useCompanyId();

 const { data: learners = []} = useQuery({
 queryKey: ["cases", companyId, "online_learner"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_learner'}),
 enabled: !!companyId
});

 const { data: courses = []} = useQuery({
 queryKey: ["cases", companyId, "online_course"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_course'}),
 enabled: !!companyId
});

 const { data: sales = []} = useQuery({
 queryKey: ["cases", companyId, "online_sale"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_sale'}),
 enabled: !!companyId
});

 const totalRevenue = useMemo(() => {
 return sales.reduce((acc, sale) => {
 let amount = 0;
 try { amount = parseFloat(JSON.parse(sale.notes || '{}').amount) || 0;} catch(e) {}
 return acc + amount;
}, 0);
}, [sales]);

 const recentCourses = useMemo(() => courses.slice(0, 4), [courses]);

 const chartData = [];

 const stats = [
 { label: 'Total Learners', value: learners.length || 0, icon: Users, color: 'var(--primary)'},
 { label: 'Active Courses', value: courses.length || 0, icon: BookOpen, color: 'var(--color-info)'},
 { label: 'Total Sales', value: `$${totalRevenue.toLocaleString()}`, icon: Banknote, color: 'var(--color-success)'},
 { label: 'Avg. Completion', value: '0%', icon: TrendingUp, color: 'var(--color-warning)'},
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-primary/40 pb-4">
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Platform Dashboard</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Overview of your online learning platform metrics and engagement.</p>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map((stat, i) => (
 <div key={i} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 ">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">{stat.label}</p>
 <h3 className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mt-1 tracking-tight tracking-[-0.02em]">{stat.value}</h3>
 </div>
 <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`}}>
 <stat.icon className="w-6 h-6" style={{ color: stat.color}} />
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h2 className="font-semibold text-[var(--color-text-primary)]">Enrollment Trends</h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Platform-wide enrollments over the last 7 days.</p>
 </div>
 </div>
 <div className="h-[300px] w-full flex items-center justify-center border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 rounded-xl">
 <p className="text-[var(--color-text-secondary)] text-sm">Not enough data to display chart.</p>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col">
 <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Recent Courses</h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Latest additions to the catalog.</p>
 
 <div className="space-y-4 flex-1">
 {recentCourses.length === 0 ? (
 <div className="text-center p-6 border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 rounded-md-[var(--radius-lg)]">
 <PlayCircle className="w-8 h-8 mx-auto text-[var(--color-text-tertiary)] mb-2" />
 <p className="text-sm font-medium text-[var(--color-text-secondary)]">No courses found</p>
 <p className="text-xs text-[var(--color-text-tertiary)] mt-1 tracking-[0.04em]">Add courses to see them here.</p>
 </div>
 ) : (
 recentCourses.map((c, idx) => (
 <div key={idx} className="p-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-lg)] flex items-start gap-3 hover:border-[var(--primary)] transition-colors">
 <div className="w-10 h-10 rounded-md-[var(--radius-md)] bg-[var(--color-surface-2)] flex items-center justify-center flex-shrink-0">
 <PlayCircle className="w-5 h-5 text-[var(--primary)]" />
 </div>
 <div>
 <h4 className="font-semibold text-[var(--text-sm)] text-[var(--color-text-primary)]">{c.title || 'Untitled Course'}</h4>
 <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 line-clamp-1">{c.description || 'No description available.'}</p>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
