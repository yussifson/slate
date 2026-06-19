import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, GraduationCap, User, BookOpen, Clock, MoreHorizontal, FileText, Download, Plus, Sparkles, XCircle, AlertTriangle} from 'lucide-react';
import { toast} from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';

export default function UnivStudent() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [riskModal, setRiskModal] = useState(null);

 useEffect(() => {
 if (companyId) {
 fetchStudents();
 const channel = supabase.channel('student_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_students', filter: `company_id=eq.${companyId}`}, () => {
 fetchStudents();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchStudents = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_students WHERE company_id = ? ORDER BY first_name ASC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setStudents(data || []);
} catch (err) {
 console.error(err);
} finally {
 setLoading(false);
}
};

 const handleAddStudent = async () => {
 const newStudent = {
 company_id: companyId,
 student_id_number: `STD-${Math.floor(Math.random() * 1000)}`,
 first_name: 'New',
 last_name: 'Student',
 grade_level: '9th Grade',
 status: 'Enrolled',
 enrollment_date: new Date().toISOString().split('T')[0] || null
};
 try {
 const { error} = await (async () => {
 const _payload = newStudent;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_students (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Student added');
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to add student');
}
};

 const filtered = students.filter(s => 
 `${s.first_name || ''} ${s.last_name || ''} ${s.student_id_number || ''} ${s.grade_level || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handleAnalyzeRisk = async (s) => {
   setIsAnalyzing(true);
   toast.loading(`Analyzing risk profile for ${s.first_name}...`, { id: "risk" });
   try {
     const prompt = [
       { role: 'system', content: 'You are an expert Educational Data Analyst AI. Predict the dropout or academic failure risk of the given student based on their profile. Return a JSON object with keys: "riskLevel" ("Low", "Medium", "High"), "reasoning" (2-3 sentences of explanation), and "suggestedIntervention" (1 sentence actionable suggestion).' },
       { role: 'user', content: `Student: ${s.first_name} ${s.last_name}\nGrade: ${s.grade_level}\nStatus: ${s.status}\nGuardian: ${s.guardian_name || 'None listed'}` }
     ];
     let response = await generateText(prompt);
     if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
     const jsonMatch = response.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
       const parsed = JSON.parse(jsonMatch[0]);
       setRiskModal({ ...s, analysis: parsed });
       toast.success("Analysis complete", { id: "risk" });
     } else {
       toast.error("Failed to parse analysis", { id: "risk" });
     }
   } catch (err) {
     toast.error("Analysis failed", { id: "risk" });
   } finally {
     setIsAnalyzing(false);
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
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Student Records</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage enrollments, grades, and profiles.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Download className="w-4 h-4" /> Export
 </button>
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={handleAddStudent} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> Add Student
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Total Students</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{students.length}</h3>
 </div>
 <div className="p-3 bg-blue-100 dark:bg-blue-500/10/10 text-blue-600 rounded-xl"><User className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Enrolled</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{students.filter(s => s.status === 'Enrolled').length}</h3>
 </div>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10/10 text-emerald-600 rounded-xl"><BookOpen className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Alumni</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{students.filter(s => s.status === 'Graduated').length}</h3>
 </div>
 <div className="p-3 bg-purple-100 dark:bg-purple-500/10/10 text-purple-600 rounded-xl"><GraduationCap className="w-5 h-5" /></div>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search students..."
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
 <th className="p-4 font-semibold">Student ID</th>
 <th className="p-4 font-semibold">Name</th>
 <th className="p-4 font-semibold">Grade/Level</th>
 <th className="p-4 font-semibold">Status</th>
 <th className="p-4 font-semibold">Guardian</th>
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
 >
 <td className="p-4 font-mono font-semibold text-foreground">
 {s.student_id_number}
 </td>
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0 tracking-[0.04em]">
 {(s.first_name || '').charAt(0)}{(s.last_name || '').charAt(0)}
 </div>
 <div className="font-semibold text-foreground">{s.first_name} {s.last_name}</div>
 </div>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 font-medium">
 {s.grade_level}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border ${
 s.status === 'Enrolled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 s.status === 'Graduated' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
 'bg-background text-foreground border-primary/40'
}`}>
 {s.status}
 </span>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 text-sm">
 {s.guardian_name || '—'}
 </td>
 <td className="p-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={(e) => { e.stopPropagation(); handleAnalyzeRisk(s); }} disabled={isAnalyzing} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 border border-rose-100">
   {isAnalyzing ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Sparkles className="w-3.5 h-3.5" />} Analyze Risk
 </button>
 <button className="text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors p-1.5 rounded-md bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><FileText className="w-3.5 h-3.5" /></button>
 <button className="text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors p-1.5 rounded-md bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><MoreHorizontal className="w-3.5 h-3.5" /></button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {riskModal && (
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
     <div className="bg-card w-full max-w-lg rounded-2xl flex flex-col hover:shadow-xl transition-all">
       <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-rose-50/50">
         <h2 className="text-lg font-bold flex items-center gap-2 text-rose-900"><Sparkles className="w-5 h-5 text-rose-600" /> AI Student Risk Analysis</h2>
         <button onClick={() => setRiskModal(null)} className="p-2 hover:bg-rose-100 rounded-full transition-colors"><XCircle className="w-5 h-5 text-rose-400" /></button>
       </div>
       <div className="p-6 space-y-5">
         <div>
           <div className="text-xs uppercase font-bold tracking-wider text-rose-400 mb-1">Assessed Risk Level</div>
           <div className="flex items-center gap-2 text-3xl font-black text-rose-600">
             {riskModal.analysis.riskLevel === 'High' && <AlertTriangle className="w-8 h-8 text-rose-600" />}
             {riskModal.analysis.riskLevel}
           </div>
         </div>
         <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
           <div className="text-xs uppercase font-bold tracking-wider text-rose-400 mb-2">AI Reasoning</div>
           <p className="text-sm text-rose-900 leading-relaxed font-medium">{riskModal.analysis.reasoning}</p>
         </div>
         <div>
           <div className="text-xs uppercase font-bold tracking-wider text-emerald-600 mb-2 flex items-center gap-2"><Plus className="w-3.5 h-3.5"/> Suggested Intervention</div>
           <p className="text-sm text-emerald-800 leading-relaxed italic bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">{riskModal.analysis.suggestedIntervention}</p>
         </div>
       </div>
     </div>
   </div>
 )}
 </div>
 );
}
