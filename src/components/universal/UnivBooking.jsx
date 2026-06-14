import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 Calendar as CalendarIcon, Clock, Users, MapPin, 
 ChevronLeft, ChevronRight, CheckCircle2, 
 Info, CreditCard, Tag, User, Search
} from 'lucide-react';

// Helpers for dates
const addDays = (date, days) => {
 const result = new Date(date);
 result.setDate(result.getDate() + days);
 return result;
};

const formatDate = (date) => date.toISOString().split('T')[0];

const generateTimeSlots = (startHour = 9, endHour = 17, intervalMinutes = 30) => {
 const slots = [];
 for (let h = startHour; h < endHour; h++) {
 for (let m = 0; m < 60; m += intervalMinutes) {
 const hh = h.toString().padStart(2, '0');
 const mm = m.toString().padStart(2, '0');
 slots.push(`${hh}:${mm}`);
}
}
 return slots;
};

export default function UnivBooking({
 title = 'Booking Engine',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'booking';
 const targetTable = tableName || 'industry_records';

 const [currentDate, setCurrentDate] = useState(new Date());
 const [selectedService, setSelectedService] = useState(null);
 const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
 const [selectedSlot, setSelectedSlot] = useState(null);
 const [step, setStep] = useState(1); // 1: Service, 2: Date/Time, 3: Details, 4: Confirmation
 
 const [customerForm, setCustomerForm] = useState({
 name: '',
 email: '',
 phone: '',
 notes: ''
});

 // Example generic services (in reality this might come from the DB)
 const SERVICES = [
 { id: 'srv-1', name: 'General Consultation', duration: 30, price: 50, icon: Users, color: 'bg-blue-500'},
 { id: 'srv-2', name: 'Premium Assessment', duration: 60, price: 120, icon: CheckCircle2, color: 'bg-purple-500'},
 { id: 'srv-3', name: 'Facility Tour', duration: 45, price: 0, icon: MapPin, color: 'bg-emerald-500'},
 { id: 'srv-4', name: 'Follow-up Session', duration: 15, price: 25, icon: Clock, color: 'bg-amber-500'},
 ];

 // Fetch Existing Bookings to find taken slots
 const { data: bookings = []} = useQuery({
 queryKey: ['bookings', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_bookings`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const timeSlots = useMemo(() => generateTimeSlots(9, 18, 30), []);

 const takenSlots = useMemo(() => {
 return bookings
 .filter(b => b.date === selectedDate && b.status !== 'Cancelled')
 .map(b => b.time);
}, [bookings, selectedDate]);

 const availableSlots = useMemo(() => {
 return timeSlots.filter(slot => !takenSlots.includes(slot));
}, [timeSlots, takenSlots]);

 // Next/Prev Week
 const dates = useMemo(() => {
 const d = [];
 const start = new Date(currentDate);
 // Adjust to Monday
 const day = start.getDay();
 const diff = start.getDate() - day + (day === 0 ? -6 : 1);
 start.setDate(diff);

 for (let i = 0; i < 7; i++) {
 d.push(new Date(start));
 start.setDate(start.getDate() + 1);
}
 return d;
}, [currentDate]);

 const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
 const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));

 const bookMutation = useMutation({
 mutationFn: async (bookingData) => {
 const payload = {
 company_id: effectiveCompanyId,
 industry: 'orbit_build_data',
 record_type: `${effectivePageName}_bookings`,
 data: {
 ...bookingData,
 status: 'Confirmed',
 created_at: new Date().toISOString()
}
};
 const finalPayload = targetTable === 'industry_records' ? payload : { ...bookingData, company_id: effectiveCompanyId};
 const { error} = await (async () => {
 const _p = finalPayload;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO ${targetTable} (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['bookings', effectiveCompanyId, effectivePageName]);
 setStep(4);
},
 onError: (err) => toast({ title: 'Booking Failed', description: err.message, variant: 'destructive'})
});

 const handleConfirm = () => {
 if (!customerForm.name || !customerForm.email) {
 toast({ title: 'Missing info', description: 'Please fill out name and email.', variant: 'destructive'});
 return;
}
 bookMutation.mutate({
 service_id: selectedService.id,
 service_name: selectedService.name,
 date: selectedDate,
 time: selectedSlot,
 price: selectedService.price,
 customer: customerForm
});
};

 const resetFlow = () => {
 setStep(1);
 setSelectedService(null);
 setSelectedSlot(null);
 setCustomerForm({ name: '', email: '', phone: '', notes: ''});
};

 return (
 <div className="flex h-full w-full bg-background overflow-hidden font-sans">
 
 {/* Sidebar Overview */}
 <div className="w-80 border-r border-border bg-card flex flex-col shrink-0 hidden md:flex">
 <div className="p-6 border-b border-border">
 <h2 className="text-xl font-bold text-foreground">{title}</h2>
 <p className="text-sm text-muted-foreground mt-1">Select a service and reserve your spot.</p>
 </div>
 
 <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
 {/* Progress Timeline */}
 <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-4">
 <div className={cn("relative -left-[9px] flex items-center gap-3", step >= 1 ? "text-primary" : "text-muted-foreground")}>
 <div className={cn("w-4 h-4 rounded-full border-[3px] bg-background", step >= 1 ? "border-primary" : "border-muted")} />
 <span className={cn("text-sm font-semibold", step === 1 && "text-foreground")}>1. Service</span>
 </div>
 <div className={cn("relative -left-[9px] flex items-center gap-3", step >= 2 ? "text-primary" : "text-muted-foreground")}>
 <div className={cn("w-4 h-4 rounded-full border-[3px] bg-background", step >= 2 ? "border-primary" : "border-muted")} />
 <span className={cn("text-sm font-semibold", step === 2 && "text-foreground")}>2. Date & Time</span>
 </div>
 <div className={cn("relative -left-[9px] flex items-center gap-3", step >= 3 ? "text-primary" : "text-muted-foreground")}>
 <div className={cn("w-4 h-4 rounded-full border-[3px] bg-background", step >= 3 ? "border-primary" : "border-muted")} />
 <span className={cn("text-sm font-semibold", step === 3 && "text-foreground")}>3. Details</span>
 </div>
 <div className={cn("relative -left-[9px] flex items-center gap-3", step >= 4 ? "text-primary" : "text-muted-foreground")}>
 <div className={cn("w-4 h-4 rounded-full border-[3px] bg-background", step >= 4 ? "border-primary" : "border-muted")} />
 <span className={cn("text-sm font-semibold", step === 4 && "text-foreground")}>4. Done</span>
 </div>
 </div>

 {/* Booking Summary (if selections made) */}
 {selectedService && (
 <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3 animate-in fade-in slide-in-from-bottom-4">
 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Booking Summary</h3>
 <div className="flex items-start gap-2">
 <Tag className="w-4 h-4 text-primary shrink-0 mt-0.5" />
 <div className="text-sm font-medium text-foreground">{selectedService.name}</div>
 </div>
 {selectedSlot && (
 <div className="flex items-start gap-2">
 <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
 <div className="text-sm font-medium text-foreground">
 {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}<br/>
 <span className="text-muted-foreground">{selectedSlot}</span>
 </div>
 </div>
 )}
 {selectedService.price > 0 && (
 <div className="flex items-start gap-2 pt-2 border-t border-border mt-2">
 <CreditCard className="w-4 h-4 text-primary shrink-0 mt-0.5" />
 <div className="text-sm font-bold text-foreground">${selectedService.price}</div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Main Flow Area */}
 <div className="flex-1 bg-muted/10 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
 <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-center">
 <AnimatePresence mode="wait">
 
 {/* STEP 1: SERVICE */}
 {step === 1 && (
 <motion.div 
 key="step1"
 initial={{ opacity: 0, x: 20}}
 animate={{ opacity: 1, x: 0}}
 exit={{ opacity: 0, x: -20}}
 className="space-y-6"
 >
 <div className="mb-8">
 <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Select a Service</h1>
 <p className="text-muted-foreground mt-2 text-lg">Choose what you'd like to book today.</p>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {SERVICES.map(srv => {
 const Icon = srv.icon;
 return (
 <button
 key={srv.id}
 onClick={() => { setSelectedService(srv); setStep(2);}}
 className="flex items-center text-left gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
 >
 <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ", srv.color)}>
 <Icon className="w-6 h-6 text-white" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-bold text-foreground text-base truncate">{srv.name}</h3>
 <p className="text-sm text-muted-foreground mt-0.5">{srv.duration} mins • ${srv.price}</p>
 </div>
 </button>
 )
})}
 </div>
 </motion.div>
 )}

 {/* STEP 2: DATE & TIME */}
 {step === 2 && (
 <motion.div 
 key="step2"
 initial={{ opacity: 0, x: 20}}
 animate={{ opacity: 1, x: 0}}
 exit={{ opacity: 0, x: -20}}
 className="space-y-6"
 >
 <div className="mb-6 flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Choose Time</h1>
 <p className="text-muted-foreground mt-1">{selectedService?.duration} minute session</p>
 </div>
 <button onClick={() => setStep(1)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
 ← Back
 </button>
 </div>

 <div className="bg-card border border-border rounded-2xl p-6 ">
 {/* Calendar Week Nav */}
 <div className="flex items-center justify-between mb-6">
 <button onClick={handlePrevWeek} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></button>
 <h3 className="font-bold text-foreground">
 {dates[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric'})}
 </h3>
 <button onClick={handleNextWeek} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button>
 </div>
 
 {/* Days Row */}
 <div className="grid grid-cols-7 gap-2 mb-8">
 {dates.map((d, i) => {
 const isSelected = formatDate(d) === selectedDate;
 const isPast = d < new Date(new Date().setHours(0,0,0,0));
 return (
 <button
 key={i}
 disabled={isPast}
 onClick={() => { setSelectedDate(formatDate(d)); setSelectedSlot(null);}}
 className={cn(
 "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
 isSelected ? "bg-primary text-white border-primary " : "bg-muted/30 border-transparent hover:border-border",
 isPast && "opacity-30 cursor-not-allowed"
 )}
 >
 <span className={cn("text-xs font-semibold uppercase mb-1", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
 {d.toLocaleDateString(undefined, { weekday: 'short'})}
 </span>
 <span className={cn("text-lg font-bold", isSelected ? "text-white" : "text-foreground")}>
 {d.getDate()}
 </span>
 </button>
 )
})}
 </div>

 {/* Time Slots */}
 <div className="space-y-4">
 <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Available Slots</h4>
 {availableSlots.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
 No slots available on this day.
 </div>
 ) : (
 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
 {availableSlots.map(slot => (
 <button
 key={slot}
 onClick={() => setSelectedSlot(slot)}
 className={cn(
 "py-2.5 rounded-lg border text-sm font-medium transition-all text-center",
 selectedSlot === slot 
 ? "bg-primary/10 border-primary text-primary " 
 : "bg-background border-border text-foreground hover:border-primary/50"
 )}
 >
 {slot}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="flex justify-end pt-4">
 <button 
 disabled={!selectedSlot}
 onClick={() => setStep(3)}
 className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
 >
 Continue to Details
 </button>
 </div>
 </motion.div>
 )}

 {/* STEP 3: DETAILS */}
 {step === 3 && (
 <motion.div 
 key="step3"
 initial={{ opacity: 0, x: 20}}
 animate={{ opacity: 1, x: 0}}
 exit={{ opacity: 0, x: -20}}
 className="space-y-6"
 >
 <div className="mb-6 flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Your Details</h1>
 <p className="text-muted-foreground mt-1">Almost done! Just need a few details.</p>
 </div>
 <button onClick={() => setStep(2)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
 ← Back
 </button>
 </div>

 <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Full Name *</label>
 <input 
 type="text" 
 required
 value={customerForm.name}
 onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
 className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" 
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Email Address *</label>
 <input 
 type="email" 
 required
 value={customerForm.email}
 onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
 className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" 
 />
 </div>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Phone Number</label>
 <input 
 type="tel" 
 value={customerForm.phone}
 onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
 className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" 
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Additional Notes</label>
 <textarea 
 value={customerForm.notes}
 onChange={e => setCustomerForm({...customerForm, notes: e.target.value})}
 className="w-full min-h-[100px] p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-y" 
 />
 </div>
 </div>

 <div className="flex justify-end pt-4">
 <button 
 disabled={bookMutation.isPending}
 onClick={handleConfirm}
 className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 {bookMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
 </button>
 </div>
 </motion.div>
 )}

 {/* STEP 4: CONFIRMATION */}
 {step === 4 && (
 <motion.div 
 key="step4"
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 className="text-center py-10"
 >
 <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
 <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
 </div>
 <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-4">Booking Confirmed!</h1>
 <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
 Your appointment for <strong className="text-foreground">{selectedService?.name}</strong> has been successfully scheduled for <strong className="text-foreground">{selectedSlot}</strong> on <strong className="text-foreground">{new Date(selectedDate).toLocaleDateString()}</strong>.
 </p>
 <p className="text-sm text-muted-foreground mb-8">
 A confirmation email has been sent to {customerForm.email}.
 </p>
 <button 
 onClick={resetFlow}
 className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors"
 >
 Book Another Appointment
 </button>
 </motion.div>
 )}

 </AnimatePresence>
 </div>
 </div>

 </div>
 );
}
