import React, { useState, useEffect} from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { PlusCircle, Save, Video, FileText, CheckSquare, Award, ArrowLeft, Trash2} from "lucide-react";
import { useToast} from "@/components/ui/use-toast";

export default function OnlineBuilder() {
 const { courseId} = useParams();
 const navigate = useNavigate();
 const companyId = useCompanyId();
 const { toast} = useToast();
 const queryClient = useQueryClient();

 const [activeTab, setActiveTab] = useState('curriculum');
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [price, setPrice] = useState('');

 const { data: courseData, isLoading} = useQuery({
 queryKey: ["case", courseId],
 queryFn: () => base44.entities.LegalCase.get(courseId),
 enabled: !!courseId && !!companyId
});

 useEffect(() => {
 if (courseData) {
 setTitle(courseData.title || '');
 let extra = {};
 try { extra = JSON.parse(courseData.notes || '{}');} catch(e) {}
 setDescription(extra.description || '');
 setPrice(extra.price || '');
}
}, [courseData]);

 const saveMutation = useMutation({
 mutationFn: async () => {
 const extra = { description, price};
 if (courseId) {
 return base44.entities.LegalCase.update(courseId, {
 title,
 notes: JSON.stringify(extra)
});
} else {
 return base44.entities.LegalCase.create({
 company_id: companyId,
 case_type: 'online_course',
 title,
 notes: JSON.stringify(extra),
 status: 'draft'
});
}
},
 onSuccess: (data) => {
 queryClient.invalidateQueries(["cases", companyId, "online_course"]);
 toast({ title: "Success", description: "Course saved successfully."});
 if (!courseId && data?.id) {
 navigate(`/o/builder/course/${data.id}`, { replace: true});
}
},
 onError: () => {
 toast({ variant: "destructive", title: "Error", description: "Failed to save course."});
}
});

 const deleteMutation = useMutation({
 mutationFn: () => base44.entities.LegalCase.delete(courseId),
 onSuccess: () => {
 queryClient.invalidateQueries(["cases", companyId, "online_course"]);
 toast({ title: "Success", description: "Course deleted successfully."});
 navigate('/o/courses', { replace: true});
},
 onError: () => {
 toast({ variant: "destructive", title: "Error", description: "Failed to delete course."});
}
});

 const handleDelete = () => {
 if(window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
 deleteMutation.mutate();
}
};

 const handleSave = () => {
 if (!title.trim()) {
 toast({ variant: "destructive", title: "Validation Error", description: "Course title is required."});
 return;
}
 saveMutation.mutate();
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
 <button className="px-4 py-2 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] text-sm font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
 Preview Course
 </button>
 <button onClick={handleSave} disabled={saveMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity disabled:opacity-50">
 <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save & Publish'}
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 <div className="lg:col-span-1 space-y-4">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-4">
 <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Add Content</h3>
 <div className="space-y-2">
 <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-md-[var(--radius-md)] transition-colors">
 <Video className="w-4 h-4" /> Video Lesson
 </button>
 <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-md-[var(--radius-md)] transition-colors">
 <FileText className="w-4 h-4" /> Reading Material
 </button>
 <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-md-[var(--radius-md)] transition-colors">
 <CheckSquare className="w-4 h-4" /> Quiz / Assessment
 </button>
 <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-md-[var(--radius-md)] transition-colors">
 <Award className="w-4 h-4" /> Certificate
 </button>
 </div>
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
 <div className="text-center py-12 border-2 border-dashed border-primary/40 rounded-md-[var(--radius-lg)] text-[var(--color-text-secondary)] text-sm">
 <p className="mb-4">No slates created yet.</p>
 <button className="px-4 py-2 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
 Create First Module
 </button>
 </div>
 ) : (
 <div className="text-center py-12 border-2 border-dashed border-primary/40 rounded-md-[var(--radius-lg)] text-[var(--color-text-secondary)] text-sm">
 Please save the course first to start adding modules.
 </div>
 )}

 <button className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-primary/40 rounded-md-[var(--radius-lg)] text-[var(--color-text-secondary)] font-medium hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--color-surface-1)] transition-colors">
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
 <button onClick={handleDelete} disabled={deleteMutation.isPending} className="px-4 py-2 bg-[var(--color-error-subtle)] text-[var(--color-error)] text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
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
 </div>
 );
}
