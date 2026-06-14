import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Save, RefreshCw, X, Plus, TrendingUp} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

export default function UnivCampaignMetric() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(false);
 const [showForm, setShowForm] = useState(false);
 const [formData, setFormData] = useState({
 campaign_name: '',
 target_amount: '',
 raised_amount: '',
 start_date: '',
 end_date: ''
});

 useEffect(() => {
 fetchItems();
}, []);

 const fetchItems = async () => {
 setLoading(true);
 const __res = await powerSync.execute(`SELECT * FROM univ_campaignmetric WHERE company_id = ? ORDER BY created_at DESC LIMIT 50`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (!error && data) setItems(data);
 setLoading(false);
};

 const handleSave = async () => {
 setLoading(true);
 const { error} = await (async () => {
 const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_campaignmetric (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (!error) {
 setShowForm(false);
 setFormData({ campaign_name: '', target_amount: '', raised_amount: '', start_date: '', end_date: ''});
 fetchItems();
} else {
 console.error(error);
}
 setLoading(false);
};

 
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
 <div className="p-6 max-w-4xl mx-auto font-sans ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex justify-between items-center mb-6">
 <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
 <TrendingUp className="text-blue-600" /> Campaign Metric
 </h1>
 <div className="flex gap-2">
 <div className="flex items-center gap-2">

 
 <div className="flex bg-muted p-1 rounded-lg border border-border mr-2 hidden sm:flex">
 {["Default","Grid","Calendar","Dashboard"].map(v => (
 <button 
 key={v} 
 onClick={() => setView(v)} 
 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
 >
 {v}
 </button>
 ))}
 </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={fetchItems} className="p-2 bg-muted hover:bg-muted/60 rounded-full transition-colors">
 <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
 </button>
 <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors ">
 <Plus size={20} /> Add New
 </button>
 </div>
 </div>
 </div>

 {showForm && (
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="bg-card p-6 rounded-xl border border-border mb-8 relative">
 <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground">
 <X size={20} />
 </button>
 <h2 className="text-xl font-semibold mb-4 text-foreground">New Campaign Metric Entry</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 
 <div className="flex flex-col">
 <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">campaign name</label>
 <input
 type="text"
 value={formData.campaign_name}
 onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value})}
 className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter campaign name`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">target amount</label>
 <input
 type="number"
 value={formData.target_amount}
 onChange={(e) => setFormData({ ...formData, target_amount: e.target.value})}
 className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter target amount`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">raised amount</label>
 <input
 type="number"
 value={formData.raised_amount}
 onChange={(e) => setFormData({ ...formData, raised_amount: e.target.value})}
 className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter raised amount`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">start date</label>
 <input
 type="date"
 value={formData.start_date}
 onChange={(e) => setFormData({ ...formData, start_date: e.target.value})}
 className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter start date`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">end date</label>
 <input
 type="date"
 value={formData.end_date}
 onChange={(e) => setFormData({ ...formData, end_date: e.target.value})}
 className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter end date`}
 />
 </div>
 </div>
 <button onClick={handleSave} disabled={loading} className="mt-6 flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
 <Save size={20} /> Save Entry
 </button>
 </motion.div>
 )}

 <div className="grid gap-4">
 {items.map((item) => (
 <motion.div key={item.id} initial={{ opacity: 0}} animate={{ opacity: 1}} className="bg-card p-5 rounded-xl border border-border transition-">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold">campaign name</p>
 <p className="text-foreground font-medium">{item.campaign_name || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold">target amount</p>
 <p className="text-foreground font-medium">{item.target_amount || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold">raised amount</p>
 <p className="text-foreground font-medium">{item.raised_amount || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold">start date</p>
 <p className="text-foreground font-medium">{item.start_date || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold">end date</p>
 <p className="text-foreground font-medium">{item.end_date || '-'}</p>
 </div>
 </div>
 </motion.div>
 ))}
 {items.length === 0 && !loading && (
 <div className="text-center py-12 text-muted-foreground bg-background rounded-xl border border-dashed border-primary/50">
 <p>No campaign metric records found. Create one to get started.</p>
 </div>
 )}
 </div>
 </div>
 );
}
