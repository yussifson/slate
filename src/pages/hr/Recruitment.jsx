import { useTranslation} from "react-i18next";
import { useState, useEffect } from 'react';
import { Briefcase, Search, Plus, CheckCircle2, XCircle, Trash2, MoreVertical, Edit, Eye} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { useMeeting} from '@/hooks/integrations/useMeeting';
import { useCalendar} from '@/hooks/integrations/useCalendar';
import { useAuth} from '@/lib/AuthContext';
import { useContracts} from "@/hooks/integrations/useContracts";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Video, FileSignature} from "lucide-react";
import { usePowerSync } from '@powersync/react';

export default function Recruitment() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { sendContract} = useContracts();
 const { user} = useAuth();
 const { generateMeetingLink} = useMeeting();
 const { syncEvent} = useCalendar();
 const powerSync = usePowerSync();

 const [candidates, setCandidates] = useState([]);
 const [isDbLoading, setIsDbLoading] = useState(true);

 useEffect(() => {
   let active = true;
   const fetchCandidates = async () => {
     setIsDbLoading(true);
     try {
       const res = await powerSync.execute('SELECT * FROM univ_hr_candidates WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
       if(active) setCandidates(res.rows._array || Array.from(res.rows));
     } catch(e){}
     setIsDbLoading(false);
   };
   if (companyId) fetchCandidates();
   return () => { active = false; };
 }, [companyId]);

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editTargetId, setEditTargetId] = useState(null);
 const [viewTargetId, setViewTargetId] = useState(null);

 const [formData, setFormData] = useState({
 name: '',
 position: 'Frontend Engineer',
 department: 'Engineering',
 email: '',
 phone: '',
 notes: ''
});

 const handleCreateOrUpdateCandidate = async () => {
 if (!formData.name.trim()) return toast.error("Please enter a name");
 
 try {
   if (editTargetId) {
     await powerSync.execute(`UPDATE univ_hr_candidates SET name=?, email=?, phone=?, notes=? WHERE id=?`, 
       [formData.name, formData.email, formData.phone, formData.notes, editTargetId]
     );
     toast.success('Candidate updated successfully!');
   } else {
     await powerSync.execute(`INSERT INTO univ_hr_candidates (id, created_at, company_id, name, email, phone, stage, notes) VALUES (gen_random_uuid(), NOW(), ?, ?, ?, ?, 'Applied', ?)`, 
       [companyId, formData.name, formData.email, formData.phone, formData.notes]
     );
     toast.success('Candidate added successfully!');
   }
   setShowModal(false);
   setEditTargetId(null);
   setFormData({ name: '', position: 'Frontend Engineer', department: 'Engineering', email: '', phone: '', notes: ''});
   
   // Optimistic update hint
   setCandidates([...candidates]);
 } catch (err) {
   toast.error('Failed: ' + err.message);
 }
};

 const openEdit = (cand) => {
 setFormData({
 name: cand.name || '',
 position: cand.position || 'Frontend Engineer',
 department: cand.department || 'Engineering',
 email: cand.email || '',
 phone: cand.phone || '',
 notes: cand.notes || ''
});
 setEditTargetId(cand.id);
 setShowModal(true);
};

 const openAdd = () => {
 setFormData({ name: '', position: 'Frontend Engineer', department: 'Engineering', email: '', phone: '', notes: ''});
 setEditTargetId(null);
 setShowModal(true);
};

 const handleUpdateStage = async (candidate, newStage) => {
 try {
   await powerSync.execute(`UPDATE univ_hr_candidates SET stage=? WHERE id=?`, [newStage, candidate.id]);
   toast.success(`Candidate moved to ${newStage}`);
   setCandidates(candidates.map(c => c.id === candidate.id ? { ...c, stage: newStage } : c));

   if (newStage === 'Interview') {
     generateMeetingLink({
       companyId: user?.company_id,
       provider: 'zoom',
       topic: `Interview with ${candidate.name}`,
       duration: 60,
       startTime: new Date(Date.now() + 86400000).toISOString()
     }).then(meetingData => {
       syncEvent({
         companyId: user?.company_id,
         provider: 'google',
         eventDetails: {
           title: `Interview: ${candidate.name}`,
           startTime: new Date(Date.now() + 86400000).toISOString(),
           endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
           description: `Zoom Link: ${meetingData?.join_url}`,
           attendees: [candidate.email]
         }
       }).catch(console.error);
     }).catch(console.error);
   }
 } catch (err) {
   toast.error('Failed to update stage: ' + err.message);
 }
};

 const handleDelete = async () => {
 if (!deleteTargetId) return;
 try {
   await powerSync.execute(`DELETE FROM univ_hr_candidates WHERE id=?`, [deleteTargetId]);
   toast.success('Candidate removed!');
   setDeleteTargetId(null);
   setCandidates(candidates.filter(c => c.id !== deleteTargetId));
 } catch (err) {
   toast.error('Failed to remove: ' + err.message);
 }
};

 const filtered = candidates.filter(c => 
 c.name?.toLowerCase().includes(search.toLowerCase()) || 
 c.position?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("recruitment", "Recruitment")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_job_postings_and_candid", "Manage job postings and candidates")}</p>
 </div>
 <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Briefcase className="w-4 h-4" /> {t("add_candidate", "Add Candidate")}
 </Button>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("total_applicants", "Total Applicants")}</p>
 <h2 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{candidates.length}</h2>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("in_screening", "In Screening")}</p>
 <h2 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{candidates.filter(c => c.stage === 'Screening').length}</h2>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("interviews", "Interviews")}</p>
 <h2 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{candidates.filter(c => c.stage === 'Interview').length}</h2>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("offers", "Offers")}</p>
 <h2 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{candidates.filter(c => c.stage === 'Offer').length}</h2>
 </div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50 flex gap-4 items-center">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="p-4 overflow-y-auto space-y-3">
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_pipeline", "Loading pipeline...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("pipeline_is_empty", "Pipeline is empty")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t("add_a_candidate_to_get_started", "Add a candidate to get started.")}</p>
 </div>
 ) : filtered.map(cand => {
 return (
 <div key={cand.id} className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-4 flex items-center justify-between transition- bg-background group">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-primary font-semibold">
 {cand.name.charAt(0)}
 </div>
 <div>
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{cand.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{cand.position}• {cand.department} {t("applied", "• Applied:")} {cand.appliedDate}</p>
 </div>
 </div>
 <div className="text-center px-4">
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{t("stage", "Stage")}</p>
 <select
 value={cand.stage}
 onChange={e => handleUpdateStage(cand, e.target.value)}
 className={`text-xs font-semibold px-2 py-1 rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-input ${
 cand.stage === 'Offer' ? 'bg-slate-100 text-primary/90 dark:bg-primary/20 dark:text-primary-foreground' :
 cand.stage === 'Hired' ? 'bg-slate-100 text-primary/90 dark:bg-primary/20 dark:text-primary-foreground' :
 cand.stage === 'Interview' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 
 cand.stage === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-muted text-foreground'
}`}
 >
 <option>{t("applied", "Applied")}</option>
 <option>{t("screening", "Screening")}</option>
 <option>{t("interview", "Interview")}</option>
 <option>{t("offer", "Offer")}</option>
 <option>{t("hired", "Hired")}</option>
 <option>{t("rejected", "Rejected")}</option>
 </select>
 </div>
 <div className="flex gap-2">
 <Button onClick={() => handleUpdateStage(cand, 'Hired')} size="sm" variant="outline" className="text-primary border-primary/20 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-primary/20 dark:border-primary/30 px-2"><CheckCircle2 className="w-4 h-4"/></Button>
 <Button onClick={() => handleUpdateStage(cand, 'Rejected')} size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800/50 dark:hover:bg-red-900/30 px-2"><XCircle className="w-4 h-4"/></Button>
 <Button onClick={() => setDeleteTargetId(cand.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 px-2 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></Button>
 </div>
 </div>
 );
})}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{editTargetId ? 'Edit Candidate' : 'Add Candidate'}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("candidate_name", "Candidate Name")}</label>
 <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" className="mt-1" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("position", "Position")}</label>
 <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("department", "Department")}</label>
 <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="mt-1" />
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("email", "Email")}</label>
 <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("phone", "Phone")}</label>
 <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("notes", "Notes")}</label>
 <textarea 
 value={formData.notes} 
 onChange={e => setFormData({...formData, notes: e.target.value})} 
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm h-16 resize-none"
 />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateOrUpdateCandidate}>{editTargetId ? 'Save Changes' : 'Add Candidate'}</Button>
 </div>
 </div>
 </div>
 )}
 {viewTargetId && (
 <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("candidate_details", "Candidate Details")}</SheetTitle>
 <SheetDescription>{t("read_only_view_of_candidate_re", "Read-only view of candidate record.")}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {(() => {
 const cand = candidates.find(c => c.id === viewTargetId);
 if (!cand) return null;
 return (
 <div className="space-y-4 text-sm">
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("name", "Name:")}</span> <p className="font-medium"><Link to="/employees" className="hover:underline text-primary">{cand.name}</Link></p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("position", "Position:")}</span> <p className="font-medium">{cand.position}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("department", "Department:")}</span> <p className="font-medium">{cand.department}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("email", "Email:")}</span> <p className="font-medium">{cand.email}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("phone", "Phone:")}</span> <p className="font-medium">{cand.phone}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("applied_date", "Applied Date:")}</span> <p className="font-medium">{cand.appliedDate}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("stage", "Stage:")}</span> <p className="font-medium">{cand.stage}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("notes", "Notes:")}</span> <p className="font-medium">{cand.notes}</p></div>
 </div>
 );
})()}
 </div>
 </SheetContent>
 </Sheet>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDelete}
 title="Remove Candidate"
 message="Are you sure you want to completely remove this candidate from the pipeline?"
 />
 </div>
 );
}
