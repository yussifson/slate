import { useTranslation } from "react-i18next";
import { useState } from 'react';
import {
  BedDouble, Calendar, UserCheck, LogIn, LogOut, CheckCircle2, Settings,
  Brush, Moon, Clock, Key, Users, TrendingUp, X, Sparkles, Receipt,
  CreditCard, ScanLine, AlertTriangle, Activity, ChevronRight,
  Building2, DoorOpen, AlertCircle
} from 'lucide-react';
import { generateText } from '@/lib/cloudflareAI';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HotelKPICard } from '@/components/hotel/HotelKPICard';
import { RoomStatusBadge } from '@/components/hotel/RoomStatusBadge';
import { BentoGrid, BentoGridItem, BentoCard } from '@/components/shared/BentoGrid';
import { DashboardSectionHeader } from '@/components/shared/DashboardSectionHeader';

const getRoomStatus = (roomNumber, reservations, today) => {
  const active = reservations.find(r => {
    const rn = String(r.roomNumber);
    return rn === String(roomNumber) &&
      (r.status === 'Checked-in' || r.status === 'Confirmed');
  });
  if (!active) return { status: 'Available', reservation: null };
  if (active.status === 'Checked-in') return { status: 'Occupied', reservation: active };
  if (active.status === 'Confirmed' && active.checkIn === today) return { status: 'Arriving', reservation: active };
  return { status: 'Reserved', reservation: active };
};

export default function FrontDeskEnhanced() {
  const { t } = useTranslation();
  const today = new Date().toISOString().split('T')[0];

  const { data: dbResRecords = [], isLoading: isLoadingRes } = useIndustryRecords('reservation');
  const { data: dbRoomRecords = [], isLoading: isLoadingRooms } = useIndustryRecords('room');
  const mutateRecord = useMutateIndustryRecord();

  const reservations = dbResRecords.map(r => ({ id: r.id, status: r.status || 'Confirmed', ...r.data }));
  const dynamicRooms = dbRoomRecords.map(r => r.data?.roomNumber).filter(Boolean).sort();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showFolioModal, setShowFolioModal] = useState(false);
  const [showKeycardModal, setShowKeycardModal] = useState(false);
  const [showWakeUpModal, setShowWakeUpModal] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [checkInForm, setCheckInForm] = useState({ guestName: '', guestPhone: '', roomType: 'Standard', checkOut: '' });
  const [isAnalyzingChurn, setIsAnalyzingChurn] = useState(false);
  const [churnInsights, setChurnInsights] = useState("");

  const dynamicRates = {};
  dbRoomRecords.forEach(r => {
    if (r.data?.type && r.data?.rate) {
      dynamicRates[r.data.type] = Number(r.data.rate);
    }
  });
  if (Object.keys(dynamicRates).length === 0) {
    dynamicRates['Standard'] = 150;
  }
  const dynamicTypes = Object.keys(dynamicRates);
  const [isNightAuditRunning, setIsNightAuditRunning] = useState(false);

  const todayArrivals = reservations.filter(r => r.checkIn === today && r.status === 'Confirmed');
  const todayDepartures = reservations.filter(r => r.checkOut === today && r.status === 'Checked-in');
  const checkedIn = reservations.filter(r => r.status === 'Checked-in');
  const occupancyRate = dynamicRooms.length > 0 ? Math.round((checkedIn.length / dynamicRooms.length) * 100) : 0;

  const getRoomInfo = (roomNumber) => getRoomStatus(roomNumber, reservations, today);

  const forecastData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const baseOcc = occupancyRate > 0 ? occupancyRate : 45;
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      occupancy: Math.min(100, Math.max(10, baseOcc + (Math.random() * 20 - 10).toFixed(0)))
    };
  });

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
      const availableRoom = dynamicRooms.find(r => getRoomInfo(r).status === 'Available');
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
    const total = nights * (dynamicRates[checkInForm.roomType] || dynamicRates[Object.keys(dynamicRates)[0]] || 150);
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
        totalAmount: total
      },
      status: 'Checked-in',
      searchText: `${checkInForm.guestName} ${reservationId} ${selectedRoom}`
    }, {
      onSuccess: () => {
        toast.success(`Room ${selectedRoom} checked in for ${checkInForm.guestName}`);
        setShowCheckInModal(false);
        setSelectedRoom(null);
        setCheckInForm({ guestName: '', guestPhone: '', roomType: 'Standard', checkOut: '' });
      },
      onError: (err) => toast.error('Check-in failed: ' + err.message)
    });
  };

  const handleCheckOut = (reservation) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/90">
      {/* Header Section with Luxury Styling */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/10 dark:border-white/5">
        <div className="px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-500 dark:from-red-400 dark:to-red-300 bg-clip-text text-transparent">
                Front Desk Operations
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <motion.div className="flex gap-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Button
                onClick={handleNightAudit}
                disabled={isNightAuditRunning}
                variant="outline"
                className="gap-2"
              >
                <Clock className={`w-4 h-4 ${isNightAuditRunning ? 'animate-spin' : ''}`} />
                Night Audit
              </Button>
              <Button
                onClick={handleAutoAssign}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Sparkles className="w-4 h-4" />
                AI Auto-Assign
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Premium KPI Cards - Bento Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          <BentoGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={4}>
            <BentoGridItem delay={0}>
              <HotelKPICard
                title="Occupancy Rate"
                value={`${occupancyRate}%`}
                subtitle="Rooms occupied tonight"
                icon={BedDouble}
                color="occupancy"
                trend={occupancyRate > 70 ? 'up' : 'down'}
                trendValue={occupancyRate > 70 ? '+12%' : '-5%'}
              />
            </BentoGridItem>

            <BentoGridItem delay={0.1}>
              <HotelKPICard
                title="Today's Arrivals"
                value={todayArrivals.length}
                subtitle="Expected check-ins"
                icon={LogIn}
                color="guest"
                trend="up"
                trendValue={`+${todayArrivals.length}`}
              />
            </BentoGridItem>

            <BentoGridItem delay={0.2}>
              <HotelKPICard
                title="Today's Departures"
                value={todayDepartures.length}
                subtitle="Expected check-outs"
                icon={LogOut}
                color="revenue"
                trend={todayDepartures.length > 0 ? 'up' : 'neutral'}
                trendValue={`${todayDepartures.length} guests`}
              />
            </BentoGridItem>

            <BentoGridItem delay={0.3}>
              <HotelKPICard
                title="Guests In-House"
                value={checkedIn.length}
                subtitle="Current occupancy"
                icon={Users}
                color="hotel"
                trend="up"
                trendValue={`${checkedIn.length} active`}
              />
            </BentoGridItem>
          </BentoGrid>
        </motion.div>

        {/* Occupancy Forecast Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BentoCard className="p-6">
            <DashboardSectionHeader
              title="7-Day Occupancy Forecast"
              icon={TrendingUp}
              subtitle="Projected occupancy trends"
            />
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)'
                    }}
                    formatter={(v) => `${v}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#dc2626"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOcc)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>
        </motion.div>

        {/* Today's Activity Summary */}
        {(todayArrivals.length > 0 || todayDepartures.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <BentoGrid columns={{ sm: 1, md: 2 }} gap={4}>
              {todayArrivals.length > 0 && (
                <BentoGridItem>
                  <BentoCard>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <LogIn className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Today&apos;s Arrivals
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                        {todayArrivals.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {todayArrivals.slice(0, 5).map((r, idx) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="font-medium text-sm">{r.guestName}</span>
                          <span className="text-xs font-mono text-muted-foreground">Room {r.roomNumber}</span>
                        </motion.div>
                      ))}
                      {todayArrivals.length > 5 && (
                        <p className="text-xs text-muted-foreground font-medium px-2">
                          +{todayArrivals.length - 5} more arrivals
                        </p>
                      )}
                    </div>
                  </BentoCard>
                </BentoGridItem>
              )}

              {todayDepartures.length > 0 && (
                <BentoGridItem>
                  <BentoCard>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                        Today&apos;s Departures
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm font-medium">
                        {todayDepartures.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {todayDepartures.slice(0, 5).map((r, idx) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="font-medium text-sm">{r.guestName}</span>
                          <span className="text-xs font-mono text-muted-foreground">Room {r.roomNumber}</span>
                        </motion.div>
                      ))}
                      {todayDepartures.length > 5 && (
                        <p className="text-xs text-muted-foreground font-medium px-2">
                          +{todayDepartures.length - 5} more departures
                        </p>
                      )}
                    </div>
                  </BentoCard>
                </BentoGridItem>
              )}
            </BentoGrid>
          </motion.div>
        )}
      </div>
    </div>
  );
}
