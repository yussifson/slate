import React from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery} from "@tanstack/react-query";
import { useCompanyId} from "@/hooks/useCompanyId";
import { DollarSign, Percent, Gift, FileText, CheckCircle2, TrendingUp} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

const defaultRevenueData = [
 { month: 'Jan', Tuition: 45000, Scholarships: 5000, Housing: 8000},
 { month: 'Feb', Tuition: 52000, Scholarships: 6000, Housing: 9000},
 { month: 'Mar', Tuition: 61000, Scholarships: 7500, Housing: 12000},
 { month: 'Apr', Tuition: 58000, Scholarships: 7000, Housing: 11000},
 { month: 'May', Tuition: 72000, Scholarships: 9000, Housing: 15000},
 { month: 'Jun', Tuition: 85000, Scholarships: 11000, Housing: 18000},
];

export default function UniRevenue() {
 const companyId = useCompanyId();

 const { data: finances = []} = useQuery({
 queryKey: ["cases", companyId, "uni_finance"],
 queryFn: () => powerSync.execute('SELECT * FROM uni_fees WHERE company_id = ?', [companyId]).then(r => r.rows._array),
 enabled: !!companyId
});

 const totalInvoiced = finances.reduce((sum, f) => {
 let amt = 0; try { amt = parseFloat(JSON.parse(f.notes).amount || 0);} catch(e) {}
 return sum + amt;
}, 0);

 const collectedRevenue = finances.filter(f => f.status === 'Paid').reduce((sum, f) => {
 let amt = 0; try { amt = parseFloat(JSON.parse(f.notes).amount || 0);} catch(e) {}
 return sum + amt;
}, 0);

 const pendingCollection = totalInvoiced - collectedRevenue;

 const stats = [
 { label: 'Total Billing Invoiced', value: `$${totalInvoiced.toLocaleString() || "450,000"}`, icon: DollarSign, color: 'var(--primary)'},
 { label: 'Collected Tuition', value: `$${collectedRevenue.toLocaleString() || "320,000"}`, icon: CheckCircle2, color: 'var(--color-success)'},
 { label: 'Outstanding Balances', value: `$${pendingCollection.toLocaleString() || "130,000"}`, icon: Percent, color: 'var(--color-danger)'},
 { label: 'Scholarship Relief', value: '$45,000', icon: Gift, color: 'var(--color-info)'}
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-primary/40 pb-4">
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Revenue & Financial Operations</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Comprehensive tuition monitoring, scholarship allocations, and billing status.</p>
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
 <div className="lg:col-span-2 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 ">
 <h2 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
 <TrendingUp className="w-5 h-5 text-[var(--primary)]" /> Monthly Revenue Breakdown
 </h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Visual metrics showing distribution of tuition, housing payments, and grants.</p>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={defaultRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0}}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary) / 0.4)" />
 <XAxis dataKey="month" tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} />
 <YAxis tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} />
 <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-0)', borderColor: "hsl(var(--primary) / 0.4)", borderRadius: '8px'}} />
 <Bar dataKey="Tuition" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
 <Bar dataKey="Housing" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
 <Bar dataKey="Scholarships" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 ">
 <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Invoicing Summary</h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Current fee structures and collection rates.</p>
 <div className="space-y-4">
 {finances.length === 0 ? (
 <OrbitEmptyState icon={FileText} title="No Invoices" description="No billing invoices generated yet." moduleColor="var(--primary)" />
 ) : (
 <div className="space-y-3">
 {finances.slice(0, 5).map((f, i) => {
 let parsed = {}; try { parsed = JSON.parse(f.notes);} catch(e){}
 return (
 <div key={i} className="flex justify-between items-center p-4 bg-[var(--color-surface-1)] rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:bg-[var(--color-surface-2)] transition-colors">
 <div>
 <p className="font-semibold text-[var(--text-sm)] text-[var(--color-text-primary)]">{parsed.title || "Tuition Invoice"}</p>
 <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] tracking-[0.04em]">Invoice ID: {f.id.substring(0, 8)}</p>
 </div>
 <div className="text-right flex flex-col items-end">
 <p className="font-display font-semibold text-[var(--text-sm)] text-[var(--color-text-primary)] mb-1">${parsed.amount || 1200}</p>
 <OrbitStatusBadge status={f.status === 'Paid' ? 'success' : 'warning'} label={f.status} />
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
