import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PlusCircle, Save, Video, FileText, CheckSquare, Award, ArrowLeft, Trash2, Lock, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import LessonEditorDialog from "@/components/online/LessonEditorDialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/lib/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { generateText } from '@/lib/cloudflareAI';
import { Bot, Sparkles, Loader2 } from 'lucide-react';

export default function OnlineBuilder() {
 const { courseId } = useParams();
 const navigate = useNavigate();
 const companyId = useCompanyId();
 const { toast } = useToast();
 const queryClient = useQueryClient();

 const { user } = useAuth();
 const { data: subData } = useSubscription();
 const plan = subData?.subscription_plan || 'starter';
 const isProOrAbove = ['super_admin', 'admin'].includes(user?.role) || plan === 'pro' || plan === 'enterprise';

 const [activeTab, setActiveTab] = useState('curriculum');
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [price, setPrice] = useState('');

 // Lesson Editor States
 const [isEditorOpen, setIsEditorOpen] = useState(false);
 const [editingLesson, setEditingLesson] = useState(null);
 const [lessonType, setLessonType] = useState('video');
 const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

 const { data: courseData, isLoading } = useQuery({
   queryKey: ["online_course", courseId],
   queryFn: async () => {
     if (!courseId) return null;
     const { data } = await powerSync.execute(`SELECT * FROM online_courses WHERE id = ?`, [courseId]);
     return data?.[0] || null;
   },
   enabled: !!courseId && !!companyId
 });

 const { data: totalCourses } = useQuery({
   queryKey: ["online_courses_count", companyId],
   queryFn: async () => {
     const { data } = await powerSync.execute(`SELECT count(*) as count FROM online_courses WHERE company_id = ?`, [companyId]);
     return data?.[0]?.count || 0;
   },
   enabled: !!companyId
 });

 const { data: lessons = [] } = useQuery({
   queryKey: ["online_lessons", courseId],
   queryFn: async () => {
     if (!courseId) return [];
     const { data } = await powerSync.execute(`SELECT * FROM online_lessons WHERE course_id = ? ORDER BY order_index ASC`, [courseId]);
     return data || [];
   },
   enabled: !!courseId
 });

 useEffect(() => {
   if (courseData) {
     setTitle(courseData.title || '');
     setDescription(courseData.description || '');
     setPrice(courseData.price || '');
   }
 }, [courseData]);

 const saveMutation = useMutation({
   mutationFn: async () => {
     if (courseId) {
       await powerSync.execute(
         `UPDATE online_courses SET title = ?, description = ?, price = ?, updated_at = ? WHERE id = ?`,
         [title, description, price, new Date().toISOString(), courseId]
       );
       return { id: courseId };
     } else {
       if (!isProOrAbove && totalCourses >= 1) {
         throw new Error("PAYWALL");
       }
       const newId = `crs_${Math.random().toString(36).substr(2, 9)}`;
       await powerSync.execute(
         `INSERT INTO online_courses (id, company_id, title, description, price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [newId, companyId, title, description, price, 'draft', new Date().toISOString()]
       );
       return { id: newId };
     }
   },
   onSuccess: (data) => {
     queryClient.invalidateQueries(["online_courses", companyId]);
     toast({ title: "Success", description: "Course saved successfully." });
     if (!courseId && data?.id) {
       navigate(`/o/builder/course/${data.id}`, { replace: true });
     }
   },
   onError: (err) => {
     if (err.message === "PAYWALL") {
       toast({ variant: "destructive", title: "Pro Plan Required", description: "Free tier is limited to 1 course. Please upgrade." });
     } else {
       toast({ variant: "destructive", title: "Error", description: "Failed to save course." });
     }
   }
 });

 const deleteMutation = useMutation({
   mutationFn: async () => {
     await powerSync.execute(`DELETE FROM online_courses WHERE id = ?`, [courseId]);
   },
   onSuccess: () => {
     queryClient.invalidateQueries(["online_courses", companyId]);
     toast({ title: "Success", description: "Course deleted successfully." });
     navigate('/o/courses', { replace: true });
   },
   onError: () => {
     toast({ variant: "destructive", title: "Error", description: "Failed to delete course." });
   }
 });

 const handleDeleteCourse = () => {
   if(window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
     deleteMutation.mutate();
   }
 };

 const handleDeleteLesson = (lessonId, e) => {
   e.stopPropagation();
   if(window.confirm("Are you sure you want to delete this module?")) {
     powerSync.execute(`DELETE FROM online_lessons WHERE id = ?`, [lessonId])
       .then(() => {
         queryClient.invalidateQueries(["online_lessons", courseId]);
         toast({ title: "Module Deleted" });
       });
   }
 };

 const reorderMutation = useMutation({
   mutationFn: async (reorderedLessons) => {
     for (let i = 0; i < reorderedLessons.length; i++) {
       await powerSync.execute(
         `UPDATE online_lessons SET order_index = ? WHERE id = ?`,
         [i, reorderedLessons[i].id]
       );
     }
   },
   onSuccess: () => {
     queryClient.invalidateQueries(["online_lessons", courseId]);
   }
 });

 const onDragEnd = (result) => {
   if (!result.destination) return;
   
   const items = Array.from(lessons);
   const [reorderedItem] = items.splice(result.source.index, 1);
   items.splice(result.destination.index, 0, reorderedItem);
   
   queryClient.setQueryData(["online_lessons", courseId], items);
   reorderMutation.mutate(items);
 };

 const openEditor = (type, lesson = null) => {
   setLessonType(type);
   setEditingLesson(lesson);
   setIsEditorOpen(true);
 };

 const handleSave = () => {
   if (!title.trim()) {
     toast({ variant: "destructive", title: "Validation Error", description: "Course title is required." });
     return;
   }
   saveMutation.mutate();
 };

 const handleGenerateOutline = async () => {
   if (!title.trim() && !description.trim()) {
     toast({ title: "Topic Required", description: "Please enter a course title or description first so AI knows what to generate.", variant: "destructive" });
     return;
   }
   setIsGeneratingOutline(true);
   toast({ title: "Generating Curriculum...", description: "AI is drafting a course structure..." });
   
   try {
     const prompt = `Generate a 5-module course curriculum for a course titled "${title}" with description: "${description}". For each module, only provide the title separated by a newline. Do not include module numbers or descriptions. Just 5 line-separated titles.`;
     const response = await generateText([{ role: 'user', content: prompt }]);
     
     const modules = response.split('\n').map(m => m.replace(/^(?:Module|Lesson)\s*\d*[:.-]?\s*/i, '').trim()).filter(Boolean);
     
     for (let i = 0; i < modules.length; i++) {
       const newId = `lsn_${Math.random().toString(36).substr(2, 9)}`;
       await powerSync.execute(
         `INSERT INTO online_lessons (id, course_id, company_id, title, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
         [newId, courseId, companyId, modules[i], i, new Date().toISOString()]
       );
     }
     
     queryClient.invalidateQueries(["online_lessons", courseId]);
     toast({ title: "Success", description: "AI generated curriculum structure successfully!" });
   } catch (error) {
     toast({ title: "Generation Failed", description: "Failed to generate outline.", variant: "destructive" });
   } finally {
     setIsGeneratingOutline(false);
   }
 };

 const navClass = (tab) => `h-full px-6 border-b-2 font-medium transition-colors ${activeTab === tab ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`;

 return (
   <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
     <div className="flex items-center gap-4 mb-2">
       <button onClick={() => navigate('/o/courses')} className="p-2 hover:bg-[var(--color-surface-2)] rounded-md-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors">
         <ArrowLeft className="w-5 h-5" />
       </button>
       <div>
         <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Course Builder</h1>
         <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Design your curriculum and configure settings.</p>
       </div>
       <div className="ml-auto flex gap-3">
         {!isProOrAbove && !courseId && totalCourses >= 1 && (
           <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-200 text-xs font-semibold">
             <Lock className="w-3.5 h-3.5" /> 1 Course Limit Reached
           </div>
         )}
         <button className="px-4 py-2 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] text-sm font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
           Preview Course
         </button>
         <button onClick={handleSave} disabled={saveMutation.isPending || (!isProOrAbove && !courseId && totalCourses >= 1)} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity disabled:opacity-50">
           <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save & Publish'}
         </button>
       </div>
     </div>
      
     {!isProOrAbove && (
       <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
         <Lock className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
         <div>
           <h4 className="font-semibold text-sm">Free Plan Limit Active</h4>
           <p className="text-sm mt-1 opacity-90">You can only create 1 published course on the free plan. Upgrade to Pro for unlimited courses.</p>
         </div>
       </div>
     )}

     <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
       <div className="lg:col-span-1 space-y-4">
         <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-4">
           <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Add Content</h3>
           <div className="space-y-2">
             <button onClick={() => openEditor('video')} disabled={!courseId} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-md-[var(--radius-md)] transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
               <Video className="w-4 h-4" /> Video Lesson
             </button>
             <button onClick={() => openEditor('reading')} disabled={!courseId} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-md-[var(--radius-md)] transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
               <FileText className="w-4 h-4" /> Reading Material
             </button>
             <button onClick={() => openEditor('quiz')} disabled={!courseId} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-md-[var(--radius-md)] transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
               <CheckSquare className="w-4 h-4" /> Quiz / Assessment
             </button>
             <button onClick={() => openEditor('certificate')} disabled={!courseId} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-md-[var(--radius-md)] transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
               <Award className="w-4 h-4" /> Certificate
             </button>
           </div>
         </div>
         
         <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 border-[0.5px] border-indigo-200/60 rounded-md-[var(--radius-xl)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
           <div className="flex items-center gap-2 mb-3 text-indigo-900">
             <Sparkles className="w-4 h-4" />
             <h3 className="font-semibold text-sm">AI Course Builder</h3>
           </div>
           <p className="text-xs text-indigo-700/80 mb-4 leading-relaxed">Let AI automatically generate a comprehensive curriculum outline based on your course title.</p>
           <button onClick={handleGenerateOutline} disabled={!courseId || isGeneratingOutline} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-indigo-700 text-sm font-medium rounded-md-[var(--radius-md)] border border-indigo-200/60 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
             {isGeneratingOutline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
             {isGeneratingOutline ? "Generating..." : "Generate Outline"}
           </button>
         </div>
       </div>

       <div className="lg:col-span-3">
         <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
           <div className="p-6 border-b border-primary/40">
             <input 
               type="text" 
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Enter Course Title..." 
               className="w-full text-[var(--text-2xl)] font-semibold font-display text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] bg-transparent border-0 border-b border-transparent hover:border-primary/40 focus:border-[var(--primary)] focus:ring-0 px-0 transition-colors tracking-[-0.02em]" 
             />
           </div>
           
           <div className="flex border-b border-primary/40 h-12 bg-[var(--color-surface-1)] px-2">
             <button onClick={() => setActiveTab('curriculum')} className={navClass('curriculum')}>Curriculum</button>
             <button onClick={() => setActiveTab('settings')} className={navClass('settings')}>Settings</button>
             <button onClick={() => setActiveTab('pricing')} className={navClass('pricing')}>Pricing</button>
           </div>
           
           <div className="p-6">
             {activeTab === 'curriculum' && (
               <div className="space-y-6">
                 {courseId ? (
                   lessons.length === 0 ? (
                     <div className="text-center py-12 border-2 border-dashed border-primary/40 rounded-md-[var(--radius-lg)] text-[var(--color-text-secondary)] text-sm">
                       <p className="mb-4">No modules created yet.</p>
                       <button onClick={() => openEditor('video')} className="px-4 py-2 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
                         Create First Module
                       </button>
                     </div>
                   ) : (
                     <DragDropContext onDragEnd={onDragEnd}>
                       <Droppable droppableId="curriculum">
                         {(provided) => (
                           <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                             {lessons.map((lesson, index) => (
                               <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                                 {(provided, snapshot) => (
                                   <div 
                                     ref={provided.innerRef}
                                     {...provided.draggableProps}
                                     className={`p-4 bg-muted/30 border-[0.5px] border-primary/40 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-muted/50 transition-all ${snapshot.isDragging ? 'shadow-lg ring-1 ring-primary/50' : ''}`}
                                     onClick={() => openEditor('video', lesson)}
                                   >
                                     <div className="flex items-center gap-3">
                                       <div {...provided.dragHandleProps} className="text-slate-400 hover:text-primary cursor-grab active:cursor-grabbing p-1 -ml-2">
                                         <GripVertical className="w-4 h-4" />
                                       </div>
                                       {lesson.video_url ? <Video className="w-5 h-5 text-[var(--primary)]" /> : 
                                        lesson.title?.toLowerCase().includes('quiz') ? <CheckSquare className="w-5 h-5 text-[var(--primary)]" /> : 
                                        lesson.title?.toLowerCase().includes('cert') ? <Award className="w-5 h-5 text-[var(--primary)]" /> :
                                        <FileText className="w-5 h-5 text-[var(--primary)]" />}
                                       <div>
                                         <span className="font-semibold text-sm block text-slate-900">{lesson.title}</span>
                                         {lesson.duration_minutes && <span className="text-xs text-slate-500">{lesson.duration_minutes} min</span>}
                                       </div>
                                     </div>
                                     <button onClick={(e) => handleDeleteLesson(lesson.id, e)} className="text-[#71717a] dark:text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50">
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   </div>
                                 )}
                               </Draggable>
                             ))}
                             {provided.placeholder}
                           </div>
                         )}
                       </Droppable>
                     </DragDropContext>
                   )
                 ) : (
                   <div className="text-center py-12 border-2 border-dashed border-primary/40 rounded-md-[var(--radius-lg)] text-[var(--color-text-secondary)] text-sm">
                     Please save the course first to start adding modules.
                   </div>
                 )}

                 <button onClick={() => openEditor('video')} disabled={!courseId} className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-primary/40 rounded-md-[var(--radius-lg)] text-[var(--color-text-secondary)] font-medium hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--color-surface-1)] transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-secondary)] disabled:hover:border-primary/40">
                   <PlusCircle className="w-5 h-5" /> Add New Module
                 </button>
               </div>
             )}

             {activeTab === 'settings' && (
               <div className="space-y-4 max-w-2xl">
                 <div>
                   <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Course Description</label>
                   <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     rows={5}
                     className="w-full bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                     placeholder="Brief overview of what students will learn..."
                   />
                 </div>
                 {courseId && (
                   <div className="pt-6 mt-6 border-t border-primary/40">
                     <h4 className="text-[var(--color-error)] font-semibold mb-2">Danger Zone</h4>
                     <p className="text-xs text-[var(--color-text-secondary)] mb-4 tracking-[0.04em]">Deleting this course will permanently remove it and all associated content. This action cannot be undone.</p>
                     <button onClick={handleDeleteCourse} disabled={deleteMutation.isPending} className="px-4 py-2 bg-[var(--color-error-subtle)] text-[var(--color-error)] text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
                       {deleteMutation.isPending ? 'Deleting...' : 'Delete Course'}
                     </button>
                   </div>
                 )}
               </div>
             )}

             {activeTab === 'pricing' && (
               <div className="space-y-4 max-w-sm">
                 <div>
                   <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Price (USD)</label>
                   <input 
                     type="number" 
                     value={price}
                     onChange={(e) => setPrice(e.target.value)}
                     placeholder="0.00"
                     className="w-full bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                   />
                   <p className="text-xs text-[var(--color-text-tertiary)] mt-1 tracking-[0.04em]">Leave at 0 to make this course free.</p>
                 </div>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>

     {isEditorOpen && (
       <LessonEditorDialog 
         open={isEditorOpen}
         onOpenChange={setIsEditorOpen}
         courseId={courseId}
         companyId={companyId}
         initialLesson={editingLesson}
         type={lessonType}
         orderIndex={lessons.length}
       />
     )}
   </div>
 );
}
