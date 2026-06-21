import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Search, MapPin, Truck, CheckCircle2, Box, Package, ArrowRight, Clock} from 'lucide-react';
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { useIndustryRecords} from '@/hooks/useIndustryData';

export default function TrackingPortal() {
 const { t} = useTranslation();
 const [trackingId, setTrackingId] = useState('');
 const [searchedId, setSearchedId] = useState('');

 // Real Database Hook for shipments
 const { data: dbShipments = [], isLoading} = useIndustryRecords('shipment');

 const handleSearch = (e) => {
 e.preventDefault();
 if (trackingId.trim()) {
 setSearchedId(trackingId.trim());
}
};

 // Find the requested shipment. We ignore companyId filtering here visually because 
 // useIndustryRecords automatically scopes data to the current tenant. 
 const shipment = searchedId 
 ? dbShipments.find(r => r.data?.trackingNumber?.toLowerCase() === searchedId.toLowerCase()) 
 : null;

 return (
 <div className="space-y-6 max-w-4xl mx-auto">
 {/* Header Profile */}
 <div className="bg-gradient-to-r from-primary/80 to-primary/70 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden text-center">
 <div className="relative z-10 max-w-2xl mx-auto">
 <Truck className="w-12 h-12 mx-auto mb-4 text-primary/20" />
 <h1 className="text-3xl md:text-4xl font-semibold mb-3 tracking-[-0.02em]">{t("track_your_shipment", "Track Your Shipment")}</h1>
 <p className="text-primary/10 text-sm mb-8">{t(
 "enter_your_tracking_number_to_",
 "Enter your tracking number to get real-time updates on your freight."
 )}</p>
 
 <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
 <div className="relative flex-1">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a] dark:text-gray-400" />
 <Input 
 value={trackingId}
 onChange={e => setTrackingId(e.target.value)}
 placeholder="e.g. SHIP-1234" 
 className="pl-12 h-14 bg-white dark:bg-slate-900/40/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white/30 text-lg rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 <Button type="submit" className="h-14 px-8 bg-primary hover:bg-primary text-white rounded-xl text-lg font-semibold transition-all active:scale-95">
 {t("track", "Track")}
 </Button>
 </form>
 </div>
 <div className="absolute right-[-10%] top-[-20%] opacity-5 pointer-events-none">
 <Package className="w-96 h-96" />
 </div>
 </div>
 {searchedId && (
 <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {isLoading ? (
 <div className="p-16 text-center text-[#71717a] dark:text-gray-400 flex flex-col items-center">
 <Truck className="w-10 h-10 animate-bounce mb-4 text-primary" />
 <p>{t("locating_shipment", "Locating shipment...")}</p>
 </div>
 ) : !shipment ? (
 <div className="p-16 text-center text-[#71717a] dark:text-gray-400">
 <Box className="w-16 h-16 mx-auto mb-4 opacity-20" />
 <h3 className="text-xl font-semibold text-card-foreground mb-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("shipment_not_found", "Shipment Not Found")}</h3>
 <p>{t(
 "we_couldn_t_find_a_shipment_ma",
 "We couldn't find a shipment matching \""
 )}<span className="font-mono font-semibold text-foreground">{searchedId}</span>".</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t("please_check_the_number_and_tr", "Please check the number and try again.")}</p>
 </div>
 ) : (
 <div>
 <div className="p-6 md:p-8 border-b border-primary/40 bg-muted/20">
 <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
 <div>
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{t("tracking_number", "Tracking Number")}</p>
 <h2 className="text-2xl font-black text-primary font-mono tracking-[-0.02em]">{shipment.data.trackingNumber}</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-2 flex items-center gap-2">
 <MapPin className="w-4 h-4" /> {shipment.data.origin} <ArrowRight className="w-3 h-3" /> {shipment.data.destination}
 </p>
 </div>
 <div className="text-left md:text-right">
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{t("current_status", "Current Status")}</p>
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/70">
 {shipment.status === 'Delivered' ? <CheckCircle2 className="w-5 h-5 text-primary" /> : 
 shipment.status === 'In Transit' ? <Truck className="w-5 h-5 text-primary" /> :
 <Clock className="w-5 h-5 text-amber-500" />}
 <span className="font-semibold text-lg text-foreground uppercase tracking-wide tracking-[0.04em]">{shipment.status || 'Pending'}</span>
 </div>
 </div>
 </div>
 </div>
 
 <div className="p-6 md:p-8 bg-card grid grid-cols-1 md:grid-cols-2 gap-8 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="space-y-6 school-page-enter font-dmsans">
 <h3 className="font-semibold text-card-foreground border-b pb-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("shipment_details", "Shipment Details")}</h3>
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("carrier", "Carrier")}</p>
 <p className="font-medium">{shipment.data.carrier || 'Standard Freight'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("weight", "Weight")}</p>
 <p className="font-medium">{shipment.data.weight ? `${shipment.data.weight} kg` : 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("estimated_delivery", "Estimated Delivery")}</p>
 <p className="font-medium text-primary font-semibold">{shipment.data.estimatedDelivery || 'Pending Dispatch'}</p>
 </div>
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("customer_ref", "Customer Ref")}</p>
 <p className="font-medium">{shipment.data.customer || 'N/A'}</p>
 </div>
 </div>
 </div>
 
 <div className="space-y-6">
 <h3 className="font-semibold text-card-foreground border-b pb-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("transit_updates", "Transit Updates")}</h3>
 <div className="relative border-l-2 border-muted pl-4 space-y-6 ml-2">
 {shipment.status === 'Delivered' && (
 <div className="relative">
 <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></div>
 <p className="font-semibold text-sm">{t("delivered_successfully", "Delivered Successfully")}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t(
 "shipment_has_reached_its_final",
 "Shipment has reached its final destination."
 )}</p>
 </div>
 )}
 {(shipment.status === 'In Transit' || shipment.status === 'Delivered') && (
 <div className="relative">
 <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${shipment.status === 'In Transit' ? 'bg-primary ring-4 ring-primary/10' : 'bg-muted'} ring-4 ring-card`}></div>
 <p className={`font-semibold text-sm ${shipment.status === 'In Transit' ? 'text-primary' : ''}`}>{t("in_transit_to", "In Transit to")} {shipment.data.destination}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t(
 "shipment_is_moving_through_the",
 "Shipment is moving through the logistics network."
 )}</p>
 </div>
 )}
 <div className="relative">
 <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${shipment.status === 'Pending' ? 'bg-amber-500 ring-4 ring-amber-100' : 'bg-muted'} ring-4 ring-card`}></div>
 <p className="font-semibold text-sm">{t("label_created", "Label Created")}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("origin", "Origin:")} {shipment.data.origin}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
