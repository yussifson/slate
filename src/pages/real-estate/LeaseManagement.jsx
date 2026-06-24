import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, FileText, AlertCircle, CheckCircle2, DollarSign, Plus, RefreshCw, Bell, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

export default function LeaseManagement() {
  const companyId = useCompanyId();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLease, setSelectedLease] = useState(null);

  useEffect(() => {
    loadLeases();
  }, [companyId]);

  const loadLeases = async () => {
    try {
      setLoading(true);
      const mockLeases = [
        {
          id: 1,
          address: '456 Main St, Unit A',
          tenant: 'John Smith',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          leaseStartDate: '2024-01-15',
          leaseEndDate: '2025-01-14',
          monthlyRent: 2500,
          securityDeposit: 5000,
          leaseStatus: 'active',
          rentPaid: 2500,
          daysUntilRenewal: 214,
          renewalNoticeGiven: false,
          payments: [
            { month: 'Jun', paid: 2500, status: 'paid' },
            { month: 'May', paid: 2500, status: 'paid' },
            { month: 'Apr', paid: 2500, status: 'paid' },
          ],
        },
        {
          id: 2,
          address: '789 Oak Ave, Unit B',
          tenant: 'Michelle Brown',
          email: 'michelle@example.com',
          phone: '+1 (555) 234-5678',
          leaseStartDate: '2023-06-01',
          leaseEndDate: '2024-12-31',
          monthlyRent: 2200,
          securityDeposit: 4400,
          leaseStatus: 'renewal_pending',
          rentPaid: 2200,
          daysUntilRenewal: 198,
          renewalNoticeGiven: true,
          payments: [
            { month: 'Jun', paid: 2200, status: 'paid' },
            { month: 'May', paid: 2200, status: 'paid' },
          ],
        },
        {
          id: 3,
          address: '321 Pine Rd, Unit C',
          tenant: 'Robert Davis',
          email: 'robert@example.com',
          leaseStartDate: '2024-03-01',
          leaseEndDate: '2025-02-28',
          monthlyRent: 1800,
          securityDeposit: 3600,
          leaseStatus: 'active',
          rentPaid: 1800,
          daysUntilRenewal: 245,
          renewalNoticeGiven: false,
          payments: [
            { month: 'Jun', paid: 1800, status: 'paid' },
            { month: 'May', paid: 1800, status: 'paid' },
          ],
        },
      ];
      setLeases(mockLeases);
      setSelectedLease(mockLeases[0]);
    } catch (error) {
      toast.error('Failed to load leases');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      activeLeases: leases.filter(l => l.leaseStatus === 'active').length,
      renewalPending: leases.filter(l => l.leaseStatus === 'renewal_pending').length,
      totalMonthlyRent: leases.filter(l => l.leaseStatus !== 'expired').reduce((sum, l) => sum + l.monthlyRent, 0),
      totalDeposits: leases.reduce((sum, l) => sum + l.securityDeposit, 0),
    };
  }, [leases]);

  const renewalData = useMemo(() => {
    return [
      { name: '0-30 Days', count: leases.filter(l => l.daysUntilRenewal <= 30).length },
      { name: '30-60 Days', count: leases.filter(l => l.daysUntilRenewal > 30 && l.daysUntilRenewal <= 60).length },
      { name: '60+ Days', count: leases.filter(l => l.daysUntilRenewal > 60).length },
    ];
  }, [leases]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  if (loading) return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><FileText className="w-8 h-8 text-green-600" /></div>
              Lease Management
            </h1>
            <p className="text-slate-600 mt-2">Track leases, renewals, and payment schedules</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700 h-11">
                <Plus className="w-5 h-5" /> New Lease
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Lease</DialogTitle></DialogHeader>
              <form className="space-y-4">
                <Input placeholder="Property Address" />
                <Input placeholder="Tenant Name" />
                <Input placeholder="Monthly Rent" type="number" />
                <Button className="w-full bg-green-600">Create Lease</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Active Leases</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.activeLeases}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-100 p-2 bg-blue-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700">Renewals Pending</p>
                  <p className="text-2xl font-bold text-amber-900 mt-2">{stats.renewalPending}</p>
                </div>
                <Clock className="w-10 h-10 text-amber-200 p-2 bg-amber-200 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">${(stats.totalMonthlyRent / 1000).toFixed(1)}K</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-100 p-2 bg-green-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Security Deposits</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">${(stats.totalDeposits / 1000).toFixed(1)}K</p>
                </div>
                <Lock className="w-10 h-10 text-slate-100 p-2 bg-slate-50 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leases">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
            <TabsTrigger value="leases">Leases</TabsTrigger>
            <TabsTrigger value="renewals">Renewals</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="leases" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Property</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Tenant</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Monthly Rent</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Lease End</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leases.map(lease => (
                        <tr key={lease.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedLease(lease)}>
                          <td className="px-6 py-3 font-medium text-slate-900">{lease.address}</td>
                          <td className="px-6 py-3 text-slate-600">{lease.tenant}</td>
                          <td className="px-6 py-3 font-semibold text-slate-900">${lease.monthlyRent.toLocaleString()}</td>
                          <td className="px-6 py-3 text-slate-600">{new Date(lease.leaseEndDate).toLocaleDateString()}</td>
                          <td className="px-6 py-3"><Badge className={lease.leaseStatus === 'active' ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'}>{lease.leaseStatus.replace('_', ' ')}</Badge></td>
                          <td className="px-6 py-3"><Button variant="outline" size="sm">View</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="renewals" className="mt-6">
            <div className="grid grid-cols-3 gap-6">
              <Card className="col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Lease Renewals Timeline</CardTitle>
                  <CardDescription>By days until renewal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leases.filter(l => l.leaseStatus === 'renewal_pending').map(lease => (
                      <div key={lease.id} className="p-4 bg-slate-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">{lease.address}</p>
                            <p className="text-sm text-slate-600">{lease.tenant}</p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-900">{lease.daysUntilRenewal} days</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Renewal notice: {lease.renewalNoticeGiven ? '✓ Sent' : '⚠️ Not sent'}</span>
                          <Button variant="outline" size="sm">Send Notice</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Renewal Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={renewalData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Last 3 months</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedLease && (
                  <div className="space-y-3">
                    {selectedLease.payments.map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-900">{payment.month}</p>
                          <p className="text-sm text-slate-600">{selectedLease.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">${payment.paid.toLocaleString()}</p>
                          <Badge className="bg-green-100 text-green-900 text-xs">{payment.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
