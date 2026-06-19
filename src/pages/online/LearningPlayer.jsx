import React, { useState, useEffect} from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId} from "@/hooks/useCompanyId";
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, PlayCircle, CheckCircle2, ChevronDown, MessageSquare, BookOpen, FileText, Check} from 'lucide-react';
import { motion} from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";

export default function LearningPlayer() {
 const { courseId} = useParams();
 const navigate = useNavigate();
 const companyId = useCompanyId();
 const { user } = useAuth();
 const queryClient = useQueryClient();
 const { toast } = useToast();
 const [activeTab, setActiveTab] = useState('overview');
 const [activeLessonId, setActiveLessonId] = useState(null);

 const studentId = user?.id || 'unknown';

 const { data: course} = useQuery({
 queryKey: ["online_course", courseId],
 queryFn: async () => {
   const { data } = await powerSync.execute(`SELECT * FROM online_courses WHERE id = ?`, [courseId]);
   return data?.[0] || null;
 },
 enabled: !!courseId && !!companyId
 });

 const { data: lessons = []} = useQuery({
   queryKey: ["online_lessons", courseId],
   queryFn: async () => {
     const { data } = await powerSync.execute(`SELECT * FROM online_lessons WHERE course_id = ? ORDER BY order_index ASC`, [courseId]);
     return data || [];
   },
   enabled: !!courseId
 });

 const { data: enrollment } = useQuery({
   queryKey: ["online_enrollment", courseId, studentId],
   queryFn: async () => {
     let { data } = await powerSync.execute(`SELECT * FROM online_enrollments WHERE course_id = ? AND student_id = ?`, [courseId, studentId]);
     if (!data || data.length === 0) {
       // Auto-enroll if not enrolled
       const newId = `enr_${Math.random().toString(36).substr(2, 9)}`;
       await powerSync.execute(
         `INSERT INTO online_enrollments (id, company_id, course_id, student_id, student_name, student_email, enrollment_date, progress_percent, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [newId, companyId, courseId, studentId, user?.user_metadata?.full_name || 'Student', user?.email || '', new Date().toISOString(), '0', 'in_progress', new Date().toISOString()]
       );
       data = [{ id: newId, progress_percent: '0', status: 'in_progress' }];
     }
     return data[0];
   },
   enabled: !!courseId && !!studentId
 });

 useEffect(() => {
   if (lessons.length > 0 && !activeLessonId) {
     setActiveLessonId(lessons[0].id);
   }
 }, [lessons]);

 const completeCourseMutation = useMutation({
   mutationFn: async () => {
     if (enrollment?.status === 'completed') return;
     
     await powerSync.execute(
       `UPDATE online_enrollments SET progress_percent = ?, status = ?, last_accessed = ? WHERE id = ?`,
       ['100', 'completed', new Date().toISOString(), enrollment?.id]
     );

     const notifId = `ntf_${Math.random().toString(36).substr(2, 9)}`;
     await powerSync.execute(
       `INSERT INTO univ_notifications (id, company_id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
       [notifId, companyId, studentId, 'Course Completed!', `Congratulations on completing ${course?.title || 'the course'}!`, 'learning', '0', new Date().toISOString()]
     );
   },
   onSuccess: () => {
     queryClient.invalidateQueries(["online_enrollment", courseId, studentId]);
     toast({ title: "Course Completed!", description: "Check your notifications for your certificate." });
   }
 });

 const courseTitle = course?.title || 'Loading Course...';
 const activeLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];

 return (
 <div className="flex flex-col h-[calc(100vh-4rem)] animate-in fade-in duration-500 bg-[var(--color-surface-0)]">
 {/* Header */}
 <div className="h-14 flex items-center px-4 border-b border-primary/40 bg-[var(--color-surface-1)] flex-shrink-0">
 <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-2)] rounded-md-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors mr-3">
 <ArrowLeft className="w-5 h-5" />
 </button>
 <h1 className="font-display font-semibold text-[var(--color-text-primary)] truncate pr-4 border-r border-primary/40">
 {courseTitle}
 </h1>
 <div className="ml-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
 {activeLesson?.title || ''}
 </div>
 </div>

 {/* Main Content */}
 <div className="flex flex-1 overflow-hidden">
 
 {/* Player Area */}
 <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--color-surface-0)] relative">
 
 {/* Video Placeholder */}
 <motion.div 
 initial={{ opacity: 0, y: -20}}
 animate={{ opacity: 1, y: 0}}
 className="w-full aspect-video bg-primary/20 relative flex items-center justify-center flex-shrink-0 group overflow-hidden"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-transparent opacity-50" />
 <PlayCircle className="w-24 h-24 text-white/80 group-hover:text-[var(--primary)] group-hover:scale-110 transition-all duration-300 cursor-pointer z-10" />
 <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end px-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
 <div className="flex items-center gap-3 mb-2 text-white/90 text-sm font-medium">
 <PlayCircle className="w-4 h-4 text-[var(--primary)]" />
 <span>{activeLesson?.title || courseTitle}</span>
 </div>
 <div className="w-full h-1.5 bg-white dark:bg-slate-900/40/30 rounded-full overflow-hidden cursor-pointer group/progress hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="h-full bg-[var(--primary)] w-0 relative group-hover/progress:bg-primary/70 transition-colors" style={{width: enrollment?.progress_percent + '%'}}>
 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900/40 rounded-full scale-0 group-hover/progress:scale-100 transition-transform hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 </div>
 </motion.div>

 {/* Content Below Video */}
 <motion.div 
 initial={{ opacity: 0}}
 animate={{ opacity: 1}}
 transition={{ delay: 0.2}}
 className="p-8 max-w-5xl mx-auto w-full relative z-10"
 >
 <div className="flex justify-between items-center border-b border-primary/40 pb-0">
 <div className="flex items-center gap-6">
 <button onClick={() => setActiveTab('overview')} className={`px-2 py-4 font-semibold text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === 'overview' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
 Overview
 </button>
 <button onClick={() => setActiveTab('qna')} className={`px-2 py-4 font-semibold text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === 'qna' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
 Q&A
 </button>
 <button onClick={() => setActiveTab('resources')} className={`px-2 py-4 font-semibold text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === 'resources' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
 Resources
 </button>
 </div>
 <button 
   onClick={() => completeCourseMutation.mutate()} 
   disabled={completeCourseMutation.isPending || enrollment?.status === 'completed'}
   className="px-4 py-1.5 bg-green-500 text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-green-600 disabled:opacity-50 transition-colors"
 >
   <Check className="w-4 h-4" /> {enrollment?.status === 'completed' ? 'Completed' : 'Mark as Complete'}
 </button>
 </div>

 <div className="py-8">
 {activeTab === 'overview' && (
 <motion.div initial={{ opacity: 0, y: 10}} animate={{ opacity: 1, y: 0}} className="prose prose-sm max-w-none text-[var(--color-text-secondary)] leading-relaxed">
 <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 font-display">About this lesson</h2>
 <p>{activeLesson?.content || course?.description || 'No description provided.'}</p>
 </motion.div>
 )}
 {activeTab === 'qna' && (
 <motion.div initial={{ opacity: 0, y: 10}} animate={{ opacity: 1, y: 0}} className="space-y-4">
 <div className="flex gap-4 p-1 bg-[var(--color-surface-1)] rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)] transition-all">
 <input type="text" placeholder="Ask a new question..." className="bg-transparent border-none outline-none w-full text-sm text-[var(--color-text-primary)] px-4 py-2" />
 <button className="bg-[var(--primary)] text-white rounded-full p-2.5 hover:opacity-90 transition-opacity">
 <MessageSquare className="w-4 h-4" />
 </button>
 </div>
 <p className="text-sm text-[var(--color-text-tertiary)] text-center py-12">No questions asked yet. Be the first!</p>
 </motion.div>
 )}
 {activeTab === 'resources' && (
 <motion.div initial={{ opacity: 0, y: 10}} animate={{ opacity: 1, y: 0}} className="space-y-3">
 <p className="text-sm text-[var(--color-text-secondary)] text-center py-12 border-2 border-dashed border-primary/40 rounded-md-[var(--radius-lg)]">No resources available for this slate yet.</p>
 </motion.div>
 )}
 </div>
 </motion.div>
 </div>

 {/* Sidebar Curriculum */}
 <div className="w-80 border-l border-primary/40 bg-[var(--color-surface-1)] flex flex-col flex-shrink-0">
 <div className="p-4 border-b border-primary/40">
 <h2 className="font-semibold text-[var(--color-text-primary)]">Course Content</h2>
 <div className="w-full bg-[var(--color-border-default)] h-1.5 rounded-full mt-3 overflow-hidden">
 <div className="bg-[var(--primary)] h-full transition-all" style={{width: enrollment?.progress_percent + '%'}}></div>
 </div>
 <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 tracking-[0.04em]">{enrollment?.progress_percent || '0'}% Complete</p>
 </div>
 
 <div className="flex-1 overflow-y-auto p-4 space-y-1">
 {lessons.length === 0 ? (
 <div className="text-center py-8">
 <BookOpen className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-2 opacity-50" />
 <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">No lessons found for this course.</p>
 </div>
 ) : (
   lessons.map((lesson, idx) => (
     <button 
       key={lesson.id} 
       onClick={() => setActiveLessonId(lesson.id)}
       className={`w-full text-left p-3 rounded-md flex items-start gap-3 transition-colors ${activeLessonId === lesson.id ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'}`}
     >
       <div className={`mt-0.5 rounded-full p-1 border ${activeLessonId === lesson.id ? 'border-white/30 text-white' : 'border-primary/20 text-[var(--color-text-secondary)]'}`}>
         {enrollment?.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
       </div>
       <div>
         <p className="text-sm font-semibold leading-tight">{idx + 1}. {lesson.title}</p>
         <p className={`text-xs mt-1 ${activeLessonId === lesson.id ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'}`}>Video</p>
       </div>
     </button>
   ))
 )}
 </div>
 </div>

 </div>
 </div>
 );
}
