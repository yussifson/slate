import React, { useMemo} from 'react';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Users, BookOpen, Building, GraduationCap, DollarSign, TrendingUp, Calendar, ArrowRight, UserSquare2, LineChart, ShieldCheck} from 'lucide-react';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid} from 'recharts';

export default function UniDashboard() {
 const companyId = useCompanyId();

 const { data: students = []} = useQuery({
 queryKey: ["clients", companyId, "uni_student"],
 queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student'}),
 enabled: !!companyId
});

 const { data: admissions = []} = useQuery({
 queryKey: ["clients", companyId, "uni_admission"],
 queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_admission'}),
 enabled: !!companyId
});

 const { data: courses = []} = useQuery({
 queryKey: ["cases", companyId, "uni_course"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_course'}),
 enabled: !!companyId
});

 const { data: faculties = []} = useQuery({
 queryKey: ["cases", companyId, "uni_faculty"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_faculty'}),
 enabled: !!companyId
});

 const { data: finances = []} = useQuery({
 queryKey: ["cases", companyId, "uni_finance"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_finance'}),
 enabled: !!companyId
});

 // Calculate actual revenue metrics based on the database rather than mock math
 const totalRevenue = useMemo(() => {
 return finances.reduce((sum, f) => {
 let amount = 0;
 try {
 const extra = JSON.parse(f.notes || '{}');
 amount = parseFloat(extra.amount) || 0;
} catch (e) {}
 return sum + amount;
}, 0);
}, [finances]);

 const recentStudents = students.slice(0, 5);

 const admissionTrends = [
 { name: 'Jan', value: 120}, { name: 'Feb', value: 140}, { name: 'Mar', value: 200},
 { name: 'Apr', value: 280}, { name: 'May', value: admissions.length > 300 ? admissions.length : 320}
 ];

 return (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/40 pb-6">
 <div>
 <h1 className="font-display font-semibold text-3xl text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">University Workslate</h1>
 <p className="text-base text-[var(--color-text-secondary)] mt-2">Enterprise command center for academic and operational metrics.</p>
 </div>
 <div className="flex gap-3">
 <button className="px-5 py-2.5 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] text-sm font-medium rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
 Generate Report
 </button>
 <button className="px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
 <PlusIcon className="w-4 h-4" /> New Admission
 </button>
 </div>
 </div>
 
 {/* Enterprise KPI Metrics - Clean Google Style */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <MetricCard title="Active Students" value={students.length} icon={Users} trend="+4.2%" />
 <MetricCard title="Pending Admissions" value={admissions.length} icon={GraduationCap} trend="+12.5%" />
 <MetricCard title="Course Offerings" value={courses.length} icon={BookOpen} trend="Stable" />
 <MetricCard title="YTD Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} trend="+8.4%" highlight />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Main Chart Area */}
 <div className="col-span-1 lg:col-span-2 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-8 ">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Admission Growth</h2>
 <p className="text-sm text-[var(--color-text-secondary)]">Trailing 5 months trajectory.</p>
 </div>
 <select className="bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] outline-none">
 <option>This Year</option>
 <option>Last Year</option>
 </select>
 </div>
 
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={admissionTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0}}>
 <defs>
 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary) / 0.4)" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} />
 <Tooltip 
 contentStyle={{ backgroundColor: 'var(--color-surface-0)', borderColor: "hsl(var(--primary) / 0.4)", borderRadius: '8px', color: 'var(--color-text-primary)'}}
 itemStyle={{ color: 'var(--chart-1)'}}
 />
 <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Quick Actions Panel */}
 <div className="col-span-1 flex flex-col gap-8">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-8 flex-1">
 <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Enterprise Actions</h2>
 <div className="space-y-4">
 <ActionItem icon={UserSquare2} title="Directory Management" desc="Update student & faculty records" color="var(--primary)" />
 <ActionItem icon={Building} title="Facility Logistics" desc="Manage hostels, libraries & spaces" color="var(--primary)" />
 <ActionItem icon={ShieldCheck} title="Compliance & Audits" desc="Review academic structures" color="var(--chart-3)" />
 <ActionItem icon={LineChart} title="Financial Operations" desc="Process tuition & scholarships" color="var(--primary)" />
 </div>
 </div>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-8 ">
 <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Recent Enrollments</h2>
 <p className="text-sm text-[var(--color-text-secondary)] mb-6">Latest students onboarded into the academic register.</p>
 
 {students.length === 0 ? (
 <OrbitEmptyState icon={Users} title="No active enrollments" description="Awaiting student registrations." moduleColor="var(--primary)" />
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-primary/40 text-[11px] uppercase tracking-wider font-semibold text-[var(--color-text-tertiary)] tracking-[0.04em]">
 <th className="pb-3 pl-2">Student Identity</th>
 <th className="pb-3">Program</th>
 <th className="pb-3">Status</th>
 <th className="pb-3 text-right pr-2">Action</th>
 </tr>
 </thead>
 <tbody>
 {recentStudents.map((s, i) => {
 let extra = {};
 try { extra = JSON.parse(s.extra_data || '{}')} catch(e) {}
 return (
 <tr key={i} className="border-b border-primary/40 hover:bg-[var(--color-surface-1)] transition-colors group">
 <td className="py-4 pl-2">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-md-full bg-[var(--color-surface-2)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] flex items-center justify-center font-semibold text-sm">
 {s.name?.substring(0, 2).toUpperCase() || 'UN'}
 </div>
 <div>
 <p className="font-medium text-sm text-[var(--color-text-primary)]">{s.name}</p>
 <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">{s.email || 'No email associated'}</p>
 </div>
 </div>
 </td>
 <td className="py-4 text-sm text-[var(--color-text-secondary)]">
 {extra.major || 'Undeclared'}
 </td>
 <td className="py-4">
 <span className="inline-flex items-center px-2.5 py-0.5 rounded-md-full text-xs font-medium bg-[var(--color-surface-2)] text-[var(--primary)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 tracking-[0.04em]">
 Active
 </span>
 </td>
 <td className="py-4 text-right pr-2">
 <button className="text-[var(--color-text-tertiary)] hover:text-[var(--primary)] text-sm font-medium transition-colors opacity-0 group-hover:opacity-100">
 View Record
 </button>
 </td>
 </tr>
 )
})}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
}

// Utility Components
function MetricCard({ title, value, icon: Icon, trend, highlight}) {
 return (
 <div className={`p-6 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-200 hover:-translate-y-1 ${highlight ? 'bg-[var(--primary)] border-transparent text-white ' : 'bg-[var(--color-surface-0)] border-primary/40 '}`}>
 <div className="flex justify-between items-start mb-4">
 <h3 className={`text-sm font-medium ${highlight ? 'text-white/90' : 'text-[var(--color-text-secondary)]'}`}>{title}</h3>
 <div className={`p-2 rounded-xl ${highlight ? 'bg-white dark:bg-slate-900/40/20' : 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'}`}>
 <Icon className="w-5 h-5" />
 </div>
 </div>
 <div>
 <div className={`text-3xl font-display font-semibold tracking-tight ${highlight ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>{value}</div>
 <p className={`text-xs mt-2 font-medium ${highlight ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'}`}>
 <span className={highlight ? 'text-white' : 'text-[var(--primary)]'}>{trend}</span> vs last period
 </p>
 </div>
 </div>
 );
}

function ActionItem({ icon: Icon, title, desc, color}) {
 return (
 <button className="w-full flex items-center justify-between p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl hover:bg-[var(--color-surface-2)] transition-colors group text-left">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 transition-transform group-hover:scale-105" style={{ color}}>
 <Icon className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h4>
 <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 tracking-[0.04em]">{desc}</p>
 </div>
 </div>
 <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] group-hover:translate-x-1 transition-all" />
 </button>
 );
}

function PlusIcon(props) {
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}
