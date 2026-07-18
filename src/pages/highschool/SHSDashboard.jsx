import { useTranslation} from "react-i18next";
import { ModuleBanner} from '@/components/school/SchoolViewKit';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Users, GraduationCap, Banknote, ClipboardCheck, Clock, Activity, CheckCircle2, UserPlus} from "lucide-react";
import { Card, CardContent} from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';

const defaultChartData = [
 { name: 'Term 1', avg: 65},
 { name: 'Term 2', avg: 68},
 { name: 'Term 3', avg: 72},
 { name: 'Preparatory', avg: 78}
];

export default function SHSDashboard() {
 const { t} = useTranslation();
 const companyId = useCompanyId();

 const { data: students = []} = useQuery({ queryKey: ["shs_students", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'shs_student'}), enabled: !!companyId});
 const { data: applicants = []} = useQuery({ queryKey: ["shs_applicants", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'shs_applicant'}), enabled: !!companyId});
 const { data: fees = []} = useQuery({ queryKey: ["shs_fees", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'shs_fee'}), enabled: !!companyId});
 const { data: grades = []} = useQuery({ queryKey: ["shs_grades", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'shs_grade'}), enabled: !!companyId});

 const uncollectedFees = fees.filter(f => f.status === 'Pending').reduce((sum, f) => {
 let amt = 0; try { amt = parseFloat(JSON.parse(f.notes).amount || 0);} catch(e) {}
 return sum + amt;
}, 0);

 const pendingApps = applicants.filter(a => a.status !== 'Admitted' && a.status !== 'Rejected').length;

 const stats = [
 { title: "Total Students", value: students.length, icon: Users, color: "text-primary", bg: "bg-slate-100"},
 { title: "Staff Overview", value: "142", icon: UserPlus, color: "text-primary dark:text-primary/70", bg: "bg-slate-100 dark:bg-secondary"},
 { title: "Attendance Rate", value: "94%", icon: ClipboardCheck, color: "text-primary dark:text-primary/70", bg: "bg-slate-100 dark:bg-secondary"},
 { title: "Pending Applications", value: pendingApps, icon: ClipboardCheck, color: "text-amber-600", bg: "bg-amber-100"},
 { title: "Outstanding Fees", value: `$${uncollectedFees.toLocaleString()}`, icon: Banknote, color: "text-red-600", bg: "bg-red-100"},
 { title: "Grades Recorded", value: grades.length, icon: GraduationCap, color: "text-primary dark:text-primary/70", bg: "bg-slate-100 dark:bg-secondary"},
 ];

 // Dynamically calculate from grades if available, else use default
 const chartData = grades.length > 0 ? (
 Object.values(grades.reduce((acc, g) => {
 let gd = {}; try { gd = JSON.parse(g.notes);} catch(e){}
 const term = gd.term || 'Term 1';
 if (!acc[term]) acc[term] = { name: term, total: 0, count: 0};
 acc[term].total += (parseFloat(gd.score) || 0);
 acc[term].count += 1;
 return acc;
}, {})).map(t => ({ name: t.name, avg: t.total / t.count}))
 ) : defaultChartData;

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <ModuleBanner 
 title={t("shs_dashboard", "High School Dashboard")} 
 subtitle="Overview of academic performance, admissions, and financial health." 
 />
 
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
 {stats.map((stat, i) => (
 <Card key={i} className="border-primary/40 dark:border-primary/40 transition-">
 <CardContent className="p-5 flex items-center justify-between">
 <div>
 <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wide tracking-[0.04em]">{stat.title}</p>
 <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-[-0.02em]">{stat.value}</h3>
 </div>
 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
 <stat.icon className={`w-6 h-6 ${stat.color}`} />
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <Card className="lg:col-span-2 border-primary/40 dark:border-primary/40 ">
 <CardContent className="p-6">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
 <Activity className="w-5 h-5 text-primary" /> Academic Performance Trends
 </h3>
 </div>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0}}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
 <Tooltip 
 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
 />
 <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </CardContent>
 </Card>

 <Card className="border-primary/40 dark:border-primary/40 ">
 <CardContent className="p-6">
 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-6">
 <Clock className="w-5 h-5 text-amber-500" /> Recent Activities
 </h3>
 <div className="space-y-4">
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-secondary flex items-center justify-center shrink-0">
 <CheckCircle2 className="w-4 h-4 text-primary dark:text-primary/70" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Term 3 Results Published</p>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">2 hours ago</p>
 </div>
 </div>
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
 <UserPlus className="w-4 h-4 text-primary" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">5 New CSSPS Placements</p>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">5 hours ago</p>
 </div>
 </div>
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
 <Banknote className="w-4 h-4 text-red-600" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">PTA Dues Deadline Reminder</p>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Yesterday</p>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
