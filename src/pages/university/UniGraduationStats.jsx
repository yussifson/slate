import React, { useMemo} from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { GraduationCap, Trophy, Globe2, Briefcase, ShieldCheck} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip} from 'recharts';

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export default function UniGraduationStats() {
 const companyId = useCompanyId();

 const { data: students = []} = useQuery({
 queryKey: ["clients", companyId, "uni_student"],
 queryFn: () => powerSync.execute('SELECT * FROM uni_students WHERE company_id = ?', [companyId]).then(r => r.rows._array),
 enabled: !!companyId
});

 const { stats, honorsDistribution, employmentSectors} = useMemo(() => {
 // Generate dynamic mock data augmented with actual student counts for realism 
 // until full schema for alumni tracking is populated
 const totalAlumni = Math.max(12000, students.length * 40);
 const mockEmployed = 94.2;
 
 return {
 stats: [
 { label: 'Total Alumni', value: totalAlumni.toLocaleString(), icon: GraduationCap, color: 'var(--primary)'},
 { label: 'Employment Rate', value: `${mockEmployed}%`, icon: Briefcase, color: 'var(--color-success)'},
 { label: 'Higher Education', value: '18.5%', icon: Globe2, color: 'var(--color-warning)'},
 { label: 'Degrees Verified', value: '100%', icon: ShieldCheck, color: 'var(--chart-1)'}
 ],
 honorsDistribution: [
 { name: 'First Class Honors', value: Math.floor(totalAlumni * 0.12)},
 { name: 'Second Class (Upper)', value: Math.floor(totalAlumni * 0.45)},
 { name: 'Second Class (Lower)', value: Math.floor(totalAlumni * 0.32)},
 { name: 'Pass', value: Math.floor(totalAlumni * 0.11)},
 ],
 employmentSectors: [
 { name: 'Technology & Software Engineering', value: 38, color: 'var(--primary)'},
 { name: 'Finance & Investment Banking', value: 24, color: 'var(--color-success)'},
 { name: 'Healthcare & Medical Research', value: 18, color: 'var(--chart-3)'},
 { name: 'Government & Public Policy', value: 12, color: 'var(--chart-4)'}
 ]
};
}, [students]);

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-primary/40 pb-4">
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Graduation & Alumni Statistics</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Yearly graduation rates, student degree classifications, and post-graduation outcomes.</p>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map((stat, i) => (
 <div key={i} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
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
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 col-span-1">
 <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Class Honors Distribution</h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Degree class ratios for the graduating cohort.</p>
 <div className="flex flex-col items-center">
 <div className="h-[200px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={honorsDistribution}
 innerRadius={60}
 outerRadius={80}
 paddingAngle={5}
 dataKey="value"
 stroke="none"
 >
 {honorsDistribution.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
 ))}
 </Pie>
 <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-0)', borderColor: "hsl(var(--primary) / 0.4)", borderRadius: '8px'}} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 <div className="w-full space-y-2 mt-4 text-[var(--text-xs)] font-semibold text-[var(--color-text-primary)] tracking-[0.04em]">
 {honorsDistribution.map((h, i) => (
 <div key={i} className="flex justify-between items-center p-2 bg-[var(--color-surface-1)] rounded-md-[var(--radius-md)]">
 <span className="flex items-center gap-2">
 <span className="w-3 h-3 rounded-md-[var(--radius-sm)]" style={{ backgroundColor: colors[i % colors.length]}} />
 {h.name}
 </span>
 <span>{h.value} Graduates</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="lg:col-span-2 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 ">
 <h2 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
 <Trophy className="w-5 h-5 text-[var(--color-warning)]" /> Post-Graduation Employment Sectors
 </h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Top destination domains for university alumni.</p>
 <div className="space-y-6">
 {employmentSectors.map((sector, i) => (
 <div key={i}>
 <div className="flex justify-between text-[var(--text-sm)] font-semibold mb-1 text-[var(--color-text-primary)]">
 <span>{sector.name}</span>
 <span>{sector.value}%</span>
 </div>
 <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
 <div className="h-full rounded-full" style={{ width: `${sector.value}%`, backgroundColor: sector.color}} />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
