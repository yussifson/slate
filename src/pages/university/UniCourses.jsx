import React, { useState} from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { useCompanyId} from "@/hooks/useCompanyId";
import { BookOpen, Plus} from 'lucide-react';
import OrbitTable from '@/components/university/OrbitTable';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';
import { useToast} from "@/components/ui/use-toast";

function cn(...classes) {
 return classes.filter(Boolean).join(' ');
}

export default function UniCourses() {
 const companyId = useCompanyId();
 const queryClient = useQueryClient();
 const { toast} = useToast();
 
 const [activeTab, setActiveTab] = useState('directory');
 const [formData, setFormData] = useState({
 name: '', code: '', lecturer: '', credits: '4',
 schedule: 'Mon/Wed 10:00 - 11:30 AM', term: 'Fall 2026',
 department: 'Department of Software Engineering', prerequisite: ''
});

 const { data: records = [], refetch} = useQuery({ 
 queryKey: ["cases", companyId, "uni_course"], 
 queryFn: () => powerSync.execute('SELECT * FROM uni_courses WHERE company_id = ?', [companyId]).then(r => r.rows._array), 
 enabled: !!companyId 
});
 
 const courses = records.map(r => ({
 id: r.id,
 name: r.name || 'Untitled Course',
 code: r.code || `CS-${Math.floor(Math.random() * 800) + 101}`,
 teacher: 'Unassigned', // instructor_id maps to staff
 students: r.enrolled_count || 0,
 credits: parseInt(r.credits || '4'),
 schedule: 'MWF 10:00 AM', // can add to schema later
 term: r.semester || 'Fall 2026',
 status: 'active',
 department: 'General',
 prerequisite: ''
}));

 const createCourseMutation = useMutation({
 mutationFn: async (newCourse) => {
    return powerSync.execute(
      `INSERT INTO uni_courses (id, company_id, name, code, credits, semester, capacity, enrolled_count, created_at)
       VALUES (uuid(), ?, ?, ?, ?, ?, 50, 0, datetime('now'))`,
      [newCourse.company_id, newCourse.name, newCourse.code, newCourse.credits, newCourse.term]
    );
  },
 onSuccess: () => {
 queryClient.invalidateQueries(["uni_courses", companyId]);
 refetch();
 setActiveTab('directory');
 toast({ title: "Course Created", description: "Academic course logged in the system."});
 setFormData({ name: '', code: '', lecturer: '', credits: '4', schedule: 'Mon/Wed 10:00 - 11:30 AM', term: 'Fall 2026', department: 'Department of Software Engineering', prerequisite: ''});
}
});

 const handleSubmit = (e) => {
 e.preventDefault();
 if (!formData.name || !formData.code || !formData.lecturer) {
 toast({ title: "Validation Error", description: "Please fill out all mandatory fields.", variant: "destructive"});
 return;
}
 createCourseMutation.mutate({
 company_id: companyId,
 name: formData.name,
 code: formData.code,
 credits: parseInt(formData.credits),
 term: formData.term
});
};

 const columns = [
 { id: 'code', header: 'Code', render: (_, row) => <span className="font-mono font-semibold text-[var(--color-accent-primary)]">{row.code}</span>},
 { id: 'name', header: 'Course Name', render: (_, row) => <span className="font-medium text-[var(--color-text-primary)]">{row.name}</span>},
 { id: 'teacher', header: 'Instructor', render: (_, row) => <span className="text-[var(--color-text-secondary)]">{row.teacher}</span>},
 { id: 'credits', header: 'Credits', render: (_, row) => <span className="font-mono font-semibold">{row.credits}</span>},
 { id: 'schedule', header: 'Schedule', render: (_, row) => <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{row.schedule}</span>},
 { id: 'status', header: 'Status', render: (_, row) => <OrbitStatusBadge status={row.status} />}
 ];

 const inputClass = "w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body";

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-end justify-between border-b border-primary/40 pb-4">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Course Catalog</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage academic courses, credit hours, prerequisites, and faculty assignments.</p>
 </div>
 <div className="flex items-center bg-[var(--color-surface-2)] p-1 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 {[{ id: 'directory', label: 'Catalog'}, { id: 'add', label: 'Add Course'}].map(tab => (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)}
 className={cn("px-4 py-1.5 text-[var(--text-sm)] font-medium rounded-md-[var(--radius-md)] transition-all",
 activeTab === tab.id ? "bg-[var(--color-surface-0)] text-[var(--color-text-primary)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[0.5px] border-black/9 dark:border-white/8 border-transparent"
 )}>{tab.label}</button>
 ))}
 </div>
 </div>

 <div className="min-h-[500px]">
 {activeTab === 'directory' && (
 courses.length > 0 ? (
 <OrbitTable columns={columns} data={courses} showToolbar={true} />
 ) : (
 <OrbitEmptyState title="No courses in catalog" description="Start by adding academic courses to the university catalog." actionLabel="Add Course" onAction={() => setActiveTab('add')} icon={BookOpen} moduleColor="var(--primary)" />
 )
 )}

 {activeTab === 'add' && (
 <div className="max-w-2xl mx-auto bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 ">
 <div className="mb-8">
 <h2 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight text-[var(--color-text-primary)] tracking-[-0.02em]">Create Academic Course</h2>
 <p className="text-[var(--color-text-secondary)] mt-2">Input curricular information, credit values, prerequisites, and lecturer details.</p>
 </div>
 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Course Code *</label>
 <input placeholder="e.g. CS-301" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value})} className={inputClass} required />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Course Name *</label>
 <input placeholder="e.g. Advanced Software Architectures" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value})} className={inputClass} required />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Lecturer *</label>
 <input placeholder="e.g. Dr. Alan Turing" value={formData.lecturer} onChange={e => setFormData({ ...formData, lecturer: e.target.value})} className={inputClass} required />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Credits</label>
 <select value={formData.credits} onChange={e => setFormData({ ...formData, credits: e.target.value})} className={inputClass}>
 {[1,2,3,4,5].map(c => <option key={c} value={c}>{c} Credit{c > 1 ? 's' : ''}</option>)}
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Schedule</label>
 <input placeholder="e.g. Mon/Wed 10:00 - 11:30 AM" value={formData.schedule} onChange={e => setFormData({ ...formData, schedule: e.target.value})} className={inputClass} />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Term</label>
 <input placeholder="e.g. Fall 2026" value={formData.term} onChange={e => setFormData({ ...formData, term: e.target.value})} className={inputClass} />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Department</label>
 <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value})} className={inputClass}>
 <option value="Department of Software Engineering">Software Engineering</option>
 <option value="Department of Applied Economics">Applied Economics</option>
 <option value="Department of Physics & Astronomy">Physics & Astronomy</option>
 <option value="Department of Mathematics">Mathematics</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Prerequisite</label>
 <select value={formData.prerequisite} onChange={e => setFormData({ ...formData, prerequisite: e.target.value})} className={inputClass}>
 <option value="">-- None --</option>
 {courses.map(c => <option key={c.id} value={c.code}>{c.code} - {c.name}</option>)}
 </select>
 </div>
 </div>
 <div className="pt-4 border-t border-primary/40 flex justify-end gap-3">
 <button type="button" onClick={() => setActiveTab('directory')} className="px-5 py-2 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] rounded-md-[var(--radius-md)] font-medium hover:bg-[var(--color-surface-3)] transition-colors">Cancel</button>
 <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-md-[var(--radius-md)] font-medium transition-all ">
 <Plus className="w-4 h-4" /> Create Course
 </button>
 </div>
 </form>
 </div>
 )}
 </div>
 </div>
 );
}
