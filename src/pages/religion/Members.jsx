import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Users, Search, UserPlus, Phone, Trash2, Heart} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { useNotifications} from "@/hooks/integrations/useNotifications";
import { useCompanyId} from "@/hooks/useCompanyId";
import { MessageCircle} from "lucide-react";

export default function Members() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { notifyTeam} = useNotifications();
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('member');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const members = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Active',
 ...r.data
}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [viewRecord, setViewRecord] = useState(null);
 const [editRecord, setEditRecord] = useState(null);

 // Form State
 const [formData, setFormData] = useState({
 name: '',
 phone: '',
 type: 'Full Member',
 group: 'None'
});


 const openEdit = (record) => {
 setEditRecord(record);
 setFormData(record);
 setShowModal(true);
};

 const handleCreateMember = () => {
 if (!formData.name.trim() || !formData.phone.trim()) {
 return toast.error("Please enter a name and phone number");
}

 const memberId = `MB-${Math.floor(1000 + Math.random() * 9000)}`;

 const payload = {
 memberId,
 name: formData.name,
 phone: formData.phone,
 type: formData.type,
 group: formData.group
};

 mutateRecord.mutate({
 ...(editRecord ? { id: editRecord.id} : {}),
 recordType: 'member',
 payload,
 status: 'active',
 searchText: `${memberId} ${formData.name} ${formData.group}`
}, {
 onSuccess: () => {
 toast.success('Member enrolled successfully!');
 setShowModal(false);
 setEditRecord(null);
 setFormData({ name: '', phone: '', type: 'Full Member', group: 'None'});
},
 onError: (err) => {
 toast.error('Failed to save member: ' + err.message);
}
});
};

 const handleUpdateStatus = (member, newStatus) => {
 const updatedPayload = { ...member};
 delete updatedPayload.id;

 mutateRecord.mutate({
 id: member.id,
 recordType: 'member',
 payload: updatedPayload,
 status: newStatus,
 searchText: `${member.name} ${member.group}`
}, {
 onSuccess: () => {
 toast.success(`Member status updated to ${newStatus}`);
}
});
};

 const handleDeleteMember = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'member'}, {
 onSuccess: () => {
 toast.success('Member removed successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to remove member: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const filtered = members.filter(m =>
 m.name?.toLowerCase().includes(search.toLowerCase()) ||
 m.group?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">{t("member_directory", "Member Directory")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t("manage_religion_congregants_and_", "Manage religion congregants and visitors")}</p>
 </div>
 <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <UserPlus className="w-4 h-4" /> {t("add_member", "Add Member")}
 </Button>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="stat-card-premium bg-card rounded-xl border border-border p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-500 flex items-center justify-center text-primary dark:text-primary/70">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-card-foreground">{members.filter(m => m.status === 'Active').length}</p>
 <p className="text-xs text-muted-foreground">{t("active_members", "Active Members")}</p>
 </div>
 </div>
 <div className="stat-card-premium bg-card rounded-xl border border-border p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
 <Heart className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-card-foreground">{members.filter(m => m.type === 'Visitor').length}</p>
 <p className="text-xs text-muted-foreground">{t("first_time_visitors", "First Time Visitors")}</p>
 </div>
 </div>
 </div>
 <div className="bg-card rounded-xl border border-border overflow-hidden">
 <div className="p-4 border-b border-border bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search name or cell group..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isDbLoading ? (
 <div className="py-12 text-center text-muted-foreground">{t("loading_directory", "Loading directory...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-muted-foreground">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
 <p className="font-semibold text-lg text-card-foreground">{t("no_member_profiles_found", "No member profiles found")}</p>
 <p className="text-xs mt-1">{t(
 "configure_congregants_using_th",
 "Configure congregants using the \"Add Member\" button above."
 )}</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("member_name", "Member Name")}</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("membership", "Membership")}</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("contact", "Contact")}</th>
 <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(m => {
 return (
 <tr key={m.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-bold text-card-foreground">{m.name}</p>
 <p className="text-xs text-muted-foreground">{m.memberId}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-card-foreground font-medium">{m.type}</p>
 <Link to="/religion/small-groups" className="text-xs text-primary hover:underline">{m.group}</Link>
 </td>
 <td className="px-6 py-4 text-muted-foreground">
 <div className="flex items-center gap-2">
 <Phone className="w-3.5 h-3.5" /> {m.phone}
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <select
 value={m.status}
 onChange={e => handleUpdateStatus(m, e.target.value)}
 className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-bold"
 >
 <option>{t("active", "Active")}</option>
 <option>{t("inactive", "Inactive")}</option>
 </select>
 </td>
 <td className="px-6 py-4 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewRecord(m)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(m)}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(m.id)} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 )}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border border-border">
 <h2 className="text-lg font-bold text-card-foreground">{t("add_religion_member", "Add Religion Member")}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("full_name", "Full Name")}</label>
 <Input
 value={formData.name}
 onChange={e => setFormData({ ...formData, name: e.target.value})}
 className="mt-1"
 placeholder="e.g. John Doe"
 />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("phone_number", "Phone Number")}</label>
 <Input
 value={formData.phone}
 onChange={e => setFormData({ ...formData, phone: e.target.value})}
 className="mt-1"
 placeholder="e.g. +233 24 000 0000"
 />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("membership_type", "Membership Type")}</label>
 <select
 value={formData.type}
 onChange={e => setFormData({ ...formData, type: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 <option>{t("full_member", "Full Member")}</option>
 <option>{t("associate", "Associate")}</option>
 <option>{t("visitor", "Visitor")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("cell_group", "Cell Group")}</label>
 <Input
 value={formData.group}
 onChange={e => setFormData({ ...formData, group: e.target.value})}
 className="mt-1"
 placeholder="e.g. Grace Cell"
 />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateMember}>{editRecord ? 'Update' : 'Save Member'}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteMember}
 title="Remove Member Profile"
 message="Are you sure you want to completely remove this member from your directory listings? This action is permanent."
 />
 <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
 <SheetContent className="sm:max-w-md overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("record_details", "Record Details")}</SheetTitle>
 <SheetDescription>{t("read_only_view_of_the_selected", "Read-only view of the selected record.")}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => {
 return (
 <div key={key} className="border-b border-border pb-2">
 <p className="text-sm font-medium text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
 <p className="mt-1 text-base text-foreground font-semibold">
 {key === 'group' ? (
 <Link to="/religion/small-groups" className="text-primary hover:underline">{String(value)}</Link>
 ) : typeof value === 'object' ? JSON.stringify(value) : String(value)}
 </p>
 </div>
 );
})}
 </div>
 </SheetContent>
 </Sheet>
 </div>
 );
}
