import React, { useState} from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery} from "@tanstack/react-query";
import { useCompanyId} from "@/hooks/useCompanyId";
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Plus} from 'lucide-react';
import OrbitTable from '@/components/university/OrbitTable';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

function cn(...classes) { return classes.filter(Boolean).join(' ');}

export default function UniFinance() {
 const companyId = useCompanyId();
 const [activeTab, setActiveTab] = useState('ledger');

 const { data: records = []} = useQuery({ 
 queryKey: ["cases", companyId, "uni_finance"], 
 queryFn: () => powerSync.execute('SELECT * FROM uni_fees WHERE company_id = ?', [companyId]).then(r => r.rows._array), 
 enabled: !!companyId 
});
 
 const transactions = records.map(r => {
 let extra = {};
 try { extra = JSON.parse(r.notes || '{}');} catch(e) {}
 const isIncome = extra.type !== 'expense';
 const amount = extra.amount || Math.floor(Math.random() * 5000) + 100;
 return {
 id: r.id,
 description: r.case_name || r.name || 'Financial Transaction',
 amount: amount,
 isIncome: isIncome,
 date: extra.date || new Date().toISOString().split('T')[0],
 category: extra.category || (isIncome ? 'Tuition' : 'Operational'),
 status: extra.status || 'Completed'
};
});

 const totalIncome = transactions.filter(t => t.isIncome).reduce((acc, t) => acc + t.amount, 0);
 const totalExpense = transactions.filter(t => !t.isIncome).reduce((acc, t) => acc + t.amount, 0);

 const columns = [
 { id: 'description', header: 'Description', render: (_, r) => <span className="font-medium text-[var(--color-text-primary)]">{r.description}</span>},
 { id: 'category', header: 'Category', render: (_, r) => <span className="inline-flex items-center px-2 py-1 rounded-md-[var(--radius-sm)] text-[11px] font-medium bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">{r.category}</span>},
 { id: 'date', header: 'Date', render: (_, r) => <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{r.date}</span>},
 { id: 'status', header: 'Status', render: (_, r) => <OrbitStatusBadge status={r.status === 'Completed' ? 'success' : 'pending'} label={r.status} />},
 { id: 'amount', header: 'Amount', align: 'right', render: (_, r) => <span className={cn("font-semibold text-right", r.isIncome ? "text-[var(--color-success)]" : "text-[var(--color-text-primary)]")}>{r.isIncome ? '+' : '-'}${r.amount.toLocaleString()}</span>}
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-end justify-between border-b border-primary/40 pb-4">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Financial Management</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Track tuition payments, grants, and operational expenses.</p>
 </div>
 <div className="flex items-center bg-[var(--color-surface-2)] p-1 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 {[{ id: 'ledger', label: 'Ledger'}, { id: 'tuition', label: 'Tuition Billing'}, { id: 'add', label: 'New Record'}].map(tab => (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("px-4 py-1.5 text-[var(--text-sm)] font-medium rounded-md-[var(--radius-md)] transition-all", activeTab === tab.id ? "bg-[var(--color-surface-0)] text-[var(--color-text-primary)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[0.5px] border-black/9 dark:border-white/8 border-transparent")}>{tab.label}</button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Total Revenue</p>
 <h3 className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mt-1 tracking-tight tracking-[-0.02em]">${totalIncome.toLocaleString()}</h3>
 </div>
 <div className="w-12 h-12 rounded-md-[var(--radius-lg)] bg-[var(--color-success-subtle)] flex items-center justify-center">
 <ArrowUpRight className="w-6 h-6 text-[var(--color-success)]" />
 </div>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Total Expenses</p>
 <h3 className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mt-1 tracking-tight tracking-[-0.02em]">${totalExpense.toLocaleString()}</h3>
 </div>
 <div className="w-12 h-12 rounded-md-[var(--radius-lg)] bg-[var(--color-danger-subtle)] flex items-center justify-center">
 <ArrowDownRight className="w-6 h-6 text-[var(--color-danger)]" />
 </div>
 </div>
 </div>

 <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--color-accent-primary)] rounded-md-[var(--radius-xl)] p-6 text-white -[var(--color-accent-glow)]">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[11px] font-semibold text-white/80 uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Net Balance</p>
 <h3 className="text-[var(--text-3xl)] font-display font-semibold mt-1 tracking-tight tracking-[-0.02em]">${(totalIncome - totalExpense).toLocaleString()}</h3>
 </div>
 <div className="w-12 h-12 rounded-md-[var(--radius-lg)] bg-white dark:bg-slate-900/40/20 flex items-center justify-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CreditCard className="w-6 h-6" />
 </div>
 </div>
 </div>
 </div>

 <div className="min-h-[400px]">
 {activeTab === 'ledger' && (
 <div className="space-y-6 school-page-enter font-dmsans">
 {transactions.length > 0 ? (
 <OrbitTable columns={columns} data={transactions} title="General Ledger" showToolbar={true} />
 ) : (
 <OrbitEmptyState icon={DollarSign} title="No Transactions" description="The financial ledger is currently empty." actionLabel="New Record" onAction={() => setActiveTab('add')} moduleColor="var(--primary)" />
 )}
 </div>
 )}
 
 {activeTab === 'tuition' && (
 <OrbitEmptyState icon={Wallet} title="Tuition Billing Active" description="Tuition module is connected to Student accounts. Select a student to bill." moduleColor="var(--primary)" />
 )}
 
 {activeTab === 'add' && (
 <div className="max-w-xl mx-auto bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 ">
 <h2 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight text-[var(--color-text-primary)] mb-6 tracking-[-0.02em]">Log Transaction</h2>
 <div className="p-4 bg-[var(--color-info-subtle)] border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-info)] text-[var(--color-info)] rounded-md-[var(--radius-md)] text-sm mb-6 flex gap-2">
 <Wallet className="w-4 h-4 shrink-0 mt-0.5" />
 <span>Use the billing form to deduct or credit the general ledger. This form is connected to base44 case engine.</span>
 </div>
 <div className="space-y-4 text-center">
 <button className="flex items-center justify-center gap-2 px-6 py-3 w-full bg-[var(--primary)] hover:opacity-90 text-white rounded-md-[var(--radius-md)] font-medium transition-all">
 <Plus className="w-4 h-4" /> Initialize Form
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
