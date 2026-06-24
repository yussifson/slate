import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import { Lock, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Download, Plus, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateTrustAccounting } from '@/api/RealEstateTrustAccounting';
import { toast } from 'react-hot-toast';

export default function EscrowAccounts() {
  const companyId = useCompanyId();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, [companyId]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const mockAccounts = [
        {
          id: 1,
          accountNumber: 'ESC-001-2024',
          property: '456 Main St',
          buyer: 'James Wilson',
          seller: 'Margaret Johnson',
          depositAmount: 50000,
          totalAmount: 1200000,
          interestAccrued: 2450,
          status: 'active',
          earnestMoney: 50000,
          inspectionPeriod: 'Pending',
          closingDate: '2024-07-15',
          transactions: [
            { date: '2024-06-20', type: 'Deposit', amount: 50000, balance: 50000 },
            { date: '2024-06-21', type: 'Interest Accrual', amount: 245, balance: 50245 },
          ],
        },
        {
          id: 2,
          accountNumber: 'ESC-002-2024',
          property: '789 Oak Ave',
          buyer: 'Michelle Brown',
          seller: 'Robert Davis',
          depositAmount: 35000,
          totalAmount: 850000,
          interestAccrued: 1680,
          status: 'active',
          earnestMoney: 35000,
          inspectionPeriod: 'Passed',
          closingDate: '2024-07-20',
        },
        {
          id: 3,
          accountNumber: 'ESC-003-2024',
          property: '321 Pine Rd',
          buyer: 'David Martinez',
          seller: 'Sarah Williams',
          depositAmount: 28000,
          totalAmount: 650000,
          interestAccrued: 1120,
          status: 'closed',
          earnestMoney: 28000,
          closedDate: '2024-06-10',
        },
      ];
      setAccounts(mockAccounts);
    } catch (error) {
      toast.error('Failed to load escrow accounts');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalEscrow: accounts.reduce((sum, a) => sum + a.depositAmount, 0),
      activeAccounts: accounts.filter(a => a.status === 'active').length,
      totalInterest: accounts.reduce((sum, a) => sum + a.interestAccrued, 0),
      closedThisMonth: accounts.filter(a => a.status === 'closed').length,
    };
  }, [accounts]);

  const balanceTrendData = [
    { month: 'Jan', balance: 450000, interest: 1800 },
    { month: 'Feb', balance: 520000, interest: 2080 },
    { month: 'Mar', balance: 580000, interest: 2320 },
    { month: 'Apr', balance: 650000, interest: 2600 },
    { month: 'May', balance: 720000, interest: 2880 },
    { month: 'Jun', balance: 685000, interest: 2740 },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Lock className="w-8 h-8 text-blue-600" /></div>
              Escrow Management
            </h1>
            <p className="text-slate-600 mt-2">Track earnest money deposits and escrow accounts</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 h-11">
                <Plus className="w-5 h-5" /> New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Escrow Account</DialogTitle></DialogHeader>
              <form className="space-y-4">
                <Input placeholder="Property Address" />
                <Input placeholder="Buyer Name" />
                <Input placeholder="Deposit Amount" type="number" />
                <Button className="w-full bg-blue-600">Create Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Escrow</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">${(stats.totalEscrow / 1000).toFixed(0)}K</p>
                </div>
                <Lock className="w-10 h-10 text-blue-100 p-2 bg-blue-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Active Accounts</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">{stats.activeAccounts}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-200 p-2 bg-green-200 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Interest Earned</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">${(stats.totalInterest / 1000).toFixed(1)}K</p>
                </div>
                <TrendingUp className="w-10 h-10 text-amber-100 p-2 bg-amber-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Closed This Month</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.closedThisMonth}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-blue-100 p-2 bg-blue-50 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accounts">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Account #</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Property</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Deposit</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Interest</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Close Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map(acc => (
                        <tr key={acc.id} className="border-b hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">{acc.accountNumber}</td>
                          <td className="px-6 py-3 text-slate-600">{acc.property}</td>
                          <td className="px-6 py-3 font-semibold text-slate-900">${(acc.depositAmount / 1000).toFixed(0)}K</td>
                          <td className="px-6 py-3 text-green-600 font-semibold">${(acc.interestAccrued / 1000).toFixed(1)}K</td>
                          <td className="px-6 py-3"><Badge className={acc.status === 'active' ? 'bg-green-100 text-green-900' : 'bg-slate-100 text-slate-900'}>{acc.status}</Badge></td>
                          <td className="px-6 py-3 text-slate-600">{acc.closingDate || acc.closedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Escrow Balance & Interest Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={balanceTrendData}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="balance" fill="#3b82f6" />
                    <Line yAxisId="right" type="monotone" dataKey="interest" stroke="#10b981" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
