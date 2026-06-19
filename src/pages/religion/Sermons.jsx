import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { PlayCircle, Headphones, BookOpen, Search, Upload, Trash2, MoreVertical, Eye, Edit, Sparkles} from 'lucide-react';
import { generateText } from '@/lib/cloudflareAI';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';

export default function Sermons() {
 const { t} = useTranslation();
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('sermon');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const sermons = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Active',
 ...r.data
}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [viewRecord, setViewRecord] = useState(null);
 const [editRecord, setEditRecord] = useState(null);
 const [isGenerating, setIsGenerating] = useState(false);

 const generateOutline = async () => {
  if (!viewRecord || !viewRecord.title || !viewRecord.scripture) {
   toast.error('Sermon title and scripture reference required to generate outline.');
   return;
  }
  
  setIsGenerating(true);
  const tId = toast.loading('Generating AI Outline...');
  try {
   const prompt = `You are a pastor preparing a sermon outline. 
Title: ${viewRecord.title}
Scripture: ${viewRecord.scripture}
Preacher: ${viewRecord.preacher}

Provide a structured 3-point sermon outline with an introduction, 3 main points with brief explanations, and a conclusion. Keep it concise.`;
   
   const outline = await generateText(prompt);
   
   // Save it back to the record
   const payload = { ...viewRecord, outline };
   delete payload.id;
   delete payload.status;
   
   mutateRecord.mutate({
    id: viewRecord.id,
    recordType: 'sermon',
    payload,
    status: viewRecord.status || 'Active',
    searchText: `${viewRecord.title} ${viewRecord.preacher} ${viewRecord.series}`
   }, {
    onSuccess: () => {
     toast.success('AI Outline generated and saved!', { id: tId });
     setViewRecord({ ...viewRecord, outline });
    }
   });
  } catch (err) {
   toast.error('Failed to generate outline.', { id: tId });
  } finally {
   setIsGenerating(false);
  }
 };
 // Form State
 const [formData, setFormData] = useState({
 title: '',
 preacher: '',
 scripture: '',
 series: 'General',
 duration: '45:00'
});


 const openEdit = (record) => {
 setEditRecord(record);
 setFormData(record);
 setShowModal(true);
};

 const handleCreateSermon = () => {
 if (!formData.title.trim() || !formData.preacher.trim()) {
 return toast.error("Please enter a sermon title and preacher name");
}

 const payload = {
 title: formData.title,
 preacher: formData.preacher,
 scripture: formData.scripture || 'Various Passages',
 series: formData.series,
 duration: formData.duration,
 date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})
};

 mutateRecord.mutate({
 ...(editRecord ? { id: editRecord.id} : {}),
 recordType: 'sermon',
 payload,
 status: 'active',
 searchText: `${formData.title} ${formData.preacher} ${formData.series}`
}, {
 onSuccess: () => {
 toast.success('Sermon logged in library successfully!');
 setShowModal(false);
 setEditRecord(null);
 setFormData({ title: '', preacher: '', scripture: '', series: 'General', duration: '45:00'});
},
 onError: (err) => {
 toast.error('Failed to log sermon: ' + err.message);
}
});
};

 const handleDeleteSermon = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'sermon'}, {
 onSuccess: () => {
 toast.success('Sermon removed from library successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to remove sermon: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const filtered = sermons.filter(s =>
 s.title?.toLowerCase().includes(search.toLowerCase()) ||
 s.preacher?.toLowerCase().includes(search.toLowerCase()) ||
 s.series?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("sermon_library", "Sermon Library")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_audio_and_video_sermon_", "Manage audio and video sermon archives")}</p>
 </div>
 <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Upload className="w-4 h-4" /> {t("upload_sermon", "Upload Sermon")}
 </Button>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search by title, preacher, or series..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted" />
 </div>
 </div>
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_archives", "Loading archives...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_sermons_in_library", "No sermons in library")}</p>
 <p className="text-sm mt-1 max-w-md mx-auto">{t(
 "upload_weekly_gospel_records_s",
 "Upload weekly gospel records, scripture outlines, and podcast media links using the button above."
 )}</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filtered.map(sermon => {
 return (
 <div key={sermon.id} className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden transition-all group relative flex flex-col justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <div className="h-40 bg-muted dark:bg-muted/50 relative flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-primary/20 transition-colors cursor-pointer">
 <PlayCircle className="w-16 h-16 text-primary dark:text-primary/70 opacity-80 group-hover:scale-110 transition-transform" />
 <span className="absolute bottom-2 right-2 bg-primary/20 text-white text-xs font-semibold px-2 py-1 rounded-md tracking-[0.04em]">{sermon.duration || '45:00'}</span>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0 text-foreground hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
 <MoreVertical className="h-4 w-4 text-white" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewRecord(sermon);}}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(sermon);}}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTargetId(sermon.id);}} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 <div className="p-5">
 <span className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-primary/70 mb-2 inline-block tracking-[0.04em]">{sermon.series}</span>
 <h3 className="text-lg font-semibold text-card-foreground mb-1 leading-tight hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{sermon.title}</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-4"><Link to="/religion/members" className="hover:underline text-primary">{sermon.preacher}</Link> • {sermon.date}</p>

 <div className="flex items-center gap-2 bg-muted dark:bg-muted/30 p-2.5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mb-4">
 <BookOpen className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <span className="text-xs font-medium text-foreground tracking-[0.04em]">{sermon.scripture}</span>
 </div>
 </div>
 </div>
 <div className="p-5 pt-0 flex gap-2">
 <Button variant="outline" className="flex-1 gap-2"><PlayCircle className="w-4 h-4" /> {t("watch", "Watch")}</Button>
 <Button variant="outline" className="flex-1 gap-2"><Headphones className="w-4 h-4" /> {t("listen", "Listen")}</Button>
 </div>
 </div>
 );
})}
 </div>
 )}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Upload className="w-5 h-5 text-primary" /> {t("log_sermon_media", "Log Sermon Media")}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("sermon_title", "Sermon Title")}</label>
 <Input
 value={formData.title}
 onChange={e => setFormData({ ...formData, title: e.target.value})}
 className="mt-1"
 placeholder="e.g. Walking in Grace"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("preacher_pastor_name", "Preacher / Pastor Name")}</label>
 <Input
 value={formData.preacher}
 onChange={e => setFormData({ ...formData, preacher: e.target.value})}
 className="mt-1"
 placeholder="e.g. Rev. Dr. Mensah"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("scripture_reference", "Scripture Reference")}</label>
 <Input
 value={formData.scripture}
 onChange={e => setFormData({ ...formData, scripture: e.target.value})}
 className="mt-1"
 placeholder="e.g. Hebrews 11:1-6"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("sermon_series", "Sermon Series")}</label>
 <Input
 value={formData.series}
 onChange={e => setFormData({ ...formData, series: e.target.value})}
 className="mt-1"
 placeholder="e.g. Faith Builders"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("duration_mm_ss", "Duration (MM:SS)")}</label>
 <Input
 value={formData.duration}
 onChange={e => setFormData({ ...formData, duration: e.target.value})}
 className="mt-1"
 placeholder="45:00"
 />
 </div>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateSermon}>{editRecord ? 'Update' : 'Log Sermon'}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteSermon}
 title="Delete Sermon Log"
 message="Are you sure you want to completely delete this sermon recording from the archives? This action cannot be undone."
 />
 <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
 <SheetContent className="sm:max-w-md overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("record_details", "Record Details")}</SheetTitle>
 <SheetDescription>{t("read_only_view_of_the_selected", "Read-only view of the selected record.")}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status' && k !== 'outline').map(([key, value]) => {
 return (
 <div key={key} className="border-b border-primary/40 pb-2">
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
 <p className="mt-1 text-base text-foreground font-semibold">
 {key === 'preacher' ? (
 <Link to="/religion/members" className="text-primary hover:underline">{String(value)}</Link>
 ) : typeof value === 'object' ? JSON.stringify(value) : String(value)}
 </p>
 </div>
 );
})}

{viewRecord && viewRecord.outline && (
  <div className="border-b border-primary/40 pb-2 mt-4">
     <p className="text-sm font-medium text-primary uppercase tracking-[0.04em] mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Outline</p>
     <div className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border-[0.5px] border-primary/20">{viewRecord.outline}</div>
  </div>
)}

{viewRecord && !viewRecord.outline && (
  <Button 
    onClick={generateOutline} 
    disabled={isGenerating}
    className="w-full mt-4 gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
    variant="outline"
  >
     <Sparkles className="w-4 h-4" /> 
     {isGenerating ? 'Generating...' : 'Generate AI Outline'}
  </Button>
)}
 </div>
 </SheetContent>
 </Sheet>
 </div>
 );
}
