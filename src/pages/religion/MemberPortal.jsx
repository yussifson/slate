import { useTranslation} from "react-i18next";
import { useState, useEffect } from 'react';
import { Heart, Calendar, DollarSign, Search, Plus, MapPin} from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord} from '@/hooks/useIndustryData';
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { toast} from 'react-hot-toast';
import { useAuth} from '@/lib/AuthContext';
import { Badge} from "@/components/ui/badge";

import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function MemberPortal() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const companyId = useCompanyId();
 const powerSync = usePowerSync();

 const [events, setEvents] = useState([]);
 const [myDonations, setMyDonations] = useState([]);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   let active = true;
   const fetchData = async () => {
     setIsLoading(true);
     try {
       const evData = await powerSync.getAll('SELECT * FROM univ_religion_events WHERE company_id = ? ORDER BY date ASC LIMIT 10', [companyId]);
       if(active) setEvents(evData || []);

       const donData = await powerSync.getAll('SELECT * FROM univ_religion_donations WHERE company_id = ? AND member_name = ?', [companyId, user?.name || '']);
       if(active) setMyDonations(donData || []);
     } catch(e){}
     setIsLoading(false);
   };
   if (companyId) fetchData();
   return () => { active = false; };
 }, [companyId, user?.name]);

 const [showPrayerModal, setShowPrayerModal] = useState(false);
 const [prayerData, setPrayerData] = useState({ title: '', detail: ''});

 const totalGiven = myDonations.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

 const handleCreatePrayer = async () => {
 if (!prayerData.title.trim()) return toast.error("Please provide a prayer title");

 try {
   await powerSync.execute(
     `INSERT INTO univ_religion_prayers (id, created_at, company_id, requestor, prayer, status) VALUES (gen_random_uuid(), datetime('now'), ?, ?, ?, 'Active')`,
     [companyId, user?.name || 'Anonymous', prayerData.title + ' - ' + prayerData.detail]
   );
   toast.success(`Prayer request submitted successfully!`);
   setShowPrayerModal(false);
   setPrayerData({ title: '', detail: ''});
 } catch (err) {
   toast.error('Failed to submit prayer: ' + err.message);
 }
};

 if (isLoading) {
 return <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_your_member_profile", "Loading your member profile...")}</div>;
}

 return (
 <div className="space-y-6 max-w-5xl mx-auto">
 {/* Header */}
 <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
 <div className="relative z-10">
 <h1 className="text-2xl md:text-3xl font-semibold mb-2 tracking-[-0.02em]">{t("welcome_to_your_religion_portal", "Welcome to Your Religion Portal")}</h1>
 <p className="text-primary/10 max-w-xl">{t(
 "stay_connected_with_your_churc",
 "Stay connected with your religious community. View upcoming events, track your giving, and submit prayer requests."
 )}</p>
 </div>
 <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
 <Heart className="w-64 h-64" />
 </div>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column (Events & Prayers) */}
 <div className="col-span-1 lg:col-span-2 space-y-6">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 md:p-5 border-b border-primary/40 bg-muted/50 flex justify-between items-center">
 <h3 className="font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Calendar className="w-5 h-5 text-primary" /> {t("upcoming_gatherings", "Upcoming Gatherings")}</h3>
 </div>
 <div className="p-0">
 {events.length === 0 ? (
 <div className="py-8 text-center text-[#71717a] dark:text-gray-400">{t("no_upcoming_events_scheduled", "No upcoming events scheduled.")}</div>
 ) : (
 <div className="divide-y divide-border">
 {events.slice(0, 3).map(event => {
 return (
 <div key={event.id} className="p-4 flex gap-4 hover:bg-muted/30 transition-colors">
 <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 text-primary/90 dark:text-primary/70 rounded-xl p-3 min-w-[70px] shrink-0">
 <span className="text-[10px] font-semibold uppercase tracking-[0.04em]">{event.date?.split(' ')[0] || 'Upcoming'}</span>
 <span className="text-xl font-black">{event.date?.includes(' ') ? event.date.split(' ')[1]?.replace(',', '') : ''}</span>
 </div>
 <div>
 <h4 className="font-semibold text-foreground">{event.title}</h4>
 <p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 mt-1 tracking-[0.04em]"><MapPin className="w-3 h-3"/> {event.venue}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{event.time}</p>
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 {events.length > 3 && (
 <div className="p-3 border-t border-primary/40 text-center">
 <Button variant="ghost" className="w-full text-primary">{t("view_all_events", "View All Events")}</Button>
 </div>
 )}
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col items-center justify-center text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Heart className="w-10 h-10 text-rose-500 mb-3" />
 <h3 className="font-semibold text-lg text-foreground mb-2">{t("need_prayer", "Need Prayer?")}</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-4 max-w-sm">{t(
 "submit_your_prayer_requests_so",
 "Submit your prayer requests so our prayer team and pastors can stand with you."
 )}</p>
 <Button onClick={() => setShowPrayerModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white">{t("submit_prayer_request", "Submit Prayer Request")}</Button>
 </div>
 </div>

 {/* Right Column (Giving Info) */}
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <h3 className="font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><DollarSign className="w-5 h-5 text-primary" /> {t("my_giving", "My Giving")}</h3>
 </div>
 <div className="p-5 flex flex-col items-center border-b border-primary/40">
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-1">{t("total_contributions", "Total Contributions")}</p>
 <p className="text-3xl font-black text-primary tracking-[-0.02em]">${totalGiven.toLocaleString(undefined, { minimumFractionDigits: 2})}</p>
 </div>
 <div className="p-4 space-y-3">
 <h4 className="font-semibold text-sm mb-2">{t("recent_giving", "Recent Giving")}</h4>
 {myDonations.length === 0 ? (
 <p className="text-xs text-[#71717a] dark:text-gray-400 text-center tracking-[0.04em]">{t("no_giving_history_found", "No giving history found.")}</p>
 ) : (
 myDonations.slice(0, 3).map(donation => {
 return (
 <div key={donation.id} className="flex justify-between items-center text-sm">
 <div>
 <p className="font-medium">{donation.type}</p>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400">{donation.date}</p>
 </div>
 <span className="font-semibold">${donation.amount}</span>
 </div>
 );
})
 )}
 <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-white">{t("give_now", "Give Now")}</Button>
 </div>
 </div>
 </div>
 </div>
 {showPrayerModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-sm p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Heart className="w-5 h-5 text-rose-500"/> {t("submit_prayer_request", "Submit Prayer Request")}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("request_title", "Request Title")}</label>
 <Input value={prayerData.title} onChange={e => setPrayerData({ ...prayerData, title: e.target.value})} className="mt-1" placeholder="e.g. Healing for my family" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("details", "Details")}</label>
 <textarea 
 value={prayerData.detail} 
 onChange={e => setPrayerData({ ...prayerData, detail: e.target.value})} 
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground min-h-[100px]" 
 placeholder="Share what's on your heart..." 
 />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowPrayerModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={handleCreatePrayer}>{t("submit", "Submit")}</Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
