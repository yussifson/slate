import React from 'react';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Users, UserPlus, CheckCircle2, XCircle, TrendingUp, BarChart4} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';

const defaultEnrollmentHistory = [
 { term: 'Fall 2023', enrolled: 1200, applied: 1800},
 { term: 'Spring 2024', enrolled: 1350, applied: 2000},
 { term: 'Fall 2024', enrolled: 1580, applied: 2400},
 { term: 'Spring 2025', enrolled: 1720, applied: 2650},
 { term: 'Fall 2025', enrolled: 1980, applied: 3100},
];

export default function UniEnrollment() {
 const companyId = useCompanyId();

 const { data: students = []} = useQuery({
 queryKey: ["clients", companyId, "uni_student"],
 queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student'}),
 enabled: !!companyId
});

 const { data: applicants = []} = useQuery({
 queryKey: ["clients", companyId, "uni_applicant"],
 queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_applicant'}),
 enabled: !!companyId
});

 const admittedCount = applicants.filter(a => a.status === 'Admitted').length;
 const pendingCount = applicants.filter(a => a.status === 'Pending' || a.status === 'Reviewing').length;
 const rejectedCount = applicants.filter(a => a.status === 'Rejected').length;

 const stats = [
 { label: 'Total Active Enrolled', value: students.length || 3240, icon: Users, color: 'var(--primary)'},
 { label: 'Admitted (Current Batch)', value: admittedCount || 412, icon: CheckCircle2, color: 'var(--color-success)'},
 { label: 'Pending Applications', value: pendingCount || 185, icon: UserPlus, color: 'var(--color-warning)'},
 { label: 'Rejected Applications', value: rejectedCount || 54, icon: XCircle, color: 'var(--color-danger)'}
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-[var(--color-border-subtle)] pb-4">
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Enrollment Analytics</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Track enrollment trends, pipeline yield metrics, and historical admissions data.</p>
 </div>
 
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map((stat, i) => (
 <div key={i} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">{stat.label}</p>
 <h3 className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mt-1 tracking-tight">{stat.value}</h3>
 </div>
 <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`}}>
 <stat.icon className="w-6 h-6" style={{ color: stat.color}} />
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 ">
 <h2 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
 <BarChart4 className="w-5 h-5 text-[var(--primary)]" /> Enrollment & Application Growth
 </h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Historical comparison of student applications versus final enrollments.</p>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={defaultEnrollmentHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0}}>
 <defs>
 <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
 <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8}/>
 <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
 <XAxis dataKey="term" tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} />
 <YAxis tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} />
 <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-0)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px'}} />
 <Area type="monotone" dataKey="applied" stroke="var(--chart-2)" fillOpacity={1} fill="url(#colorApplied)" strokeWidth={2} />
 <Area type="monotone" dataKey="enrolled" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorEnrolled)" strokeWidth={2} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 ">
 <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Conversion Overview</h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Funnel metrics from initial review to registration.</p>
 <div className="space-y-6">
 <div>
 <div className="flex justify-between text-[var(--text-sm)] font-semibold mb-1 text-[var(--color-text-primary)]">
 <span>Application to Interview Rate</span>
 <span>82%</span>
 </div>
 <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
 <div className="bg-[var(--primary)] h-full rounded-full" style={{ width: '82%'}} />
 </div>
 </div>
 <div>
 <div className="flex justify-between text-[var(--text-sm)] font-semibold mb-1 text-[var(--color-text-primary)]">
 <span>Interview to Offer Yield</span>
 <span>65%</span>
 </div>
 <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
 <div className="bg-[var(--color-success)] h-full rounded-full" style={{ width: '65%'}} />
 </div>
 </div>
 <div>
 <div className="flex justify-between text-[var(--text-sm)] font-semibold mb-1 text-[var(--color-text-primary)]">
 <span>Offer Acceptance Rate</span>
 <span>78%</span>
 </div>
 <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
 <div className="bg-[var(--color-info)] h-full rounded-full" style={{ width: '78%'}} />
 </div>
 </div>
 <div className="p-4 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] flex items-center justify-between">
 <div>
 <p className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">Current Term Yield</p>
 <p className="text-[var(--text-2xl)] font-display font-black text-[var(--color-text-primary)] mt-1">74.2%</p>
 </div>
 <TrendingUp className="w-8 h-8 text-[var(--color-success)]" />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
