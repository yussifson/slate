import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Users, Search, Plus, Phone, Mail, MoreVertical, Settings} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { toast} from 'react-hot-toast';
import { useCompanyId} from "@/hooks/useCompanyId";
import IDFormatSettings from '@/components/school/IDFormatSettings';

export default function Parents() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const queryClient = useQueryClient();
 
 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [showSettings, setShowSettings] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [activeTab, setActiveTab] = useState('personal');

 // Fetch students to link
 const { data: students = []} = useQuery({
 queryKey: ["clients", companyId, "student"],
 queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student'}),
 enabled: !!companyId
});

 const { data: records = [], isLoading} = useQuery({ 
 queryKey: ["clients", companyId, "parent"], 
 queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'parent'}), 
 enabled: !!companyId 
});

 const { data: schoolSettings} = useQuery({
 queryKey: ['school_settings', companyId],
 queryFn: async () => {
 const records = await base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'school_settings'});
 let data = { parentPrefix: 'PAR', parentIncludeYear: true};
 if (records.length > 0 && records[0].notes) {
 try { data = typeof records[0].notes === 'string' ? JSON.parse(records[0].notes) : records[0].notes;} catch(e) {}
}
 return data;
},
 enabled: !!companyId
});

 const mutateParent = useMutation({
 mutationFn: (data) => data.id ? base44.entities.Client.update(data.id, data) : base44.entities.Client.create(data),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId]})
});

 const deleteParent = useMutation({
 mutationFn: (id) => base44.entities.Client.delete(id),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId]})
});

 const [formData, setFormData] = useState({
 name: '', phone: '', email: '', address: '', parentId: '', linkedStudentId: ''
});

 const parents = records.map(r => {
 let extra = {};
 try { extra = JSON.parse(r.notes || '{}');} catch(e) {}
 return {
 id: r.id,
 name: r.name,
 parentId: r.id_number,
 phone: r.phone,
 email: extra.email || '',
 address: extra.address || '',
 linkedStudentId: extra.linkedStudentId || '',
 avatar: r.name?.substring(0,2).toUpperCase()
};
});

 const filtered = parents.filter(p =>
 p.name?.toLowerCase().includes(search.toLowerCase()) || p.parentId?.includes(search)
 );

 const handleEnroll = () => {
 if (!companyId) return toast.error("Workspace not loaded. Refresh the page and try again.");
 if (!formData.name) return toast.error("Please enter parent name");
 
 // Auto-generate ID linked to Student if provided, else random
 let finalParentId = formData.parentId;
 if (!finalParentId) {
 const prefix = schoolSettings?.parentPrefix || 'PAR';
 if (formData.linkedStudentId) {
 // e.g. STU-2023-1234 -> PAR-2023-1234
 const parts = formData.linkedStudentId.split('-');
 parts[0] = prefix;
 finalParentId = parts.join('-');
} else {
 const seq = Math.floor(1000 + Math.random() * 9000);
 finalParentId = `${prefix}-${seq}`;
}
}
 
 const payload = {
 company_id: companyId,
 type: 'parent',
 name: formData.name,
 id_number: finalParentId,
 phone: formData.phone,
 status: 'active',
 notes: JSON.stringify({
 email: formData.email,
 address: formData.address,
 linkedStudentId: formData.linkedStudentId,
 avatar: formData.name.substring(0,2).toUpperCase()
})
};

 const onDone = {
 onSuccess: () => {
 toast.success(editingId ? "Parent updated successfully!" : `Parent added! Default Password: password123`);
 setShowModal(false);
 setEditingId(null);
 setFormData({ name: '', phone: '', email: '', address: '', parentId: '', linkedStudentId: ''});
},
 onError: (err) => toast.error(err?.message || "Failed to save parent"),
};

 if (editingId) {
 mutateParent.mutate({ id: editingId, ...payload}, onDone);
} else {
 mutateParent.mutate(payload, onDone);
}
};

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl school-heading font-extrabold tracking-tight">{t("parents", "Parents")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t("manage_parent_directory", "Manage parent directory (Parents are enrolled automatically with Students)")}</p>
 </div>
 <div className="flex gap-2">
 <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="gap-2">
 <Settings className="w-4 h-4" /> {t("id_settings", "ID Settings")}
 </Button>
 </div>
 </div>
 
 {showSettings && <IDFormatSettings />}

 {/* Search */}
 <div className="school-card p-5">
 <div className="relative w-full max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
 </div>
 </div>

 {/* Parent Table */}
 <div className="school-card overflow-hidden">
 {filtered.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
 <p>{t("no_parents_found", "No parents found")}</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Parent / Guardian</th>
 <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">ID / Login ID</th>
 <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Linked Student</th>
 <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Contact Info</th>
 <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Address</th>
 <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(p => (
 <tr key={p.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-primary/30 font-bold text-xs">
 {p.avatar}
 </div>
 <p className="font-semibold text-card-foreground">{p.name}</p>
 </div>
 </td>
 <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.parentId}</td>
 <td className="px-4 py-3 text-primary dark:text-primary/70 text-xs font-semibold">
 {students.find(s => s.id_number === p.linkedStudentId)?.name || 'Unlinked'}
 </td>
 <td className="px-4 py-3">
 <p className="text-foreground text-xs flex items-center gap-1"><Phone className="w-3 h-3"/> {p.phone}</p>
 <p className="text-muted-foreground text-xs flex items-center gap-1"><Mail className="w-3 h-3"/> {p.email}</p>
 </td>
 <td className="px-4 py-3 text-muted-foreground text-xs">{p.address}</td>
 <td className="px-4 py-3 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4 text-muted-foreground" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => {
 setEditingId(p.id);
 setFormData({ 
 name: p.name || '', 
 phone: p.phone || '', 
 email: p.email || '', 
 address: p.address || '', 
 parentId: p.parentId || '', 
 linkedStudentId: p.linkedStudentId || '' 
});
 setShowModal(true);
}}>{t("edit", "Edit")}</DropdownMenuItem>
 <DropdownMenuItem className="text-red-600 font-medium" onClick={() => {
 if (window.confirm("Are you sure?")) deleteParent.mutate(p.id);
}}>{t("delete", "Delete")}</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Tabbed Wizard Modal (Edit Only) */}
 {showModal && editingId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
 <div className="bg-white dark:bg-slate-900/40/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl -[#1E3A8A]/10 w-full max-w-lg overflow-hidden border border-border flex flex-col max-h-[90vh]">
 <div className="p-6 border-b border-border">
 <h2 className="text-xl school-heading font-bold tracking-tight">Edit Parent</h2>
 <div className="flex gap-4 mt-4 border-b border-border">
 {['personal', 'linking'].map(tab => (
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
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("full_name", "Full Name")}</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1" placeholder="Kwame Owusu" /></div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("phone", "Phone")}</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("email", "Email")}</label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" type="email" /></div>
 </div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("address", "Address")}</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1" /></div>
 </div>
 )}

 {activeTab === 'linking' && (
 <div className="space-y-4 animate-in fade-in zoom-in duration-200">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">Linked Student</label>
 <select
 value={formData.linkedStudentId}
 onChange={e => setFormData({...formData, linkedStudentId: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 <option value="">-- No Student Selected --</option>
 {students.map(s => (
 <option key={s.id} value={s.id_number}>{s.name} ({s.id_number})</option>
 ))}
 </select>
 </div>
 
 <div className="pt-4 border-t border-border">
 <label className="text-xs font-bold text-muted-foreground uppercase">Parent ID</label>
 <Input value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})} className="mt-1" placeholder="Leave blank to auto-generate" disabled />
 </div>
 </div>
 )}
 </div>

 <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setActiveTab('personal');}} disabled={mutateParent.isPending}>{t("cancel", "Cancel")}</Button>
 {activeTab !== 'linking' ? (
 <Button className="flex-1 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={() => setActiveTab('linking')}>{t("next", "Next")}</Button>
 ) : (
 <Button className="flex-1 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={handleEnroll} disabled={mutateParent.isPending}>
 {mutateParent.isPending ? 'Saving...' : 'Save Changes'}
 </Button>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
