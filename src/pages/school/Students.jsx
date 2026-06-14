import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Users, Search, Plus, GraduationCap, Phone, Mail, Filter, MoreVertical, CheckCircle, XCircle, Clock, UserCheck, AlertCircle} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { ViewModeToggle, StudentGridCard, ModuleBanner} from '@/components/school/SchoolViewKit';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useAuth} from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { registerSchoolUser} from "@/api/authUtils";
import { toast} from 'react-hot-toast';
import { useNotifications} from "@/hooks/integrations/useNotifications";
import { useCompanyId} from "@/hooks/useCompanyId";
import { MessageSquare, Settings} from "lucide-react";
import IDFormatSettings from '@/components/school/IDFormatSettings';

const feeColors = { Paid: 'bg-slate-100 text-primary/90', Owing: 'bg-red-100 text-red-700', Partial: 'bg-amber-100 text-amber-700'};
const statusColors = { Active: 'bg-slate-50 dark:bg-slate-800/50 text-primary dark:bg-primary/30 dark:text-primary/30', Suspended: 'bg-red-100 text-red-700', Graduated: 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/30 text-primary dark:text-primary/30'};

export default function Students() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { notifyTeam} = useNotifications();
 const { user} = useAuth();
 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('All');
 const [filterClass, setFilterClass] = useState('All');
 const [showModal, setShowModal] = useState(false);
 const [showSettings, setShowSettings] = useState(false);
 const [viewMode, setViewMode] = useState('grid');
 const [activeTab, setActiveTab] = useState('personal');

 // Real Database Hooks
 const queryClient = useQueryClient();
 const { data: records = [], isLoading} = useQuery({ 
 queryKey: ["clients", companyId, "student"], 
 queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student'}), 
 enabled: !!companyId 
});
 
 const mutateStudent = useMutation({
 mutationFn: (data) => data.id ? base44.entities.Client.update(data.id, data) : base44.entities.Client.create(data),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId]})
});

 const deleteStudent = useMutation({
 mutationFn: (id) => base44.entities.Client.delete(id),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId]})
});

 const { data: schoolSettings} = useQuery({
 queryKey: ['school_settings', companyId],
 queryFn: async () => {
 const records = await base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'school_settings'});
 let data = { studentPrefix: 'STU', studentIncludeYear: true};
 if (records.length > 0 && records[0].notes) {
 try { data = typeof records[0].notes === 'string' ? JSON.parse(records[0].notes) : records[0].notes;} catch(e) {}
}
 return data;
},
 enabled: !!companyId
});

 // Form State
 const [formData, setFormData] = useState({ 
 firstName: '', lastName: '', email: '', dateOfBirth: '', gender: 'Female', class: 'Grade 7B', 
 parentName: '', parentPhone: '', parentEmail: '', address: '', medicalNotes: '', previousSchool: '', studentId: '', parentId: '', defaultPassword: '', parentPassword: '',
 emergencyContactName: '', emergencyContactPhone: '', transferStatus: 'No', alumniStatus: 'Active'
});
 const [editingId, setEditingId] = useState(null);
 const [viewDetails, setViewDetails] = useState(null);

 // Map DB records to UI format
 const students = records.map(r => {
 let extra = {};
 try { extra = JSON.parse(r.notes || '{}');} catch(e) {}
 return {
 id: r.id,
 name: r.name,
 studentId: r.id_number,
 phone: r.phone,
 status: r.status || 'Active',
 class: extra.class || 'Unknown',
 age: extra.age || 0,
 gender: extra.gender || 'Unknown',
 parent: extra.parent || '',
 feeStatus: extra.feeStatus || 'Unknown',
 avatar: extra.avatar || r.name?.substring(0,2).toUpperCase()
};
});

 const classes = ['All', 'Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'];

 const filtered = students.filter(s =>
 (statusFilter === 'All' || s.status === statusFilter) &&
 (s.name?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.includes(search))
 );

 const [isEnrolling, setIsEnrolling] = useState(false);

 const handleEnroll = async () => {
 if (!companyId) return toast.error("Workspace not loaded. Refresh the page and try again.");
 const fullName = formData.firstName ? `${formData.firstName} ${formData.lastName}`.trim() : formData.name;
 if (!fullName) return toast.error("Please enter student name");
 
 setIsEnrolling(true);

 try {
 const prefix = schoolSettings?.studentPrefix || 'STU';
 const yearStr = schoolSettings?.studentIncludeYear ? `${new Date().getFullYear()}-` : '';
 const seq = Math.floor(1000 + Math.random() * 9000);
 
 // Auto-generate Parent ID
 const parentPrefix = schoolSettings?.parentPrefix || 'PAR';
 
 if (!formData.firstName || !formData.lastName || !formData.parentName || !formData.defaultPassword || !formData.parentPassword || !formData.email || !formData.parentEmail) {
 toast.error(t("please_fill_required_fields", "Please fill all required fields, including Student Email, Parent Email, and their Passwords."));
 return;
}

 const studentId = formData.studentId || `${prefix}-${yearStr}${seq}`;
 const parentId = formData.parentId || `${parentPrefix}-${yearStr}${seq}`;
 
 const studentEmail = formData.email.trim().toLowerCase();
 const parentEmail = formData.parentEmail.trim().toLowerCase();
 const defaultPassword = formData.defaultPassword;
 const parentPassword = formData.parentPassword;
 
 const age = formData.dateOfBirth ? new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear() : formData.age || 0;

 if (!editingId) {
 // Only generate auth accounts on initial creation
 const { error: stuAuthErr} = await registerSchoolUser(studentEmail, defaultPassword, 'student', companyId, fullName);
 if (stuAuthErr) {
 if (stuAuthErr.message?.includes('already registered')) {
 throw new Error(`Student Email (${studentEmail}) is already registered! Please use a unique email or their password will not be updated.`);
}
 throw new Error(`Student Auth Error: ${stuAuthErr.message}`);
}
 
 const parentFullName = formData.parentName || `Parent of ${fullName}`;
 const { error: parAuthErr} = await registerSchoolUser(parentEmail, parentPassword, 'parent', companyId, parentFullName);
 if (parAuthErr) {
 if (parAuthErr.message?.includes('already registered')) {
 throw new Error(`Parent Email (${parentEmail}) is already registered! Please use a unique email or their password will not be updated.`);
}
 throw new Error(`Parent Auth Error: ${parAuthErr.message}`);
}
}
 
 const studentPayload = {
 company_id: companyId,
 type: 'student',
 name: fullName,
 id_number: studentId,
 phone: formData.parentPhone,
 status: formData.status || 'active',
 notes: JSON.stringify({
 class: formData.class,
 age,
 gender: formData.gender,
 parent: formData.parentName,
 parentEmail: parentEmail,
 parentId: parentId,
 address: formData.address,
 medicalNotes: formData.medicalNotes,
 previousSchool: formData.previousSchool,
 emergencyContactName: formData.emergencyContactName,
 emergencyContactPhone: formData.emergencyContactPhone,
 transferStatus: formData.transferStatus,
 alumniStatus: formData.alumniStatus,
 feeStatus: formData.feeStatus || 'Owing',
 avatar: fullName.substring(0,2).toUpperCase()
})
};

 const parentPayload = {
 company_id: companyId,
 type: 'parent',
 name: formData.parentName || `Parent of ${fullName}`,
 id_number: parentId,
 phone: formData.parentPhone,
 status: 'active',
 notes: JSON.stringify({
 email: parentEmail,
 address: formData.address,
 linkedStudentId: studentId,
 avatar: formData.parentName ? formData.parentName.substring(0,2).toUpperCase() : 'PA'
})
};

 if (editingId) {
 await base44.entities.Client.update(editingId, studentPayload);
 toast.success("Student updated successfully!");
} else {
 // Create both records
 await Promise.all([
 base44.entities.Client.create(studentPayload),
 base44.entities.Client.create(parentPayload)
 ]);
 toast.success(`Student & Parent enrolled successfully! IDs: ${studentId} & ${parentId}.`);
}

 queryClient.invalidateQueries({ queryKey: ["clients", companyId]});
 setShowModal(false);
 setEditingId(null);
 setFormData({ firstName: '', lastName: '', email: '', dateOfBirth: '', gender: 'Female', class: 'Grade 7B', parentName: '', parentPhone: '', parentEmail: '', address: '', medicalNotes: '', previousSchool: '', studentId: '', parentId: '', defaultPassword: '', parentPassword: '', emergencyContactName: '', emergencyContactPhone: '', transferStatus: 'No', alumniStatus: 'Active'});
 setActiveTab('personal');
} catch (err) {
 toast.error(err?.message || "Failed to save records");
} finally {
 setIsEnrolling(false);
}
};

 const handleDelete = (id) => {
 if (window.confirm("Are you sure you want to delete this student?")) {
 deleteStudent.mutate(id);
}
};

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <ModuleBanner
 title={t("students_directory", "Students Directory")}
 subtitle={t("manage_student_records", "Manage student records, enrollments, and academic status")}
 metrics={[
 { title: "Total Students", value: students.length, icon: Users},
 { title: "Active", value: students.filter(s => s.status === 'Active').length, icon: UserCheck},
 { title: "Graduated", value: students.filter(s => s.status === 'Graduated').length, icon: GraduationCap},
 { title: "Suspended", value: students.filter(s => s.status === 'Suspended').length, icon: AlertCircle}
 ]}
 />
 
 {showSettings && <IDFormatSettings />}

 {/* Search and Filter */}
 <div className="school-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
 <div className="relative flex-1 w-full max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search by name, ID, or class..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
 </div>
 <div className="flex items-center gap-3 w-full md:w-auto">
 <div className="flex bg-muted p-1 rounded-lg">
 {['All', 'Active', 'Suspended', 'Graduated'].map(s => (
 <button
 key={s}
 onClick={() => setStatusFilter(s)}
 className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${statusFilter === s ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
 >
 {s}
 </button>
 ))}
 </div>
 <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
 <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold">
 <Plus className="w-4 h-4" /> {t("add_student", "Add Student")}
 </Button>
 </div>
 </div>

 {/* Student Table */}
 <div className="school-card overflow-hidden">
 {filtered.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
 <p>{t("no_students_found", "No students found")}</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-muted/20">
 {filtered.map(s => (
 <StudentGridCard
 key={s.id}
 student={s}
 onView={() => window.location.href = `/students/${s.id}`}
 onEdit={() => {
 setEditingId(s.id);
 setFormData({ 
 ...s, 
 firstName: s.name?.split(' ')[0] || '', 
 lastName: s.name?.split(' ').slice(1).join(' ') || '',
 email: s.email || '',
 parentName: s.parent || '',
 parentPhone: s.phone || '',
 parentEmail: s.parentEmail || '',
 address: s.address || '',
 medicalNotes: s.medicalNotes || '',
 previousSchool: s.previousSchool || '',
 dateOfBirth: s.dateOfBirth || '',
 emergencyContactName: s.emergencyContactName || '',
 emergencyContactPhone: s.emergencyContactPhone || '',
 transferStatus: s.transferStatus || 'No',
 alumniStatus: s.alumniStatus || 'Active',
});
 setShowModal(true);
}}
 onDelete={() => handleDelete(s.id)}
 />
 ))}
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-primary/40 dark:border-primary/40">
 <tr>
 {['Student', 'ID', 'Class', 'Age', 'Parent / Guardian', 'Fee Status', 'Status', 'Actions'].map(h => {
 return (<th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>);
})}
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(s => {
 return (
 <tr key={s.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-primary/30 font-bold text-xs flex-shrink-0">
 {s.avatar}
 </div>
 <div>
 <p className="font-semibold text-card-foreground">{s.name}</p>
 <p className="text-xs text-muted-foreground">{s.gender}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.studentId}</td>
 <td className="px-4 py-3"><Link to={`/classes`} className="bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 text-primary dark:text-primary/30 text-xs font-semibold px-2 py-1 rounded-md hover:underline">{s.class}</Link></td>
 <td className="px-4 py-3 text-foreground">{s.age} {t("yrs", "yrs")}</td>
 <td className="px-4 py-3">
 <div>
 <p className="text-foreground font-medium">{s.parent}</p>
 <p className="text-xs text-muted-foreground">{s.phone}</p>
 </div>
 </td>
 <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feeColors[s.feeStatus] || 'bg-gray-100 text-gray-700'}`}>{s.feeStatus}</span></td>
 <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[s.status] || 'bg-slate-50 dark:bg-slate-800/50 text-primary dark:bg-primary/30 dark:text-primary/30'}`}>{s.status}</span></td>
 <td className="px-4 py-3">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4 text-muted-foreground" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-40">
 <DropdownMenuItem onClick={() => window.location.href = `/students/${s.id}`}>{t("view_details", "View Details")}</DropdownMenuItem>
 <DropdownMenuItem onClick={() => {
 setEditingId(s.id);
 setFormData({ 
 ...s, 
 firstName: s.name?.split(' ')[0] || '', 
 lastName: s.name?.split(' ').slice(1).join(' ') || '',
 email: s.email || '',
 parentName: s.parent || '',
 parentPhone: s.phone || '',
 parentEmail: s.parentEmail || '',
 address: s.address || '',
 medicalNotes: s.medicalNotes || '',
 previousSchool: s.previousSchool || '',
 dateOfBirth: s.dateOfBirth || '',
 emergencyContactName: s.emergencyContactName || '',
 emergencyContactPhone: s.emergencyContactPhone || '',
 transferStatus: s.transferStatus || 'No',
 alumniStatus: s.alumniStatus || 'Active',
});
 setShowModal(true);
}}>
 {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem className="text-red-600 font-medium" onClick={() => handleDelete(s.id)}>{t("delete", "Delete")}</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 </div>
 )}
 </div>
 {/* Tabbed Wizard Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
 <div className="bg-white dark:bg-slate-900/40/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl -[#1E3A8A]/10 w-full max-w-lg overflow-hidden border border-primary/40 flex flex-col max-h-[90vh]">
 <div className="p-6 border-b border-primary/40">
 <h2 className="text-xl school-heading font-bold tracking-tight">{editingId ? 'Edit Student' : 'Enroll Student'}</h2>
 <div className="flex gap-4 mt-4 border-b border-primary/40">
 {['personal', 'academic', 'parent'].map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`pb-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
 activeTab === tab ? 'border-primary text-primary dark:border-primary/70 dark:text-primary/70' : 'border-transparent text-muted-foreground hover:text-foreground'
}`}
 >
 {tab}
 </button>
 ))}
 </div>
 </div>
 
 <div className="p-6 overflow-y-auto space-y-4">
 {activeTab === 'personal' && (
 <div className="space-y-4 animate-in fade-in zoom-in duration-200">
 <div className="bg-slate-50/50 dark:bg-transparent dark:bg-slate-100 p-3 rounded-xl border border-primary/40 dark:border-primary/80">
 <label className="text-[10px] font-bold text-primary dark:text-primary/70 uppercase tracking-widest">{t("student_id", "Student ID")}</label>
 <Input 
 value={formData.studentId || "Auto-generated on save"} 
 readOnly 
 className="mt-1 bg-transparent border-0 font-mono font-bold text-primary dark:text-primary/70 px-0 h-6 focus-visible:ring-0" 
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("first_name", "First Name")}</label><Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("last_name", "Last Name")}</label><Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="mt-1" /></div>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("student_email", "Student Login Email")}</label>
 <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" type="email" placeholder="student@example.com" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("dob", "Date of Birth")}</label><Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="mt-1" /></div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("gender", "Gender")}</label>
 <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option>Female</option><option>Male</option><option>Other</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("address", "Home Address")}</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("default_password", "Login Password")} *</label><Input value={formData.defaultPassword} placeholder="Required for student login" onChange={e => setFormData({...formData, defaultPassword: e.target.value})} className="mt-1" /></div>
 </div>
 </div>
 )}

 {activeTab === 'academic' && (
 <div className="space-y-4 animate-in fade-in zoom-in duration-200">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("class", "Class/Level")}</label>
 <select value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 {classes.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</label>
 <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option>Active</option><option>Suspended</option><option>Graduated</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("transfer_status", "Transfer Status")}</label>
 <select value={formData.transferStatus} onChange={e => setFormData({...formData, transferStatus: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option>No</option><option>Transferred In</option><option>Transferred Out</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("alumni_status", "Alumni Status")}</label>
 <select value={formData.alumniStatus} onChange={e => setFormData({...formData, alumniStatus: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option>Active</option><option>Alumni</option>
 </select>
 </div>
 </div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("previous_school", "Previous School")}</label><Input value={formData.previousSchool} onChange={e => setFormData({...formData, previousSchool: e.target.value})} className="mt-1" /></div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("medical_notes", "Medical Notes")}</label>
 <textarea value={formData.medicalNotes} onChange={e => setFormData({...formData, medicalNotes: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20" placeholder="Allergies, conditions..." />
 </div>
 </div>
 )}

 {activeTab === 'parent' && (
 <div className="space-y-4 animate-in fade-in zoom-in duration-200">
 <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20/50 dark:bg-slate-100 p-3 rounded-xl border border-primary/40 dark:border-primary/30">
 <label className="text-[10px] font-bold text-primary dark:text-primary/70 uppercase tracking-widest">{t("parent_id", "Parent ID")}</label>
 <Input 
 value={formData.parentId || "Auto-generated on save"} 
 readOnly 
 className="mt-1 bg-transparent border-0 font-mono font-bold text-primary dark:text-primary/30 px-0 h-6 focus-visible:ring-0" 
 />
 </div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("parent_name", "Parent/Guardian Name")}</label><Input value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="mt-1" /></div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("parent_phone", "Parent Phone")}</label><Input value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("parent_email", "Parent Email")}</label><Input value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className="mt-1" type="email" /></div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("emergency_contact_name", "Emergency Contact Name")}</label><Input value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("emergency_contact_phone", "Emergency Contact Phone")}</label><Input value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="mt-1" /></div>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("parent_password", "Parent Login Password")} *</label>
 <Input value={formData.parentPassword} onChange={e => setFormData({...formData, parentPassword: e.target.value})} className="mt-1" type="text" placeholder="Required for parent login" />
 {!editingId && <p className="text-[10px] text-muted-foreground mt-1">This will be the password the parent uses to log in.</p>}
 </div>
 </div>
 )}
 </div>

 <div className="p-6 border-t border-primary/40 bg-muted/30 flex gap-3">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setActiveTab('personal');}} disabled={isEnrolling}>{t("cancel", "Cancel")}</Button>
 {activeTab !== 'parent' ? (
 <Button className="flex-1 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={() => setActiveTab(activeTab === 'personal' ? 'academic' : 'parent')}>{t("next", "Next")}</Button>
 ) : (
 <Button className="flex-1 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={handleEnroll} disabled={isEnrolling}>
 {isEnrolling ? 'Saving...' : 'Save Student & Parent'}
 </Button>
 )}
 </div>
 </div>
 </div>
 )}
 {/* View Details Sheet */}
 <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
 <SheetContent className="overflow-y-auto w-full sm:max-w-md">
 <SheetHeader>
 <SheetTitle>{t("student_details", "Student Details")}</SheetTitle>
 <SheetDescription>{t("comprehensive_view_of_student_", "Comprehensive view of student records.")}</SheetDescription>
 </SheetHeader>
 {viewDetails && (
 <div className="mt-6 space-y-6">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-primary/30 font-bold text-xl">
 {viewDetails.avatar}
 </div>
 <div>
 <h3 className="text-xl school-heading font-bold tracking-tight">{viewDetails.name}</h3>
 <p className="text-sm text-muted-foreground">{viewDetails.studentId}</p>
 <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[viewDetails.status] || 'bg-slate-50 dark:bg-slate-800/50 text-primary dark:bg-primary/30 dark:text-primary/30'}`}>
 {viewDetails.status}
 </span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="bg-muted/50 p-3 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase font-semibold">{t("class", "Class")}</p>
 <Link to="/classes" className="text-primary hover:underline font-medium">{viewDetails.class}</Link>
 </div>
 <div className="bg-muted/50 p-3 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase font-semibold">{t("age", "Age")}</p>
 <p className="font-medium text-foreground">{viewDetails.age} {t("yrs", "yrs")}</p>
 </div>
 <div className="bg-muted/50 p-3 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase font-semibold">{t("gender", "Gender")}</p>
 <p className="font-medium text-foreground">{viewDetails.gender}</p>
 </div>
 <div className="bg-muted/50 p-3 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase font-semibold">{t("fee_status", "Fee Status")}</p>
 <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${feeColors[viewDetails.feeStatus] || 'bg-gray-100 text-gray-700'}`}>
 {viewDetails.feeStatus}
 </span>
 </div>
 </div>

 <div className="bg-muted/30 p-4 rounded-xl border border-primary/40">
 <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Phone className="w-4 h-4"/> {t("guardian_info", "Guardian Info")}</h4>
 <div className="space-y-2 text-sm">
 <p><span className="text-muted-foreground">{t("name", "Name:")}</span> {viewDetails.parent}</p>
 <p><span className="text-muted-foreground">{t("phone", "Phone:")}</span> {viewDetails.phone}</p>
 </div>
 </div>
 </div>
 )}
 </SheetContent>
 </Sheet>
 </div>
 );
}
