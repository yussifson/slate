import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState} from 'react';
import { supabase} from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 Settings, Users, CreditCard, Activity, 
 BarChart3, LayoutDashboard, Crown, Link as LinkIcon,
 Search, ShieldAlert, CheckCircle2, XCircle, FileText,
 Plug, Edit3, Save, Trash2
} from 'lucide-react';

export default function SuperAdminBilling({ title = 'Super Admin Billing Center'}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const [activeTab, setActiveTab] = useState('dashboard');
 
 // Example dummy data for MRR/Churn (in a real app, calculate from transactions/subscriptions)
 const stats = {
 mrr: 12450,
 activeSubscribers: 142,
 churnRate: 2.4,
 failedPayments: 3
};

 return (
 <div className="flex h-full bg-background font-sans overflow-hidden">
 
 {/* Sidebar Navigation */}
 <div className="w-64 bg-card border-r border-primary/40 shrink-0 flex flex-col p-4 space-y-2 overflow-y-auto">
 <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-4 mb-4 mt-2">Billing Engine</h2>
 
 <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Financial Dashboard" />
 <NavButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<Crown className="w-4 h-4" />} label="Plan Manager" />
 <NavButton active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users className="w-4 h-4" />} label="Customer Subscriptions" />
 <NavButton active={activeTab === 'overrides'} onClick={() => setActiveTab('overrides')} icon={<ShieldAlert className="w-4 h-4" />} label="Manual Overrides" />
 <NavButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<CreditCard className="w-4 h-4" />} label="Transaction Ledger" />
 <NavButton active={activeTab === 'usage'} onClick={() => setActiveTab('usage')} icon={<Activity className="w-4 h-4" />} label="Usage Monitor" />
 <NavButton active={activeTab === 'webhooks'} onClick={() => setActiveTab('webhooks')} icon={<Plug className="w-4 h-4" />} label="Webhook Diagnostics" />
 </div>

 {/* Main Content Area */}
 <div className="flex-1 overflow-y-auto bg-muted/10">
 <div className="p-8 max-w-6xl mx-auto">
 <div className="mb-8">
 <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
 <Settings className="w-8 h-8 text-primary" /> {title}
 </h1>
 <p className="text-muted-foreground mt-2">Total control over Paystack integrations, revenue, and customer limits.</p>
 </div>

 {activeTab === 'dashboard' && <TabDashboard stats={stats} />}
 {activeTab === 'plans' && <TabPlanManager queryClient={queryClient} toast={toast} />}
 {activeTab === 'customers' && <TabCustomerSubscriptions />}
 {activeTab === 'overrides' && <TabManualOverrides />}
 {activeTab === 'transactions' && <TabTransactions />}
 {activeTab === 'usage' && <TabUsageMonitor />}
 {activeTab === 'webhooks' && <TabWebhooks />}

 </div>
 </div>
 </div>
 );
}

function NavButton({ active, onClick, icon, label}) {
 return (
 <button 
 onClick={onClick}
 className={cn(
 "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full text-left",
 active ? "bg-primary text-white " : "text-muted-foreground hover:bg-muted hover:text-foreground"
 )}
 >
 {icon} {label}
 </button>
 );
}

// ----------------------------------------------------
// 1. Dashboard Tab
// ----------------------------------------------------
function TabDashboard({ stats}) {
 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <StatCard title="Monthly Recurring Revenue" value={`GH₵${stats.mrr.toLocaleString()}`} icon={<BarChart3 className="w-5 h-5 text-emerald-500" />} trend="+12% from last month" />
 <StatCard title="Active Subscribers" value={stats.activeSubscribers} icon={<Users className="w-5 h-5 text-blue-500" />} trend="+5 new this week" />
 <StatCard title="Churn Rate" value={`${stats.churnRate}%`} icon={<Activity className="w-5 h-5 text-amber-500" />} trend="-0.5% from last month" />
 <StatCard title="Failed Payments" value={stats.failedPayments} icon={<XCircle className="w-5 h-5 text-red-500" />} trend="Requires attention" alert />
 </div>
 
 <div className="bg-card border border-primary/40 rounded-xl p-8 h-64 flex items-center justify-center text-muted-foreground">
 <BarChart3 className="w-8 h-8 mr-3 opacity-20" /> MRR Chart Visualization Area (Requires Recharts or similar library)
 </div>
 </div>
 );
}

function StatCard({ title, value, icon, trend, alert}) {
 return (
 <div className={cn("bg-card border rounded-xl p-5 ", alert ? "border-red-200 dark:border-red-900" : "border-primary/40")}>
 <div className="flex justify-between items-start mb-2">
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
 {icon}
 </div>
 <div className="text-3xl font-black text-foreground mb-1">{value}</div>
 <div className={cn("text-xs font-medium", alert ? "text-red-500" : "text-muted-foreground")}>{trend}</div>
 </div>
 );
}

// ----------------------------------------------------
// 2. Plan Manager Tab
// ----------------------------------------------------
function TabPlanManager({ queryClient, toast}) {
 const { data: plans = [], isLoading} = useQuery({
 queryKey: ['superadmin_plans'],
 queryFn: async () => {
 const __res = await powerSync.execute(`SELECT * FROM subscription_plans ORDER BY price_monthly`);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 return data;
}
});

 const [editingId, setEditingId] = useState(null);
 const [editForm, setEditForm] = useState({});

 const saveMutation = useMutation({
 mutationFn: async (plan) => {
 if (plan.id === 'new') {
 const { id, ...rest} = plan;
 await (async () => {
 const _p = rest;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO subscription_plans (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')})`, _v);
})();
 const error = null;
 if (error) throw error;
} else {
 await (async () => {
 const _p = plan;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`UPDATE subscription_plans SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, plan.id]);
})();
 const error = null;
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['superadmin_plans']);
 setEditingId(null);
 toast({ title: 'Plan saved.'});
}
});

 const handleEdit = (plan) => {
 setEditingId(plan.id);
 setEditForm(plan);
};

 const handleSave = () => {
 saveMutation.mutate(editForm);
};

 const handleAddNew = () => {
 const newPlan = { id: 'new', name: 'New Plan', price_monthly: 0, price_yearly: 0, paystack_plan_code: '', limits: { users: 1, ai_credits_monthly: 100}, is_active: false, market_tier: 'global'};
 setEditingId('new');
 setEditForm(newPlan);
};

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex justify-between items-center bg-card border border-primary/40 p-4 rounded-xl ">
 <p className="text-sm text-muted-foreground">Manage pricing tiers. The <strong>Paystack Plan Code</strong> is critical for synchronization.</p>
 <button onClick={handleAddNew} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90">Add New Plan</button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {editingId === 'new' && (
 <PlanEditor plan={editForm} setPlan={setEditForm} onSave={handleSave} onCancel={() => setEditingId(null)} isSaving={saveMutation.isPending} />
 )}
 
 {plans.map(p => (
 editingId === p.id ? (
 <PlanEditor key={p.id} plan={editForm} setPlan={setEditForm} onSave={handleSave} onCancel={() => setEditingId(null)} isSaving={saveMutation.isPending} />
 ) : (
 <div key={p.id} className="bg-card border border-primary/40 rounded-xl p-6 flex flex-col relative group">
 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => handleEdit(p)} className="p-1.5 bg-muted text-foreground rounded-md hover:bg-primary hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
 </div>
 <div className="flex items-center gap-2 mb-4">
 <h3 className="text-xl font-bold">{p.name}</h3>
 {!p.is_active && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded border">Archived</span>}
 </div>
 <div className="flex items-end gap-1 mb-4">
 <span className="text-3xl font-black">GH₵{p.price_monthly}</span><span className="text-muted-foreground font-medium text-sm mb-1">/mo</span>
 </div>
 <div className="text-sm font-mono bg-muted px-3 py-1.5 rounded-md text-muted-foreground mb-4 truncate flex items-center gap-2">
 <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded uppercase">{p.market_tier || 'global'}</span>
 <LinkIcon className="w-3 h-3 ml-1" /> {p.paystack_plan_code || 'No Paystack Code'}
 </div>
 <div className="grid grid-cols-2 gap-2 text-sm border-t border-primary/40 pt-4">
 <div className="text-muted-foreground">Users Limit:</div><div className="font-bold text-right">{p.limits?.users || 'Unlmt'}</div>
 <div className="text-muted-foreground">AI Credits:</div><div className="font-bold text-right">{p.limits?.ai_credits_monthly || 0}</div>
 </div>
 </div>
 )
 ))}
 </div>
 </div>
 );
}

function PlanEditor({ plan, setPlan, onSave, onCancel, isSaving}) {
 return (
 <div className="bg-card border-2 border-primary rounded-xl p-6 flex flex-col">
 <div className="space-y-4 mb-6 flex-1">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Plan Name</label>
 <input type="text" value={plan.name} onChange={e => setPlan({...plan, name: e.target.value})} className="w-full h-9 px-3 border rounded text-sm mt-1" />
 </div>
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Market Tier</label>
 <select value={plan.market_tier || 'global'} onChange={e => setPlan({...plan, market_tier: e.target.value})} className="w-full h-9 px-3 border rounded text-sm mt-1 bg-background">
 <option value="global">Global</option>
 <option value="emerging">Emerging</option>
 <option value="community">Community</option>
 <option value="education">Education</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Monthly (GH₵)</label>
 <input type="number" value={plan.price_monthly} onChange={e => setPlan({...plan, price_monthly: Number(e.target.value)})} className="w-full h-9 px-3 border rounded text-sm mt-1" />
 </div>
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Paystack Code</label>
 <input type="text" value={plan.paystack_plan_code} onChange={e => setPlan({...plan, paystack_plan_code: e.target.value})} className="w-full h-9 px-3 border rounded text-sm font-mono mt-1" placeholder="PLN_xxxxx" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">User Limit</label>
 <input type="number" value={plan.limits?.users || 1} onChange={e => setPlan({...plan, limits: {...plan.limits, users: Number(e.target.value)}})} className="w-full h-9 px-3 border rounded text-sm mt-1" />
 </div>
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">AI Credits</label>
 <input type="number" value={plan.limits?.ai_credits_monthly || 0} onChange={e => setPlan({...plan, limits: {...plan.limits, ai_credits_monthly: Number(e.target.value)}})} className="w-full h-9 px-3 border rounded text-sm mt-1" />
 </div>
 </div>
 <div className="flex items-center gap-2 mt-2">
 <input type="checkbox" checked={plan.is_active} onChange={e => setPlan({...plan, is_active: e.target.checked})} className="rounded text-primary" />
 <label className="text-sm font-medium">Active (Visible to users)</label>
 </div>
 </div>
 <div className="flex gap-2">
 <button onClick={onCancel} className="flex-1 py-2 bg-muted text-foreground rounded-lg text-sm font-bold">Cancel</button>
 <button onClick={onSave} disabled={isSaving} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold">{isSaving ? 'Saving...' : 'Save Plan'}</button>
 </div>
 </div>
 );
}

// ----------------------------------------------------
// 3. Customer Subscriptions Tab
// ----------------------------------------------------
function TabCustomerSubscriptions() {
 return (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="bg-card border border-primary/40 rounded-xl p-4 flex gap-4">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input type="text" placeholder="Search by company name, ID, or Paystack customer code..." className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-primary/40 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
 </div>
 </div>
 <div className="bg-card border border-primary/40 rounded-xl overflow-hidden">
 <table className="w-full text-sm text-left">
 <thead className="bg-muted/50 border-b border-primary/40 text-xs uppercase tracking-wider text-muted-foreground">
 <tr>
 <th className="px-6 py-4">Company</th>
 <th className="px-6 py-4">Current Plan</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 font-mono">Paystack Code</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {/* Dummy data for UI structure */}
 <tr className="hover:bg-muted/30 transition-colors">
 <td className="px-6 py-4 font-bold text-foreground">Acme Corp</td>
 <td className="px-6 py-4">Pro Plan</td>
 <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded border border-emerald-200">ACTIVE</span></td>
 <td className="px-6 py-4 text-muted-foreground font-mono">CUS_12345abcd</td>
 <td className="px-6 py-4 text-right"><button className="text-primary hover:underline text-xs font-bold">Manage</button></td>
 </tr>
 <tr className="hover:bg-muted/30 transition-colors">
 <td className="px-6 py-4 font-bold text-foreground">Globex Inc</td>
 <td className="px-6 py-4">Starter Plan</td>
 <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded border border-amber-200">PAST DUE</span></td>
 <td className="px-6 py-4 text-muted-foreground font-mono">CUS_98765wxyz</td>
 <td className="px-6 py-4 text-right"><button className="text-primary hover:underline text-xs font-bold">Manage</button></td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 );
}

// ----------------------------------------------------
// 4. Manual Overrides Tab
// ----------------------------------------------------
function TabManualOverrides() {
 return (
 <div className="bg-card border border-primary/40 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
 <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" /> Administrative Overrides</h3>
 <p className="text-sm text-muted-foreground mb-6">Manually adjust a company's subscription status or inject bonus AI credits without charging them via Paystack.</p>
 
 <div className="space-y-4">
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Target Company ID</label>
 <input type="text" className="w-full h-10 px-3 border rounded-lg text-sm mt-1 font-mono" placeholder="uuid..." />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Override Plan</label>
 <select className="w-full h-10 px-3 border rounded-lg text-sm mt-1 bg-background">
 <option>No Change</option>
 <option>Force Pro Plan (Comped)</option>
 <option>Force Enterprise (Comped)</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Bonus AI Credits</label>
 <input type="number" defaultValue="0" className="w-full h-10 px-3 border rounded-lg text-sm mt-1" />
 </div>
 </div>
 <button className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg mt-4 transition-colors">
 Apply System Override
 </button>
 </div>
 </div>
 );
}

// ----------------------------------------------------
// 5. Transaction Ledger Tab
// ----------------------------------------------------
function TabTransactions() {
 return (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="bg-card border border-primary/40 rounded-xl overflow-hidden">
 <table className="w-full text-sm text-left font-mono">
 <thead className="bg-muted/50 border-b border-primary/40 text-xs uppercase tracking-wider text-muted-foreground font-sans">
 <tr>
 <th className="px-6 py-4">Date</th>
 <th className="px-6 py-4">Company</th>
 <th className="px-6 py-4">Amount</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4">Reference</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 <tr className="hover:bg-muted/30">
 <td className="px-6 py-4 text-muted-foreground">Oct 24, 10:14 AM</td>
 <td className="px-6 py-4 font-sans font-bold">Acme Corp</td>
 <td className="px-6 py-4 text-foreground">$49.00</td>
 <td className="px-6 py-4"><span className="text-emerald-500 font-bold">SUCCESS</span></td>
 <td className="px-6 py-4 text-muted-foreground">T123456789</td>
 </tr>
 <tr className="hover:bg-muted/30">
 <td className="px-6 py-4 text-muted-foreground">Oct 23, 14:22 PM</td>
 <td className="px-6 py-4 font-sans font-bold">Globex Inc</td>
 <td className="px-6 py-4 text-foreground">$199.00</td>
 <td className="px-6 py-4"><span className="text-red-500 font-bold">FAILED</span></td>
 <td className="px-6 py-4 text-muted-foreground">T987654321</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 );
}

// ----------------------------------------------------
// 6. Usage Monitor Tab
// ----------------------------------------------------
function TabUsageMonitor() {
 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="bg-card border border-primary/40 rounded-xl p-6 ">
 <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> High Usage Companies</h3>
 <p className="text-sm text-muted-foreground mb-4">Companies approaching their AI credit limits (Upsell opportunities).</p>
 <div className="space-y-4">
 <div className="bg-muted rounded-lg p-4">
 <div className="flex justify-between font-bold text-sm mb-2"><span>Acme Corp</span> <span className="text-amber-600">95% Used</span></div>
 <div className="w-full h-2 bg-background rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[95%]"></div></div>
 </div>
 <div className="bg-muted rounded-lg p-4">
 <div className="flex justify-between font-bold text-sm mb-2"><span>Stark Ind.</span> <span className="text-red-600">100% Used</span></div>
 <div className="w-full h-2 bg-background rounded-full overflow-hidden"><div className="h-full bg-red-500 w-full"></div></div>
 </div>
 </div>
 </div>
 </div>
 );
}

// ----------------------------------------------------
// 7. Webhook Diagnostics Tab
// ----------------------------------------------------
function TabWebhooks() {
 return (
 <div className="bg-slate-950 text-slate-300 rounded-xl p-6 font-mono text-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between mb-6 border-b border-primary/40 pb-4">
 <h3 className="text-emerald-400 font-bold flex items-center gap-2"><Plug className="w-5 h-5" /> Webhook Listener Status</h3>
 <span className="px-2 py-1 bg-emerald-900 text-emerald-400 rounded-md text-xs">LISTENING : PORT 54321</span>
 </div>
 <div className="space-y-2">
 <div className="flex gap-4"><span className="text-slate-500">[10:14:02]</span> <span className="text-blue-400">POST</span> <span>/api/webhooks/paystack</span> <span className="text-emerald-400">200 OK</span></div>
 <div className="pl-24 text-xs text-slate-500">Event: charge.success | Ref: T123456789</div>
 <div className="flex gap-4"><span className="text-slate-500">[10:14:03]</span> <span className="text-amber-400">SYS</span> <span>Updating company_subscriptions table...</span></div>
 <div className="flex gap-4"><span className="text-slate-500">[10:14:03]</span> <span className="text-emerald-400">OK</span> <span>Acme Corp set to ACTIVE</span></div>
 </div>
 </div>
 );
}
