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

  // Sample data for charts
  const deliveryTrendData = [
    { date: 'Mon', delivered: 24, failed: 4, pending: 8 },
    { date: 'Tue', delivered: 28, failed: 3, pending: 6 },
    { date: 'Wed', delivered: 32, failed: 2, pending: 5 },
    { date: 'Thu', delivered: 26, failed: 5, pending: 7 },
    { date: 'Fri', delivered: 35, failed: 1, pending: 4 },
    { date: 'Sat', delivered: 20, failed: 2, pending: 3 },
    { date: 'Sun', delivered: 15, failed: 1, pending: 2 }
  ];

  const driverPerformanceData = [
    { name: 'Driver A', onTime: 95, delayed: 5 },
    { name: 'Driver B', onTime: 92, delayed: 8 },
    { name: 'Driver C', onTime: 88, delayed: 12 },
    { name: 'Driver D', onTime: 96, delayed: 4 },
    { name: 'Driver E', onTime: 89, delayed: 11 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive logistics performance insights</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm"
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
                <BarChart data={driverPerformanceData}>
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
                  <div className="text-5xl font-bold text-green-600 mb-2">94%</div>
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
                  <p className="text-2xl font-bold">$2.45</p>
                  <p className="text-xs text-gray-500 mt-1">per delivery</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Labor Costs</p>
                  <p className="text-2xl font-bold">$5.80</p>
                  <p className="text-xs text-gray-500 mt-1">per delivery</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Costs</p>
                  <p className="text-2xl font-bold">$8.25</p>
                  <p className="text-xs text-gray-500 mt-1">per delivery</p>
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
              {[
                { name: 'John Smith', rating: 4.8, deliveries: 487 },
                { name: 'Maria Garcia', rating: 4.7, deliveries: 452 },
                { name: 'Ahmed Hassan', rating: 4.6, deliveries: 428 }
              ].map((driver, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-semibold text-sm">{driver.name}</p>
                    <p className="text-xs text-gray-600">{driver.deliveries} deliveries</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{driver.rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </div>
                </div>
              ))}
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
              {[
                { plate: 'VH-001', status: 'On Route', driver: 'John Smith' },
                { plate: 'VH-002', status: 'Available', driver: '-' },
                { plate: 'VH-003', status: 'Maintenance', driver: '-' }
              ].map((vehicle, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-semibold text-sm">{vehicle.plate}</p>
                    <p className="text-xs text-gray-600">{vehicle.driver}</p>
                  </div>
                  <Badge className={vehicle.status === 'On Route' ? 'bg-orange-100 text-orange-700' : vehicle.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {vehicle.status}
                  </Badge>
                </div>
              ))}
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
          <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
