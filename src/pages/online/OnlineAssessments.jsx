import React, { useState} from 'react';
import { BookOpen, CheckCircle2, Clock, AlertCircle, Sparkles, Plus, Loader2} from 'lucide-react';
import { useNavigate} from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from "@/hooks/useCompanyId";
import { generateText } from '@/lib/cloudflareAI';
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

export default function OnlineAssessments() {
 const navigate = useNavigate();
 const companyId = useCompanyId();
 const queryClient = useQueryClient();
 const { toast } = useToast();

 const [activeAssessment, setActiveAssessment] = useState(null);
 const [started, setStarted] = useState(false);
 const [currentQ, setCurrentQ] = useState(0);
 const [selectedOption, setSelectedOption] = useState(null);
 const [score, setScore] = useState(0);
 
 const [isAiModalOpen, setIsAiModalOpen] = useState(false);
 const [aiTopic, setAiTopic] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);

 const { data: assessments = [], isLoading } = useQuery({
   queryKey: ["online_assessments", companyId],
   queryFn: async () => {
     const { data } = await powerSync.execute(`SELECT * FROM online_assessments WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
     return data || [];
   },
   enabled: !!companyId
 });

 const handleGenerateQuiz = async () => {
   if (!aiTopic.trim()) return;
   setIsGenerating(true);
   toast({ title: "Generating Quiz...", description: "AI is creating assessment questions." });
   try {
     const prompt = [
       { role: 'system', content: 'You are an expert educator. Generate a 3-question multiple choice quiz about the provided topic. Return a JSON object with: "title", "passing_score" (number out of 100), and "questions" (array of objects, each with "text", "options" (array of 4 strings), and "correctAnswerIndex" (0-3)).' },
       { role: 'user', content: `Topic: ${aiTopic}` }
     ];
     let response = await generateText(prompt);
     if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
     const jsonMatch = response.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
       const parsed = JSON.parse(jsonMatch[0]);
       const newId = `ass_${Math.random().toString(36).substr(2, 9)}`;
       await powerSync.execute(
         `INSERT INTO online_assessments (id, company_id, title, questions_json, passing_score, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
         [newId, companyId, parsed.title, JSON.stringify(parsed.questions), parsed.passing_score || 80, new Date().toISOString()]
       );
       toast({ title: "Success", description: "Quiz generated!" });
       queryClient.invalidateQueries(["online_assessments", companyId]);
       setIsAiModalOpen(false);
       setAiTopic('');
     } else {
       toast({ title: "Error", description: "Failed to parse AI response.", variant: "destructive" });
     }
   } catch (error) {
     console.error(error);
     toast({ title: "Error", description: "Failed to generate quiz.", variant: "destructive" });
   } finally {
     setIsGenerating(false);
   }
 };

 const startAssessment = (ass) => {
   setActiveAssessment(ass);
   setStarted(true);
   setCurrentQ(0);
   setSelectedOption(null);
   setScore(0);
 };

 const handleNext = () => {
   let questions = [];
   try { questions = JSON.parse(activeAssessment.questions_json); } catch(e){}
   
   if (selectedOption === questions[currentQ].correctAnswerIndex) {
     setScore(s => s + 1);
   }

   setSelectedOption(null);
   if (currentQ < questions.length - 1) {
     setCurrentQ(currentQ + 1);
   } else {
     setStarted('finished');
   }
 };

 if (!activeAssessment && !started) {
   return (
     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
         <div>
           <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Assessments</h1>
           <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage quizzes and exams for your courses.</p>
         </div>
         <div className="flex gap-3">
           <button onClick={() => setIsAiModalOpen(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 text-sm font-semibold rounded-md-[var(--radius-md)] hover:bg-indigo-100 transition-colors flex items-center gap-2">
             <Sparkles className="w-4 h-4" /> AI Quiz Generator
           </button>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {assessments.map(ass => {
           let qs = [];
           try { qs = JSON.parse(ass.questions_json || '[]'); } catch(e){}
           return (
             <div key={ass.id} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-5 flex flex-col glass-card hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                   <BookOpen className="w-5 h-5" />
                 </div>
                 <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">{ass.title || 'Untitled Assessment'}</h3>
               </div>
               <div className="text-sm text-[var(--color-text-secondary)] mb-6 flex-1">
                 <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4"/> {qs.length} Questions</div>
                 <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Passing Score: {ass.passing_score || 80}%</div>
               </div>
               <button onClick={() => startAssessment(ass)} className="w-full py-2 bg-[var(--color-surface-1)] hover:bg-[var(--primary)] hover:text-white transition-colors border border-primary/20 rounded-md text-sm font-medium">
                 Preview Assessment
               </button>
             </div>
           );
         })}
       </div>

       <AnimatePresence>
       {isAiModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
           <motion.div initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} exit={{ opacity: 0, scale: 0.95}} className="bg-card w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-xl border border-primary/20">
             <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-indigo-50">
               <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-900"><Sparkles className="w-5 h-5 text-indigo-600" /> AI Quiz Generator</h2>
               <button onClick={() => setIsAiModalOpen(false)} className="text-indigo-900/50 hover:bg-indigo-100 p-1 rounded-full">✕</button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Topic or Lesson Content</label>
                 <textarea value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. Basics of React Hooks" className="w-full min-h-[100px] p-3 bg-background border border-primary/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
               </div>
               <button onClick={handleGenerateQuiz} disabled={isGenerating || !aiTopic.trim()} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                 {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Generate Quiz
               </button>
             </div>
           </motion.div>
         </div>
       )}
       </AnimatePresence>
     </div>
   );
 }

 let questions = [];
 try { questions = JSON.parse(activeAssessment.questions_json); } catch(e){}

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto py-12 px-4">
 
 {started === true && (
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden flex flex-col">
 <div className="bg-[var(--color-surface-1)] border-b border-primary/40 p-4 flex justify-between items-center">
 <div className="text-sm font-semibold text-[var(--color-text-secondary)]">
 Question {currentQ + 1} of {questions.length}
 </div>
 <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-error)]">
 <Clock className="w-4 h-4" /> 14:59
 </div>
 </div>
 
 <div className="p-8">
 <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">{questions[currentQ]?.text}</h2>
 
 <div className="space-y-3">
 {questions[currentQ]?.options?.map((opt, idx) => (
 <button 
 key={idx}
 onClick={() => setSelectedOption(idx)}
 className={`w-full text-left p-4 rounded-md-[var(--radius-md)] border-[0.5px] border-black/9 dark:border-white/8 text-sm font-medium transition-colors ${selectedOption === idx ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--color-surface-0)] text-[var(--color-text-primary)] border-primary/40 hover:border-[var(--primary)]'}`}
 >
 {opt}
 </button>
 ))}
 </div>
 </div>

 <div className="bg-[var(--color-surface-1)] border-t border-primary/40 p-4 flex justify-end gap-3">
 <button onClick={() => { setActiveAssessment(null); setStarted(false); }} className="px-6 py-2 border border-primary/20 text-sm font-medium rounded-md hover:bg-[var(--color-surface-2)]">Cancel</button>
 <button 
 disabled={selectedOption === null}
 onClick={handleNext} 
 className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity disabled:opacity-50"
 >
 {currentQ === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
 </button>
 </div>
 </div>
 )}

 {started === 'finished' && (
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 text-center">
 <div className="w-16 h-16 bg-[var(--color-success-subtle)] text-[var(--color-success)] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white">
 <CheckCircle2 className="w-8 h-8" />
 </div>
 <h1 className="text-3xl font-semibold font-display text-[var(--color-text-primary)] mb-2 tracking-[-0.02em]">Assessment Complete</h1>
 <p className="text-[var(--color-text-secondary)] mb-6">You scored {score} out of {questions.length} ({(score/questions.length)*100}%)</p>
 
 <div className="flex justify-center gap-4">
 <button onClick={() => { setActiveAssessment(null); setStarted(false); }} className="px-6 py-2 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
 Back to Assessments
 </button>
 </div>
 </div>
 )}

 </div>
 );
}
