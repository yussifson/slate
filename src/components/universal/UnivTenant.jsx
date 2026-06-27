import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, Plus, Download, MoreHorizontal, User, Home, Calendar, CheckCircle2} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivTenant() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (companyId) {
 fetchData();
 const channel = supabase.channel('univ_tenant_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_tenant', filter: `company_id=eq.${companyId}`}, () => {
 fetchData();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchData = async () => {
 setLoading(true);
 try {
 const { data: fetchedData, error} = await supabase
 .from('univ_tenant')
 .select('*').eq('company_id', companyId)
 .eq('company_id', companyId)
 .order('created_at', { ascending: false});
 if (error && error.code !== '42P01') throw error;
 setData(fetchedData || []);
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to fetch data');
} finally {
 setLoading(false);
}
};

 const handleAdd = async () => {
 const newTenant = {
 company_id: companyId,
 unit_number: `UNIT-${Math.floor(100 + Math.random() * 900)}`,
 first_name: 'New',
 last_name: 'Tenant',
 email: `tenant${Math.floor(Math.random() * 10000)}@example.com`,
 phone: '555-0199',
 status: 'Active',
 lease_start: new Date().toISOString().split('T')[0] || null
 };
 try {
 const { error} = await (async () => {
 const _payload = { ...newTenant, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_tenant (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Tenant added');
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to save');
}
};

 const handleInviteTenant = async (tenant) => {
 if (!tenant.email) {
 toast.error("This tenant does not have an email address.");
 return;
 }
 toast.loading(`Inviting ${tenant.first_name} to the Tenant Portal...`, { id: "invite" });
 try {
 const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
 const { registerSchoolUser } = await import('@/api/authUtils');
 const res = await registerSchoolUser(tenant.email, tempPassword, 'tenant', companyId, `${tenant.first_name} ${tenant.last_name}`);
 
 if (res.error) throw res.error;
 
 await powerSync.execute(`UPDATE univ_tenant SET portal_invited = true, portal_status = 'active' WHERE id = ?`, [tenant.id]);
 fetchData();
 toast.success(`Invite Sent! Temp password: ${tempPassword}`, { id: "invite", duration: 10000 });
 } catch (err) {
 console.error(err);
 toast.error(err.message || 'Invite Failed', { id: "invite" });
 }
 };

 const filtered = data.filter(t => 
 `${t.first_name || ''} ${t.last_name || ''} ${t.unit_number || ''} ${t.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 
 const handleExport = () => {
 const exportData = (typeof data !== 'undefined' ? data : []);
 if (!exportData || exportData.length === 0) return alert('No data to export');
 const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
 const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'export.csv'; a.click();
};

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Tenant</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage your tenant records.</p>
 </div>
 <div className="flex gap-3">
 <div className="flex items-center gap-2">

 
 <div className="flex bg-muted p-1 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mr-2 hidden sm:flex">
 {["Default","Grid","Kanban","Dashboard"].map(v => (
 <button 
 key={v} 
 onClick={() => setView(v)} 
 className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${view === v ? 'bg-background text-foreground' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}
 >
 {v}
 </button>
 ))}
 </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
 <Plus className="w-4 h-4" /> Add Tenant
 </button>
 </div>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-[#71717a] dark:text-gray-400 sticky top-0 z-10 backdrop-blur-md tracking-[0.04em]">
 <tr>
 <th className="p-4 font-semibold capitalize">tenant name</th>
 <th className="p-4 font-semibold capitalize">property id</th>
 <th className="p-4 font-semibold capitalize">lease end</th>
 <th className="p-4 font-semibold capitalize">status</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((item, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={item.id || idx} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer"
 >
 <td className="p-4 font-semibold text-foreground">
 <div className="flex items-center gap-2">
 <User className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> 
 <div>
 <div className="font-semibold text-foreground">{item.first_name} {item.last_name}</div>
 <div className="text-[11px] text-[#71717a] dark:text-gray-400">{item.email || 'No email'}</div>
 </div>
 </div>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 font-medium">
 <div className="flex items-center gap-2"><Home className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> {item.property_id}</div>
 </td>
 <td className="p-4 font-medium text-foreground">
 <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> {item.lease_end}</div>
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border-[0.5px] border-black/9 dark:border-white/8 flex items-center w-fit gap-2 ${
 item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 'bg-background text-foreground border-primary/40'
}`}>
 <CheckCircle2 className="w-3 h-3" />
 {item.status}
 </span>
 </td>
 <td className="p-4 text-right">
 <button className="text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
 </td>
 </motion.tr>
 ))}
 {filtered.length === 0 && !loading && (
 <tr>
 <td colSpan="5" className="p-8 text-center text-[#71717a] dark:text-gray-400">
 No records found.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
