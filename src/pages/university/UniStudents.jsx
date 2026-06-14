import React, { useState} from 'react';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Users, Search, Filter, GraduationCap, Calendar, FileText, CheckCircle2, AlertCircle, Plus, ChevronRight} from 'lucide-react';
import OrbitTable from '@/components/university/OrbitTable';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

function cn(...classes) {
 return classes.filter(Boolean).join(' ');
}

export default function UniStudents() {
 const companyId = useCompanyId();
 const queryClient = useQueryClient();
 const [activeTab, setActiveTab] = useState('directory');
 const [selectedStudent, setSelectedStudent] = useState(null);
 
 const [formData, setFormData] = useState({ name: '', email: '', major: 'Computer Science', year: 'Freshman', gpa: '3.80'});

 const { data: records = [], refetch} = useQuery({ 
 queryKey: ["clients", companyId, "uni_student"], 
 queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student'}), 
 enabled: !!companyId 
});

 const createStudentMutation = useMutation({
 mutationFn: (newStudent) => base44.entities.Client.create(newStudent),
 onSuccess: () => {
 queryClient.invalidateQueries(["clients", companyId, "uni_student"]);
 refetch();
 setActiveTab('directory');
 setFormData({ name: '', email: '', major: 'Computer Science', year: 'Freshman', gpa: '3.80'});
}
});

 const students = records.map(r => {
 let extra = {};
 try { extra = JSON.parse(r.extra_data || '{}');} catch(e) {}
 return {
 id: r.id,
 name: r.name || 'Unnamed Student',
 email: r.email || extra.email || 'No email',
 studentId: extra.studentId || `UID${r.id.substring(0, 5).toUpperCase()}`,
 major: extra.major || 'Computer Science',
 year: extra.year || 'Senior',
 gpa: extra.gpa || '3.50',
 status: extra.status || 'Active'
};
});

 const handleCreateStudent = (e) => {
 e.preventDefault();
 if (!formData.name) return;
 createStudentMutation.mutate({
 company_id: companyId,
 name: formData.name,
 email: formData.email,
 type: 'uni_student',
 extra_data: JSON.stringify({
 studentId: `UID${Math.floor(Math.random() * 90000) + 10000}`,
 major: formData.major,
 year: formData.year,
 gpa: formData.gpa,
 status: 'Active'
})
});
};

 const directoryColumns = [
 { 
 id: 'student', 
 header: 'Student', 
 render: (_, row) => (
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-[var(--color-surface-4)] text-[var(--color-text-secondary)] flex items-center justify-center text-xs font-semibold">
 {row.name?.substring(0, 2).toUpperCase() || 'UN'}
 </div>
 <div>
 <div className="font-medium text-[var(--color-text-primary)]">{row.name}</div>
 <div className="text-[11px] text-[var(--color-text-tertiary)]">{row.studentId}</div>
 </div>
 </div>
 ) 
},
 { 
 id: 'program', 
 header: 'Program', 
 render: (_, row) => (
 <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-[var(--text-sm)]">
 <GraduationCap className="w-4 h-4" /> {row.major}
 </div>
 )
},
 { 
 id: 'year', 
 header: 'Year', 
 render: (_, row) => (
 <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-[var(--text-sm)]">
 <Calendar className="w-4 h-4" /> {row.year}
 </div>
 )
},
 { 
 id: 'gpa', 
 header: 'CGPA', 
 render: (_, row) => <span className="font-mono font-bold text-[var(--color-text-primary)]">{row.gpa}</span>
},
 { 
 id: 'status', 
 header: 'Status', 
 render: (_, row) => <OrbitStatusBadge status={row.status} /> 
}
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* Slate Header */}
 <div className="flex items-end justify-between border-b border-[var(--color-border-subtle)] pb-4">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Student Population</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage enrollments, academic standing, and student records.</p>
 </div>
 
 <div className="flex items-center bg-[var(--color-surface-2)] p-1 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]">
 {[
 { id: 'directory', label: 'Directory'},
 { id: 'standing', label: 'Academic Standing'},
 { id: 'add', label: 'Enroll New'}
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => { setActiveTab(tab.id); setSelectedStudent(null);}}
 className={cn(
 "px-4 py-1.5 text-[var(--text-sm)] font-medium rounded-[var(--radius-md)] transition-all",
 activeTab === tab.id 
 ? "bg-[var(--color-surface-0)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]" 
 : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent"
 )}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 <div className="min-h-[500px]">
 {activeTab === 'directory' && !selectedStudent && (
 <div className="bg-[var(--color-surface-0)] rounded-[var(--radius-xl)] ">
 {students.length > 0 ? (
 <OrbitTable 
 columns={directoryColumns}
 data={students}
 showToolbar={true}
 onRowClick={(row) => setSelectedStudent(row)}
 />
 ) : (
 <OrbitEmptyState 
 title="No students found"
 description="The directory is currently empty. Begin by enrolling a new student into a program."
 actionLabel="Enroll Student"
 onAction={() => setActiveTab('add')}
 icon={Users}
 moduleColor="var(--primary)"
 />
 )}
 </div>
 )}

 {activeTab === 'directory' && selectedStudent && (
 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden ">
 <div className="bg-[var(--color-surface-2)] p-6 md:p-8 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
 <div className="flex items-center gap-6">
 <div className="w-20 h-20 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-display text-[var(--text-3xl)] -glow-sm -[var(--primary)]">
 {selectedStudent.name?.substring(0, 2).toUpperCase()}
 </div>
 <div>
 <h2 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">{selectedStudent.name}</h2>
 <div className="flex items-center gap-3 mt-1.5 text-[var(--color-text-secondary)] font-mono text-[var(--text-sm)]">
 <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {selectedStudent.studentId}</span>
 <span className="w-1 h-1 rounded-full bg-[var(--color-border-strong)]" />
 <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {selectedStudent.major}</span>
 </div>
 </div>
 </div>
 <button 
 onClick={() => setSelectedStudent(null)}
 className="px-4 py-2 bg-[var(--color-surface-0)] border border-[var(--color-border-default)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] text-[var(--text-sm)] font-medium rounded-[var(--radius-md)] transition-colors"
 >
 Back to Directory
 </button>
 </div>
 
 <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-[var(--color-surface-1)]">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-6">
 <h3 className="font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
 <Calendar className="w-4 h-4 text-[var(--primary)]" /> Academic History & Transcript
 </h3>
 
 <div className="relative border-l border-[var(--color-border-strong)] ml-3 space-y-8 pb-4">
 <div className="relative pl-6">
 <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--primary)] -glow-sm -[var(--primary)]" />
 <h4 className="font-medium text-[var(--color-text-primary)]">Fall Semester 2025 <span className="ml-2 font-mono text-[var(--color-text-tertiary)] text-xs">Current</span></h4>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">CS-302: HCI (Grade: A) · CS-401: Distributed Systems (Grade: A-)</p>
 </div>
 <div className="relative pl-6">
 <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-border-strong)]" />
 <h4 className="font-medium text-[var(--color-text-primary)]">Spring Semester 2025</h4>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">MATH-202: Linear Algebra (Grade: B+) · ENG-102: Rhetoric (Grade: A)</p>
 </div>
 </div>
 </div>
 </div>
 
 <div className="space-y-6">
 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-6">
 <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Current Standing</h3>
 <div className="space-y-4">
 <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-subtle)]">
 <span className="text-[var(--color-text-secondary)] text-[var(--text-sm)]">Year</span>
 <span className="font-medium text-[var(--color-text-primary)]">{selectedStudent.year}</span>
 </div>
 <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-subtle)]">
 <span className="text-[var(--color-text-secondary)] text-[var(--text-sm)]">CGPA</span>
 <span className="font-mono font-bold text-[var(--color-text-primary)]">{selectedStudent.gpa}</span>
 </div>
 <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-subtle)]">
 <span className="text-[var(--color-text-secondary)] text-[var(--text-sm)]">Status</span>
 <OrbitStatusBadge status={selectedStudent.status} />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'standing' && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-[var(--color-success-subtle)] border border-[var(--color-success)] rounded-[var(--radius-xl)] p-8">
 <div className="flex items-center gap-3 mb-4">
 <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
 <h3 className="font-display text-[var(--text-xl)] text-[var(--color-success)] font-semibold tracking-tight">Dean's Honor Roll</h3>
 </div>
 <p className="text-[var(--color-text-primary)] mb-6">Students with CGPA &gt; 3.80 are eligible for academic honors and scholarship endowments.</p>
 <div className="space-y-2">
 {students.filter(s => parseFloat(s.gpa) >= 3.8).map(s => (
 <div key={s.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/40/50 backdrop-blur rounded-[var(--radius-md)]">
 <span className="font-medium">{s.name}</span>
 <span className="font-mono font-bold text-[var(--color-success)]">{s.gpa}</span>
 </div>
 ))}
 </div>
 </div>
 
 <div className="bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] rounded-[var(--radius-xl)] p-8">
 <div className="flex items-center gap-3 mb-4">
 <AlertCircle className="w-6 h-6 text-[var(--color-danger)]" />
 <h3 className="font-display text-[var(--text-xl)] text-[var(--color-danger)] font-semibold tracking-tight">Academic Probation</h3>
 </div>
 <p className="text-[var(--color-text-primary)] mb-6">Students with CGPA &lt; 2.50 requiring advisory sessions and enrollment locks.</p>
 <div className="space-y-2">
 {students.filter(s => parseFloat(s.gpa) < 2.5).length === 0 ? (
 <div className="p-3 text-[var(--color-text-secondary)] text-sm italic">No students currently on probation.</div>
 ) : (
 students.filter(s => parseFloat(s.gpa) < 2.5).map(s => (
 <div key={s.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/40/50 backdrop-blur rounded-[var(--radius-md)]">
 <span className="font-medium">{s.name}</span>
 <span className="font-mono font-bold text-[var(--color-danger)]">{s.gpa}</span>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'add' && (
 <div className="max-w-2xl mx-auto bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-8 ">
 <div className="mb-8">
 <h2 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight text-[var(--color-text-primary)]">Enroll New Undergraduate</h2>
 <p className="text-[var(--color-text-secondary)] mt-2">Register a fresh student profile with institutional metadata into the system.</p>
 </div>
 
 <form onSubmit={handleCreateStudent} className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">Full Name</label>
 <input 
 type="text"
 value={formData.name} 
 onChange={e => setFormData({ ...formData, name: e.target.value})} 
 placeholder="e.g. Marie Curie" 
 className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 required
 />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">Institutional Email</label>
 <input 
 type="email"
 value={formData.email} 
 onChange={e => setFormData({ ...formData, email: e.target.value})} 
 placeholder="e.g. mcurie@university.edu" 
 className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">Intended Major</label>
 <select 
 value={formData.major} 
 onChange={e => setFormData({ ...formData, major: e.target.value})}
 className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 >
 <option value="Computer Science">Computer Science</option>
 <option value="Software Engineering">Software Engineering</option>
 <option value="Electrical Engineering">Electrical Engineering</option>
 <option value="Physics">Physics</option>
 <option value="Finance & Economics">Finance & Economics</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">Academic Year</label>
 <select 
 value={formData.year} 
 onChange={e => setFormData({ ...formData, year: e.target.value})}
 className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 >
 <option value="Freshman">Freshman</option>
 <option value="Sophomore">Sophomore</option>
 <option value="Junior">Junior</option>
 <option value="Senior">Senior</option>
 </select>
 </div>
 </div>
 
 <div className="pt-4 border-t border-[var(--color-border-subtle)] flex justify-end">
 <button 
 type="submit" 
 disabled={createStudentMutation.isPending}
 className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-[var(--radius-md)] font-medium transition-all disabled:opacity-50"
 >
 <Plus className="w-4 h-4" />
 {createStudentMutation.isPending ? 'Saving...' : 'Enroll Student'}
 </button>
 </div>
 </form>
 </div>
 )}
 </div>
 </div>
 );
}
