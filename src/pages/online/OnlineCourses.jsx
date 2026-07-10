import React, { useState} from 'react';
import { useNavigate} from 'react-router-dom';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId} from "@/hooks/useCompanyId";
import { BookOpen, Search, PlayCircle, Clock, Users, Star, ArrowRight, Sparkles, Loader2, Trash2, X} from 'lucide-react';
import { motion, AnimatePresence} from 'framer-motion';
import { useToast} from "@/components/ui/use-toast";
import { generateText } from '@/lib/cloudflareAI';

export default function OnlineCourses() {
 const companyId = useCompanyId();
 const [searchTerm, setSearchTerm] = useState('');
 const [isAiModalOpen, setIsAiModalOpen] = useState(false);
 const [aiTopic, setAiTopic] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const queryClient = useQueryClient();
 const { toast} = useToast();
 const navigate = useNavigate();

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
   await powerSync.execute(`DELETE FROM online_courses WHERE id = ?`, [id]);
 },
 onSuccess: () => {
 toast({ title: "Success", description: "Course deleted successfully."});
 queryClient.invalidateQueries(["online_courses", companyId]);
 },
 onError: () => {
 toast({ variant: "destructive", title: "Error", description: "Failed to delete course."});
 }
 });

 const { data: courses = [], isLoading} = useQuery({
 queryKey: ["online_courses", companyId],
 queryFn: async () => {
   try {
     const data = await powerSync.getAll(`SELECT * FROM online_courses WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
     return data || [];
   } catch (error) {
     if (error && error.code !== '42P01') throw error;
     return [];
   }
 },
 enabled: !!companyId
 });

 const filteredCourses = courses.filter(c => 
 (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handleAiGenerate = async () => {
   if (!aiTopic.trim()) return;
   setIsGenerating(true);
   toast({ title: "Generating Course Outline...", description: "AI is crafting your curriculum." });
   try {
     const prompt = [
       { role: 'system', content: 'You are an expert instructional designer. Generate a course outline based on the topic. Return a JSON object with: "title", "description", "level" ("Beginner", "Intermediate", "Advanced"), "duration_hours" (number), and "modules" (array of strings, each representing a module title).' },
       { role: 'user', content: `Topic: ${aiTopic}` }
     ];
     let response = await generateText(prompt);
     if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
     const jsonMatch = response.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
       const parsed = JSON.parse(jsonMatch[0]);
       const newCourseId = `crs_${Math.random().toString(36).substr(2, 9)}`;
       await powerSync.execute(
         `INSERT INTO online_courses (id, company_id, title, description, level, duration_hours, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [newCourseId, companyId, parsed.title, parsed.description, parsed.level, parsed.duration_hours, new Date().toISOString()]
       );
       
       for (let i = 0; i < parsed.modules.length; i++) {
         const modId = `les_${Math.random().toString(36).substr(2, 9)}`;
         await powerSync.execute(
           `INSERT INTO online_lessons (id, company_id, course_id, title, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
           [modId, companyId, newCourseId, parsed.modules[i], i, new Date().toISOString()]
         );
       }

       toast({ title: "Success", description: "Course structure generated!" });
       queryClient.invalidateQueries(["online_courses", companyId]);
       setIsAiModalOpen(false);
       setAiTopic('');
     } else {
       toast({ title: "Error", description: "Failed to parse AI response.", variant: "destructive" });
     }
   } catch (error) {
     console.error(error);
     toast({ title: "Error", description: "Failed to generate course.", variant: "destructive" });
   } finally {
     setIsGenerating(false);
   }
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Course Catalog</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage learning slates, update curriculum, and track course performance.</p>
 </div>
 <div className="flex gap-3">
 <button onClick={() => setIsAiModalOpen(true)} className="px-4 py-2 bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200 text-sm font-semibold rounded-md-[var(--radius-md)] hover:bg-fuchsia-100 transition-colors flex items-center gap-2">
 <Sparkles className="w-4 h-4" /> AI Generator
 </button>
 <button onClick={() => navigate('/o/builder')} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
 Create Course
 </button>
 </div>
 </div>

 <div className="flex items-center gap-4 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-4 ">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
 <input 
 type="text" 
 placeholder="Search catalog..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {isLoading ? (
 [1, 2, 3].map(i => (
 <div key={i} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden flex flex-col animate-pulse">
 <div className="aspect-video bg-[var(--color-surface-2)] w-full"></div>
 <div className="p-5 flex flex-col flex-1 gap-3">
 <div className="h-5 bg-[var(--color-surface-2)] rounded-md w-3/4"></div>
 <div className="h-4 bg-[var(--color-surface-2)] rounded-md w-full"></div>
 <div className="h-4 bg-[var(--color-surface-2)] rounded-md w-5/6 mb-4"></div>
 <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-primary/40">
 <div className="h-3 bg-[var(--color-surface-2)] rounded-md w-16"></div>
 <div className="h-3 bg-[var(--color-surface-2)] rounded-md w-20"></div>
 </div>
 </div>
 </div>
 ))
 ) : filteredCourses.length === 0 ? (
 <motion.div 
 initial={{ opacity: 0, y: 10}}
 animate={{ opacity: 1, y: 0}}
 className="col-span-full py-16 text-center border-2 border-dashed border-primary/40 rounded-md-[var(--radius-xl)] bg-[var(--color-surface-0)] glass-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30 text-[var(--primary)]" />
 <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-1">No courses found</h3>
 <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">Get started by creating your first online course.</p>
 </motion.div>
 ) : (
 <AnimatePresence>
 {filteredCourses.map((course, idx) => {
 return (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 exit={{ opacity: 0, scale: 0.95}}
 transition={{ duration: 0.2, delay: idx * 0.05}}
 key={course.id || idx} 
 className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden flex flex-col group hover:border-[var(--primary)] transition-all duration-300 glass-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="aspect-video bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-3)] relative flex items-center justify-center overflow-hidden">
 {course.thumbnail_url ? (
   <img src={course.thumbnail_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
 ) : null}
 <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/20 transition-colors z-10" />
 <PlayCircle className="w-12 h-12 text-[var(--primary)] opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 z-20 " />
 <div className="absolute top-3 right-3 px-2.5 py-1 bg-white dark:bg-card/40/90 dark:bg-black/50 backdrop-blur-sm border-[0.5px] border-black/9 dark:border-white/8 border-white/20 dark:border-white/10 text-[10px] font-semibold rounded-lg text-[var(--color-text-primary)] uppercase tracking-wider z-20 tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {course.level || 'Beginner'}
 </div>
 </div>
 <div className="p-5 flex flex-col flex-1">
 <h3 className="font-semibold text-[var(--text-lg)] text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">{course.title || 'Untitled Course'}</h3>
 <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1 leading-relaxed">
 {course.description || 'No description provided for this course module.'}
 </p>
 
 <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-text-secondary)] pt-4 border-t border-primary/40 tracking-[0.04em]">
 <div className="flex items-center gap-2.5 font-medium">
 <Clock className="w-4 h-4 text-[var(--color-text-tertiary)]" /> {course.duration_hours || 0} Hours
 </div>
 <div className="flex items-center gap-2.5 font-medium">
 <Users className="w-4 h-4 text-[var(--color-text-tertiary)]" /> {(course.total_students || 0).toLocaleString()} Enrolled
 </div>
 <div className="flex items-center gap-2.5 col-span-2 mt-1">
 <div className="flex items-center">
 {[1,2,3,4,5].map(star => (
 <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.floor(course.rating || 4) ? 'text-[var(--color-warning)] fill-[var(--color-warning)]' : 'text-[var(--color-border-strong)]'}`} />
 ))}
 </div>
 <span className="font-semibold text-[var(--color-text-primary)] ml-1">{course.rating || '4.8'}</span> 
 <span className="text-[var(--color-text-tertiary)]">({(course.total_reviews || 0).toLocaleString()} reviews)</span>
 </div>
 </div>
 </div>
 <div className="bg-[var(--color-surface-1)] border-t border-primary/40 px-5 py-3 group-hover:bg-[var(--primary)] transition-colors duration-300 flex items-center justify-between">
 <button onClick={() => navigate(`/o/builder/course/${course.id}`)} className="text-sm font-semibold text-[var(--primary)] group-hover:text-white flex items-center gap-2 transition-colors">
 Manage Course <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </button>
 <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(course.id);}} className="text-[var(--color-error)] opacity-0 group-hover:opacity-100 hover:text-white transition-all bg-white dark:bg-card/40/50 group-hover:bg-transparent rounded-lg p-1.5 backdrop-blur-sm  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" title="Delete Course">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </motion.div>
 );
 })}
 </AnimatePresence>
 )}
 </div>

 {/* AI Course Generator Modal */}
 <AnimatePresence>
 {isAiModalOpen && (
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
     <motion.div initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} exit={{ opacity: 0, scale: 0.95}} className="bg-card w-full max-w-md rounded-2xl flex flex-col overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
       <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-fuchsia-50/50">
         <h2 className="text-lg font-bold flex items-center gap-2 text-fuchsia-900"><Sparkles className="w-5 h-5 text-fuchsia-600" /> AI Course Generator</h2>
         <button onClick={() => setIsAiModalOpen(false)} className="text-[#71717a] dark:text-gray-400 hover:bg-muted p-1 rounded-full"><X className="w-5 h-5" /></button>
       </div>
       <div className="p-6 space-y-4">
         <div>
           <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2">What do you want to teach?</label>
           <textarea value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. A beginner's guide to growing organic tomatoes" className="w-full min-h-[100px] p-3 bg-background border border-primary/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 resize-none" />
         </div>
         <button onClick={handleAiGenerate} disabled={isGenerating || !aiTopic.trim()} className="w-full h-11 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
           {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Generate Course
         </button>
       </div>
     </motion.div>
   </div>
 )}
 </AnimatePresence>

 </div>
 );
}
