import { OrbitLoader } from '@/components/ui/orbit-loader';
import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Save, RefreshCw, X, Plus, Activity, Sparkles, XCircle, HeartHandshake } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';
import { supabase } from "@/api/supabaseClient";

export default function UnivDonationLog() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(false);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [insightsModal, setInsightsModal] = useState(null);
 const [showForm, setShowForm] = useState(false);
 const [formData, setFormData] = useState({
 donor_name: '',
 amount: '',
 date: '',
 campaign: '',
 payment_method: ''
});

 useEffect(() => {
 fetchItems();
}, []);

 const fetchItems = async () => {
 setLoading(true);
 const __res = await powerSync.execute(`SELECT * FROM univ_donationlog WHERE company_id = ? ORDER BY created_at DESC LIMIT 50`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (!error && data) setItems(data);
 setLoading(false);
};

 const handleAIInsights = async () => {
   setIsAnalyzing(true);
   toast.loading("Analyzing donation trends...", { id: "insights" });
   try {
     const prompt = [
       { role: 'system', content: 'You are an AI Philanthropy Advisor. Analyze the list of recent donations. Return a JSON object with keys: "topTrend" (1 sentence summary of giving patterns), "suggestedCampaign" (1 sentence on what to fundraise for next), and "engagementStrategy" (1 sentence on how to thank or engage these donors).' },
       { role: 'user', content: `Recent Donations:\n${items.map(i => `- ${i.donor_name} gave $${i.amount} for ${i.campaign}`).join('\n')}` }
     ];
     let response = await generateText(prompt);
     if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
     const jsonMatch = response.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
       const parsed = JSON.parse(jsonMatch[0]);
       setInsightsModal(parsed);
       toast.success("Insights generated", { id: "insights" });
     } else {
       toast.error("Failed to parse insights", { id: "insights" });
     }
   } catch (err) {
     toast.error("Analysis failed", { id: "insights" });
   } finally {
     setIsAnalyzing(false);
   }
 };

 const handleSave = async () => {
 setLoading(true);
 const { error} = await (async () => {
 const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_donationlog (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (!error) {
 setShowForm(false);
 setFormData({ donor_name: '', amount: '', date: '', campaign: '', payment_method: ''});
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
 <Activity className="text-blue-600" /> Donation Log
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

  <button onClick={handleAIInsights} disabled={isAnalyzing || items.length === 0} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-sm font-semibold hover:bg-rose-100 transition-colors border border-rose-100 disabled:opacity-50">
  {isAnalyzing ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />} AI Insights
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
 <h2 className="text-xl font-semibold mb-4 text-foreground">New Donation Log Entry</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">donor name</label>
 <input
 type="text"
 value={formData.donor_name}
 onChange={(e) => setFormData({ ...formData, donor_name: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter donor name`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">amount</label>
 <input
 type="number"
 value={formData.amount}
 onChange={(e) => setFormData({ ...formData, amount: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter amount`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">date</label>
 <input
 type="date"
 value={formData.date}
 onChange={(e) => setFormData({ ...formData, date: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter date`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">campaign</label>
 <input
 type="text"
 value={formData.campaign}
 onChange={(e) => setFormData({ ...formData, campaign: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter campaign`}
 />
 </div>
 <div className="flex flex-col">
 <label className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1 capitalize">payment method</label>
 <input
 type="text"
 value={formData.payment_method}
 onChange={(e) => setFormData({ ...formData, payment_method: e.target.value})}
 className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
 placeholder={`Enter payment method`}
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
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">donor name</p>
 <p className="text-foreground font-medium">{item.donor_name || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">amount</p>
 <p className="text-foreground font-medium">{item.amount || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">date</p>
 <p className="text-foreground font-medium">{item.date || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">campaign</p>
 <p className="text-foreground font-medium">{item.campaign || '-'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">payment method</p>
 <p className="text-foreground font-medium">{item.payment_method || '-'}</p>
 </div>
 </div>
 </motion.div>
 ))}
 {items.length === 0 && !loading && (
 <div className="text-center py-12 text-[#71717a] dark:text-gray-400 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40">
 <p>No donation log records found. Create one to get started.</p>
 </div>
 )}
 </div>

  {insightsModal && (
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
     <div className="bg-card w-full max-w-lg rounded-2xl flex flex-col hover:shadow-xl transition-all">
       <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-rose-50/50">
         <h2 className="text-lg font-bold flex items-center gap-2 text-rose-900"><HeartHandshake className="w-5 h-5 text-rose-600" /> AI Donor Insights</h2>
         <button onClick={() => setInsightsModal(null)} className="p-2 hover:bg-rose-100 rounded-full transition-colors"><XCircle className="w-5 h-5 text-rose-400" /></button>
       </div>
       <div className="p-6 space-y-5">
         <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
           <div className="text-xs uppercase font-bold tracking-wider text-rose-500 mb-2">Giving Trend</div>
           <p className="text-sm text-rose-900 leading-relaxed font-medium">{insightsModal.topTrend}</p>
         </div>
         <div>
           <div className="text-xs uppercase font-bold tracking-wider text-blue-500 mb-2 flex items-center gap-2"><Activity className="w-3.5 h-3.5"/> Suggested Campaign Focus</div>
           <p className="text-sm text-blue-800 leading-relaxed italic bg-blue-50/50 p-3 rounded-lg border border-blue-100">{insightsModal.suggestedCampaign}</p>
         </div>
         <div>
           <div className="text-xs uppercase font-bold tracking-wider text-emerald-600 mb-2 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5"/> Engagement Strategy</div>
           <p className="text-sm text-emerald-800 leading-relaxed italic bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">{insightsModal.engagementStrategy}</p>
         </div>
       </div>
     </div>
   </div>
  )}

 </div>
 );
}


