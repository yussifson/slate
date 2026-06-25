import { useTranslation } from "react-i18next";
import { useState } from 'react';
import {
  Package, MapPin, Truck, Clock, AlertTriangle, CheckCircle,
  Filter, Search, Plus, TrendingUp, Zap, Navigation, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LogisticsPageWrapper } from '@/components/logistics/LogisticsPageWrapper';
import { LogisticsKPICard } from '@/components/logistics/LogisticsKPICard';
import { BentoGrid, BentoGridItem, BentoCard } from '@/components/shared/BentoGrid';
import { DashboardSectionHeader } from '@/components/shared/DashboardSectionHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

export default function ShipmentsEnhanced() {
  const { t } = useTranslation();
  const { data: dbShipments = [], isLoading } = useIndustryRecords('shipment');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const shipments = dbShipments.map(s => ({
    id: s.id,
    status: s.status || 'In Transit',
    ...s.data
  }));

  // Calculate KPI metrics
  const inTransit = shipments.filter(s => s.status === 'In Transit').length;
  const delivered = shipments.filter(s => s.status === 'Delivered').length;
  const delayed = shipments.filter(s => s.status === 'Delayed').length;
  const atRisk = shipments.filter(s => s.status === 'At Risk').length;
  const onTimeRate = shipments.length > 0 ? Math.round((delivered / (shipments.length)) * 100) : 0;

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = !search || 
      s.shipmentId?.toLowerCase().includes(search.toLowerCase()) ||
      s.destination?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusConfig = {
    'In Transit': { color: 'logistics', status: 'optimal', icon: Navigation },
    'Delivered': { color: 'logistics', status: 'optimal', icon: CheckCircle },
    'Delayed': { color: 'logistics', status: 'warning', icon: Clock },
    'At Risk': { color: 'logistics', status: 'critical', icon: AlertTriangle },
    'Pending': { color: 'logistics', status: 'warning', icon: Package },
  };

  return (
    <LogisticsPageWrapper
      title="Shipment Tracking"
      subtitle="Monitor active shipments and delivery status"
      icon={Package}
      actions={
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" />
          New Shipment
        </Button>
      }
    >
      {/* KPI Cards - Premium Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <BentoGrid columns={{ sm: 1, md: 2, lg: 5 }} gap={4}>
          <BentoGridItem delay={0}>
            <LogisticsKPICard
              title="In Transit"
              value={inTransit}
              unit="shipments"
              subtitle="Currently moving"
              icon={Truck}
              color="shipments"
              status="optimal"
              trend="up"
              trendValue={`+${Math.floor(inTransit * 0.1)}`}
            />
          </BentoGridItem>

          <BentoGridItem delay={0.1}>
            <LogisticsKPICard
              title="Delivered"
              value={delivered}
              unit="today"
              subtitle="Successfully completed"
              icon={CheckCircle}
              color="delivery"
              status="optimal"
              trend="up"
              trendValue="+8%"
            />
          </BentoGridItem>

          <BentoGridItem delay={0.2}>
            <LogisticsKPICard
              title="Delayed"
              value={delayed}
              unit="shipments"
              subtitle="Beyond ETA"
              icon={Clock}
              color="logistics"
              status={delayed > 0 ? 'warning' : 'optimal'}
              trend={delayed > 0 ? 'up' : 'down'}
              trendValue={delayed > 0 ? `+${delayed}` : 'On track'}
            />
          </BentoGridItem>

          <BentoGridItem delay={0.3}>
            <LogisticsKPICard
              title="At Risk"
              value={atRisk}
              unit="issues"
              subtitle="Requires attention"
              icon={AlertTriangle}
              color="logistics"
              status={atRisk > 0 ? 'critical' : 'optimal'}
              trend="down"
              trendValue={atRisk > 0 ? `${atRisk} critical` : 'All clear'}
            />
          </BentoGridItem>

          <BentoGridItem delay={0.4}>
            <LogisticsKPICard
              title="On-Time Rate"
              value={`${onTimeRate}%`}
              unit="success"
              subtitle="Delivery accuracy"
              icon={TrendingUp}
              color="performance"
              status={onTimeRate > 80 ? 'optimal' : 'warning'}
              trend="up"
              trendValue={`+${Math.floor(onTimeRate * 0.05)}%`}
            />
          </BentoGridItem>
        </BentoGrid>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col md:flex-row gap-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search shipment ID, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'In Transit', 'Delivered', 'Delayed', 'At Risk'].map((status) => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 dark:bg-white/5 text-foreground hover:bg-white/20 dark:hover:bg-white/10'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Shipments Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <BentoCard>
          <DashboardSectionHeader
            title="Active Shipments"
            subtitle={`${filteredShipments.length} total shipments`}
            icon={Package}
          />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Shipment ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Origin</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Destination</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Driver</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">ETA</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-muted-foreground">
                      Loading shipments...
                    </td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-muted-foreground">
                      No shipments found
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment, idx) => {
                    const config = statusConfig[shipment.status] || statusConfig['In Transit'];
                    return (
                      <motion.tr
                        key={shipment.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4 font-mono text-sm font-semibold">{shipment.shipmentId}</td>
                        <td className="py-4 px-4 text-sm">{shipment.origin}</td>
                        <td className="py-4 px-4 text-sm">{shipment.destination}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                            shipment.status === 'Delivered' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                            shipment.status === 'In Transit' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' :
                            shipment.status === 'Delayed' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                            'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                          }`}>
                            {shipment.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">{shipment.driver || '—'}</td>
                        <td className="py-4 px-4 text-sm font-mono">{shipment.eta || '—'}</td>
                        <td className="py-4 px-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </motion.div>
    </LogisticsPageWrapper>
  );
}
