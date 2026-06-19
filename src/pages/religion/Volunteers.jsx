import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Calendar, Users, ClipboardCheck, Plus, Trash2, Search} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';

export default function Volunteers() {
 const { t} = useTranslation();
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('volunteer');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const volunteers = dbRecords.map(r => ({
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
 group: 'Ushers',
 role: 'Usher',
 availability: 'Sundays',
 nextService: new Date().toISOString().split('T')[0]
});


 const openEdit = (record) => {
 setEditRecord(record);
 setFormData(record);
 setShowModal(true);
};

 const handleCreateVolunteer = () => {
 if (!formData.name.trim() || !formData.role.trim()) {
 return toast.error("Please enter volunteer name and role");
}

 const payload = {
 name: formData.name,
 group: formData.group,
 role: formData.role,
 availability: formData.availability,
 nextService: formData.nextService
};

 mutateRecord.mutate({
 ...(editRecord ? { id: editRecord.id} : {}),
 recordType: 'volunteer',
 payload,
 status: 'active',
 searchText: `${formData.name} ${formData.group} ${formData.role}`
}, {
 onSuccess: () => {
 toast.success('Volunteer scheduled successfully!');
 setShowModal(false);
 setEditRecord(null);
 setFormData({ name: '', group: 'Ushers', role: 'Usher', availability: 'Sundays', nextService: new Date().toISOString().split('T')[0]});
},
 onError: (err) => {
 toast.error('Failed to schedule volunteer: ' + err.message);
}
});
};

 const handleDeleteVolunteer = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'volunteer'}, {
 onSuccess: () => {
 toast.success('Volunteer removed from schedule successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to remove volunteer: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const filtered = volunteers.filter(v =>
 v.name?.toLowerCase().includes(search.toLowerCase()) ||
 v.group?.toLowerCase().includes(search.toLowerCase()) ||
 v.role?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("volunteer_roster", "Volunteer Roster")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "manage_religion_service_voluntee",
 "Manage religion service volunteers and schedules"
 )}</p>
 </div>
 <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Plus className="w-4 h-4" /> {t("schedule_volunteer", "Schedule Volunteer")}
 </Button>
 </div>
 <div className="flex items-center gap-3">
 <div className="relative max-w-md flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search volunteers, groups, or roles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="overflow-x-auto">
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_roster", "Loading roster...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_volunteers_scheduled", "No volunteers scheduled")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t(
 "add_religion_members_to_ushers_t",
 "Add religion members to ushers, tech booths, or teachers using the top right button."
 )}</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-muted border-b border-primary/40">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("volunteer", "Volunteer")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("group_role", "Group / Role")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("availability", "Availability")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("next_service_date", "Next Service Date")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(v => {
 return (
 <tr key={v.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Users className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> <Link to="/religion/members" className="text-primary hover:underline">{v.name}</Link>
 </td>
 <td className="px-6 py-4">
 <Link to="/religion/groups" className="font-semibold text-primary/90 dark:text-primary/70 hover:underline block">{v.group}</Link>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{v.role}</p>
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400 font-medium">{v.availability}</td>
 <td className="px-6 py-4 text-card-foreground font-semibold hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4 text-primary" /> {v.nextService}
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewRecord(v)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(v)}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(v.id)} className="text-red-600">
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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-md-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <ClipboardCheck className="w-5 h-5 text-primary" /> {t("schedule_religion_volunteer", "Schedule Religion Volunteer")}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("volunteer_name", "Volunteer Name")}</label>
 <Input
 value={formData.name}
 onChange={e => setFormData({ ...formData, name: e.target.value})}
 className="mt-1"
 placeholder="e.g. Ama Owusu"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("group", "Group")}</label>
 <select
 value={formData.group}
 onChange={e => setFormData({ ...formData, group: e.target.value})}
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 <option>{t("ushers", "Ushers")}</option>
 <option>{t("childrens_dept", "Childrens Dept")}</option>
 <option>{t("media_tech", "Media/Tech")}</option>
 <option>{t("worship_choir", "Worship/Choir")}</option>
 <option>{t("hospitality", "Hospitality")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("specific_role", "Specific Role")}</label>
 <Input
 value={formData.role}
 onChange={e => setFormData({ ...formData, role: e.target.value})}
 className="mt-1"
 placeholder="e.g. Sound Engineer"
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("availability", "Availability")}</label>
 <Input
 value={formData.availability}
 onChange={e => setFormData({ ...formData, availability: e.target.value})}
 className="mt-1"
 placeholder="e.g. Sundays"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("next_service_date", "Next Service Date")}</label>
 <Input
 type="date"
 value={formData.nextService}
 onChange={e => setFormData({ ...formData, nextService: e.target.value})}
 className="mt-1"
 />
 </div>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateVolunteer}>{editRecord ? 'Update' : 'Schedule'}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteVolunteer}
 title="Remove Volunteer"
 message="Are you sure you want to remove this volunteer from the schedule? This action is permanent."
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
 <div key={key} className="border-b border-primary/40 pb-2">
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
 <p className="mt-1 text-base text-foreground font-semibold">
 {key === 'name' ? (
 <Link to="/religion/members" className="text-primary hover:underline">{String(value)}</Link>
 ) : key === 'group' ? (
 <Link to="/religion/groups" className="text-primary hover:underline">{String(value)}</Link>
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
