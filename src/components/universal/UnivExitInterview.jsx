import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Save, RefreshCw, X, Plus, FileText} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

export default function UnivExitInterview() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(false);
 const [showForm, setShowForm] = useState(false);
 const [formData, setFormData] = useState({
 employee_name: '',
 departure_date: '',
 reason: '',
 feedback: '',
 interviewer: ''
});

 useEffect(() => {
 fetchItems();
}, []);

 const fetchItems = async () => {
 setLoading(true);
 const __res = await powerSync.execute(`SELECT * FROM univ_exitinterview WHERE company_id = ? ORDER BY created_at DESC LIMIT 50`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (!error && data) setItems(data);
 setLoading(false);
};

 const handleSave = async () => {
 setLoading(true);
 const { error} = await (async () => {
 const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_exitinterview (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (!error) {
 setShowForm(false);
 setFormData({ employee_name: '', departure_date: '', reason: '', feedback: '', interviewer: ''});
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
 <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2 tracking-[-0.02em]">
 <FileText className="text-blue-600" /> Exit Interview
 </h1>
 <div className="flex gap-2">
 <div className="flex items-center gap-2">

 
 <div className="flex bg-muted p-1 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mr-2 hidden sm:flex">
 {["Default","Grid","Calendar","Dashboard"].map(v => (
 <button 
 key={v} 
 onClick={() => setView(v)} 
 className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${view === v ? 'bg-background text-foreground' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}
 >
 {v}
 </button>
 ))}
 </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={fetchItems} className="p-2 bg-muted hover:bg-muted/60 rounded-full transition-colors">
 { loading ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" /> }
 </button>
 <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors ">
 <Plus size={20} /> Add New
 </button>
 </div>
 </div>
 </div>

 {showForm && (
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="bg-card p-6 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mb-8 relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-[#71717a] dark:text-gray-400 hover:text-[#71717a] dark:text-gray-400">
 <X size={20} />
 </button>
 <h2 className="text-xl font-semibold mb-4 text-foreground">New Exit Interview Entry</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">employee name</label>
 <input
 type="text"
 value={formData.employee_name}
 onChange={(e) => setFormData({ ...formData, employee_name: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter employee name`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">departure date</label>
 <input
 type="date"
 value={formData.departure_date}
 onChange={(e) => setFormData({ ...formData, departure_date: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter departure date`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">reason</label>
 <input
 type="text"
 value={formData.reason}
 onChange={(e) => setFormData({ ...formData, reason: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter reason`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">feedback</label>
 <input
 type="text"
 value={formData.feedback}
 onChange={(e) => setFormData({ ...formData, feedback: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter feedback`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">interviewer</label>
 <input
 type="text"
 value={formData.interviewer}
 onChange={(e) => setFormData({ ...formData, interviewer: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter interviewer`}
 />
 </div>
 </div>
 <button onClick={handleSave} disabled={loading} className="mt-6 flex items-center gap-2 bg-green-500/10 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50">
 <Save size={20} /> Save Entry
 </button>
 </motion.div>
 )}

 <div className="grid gap-4">
 {items.map((item) => (
 <motion.div key={item.id} initial={{ opacity: 0}} animate={{ opacity: 1}} className="bg-card p-5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 transition- hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">employee name</p>
 <p className="text-foreground font-medium">{item.employee_name || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">departure date</p>
 <p className="text-foreground font-medium">{item.departure_date || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">reason</p>
 <p className="text-foreground font-medium">{item.reason || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">feedback</p>
 <p className="text-foreground font-medium">{item.feedback || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">interviewer</p>
 <p className="text-foreground font-medium">{item.interviewer || '-'}</p>
 </div>
 </div>
 </motion.div>
 ))}
 {items.length === 0 && !loading && (
 <div className="text-center py-12 text-[#71717a] dark:text-gray-400 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40">
 <p>No exit interview records found. Create one to get started.</p>
 </div>
 )}
 </div>
 </div>
 );
}
