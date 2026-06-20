import React, { useState} from 'react';
import { useQuery} from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Users, Search, Mail, Phone, Calendar, MoreHorizontal, GraduationCap, Sparkles, Loader2, AlertTriangle, X} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { generateText } from '@/lib/cloudflareAI';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnlineLearners() {
 const companyId = useCompanyId();
 const [searchTerm, setSearchTerm] = useState('');
 const [isAiModalOpen, setIsAiModalOpen] = useState(false);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [riskReport, setRiskReport] = useState(null);
 const { toast } = useToast();

 const { data: learners = []} = useQuery({
 queryKey: ["online_learners", companyId],
 queryFn: async () => {
   try {
     const data = await powerSync.getAll(`
       SELECT 
         student_id, 
         student_name as title, 
         student_email as email, 
         COUNT(course_id) as enrolled_count, 
         MIN(enrollment_date) as created_at,
         AVG(CAST(progress_percent as REAL)) as avg_progress,
         MAX(last_accessed) as last_accessed
       FROM online_enrollments 
       WHERE company_id = ? 
       GROUP BY student_id, student_name, student_email
     `, [companyId]);
     return data || [];
   } catch (e) {
     return [];
   }
 },
 enabled: !!companyId
 });

 const filteredLearners = learners.filter(l => 
 (l.title || '').toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handleRunAiPredictor = async () => {
   if (learners.length === 0) {
     toast({ title: "Not enough data", description: "You need active learners to run predictions.", variant: "destructive" });
     return;
   }
   setIsAnalyzing(true);
   toast({ title: "Analyzing Student Data...", description: "AI is looking for engagement patterns." });
   try {
     const dataToAnalyze = learners.map(l => ({
       name: l.title,
       avgProgress: l.avg_progress,
       lastAccessed: l.last_accessed,
       enrolledCount: l.enrolled_count
     }));
     const prompt = [
       { role: 'system', content: 'You are an educational success predictor. Analyze the provided list of students and identify those at high risk of dropping out based on low progress and stale last_accessed dates. Return a JSON object with an array "atRiskStudents" containing objects with "name", "riskLevel" ("High", "Medium"), and "reason".' },
       { role: 'user', content: JSON.stringify(dataToAnalyze) }
     ];
     let response = await generateText(prompt);
     if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
     const jsonMatch = response.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
       setRiskReport(JSON.parse(jsonMatch[0]));
     } else {
       toast({ title: "Error", description: "Failed to parse AI response.", variant: "destructive" });
     }
   } catch (error) {
     console.error(error);
     toast({ title: "Error", description: "Failed to analyze learners.", variant: "destructive" });
   } finally {
     setIsAnalyzing(false);
   }
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Learners Directory</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage and communicate with all registered learners on the platform.</p>
 </div>
 <div className="flex gap-3">
 <button onClick={() => setIsAiModalOpen(true)} className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 text-sm font-semibold rounded-md-[var(--radius-md)] hover:bg-amber-100 transition-colors flex items-center gap-2">
 <Sparkles className="w-4 h-4" /> AI Risk Predictor
 </button>
 <button onClick={() => toast({ title: "Feature Notice", description: "Learners are automatically added when members enroll in a course." })} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
 Add Learner
 </button>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden flex flex-col">
 <div className="p-4 border-b border-primary/40 flex gap-4 bg-[var(--color-surface-1)]">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
 <input 
 type="text" 
 placeholder="Search learners by name..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-[var(--color-surface-1)] border-b border-primary/40 text-[var(--color-text-secondary)]">
 <tr>
 <th className="px-6 py-3 font-semibold">Learner Name</th>
 <th className="px-6 py-3 font-semibold">Contact Info</th>
 <th className="px-6 py-3 font-semibold">Joined Date</th>
 <th className="px-6 py-3 font-semibold">Enrolled Courses</th>
 <th className="px-6 py-3 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
 {filteredLearners.length === 0 ? (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p className="font-medium text-[var(--color-text-secondary)]">No learners found</p>
 <p className="text-sm mt-1">Try adjusting your search or enroll a new learner.</p>
 </td>
 </tr>
 ) : (
 filteredLearners.map((learner, idx) => {
 return (
 <tr key={idx} className="hover:bg-[var(--color-surface-1)] transition-colors group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] text-[var(--primary)] flex items-center justify-center font-semibold text-xs uppercase  tracking-[0.04em]">
 {(learner.title || 'U').charAt(0)}
 </div>
 <span className="font-medium">{learner.title || 'Unnamed Learner'}</span>
 </div>
 </td>
 <td className="px-6 py-4 space-y-1">
 {learner.email && (
 <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">
 <Mail className="w-3.5 h-3.5" /> {learner.email}
 </div>
 )}
 {learner.phone && (
 <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">
 <Phone className="w-3.5 h-3.5" /> {learner.phone}
 </div>
 )}
 {!learner.email && !learner.phone && <span className="text-xs italic text-[var(--color-text-tertiary)] tracking-[0.04em]">No contact info</span>}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">
 <Calendar className="w-3.5 h-3.5" /> 
 {learner.created_at ? new Date(learner.created_at).toLocaleDateString() : 'N/A'}
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)] tracking-[0.04em]">
 <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
 {learner.enrolled_count || 0} courses
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--primary)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors opacity-0 group-hover:opacity-100">
 <MoreHorizontal className="w-4 h-4" />
 </button>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* AI Risk Predictor Modal */}
 <AnimatePresence>
 {isAiModalOpen && (
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
     <motion.div initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} exit={{ opacity: 0, scale: 0.95}} className="bg-card w-full max-w-lg rounded-2xl flex flex-col overflow-hidden shadow-xl border border-primary/20">
       <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-amber-50">
         <h2 className="text-lg font-bold flex items-center gap-2 text-amber-900"><Sparkles className="w-5 h-5 text-amber-600" /> AI Student Risk Predictor</h2>
         <button onClick={() => setIsAiModalOpen(false)} className="text-amber-900/50 hover:bg-amber-100 p-1 rounded-full"><X className="w-5 h-5" /></button>
       </div>
       <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
         <p className="text-sm text-muted-foreground">AI will analyze engagement patterns, course progress, and login frequency to identify students who are at risk of falling behind or dropping out.</p>
         
         {!riskReport ? (
           <button onClick={handleRunAiPredictor} disabled={isAnalyzing} className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
             {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />} Analyze {learners.length} Students
           </button>
         ) : (
           <div className="space-y-4">
             <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Analysis Results</h3>
             {riskReport.atRiskStudents?.length === 0 ? (
               <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200">
                 All students seem to be engaging well with their courses!
               </div>
             ) : (
               riskReport.atRiskStudents?.map((student, i) => (
                 <div key={i} className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-200">
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-bold">{student.name}</span>
                     <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded uppercase tracking-wider">{student.riskLevel} Risk</span>
                   </div>
                   <p className="text-sm opacity-90">{student.reason}</p>
                 </div>
               ))
             )}
             <button onClick={() => setRiskReport(null)} className="w-full py-2 border border-primary/20 rounded-xl text-sm font-semibold hover:bg-muted">Run Again</button>
           </div>
         )}
       </div>
     </motion.div>
   </div>
 )}
 </AnimatePresence>
 </div>
 );
}
