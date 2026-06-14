import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Megaphone, Search, Plus, Calendar, MoreVertical} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import { format} from "date-fns";

export default function Notices() {
 const { t} = useTranslation();
 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [editingId, setEditingId] = useState(null);

 const { data: records = [], isLoading} = useIndustryRecords('notice');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const [formData, setFormData] = useState({
 title: '', audience: 'All', content: ''
});

 const notices = records.map(r => ({
 id: r.id,
 ...r.data
}));

 const filtered = notices.filter(n =>
 n.title?.toLowerCase().includes(search.toLowerCase())
 );

 const handleSave = () => {
 if (!formData.title || !formData.content) return toast.error("Title and content are required");
 
 const payload = {
 title: formData.title,
 audience: formData.audience,
 content: formData.content,
 datePublished: new Date().toISOString(),
 status: 'Published'
};

 if (editingId) {
 mutateRecord.mutate({
 id: editingId, recordType: 'notice', payload, status: 'active',
 searchText: `${formData.title} ${formData.audience}`
}, {
 onSuccess: () => { toast.success("Notice updated"); setShowModal(false); setEditingId(null);}
});
} else {
 mutateRecord.mutate({
 recordType: 'notice', payload, status: 'active',
 searchText: `${formData.title} ${formData.audience}`
}, {
 onSuccess: () => { toast.success("Notice published"); setShowModal(false);}
});
}
};

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl school-heading font-extrabold tracking-tight">{t("noticeboard", "Noticeboard")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t("manage_announcements", "Manage school announcements and communications")}</p>
 </div>
 <Button onClick={() => { setFormData({title: '', audience: 'All', content: ''}); setShowModal(true);}} className="gap-2 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold">
 <Plus className="w-4 h-4" /> {t("new_notice", "New Notice")}
 </Button>
 </div>
 
 <div className="school-card p-5">
 <div className="relative w-full max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
 </div>
 </div>

 {isLoading ? (
 <div className="py-12 text-center text-muted-foreground">{t("loading", "Loading...")}</div>
 ) : filtered.length === 0 ? (
 <div className="text-center py-12 school-card">
 <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
 <p className="font-semibold text-lg text-card-foreground">{t("no_notices", "No notices published")}</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filtered.map(n => (
 <div key={n.id} className="bg-card rounded-xl border border-primary/40 p-5 transition-all group relative">
 <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4 text-muted-foreground" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => {
 setEditingId(n.id);
 setFormData({ title: n.title, audience: n.audience, content: n.content});
 setShowModal(true);
}}>{t("edit", "Edit")}</DropdownMenuItem>
 <DropdownMenuItem className="text-red-600" onClick={() => deleteRecord.mutate({ id: n.id, recordType: 'notice'})}>{t("delete", "Delete")}</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
 <Megaphone className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-card-foreground line-clamp-1">{n.title}</h3>
 <p className="text-xs font-semibold text-orange-600">{t("audience", "Audience:")} {n.audience}</p>
 </div>
 </div>
 <p className="text-sm text-muted-foreground line-clamp-3 mb-4 whitespace-pre-wrap">{n.content}</p>
 <div className="flex items-center justify-between pt-4 border-t border-primary/40 mt-auto">
 <span className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
 <Calendar className="w-3.5 h-3.5" /> {n.datePublished ? format(new Date(n.datePublished), 'MMM d, yyyy') : 'No Date'}
 </span>
 <span className="bg-slate-50 dark:bg-slate-800/50 text-primary/90 text-xs font-bold px-2 py-1 rounded-md">{n.status}</span>
 </div>
 </div>
 ))}
 </div>
 )}

 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
 <div className="bg-white dark:bg-slate-900/40/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl -[#1E3A8A]/10 w-full max-w-md p-6 space-y-4 border border-primary/40 max-h-[90vh] overflow-y-auto custom-scrollbar">
 <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Notice' : 'Publish Notice'}</h2>
 <div className="space-y-3">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("title", "Title")}</label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1" /></div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("audience", "Audience")}</label>
 <select value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
 <option>All</option>
 <option>Students Only</option>
 <option>Parents Only</option>
 <option>Staff Only</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("content", "Content")}</label>
 <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-32" />
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary text-white -[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={handleSave}>
 {mutateRecord.isPending ? 'Publishing...' : 'Publish'}
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
