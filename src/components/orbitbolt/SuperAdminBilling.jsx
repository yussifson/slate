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
  Plug, Edit3, Save, Trash2, ChevronLeft, ChevronRight, Plus, Trash
} from 'lucide-react';

export default function SuperAdminBilling({ title = 'Super Admin Billing Center'}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [overrideCompanyId, setOverrideCompanyId] = useState('');
  
  return (
   <div className="flex flex-col md:flex-row h-full bg-background font-sans overflow-hidden">
   
   {/* Navigation */}
   <div className={cn("bg-card border-b md:border-b-0 md:border-r border-primary/40 shrink-0 flex md:flex-col p-4 gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar transition-all duration-300 relative", isCollapsed ? "md:w-20 w-full" : "w-full md:w-64")}>
   
   <div className="flex items-center justify-between mb-4 mt-2 px-2">
     {!isCollapsed && <h2 className="hidden md:block text-sm font-black uppercase tracking-widest text-muted-foreground">Pricing Engine</h2>}
     <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex p-1.5 hover:bg-muted text-muted-foreground rounded-md ml-auto">
       {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
     </button>
   </div>
   
   <NavButton isCollapsed={isCollapsed} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
   <NavButton isCollapsed={isCollapsed} active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<Crown className="w-4 h-4" />} label="Plans" />
   <NavButton isCollapsed={isCollapsed} active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users className="w-4 h-4" />} label="Customers" />
   <NavButton isCollapsed={isCollapsed} active={activeTab === 'overrides'} onClick={() => setActiveTab('overrides')} icon={<ShieldAlert className="w-4 h-4" />} label="Overrides" />
   <NavButton isCollapsed={isCollapsed} active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<CreditCard className="w-4 h-4" />} label="Ledger" />
   <NavButton isCollapsed={isCollapsed} active={activeTab === 'usage'} onClick={() => setActiveTab('usage')} icon={<Activity className="w-4 h-4" />} label="Usage" />
   <NavButton isCollapsed={isCollapsed} active={activeTab === 'webhooks'} onClick={() => setActiveTab('webhooks')} icon={<Plug className="w-4 h-4" />} label="Webhooks" />
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

 {activeTab === 'dashboard' && <TabDashboard />}
 {activeTab === 'plans' && <TabPlanManager queryClient={queryClient} toast={toast} />}
 {activeTab === 'customers' && <TabCustomerSubscriptions setActiveTab={setActiveTab} setOverrideCompanyId={setOverrideCompanyId} />}
 {activeTab === 'overrides' && <TabManualOverrides initialTargetCompany={overrideCompanyId} />}
 {activeTab === 'transactions' && <TabTransactions />}
 {activeTab === 'usage' && <TabUsageMonitor />}
 {activeTab === 'webhooks' && <TabWebhooks />}

 </div>
 </div>
 </div>
 );
}

function NavButton({ active, onClick, icon, label, isCollapsed }) {
  return (
    <button 
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2 whitespace-nowrap py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 text-left",
        isCollapsed ? "justify-center px-2 md:w-full" : "px-4 md:w-full",
        active ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon} {!isCollapsed && <span className="hidden md:inline">{label}</span>}<span className="md:hidden">{label}</span>
    </button>
  );
}

// ----------------------------------------------------
// 1. Dashboard Tab
// ----------------------------------------------------
function TabDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['superadmin_dashboard_stats'],
    queryFn: async () => {
      const statsObj = { mrr: 0, activeSubscribers: 0, churnRate: 0, failedPayments: 0 };
      
      const resCompanies = await powerSync.execute(`
        SELECT c.id, c.subscription_status, p.price_monthly
        FROM companies c
        LEFT JOIN subscription_plans p ON c.subscription_plan = p.id
        WHERE c.subscription_status IN ('active', 'trial', 'past_due', 'canceled')
      `);
      
      let mrr = 0;
      let activeCount = 0;
      let churnCount = 0;
      for (const row of resCompanies.rows) {
        if (row.subscription_status === 'active' || row.subscription_status === 'trial') {
          activeCount++;
          mrr += Number(row.price_monthly || 0);
        } else if (row.subscription_status === 'canceled' || row.subscription_status === 'past_due') {
          churnCount++;
        }
      }
      statsObj.mrr = mrr;
      statsObj.activeSubscribers = activeCount;
      const totalCompanies = activeCount + churnCount;
      statsObj.churnRate = totalCompanies > 0 ? ((churnCount / totalCompanies) * 100).toFixed(1) : 0;
      
      const resFailed = await powerSync.execute(`SELECT count(*) as cnt FROM subscription_invoices WHERE status = 'failed'`);
      statsObj.failedPayments = resFailed.rows?.item(0)?.cnt || 0;
      
      return statsObj;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Calculating Live Metrics...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Recurring Revenue" value={`GH₵${(stats?.mrr || 0).toLocaleString()}`} icon={<BarChart3 className="w-5 h-5 text-emerald-500" />} trend="Live Data" />
        <StatCard title="Active Subscribers" value={stats?.activeSubscribers || 0} icon={<Users className="w-5 h-5 text-blue-500" />} trend="Live Data" />
        <StatCard title="Churn Rate" value={`${stats?.churnRate || 0}%`} icon={<Activity className="w-5 h-5 text-amber-500" />} trend="Live Data" />
        <StatCard title="Failed Payments" value={stats?.failedPayments || 0} icon={<XCircle className="w-5 h-5 text-red-500" />} trend="Live Data" alert={(stats?.failedPayments || 0) > 0} />
      </div>
      
      <div className="bg-card border border-primary/40 rounded-xl p-8 h-64 flex items-center justify-center text-muted-foreground">
        <BarChart3 className="w-8 h-8 mr-3 opacity-20" /> MRR Chart Visualization Area (Live data connected)
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
  mutationFn: async (planData) => {
    if (planData.id === 'new') {
      const { id, ...restData } = planData;
      const planKeys = Object.keys(restData);
      const planVals = Object.values(restData).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
      await powerSync.execute(`INSERT INTO subscription_plans (${planKeys.join(', ')}) VALUES (${planKeys.map(()=>'?').join(', ')})`, planVals);
    } else {
      const planKeys = Object.keys(planData);
      const planVals = Object.values(planData).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
      await powerSync.execute(`UPDATE subscription_plans SET ${planKeys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [...planVals, planData.id]);
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
   let parsedLimits = plan.limits;
   if (typeof parsedLimits === 'string') {
     try { parsedLimits = JSON.parse(parsedLimits); } catch(e) { parsedLimits = {}; }
   }
   setEditForm({ ...plan, limits: parsedLimits || {} });
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
 {(() => {
   let lim = p.limits;
   if (typeof lim === 'string') {
     try { lim = JSON.parse(lim); } catch(e) { lim = {}; }
   }
   lim = lim || {};
   const entries = Object.entries(lim);
   if (entries.length === 0) return <div className="text-muted-foreground col-span-2 italic text-xs">No custom limits.</div>;
   return entries.map(([k, v]) => (
     <React.Fragment key={k}>
       <div className="text-muted-foreground truncate" title={k}>{k}:</div>
       <div className="font-bold text-right truncate" title={String(v)}>{String(v)}</div>
     </React.Fragment>
   ));
 })()}
 </div>
 </div>
 )
 ))}
 </div>
 </div>
 );
}

function PlanEditor({ plan, setPlan, onSave, onCancel, isSaving}) {
 const limits = plan.limits || {};

 const handleUpdateLimitKey = (oldKey, newKey) => {
   if (oldKey === newKey) return;
   const newLimits = { ...limits };
   newLimits[newKey] = newLimits[oldKey];
   delete newLimits[oldKey];
   setPlan({ ...plan, limits: newLimits });
 };

 const handleUpdateLimitValue = (key, value) => {
   setPlan({ ...plan, limits: { ...limits, [key]: value } });
 };

 const handleRemoveLimit = (key) => {
   const newLimits = { ...limits };
   delete newLimits[key];
   setPlan({ ...plan, limits: newLimits });
 };

 const handleAddLimit = () => {
   setPlan({ ...plan, limits: { ...limits, 'new_feature': '' } });
 };

 return (
 <div className="bg-card border-2 border-primary rounded-xl p-6 flex flex-col">
 <div className="space-y-4 mb-6 flex-1">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Plan Name</label>
 <input type="text" value={plan.name || ''} onChange={e => setPlan({...plan, name: e.target.value})} className="w-full h-9 px-3 border rounded text-sm mt-1" />
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
 <input type="number" value={plan.price_monthly || 0} onChange={e => setPlan({...plan, price_monthly: Number(e.target.value)})} className="w-full h-9 px-3 border rounded text-sm mt-1" />
 </div>
 <div>
 <label className="text-xs font-bold uppercase text-muted-foreground">Paystack Code</label>
 <input type="text" value={plan.paystack_plan_code || ''} onChange={e => setPlan({...plan, paystack_plan_code: e.target.value})} className="w-full h-9 px-3 border rounded text-sm font-mono mt-1" placeholder="PLN_xxxxx" />
 </div>
 </div>
 
 <div className="border-t border-primary/20 pt-4 mt-2">
   <div className="flex justify-between items-center mb-2">
     <label className="text-xs font-bold uppercase text-muted-foreground">Capabilities & Limits</label>
     <button onClick={handleAddLimit} className="flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded">
       <Plus className="w-3 h-3" /> Add Feature
     </button>
   </div>
   <div className="space-y-2">
     {Object.entries(limits).map(([key, val], idx) => (
       <div key={idx} className="flex gap-2 items-center">
         <input type="text" value={key} onChange={e => handleUpdateLimitKey(key, e.target.value)} className="w-1/2 h-8 px-2 border rounded text-xs font-mono" placeholder="feature_key" />
         <input type="text" value={val} onChange={e => handleUpdateLimitValue(key, e.target.value)} className="w-1/2 h-8 px-2 border rounded text-xs" placeholder="Value or 'true'/'false'" />
         <button onClick={() => handleRemoveLimit(key)} className="p-1 text-muted-foreground hover:text-red-500 rounded"><Trash className="w-4 h-4" /></button>
       </div>
     ))}
     {Object.keys(limits).length === 0 && <div className="text-xs text-muted-foreground italic">No custom limits defined.</div>}
   </div>
 </div>

 <div className="flex items-center gap-2 mt-4">
 <input type="checkbox" checked={plan.is_active || false} onChange={e => setPlan({...plan, is_active: e.target.checked})} className="rounded text-primary" />
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
function TabCustomerSubscriptions({ setActiveTab, setOverrideCompanyId }) {
  const [search, setSearch] = useState('');
  
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['superadmin_customers'],
    queryFn: async () => {
      const res = await powerSync.execute(`
        SELECT c.id, c.name, c.subscription_status, p.name as plan_name, cs.paystack_customer_code
        FROM companies c
        LEFT JOIN subscription_plans p ON c.subscription_plan = p.id
        LEFT JOIN company_subscriptions cs ON c.id = cs.company_id
        ORDER BY c.created_date DESC
      `);
      const data = [];
      if (res.rows) {
        for (let i = 0; i < res.rows.length; i++) {
          data.push(res.rows.item(i));
        }
      }
      return data;
    }
  });

  const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.paystack_customer_code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-primary/40 rounded-xl p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company name, ID, or Paystack customer code..." className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-primary/40 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
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
            {isLoading ? (
               <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">Loading Customers...</td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">No customers found.</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-bold text-foreground">{c.name}</td>
                <td className="px-6 py-4">{c.plan_name || 'No Plan'}</td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-1 text-xs font-bold rounded border uppercase", 
                    c.subscription_status === 'active' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    c.subscription_status === 'past_due' ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-700 border-slate-200"
                  )}>{c.subscription_status || 'UNKNOWN'}</span>
                </td>
                <td className="px-6 py-4 text-muted-foreground font-mono">{c.paystack_customer_code || 'N/A'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setOverrideCompanyId(c.id); setActiveTab('overrides'); }} className="text-primary hover:underline text-xs font-bold">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. Manual Overrides Tab
// ----------------------------------------------------
function TabManualOverrides({ initialTargetCompany }) {
  const { toast } = useToast();
  const [targetCompany, setTargetCompany] = useState(initialTargetCompany || '');

  useEffect(() => {
    if (initialTargetCompany) setTargetCompany(initialTargetCompany);
  }, [initialTargetCompany]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [bonusCredits, setBonusCredits] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['superadmin_plans_override'],
    queryFn: async () => {
      const res = await powerSync.execute(`SELECT * FROM subscription_plans ORDER BY price_monthly`);
      const data = [];
      if (res.rows) {
        for (let i = 0; i < res.rows.length; i++) {
          data.push(res.rows.item(i));
        }
      }
      return data;
    }
  });

  const handleApply = async () => {
    if (!targetCompany) return toast({ title: "Error", description: "Company ID is required.", variant: "destructive" });
    setIsApplying(true);
    try {
      if (selectedPlan) {
        await powerSync.execute(`UPDATE companies SET subscription_plan = ?, subscription_status = 'active' WHERE id = ?`, [selectedPlan, targetCompany]);
      }
      if (Number(bonusCredits) > 0) {
        // Find existing usage or create one
        await powerSync.execute(`
          INSERT INTO usage_metrics (company_id, metric_name, used_amount) 
          VALUES (?, 'ai_bonus_credits', ?)
        `, [targetCompany, Number(bonusCredits)]);
      }
      toast({ title: "Override Applied", description: "The system override was successfully executed." });
      setTargetCompany('');
      setSelectedPlan('');
      setBonusCredits(0);
    } catch(err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
    setIsApplying(false);
  };

  return (
    <div className="bg-card border border-primary/40 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" /> Administrative Overrides</h3>
      <p className="text-sm text-muted-foreground mb-6">Manually adjust a company's subscription status or inject bonus AI credits without charging them via Paystack.</p>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Target Company ID</label>
          <input type="text" value={targetCompany} onChange={e => setTargetCompany(e.target.value)} className="w-full h-10 px-3 border rounded-lg text-sm mt-1 font-mono" placeholder="uuid..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Override Plan</label>
            <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full h-10 px-3 border rounded-lg text-sm mt-1 bg-background">
              <option value="">No Change</option>
              {plans.map(p => <option key={p.id} value={p.id}>Force {p.name} (Comped)</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Bonus AI Credits</label>
            <input type="number" value={bonusCredits} onChange={e => setBonusCredits(e.target.value)} className="w-full h-10 px-3 border rounded-lg text-sm mt-1" />
          </div>
        </div>
        <button disabled={isApplying} onClick={handleApply} className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-lg mt-4 transition-colors">
          {isApplying ? 'Applying...' : 'Apply System Override'}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. Transaction Ledger Tab
// ----------------------------------------------------
function TabTransactions() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['superadmin_transactions'],
    queryFn: async () => {
      const res = await powerSync.execute(`
        SELECT id, created_date, company_name, amount_usd, status, id as reference 
        FROM subscription_invoices 
        ORDER BY created_date DESC LIMIT 50
      `);
      const data = [];
      if (res.rows) {
        for (let i = 0; i < res.rows.length; i++) {
          data.push(res.rows.item(i));
        }
      }
      return data;
    }
  });

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
            {isLoading ? (
               <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground font-sans">Loading Ledger...</td></tr>
            ) : invoices.length === 0 ? (
               <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground font-sans">No transactions found.</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-muted/30">
                <td className="px-6 py-4 text-muted-foreground">{new Date(inv.created_date).toLocaleString()}</td>
                <td className="px-6 py-4 font-sans font-bold">{inv.company_name}</td>
                <td className="px-6 py-4 text-foreground">${inv.amount_usd}</td>
                <td className="px-6 py-4">
                  <span className={cn("font-bold", inv.status === 'success' ? "text-emerald-500" : inv.status === 'failed' ? "text-red-500" : "text-amber-500")}>
                    {(inv.status || 'UNKNOWN').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground truncate max-w-[150px]">{inv.reference}</td>
              </tr>
            ))}
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
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['superadmin_usage'],
    queryFn: async () => {
      const res = await powerSync.execute(`
        SELECT u.company_id, c.name, sum(cast(u.used_amount as integer)) as total_usage 
        FROM usage_metrics u
        JOIN companies c ON u.company_id = c.id
        WHERE u.metric_name LIKE '%ai%'
        GROUP BY u.company_id, c.name
        ORDER BY total_usage DESC
        LIMIT 10
      `);
      const data = [];
      if (res.rows) {
        for (let i = 0; i < res.rows.length; i++) {
          data.push(res.rows.item(i));
        }
      }
      return data;
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-primary/40 rounded-xl p-6 ">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> High Usage Companies</h3>
        <p className="text-sm text-muted-foreground mb-4">Companies approaching their AI credit limits (Upsell opportunities).</p>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-4">Loading Usage Data...</div>
          ) : metrics.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No AI usage recorded yet.</div>
          ) : metrics.map(m => {
             // For display purposes, assume 1000 is a generic limit if we don't have their exact plan limits in this query
             const percent = Math.min(100, Math.round((m.total_usage / 1000) * 100));
             const isHigh = percent >= 90;
             return (
               <div key={m.company_id} className="bg-muted rounded-lg p-4">
                 <div className="flex justify-between font-bold text-sm mb-2"><span>{m.name}</span> <span className={isHigh ? "text-red-600" : "text-amber-600"}>{m.total_usage} Credits Used</span></div>
                 <div className="w-full h-2 bg-background rounded-full overflow-hidden"><div className={cn("h-full", isHigh ? "bg-red-500" : "bg-amber-500")} style={{width: `${percent}%`}}></div></div>
               </div>
             )
          })}
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
