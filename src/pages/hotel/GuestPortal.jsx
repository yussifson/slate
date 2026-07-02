import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Calendar, Bell, Coffee, Key, MapPin, Search, Sparkles, Send, Bot} from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord} from '@/hooks/useIndustryData';
import { base44} from '@/api/base44Client';
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { toast} from 'react-hot-toast';
import { useAuth} from '@/lib/AuthContext';
import { Badge} from "@/components/ui/badge";
import { generateText } from '@/lib/cloudflareAI';

export default function GuestPortal() {
 const { t} = useTranslation();
 const { user} = useAuth();

 // Real Database Hooks
 const { data: reservations = [], isLoading: isResLoading} = useIndustryRecords('reservation');
 const mutateRecord = useMutateIndustryRecord();

 const [showRequestModal, setShowRequestModal] = useState(false);
 const [requestData, setRequestData] = useState({ type: 'Housekeeping', detail: ''});

 // Map and filter reservations
 // A real system filters by user email/id, but for demo we pick the first
 const mappedRes = reservations.map(r => ({ id: r.id, status: r.status, ...r.data}));
 const activeRes = mappedRes[0]; // active reservation

 const handleCreateRequest = () => {
 if (!requestData.detail.trim()) return toast.error("Please provide request details");

 mutateRecord.mutate({
 recordType: 'request',
 payload: {
 room: activeRes?.roomType || 'TBD',
 type: requestData.type,
 detail: requestData.detail,
 time: 'Just now'
},
 status: 'Pending',
 searchText: `${activeRes?.roomType} ${requestData.type} ${requestData.detail}`
}, {
 onSuccess: () => {
 toast.success(`${requestData.type} request submitted!`);
 setShowRequestModal(false);
 setRequestData({ type: 'Housekeeping', detail: ''});
}
});
};

 if (isResLoading) {
 return <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_your_guest_profile", "Loading your guest profile...")}</div>;
}

 if (!activeRes) {
 return (
 <div className="py-12 text-center max-w-md mx-auto bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Key className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary animate-pulse" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_active_reservations", "No Active Reservations")}</p>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{t(
 "we_couldn_t_find_any_upcoming_",
 "We couldn't find any upcoming or active reservations linked to your account."
 )}</p>
 </div>
 );
}

 return (
 <div className="space-y-6 max-w-5xl mx-auto">
 {/* Header */}
 <div className="bg-gradient-to-r from-primary to-orange-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
 <div className="relative z-10">
 <h1 className="text-2xl md:text-3xl font-semibold mb-2 tracking-[-0.02em]">{t("welcome_back", "Welcome back,")} {activeRes.guest}</h1>
 <p className="text-primary/10 max-w-xl">{t(
 "manage_your_stay_order_room_se",
 "Manage your stay, order room service, and request housekeeping all from your device."
 )}</p>
 </div>
 <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
 <MapPin className="w-64 h-64" />
 </div>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column (Reservation Details) */}
 <div className="col-span-1 lg:col-span-2 space-y-6">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 md:p-5 border-b border-primary/40 bg-muted/50 flex justify-between items-center">
 <h3 className="font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Calendar className="w-5 h-5 text-[#71717a] dark:text-gray-400" /> {t("your_stay_details", "Your Stay Details")}</h3>
 <Badge variant="outline" className={`${activeRes.status === 'Checked-in' ? 'bg-slate-100 text-primary/90 border-primary/20' : 'bg-slate-100 text-primary/90 border-primary/20'}`}>{activeRes.status}</Badge>
 </div>
 <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold mb-1 tracking-[0.04em]">{t("check_in", "Check In")}</p>
 <p className="font-semibold text-lg">{activeRes.checkIn}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold mb-1 tracking-[0.04em]">{t("check_out", "Check Out")}</p>
 <p className="font-semibold text-lg">{activeRes.checkOut}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold mb-1 tracking-[0.04em]">{t("room", "Room")}</p>
 <p className="font-semibold text-lg">{activeRes.roomType}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold mb-1 tracking-[0.04em]">{t("guests", "Guests")}</p>
 <p className="font-semibold text-lg">{activeRes.guestsCount} {t("guest_s", "Guest(s)")}</p>
 </div>
 </div>
 <div className="bg-muted/30 p-5 border-t border-primary/40 flex justify-between items-center">
 <div>
 <p className="text-sm font-medium">{t("reservation_id", "Reservation ID")}</p>
 <p className="font-mono text-[#71717a] dark:text-gray-400 text-sm">{activeRes.resId}</p>
 </div>
 <Button variant="outline">{t("modify_booking", "Modify Booking")}</Button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div onClick={() => { setRequestData({ ...requestData, type: 'Room Service'}); setShowRequestModal(true);}} className="bg-card hover:bg-muted/50 cursor-pointer transition-colors rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
 <Coffee className="w-6 h-6" />
 </div>
 <div>
 <h3 className="font-semibold text-foreground">{t("order_room_service", "Order Room Service")}</h3>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("browse_menu_and_order", "Browse menu and order")}</p>
 </div>
 </div>

 <div onClick={() => { setRequestData({ ...requestData, type: 'Housekeeping'}); setShowRequestModal(true);}} className="bg-card hover:bg-muted/50 cursor-pointer transition-colors rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-12 h-12 rounded-full bg-slate-100 text-primary flex items-center justify-center shrink-0">
 <Bell className="w-6 h-6" />
 </div>
 <div>
 <h3 className="font-semibold text-foreground">{t("request_housekeeping", "Request Housekeeping")}</h3>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("towels_cleaning_etc", "Towels, cleaning, etc.")}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column (Billing info) */}
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <h3 className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("current_bill", "Current Bill")}</h3>
 </div>
 <div className="p-4 space-y-3">
 <div className="flex justify-between text-sm">
 <span className="text-[#71717a] dark:text-gray-400">{t("room_charge", "Room Charge (")}{activeRes.nights} {t("nights", "Nights)")}</span>
 <span className="font-medium">${activeRes.total}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-[#71717a] dark:text-gray-400">{t("taxes_fees", "Taxes & Fees")}</span>
 <span className="font-medium">${(activeRes.total * 0.1).toFixed(2)}</span>
 </div>
 <div className="border-t border-primary/40 pt-3 mt-3 flex justify-between items-center">
 <span className="font-semibold">{t("total_estimated", "Total Estimated")}</span>
 <span className="text-xl font-semibold text-primary">${(activeRes.total * 1.1).toFixed(2)}</span>
 </div>
 <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-white">{t("view_full_folio", "View Full Folio")}</Button>
 </div>
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
  <div className="p-4 border-b border-primary/40 bg-muted/50 flex items-center gap-2">
    <Sparkles className="w-4 h-4 text-primary" />
    <h3 className="font-semibold text-card-foreground">AI Concierge</h3>
  </div>
  <div className="p-4 space-y-4">
    <div className="h-[250px] overflow-y-auto space-y-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-[0.5px] border-black/9 dark:border-white/8">
      {chatLog.map((msg, i) => (
        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {msg.role === 'ai' && <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0"><Bot className="w-3 h-3 text-primary"/></div>}
          <div className={`p-2 rounded-lg text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 border-[0.5px] border-black/9 dark:border-white/8'}`}>
            {msg.text}
          </div>
        </div>
      ))}
      {isChatting && <div className="flex gap-2"><div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0"><Bot className="w-3 h-3 text-primary"/></div><div className="p-2 rounded-lg text-sm bg-white dark:bg-slate-800 border-[0.5px] animate-pulse">...</div></div>}
    </div>
    <div className="flex gap-2">
      <Input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Ask for towels, late checkout..." className="flex-1" />
      <Button onClick={handleSendChat} disabled={isChatting} className="bg-primary hover:bg-primary/90 text-white px-3"><Send className="w-4 h-4"/></Button>
    </div>
  </div>
  </div>

  </div>
  </div>
 {showRequestModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-sm p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Bell className="w-5 h-5 text-primary"/> {t("request", "Request")} {requestData.type}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("details", "Details")}</label>
 <Input value={requestData.detail} onChange={e => setRequestData({ ...requestData, detail: e.target.value})} className="mt-1" placeholder="What do you need?" />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowRequestModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateRequest}>{t("submit", "Submit")}</Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
