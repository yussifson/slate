import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Package, Search, Plus, MapPin, Truck, CheckCircle2, Clock, AlertCircle, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import LogisticsKPICard from '@/components/logistics/LogisticsKPICard';
import BentoGrid from '@/components/shared/BentoGrid';
import DashboardSectionHeader from '@/components/shared/DashboardSectionHeader';

const statusBadgeColors = {
  'Pending': 'bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400',
  'In Transit': 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
  'Out for Delivery': 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
  'Delivered': 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
  'Cancelled': 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
};

const statusIcons = {
  'Pending': <Clock className="w-4 h-4" />,
  'In Transit': <Truck className="w-4 h-4" />,
  'Out for Delivery': <MapPin className="w-4 h-4" />,
  'Delivered': <CheckCircle2 className="w-4 h-4" />,
  'Cancelled': <AlertCircle className="w-4 h-4" />,
};

export default function ShipmentsTrackingNew() {
  const { t } = useTranslation();
  const { data: shipments = [] } = useIndustryRecords('shipment');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const shipmentsData = shipments.map(s => ({ id: s.id, ...s.data }));

  // KPI Calculations
  const totalShipments = shipmentsData.length;
  const deliveredCount = shipmentsData.filter(s => s.status === 'Delivered').length;
  const inTransitCount = shipmentsData.filter(s => s.status === 'In Transit').length;
  const onTimePercentage = shipmentsData.length > 0 ? Math.round((shipmentsData.filter(s => s.onTime).length / deliveredCount || 1) * 100) : 0;

  // Filter shipments
  const filteredShipments = shipmentsData.filter(s => {
    const matchesSearch = s.trackingId?.includes(search) || s.destination?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  };

  return (
    <motion.div 
      className="min-h-screen pb-12"
      style={{ 
        background: "linear-gradient(135deg, rgba(2, 132, 199, 0.03) 0%, rgba(255, 255, 255, 0) 100%)" 
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex justify-between items-end gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--logistics-primary))] to-[hsl(var(--logistics-secondary))] bg-clip-text text-transparent tracking-tight mb-2">
              Shipment Tracking
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Monitor all packages and deliveries in real-time</p>
          </div>
          <Button className="bg-[hsl(var(--logistics-primary))] hover:bg-[hsl(var(--logistics-primary)_/_0.9)] text-white gap-2">
            <Plus className="w-4 h-4" />
            New Shipment
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <BentoGrid>
          <LogisticsKPICard
            title="Total Shipments"
            value={totalShipments}
            subtext="All-time shipments"
            icon={<Package className="w-5 h-5" />}
            status="optimal"
          />
          <LogisticsKPICard
            title="In Transit"
            value={inTransitCount}
            subtext="Active deliveries"
            icon={<Truck className="w-5 h-5" />}
            status={inTransitCount > 10 ? 'optimal' : 'warning'}
          />
          <LogisticsKPICard
            title="Delivered"
            value={deliveredCount}
            subtext="Completed"
            icon={<CheckCircle2 className="w-5 h-5" />}
            status="optimal"
          />
          <LogisticsKPICard
            title="On-Time Rate"
            value={`${onTimePercentage}%`}
            subtext="Delivery performance"
            icon={<Clock className="w-5 h-5" />}
            status={onTimePercentage >= 95 ? 'optimal' : onTimePercentage >= 80 ? 'warning' : 'critical'}
          />
        </BentoGrid>
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by tracking ID or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2.5"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
        >
          <option>All</option>
          <option>Pending</option>
          <option>In Transit</option>
          <option>Out for Delivery</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
      </motion.div>

      {/* Shipments Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <DashboardSectionHeader 
          title="Shipments" 
          subtitle={`${filteredShipments.length} results`}
          containerClassName="p-6 border-b border-slate-200 dark:border-slate-800"
        />
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Tracking ID</th>
                <th className="px-6 py-4 text-left">Destination</th>
                <th className="px-6 py-4 text-left">Driver</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Est. Delivery</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredShipments.map((shipment, idx) => (
                <motion.tr 
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{shipment.trackingId}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{shipment.destination}</td>
                  <td className="px-6 py-4 text-sm">{shipment.driver || 'Unassigned'}</td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadgeColors[shipment.status] || statusBadgeColors['Pending']}`}>
                      {statusIcons[shipment.status] || statusIcons['Pending']}
                      {shipment.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{shipment.shipDate}</td>
                  <td className="px-6 py-4 text-sm">{shipment.estimatedDelivery}</td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <MapPin className="w-4 h-4" />
                          View on Map
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-600">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
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
