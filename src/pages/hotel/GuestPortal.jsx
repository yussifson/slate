import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, Bell, Coffee, Key, MapPin, Search } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';
import { Badge } from "@/components/ui/badge";

export default function GuestPortal() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Real Database Hooks
  const { data: reservations = [], isLoading: isResLoading } = useIndustryRecords('reservation');
  const mutateRecord = useMutateIndustryRecord();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ type: 'Housekeeping', detail: '' });

  // Map and filter reservations
  // A real system filters by user email/id, but for demo we pick the first
  const mappedRes = reservations.map(r => ({ id: r.id, status: r.status, ...r.data }));
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
        setRequestData({ type: 'Housekeeping', detail: '' });
      }
    });
  };

  if (isResLoading) {
    return <div className="py-12 text-center text-muted-foreground">{t("loading_your_guest_profile", "Loading your guest profile...")}</div>;
  }

  if (!activeRes) {
    return (
      <div className="py-12 text-center max-w-md mx-auto bg-card rounded-xl border border-border p-6 shadow-sm">
        <Key className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-600 animate-pulse" />
        <p className="font-semibold text-lg text-card-foreground">{t("no_active_reservations", "No Active Reservations")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t(
          "we_couldn_t_find_any_upcoming_",
          "We couldn't find any upcoming or active reservations linked to your account."
        )}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("welcome_back", "Welcome back,")} {activeRes.guest}</h1>
          <p className="text-amber-100 max-w-xl">{t(
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
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-border bg-muted/50 flex justify-between items-center">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> {t("your_stay_details", "Your Stay Details")}</h3>
              <Badge variant="outline" className={`${activeRes.status === 'Checked-in' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>{activeRes.status}</Badge>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">{t("check_in", "Check In")}</p>
                <p className="font-semibold text-lg">{activeRes.checkIn}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">{t("check_out", "Check Out")}</p>
                <p className="font-semibold text-lg">{activeRes.checkOut}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">{t("room", "Room")}</p>
                <p className="font-semibold text-lg">{activeRes.roomType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">{t("guests", "Guests")}</p>
                <p className="font-semibold text-lg">{activeRes.guestsCount} {t("guest_s", "Guest(s)")}</p>
              </div>
            </div>
            <div className="bg-muted/30 p-5 border-t border-border flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{t("reservation_id", "Reservation ID")}</p>
                <p className="font-mono text-muted-foreground text-sm">{activeRes.resId}</p>
              </div>
              <Button variant="outline">{t("modify_booking", "Modify Booking")}</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div onClick={() => { setRequestData({ ...requestData, type: 'Room Service' }); setShowRequestModal(true); }} className="bg-card hover:bg-muted/50 cursor-pointer transition-colors rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                 <Coffee className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="font-bold text-foreground">{t("order_room_service", "Order Room Service")}</h3>
                 <p className="text-xs text-muted-foreground">{t("browse_menu_and_order", "Browse menu and order")}</p>
               </div>
            </div>

            <div onClick={() => { setRequestData({ ...requestData, type: 'Housekeeping' }); setShowRequestModal(true); }} className="bg-card hover:bg-muted/50 cursor-pointer transition-colors rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                 <Bell className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="font-bold text-foreground">{t("request_housekeeping", "Request Housekeeping")}</h3>
                 <p className="text-xs text-muted-foreground">{t("towels_cleaning_etc", "Towels, cleaning, etc.")}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column (Billing info) */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h3 className="font-bold text-card-foreground">{t("current_bill", "Current Bill")}</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("room_charge", "Room Charge (")}{activeRes.nights} {t("nights", "Nights)")}</span>
                <span className="font-medium">${activeRes.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("taxes_fees", "Taxes & Fees")}</span>
                <span className="font-medium">${(activeRes.total * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                <span className="font-bold">{t("total_estimated", "Total Estimated")}</span>
                <span className="text-xl font-bold text-amber-600">${(activeRes.total * 1.1).toFixed(2)}</span>
              </div>
              <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white">{t("view_full_folio", "View Full Folio")}</Button>
            </div>
          </div>
        </div>
      </div>
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600"/> {t("request", "Request")} {requestData.type}
            </h2>
            <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("details", "Details")}</label>
                 <Input value={requestData.detail} onChange={e => setRequestData({ ...requestData, detail: e.target.value })} className="mt-1" placeholder="What do you need?" />
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowRequestModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateRequest}>{t("submit", "Submit")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
