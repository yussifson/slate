import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Heart, Calendar, DollarSign, Search, Plus, MapPin } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';
import { Badge } from "@/components/ui/badge";

export default function MemberPortal() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Real Database Hooks
  const { data: dbEvents = [], isLoading: isEventsLoading } = useIndustryRecords('event');
  const { data: dbTithes = [], isLoading: isTithesLoading } = useIndustryRecords('tithe');
  const mutateRecord = useMutateIndustryRecord();

  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [prayerData, setPrayerData] = useState({ title: '', detail: '' });

  const events = dbEvents.map(r => ({ id: r.id, status: r.status, ...r.data }));

  // For demo, we filter tithes for a mock user name. In a real app this uses user.email or user.id
  const myTithes = dbTithes.map(r => ({ id: r.id, ...r.data }));
  const totalGiven = myTithes.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const handleCreatePrayer = () => {
    if (!prayerData.title.trim()) return toast.error("Please provide a prayer title");

    mutateRecord.mutate({
      recordType: 'prayer',
      payload: {
        title: prayerData.title,
        detail: prayerData.detail,
        date: new Date().toISOString().split('T')[0],
        member: user?.name || 'Anonymous'
      },
      status: 'active',
      searchText: `${prayerData.title} ${prayerData.detail}`
    }, {
      onSuccess: () => {
        toast.success(`Prayer request submitted successfully!`);
        setShowPrayerModal(false);
        setPrayerData({ title: '', detail: '' });
      }
    });
  };

  const isLoading = isEventsLoading || isTithesLoading;

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">{t("loading_your_member_profile", "Loading your member profile...")}</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("welcome_to_your_church_portal", "Welcome to Your Church Portal")}</h1>
          <p className="text-primary/10 max-w-xl">{t(
            "stay_connected_with_your_churc",
            "Stay connected with your church family. View upcoming events, track your giving, and submit prayer requests."
          )}</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Heart className="w-64 h-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Events & Prayers) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-border bg-muted/50 flex justify-between items-center">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> {t("upcoming_gatherings", "Upcoming Gatherings")}</h3>
            </div>
            <div className="p-0">
               {events.length === 0 ? (
                 <div className="py-8 text-center text-muted-foreground">{t("no_upcoming_events_scheduled", "No upcoming events scheduled.")}</div>
               ) : (
                 <div className="divide-y divide-border">
                   {events.slice(0, 3).map(event => {
                     return (
                       <div key={event.id} className="p-4 flex gap-4 hover:bg-muted/30 transition-colors">
                         <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-primary/20 text-primary/90 dark:text-primary/70 rounded-lg p-3 min-w-[70px] shrink-0">
                           <span className="text-[10px] font-bold uppercase">{event.date?.split(' ')[0] || 'Upcoming'}</span>
                           <span className="text-xl font-black">{event.date?.includes(' ') ? event.date.split(' ')[1]?.replace(',', '') : ''}</span>
                         </div>
                         <div>
                           <h4 className="font-bold text-foreground">{event.title}</h4>
                           <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {event.venue}</p>
                           <p className="text-xs text-muted-foreground mt-0.5">{event.time}</p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
            {events.length > 3 && (
               <div className="p-3 border-t border-border text-center">
                  <Button variant="ghost" className="w-full text-primary">{t("view_all_events", "View All Events")}</Button>
               </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col items-center justify-center text-center">
             <Heart className="w-10 h-10 text-rose-500 mb-3" />
             <h3 className="font-bold text-lg text-foreground mb-2">{t("need_prayer", "Need Prayer?")}</h3>
             <p className="text-sm text-muted-foreground mb-4 max-w-sm">{t(
               "submit_your_prayer_requests_so",
               "Submit your prayer requests so our prayer team and pastors can stand with you."
             )}</p>
             <Button onClick={() => setShowPrayerModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white">{t("submit_prayer_request", "Submit Prayer Request")}</Button>
          </div>
        </div>

        {/* Right Column (Giving Info) */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> {t("my_giving", "My Giving")}</h3>
            </div>
            <div className="p-5 flex flex-col items-center border-b border-border">
               <p className="text-sm text-muted-foreground mb-1">{t("total_contributions", "Total Contributions")}</p>
               <p className="text-3xl font-black text-primary">${totalGiven.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 space-y-3">
               <h4 className="font-semibold text-sm mb-2">{t("recent_giving", "Recent Giving")}</h4>
               {myTithes.length === 0 ? (
                 <p className="text-xs text-muted-foreground text-center">{t("no_giving_history_found", "No giving history found.")}</p>
               ) : (
                 myTithes.slice(0, 3).map(tithe => {
                   return (
                     <div key={tithe.id} className="flex justify-between items-center text-sm">
                       <div>
                         <p className="font-medium">{tithe.type}</p>
                         <p className="text-[10px] text-muted-foreground">{tithe.date}</p>
                       </div>
                       <span className="font-bold">${tithe.amount}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500"/> {t("submit_prayer_request", "Submit Prayer Request")}
            </h2>
            <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("request_title", "Request Title")}</label>
                 <Input value={prayerData.title} onChange={e => setPrayerData({ ...prayerData, title: e.target.value })} className="mt-1" placeholder="e.g. Healing for my family" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("details", "Details")}</label>
                 <textarea 
                    value={prayerData.detail} 
                    onChange={e => setPrayerData({ ...prayerData, detail: e.target.value })} 
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[100px]" 
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
