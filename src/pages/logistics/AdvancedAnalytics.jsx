import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Truck,
  AlertCircle, CheckCircle2, Clock, Package, Zap
} from 'lucide-react';
import { useLogisticsAnalytics, useOnTimeDeliveryPercentage, useDriverMetrics, useFleetMetrics } from '@/hooks/logistics/useInventoryAndAnalytics';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdvancedAnalytics() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const { data: analytics } = useLogisticsAnalytics();
  const { data: onTimePercentage } = useOnTimeDeliveryPercentage(30);
  const { data: drivers } = useIndustryRecords('driver');
  const { data: vehicles } = useIndustryRecords('vehicle');

  const deliveryTrendData = analytics?.weeklyTrends || [
    { date: 'Sun', delivered: 0, failed: 0, pending: 0 },
    { date: 'Mon', delivered: 0, failed: 0, pending: 0 },
    { date: 'Tue', delivered: 0, failed: 0, pending: 0 },
    { date: 'Wed', delivered: 0, failed: 0, pending: 0 },
    { date: 'Thu', delivered: 0, failed: 0, pending: 0 },
    { date: 'Fri', delivered: 0, failed: 0, pending: 0 },
    { date: 'Sat', delivered: 0, failed: 0, pending: 0 }
  ];

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive logistics performance insights</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border-[0.5px] border-black/9 dark:border-white/8 rounded-xl px-4 py-2 text-sm"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard
          icon={Package}
          title="Total Shipments"
          value={analytics?.totalShipments || 0}
          subtitle="All time"
          trend={12}
        />
        <KPICard
          icon={CheckCircle2}
          title="Delivery Rate"
          value={`${analytics?.deliveryRate?.toFixed(1) || 0}%`}
          subtitle="Successful"
          trend={analytics?.deliveryRate > 90 ? 5 : -3}
          isPercentage
        />
        <KPICard
          icon={Clock}
          title="On-Time %"
          value={`${onTimePercentage?.toFixed(1) || 0}%`}
          subtitle="Last 30 days"
          trend={onTimePercentage > 85 ? 3 : -2}
          isPercentage
        />
        <KPICard
          icon={Truck}
          title="Fleet Utilization"
          value={`${analytics?.vehicleUtilization?.toFixed(1) || 0}%`}
          subtitle="Active vehicles"
          trend={2}
          isPercentage
        />
        <KPICard
          icon={AlertCircle}
          title="Failed Deliveries"
          value={analytics?.failedShipments || 0}
          subtitle={`${((analytics?.failedShipments / analytics?.totalShipments) * 100)?.toFixed(1) || 0}% failure`}
          trend={-analytics?.failedShipments || 0}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="delivery-trends" className="w-full">
        <TabsList>
          <TabsTrigger value="delivery-trends">Delivery Trends</TabsTrigger>
          <TabsTrigger value="driver-performance">Driver Performance</TabsTrigger>
          <TabsTrigger value="sla-compliance">SLA Compliance</TabsTrigger>
          <TabsTrigger value="cost-analysis">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* Delivery Trends */}
        <TabsContent value="delivery-trends">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Delivery Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={deliveryTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="delivered" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Delivered"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Pending"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Driver Performance */}
        <TabsContent value="driver-performance">
          <Card>
            <CardHeader>
              <CardTitle>Driver Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={drivers?.slice(0, 5).map(d => ({
                  name: d.first_name ? `${d.first_name} ${d.last_name || ''}` : d.name || 'Unknown',
                  onTime: (typeof d.notes === 'string' ? JSON.parse(d.notes) : (d.notes || {})).on_time_deliveries || 90,
                  delayed: (typeof d.notes === 'string' ? JSON.parse(d.notes) : (d.notes || {})).delayed_deliveries || 10
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="onTime" stackId="a" fill="#10b981" name="On Time %" />
                  <Bar dataKey="delayed" stackId="a" fill="#ef4444" name="Delayed %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Compliance */}
        <TabsContent value="sla-compliance">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>SLA Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-5xl font-semibold text-green-600 mb-2 tracking-[-0.02em]">94%</div>
                  <p className="text-gray-600">Meeting SLA targets</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Badge className="bg-green-100 text-green-700">Strong</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Common Breach Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Weather Delays</span>
                    <Badge variant="outline">32%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Traffic Congestion</span>
                    <Badge variant="outline">28%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Address Issues</span>
                    <Badge variant="outline">22%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Vehicle Issues</span>
                    <Badge variant="outline">18%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Analysis */}
        <TabsContent value="cost-analysis">
          <Card>
            <CardHeader>
              <CardTitle>Cost Per Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Fuel Costs</p>
                  <p className="text-2xl font-semibold tracking-[-0.02em]">$2.45</p>
                  <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">per delivery</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Labor Costs</p>
                  <p className="text-2xl font-semibold tracking-[-0.02em]">$5.80</p>
                  <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">per delivery</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Costs</p>
                  <p className="text-2xl font-semibold tracking-[-0.02em]">$8.25</p>
                  <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">per delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Tables */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(!drivers || drivers.length === 0) ? (
                <div className="text-sm text-gray-500 py-4 text-center">No drivers found</div>
              ) : drivers.slice(0, 5).map((driver, idx) => {
                const name = driver.first_name ? `${driver.first_name} ${driver.last_name || ''}` : driver.name || 'Unknown Driver';
                const dData = typeof driver.notes === 'string' ? JSON.parse(driver.notes) : (driver.notes || {});
                const rating = dData.rating || 5.0;
                const deliveries = dData.completed_deliveries || dData.deliveries_count || 0;
                
                return (
                <div key={driver.id || idx} className="flex justify-between items-center p-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-md">
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-gray-600 tracking-[0.04em]">{deliveries} deliveries</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Fleet Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(!vehicles || vehicles.length === 0) ? (
                <div className="text-sm text-gray-500 py-4 text-center">No vehicles found</div>
              ) : vehicles.slice(0, 5).map((vehicle, idx) => {
                const vData = typeof vehicle.notes === 'string' ? JSON.parse(vehicle.notes) : (vehicle.notes || {});
                const plate = vData.plate || vData.registration_number || vData.license_plate || vehicle.name || `VH-00${idx+1}`;
                const status = vData.status || 'Available';
                const assignedDriver = vData.assigned_driver_id && drivers ? 
                  (drivers.find(d => d.id === vData.assigned_driver_id)?.first_name || 'Assigned') : '-';
                
                let badgeClass = 'bg-green-100 text-green-700';
                if (status.toLowerCase().includes('route') || status.toLowerCase().includes('transit')) badgeClass = 'bg-orange-100 text-orange-700';
                if (status.toLowerCase().includes('maintenance') || status.toLowerCase().includes('repair')) badgeClass = 'bg-amber-100 text-amber-700';

                return (
                <div key={vehicle.id || idx} className="flex justify-between items-center p-2 border-[0.5px] border-black/9 dark:border-white/8 rounded-md">
                  <div>
                    <p className="font-semibold text-sm">{plate}</p>
                    <p className="text-xs text-gray-600 tracking-[0.04em]">{assignedDriver}</p>
                  </div>
                  <Badge className={badgeClass}>
                    {status}
                  </Badge>
                </div>
              )})}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, title, value, subtitle, trend, isPercentage }) {
  const isPositive = trend > 0;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <Icon className="w-8 h-8 text-primary" />
          <div className={`flex items-center gap-2 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-semibold mb-1 tracking-[-0.02em]">{value}</p>
        <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
