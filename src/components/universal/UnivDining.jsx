import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, ChefHat, Plus, CheckCircle2, Clock, Check, MoreHorizontal, Utensils, Receipt} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivDining() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [orders, setOrders] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (companyId) {
 fetchOrders();
 const channel = supabase.channel('dining_orders_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_dining_orders', filter: `company_id=eq.${companyId}`}, () => {
 fetchOrders();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchOrders = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_dining_orders WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setOrders(data || []);
} catch (err) {
 // Mock data removed for production empty states
} finally {
 setLoading(false);
}
};

 const handleAddOrder = async () => {
 const newOrder = {
 company_id: companyId,
 order_number: `ORD-${Math.floor(100 + Math.random() * 900)}`,
 table_number: 'T-01',
 order_type: 'Dine-In',
 status: 'Received',
 total_amount: Number(25.00) || 0,
 items: [{name: 'Burger', qty: 1}, {name: 'Fries', qty: 1}]
};
 try {
 const { error} = await (async () => {
 const _p = newOrder;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_dining_orders (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
 toast.success('Order created');
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to save');
}
};

 const filtered = orders.filter(o => 
 `${o.order_number} ${o.table_number || ''} ${o.room_number || ''} ${o.status}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 
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
 <h2 className="text-2xl font-bold text-foreground tracking-tight">Dining Orders</h2>
 <p className="text-sm text-muted-foreground mt-1">Manage restaurant dine-in, takeaway, and room service orders.</p>
 </div>
 <div className="flex gap-3">
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={handleAddOrder} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> New Order
 </button>
 </div>
 </div>
 </div>

 <div className="flex-1 bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text"
 placeholder="Search orders..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar p-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
 {filtered.map((o, idx) => (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 transition={{ delay: idx * 0.05}}
 key={o.id} 
 className="bg-background border border-primary/40 rounded-2xl p-5 hover:border-primary/40 transition-colors flex flex-col h-full group cursor-pointer"
 >
 <div className="flex justify-between items-start mb-4 border-b border-primary/40 pb-4">
 <div>
 <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
 <Receipt className="w-4 h-4 text-primary" /> {o.order_number}
 </h3>
 <div className="text-sm text-muted-foreground mt-1 font-medium">
 {o.order_type === 'Room Service' ? `Room ${o.room_number}` : `Table ${o.table_number}`} • {o.order_type}
 </div>
 </div>
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
 o.status === 'Received' ? 'bg-red-50 text-red-700 border-red-200' : 
 o.status === 'Preparing' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
 o.status === 'Served' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
 'bg-emerald-50 text-emerald-700 border-emerald-200'
}`}>
 {o.status === 'Received' && <Clock className="w-3 h-3" />}
 {o.status === 'Preparing' && <ChefHat className="w-3 h-3" />}
 {o.status === 'Served' && <Utensils className="w-3 h-3" />}
 {o.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
 {o.status}
 </span>
 </div>

 <div className="flex-1">
 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Items</h4>
 <ul className="space-y-2 mb-4">
 {Array.isArray(o.items) && o.items.map((item, i) => (
 <li key={i} className="flex justify-between text-sm">
 <span className="text-foreground"><span className="text-primary font-bold">{item.qty}x</span> {item.name}</span>
 </li>
 ))}
 </ul>
 </div>

 <div className="mt-auto pt-4 border-t border-primary/40 flex justify-between items-center">
 <span className="text-xl font-black text-foreground">${Number(o.total_amount).toFixed(2)}</span>
 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-bold rounded hover:bg-primary hover:text-white transition-colors">Update</button>
 </div>
 </div>
 </motion.div>
 ))}
 </div>

 {filtered.length === 0 && (
 <div className="text-center py-12 text-muted-foreground">
 <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p>No orders found.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
