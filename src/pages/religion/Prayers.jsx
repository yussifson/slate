import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Heart, HandHeart, CheckCircle, Search, Trash2, Plus, Sparkles, AlertTriangle} from 'lucide-react';
import { generateText } from '@/lib/cloudflareAI';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';

export default function Prayers() {
 const { t} = useTranslation();
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('prayer');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const prayers = dbRecords.map(r => ({
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
 name: 'Anonymous',
 request: ''
});


 const openEdit = (record) => {
 setEditRecord(record);
 setFormData(record);
 setShowModal(true);
};

 const handleCreatePrayer = () => {
 if (!formData.request.trim()) {
 return toast.error("Please enter your prayer request details");
}

 const payload = {
 name: formData.name.trim() || 'Anonymous',
 request: formData.request,
 prayersCount: 0,
 date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})
};

 mutateRecord.mutate({
 ...(editRecord ? { id: editRecord.id} : {}),
 recordType: 'prayer',
 payload,
 status: 'active',
 searchText: `${payload.name} ${formData.request}`
}, {
 onSuccess: () => {
 toast.success('Prayer request submitted successfully!');
 setShowModal(false);
 setEditRecord(null);
 setFormData({ name: 'Anonymous', request: ''});
},
 onError: (err) => {
 toast.error('Failed to submit request: ' + err.message);
}
});
};

 const handleIncrementPrayers = (prayer) => {
 const updatedPayload = {
 ...prayer,
 prayersCount: (prayer.prayersCount || 0) + 1
};
 delete updatedPayload.id;

 mutateRecord.mutate({
 id: prayer.id,
 recordType: 'prayer',
 payload: updatedPayload,
 status: prayer.status,
 searchText: `${prayer.name} ${prayer.request}`
}, {
 onSuccess: () => {
 toast.success('Interceded for this prayer request!');
}
});
};

 const handleMarkAnswered = (prayer) => {
 const updatedPayload = { ...prayer};
 delete updatedPayload.id;

 mutateRecord.mutate({
 id: prayer.id,
 recordType: 'prayer',
 payload: updatedPayload,
 status: 'Answered',
 searchText: `${prayer.name} ${prayer.request}`
}, {
 onSuccess: () => {
 toast.success('Praise report! Marked as Answered.');
}
});
};

 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const handleAnalyzeSentiment = async (prayer) => {
   setIsAnalyzing(true);
   const tId = toast.loading('AI analyzing prayer request...');
   try {
     const prompt = `Analyze this prayer request for a church pastoral care team.
Respond with a JSON object with exactly these fields (no markdown blocks, just raw JSON):
{
  "urgency": "URGENT" (death, severe sickness, hospital, crisis), "NORMAL" (general prayer), or "PRAISE" (thanksgiving),
  "category": "Health", "Family", "Financial", "Guidance", "Spiritual", or "Other",
  "suggestedResponse": "A 1-2 sentence comforting pastoral response or prayer to share with the person",
  "followUp": "Suggested pastoral follow-up action (e.g., 'Call within 24 hours', 'Send a card', 'Follow up next week')"
}
Prayer Request: "${prayer.request}"`;
     const rawSentiment = await generateText(prompt);
     const cleanJsonStr = rawSentiment.replace(/```json/g, '').replace(/```/g, '').trim();
     const analysis = JSON.parse(cleanJsonStr);
     
     const updatedPayload = { ...prayer, sentiment: analysis.urgency, aiAnalysis: analysis };
     delete updatedPayload.id;
     delete updatedPayload.status;

     mutateRecord.mutate({
       id: prayer.id,
       recordType: 'prayer',
       payload: updatedPayload,
       status: prayer.status,
       searchText: `${prayer.name} ${prayer.request}`
     }, {
       onSuccess: () => {
         toast.success(`Analysis complete: ${analysis.category} / ${analysis.urgency}`, { id: tId });
       }
     });
   } catch (err) {
     toast.error('Failed to analyze prayer request', { id: tId });
   } finally {
     setIsAnalyzing(false);
   }
 };

 const handleDeletePrayer = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'prayer'}, {
 onSuccess: () => {
 toast.success('Prayer request retracted successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to retract request: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const filtered = prayers.filter(p =>
 p.request?.toLowerCase().includes(search.toLowerCase()) ||
 p.name?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6 max-w-4xl mx-auto">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("prayer_requests", "Prayer Requests")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "submit_and_manage_congregation",
 "Submit and manage congregational prayer needs"
 )}</p>
 </div>
 <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <HandHeart className="w-4 h-4" /> {t("submit_request", "Submit Request")}
 </Button>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search prayer requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-none" />
 </div>
 </div>
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_prayer_board", "Loading prayer board...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <HandHeart className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_prayer_requests_listed", "No prayer requests listed")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t(
 "be_the_first_to_list_a_family_",
 "Be the first to list a family petition, health intercession, or praise report using the button above."
 )}</p>
 </div>
 ) : (
 <div className="space-y-4">
 {filtered.map(prayer => {
 return (
 <div key={prayer.id} className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {prayer.status === 'Answered' && (
 <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-bl-lg tracking-[0.04em]">
 {t("answered", "Answered")}
 </div>
 )}
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 {prayer.name === 'Anonymous' ? (
 <span className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{prayer.name}</span>
 ) : (
 <Link to="/religion/members" className="font-semibold text-primary hover:underline">{prayer.name}</Link>
 )}
 <span className="text-[#71717a] dark:text-gray-400">•</span>
 <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{prayer.date}</span>
 {prayer.sentiment === 'URGENT' && (
    <>
      <span className="text-[#71717a] dark:text-gray-400">•</span>
      <span className="text-xs text-red-500 font-bold tracking-[0.04em] flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> URGENT PASTORAL CARE</span>
    </>
  )}
  {prayer.sentiment === 'PRAISE' && (
    <>
      <span className="text-[#71717a] dark:text-gray-400">•</span>
      <span className="text-xs text-green-500 font-bold tracking-[0.04em] flex items-center gap-1"><CheckCircle className="w-3 h-3"/> PRAISE REPORT</span>
    </>
  )}
  {prayer.aiAnalysis && prayer.aiAnalysis.category && (
    <>
      <span className="text-[#71717a] dark:text-gray-400">•</span>
      <span className="text-xs text-primary font-bold tracking-[0.04em]">{prayer.aiAnalysis.category.toUpperCase()}</span>
    </>
  )}
 </div>
 <p className="text-foreground text-lg leading-relaxed font-medium">"{prayer.request}"</p>
 {prayer.aiAnalysis && (
   <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
     <p className="text-xs font-semibold text-primary flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Pastoral Suggestions</p>
     <div className="text-sm text-foreground">
       <span className="font-semibold">Suggested Response:</span> {prayer.aiAnalysis.suggestedResponse}
     </div>
     <div className="text-sm text-foreground">
       <span className="font-semibold">Action Item:</span> {prayer.aiAnalysis.followUp}
     </div>
   </div>
 )}
 </div>
 <div className="flex sm:flex-col gap-2 justify-end sm:justify-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-primary/40 sm:pl-6 min-w-[150px]">
 {prayer.status === 'Active' ? (
 <>
 <Button
 variant="outline"
 onClick={() => handleIncrementPrayers(prayer)}
 className="gap-2 border-primary/20 text-primary/90 hover:bg-slate-50"
 >
 <Heart className="w-4 h-4" /> {t("praying", "Praying (")}{prayer.prayersCount || 0})
 </Button>
 <Button
 variant="outline"
 onClick={() => handleMarkAnswered(prayer)}
 className="gap-2 text-[#71717a] dark:text-gray-400 hover:text-primary hover:border-primary/20 hover:bg-slate-50"
 >
 <CheckCircle className="w-4 h-4" /> {t("mark_answered", "Mark Answered")}
 </Button>
 {!prayer.sentiment && (
    <Button
      variant="outline"
      onClick={() => handleAnalyzeSentiment(prayer)}
      disabled={isAnalyzing}
      className="gap-2 text-[#71717a] dark:text-gray-400 hover:text-primary hover:border-primary/20 hover:bg-slate-50"
    >
      <Sparkles className="w-4 h-4" /> Analyze Needs
    </Button>
  )}
 </>
 ) : (
 <div className="flex flex-col items-center justify-center text-primary h-full py-2">
 <Heart className="w-8 h-8 mb-1 fill-primary text-primary" />
 <span className="text-xs font-semibold uppercase tracking-widest tracking-[0.04em]">{t("praise_report", "Praise Report")}</span>
 </div>
 )}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity w-full mt-auto flex justify-center">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewRecord(prayer)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(prayer)}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(prayer.id)} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" /> {t("retract", "Retract")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
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
 <HandHeart className="w-5 h-5 text-primary" /> {t("submit_prayer_petition", "Submit Prayer Petition")}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("your_name_optional", "Your Name (Optional)")}</label>
 <Input
 value={formData.name}
 onChange={e => setFormData({ ...formData, name: e.target.value})}
 className="mt-1"
 placeholder="Anonymous"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("petition_request_details", "Petition / Request Details")}</label>
 <textarea
 value={formData.request}
 onChange={e => setFormData({ ...formData, request: e.target.value})}
 rows={4}
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
 placeholder="e.g. Please pray for fast healing, professional wisdom, family breakthroughs..."
 />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreatePrayer}>{editRecord ? 'Update' : 'Submit Petition'}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeletePrayer}
 title="Retract Prayer Request"
 message="Are you sure you want to completely remove this prayer request from the list? This will remove all counts permanently."
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
 {key === 'name' && value !== 'Anonymous' ? (
 <Link to="/religion/members" className="text-primary hover:underline">{String(value)}</Link>
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
