import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, Briefcase, Plus, Scale, CheckCircle2, AlertCircle, Clock, MoreHorizontal, User, Sparkles, XCircle} from 'lucide-react';
import { toast} from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';

export default function UnivCaseManagement() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [cases, setCases] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [isPredicting, setIsPredicting] = useState(false);
 const [predictionModal, setPredictionModal] = useState(null);

 useEffect(() => {
 if (companyId) {
 fetchCases();
 const channel = supabase.channel('cases_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_cases', filter: `company_id=eq.${companyId}`}, () => {
 fetchCases();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchCases = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_cases WHERE company_id = ? ORDER BY filed_date DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setCases(data || []);
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to fetch cases');
} finally {
 setLoading(false);
}
};

 const handleAddCase = async () => {
 const newCase = {
 company_id: companyId,
 case_number: `CAS-${Math.floor(1000 + Math.random() * 9000)}`,
 client_name: 'New Client',
 case_type: 'General Litigation',
 status: 'Open',
 filed_date: new Date().toISOString().split('T')[0],
 court_jurisdiction: 'Local Court'
};
 try {
 const { error} = await (async () => {
 const _payload = newCase;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_cases (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Case added');
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to save');
}
};

 const filtered = cases.filter(c => 
 `${c.case_number} ${c.client_name} ${c.case_type} ${c.status}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handlePredictOutcome = async (c) => {
   setIsPredicting(true);
   toast.loading("Analyzing precedents...", { id: "predict" });
   try {
     const prompt = [
       { role: 'system', content: 'You are an expert AI Legal Analyst. Predict the outcome of the given case based on typical precedents. Return a JSON object with keys: "probability" (e.g. "75% Success"), "reasoning" (2-3 sentences), "precedent" (1 sentence of a fictional similar past case).' },
       { role: 'user', content: `Case Type: ${c.case_type}\nJurisdiction: ${c.court_jurisdiction}\nClient: ${c.client_name}` }
     ];
     let response = await generateText(prompt);
     if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
     const jsonMatch = response.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
       const parsed = JSON.parse(jsonMatch[0]);
       setPredictionModal({ ...c, prediction: parsed });
       toast.success("Analysis complete", { id: "predict" });
     } else {
       toast.error("Failed to parse prediction", { id: "predict" });
     }
   } catch (err) {
     toast.error("Prediction failed", { id: "predict" });
   } finally {
     setIsPredicting(false);
   }
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
 <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Case Management</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage legal cases, client files, and jurisdictions.</p>
 </div>
 <div className="flex gap-3">
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={handleAddCase} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> Open New Case
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 shrink-0">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Total Cases</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{cases.length}</h3>
 </div>
 <div className="p-3 bg-blue-100 dark:bg-blue-500/10/10 text-blue-600 rounded-xl"><Briefcase className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Open Cases</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{cases.filter(c => c.status === 'Open').length}</h3>
 </div>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10/10 text-emerald-600 rounded-xl"><Scale className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">In Progress</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{cases.filter(c => c.status === 'In Progress').length}</h3>
 </div>
 <div className="p-3 bg-orange-100 dark:bg-orange-500/10/10 text-orange-600 rounded-xl"><Clock className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Closed</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{cases.filter(c => c.status === 'Closed').length}</h3>
 </div>
 <div className="p-3 bg-muted dark:bg-slate-800 text-[#71717a] dark:text-gray-400 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search cases, clients..."
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
 <th className="p-4 font-semibold">Case Info</th>
 <th className="p-4 font-semibold">Client</th>
 <th className="p-4 font-semibold">Jurisdiction</th>
 <th className="p-4 font-semibold">Filed Date</th>
 <th className="p-4 font-semibold">Status</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((c, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={c.id} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer"
 >
 <td className="p-4">
 <div className="font-semibold text-foreground flex items-center gap-2">
 <Briefcase className="w-4 h-4 text-primary" /> {c.case_number}
 </div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{c.case_type}</div>
 </td>
 <td className="p-4">
 <div className="font-semibold flex items-center gap-2.5"><User className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400"/> {c.client_name}</div>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400">
 <div className="flex items-center gap-2.5"><Scale className="w-3.5 h-3.5" /> {c.court_jurisdiction || 'N/A'}</div>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">
 {c.filed_date || '—'}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border-[0.5px] border-black/9 dark:border-white/8 flex items-center gap-2 w-fit ${
 c.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 c.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
 c.status === 'Closed' ? 'bg-muted text-foreground border-primary/40' : 
 'bg-orange-50 text-orange-700 border-orange-200'
}`}>
 {c.status}
 </span>
 </td>
 <td className="p-4 text-right">
 <button onClick={(e) => { e.stopPropagation(); handlePredictOutcome(c); }} disabled={isPredicting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 border border-indigo-100 mr-2">
   {isPredicting ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Sparkles className="w-3.5 h-3.5" />} Predict
 </button>
 <button className="text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {predictionModal && (
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
     <div className="bg-card w-full max-w-lg rounded-2xl flex flex-col hover:shadow-xl transition-all">
       <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-indigo-50/50">
         <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-900"><Sparkles className="w-5 h-5 text-indigo-600" /> AI Outcome Prediction</h2>
         <button onClick={() => setPredictionModal(null)} className="p-2 hover:bg-indigo-100 rounded-full transition-colors"><XCircle className="w-5 h-5 text-indigo-400" /></button>
       </div>
       <div className="p-6 space-y-5">
         <div>
           <div className="text-xs uppercase font-bold tracking-wider text-indigo-400 mb-1">Success Probability</div>
           <div className="text-3xl font-black text-indigo-600">{predictionModal.prediction.probability}</div>
         </div>
         <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
           <div className="text-xs uppercase font-bold tracking-wider text-indigo-400 mb-2">AI Reasoning</div>
           <p className="text-sm text-indigo-900 leading-relaxed font-medium">{predictionModal.prediction.reasoning}</p>
         </div>
         <div>
           <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-2"><Scale className="w-3.5 h-3.5"/> Relevant Precedent</div>
           <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">{predictionModal.prediction.precedent}</p>
         </div>
       </div>
     </div>
   </div>
 )}
 </div>
 );
}
