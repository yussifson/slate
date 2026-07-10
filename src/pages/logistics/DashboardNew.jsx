import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Truck, Package, Users, TrendingUp, MapPin, AlertTriangle, CheckCircle2, Clock, Zap, ArrowUpRight, ArrowDownLeft, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import LogisticsKPICard from '@/components/logistics/LogisticsKPICard';
import BentoGrid from '@/components/shared/BentoGrid';
import DashboardSectionHeader from '@/components/shared/DashboardSectionHeader';

export default function LogisticsDashboardNew() {
  const { t } = useTranslation();
  const { data: shipments = [], isLoading: isLoadingShipments } = useIndustryRecords('shipment');
  const { data: drivers = [], isLoading: isLoadingDrivers } = useIndustryRecords('driver');
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useIndustryRecords('vehicle');

  // Parse data
  const shipmentsData = shipments.map(s => ({ id: s.id, ...s.data }));
  const driversData = drivers.map(d => ({ id: d.id, ...d.data }));
  const vehiclesData = vehicles.map(v => ({ id: v.id, ...v.data }));

  // Calculate KPIs
  const activeShipments = shipmentsData.filter(s => s.status === 'In Transit').length;
  const completedToday = shipmentsData.filter(s => s.status === 'Delivered' && s.deliveredDate === new Date().toISOString().split('T')[0]).length;
  const onTimeDeliveries = shipmentsData.filter(s => s.status === 'Delivered' && s.onTime).length;
  const totalRevenue = shipmentsData.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const activeDrivers = driversData.filter(d => d.status === 'Active').length;
  const fleetUtilization = vehiclesData.length > 0 ? Math.round((vehiclesData.filter(v => v.status === 'In Use').length / vehiclesData.length) * 100) : 0;
  const avgDeliveryTime = shipmentsData.length > 0 ? Math.round(shipmentsData.reduce((sum, s) => sum + (s.deliveryTime || 0), 0) / shipmentsData.length) : 0;

  // Chart data
  const performanceData = [
    { day: 'Mon', delivered: 45, delayed: 3, pending: 8 },
    { day: 'Tue', delivered: 52, delayed: 2, pending: 6 },
    { day: 'Wed', delivered: 48, delayed: 4, pending: 7 },
    { day: 'Thu', delivered: 61, delayed: 1, pending: 5 },
    { day: 'Fri', delivered: 55, delayed: 2, pending: 9 },
  ];

  const statusData = [
    { name: 'Delivered', value: shipmentsData.filter(s => s.status === 'Delivered').length, color: '#10b981' },
    { name: 'In Transit', value: activeShipments, color: '#0284c7' },
    { name: 'Pending', value: shipmentsData.filter(s => s.status === 'Pending').length, color: '#f59e0b' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div 
      className="min-h-screen pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Professional Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex justify-between items-end gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--logistics-primary))] to-[hsl(var(--logistics-secondary))] bg-clip-text text-transparent tracking-tight mb-2">
              Logistics Command Center
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Real-time fleet and shipment operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-[hsl(var(--logistics-primary))] hover:bg-[hsl(var(--logistics-primary)_/_0.9)] text-white gap-2">
              <Map className="w-4 h-4" />
              Live Map
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Primary KPI Cards */}
      <motion.div variants={itemVariants} className="mb-8">
        <BentoGrid>
          <LogisticsKPICard
            title="Shipments In Transit"
            value={activeShipments}
            subtext={`Out of ${shipmentsData.length} total`}
            icon={<Truck className="w-5 h-5" />}
            status={activeShipments > 20 ? 'optimal' : 'warning'}
            trend="up"
            trendValue="+8%"
          />
          <LogisticsKPICard
            title="On-Time Deliveries"
            value={`${Math.round((onTimeDeliveries / (shipmentsData.filter(s => s.status === 'Delivered').length || 1)) * 100)}%`}
            subtext={`${onTimeDeliveries} deliveries`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            status={Math.round((onTimeDeliveries / (shipmentsData.filter(s => s.status === 'Delivered').length || 1)) * 100) >= 95 ? 'optimal' : 'warning'}
          />
          <LogisticsKPICard
            title="Active Drivers"
            value={activeDrivers}
            subtext={`${driversData.length} total drivers`}
            icon={<Users className="w-5 h-5" />}
            status="optimal"
          />
          <LogisticsKPICard
            title="Daily Revenue"
            value={`$${(totalRevenue / 1000).toFixed(1)}K`}
            subtext="All shipments"
            icon={<TrendingUp className="w-5 h-5" />}
            trend="up"
            trendValue="+$5.2K"
            status="optimal"
          />
        </BentoGrid>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Delivery Performance */}
        <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <DashboardSectionHeader title="Weekly Performance" subtitle="Delivery metrics" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <RechartsTooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="delivered" fill="#10b981" />
              <Bar dataKey="pending" fill="#f59e0b" />
              <Bar dataKey="delayed" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Shipment Status Distribution */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <DashboardSectionHeader title="Status Distribution" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {statusData.map((status, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                  <span className="text-slate-600 dark:text-slate-400">{status.name}</span>
                </div>
                <span className="font-semibold">{status.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Fleet Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Fleet Utilization', value: `${fleetUtilization}%`, icon: <Truck className="w-5 h-5" />, color: 'blue' },
          { title: 'Avg Delivery Time', value: `${avgDeliveryTime}h`, icon: <Clock className="w-5 h-5" />, color: 'amber' },
          { title: 'Completed Today', value: completedToday, icon: <CheckCircle2 className="w-5 h-5" />, color: 'emerald' },
        ].map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{metric.title}</h3>
              <div className={`p-2 rounded-lg ${metric.color === 'blue' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600' : metric.color === 'amber' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600'}`}>
                {metric.icon}
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--logistics-primary))] to-[hsl(var(--logistics-secondary))] bg-clip-text text-transparent">
              {metric.value}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
