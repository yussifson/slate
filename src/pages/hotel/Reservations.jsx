import { useTranslation} from "react-i18next";
import { useState, useEffect } from 'react';
import { Calendar, Search, Plus, Clock, Trash2, Sparkles, RefreshCcw, Check, Cloud } from 'lucide-react';
import { Button} from '@/components/ui/button';
import { generateText } from '@/lib/cloudflareAI';
import { Input} from '@/components/ui/input';
import { powerSync } from '@/api/PowerSyncConnector';
import ChannelManagerAPI from '@/api/ChannelManagerAPI';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import { Link} from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { MoreVertical, FileText, Edit, Activity, User, CreditCard} from 'lucide-react';
import { usePayment} from '@/hooks/integrations/usePayment';
import { useCompanyId} from '@/hooks/useCompanyId';
import { useNotifications} from "@/hooks/integrations/useNotifications";
import { MessageSquare} from "lucide-react";

const statusColors = {
 'Checked-in': 'bg-slate-100 text-primary/90',
 'Confirmed': 'bg-slate-100 text-primary/90',
 'Checked-out': 'bg-muted text-foreground',
 'Cancelled': 'bg-red-100 text-red-700'
};

export default function Reservations() {
 const { t} = useTranslation();
 const { notifyTeam} = useNotifications();
 // Supabase Real-time Sync Hooks
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('reservation');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();
 const companyId = useCompanyId();
 const { processPayment} = usePayment();

 // Map database records
 const reservations = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [editTargetId, setEditTargetId] = useState(null);
 const [viewDetailsId, setViewDetailsId] = useState(null);
 const [showChannelSync, setShowChannelSync] = useState(false);
 const [isSyncing, setIsSyncing] = useState(false);
 const [showChannelSettings, setShowChannelSettings] = useState(false);
 const [channelSettings, setChannelSettings] = useState({ apiKey: '', propertyId: '', mockMode: true });

 useEffect(() => {
   if (companyId) {
     powerSync.execute('SELECT channex_api_key, channex_property_id, mock_mode FROM univ_hotel_settings WHERE company_id = ? LIMIT 1', [companyId])
      .then(res => {
        if (res.rows.length > 0) {
          const row = res.rows._array ? res.rows._array[0] : Array.from(res.rows)[0];
          setChannelSettings({
            apiKey: row.channex_api_key || '',
            propertyId: row.channex_property_id || '',
            mockMode: row.mock_mode === 1
          });
        }
      });
   }
 }, [companyId]);

 const saveChannelSettings = async () => {
   try {
     const res = await powerSync.execute('SELECT id FROM univ_hotel_settings WHERE company_id = ?', [companyId]);
     if (res.rows.length > 0) {
       await powerSync.execute('UPDATE univ_hotel_settings SET channex_api_key = ?, channex_property_id = ?, mock_mode = ? WHERE company_id = ?', [channelSettings.apiKey, channelSettings.propertyId, channelSettings.mockMode ? 1 : 0, companyId]);
     } else {
       await powerSync.execute('INSERT INTO univ_hotel_settings (id, company_id, channex_api_key, channex_property_id, mock_mode) VALUES (uuid(), ?, ?, ?, ?)', [companyId, channelSettings.apiKey, channelSettings.propertyId, channelSettings.mockMode ? 1 : 0]);
     }
     toast.success('Channel Manager settings saved!');
     setShowChannelSettings(false);
   } catch(e) {
     toast.error('Failed to save settings');
   }
 };

 // Form State
 const [formData, setFormData] = useState({
 guest: '',
 checkIn: new Date().toISOString().split('T')[0],
 checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
 roomType: 'Standard Room',
 guestsCount: 1
});

 const handleEdit = (res) => {
 setEditTargetId(res.id);
 setFormData({
 guest: res.guest,
 checkIn: res.checkIn,
 checkOut: res.checkOut,
 roomType: res.roomType,
 guestsCount: res.guestsCount || 1
});
 setShowModal(true);
};

 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const handleSmartPricing = async () => {
   setIsAnalyzing(true);
   const tId = toast.loading('AI analyzing market demand and occupancy...');
   try {
     const prompt = `You are an AI Hotel Yield Manager. Current reservations: ${reservations.length}.
Suggest an optimized rate for 'Standard Room' and 'Deluxe Room' for today based on high occupancy.
Format your response exactly as valid JSON ONLY:
[{"room_code": "STD", "rate": 180}, {"room_code": "DLX", "rate": 280}]`;
     const result = await generateText(prompt);
     // Clean JSON if needed
     const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
     const aiRates = JSON.parse(cleanJson);
     
     // 1. Update local database
     for (const r of aiRates) {
       await powerSync.execute(
         `UPDATE univ_hotel_rooms SET rate = ? WHERE company_id = ? AND ota_room_code = ?`,
         [r.rate, companyId, r.room_code]
       );
     }

     // 2. Push to OTA Channels
     const channelApi = new ChannelManagerAPI(channelSettings.apiKey || 'mock_key', channelSettings.propertyId || 'mock_prop_id', channelSettings.mockMode);
     const mappedRates = aiRates.map(r => ({
       room_code: r.room_code,
       date: new Date().toISOString().split('T')[0],
       rate: r.rate
     }));
     await channelApi.pushRates(mappedRates);

     toast.success(`AI Prices pushed to all channels successfully!`, { id: tId, duration: 6000 });
   } catch (err) {
     console.error(err);
     toast.error('Failed to update pricing from AI', { id: tId });
   } finally {
     setIsAnalyzing(false);
   }
 };

 const handleChannelSync = async () => {
  setIsSyncing(true);
  try {
    const channelApi = new ChannelManagerAPI(channelSettings.apiKey || 'mock_key', channelSettings.propertyId || 'mock_prop_id', channelSettings.mockMode);
    const { data: newReservations } = await channelApi.pullReservations();
    
    for (const res of newReservations) {
      await powerSync.execute(
        `INSERT INTO univ_hotel_reservations (id, company_id, ota_reservation_id, channel_source, guest_name, guest_email, guest_phone, room_type, check_in, check_out, nights, total_amount, channel_commission, status)
         VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [companyId, res.ota_reservation_id, res.channel_source, res.guest_name, res.guest_email, res.guest_phone, res.room_type, res.check_in, res.check_out, res.nights, res.total_amount, res.channel_commission, res.status]
      );
    }
    toast.success(`${newReservations.length} reservations synchronized from OTA channels`);
  } catch(err) {
    console.error(err);
    toast.error("Failed to sync channels");
  } finally {
    setIsSyncing(false);
    setShowChannelSync(false);
  }
 };

 // Generic Save Handler for real DB persistence
 const handleSaveToDb = () => {
 if (!formData.guest.trim()) return toast.error("Please enter guest name");

 const resId = `RES-${Math.floor(100 + Math.random() * 900)}`;
 const nights = Math.max(1, Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / 86400000));
 
 // Rates calculation
 const rates = { 'Standard Room': 150, 'Deluxe Room': 250, 'Suite': 500};
 const total = nights * (rates[formData.roomType] || 150);

 const payload = {
 resId: editTargetId ? dbRecords.find(r => r.id === editTargetId)?.data?.resId : resId,
 guest: formData.guest,
 checkIn: formData.checkIn,
 checkOut: formData.checkOut,
 nights,
 roomType: formData.roomType,
 guestsCount: formData.guestsCount,
 total,
 status: editTargetId ? dbRecords.find(r => r.id === editTargetId)?.status : 'Confirmed'
};

 mutateRecord.mutate({
 id: editTargetId || undefined,
 recordType: 'reservation',
 payload,
 status: payload.status,
 searchText: `${formData.guest} ${payload.resId}`
}, {
 onSuccess: () => {
 toast.success(editTargetId ? 'Reservation updated!' : 'Reservation created successfully!');
 setShowModal(false);
 setEditTargetId(null);
 setFormData({
 guest: '',
 checkIn: new Date().toISOString().split('T')[0],
 checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
 roomType: 'Standard Room',
 guestsCount: 1
});
},
 onError: (err) => {
 toast.error('Failed to create reservation: ' + err.message);
}
});
};

 // Change Status
 const handleStatusChange = (res, newStatus) => {
 const updatedPayload = { ...res, status: newStatus};
 delete updatedPayload.id;

 mutateRecord.mutate({
 id: res.id,
 recordType: 'reservation',
 payload: updatedPayload,
 status: newStatus,
 searchText: `${res.guest} ${res.resId}`
}, {
 onSuccess: () => {
 toast.success(`Reservation marked as ${newStatus}`);
}
});
};

 // Generic Delete Handler for real DB persistence
 const handleDeleteFromDb = (id) => {
 if (window.confirm('Are you sure you want to cancel and delete this reservation?')) {
 deleteRecord.mutate({ id, recordType: 'reservation'}, {
 onSuccess: () => {
 toast.success('Reservation deleted successfully!');
},
 onError: (err) => {
 toast.error('Failed to delete reservation: ' + err.message);
}
});
}
};

 const filtered = reservations.filter(res =>
 res.guest?.toLowerCase().includes(search.toLowerCase()) ||
 res.resId?.includes(search)
 );

 if (isDbLoading) return <div className="flex items-center justify-center h-64 text-[#71717a] dark:text-gray-400">{t("loading_reservations", "Loading reservations...")}</div>;

 return (
 <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(68,49,153,0.08) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("reservations", "Reservations")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "manage_room_bookings_and_guest",
 "Manage room bookings and guest arrivals"
 )}</p>
 </div>
  <div className="flex gap-2">
  <Button onClick={() => setShowChannelSync(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
    <RefreshCcw className="w-4 h-4" /> Channel Sync
  </Button>
  <Button onClick={handleSmartPricing} disabled={isAnalyzing} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
    <Sparkles className="w-4 h-4" /> AI Smart Pricing
  </Button>
  <Button onClick={() => { setEditTargetId(null); setShowModal(true); setFormData({ guest: '', checkIn: new Date().toISOString().split('T')[0], checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], roomType: 'Standard Room', guestsCount: 1});}} className="gap-2 bg-primary hover:bg-primary/90 text-white">
  <Plus className="w-4 h-4" /> {t("new_booking", "New Booking")}
  </Button>
  </div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search guest or RES ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("res_id", "Res ID")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("guest", "Guest")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("dates", "Dates")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("room_details", "Room Details")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("amount", "Amount")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(res => {
 return (
 <tr key={res.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-mono text-xs font-semibold text-primary tracking-[0.04em]">{res.resId}</td>
 <td className="px-6 py-4 font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Link to={`/clients`} className="text-primary hover:underline">{res.guest}</Link>
 </td>
 <td className="px-6 py-4">
 <p className="text-foreground font-medium">{res.checkIn} → {res.checkOut}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 mt-0.5 tracking-[0.04em]"><Clock className="w-3 h-3"/> {res.nights} {t("nights", "Nights")}</p>
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400 font-medium">{res.roomType}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[res.status] || 'bg-slate-100 text-primary/90'}`}>{res.status}</span>
 </td>
 <td className="px-6 py-4 text-center font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${res.total}</td>
 <td className="px-6 py-4 text-right flex justify-end gap-2">
 {res.status === 'Confirmed' && (
 <Button onClick={() => handleStatusChange(res, 'Checked-in')} size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white">{t("check_in", "Check In")}</Button>
 )}
 {res.status === 'Checked-in' && (
 <Button onClick={() => handleStatusChange(res, 'Checked-out')} size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white">{t("check_out", "Check Out")}</Button>
 )}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 <MoreVertical className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewDetailsId(res.id)}>
 <FileText className="w-4 h-4 mr-2" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => {
 const customerEmail = prompt("Enter customer email for payment receipt:");
 if (customerEmail) {
 processPayment({ companyId, provider: 'stripe', amount: res.total, currency: 'USD', customerEmail, invoiceId: res.resId});
}
}}>
 <CreditCard className="w-4 h-4 mr-2" /> {t("process_payment", "Process Payment")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleEdit(res)}>
 <Edit className="w-4 h-4 mr-2" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleDeleteFromDb(res.id)} className="text-red-600">
 <Trash2 className="w-4 h-4 mr-2" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 {filtered.length === 0 && (
 <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
 <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
 <p>{t(
 "no_reservations_found_click_ne",
 "No reservations found. Click \"New Booking\" to add one."
 )}</p>
 </div>
 )}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {editTargetId ? <Edit className="w-5 h-5 text-primary"/> : <Calendar className="w-5 h-5 text-primary"/>}
 {editTargetId ? 'Edit Reservation' : 'New Reservation'}
 </h2>
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("guest_name", "Guest Name")}</label>
 <Input value={formData.guest} onChange={e => setFormData({ ...formData, guest: e.target.value})} className="mt-1" placeholder="e.g. John Doe" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("check_in", "Check-in")}</label>
 <Input type="date" value={formData.checkIn} onChange={e => setFormData({ ...formData, checkIn: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("check_out", "Check-out")}</label>
 <Input type="date" value={formData.checkOut} onChange={e => setFormData({ ...formData, checkOut: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("room_type", "Room Type")}</label>
 <select value={formData.roomType} onChange={e => setFormData({ ...formData, roomType: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("standard_room", "Standard Room")}</option>
 <option>{t("deluxe_room", "Deluxe Room")}</option>
 <option>{t("suite", "Suite")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("guests_count", "Guests Count")}</label>
 <Input type="number" value={formData.guestsCount} onChange={e => setFormData({ ...formData, guestsCount: parseInt(e.target.value) || 1})} className="mt-1" />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb}>
 {editTargetId ? 'Save Changes' : 'Confirm Booking'}
 </Button>
 </div>
 </div>
 </div>
 )}
 {/* View Details Sheet */}
 <Sheet open={viewDetailsId !== null} onOpenChange={(isOpen) => !isOpen && setViewDetailsId(null)}>
 <SheetContent className="overflow-y-auto">
 {viewDetailsId && (() => {
 const res = reservations.find(r => r.id === viewDetailsId);
 if (!res) return null;
 return (
 <>
 <SheetHeader className="mb-6">
 <SheetTitle className="text-2xl flex items-center gap-2 tracking-[-0.02em]">
 <Calendar className="w-6 h-6 text-primary" />
 {t("reservation", "Reservation")} {res.resId}
 </SheetTitle>
 <SheetDescription>
 {t("complete_information_for_booki", "Complete information for booking")} {res.resId}
 </SheetDescription>
 </SheetHeader>
 <div className="space-y-6 school-page-enter font-dmsans">
 <div>
 <h3 className="text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-2">{t("guest_info", "Guest Info")}</h3>
 <div className="bg-muted/50 p-4 rounded-xl flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-slate-100 text-primary flex items-center justify-center">
 <User className="w-5 h-5" />
 </div>
 <div>
 <p className="font-semibold text-foreground text-lg">
 <Link to={`/clients`} className="text-primary hover:underline">{res.guest}</Link>
 </p>
 <p className="text-sm text-[#71717a] dark:text-gray-400">{res.guestsCount || 1} {t("guest_s", "Guest(s)")}</p>
 </div>
 </div>
 </div>
 <div>
 <h3 className="text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-2">{t("booking_details", "Booking Details")}</h3>
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-muted/50 p-3 rounded-xl">
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("check_in", "Check-in")}</p>
 <p className="font-semibold text-foreground">{res.checkIn}</p>
 </div>
 <div className="bg-muted/50 p-3 rounded-xl">
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("check_out", "Check-out")}</p>
 <p className="font-semibold text-foreground">{res.checkOut}</p>
 </div>
 <div className="bg-muted/50 p-3 rounded-xl">
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("room_type", "Room Type")}</p>
 <p className="font-semibold text-foreground">{res.roomType}</p>
 </div>
 <div className="bg-muted/50 p-3 rounded-xl">
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("status", "Status")}</p>
 <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${res.status === 'Confirmed' ? 'bg-slate-100 text-primary/90' : res.status === 'Checked-in' ? 'bg-slate-100 text-primary/90' : 'bg-slate-100 text-primary/90'}`}>
 <Activity className="w-3 h-3 mr-1" /> {res.status}
 </span>
 </div>
 </div>
 </div>
 <div className="bg-muted/50 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex justify-between items-center">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400">{t("total_amount", "Total Amount")}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{res.nights} {t("nights", "Nights")}</p>
 </div>
 <p className="text-2xl font-semibold text-primary tracking-[-0.02em]">${res.total}</p>
 </div>
 <div className="pt-4 flex gap-2">
 <Button onClick={() => { setViewDetailsId(null); handleEdit(res);}} className="flex-1 bg-primary hover:bg-primary/90 text-white">
 <Edit className="w-4 h-4 mr-2" /> {t("edit_booking", "Edit Booking")}
 </Button>
 </div>
 </div>
 </>
 );
})()}
 </SheetContent>
 </Sheet>

  {/* Channel Manager Sync Modal */}
  {showChannelSync && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-6 border border-primary/20">
        <div className="flex justify-between items-center text-center space-y-2">
          <div className="flex-1 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cloud className={`w-8 h-8 ${isSyncing ? 'animate-bounce' : ''}`}/>
            </div>
            <h2 className="text-xl font-bold">Channel Manager</h2>
            <p className="text-sm text-muted-foreground">Sync inventory and reservations with connected OTAs.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowChannelSettings(!showChannelSettings)}><Edit className="w-4 h-4 text-muted-foreground"/></Button>
        </div>

        {showChannelSettings ? (
          <div className="space-y-4 bg-muted/30 p-4 rounded-xl text-left border border-border/50">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channex API Key</label>
              <Input className="mt-1" type="password" value={channelSettings.apiKey} onChange={(e) => setChannelSettings({...channelSettings, apiKey: e.target.value})} placeholder="sk_test_..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property ID</label>
              <Input className="mt-1" value={channelSettings.propertyId} onChange={(e) => setChannelSettings({...channelSettings, propertyId: e.target.value})} placeholder="e.g. 1a2b3c" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="mockMode" checked={channelSettings.mockMode} onChange={(e) => setChannelSettings({...channelSettings, mockMode: e.target.checked})} className="rounded border-gray-300" />
              <label htmlFor="mockMode" className="text-sm font-medium">Enable Mock Mode (Simulate API)</label>
            </div>
            <Button className="w-full mt-2" onClick={saveChannelSettings}>Save Settings</Button>
          </div>
        ) : (
          <div className="space-y-3 bg-muted rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Booking.com</div>
              <span className="text-muted-foreground text-xs">Connected</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Expedia</div>
              <span className="text-muted-foreground text-xs">Connected</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${channelSettings.mockMode ? 'bg-amber-500' : 'bg-green-500'}`}></span> Channex API</div>
              <span className="text-muted-foreground text-xs">{channelSettings.mockMode ? 'Mock Mode' : 'Live'}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setShowChannelSync(false)} disabled={isSyncing}>Cancel</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleChannelSync} disabled={isSyncing}>
            <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}/> 
            {isSyncing ? 'Syncing Data...' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </div>
  )}
 </div>
 );
}
