import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Bell, Search, CheckCircle, Clock, AlertTriangle, Coffee, Wrench, Plus, Trash2, Sparkles, MessageSquare, BarChart, Car, Utensils } from 'lucide-react';
import { Button} from '@/components/ui/button';
import { generateText } from '@/lib/cloudflareAI';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';

const statusColors = {
 'Pending': 'bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 animate-pulse',
 'In Progress': 'bg-slate-100 dark:bg-primary/20 text-primary/90 dark:text-primary/70',
 'Completed': 'bg-slate-100 dark:bg-primary/20 text-primary/90 dark:text-primary/70'
};

const requestIcons = {
 'Room Service': <Coffee className="w-5 h-5" />,
 'Taxi Booking': <Car className="w-5 h-5" />,
 'Restaurant Reservation': <Utensils className="w-5 h-5" />,
 'Other': <Bell className="w-5 h-5" />
};

export default function GuestRequests() {
 const { t} = useTranslation();
 // Supabase Real-time Sync Hooks
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('request');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 // Map database records
 const requests = dbRecords.map(r => ({ id: r.id, status: r.status || 'Pending', ...r.data}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [activeTab, setActiveTab] = useState('requests');

 // Feedback State
 const { data: feedbackRecords = [], isLoading: isFeedbackLoading } = useIndustryRecords('hotel_feedback');
 const feedback = feedbackRecords.map(r => ({ id: r.id, ...r.data }));
 const [showFeedbackModal, setShowFeedbackModal] = useState(false);
 const [aiAnalysis, setAiAnalysis] = useState(null);
 const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);

 const handleAnalyzeFeedback = async () => {
   if (feedback.length === 0) {
     toast.error("No feedback to analyze");
     return;
   }
   setIsAnalyzingFeedback(true);
   const tId = toast.loading('AI is analyzing feedback...');
   try {
     const feedbackText = feedback.map(f => `Rating: ${f.rating}/5, Comment: "${f.comment}"`).join('\\n');
     const prompt = `Analyze the following hotel guest feedback. Cluster the feedback into themes and explicitly flag any negative sentiment or recurring complaints. Provide a structured summary.\\n\\nFeedback:\\n${feedbackText}`;
     const result = await generateText(prompt);
     setAiAnalysis(result);
     setShowFeedbackModal(true);
     toast.success('Analysis complete!', { id: tId });
   } catch (err) {
     toast.error('AI analysis failed: ' + err.message, { id: tId });
   } finally {
     setIsAnalyzingFeedback(false);
   }
 };

 // Form State
 const [formData, setFormData] = useState({
 room: '',
 type: 'Room Service',
 detail: ''
});

 const handleCreateRequest = () => {
 if (!formData.room.trim() || !formData.detail.trim()) {
 return toast.error("Please fill in all fields");
}

 const payload = {
 room: formData.room,
 type: formData.type,
 detail: formData.detail,
 time: 'Just now'
};

 mutateRecord.mutate({
 recordType: 'request',
 payload,
 status: 'Pending',
 searchText: `${formData.room} ${formData.type} ${formData.detail}`
}, {
 onSuccess: () => {
 toast.success('Guest request logged successfully!');
 setShowModal(false);
 setFormData({ room: '', type: 'Room Service', detail: ''});
},
 onError: (err) => {
 toast.error('Failed to log request: ' + err.message);
}
});
};

 const handleUpdateStatus = (req, newStatus) => {
 const updatedPayload = { ...req, status: newStatus };
 delete updatedPayload.id;

 mutateRecord.mutate({
 id: req.id,
 recordType: 'request',
 payload: updatedPayload,
 status: newStatus,
 searchText: `${req.room} ${req.type} ${req.detail}`
}, {
 onSuccess: () => {
 toast.success(`Request marked as ${newStatus}`);
}
});
};

 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const handleAIAnalyze = async (req) => {
   setIsAnalyzing(true);
   const tId = toast.loading('AI analyzing request urgency...');
   try {
     const prompt = `Analyze this hotel guest request for urgency and sentiment.
Request: "${req.detail}" (Type: ${req.type})
Reply with EXACTLY ONE of these tags: URGENT (if safety, severe complaint, VIP, immediate maintenance), NORMAL, or LOW.`;
     const result = await generateText(prompt);
     const tag = result.trim().toUpperCase();
     
     const updatedPayload = { ...req, urgency: tag };
     delete updatedPayload.id;

     mutateRecord.mutate({
       id: req.id,
       recordType: 'request',
       payload: updatedPayload,
       status: req.status,
       searchText: `${req.room} ${req.type} ${req.detail}`
     }, {
       onSuccess: () => {
         toast.success(`AI analyzed: ${tag}`, { id: tId });
       }
     });
   } catch (err) {
     toast.error('AI analysis failed', { id: tId });
   } finally {
     setIsAnalyzing(false);
   }
 };

 const handleDeleteRequest = (id) => {
 if (window.confirm('Are you sure you want to delete this request?')) {
 deleteRecord.mutate({ id, recordType: 'request'}, {
 onSuccess: () => {
 toast.success('Request deleted');
}
});
}
};

 const filtered = requests.filter(r => 
 r.room?.includes(search) || 
 r.type?.toLowerCase().includes(search.toLowerCase()) ||
 r.detail?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(68,49,153,0.08) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("concierge_requests", "Concierge & Requests")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "manage_requests_and_feedback",
 "Manage guest requests and analyze feedback"
 )}</p>
 </div>
 <div className="flex gap-2">
   <Button 
     onClick={() => setActiveTab('requests')} 
     variant={activeTab === 'requests' ? 'default' : 'outline'}
     className="gap-2"
   >
     <Bell className="w-4 h-4" /> Requests
   </Button>
   <Button 
     onClick={() => setActiveTab('feedback')} 
     variant={activeTab === 'feedback' ? 'default' : 'outline'}
     className="gap-2"
   >
     <MessageSquare className="w-4 h-4" /> Feedback
   </Button>
   {activeTab === 'requests' && (
     <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white ml-2">
       <Plus className="w-4 h-4" /> {t("new_request", "New Request")}
     </Button>
   )}
   {activeTab === 'feedback' && (
     <Button onClick={handleAnalyzeFeedback} disabled={isAnalyzingFeedback} className="gap-2 bg-primary hover:bg-primary/90 text-white ml-2">
       <BarChart className="w-4 h-4" /> {t("analyze_sentiment", "Analyze Sentiment")}
     </Button>
   )}
 </div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search by room, type or description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 {activeTab === 'requests' ? (
   isDbLoading ? (
   <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_requests", "Loading requests...")}</div>
   ) : filtered.length === 0 ? (
   <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
   <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 animate-bounce" />
   <p className="font-semibold">{t("no_guest_requests_found", "No guest requests found.")}</p>
   <p className="text-xs mt-1 tracking-[0.04em]">{t(
   "log_a_new_request_using_the_ne",
   "Log a new request using the \"New Request\" button."
   )}</p>
   </div>
   ) : (
   <div className="divide-y divide-border">
   {filtered.map(req => {
   return (
   <div key={req.id} className="p-4 sm:p-6 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
   <div className="flex gap-4 items-start">
   <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 text-primary dark:text-primary/70`}>
   {requestIcons[req.type] || <Bell className="w-5 h-5" />}
   </div>
   <div>
   <div className="flex items-center gap-3 mb-1">
   <span className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("room", "Room")} {req.room}</span>
   <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[req.status] || 'bg-muted'}`}>{req.status}</span>
   {req.urgency === 'URGENT' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> URGENT VIP</span>}
   {req.urgency === 'NORMAL' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-700">NORMAL</span>}
   {req.urgency === 'LOW' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-500">LOW</span>}
   </div>
   <p className="text-sm font-medium text-foreground">{req.type}: <span className="font-normal text-[#71717a] dark:text-gray-400">{req.detail}</span></p>
   <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 flex items-center gap-2 tracking-[0.04em]"><Clock className="w-3 h-3"/> {req.time || 'Just now'}</p>
   </div>
   </div>
   <div className="flex gap-2 w-full sm:w-auto items-center justify-end">
   {!req.urgency && (
     <Button variant="outline" size="sm" onClick={() => handleAIAnalyze(req)} disabled={isAnalyzing} className="gap-2 text-[#71717a] dark:text-gray-400 border-primary/30 hover:text-primary hover:bg-primary/10 transition-colors">
       <Sparkles className="w-4 h-4" /> AI Triage
     </Button>
   )}
   {req.status === 'Pending' && (
   <Button onClick={() => handleUpdateStatus(req, 'In Progress')} size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">{t("accept_task", "Accept Task")}</Button>
   )}
   {req.status === 'In Progress' && (
   <Button onClick={() => handleUpdateStatus(req, 'Completed')} size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white gap-2"><CheckCircle className="w-4 h-4"/> {t("mark_complete", "Mark Complete")}</Button>
   )}
   {req.status === 'Completed' && (
   <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 bg-muted px-3 py-1 rounded-md tracking-[0.04em]">{t("fulfilled", "Fulfilled")}</span>
   )}
   <Button onClick={() => handleDeleteRequest(req.id)} size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
   <Trash2 className="w-4 h-4" />
   </Button>
   </div>
   </div>
   );
  })}
   </div>
   )
 ) : (
   isFeedbackLoading ? (
     <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_feedback", "Loading feedback...")}</div>
   ) : feedback.length === 0 ? (
     <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
       <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
       <p className="font-semibold">{t("no_feedback_found", "No guest feedback found.")}</p>
     </div>
   ) : (
     <div className="divide-y divide-border">
       {feedback.map(item => (
         <div key={item.id} className="p-4 sm:p-6 hover:bg-muted/40 transition-colors flex flex-col gap-2">
           <div className="flex items-center justify-between">
             <span className="font-semibold text-card-foreground">{item.guest_name || 'Anonymous'}</span>
             <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
               {item.rating}/5 Rating
             </span>
           </div>
           <p className="text-sm text-foreground">{item.comment}</p>
           {item.sentiment && (
             <p className="text-xs text-[#71717a] mt-1">Sentiment: {item.sentiment}</p>
           )}
         </div>
       ))}
     </div>
   )
 )}
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-sm p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Bell className="w-5 h-5 text-primary"/> {t("log_guest_request", "Log Guest Request")}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("room_number", "Room Number")}</label>
 <Input value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value})} className="mt-1" placeholder="e.g. 104" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("request_type", "Request Type")}</label>
 <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("room_service", "Room Service")}</option>
 <option>{t("taxi_booking", "Taxi Booking")}</option>
 <option>{t("restaurant_reservation", "Restaurant Reservation")}</option>
 <option>{t("other", "Other")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("details", "Details")}</label>
 <Input value={formData.detail} onChange={e => setFormData({ ...formData, detail: e.target.value})} className="mt-1" placeholder="e.g. Extra pillows & blanket" />
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateRequest}>{t("log_request", "Log Request")}</Button>
 </div>
 </div>
 </div>
 )}

 {showFeedbackModal && (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
     <div className="bg-card rounded-2xl w-full max-w-2xl p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200 flex flex-col max-h-[80vh]">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Feedback Analysis</h2>
         <Button variant="ghost" size="sm" onClick={() => setShowFeedbackModal(false)}>Close</Button>
       </div>
       <div className="overflow-y-auto whitespace-pre-wrap text-sm text-foreground bg-muted/50 p-4 rounded-lg border border-border">
         {aiAnalysis}
       </div>
       <div className="pt-2">
         <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={() => setShowFeedbackModal(false)}>Done</Button>
       </div>
     </div>
   </div>
 )}
 </div>
 );
}

