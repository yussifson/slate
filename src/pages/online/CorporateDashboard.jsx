import React, { useState} from 'react';
import { Building2, Users, Briefcase, ChevronRight, BarChart3, Download} from 'lucide-react';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';

export default function CorporateDashboard() {
 const companyId = useCompanyId();
 
 const [activeTab, setActiveTab] = useState('overview');

 const { data: learners = []} = useQuery({
 queryKey: ["cases", companyId, "online_learner"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_learner'}),
 enabled: !!companyId
});

 const chartData = [
 { department: 'Engineering', completed: 45, inProgress: 12},
 { department: 'Sales', completed: 30, inProgress: 25},
 { department: 'Marketing', completed: 20, inProgress: 10},
 { department: 'HR', completed: 15, inProgress: 5},
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 max-w-7xl mx-auto">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Corporate Portal</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage bulk licenses, track employee training, and view organizational metrics.</p>
 </div>
 <button className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity flex items-center gap-2">
 <Users className="w-4 h-4" /> Invite Employees
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 ">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-primary)]">
 <Briefcase className="w-5 h-5" />
 </div>
 <h3 className="font-semibold text-[var(--color-text-secondary)] text-sm uppercase tracking-wider tracking-[0.04em]">Active Licenses</h3>
 </div>
 <p className="text-4xl font-semibold font-display text-[var(--color-text-primary)] mt-2 tracking-[-0.02em]">150</p>
 <p className="text-xs text-[var(--color-text-tertiary)] mt-2 tracking-[0.04em]">50 unused licenses available</p>
 </div>
 
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 ">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-full bg-[var(--color-info-subtle)] flex items-center justify-center text-[var(--color-info)]">
 <Users className="w-5 h-5" />
 </div>
 <h3 className="font-semibold text-[var(--color-text-secondary)] text-sm uppercase tracking-wider tracking-[0.04em]">Enrolled Employees</h3>
 </div>
 <p className="text-4xl font-semibold font-display text-[var(--color-text-primary)] mt-2 tracking-[-0.02em]">{learners.length || 0}</p>
 <p className="text-xs text-[var(--color-text-tertiary)] mt-2 tracking-[0.04em]">Across 4 departments</p>
 </div>
 
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 ">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-full bg-[var(--color-success-subtle)] flex items-center justify-center text-[var(--color-success)]">
 <BarChart3 className="w-5 h-5" />
 </div>
 <h3 className="font-semibold text-[var(--color-text-secondary)] text-sm uppercase tracking-wider tracking-[0.04em]">Avg Completion</h3>
 </div>
 <p className="text-4xl font-semibold font-display text-[var(--color-text-primary)] mt-2 tracking-[-0.02em]">78%</p>
 <div className="w-full bg-[var(--color-surface-2)] h-1.5 rounded-full mt-3 overflow-hidden">
 <div className="bg-[var(--color-success)] h-full w-[78%]"></div>
 </div>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
 <div className="border-b border-primary/40 bg-[var(--color-surface-1)] flex px-4">
 <button onClick={() => setActiveTab('overview')} className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Overview</button>
 <button onClick={() => setActiveTab('employees')} className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'employees' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Employee Directory</button>
 </div>

 <div className="p-6">
 {activeTab === 'overview' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center mb-2">
 <h2 className="font-semibold text-[var(--color-text-primary)] font-display">Department Training Progress</h2>
 <button className="text-sm font-medium text-[var(--primary)] flex items-center gap-2 hover:underline">
 <Download className="w-4 h-4" /> Export Report
 </button>
 </div>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0}}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary) / 0.4)" />
 <XAxis dataKey="department" tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
 <YAxis tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
 <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-0)', borderColor: "hsl(var(--primary) / 0.4)", borderRadius: '8px'}} cursor={{fill: 'var(--color-surface-2)'}} />
 <Bar dataKey="completed" stackId="a" fill="var(--chart-1)" radius={[0, 0, 4, 4]} name="Completed" />
 <Bar dataKey="inProgress" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="In Progress" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 )}

 {activeTab === 'employees' && (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-[var(--color-surface-1)] border-b border-primary/40 text-[var(--color-text-secondary)]">
 <tr>
 <th className="px-6 py-3 font-semibold">Employee</th>
 <th className="px-6 py-3 font-semibold">Department</th>
 <th className="px-6 py-3 font-semibold">Active Courses</th>
 <th className="px-6 py-3 font-semibold">Progress</th>
 <th className="px-6 py-3 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
 {learners.length === 0 ? (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p className="font-medium text-[var(--color-text-secondary)]">No employees found</p>
 <p className="text-sm mt-1">Invite your team to get started.</p>
 </td>
 </tr>
 ) : (
 learners.map((learner, idx) => (
 <tr key={idx} className="hover:bg-[var(--color-surface-1)] transition-colors group">
 <td className="px-6 py-4 font-medium">{learner.title || 'Unnamed Learner'}</td>
 <td className="px-6 py-4 text-[var(--color-text-secondary)]">Engineering</td>
 <td className="px-6 py-4">2</td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className="w-full max-w-[100px] bg-[var(--color-surface-2)] h-1.5 rounded-full overflow-hidden">
 <div className="bg-[var(--color-success)] h-full w-[60%]"></div>
 </div>
 <span className="text-xs font-semibold text-[var(--color-success)] tracking-[0.04em]">60%</span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="text-sm font-semibold text-[var(--primary)] flex items-center justify-end gap-2 hover:underline w-full opacity-0 group-hover:opacity-100 transition-opacity">
 View Report <ChevronRight className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
