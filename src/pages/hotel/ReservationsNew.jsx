import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Calendar, Search, Plus, Clock, Trash2, Sparkles, RefreshCcw, Check, Cloud, MoreVertical, FileText, Edit, Activity, User, CreditCard, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateText } from '@/lib/cloudflareAI';
import { Input } from '@/components/ui/input';
import { powerSync } from '@/api/PowerSyncConnector';
import ChannelManagerAPI from '@/api/ChannelManagerAPI';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { usePayment } from '@/hooks/integrations/usePayment';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useNotifications } from "@/hooks/integrations/useNotifications";
import { motion } from 'framer-motion';
import HotelKPICard from '@/components/hotel/HotelKPICard';
import BentoGrid from '@/components/shared/BentoGrid';
import DashboardSectionHeader from '@/components/shared/DashboardSectionHeader';

const statusColors = {
  'Checked-in': 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 text-xs font-semibold',
  'Confirmed': 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 text-xs font-semibold',
  'Checked-out': 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 text-xs font-semibold',
  'Cancelled': 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-800/50 text-xs font-semibold'
};

export default function ReservationsNew() {
  const { t } = useTranslation();
  const { notifyTeam } = useNotifications();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('reservation');
  const { data: groupBlocks = [] } = useIndustryRecords('hotel_group_block');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();
  const companyId = useCompanyId();
  const { processPayment } = usePayment();

  const reservations = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data}));

  const [activeTab, setActiveTab] = useState('reservations');
  const [search, setSearch] = useState('');

  // KPI Calculations
  const confirmedCount = reservations.filter(r => r.status === 'Confirmed').length;
  const checkedInCount = reservations.filter(r => r.status === 'Checked-in').length;
  const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const averageLength = reservations.length > 0 ? Math.round(reservations.reduce((sum, r) => {
    const checkIn = new Date(r.checkIn);
    const checkOut = new Date(r.checkOut);
    return sum + (checkOut - checkIn) / (1000 * 60 * 60 * 24);
  }, 0) / reservations.length) : 0;

  const filteredReservations = reservations.filter(r =>
    r.guestName?.toLowerCase().includes(search.toLowerCase()) ||
    r.reservationId?.includes(search)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div 
      className="min-h-screen pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex justify-between items-end gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--hotel-primary))] to-[hsl(var(--hotel-secondary))] bg-clip-text text-transparent tracking-tight mb-2">
              Reservations
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage all bookings and group blocks</p>
          </div>
          <Button className="bg-[hsl(var(--hotel-primary))] hover:bg-[hsl(var(--hotel-primary)_/_0.9)] text-white gap-2">
            <Plus className="w-4 h-4" />
            New Reservation
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <BentoGrid>
          <HotelKPICard
            title="Total Reservations"
            value={reservations.length}
            subtext="Across all statuses"
            icon={<Calendar className="w-5 h-5" />}
            color="burgundy"
          />
          <HotelKPICard
            title="Confirmed Bookings"
            value={confirmedCount}
            subtext="Pending check-in"
            icon={<Check className="w-5 h-5" />}
            color="rose"
          />
          <HotelKPICard
            title="Currently Checked In"
            value={checkedInCount}
            subtext="Active guests"
            icon={<User className="w-5 h-5" />}
            color="accent"
          />
          <HotelKPICard
            title="Total Revenue"
            value={`$${(totalRevenue / 1000).toFixed(1)}K`}
            subtext={`Avg. ${averageLength} nights`}
            icon={<CreditCard className="w-5 h-5" />}
            trend="up"
            trendValue="+8%"
            color="gold"
          />
        </BentoGrid>
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by guest name or reservation ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2.5 border-slate-200 dark:border-slate-700"
          />
        </div>
      </motion.div>

      {/* Reservations Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <DashboardSectionHeader 
          title="Booking List" 
          subtitle={`${filteredReservations.length} reservations`}
          containerClassName="p-6 border-b border-slate-200 dark:border-slate-800"
        />
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Guest Name</th>
                <th className="px-6 py-4 text-left">Reservation ID</th>
                <th className="px-6 py-4 text-left">Check-in</th>
                <th className="px-6 py-4 text-left">Check-out</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredReservations.map((res, idx) => (
                <motion.tr 
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{res.guestName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{res.reservationId}</td>
                  <td className="px-6 py-4 text-sm">{res.checkIn}</td>
                  <td className="px-6 py-4 text-sm">{res.checkOut}</td>
                  <td className="px-6 py-4">{<span className={statusColors[res.status]}>{res.status}</span>}</td>
                  <td className="px-6 py-4 font-semibold text-[hsl(var(--hotel-primary))]">${(res.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
