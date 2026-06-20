import React, { useState} from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { useCompanyId} from "@/hooks/useCompanyId";
import { GraduationCap, Eye, Calendar, CalendarCheck} from 'lucide-react';
import OrbitTable from '@/components/university/OrbitTable';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

function cn(...classes) { return classes.filter(Boolean).join(' ');}

export default function UniAdmissions() {
 const companyId = useCompanyId();
 const queryClient = useQueryClient();
 const [activeTab, setActiveTab] = useState('directory');
 const [selectedApplicant, setSelectedApplicant] = useState(null);
 const [formData, setFormData] = useState({ name: '', email: '', major: 'Computer Science', gpa: '3.90', statement: ''});

 const { data: applicants = [], refetch} = useQuery({ 
 queryKey: ["clients", companyId, "uni_admission"], 
 queryFn: () => powerSync.execute('SELECT * FROM uni_applicants WHERE company_id = ?', [companyId]).then(r => r.rows._array), 
 enabled: !!companyId 
});

 const createApplicantMutation = useMutation({
 mutationFn: async (newApplicant) => {
    return powerSync.execute(
      `INSERT INTO uni_applicants (id, company_id, first_name, last_name, email, applied_program_id, previous_gpa, status, application_date, created_at)
       VALUES (uuid(), ?, ?, ?, ?, null, ?, 'pending', datetime('now'), datetime('now'))`,
      [newApplicant.company_id, newApplicant.first_name, newApplicant.last_name, newApplicant.email, newApplicant.gpa]
    );
  },
 onSuccess: () => {
 queryClient.invalidateQueries(["uni_applicants", companyId]);
 refetch();
 setActiveTab('directory');
 setFormData({ name: '', email: '', major: 'Computer Science', gpa: '3.90', statement: ''});
}
});

 const updateApplicantStatusMutation = useMutation({
 mutationFn: async ({ id, status }) => {
 const app = applicants.find(a => a.id === id);
 if (!app) return;
 await powerSync.execute('UPDATE uni_applicants SET status = ? WHERE id = ?', [status.toLowerCase(), id]);
 
 if (status === 'Admitted') {
   await powerSync.execute(
     `INSERT INTO uni_students (id, company_id, first_name, last_name, email, student_id_number, enrollment_year, current_semester, status, created_at)
      VALUES (uuid(), ?, ?, ?, ?, ?, ?, 1, 'active', datetime('now'))`,
     [companyId, app.first_name, app.last_name, app.email, `UID${Math.floor(Math.random() * 90000) + 10000}`, new Date().getFullYear()]
   );
 }
},
 onSuccess: () => {
 queryClient.invalidateQueries(["uni_applicants", companyId]);
 queryClient.invalidateQueries(["clients", companyId, "uni_student"]);
 setSelectedApplicant(null);
}
});

 const parsedApplicants = applicants.map(a => ({
 id: a.id,
 name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Unnamed Applicant',
 email: a.email || 'No email',
 major: 'Computer Science', // program_id
 date: a.application_date || new Date().toISOString().split('T')[0],
 gpa: a.previous_gpa ? a.previous_gpa.toFixed(2) : '3.80',
 statement: 'No statement submitted.', // Can add to schema if needed
 status: a.status || 'pending'
}));

 const handleCreateApplicant = (e) => {
 e.preventDefault();
 if (!formData.name) return;
 const parts = formData.name.split(' ');
 createApplicantMutation.mutate({
 company_id: companyId,
 first_name: parts[0] || 'Unknown',
 last_name: parts.slice(1).join(' ') || 'Unknown',
 email: formData.email,
 gpa: parseFloat(formData.gpa) || 0.0
});
};

 const columns = [
 { id: 'name', header: 'Candidate Name', render: (_, r) => <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-semibold text-xs tracking-[0.04em]">{r.name?.substring(0,2).toUpperCase()}</div><span className="font-semibold text-[var(--color-text-primary)]">{r.name}</span></div>},
 { id: 'email', header: 'Contact', render: (_, r) => <span className="text-[var(--color-text-secondary)]">{r.email}</span>},
 { id: 'major', header: 'Intended Major', render: (_, r) => <span className="inline-flex items-center px-2 py-1 rounded-md-[var(--radius-sm)] text-[11px] font-medium bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">{r.major}</span>},
 { id: 'gpa', header: 'Entrance GPA', render: (_, r) => <span className="font-mono font-semibold text-[var(--color-text-primary)]">{r.gpa}</span>},
 { id: 'status', header: 'Status', render: (_, r) => <OrbitStatusBadge status={r.status} />},
 { id: 'actions', header: 'Actions', align: 'right', render: (_, r) => <button onClick={(e) => { e.stopPropagation(); setSelectedApplicant(r);}} className="px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-primary)] hover:bg-[var(--color-surface-3)] rounded-md-[var(--radius-md)] transition-colors flex items-center gap-2 tracking-[0.04em]"><Eye className="w-4 h-4"/> Review</button>}
 ];

 const inputClass = "w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body";

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-end justify-between border-b border-primary/40 pb-4">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Admissions & Intake Board</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Process freshman candidate profiles, review personal statements, and extend academic offers.</p>
 </div>
 <div className="flex items-center bg-[var(--color-surface-2)] p-1 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 {[{ id: 'directory', label: 'Applicants Directory'}, { id: 'interviews', label: 'Interview Schedules'}, { id: 'add', label: 'Log Candidate'}].map(tab => (
 <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedApplicant(null);}} className={cn("px-4 py-1.5 text-[var(--text-sm)] font-medium rounded-md-[var(--radius-md)] transition-all", activeTab === tab.id ? "bg-[var(--color-surface-0)] text-[var(--color-text-primary)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[0.5px] border-black/9 dark:border-white/8 border-transparent")}>{tab.label}</button>
 ))}
 </div>
 </div>

 <div className="min-h-[400px]">
 {activeTab === 'directory' && !selectedApplicant && (
 <div className="space-y-6">
 {parsedApplicants.length > 0 ? (
 <OrbitTable columns={columns} data={parsedApplicants} title="All Applicants" showToolbar={true} onRowClick={(r) => setSelectedApplicant(r)} />
 ) : (
 <OrbitEmptyState icon={GraduationCap} title="No applicant profiles logged" description="Use the 'Log Candidate' tab to add applicant records." moduleColor="var(--primary)" actionLabel="Add Applicant" onAction={() => setActiveTab('add')} />
 )}
 </div>
 )}

 {activeTab === 'directory' && selectedApplicant && (
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
 <div className="bg-[var(--color-surface-2)] p-6 border-b border-primary/40 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-md-[var(--radius-lg)] bg-[var(--primary)] text-white flex items-center justify-center font-display text-[var(--text-2xl)] -glow-sm -[var(--primary)] tracking-[-0.02em]">
 {selectedApplicant.name?.substring(0, 2).toUpperCase()}
 </div>
 <div>
 <h2 className="font-display font-semibold text-[var(--text-2xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">{selectedApplicant.name}</h2>
 <div className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1 flex items-center gap-3">
 <span>Major: {selectedApplicant.major}</span>
 <span className="w-1 h-1 rounded-full bg-[var(--color-border-strong)]" />
 <span>Entry GPA: <span className="font-mono font-semibold text-[var(--color-text-primary)]">{selectedApplicant.gpa}</span></span>
 <span className="w-1 h-1 rounded-full bg-[var(--color-border-strong)]" />
 <OrbitStatusBadge status={selectedApplicant.status} />
 </div>
 </div>
 </div>
 <button onClick={() => setSelectedApplicant(null)} className="px-4 py-2 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] text-[var(--text-sm)] font-medium rounded-md-[var(--radius-md)] transition-colors">Close Profile</button>
 </div>
 
 <div className="p-6 space-y-6">
 <div>
 <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Personal Statement / Essay</h4>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-md-[var(--radius-lg)] leading-relaxed mt-2">{selectedApplicant.statement}</p>
 </div>
 
 <div className="flex gap-3 pt-4 border-t border-primary/40">
 <button onClick={() => updateApplicantStatusMutation.mutate({ id: selectedApplicant.id, status: 'Admitted'})} className="px-6 py-2.5 bg-[var(--color-success)] hover:opacity-90 text-white font-medium rounded-md-[var(--radius-md)] transition-all">Admit Candidate</button>
 <button onClick={() => updateApplicantStatusMutation.mutate({ id: selectedApplicant.id, status: 'Rejected'})} className="px-6 py-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] font-medium rounded-md-[var(--radius-md)] transition-all">Reject Application</button>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'interviews' && (
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 ">
 <h2 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2.5 mb-1"><Calendar className="w-4 h-4 text-[var(--primary)]" /> Interview Matrix</h2>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Scheduled entrance evaluation sessions.</p>
 
 <div className="p-4 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-lg)] flex items-start gap-4">
 <CalendarCheck className="w-8 h-8 text-[var(--primary)] shrink-0" />
 <div>
 <p className="font-semibold text-[var(--color-text-primary)] text-sm">Interviews scheduled for tomorrow</p>
 <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mt-1 tracking-[0.04em]">Dr. Alan Turing with candidate John Doe regarding Computer Science admission offer.</p>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'add' && (
 <div className="max-w-xl mx-auto bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 ">
 <h2 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight text-[var(--color-text-primary)] mb-6 tracking-[-0.02em]">Log Candidate Application</h2>
 <form onSubmit={handleCreateApplicant} className="space-y-6">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Applicant Name</label>
 <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value})} placeholder="e.g. Rosalind Franklin" className={inputClass} required />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Contact Email</label>
 <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value})} placeholder="e.g. rfranklin@gmail.com" className={inputClass} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Intended Major</label>
 <select value={formData.major} onChange={e => setFormData({ ...formData, major: e.target.value})} className={inputClass}>
 <option value="Computer Science">Computer Science</option><option value="Software Engineering">Software Engineering</option><option value="Applied Physics">Applied Physics</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">High School GPA</label>
 <input type="number" step="0.01" value={formData.gpa} onChange={e => setFormData({ ...formData, gpa: e.target.value})} className={inputClass} />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Personal Statement</label>
 <textarea value={formData.statement} onChange={e => setFormData({ ...formData, statement: e.target.value})} rows={4} placeholder="Explain your academic pursuits..." className={cn(inputClass, "min-h-[100px]")} />
 </div>
 <button type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-md-[var(--radius-md)] transition-all">Submit Application</button>
 </form>
 </div>
 )}
 </div>
 </div>
 );
}
