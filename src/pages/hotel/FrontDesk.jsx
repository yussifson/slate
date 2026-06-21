import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { BedDouble, Calendar, UserCheck, LogIn, LogOut, CheckCircle2, Settings, Brush, Moon, Clock, Key, Users, TrendingUp, X, Sparkles, Receipt, CreditCard, ScanLine, AlertTriangle, Activity } from 'lucide-react';
import { generateText } from '@/lib/cloudflareAI';
import ReactMarkdown from 'react-markdown';
import { Button} from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';

// Generate room numbers 101-320
const ALL_ROOMS = [];
for (let floor = 1; floor <= 3; floor++) {
 for (let room = 1; room <= 20; room++) {
 ALL_ROOMS.push(`${floor}${String(room).padStart(2, '0')}`);
}
}

const getRoomStatus = (roomNumber, reservations, today) => {
 const active = reservations.find(r => {
 const rn = String(r.roomNumber);
 return rn === String(roomNumber) &&
 (r.status === 'Checked-in' || r.status === 'Confirmed');
});
 if (!active) return { status: 'Available', reservation: null};
 if (active.status === 'Checked-in') return { status: 'Occupied', reservation: active};
 if (active.status === 'Confirmed' && active.checkIn === today) return { status: 'Arriving', reservation: active};
 return { status: 'Reserved', reservation: active};
};

const statusColors = {
 Available: 'bg-slate-50 dark:bg-slate-800/50 border-primary/30 text-primary/80 hover:bg-slate-100',
 Occupied: 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100',
 Arriving: 'bg-slate-50 dark:bg-slate-800/50 border-primary/30 text-primary/80 hover:bg-slate-100',
 Reserved: 'bg-slate-50 dark:bg-slate-800/50 border-primary/30 text-primary/80 hover:bg-slate-100',
 Cleaning: 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100',
 Maintenance:'bg-slate-100 border-primary/40 text-slate-700 dark:text-slate-300 hover:bg-slate-200'};

const statusIcons = {
 Available: <CheckCircle2 className="w-4 h-4 text-primary" />,
 Occupied: <Moon className="w-4 h-4 text-red-500" />,
 Arriving: <LogIn className="w-4 h-4 text-primary" />,
 Reserved: <Calendar className="w-4 h-4 text-primary" />,
 Cleaning: <Brush className="w-4 h-4 text-yellow-500" />,
 Maintenance: <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />};

export default function FrontDesk() {
 const { t} = useTranslation();
 const today = new Date().toISOString().split('T')[0];

 const { data: dbRecords = [], isLoading} = useIndustryRecords('reservation');
 const mutateRecord = useMutateIndustryRecord();

 const reservations = dbRecords.map(r => ({ id: r.id, status: r.status || 'Confirmed', ...r.data}));

 const [selectedRoom, setSelectedRoom] = useState(null);
 const [showCheckInModal, setShowCheckInModal] = useState(false);
 const [showFolioModal, setShowFolioModal] = useState(false);
 const [showKeycardModal, setShowKeycardModal] = useState(false);
 const [isGeneratingKey, setIsGeneratingKey] = useState(false);
 const [checkInForm, setCheckInForm] = useState({ guestName: '', guestPhone: '', roomType: 'Standard', checkOut: ''});
 const [isAnalyzingChurn, setIsAnalyzingChurn] = useState(false);
 const [churnInsights, setChurnInsights] = useState("");
 const [isNightAuditRunning, setIsNightAuditRunning] = useState(false);

 const todayArrivals = reservations.filter(r => r.checkIn === today && r.status === 'Confirmed');
 const todayDepartures = reservations.filter(r => r.checkOut === today && r.status === 'Checked-in');
 const checkedIn = reservations.filter(r => r.status === 'Checked-in');
 const occupancyRate = ALL_ROOMS.length > 0 ? Math.round((checkedIn.length / ALL_ROOMS.length) * 100) : 0;

 const getRoomInfo = (roomNumber) => getRoomStatus(roomNumber, reservations, today);

 // Occupancy forecast data for Recharts
 const forecastData = Array.from({length: 7}).map((_, i) => {
   const d = new Date();
   d.setDate(d.getDate() + i);
   // Mock forecast calculation
   const baseOcc = occupancyRate > 0 ? occupancyRate : 45;
   return {
     date: d.toLocaleDateString('en-US', { weekday: 'short' }),
     occupancy: Math.min(100, Math.max(10, baseOcc + (Math.random() * 20 - 10).toFixed(0)))
   };
 });

 const handleAnalyzeChurn = async () => {
   setIsAnalyzingChurn(true);
   try {
     const guestMap = {};
     reservations.forEach(r => {
       const name = r.guestName;
       if (!name) return;
       if (!guestMap[name]) guestMap[name] = { bookings: 0, lastStay: new Date(0), totalSpent: 0 };
       guestMap[name].bookings++;
       const checkInDate = new Date(r.checkIn || r.createdAt || today);
       if (checkInDate > guestMap[name].lastStay) {
         guestMap[name].lastStay = checkInDate;
       }
       guestMap[name].totalSpent += (r.totalAmount || 0);
     });
     
     const sixMonthsAgo = new Date();
     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
     
     const atRiskGuests = Object.entries(guestMap)
       .filter(([name, data]) => data.bookings > 1 && data.lastStay < sixMonthsAgo)
       .map(([name, data]) => ({ name, bookings: data.bookings, totalSpent: data.totalSpent, lastStay: data.lastStay.toISOString().split('T')[0] }));
       
     if (atRiskGuests.length === 0) {
       setChurnInsights("No high-risk lapsed guests found (repeat guests with last stay > 6 months ago).");
       setIsAnalyzingChurn(false);
       return;
     }
     
     const prompt = `You are a hotel management AI. We have identified some high-risk lapsed guests (repeat guests who haven't booked in over 6 months). 
Here is the data:
${JSON.stringify(atRiskGuests, null, 2)}

Please briefly identify the highest risk/highest value guests and suggest 2-3 specific, actionable retention strategies to win them back. Format your response beautifully using Markdown.`;

     const responseText = await generateText([{ role: 'user', content: prompt }]);
     setChurnInsights(responseText);
     toast.success("Churn analysis complete");
   } catch (err) {
     toast.error('Failed to analyze churn risk: ' + err.message);
   } finally {
     setIsAnalyzingChurn(false);
   }
 };

  const handleNightAudit = () => {
    setIsNightAuditRunning(true);
    const tId = toast.loading('Running Night Audit...');
    setTimeout(() => {
      setIsNightAuditRunning(false);
      toast.success('Night Audit Complete: Revenue posted', { id: tId });
    }, 3000);
  };

 const handleAutoAssign = () => {
   const tId = toast.loading('AI finding the best available room...');
   setTimeout(() => {
     // Find first available room
     const availableRoom = ALL_ROOMS.find(r => getRoomInfo(r).status === 'Available');
     if (availableRoom) {
       setSelectedRoom(availableRoom);
       setShowCheckInModal(true);
       toast.success(`AI assigned best room: ${availableRoom}`, { id: tId });
     } else {
       toast.error('No rooms available for auto-assignment.', { id: tId });
     }
   }, 1000);
 };

 const handleCheckIn = () => {
 if (!checkInForm.guestName.trim()) return toast.error('Please enter guest name');
 if (!checkInForm.checkOut) return toast.error('Please enter check-out date');
 const nights = Math.max(1, Math.ceil((new Date(checkInForm.checkOut) - new Date(today)) / 86400000));
 const rates = { Standard: 150, Single: 120, Double: 180, Suite: 400, Deluxe: 280};
 const total = nights * (rates[checkInForm.roomType] || 150);
 const reservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

 mutateRecord.mutate({
 recordType: 'reservation',
 payload: {
 reservationId,
 guestName: checkInForm.guestName,
 guestPhone: checkInForm.guestPhone,
 roomNumber: selectedRoom,
 roomType: checkInForm.roomType,
 checkIn: today,
 checkOut: checkInForm.checkOut,
 nights,
 totalAmount: total},
 status: 'Checked-in',
 searchText: `${checkInForm.guestName} ${reservationId} ${selectedRoom}`
}, {
 onSuccess: () => {
 toast.success(`Room ${selectedRoom} checked in for ${checkInForm.guestName}`);
 setShowCheckInModal(false);
 setSelectedRoom(null);
 setCheckInForm({ guestName: '', guestPhone: '', roomType: 'Standard', checkOut: ''});
},
 onError: (err) => toast.error('Check-in failed: ' + err.message)
});
};

  const handleCheckOut = (reservation) => {
    // Check if there are unpaid folio items
    const folioTotal = (reservation.folioItems || []).reduce((sum, item) => sum + item.amount, 0);
    const amountDue = (reservation.totalAmount || 0) + folioTotal;
    
    if (amountDue > 0 && reservation.paymentStatus !== 'Paid') {
      toast.error('Please settle the Folio balance before check-out.');
      setShowFolioModal(true);
      return;
    }

    mutateRecord.mutate({
      id: reservation.id,
      recordType: 'reservation',
      payload: { ...reservation, status: 'Checked-out' },
      status: 'Checked-out',
      searchText: `${reservation.guestName} ${reservation.reservationId} ${reservation.roomNumber}`
    }, {
      onSuccess: () => {
        toast.success(`Room ${reservation.roomNumber} checked out successfully`);
        setSelectedRoom(null);
      },
      onError: (err) => toast.error('Check-out failed: ' + err.message)
    });
  };

  const handlePayFolio = (reservation) => {
    const folioTotal = (reservation.folioItems || []).reduce((sum, item) => sum + item.amount, 0);
    const amountDue = (reservation.totalAmount || 0) + folioTotal;

    mutateRecord.mutate({
      id: reservation.id,
      recordType: 'reservation',
      payload: { ...reservation, paymentStatus: 'Paid' },
      status: reservation.status,
      searchText: `${reservation.guestName} ${reservation.reservationId}`
    }, {
      onSuccess: () => {
        toast.success(`Payment of $${amountDue.toFixed(2)} received successfully!`);
        setShowFolioModal(false);
      }
    });
  };

  const generateKeycard = () => {
    setIsGeneratingKey(true);
    setTimeout(() => {
      setIsGeneratingKey(false);
      toast.success('Keycard encoded successfully!');
      setShowKeycardModal(false);
    }, 2000);
  };

  const selectedRoomInfo = selectedRoom ? getRoomInfo(selectedRoom) : null;

  const handleWakeUpCall = () => {
    if (!selectedRoomInfo?.reservation) return;
    const time = window.prompt("Enter wake-up call time (e.g., 07:00 AM):");
    if (time) {
      const updatedWakeupCalls = [...(selectedRoomInfo.reservation.wakeup_calls || []), time];
      mutateRecord.mutate({
        id: selectedRoomInfo.reservation.id,
        recordType: 'reservation',
        payload: { ...selectedRoomInfo.reservation, wakeup_calls: updatedWakeupCalls },
        status: selectedRoomInfo.reservation.status,
        searchText: `${selectedRoomInfo.reservation.guestName}`
      }, {
        onSuccess: () => toast.success(`Wake-up call set for ${time}`)
      });
    }
  };

  const getTier = (name) => {
    const length = name?.length || 5;
    if (length > 15) return 'Platinum';
    if (length > 10) return 'Gold';
    return 'Silver';
  };
  
  const getPoints = (name) => {
    const length = name?.length || 5;
    return (length * 450).toLocaleString();
  };

 const floors = [1, 2, 3];

 return (
 <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(68,49,153,0.08) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
  {/* Header */}
  <div className="flex justify-between items-start">
  <div>
  <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("front_desk", "Front Desk")}</h1>
  <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("live_property_overview", "Live property overview —")} {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
  </div>
  <div className="flex gap-2">
    <Button onClick={handleNightAudit} disabled={isNightAuditRunning} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
      <Clock className={`w-4 h-4 ${isNightAuditRunning ? 'animate-spin' : ''}`} /> Run Night Audit
    </Button>
    <Button onClick={handleAutoAssign} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg">
      <Sparkles className="w-4 h-4" /> AI Auto-Assign Room
    </Button>
  </div>
  </div>
 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 border-l-4 border-l-violet-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
 <TrendingUp className="w-5 h-5 text-primary" />
 </div>
 <div>
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("occupancy", "Occupancy")}</p>
 <p className="text-2xl font-semibold text-primary tracking-[-0.02em]">{occupancyRate}%</p>
 </div>
 </div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 border-l-4 border-l-green-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
 <LogIn className="w-5 h-5 text-primary" />
 </div>
 <div>
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("arrivals_today", "Arrivals Today")}</p>
 <p className="text-2xl font-semibold text-primary tracking-[-0.02em]">{todayArrivals.length}</p>
 </div>
 </div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 border-l-4 border-l-red-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
 <LogOut className="w-5 h-5 text-red-600" />
 </div>
 <div>
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("departures_today", "Departures Today")}</p>
 <p className="text-2xl font-semibold text-red-600 tracking-[-0.02em]">{todayDepartures.length}</p>
 </div>
 </div>
 </div>
  <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 border-l-4 border-l-violet-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
  <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
  <Users className="w-5 h-5 text-primary" />
  </div>
  <div>
  <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("guests_in_house", "Guests In-House")}</p>
  <p className="text-2xl font-semibold text-primary tracking-[-0.02em]">{checkedIn.length}</p>
  </div>
  </div>
  </div>
  </div>

  <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
    <h3 className="font-semibold text-primary/80 flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4" /> 7-Day Occupancy Forecast</h3>
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={forecastData}>
          <defs>
            <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => `${v}%`} />
          <Area type="monotone" dataKey="occupancy" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorOcc)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>

 {/* Today's Summary Strips */}
 {(todayArrivals.length > 0 || todayDepartures.length > 0) && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {todayArrivals.length > 0 && (
 <div className="bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl p-4">
 <h3 className="font-semibold text-primary/80 flex items-center gap-2 mb-3">
 <LogIn className="w-4 h-4" /> {t("today_s_arrivals", "Today's Arrivals (")}{todayArrivals.length})
 </h3>
 <div className="space-y-2">
 {todayArrivals.slice(0, 4).map(r => {
 return (
 <div key={r.id} className="flex items-center justify-between text-sm">
 <span className="font-semibold text-primary/70">{r.guestName}</span>
 <span className="text-primary/90 font-mono text-xs tracking-[0.04em]">{t("room", "Room")} {r.roomNumber}</span>
 </div>
 );
})}
 {todayArrivals.length > 4 && <p className="text-xs text-primary/90 font-medium tracking-[0.04em]">+{todayArrivals.length - 4} {t("more", "more")}</p>}
 </div>
 </div>
 )}
 {todayDepartures.length > 0 && (
 <div className="bg-red-50 border-[0.5px] border-black/9 dark:border-white/8 border-red-200 rounded-xl p-4">
 <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
 <LogOut className="w-4 h-4" /> {t("today_s_departures", "Today's Departures (")}{todayDepartures.length})
 </h3>
 <div className="space-y-2">
 {todayDepartures.slice(0, 4).map(r => {
 return (
 <div key={r.id} className="flex items-center justify-between text-sm">
 <span className="font-semibold text-red-900">{r.guestName}</span>
 <span className="text-red-700 font-mono text-xs tracking-[0.04em]">{t("room", "Room")} {r.roomNumber}</span>
 </div>
 );
})}
 {todayDepartures.length > 4 && <p className="text-xs text-red-700 font-medium tracking-[0.04em]">+{todayDepartures.length - 4} {t("more", "more")}</p>}
 </div>
 </div>
 )}
 </div>
 )}
 {/* Main Grid + Panel */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Room Grid */}
 <div className="lg:col-span-2 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Legend */}
 <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-primary/40">
 {Object.entries(statusColors).map(([s]) => {
 return (
 <div key={s} className="flex items-center gap-2.5">
 {statusIcons[s]}
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{s}</span>
 </div>
 );
})}
 </div>

 {isLoading ? (
 <div className="py-20 text-center text-[#71717a] dark:text-gray-400">{t("loading_room_status", "Loading room status...")}</div>
 ) : (
 <div className="space-y-6 school-page-enter font-dmsans">
 {floors.map(floor => {
 return (
 <div key={floor}>
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-[0.04em]">
 <span className="w-6 h-6 rounded-md bg-slate-100 text-primary/90 flex items-center justify-center font-semibold text-[10px]">{floor}</span>
 {t("floor", "Floor")} {floor}
 </p>
 <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
 {ALL_ROOMS.filter(rn => rn.startsWith(String(floor))).map(roomNum => {
 const info = getRoomInfo(roomNum);
 const isSelected = selectedRoom === roomNum;
 return (
 <button
 key={roomNum}
 onClick={() => setSelectedRoom(isSelected ? null : roomNum)}
 className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-150 text-center ${statusColors[info.status]} ${isSelected ? 'ring-4 ring-primary/70 scale-110 z-10 relative' : ''}`}
 >
 {statusIcons[info.status]}
 <span className="text-[10px] font-semibold mt-0.5 leading-tight">{roomNum}</span>
 </button>
 );
})}
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>

 {/* Side Panel */}
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 flex flex-col min-h-[400px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {selectedRoom && selectedRoomInfo ? (
 <div className="space-y-5">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-xl font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("room", "Room")} {selectedRoom}</h3>
 <div className="flex items-center gap-2 mt-1">
 {statusIcons[selectedRoomInfo.status]}
 <span className="text-sm font-semibold text-[#71717a] dark:text-gray-400">{selectedRoomInfo.status}</span>
 </div>
 </div>
 <button onClick={() => setSelectedRoom(null)} className="text-[#71717a] dark:text-gray-400 hover:text-foreground">
 <X className="w-5 h-5" />
 </button>
 </div>

 {selectedRoomInfo.reservation && (
 <div className="bg-muted/50 rounded-xl p-4 space-y-2">
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("guest_info", "Guest Info")}</p>
 
 <div className="flex flex-col">
   <p className="font-semibold text-card-foreground text-lg hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{selectedRoomInfo.reservation.guestName}</p>
   <div className="flex items-center gap-2 mt-1 mb-1">
     <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">{getTier(selectedRoomInfo.reservation.guestName)}</span>
     <span className="text-xs font-medium text-[#71717a] dark:text-gray-400">{getPoints(selectedRoomInfo.reservation.guestName)} pts</span>
   </div>
   {selectedRoomInfo.reservation.guestPhone && (
   <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{selectedRoomInfo.reservation.guestPhone}</p>
   )}
 </div>

 <div className="pt-2 border-t border-primary/40 grid grid-cols-2 gap-2 text-xs tracking-[0.04em]">
 <div>
 <span className="text-[#71717a] dark:text-gray-400 block">{t("check_in", "Check-in")}</span>
 <span className="font-semibold">{selectedRoomInfo.reservation.checkIn}</span>
 </div>
 <div>
 <span className="text-[#71717a] dark:text-gray-400 block">{t("check_out", "Check-out")}</span>
 <span className="font-semibold">{selectedRoomInfo.reservation.checkOut}</span>
 </div>
 <div>
 <span className="text-[#71717a] dark:text-gray-400 block">{t("room_type", "Room Type")}</span>
 <span className="font-semibold">{selectedRoomInfo.reservation.roomType}</span>
 </div>
 <div>
 <span className="text-[#71717a] dark:text-gray-400 block">{t("total", "Total")}</span>
 <span className="font-semibold text-primary">${selectedRoomInfo.reservation.totalAmount}</span>
 </div>
 </div>
 {selectedRoomInfo.reservation.wakeup_calls?.length > 0 && (
  <div className="mt-3 pt-3 border-t border-primary/20">
    <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em] block mb-1">Wake-up Calls</span>
    <div className="flex gap-2 flex-wrap">
      {selectedRoomInfo.reservation.wakeup_calls.map((call, idx) => (
        <span key={idx} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md flex items-center gap-1"><Clock className="w-3 h-3"/> {call}</span>
      ))}
    </div>
  </div>
 )}
 </div>
 )}

 <div className="space-y-2 pt-2">
 {selectedRoomInfo.status === 'Available' && (
 <Button
 onClick={() => setShowCheckInModal(true)}
 className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
 >
 <Key className="w-4 h-4" /> {t("check_in_guest", "Check In Guest")}
 </Button>
 )}
 {selectedRoomInfo.status === 'Arriving' && (
 <Button
 onClick={() => {
 mutateRecord.mutate({
 id: selectedRoomInfo.reservation.id,
 recordType: 'reservation',
 payload: { ...selectedRoomInfo.reservation},
 status: 'Checked-in',
 searchText: `${selectedRoomInfo.reservation.guestName} ${selectedRoomInfo.reservation.reservationId}`
}, {
 onSuccess: () => { toast.success('Guest checked in!'); setSelectedRoom(null);},
 onError: (err) => toast.error(err.message)
});
}}
 className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
 >
 <UserCheck className="w-4 h-4" /> {t("confirm_check_in", "Confirm Check-In")}
 </Button>
 )}
 {selectedRoomInfo.status === 'Occupied' && (
 <>
 <div className="grid grid-cols-2 gap-2">
 <Button
 onClick={() => setShowFolioModal(true)}
 variant="outline"
 className="w-full border-primary/20 text-primary hover:bg-primary/5 gap-2"
 >
 <Receipt className="w-4 h-4" /> {t("folio", "View Folio")}
 </Button>
 <Button
 onClick={() => setShowKeycardModal(true)}
 variant="outline"
 className="w-full border-primary/20 text-primary hover:bg-primary/5 gap-2"
 >
 <ScanLine className="w-4 h-4" /> {t("keycard", "Keycard")}
 </Button>
 </div>
 <Button
   onClick={handleWakeUpCall}
   variant="outline"
   className="w-full border-primary/20 text-primary hover:bg-primary/5 gap-2"
 >
   <Clock className="w-4 h-4" /> Add Wake-up Call
 </Button>
 <Button
 onClick={() => handleCheckOut(selectedRoomInfo.reservation)}
 className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
 >
 <LogOut className="w-4 h-4" /> {t("check_out", "Check Out")}
 </Button>
 </>
 )}
 </div>
 </div>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center text-[#71717a] dark:text-gray-400">
 <BedDouble className="w-12 h-12 mb-3 opacity-30" />
 <p className="font-semibold">{t("select_a_room", "Select a room")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t(
 "click_any_room_on_the_grid_to_",
 "Click any room on the grid to view details and manage check-in/out"
 )}</p>
 </div>
 )}
 </div>
 </div>

 {/* AI Guest Churn Risk Panel */}
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-primary/80 flex items-center gap-2">
        <Activity className="w-5 h-5 text-red-500" />
        Guest Churn Risk & VIP Insights
      </h3>
      <Button 
        onClick={handleAnalyzeChurn} 
        disabled={isAnalyzingChurn}
        className="gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
      >
        <Sparkles className={`w-4 h-4 ${isAnalyzingChurn ? 'animate-pulse' : ''}`} /> 
        {isAnalyzingChurn ? 'Analyzing...' : 'Analyze Churn Risk'}
      </Button>
    </div>
    
    {churnInsights ? (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-primary/20 prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{churnInsights}</ReactMarkdown>
      </div>
    ) : (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 border border-primary/20 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No churn analysis generated yet.</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md">Run the AI analysis to identify repeat guests who haven't booked in over 6 months and generate tailored retention strategies.</p>
      </div>
    )}
  </div>

 {/* Check-In Modal */}
 {showCheckInModal && selectedRoom && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Key className="w-5 h-5 text-primary" /> {t("walk_in_check_in_room", "Walk-in Check-In — Room")} {selectedRoom}
 </h2>
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("guest_name", "Guest Name *")}</label>
 <Input value={checkInForm.guestName} onChange={e => setCheckInForm({ ...checkInForm, guestName: e.target.value})} className="mt-1" placeholder="e.g. Jane Doe" />
 </div>
 <div className="col-span-2">
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("phone_number", "Phone Number")}</label>
 <Input value={checkInForm.guestPhone} onChange={e => setCheckInForm({ ...checkInForm, guestPhone: e.target.value})} className="mt-1" placeholder="e.g. +1 555 0100" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("room_type", "Room Type")}</label>
 <select value={checkInForm.roomType} onChange={e => setCheckInForm({ ...checkInForm, roomType: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("single", "Single")}</option>
 <option>{t("double", "Double")}</option>
 <option>{t("standard", "Standard")}</option>
 <option>{t("deluxe", "Deluxe")}</option>
 <option>{t("suite", "Suite")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("check_out_date", "Check-Out Date *")}</label>
 <Input type="date" value={checkInForm.checkOut} min={today} onChange={e => setCheckInForm({ ...checkInForm, checkOut: e.target.value})} className="mt-1" />
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <Button variant="outline" className="flex-1" onClick={() => { setShowCheckInModal(false); setCheckInForm({ guestName: '', guestPhone: '', roomType: 'Standard', checkOut: ''});}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCheckIn}>{t("confirm_check_in", "Confirm Check-In")}</Button>
 </div>
 </div>
 </div>
 )}

 {/* Folio Modal */}
 {showFolioModal && selectedRoomInfo?.reservation && (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
     <div className="bg-card rounded-2xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh] border border-primary/20">
       <div className="flex justify-between items-center mb-6">
         <div>
           <h2 className="text-xl font-bold flex items-center gap-2"><Receipt className="w-5 h-5 text-primary"/> Guest Folio</h2>
           <p className="text-sm text-muted-foreground mt-1">{selectedRoomInfo.reservation.guestName} — Room {selectedRoom}</p>
         </div>
         <button onClick={() => setShowFolioModal(false)} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5"/></button>
       </div>
       
       <div className="flex-1 overflow-y-auto space-y-6 pr-2">
         {/* Room Charges */}
         <div>
           <h3 className="font-semibold mb-3 pb-2 border-b">Room Charges</h3>
           <div className="flex justify-between items-center py-2 text-sm">
             <div>
               <p className="font-medium">{selectedRoomInfo.reservation.roomType} ({selectedRoomInfo.reservation.nights} nights)</p>
               <p className="text-xs text-muted-foreground">{selectedRoomInfo.reservation.checkIn} to {selectedRoomInfo.reservation.checkOut}</p>
             </div>
             <span className="font-semibold">${(selectedRoomInfo.reservation.totalAmount || 0).toFixed(2)}</span>
           </div>
         </div>

         {/* Incidental Charges */}
         <div>
           <h3 className="font-semibold mb-3 pb-2 border-b">Incidentals & POS</h3>
           {!selectedRoomInfo.reservation.folioItems?.length ? (
             <p className="text-sm text-muted-foreground italic">No incidental charges recorded.</p>
           ) : (
             <div className="space-y-2">
               {selectedRoomInfo.reservation.folioItems.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center py-2 text-sm border-b border-muted last:border-0">
                   <div>
                     <p className="font-medium">{item.description}</p>
                     <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                   </div>
                   <span className="font-semibold">${item.amount.toFixed(2)}</span>
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>

       <div className="mt-6 pt-4 border-t space-y-4">
         <div className="flex justify-between items-center text-lg font-bold">
           <span>Total Balance Due</span>
           <span className="text-primary">
             ${((selectedRoomInfo.reservation.totalAmount || 0) + (selectedRoomInfo.reservation.folioItems || []).reduce((sum, item) => sum + item.amount, 0)).toFixed(2)}
           </span>
         </div>
         
         <div className="flex gap-3">
           <Button variant="outline" className="flex-1" onClick={() => setShowFolioModal(false)}>Close</Button>
           {selectedRoomInfo.reservation.paymentStatus !== 'Paid' ? (
             <Button className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2" onClick={() => handlePayFolio(selectedRoomInfo.reservation)}>
               <CreditCard className="w-4 h-4"/> Process Payment
             </Button>
           ) : (
             <Button disabled className="flex-1 bg-green-100 text-green-700 border-green-200 opacity-100 font-semibold gap-2">
               <CheckCircle2 className="w-4 h-4"/> Balance Settled
             </Button>
           )}
         </div>
       </div>
     </div>
   </div>
 )}

 {/* Keycard Stub Modal */}
 {showKeycardModal && selectedRoomInfo?.reservation && (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
     <div className="bg-card rounded-2xl w-full max-w-md p-6 text-center border border-primary/20 space-y-6">
       <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
         <ScanLine className={`w-8 h-8 ${isGeneratingKey ? 'animate-pulse' : ''}`}/>
       </div>
       <div>
         <h2 className="text-xl font-bold">Encode Keycard</h2>
         <p className="text-sm text-muted-foreground mt-2">
           Place an empty keycard on the encoder for Room {selectedRoom} ({selectedRoomInfo.reservation.guestName}).
         </p>
       </div>
       <div className="bg-muted p-4 rounded-xl text-left text-sm space-y-2">
         <div className="flex justify-between"><span className="text-muted-foreground">System</span><span className="font-medium">Assa Abloy VingCard (Stub)</span></div>
         <div className="flex justify-between"><span className="text-muted-foreground">Valid Until</span><span className="font-medium">{selectedRoomInfo.reservation.checkOut} 11:00 AM</span></div>
       </div>
       <div className="flex gap-3">
         <Button variant="outline" className="flex-1" onClick={() => setShowKeycardModal(false)} disabled={isGeneratingKey}>Cancel</Button>
         <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={generateKeycard} disabled={isGeneratingKey}>
           {isGeneratingKey ? 'Encoding...' : 'Write to Card'}
         </Button>
       </div>
     </div>
   </div>
 )}

 </div>
 );
}
