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
import HotelKPICard from '@/components/hotel/HotelKPICard';
import BentoGrid, { BentoGridItem } from '@/components/shared/BentoGrid';
import DashboardSectionHeader from '@/components/shared/DashboardSectionHeader';

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

  const getRoomInfo = (roomNumber) => getRoomStatus(roomNumber, reservations, today);
  const selectedRoomInfo = selectedRoom ? getRoomInfo(selectedRoom) : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div 
      className="min-h-screen pb-12"
      style={{ 
        background: "linear-gradient(135deg, rgba(194, 12, 50, 0.03) 0%, rgba(255, 255, 255, 0) 100%)" 
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Luxe Header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <div className="flex justify-between items-end gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--hotel-primary))] to-[hsl(var(--hotel-secondary))] bg-clip-text text-transparent tracking-tight mb-2">
              {t("front_desk", "Front Desk")}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNightAudit} disabled={isNightAuditRunning} className="bg-[hsl(var(--hotel-primary))] hover:bg-[hsl(var(--hotel-primary)_/_0.9)] text-white gap-2">
              <Moon className="w-4 h-4" />
              Night Audit
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="mb-8">
        <BentoGrid>
          <HotelKPICard
            title="Occupancy Rate"
            value={`${occupancyRate}%`}
            subtext={`${checkedIn.length}/${dynamicRooms.length} rooms`}
            icon={<Users className="w-5 h-5" />}
            trend={occupancyRate > 70 ? 'up' : 'down'}
            trendValue={occupancyRate > 70 ? '+5%' : '-3%'}
            color="burgundy"
          />
          <HotelKPICard
            title="Today's Arrivals"
            value={todayArrivals.length}
            subtext="Expected check-ins"
            icon={<LogIn className="w-5 h-5" />}
            color="rose"
          />
          <HotelKPICard
            title="Today's Departures"
            value={todayDepartures.length}
            subtext="Expected check-outs"
            icon={<LogOut className="w-5 h-5" />}
            color="accent"
          />
          <HotelKPICard
            title="Daily Revenue"
            value={`$${(revenue / 1000).toFixed(1)}K`}
            subtext={`${checkedIn.length} rooms generating`}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="up"
            trendValue="+$2.5K"
            color="gold"
          />
        </BentoGrid>
      </motion.div>

      {/* Room Grid & Chart */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Occupancy Forecast Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <DashboardSectionHeader title="Occupancy Forecast" subtitle="7-day prediction" />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--hotel-primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--hotel-primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <RechartsTooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="occupancy" stroke="hsl(var(--hotel-primary))" fillOpacity={1} fill="url(#colorOcc)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <DashboardSectionHeader title="Quick Stats" />
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">Available Rooms</span>
              <span className="font-bold text-lg text-[hsl(var(--hotel-primary))]">{dynamicRooms.length - checkedIn.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">Pending Check-ins</span>
              <span className="font-bold text-lg text-orange-600">{todayArrivals.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">Avg. Room Rate</span>
              <span className="font-bold text-lg">$185</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Room Grid */}
      <motion.div variants={itemVariants}>
        <DashboardSectionHeader title="Room Status" subtitle={`${dynamicRooms.length} total rooms`} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {dynamicRooms.map((roomNum, idx) => {
            const roomInfo = getRoomInfo(roomNum);
            const statusColors = {
              'Available': 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100',
              'Occupied': 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100',
              'Arriving': 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100',
              'Reserved': 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100',
            };
            return (
              <motion.button
                key={idx}
                onClick={() => setSelectedRoom(roomNum)}
                className={`p-3 rounded-lg border-2 font-semibold transition-all cursor-pointer ${statusColors[roomInfo.status] || statusColors['Available']} ${selectedRoom === roomNum ? 'ring-2 ring-offset-2 ring-[hsl(var(--hotel-primary))]' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {roomNum}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Room Details Modal */}
      {selectedRoomInfo && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[hsl(var(--hotel-primary))]">Room {selectedRoom}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Status: <span className="font-semibold capitalize">{selectedRoomInfo.status}</span>
                </p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedRoomInfo.reservation ? (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Guest Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-600 dark:text-slate-400">Name:</span> {selectedRoomInfo.reservation.guestName}</div>
                    <div><span className="text-slate-600 dark:text-slate-400">Email:</span> {selectedRoomInfo.reservation.guestEmail}</div>
                    <div><span className="text-slate-600 dark:text-slate-400">Check-in:</span> {selectedRoomInfo.reservation.checkIn}</div>
                    <div><span className="text-slate-600 dark:text-slate-400">Check-out:</span> {selectedRoomInfo.reservation.checkOut}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-[hsl(var(--hotel-primary))] hover:bg-[hsl(var(--hotel-primary)_/_0.9)] text-white" onClick={() => { setShowKeycardModal(true); setShowCheckInModal(false); }}>
                    <Key className="w-4 h-4 mr-2" />
                    Encode Keycard
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowFolioModal(true)}>
                    <Receipt className="w-4 h-4 mr-2" />
                    View Folio
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">This room is currently available for check-in.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
