import React, { useState, useEffect} from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from "@/hooks/useCompanyId";
import { ArrowLeft, Save, Video, FileText, UploadCloud, Settings, MonitorPlay} from 'lucide-react';
import { useToast} from "@/components/ui/use-toast";

export default function LessonBuilder() {
 const { courseId, moduleId} = useParams();
 const navigate = useNavigate();
 const companyId = useCompanyId();
 const queryClient = useQueryClient();
 const { toast} = useToast();

 const [lessonTitle, setLessonTitle] = useState('');
 const [lessonType, setLessonType] = useState('video');
 const [textContent, setTextContent] = useState('');

 const { data: lessonData } = useQuery({
   queryKey: ["online_lesson", moduleId],
   queryFn: async () => {
     if (!moduleId) return null;
     const rows = await powerSync.getAll(`SELECT * FROM online_lessons WHERE id = ?`, [moduleId]);
     return rows?.[0] || null;
   },
   enabled: !!moduleId
 });

 useEffect(() => {
   if (lessonData) {
     setLessonTitle(lessonData.title || '');
     setTextContent(lessonData.content || '');
   }
 }, [lessonData]);

 const saveMutation = useMutation({
   mutationFn: async () => {
     if (moduleId) {
       await powerSync.execute(
         `UPDATE online_lessons SET title = ?, content = ?, updated_at = ? WHERE id = ?`,
         [lessonTitle, textContent, new Date().toISOString(), moduleId]
       );
     } else {
       const newId = `les_${Math.random().toString(36).substr(2, 9)}`;
       await powerSync.execute(
         `INSERT INTO online_lessons (id, company_id, course_id, title, content, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
         [newId, companyId, courseId, lessonTitle, textContent, new Date().toISOString()]
       );
     }
   },
   onSuccess: () => {
     queryClient.invalidateQueries(["online_lessons", courseId]);
     toast({ title: "Success", description: "Lesson saved successfully!"});
     navigate(`/o/builder/course/${courseId}`);
   },
   onError: () => {
     toast({ variant: "destructive", title: "Error", description: "Failed to save lesson."});
   }
 });

 const handleSave = () => {
 if (!lessonTitle.trim()) {
 toast({ variant: "destructive", title: "Error", description: "Lesson title is required."});
 return;
 }
 saveMutation.mutate();
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
 <div className="flex items-center gap-4 pb-4 border-b border-primary/40">
 <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-2)] rounded-md-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors">
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <h1 className="font-display font-semibold text-[var(--text-2xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">
 {moduleId ? 'Edit Lesson' : 'Create New Lesson'}
 </h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Configure your lesson content and media.</p>
 </div>
 <div className="ml-auto flex gap-3">
 <button onClick={handleSave} disabled={saveMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity disabled:opacity-50">
 <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Lesson'}
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Lesson Title</label>
 <input 
 type="text" 
 value={lessonTitle}
 onChange={(e) => setLessonTitle(e.target.value)}
 placeholder="e.g., Introduction to the Platform" 
 className="w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
 <div className="flex border-b border-primary/40 bg-[var(--color-surface-1)] p-2 gap-2">
 <button 
 onClick={() => setLessonType('video')}
 className={`flex-1 py-2 px-4 text-sm font-medium rounded-md-[var(--radius-md)] flex justify-center items-center gap-2 transition-colors ${lessonType === 'video' ? 'bg-[var(--color-surface-0)] text-[var(--primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
 >
 <Video className="w-4 h-4" /> Video Content
 </button>
 <button 
 onClick={() => setLessonType('text')}
 className={`flex-1 py-2 px-4 text-sm font-medium rounded-md-[var(--radius-md)] flex justify-center items-center gap-2 transition-colors ${lessonType === 'text' ? 'bg-[var(--color-surface-0)] text-[var(--primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
 >
 <FileText className="w-4 h-4" /> Text Content
 </button>
 </div>

 <div className="p-6">
 {lessonType === 'video' ? (
 <div className="border-2 border-dashed border-primary/40 rounded-md-[var(--radius-lg)] p-12 flex flex-col items-center justify-center text-center hover:border-[var(--primary)] transition-colors cursor-pointer bg-[var(--color-surface-1)]">
 <div className="w-16 h-16 bg-[var(--color-surface-0)] rounded-full flex items-center justify-center mb-4 ">
 <UploadCloud className="w-8 h-8 text-[var(--primary)]" />
 </div>
 <h3 className="font-semibold text-[var(--color-text-primary)]">Upload Video</h3>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1 max-w-sm">
 Drag and drop your MP4 file here, or click to browse. Max file size: 2GB.
 </p>
 </div>
 ) : (
 <div className="space-y-2">
 <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Article Body</label>
 <textarea 
 value={textContent}
 onChange={(e) => setTextContent(e.target.value)}
 rows={12}
 className="w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 placeholder="Write your lesson content here..."
 />
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-5">
 <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-4">
 <Settings className="w-4 h-4 text-[var(--color-text-tertiary)]" /> Lesson Settings
 </h3>
 
 <div className="space-y-4">
 <div>
 <label className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
 <span>Is this a free preview?</span>
 <input type="checkbox" className="rounded-md text-[var(--primary)] focus:ring-[var(--primary)]" />
 </label>
 </div>
 <div className="pt-4 border-t border-primary/40">
 <label className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
 <span>Enable Discussions</span>
 <input type="checkbox" defaultChecked className="rounded-md text-[var(--primary)] focus:ring-[var(--primary)]" />
 </label>
 </div>
 </div>
 </div>

 <div className="bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-5 flex items-start gap-4">
 <MonitorPlay className="w-8 h-8 text-[var(--primary)] flex-shrink-0 mt-1" />
 <div>
 <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Preview Layout</h4>
 <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed tracking-[0.04em]">
 Save your lesson to preview how it will look in the Learning Player for your students.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
