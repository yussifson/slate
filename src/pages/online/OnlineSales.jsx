import React, { useMemo} from 'react';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Banknote, TrendingUp, CreditCard, ShoppingCart, Download, ArrowUpRight} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area} from 'recharts';

export default function OnlineSales() {
 const companyId = useCompanyId();

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

 const revenueHistory = [];

 const stats = [
 { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: Banknote, color: 'var(--color-success)'},
 { label: 'Avg Order Value', value: '$0.00', icon: ShoppingCart, color: 'var(--primary)'},
 { label: 'Monthly Recurring', value: '$0', icon: CreditCard, color: 'var(--color-info)'},
 { label: 'Growth (YoY)', value: '0%', icon: TrendingUp, color: 'var(--color-warning)'},
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-[var(--color-border-subtle)] pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Sales & Revenue</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Track course purchases, subscriptions, and financial metrics.</p>
 </div>
 <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
 <Download className="w-4 h-4" /> Export Report
 </button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map((stat, i) => (
 <div key={i} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 ">
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

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 ">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h2 className="font-semibold text-[var(--color-text-primary)]">Revenue Breakdown</h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">One-time purchases vs Subscriptions</p>
 </div>
 </div>
 <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-primary/50 rounded-xl">
 <p className="text-[var(--color-text-secondary)] text-sm">Not enough data to display chart.</p>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 ">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h2 className="font-semibold text-[var(--color-text-primary)]">Cumulative Growth</h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Total lifetime value generated</p>
 </div>
 </div>
 <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-primary/50 rounded-xl">
 <p className="text-[var(--color-text-secondary)] text-sm">Not enough data to display chart.</p>
 </div>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden">
 <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
 <h2 className="font-semibold text-[var(--color-text-primary)]">Recent Transactions</h2>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-[var(--color-surface-1)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
 <tr>
 <th className="px-6 py-3 font-semibold">Transaction ID</th>
 <th className="px-6 py-3 font-semibold">Date</th>
 <th className="px-6 py-3 font-semibold">Customer</th>
 <th className="px-6 py-3 font-semibold">Amount</th>
 <th className="px-6 py-3 font-semibold">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
 {sales.length === 0 ? (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
 <Banknote className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p className="font-medium text-[var(--color-text-secondary)]">No sales recorded</p>
 <p className="text-sm mt-1">Once courses are purchased, transactions will appear here.</p>
 </td>
 </tr>
 ) : (
 sales.slice(0, 5).map((sale, idx) => {
 let extra = {};
 try { extra = JSON.parse(sale.notes || '{}');} catch(e) {}
 
 return (
 <tr key={idx} className="hover:bg-[var(--color-surface-1)] transition-colors">
 <td className="px-6 py-4 font-mono text-xs">#{sale.id.split('-')[0]}</td>
 <td className="px-6 py-4 text-[var(--color-text-secondary)]">
 {new Date(sale.created_at || Date.now()).toLocaleDateString()}
 </td>
 <td className="px-6 py-4 font-medium">{sale.title || 'Unknown Customer'}</td>
 <td className="px-6 py-4 font-bold text-[var(--color-success)]">
 ${parseFloat(extra.amount || 0).toLocaleString()}
 </td>
 <td className="px-6 py-4">
 <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]">
 Completed
 </span>
 </td>
 </tr>
 );
})
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
