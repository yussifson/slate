import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, Repeat, CreditCard, ArrowUpRight, ArrowDownRight, User, MoreHorizontal, Download, Calendar, Plus, X, Trash2} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivSubscription() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [subscriptions, setSubscriptions] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 
 // Modal states
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingSub, setEditingSub] = useState(null);
 const [form, setForm] = useState({
 plan_name: '',
 customer_name: '',
 status: 'Active',
 billing_cycle: 'Monthly',
 amount: '',
 next_billing_date: ''
});

 useEffect(() => {
 if (companyId) {
 fetchSubscriptions();
 const channel = supabase.channel('subs_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_subscriptions', filter: `company_id=eq.${companyId}`}, () => {
 fetchSubscriptions();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchSubscriptions = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_subscriptions WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setSubscriptions(data || []);
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to fetch subscriptions');
} finally {
 setLoading(false);
}
};

 const handleOpenAdd = () => {
 setEditingSub(null);
 setForm({
 plan_name: 'Pro Tier',
 customer_name: '',
 status: 'Active',
 billing_cycle: 'Monthly',
 amount: '99.00',
 next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
});
 setIsModalOpen(true);
};

 const handleOpenEdit = (sub) => {
 setEditingSub(sub);
 setForm({
 plan_name: sub.plan_name || '',
 customer_name: sub.customer_name || '',
 status: sub.status || 'Active',
 billing_cycle: sub.billing_cycle || 'Monthly',
 amount: sub.amount ? String(sub.amount) : '',
 next_billing_date: sub.next_billing_date || ''
});
 setIsModalOpen(true);
};

 const handleSave = async (e) => {
 e.preventDefault();
 if (!form.plan_name.trim()) {
 toast.error('Plan Name is required');
 return;
}
 const payload = {
 company_id: companyId,
 plan_name: form.plan_name.trim(),
 customer_name: form.customer_name.trim() || null,
 status: form.status,
 billing_cycle: form.billing_cycle,
 amount: Number(form.amount) || 0,
 next_billing_date: form.next_billing_date || null
};

 try {
 if (editingSub) {
 const { error} = await supabase
 .from('univ_subscriptions')
 .update(payload)
 .eq('id', editingSub.id);
 if (error) throw error;
 toast.success('Subscription updated');
} else {
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_subscriptions (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Subscription created');
}
 setIsModalOpen(false);
 fetchSubscriptions();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to save');
}
};

 const handleDelete = async (id) => {
 if (!window.confirm('Are you sure you want to delete this subscription?')) return;
 try {
 await powerSync.execute(`DELETE FROM univ_subscriptions WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
 toast.success('Subscription deleted');
 fetchSubscriptions();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to delete');
}
};

 const filtered = subscriptions.filter(s => 
 `${s.plan_name} ${s.customer_name} ${s.status}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const mrr = subscriptions.filter(s => s.status === 'Active').reduce((sum, s) => sum + Number(s.amount) / (s.billing_cycle === 'Annually' ? 12 : 1), 0);
 const activeCount = subscriptions.filter(s => s.status === 'Active').length;
 const churnedCount = subscriptions.filter(s => s.status === 'Canceled').length;

 
 const handleExport = () => {
 const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
 if (!exportData || exportData.length === 0) return alert('No data to export');
 const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
 const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'export.csv'; a.click();
};

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Subscriptions</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage recurring billing and plans.</p>
 </div>
 <div className="flex gap-3">
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> New Subscription
 </button>
 </div>
 </div>
 </div>

 {/* KPI Row */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Estimated MRR</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">${mrr.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
 </div>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10/10 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Active Subscribers</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{activeCount}</h3>
 </div>
 <div className="p-3 bg-blue-100 dark:bg-blue-500/10/10 text-blue-600 rounded-xl"><User className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Churned</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{churnedCount}</h3>
 </div>
 <div className="p-3 bg-red-100 dark:bg-red-500/10/10 text-red-600 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Toolbar */}
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search customers, plans..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 {/* Table */}
 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-[#71717a] dark:text-gray-400 sticky top-0 z-10 backdrop-blur-md tracking-[0.04em]">
 <tr>
 <th className="p-4 font-semibold">Customer</th>
 <th className="p-4 font-semibold">Plan</th>
 <th className="p-4 font-semibold">Amount</th>
 <th className="p-4 font-semibold">Status</th>
 <th className="p-4 font-semibold">Next Billing</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((s, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={s.id} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer"
 onClick={() => handleOpenEdit(s)}
 >
 <td className="p-4">
 <div className="font-semibold text-foreground">{s.customer_name || 'Anonymous'}</div>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 font-medium">
 {s.plan_name} <span className="text-xs ml-1 opacity-70 tracking-[0.04em]">({s.billing_cycle})</span>
 </td>
 <td className="p-4 font-semibold text-foreground">
 ${Number(s.amount).toFixed(2)}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border ${
 s.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 s.status === 'Past Due' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
 'bg-red-50 text-red-700 border-red-200'
}`}>
 {s.status}
 </span>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 text-sm flex items-center gap-2">
 {s.next_billing_date ? <><Calendar className="w-3.5 h-3.5" /> {s.next_billing_date}</> : '—'}
 </td>
 <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
 <button 
 onClick={() => handleOpenEdit(s)}
 className="text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors p-2"
 >
 <MoreHorizontal className="w-4 h-4" />
 </button>
 <button 
 onClick={() => handleDelete(s.id)}
 className="text-[#71717a] dark:text-gray-400 hover:text-red-500 transition-colors p-2"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </td>
 </motion.tr>
 ))}
 {filtered.length === 0 && (
 <tr>
 <td colSpan="6" className="p-12 text-center text-[#71717a] dark:text-gray-400">
 <Repeat className="w-8 h-8 mx-auto text-slate-300 mb-3" />
 No subscriptions found.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Subscription Form Modal */}
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl max-w-md w-full p-6 relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <button 
 onClick={() => setIsModalOpen(false)}
 className="absolute right-4 top-4 text-[#71717a] dark:text-gray-400 hover:text-foreground"
 >
 <X className="w-5 h-5" />
 </button>
 
 <h3 className="text-lg font-semibold text-foreground mb-4">
 {editingSub ? 'Edit Subscription' : 'New Subscription'}
 </h3>
 
 <form onSubmit={handleSave} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Customer Name</label>
 <input 
 type="text" 
 value={form.customer_name}
 onChange={(e) => setForm({ ...form, customer_name: e.target.value})}
 placeholder="e.g. Acme Corp"
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Plan Name *</label>
 <input 
 type="text" 
 value={form.plan_name}
 onChange={(e) => setForm({ ...form, plan_name: e.target.value})}
 placeholder="e.g. Pro Tier"
 required
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Billing Cycle</label>
 <select 
 value={form.billing_cycle}
 onChange={(e) => setForm({ ...form, billing_cycle: e.target.value})}
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
 >
 <option value="Monthly">Monthly</option>
 <option value="Annually">Annually</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Amount *</label>
 <input 
 type="number" 
 step="0.01"
 value={form.amount}
 onChange={(e) => setForm({ ...form, amount: e.target.value})}
 required
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Status</label>
 <select 
 value={form.status}
 onChange={(e) => setForm({ ...form, status: e.target.value})}
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
 >
 <option value="Active">Active</option>
 <option value="Canceled">Canceled</option>
 <option value="Past Due">Past Due</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Next Billing Date</label>
 <input 
 type="date" 
 value={form.next_billing_date}
 onChange={(e) => setForm({ ...form, next_billing_date: e.target.value})}
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
 />
 </div>
 </div>

 <div className="pt-2 flex justify-end gap-3">
 <button 
 type="button" 
 onClick={() => setIsModalOpen(false)}
 className="px-4 py-2 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-foreground hover:bg-muted/50 rounded-xl text-sm font-medium transition-colors"
 >
 Cancel
 </button>
 <button 
 type="submit" 
 className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-medium transition-colors "
 >
 Save
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </div>
 );
}
