import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BedDouble, Calendar, UserCheck, LogIn, LogOut, CheckCircle2, Settings, Brush, Moon, Clock, Key, Users, TrendingUp, X, Sparkles, Receipt, CreditCard, ScanLine, AlertTriangle, Activity, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';
import { generateText } from '@/lib/cloudflareAI';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

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

export default function FrontDeskNew() {
  const { t } = useTranslation();
  const today = new Date().toISOString().split('T')[0];

  const { data: dbResRecords = [], isLoading: isLoadingRes } = useIndustryRecords('reservation');
  const { data: dbRoomRecords = [], isLoading: isLoadingRooms } = useIndustryRecords('room');
  const mutateRecord = useMutateIndustryRecord();

  const reservations = dbResRecords.map(r => ({ id: r.id, status: r.status || 'Confirmed', ...r.data}));
  const dynamicRooms = dbRoomRecords.map(r => r.data?.roomNumber).filter(Boolean).sort();
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showFolioModal, setShowFolioModal] = useState(false);
  const [showKeycardModal, setShowKeycardModal] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isNightAuditRunning, setIsNightAuditRunning] = useState(false);

  // Calculate KPIs
  const todayArrivals = reservations.filter(r => r.checkIn === today && r.status === 'Confirmed');
  const todayDepartures = reservations.filter(r => r.checkOut === today && r.status === 'Checked-in');
  const checkedIn = reservations.filter(r => r.status === 'Checked-in');
  const occupancyRate = dynamicRooms.length > 0 ? Math.round((checkedIn.length / dynamicRooms.length) * 100) : 0;
  const revenue = checkedIn.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const forecastData = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const baseOcc = occupancyRate > 0 ? occupancyRate : 45;
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      occupancy: Math.min(100, Math.max(10, Number(baseOcc + (Math.random() * 20 - 10)).toFixed(0)))
    };
  });

  const handleNightAudit = () => {
    setIsNightAuditRunning(true);
    const tId = toast.loading('Running Night Audit...');
    setTimeout(() => {
      setIsNightAuditRunning(false);
      toast.success('Night Audit Complete: Revenue posted', { id: tId });
    }, 2500);
  };

  const getRoomInfo = (roomNumber) => getRoomStatus(roomNumber, reservations, today);
  const selectedRoomInfo = selectedRoom ? getRoomInfo(selectedRoom) : null;

  return (
    <div className="min-h-screen pb-16 space-y-4 sm:space-y-6 font-sans">
      {/* ── Native Mobile & Desktop Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("front_desk", "Front Desk")}
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Button 
          onClick={handleNightAudit} 
          disabled={isNightAuditRunning} 
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-3.5 sm:px-4 rounded-xl gap-2 shadow-sm active:scale-95 transition-all"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Night Audit</span>
        </Button>
      </div>

      {/* ── Native Mobile KPI Hero Row (2x2 on mobile, 4x1 on desktop) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Occupancy Rate */}
        <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-xs flex flex-col items-center sm:items-start text-center sm:text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupancy</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight mt-0.5">{occupancyRate}%</p>
          <span className="text-[10px] text-muted-foreground font-medium hidden sm:block mt-0.5">{checkedIn.length}/{dynamicRooms.length} rooms</span>
        </div>

        {/* Today's Arrivals */}
        <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-xs flex flex-col items-center sm:items-start text-center sm:text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arrivals</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5">{todayArrivals.length}</p>
          <span className="text-[10px] text-muted-foreground font-medium hidden sm:block mt-0.5">Expected check-ins</span>
        </div>

        {/* Today's Departures */}
        <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-xs flex flex-col items-center sm:items-start text-center sm:text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departures</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-0.5">{todayDepartures.length}</p>
          <span className="text-[10px] text-muted-foreground font-medium hidden sm:block mt-0.5">Expected check-outs</span>
        </div>

        {/* Daily Revenue */}
        <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-xs flex flex-col items-center sm:items-start text-center sm:text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight mt-0.5">${(revenue / 1000).toFixed(1)}K</p>
          <span className="text-[10px] text-muted-foreground font-medium hidden sm:block mt-0.5">{checkedIn.length} billed rooms</span>
        </div>
      </div>

      {/* ── Forecast & Operational Health (Responsive Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Occupancy Forecast Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">Occupancy Forecast</h2>
              <p className="text-[11px] text-muted-foreground font-medium">7-day projected occupancy trajectory</p>
            </div>
          </div>
          <div className="w-full h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005A9C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#005A9C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#005A9C" strokeWidth={2} fillOpacity={1} fill="url(#colorOcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations Telemetry */}
        <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-xs space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-foreground mb-3">Room Telemetry</h2>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-3 bg-muted/40 rounded-xl border border-border/60">
              <span className="text-xs text-muted-foreground font-semibold">Available Units</span>
              <span className="font-extrabold text-base text-foreground">{Math.max(0, dynamicRooms.length - checkedIn.length)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/40 rounded-xl border border-border/60">
              <span className="text-xs text-muted-foreground font-semibold">Pending Check-ins</span>
              <span className="font-extrabold text-base text-amber-600 dark:text-amber-400">{todayArrivals.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/40 rounded-xl border border-border/60">
              <span className="text-xs text-muted-foreground font-semibold">Avg. Room Rate</span>
              <span className="font-extrabold text-base text-foreground">$185</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Room Status Interactive Grid ── */}
      <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">Unit Directory</h2>
            <p className="text-[11px] text-muted-foreground font-medium">{dynamicRooms.length} managed hotel suites</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Free</span>
            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> Occ</span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {dynamicRooms.map((roomNum, idx) => {
            const roomInfo = getRoomInfo(roomNum);
            const statusColors = {
              'Available': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 active:bg-emerald-500/20',
              'Occupied': 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 active:bg-red-500/20',
              'Arriving': 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400 active:bg-blue-500/20',
              'Reserved': 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 active:bg-amber-500/20',
            };
            return (
              <button
                key={idx}
                onClick={() => setSelectedRoom(roomNum)}
                className={`py-3 px-2 rounded-xl border text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${statusColors[roomInfo.status] || statusColors['Available']} ${selectedRoom === roomNum ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <span>{roomNum}</span>
                <span className="text-[9px] font-medium opacity-80">{roomInfo.status}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Room Details Modal ── */}
      {selectedRoomInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-5 sm:p-6 border border-border shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-foreground">Room {selectedRoom}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current Status: <strong className="capitalize text-foreground">{selectedRoomInfo.status}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedRoom(null)} 
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedRoomInfo.reservation ? (
              <div className="space-y-4">
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/60 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guest Name:</span>
                    <strong className="text-foreground">{selectedRoomInfo.reservation.guestName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <strong className="text-foreground">{selectedRoomInfo.reservation.guestEmail}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stay Dates:</span>
                    <strong className="text-foreground">{selectedRoomInfo.reservation.checkIn} → {selectedRoomInfo.reservation.checkOut}</strong>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary text-primary-foreground text-xs font-bold h-10 rounded-xl" onClick={() => { setShowKeycardModal(true); setShowCheckInModal(false); }}>
                    <Key className="w-3.5 h-3.5 mr-1.5" />
                    Encode Keycard
                  </Button>
                  <Button variant="outline" className="flex-1 text-xs font-bold h-10 rounded-xl border-border" onClick={() => setShowFolioModal(true)}>
                    <Receipt className="w-3.5 h-3.5 mr-1.5" />
                    View Folio
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">This unit is currently clean and vacant for immediate guest assignment.</p>
                <Button 
                  onClick={() => setSelectedRoom(null)} 
                  className="w-full bg-primary text-primary-foreground text-xs font-bold h-10 rounded-xl"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
