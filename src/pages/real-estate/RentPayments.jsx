import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Calendar, Home, User, AlertTriangle, CheckCircle, Clock, TrendingUp, Plus } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const statusConfig = {
  pending: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400', icon: Clock },
  paid: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', badge: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400', icon: CheckCircle },
  overdue: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400', icon: AlertTriangle },
  partial: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400', icon: Clock }
};

export default function RentPayments() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    collectionRate: 0
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_rent_payments WHERE company_id = ? ORDER BY due_date DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setPayments(data);

        const collected = data.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
        const pending = data.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
        const overdue = data.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0);
        const rate = data.length > 0 ? (data.filter(p => p.status === 'paid').length / data.length) * 100 : 0;
        
        setStats({ totalCollected: collected, totalPending: pending, totalOverdue: overdue, collectionRate: rate });
      } catch (e) {
        console.error('[RentPayments]:', e);
        toast.error('Failed to load rent payments');
      }
      setIsLoading(false);
    };
    if (companyId) fetchPayments();
  }, [companyId]);

  const upcomingPayments = payments.filter(p => new Date(p.due_date) >= new Date()).slice(0, 5);
  const overDuePayments = payments.filter(p => p.status === 'overdue');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg"><CreditCard className="w-7 h-7 text-orange-600 dark:text-orange-400" /></div>
              Rent Collection
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage tenant rent payments</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 gap-2 shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>

        {/* Form Sheet */}
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent side="right" className="w-full sm:w-96 flex flex-col overflow-hidden">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle>Record Rent Payment</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto pr-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formData = {
                  leaseId: document.getElementById('rent-lease-id')?.value || '',
                  propertyId: document.getElementById('rent-property-id')?.value || '',
                  tenantId: document.getElementById('rent-tenant-id')?.value || '',
                  tenantName: document.getElementById('rent-tenant-name')?.value || '',
                  amount: parseFloat(document.getElementById('rent-amount')?.value) || 0,
                  dueDate: document.getElementById('rent-due-date')?.value || '',
                  paymentMethod: document.getElementById('rent-method')?.value || '',
                  notes: document.getElementById('rent-notes')?.value || ''
                };
                await RealEstateAPI.recordRentPayment(companyId, formData, user?.id);
                const res = await powerSync.execute(
                  'SELECT * FROM univ_re_rent_payments WHERE company_id = ? ORDER BY due_date DESC',
                  [companyId]
                );
                const data = res.rows._array || Array.from(res.rows);
                setPayments(data);
                toast.success('Rent payment recorded');
                setShowForm(false);
              } catch (error) {
                console.error('Error recording payment:', error);
                toast.error('Failed to record payment');
              }
            }} className="space-y-4 mt-6">
              <div><label className="text-xs font-semibold mb-1 block dark:text-gray-300">Lease ID</label>
                <input id="rent-lease-id" type="text" placeholder="Lease ID" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-white rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="text-xs font-semibold mb-1 block dark:text-gray-300">Property ID</label>
                <input id="rent-property-id" type="text" placeholder="Property ID" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-white rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="text-xs font-semibold mb-1 block dark:text-gray-300">Tenant ID</label>
                <input id="rent-tenant-id" type="text" placeholder="Tenant ID" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-white rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="text-xs font-semibold mb-1 block dark:text-gray-300">Tenant Name *</label>
                <input id="rent-tenant-name" type="text" placeholder="Tenant Name" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-white rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500" required /></div>
              <div><label className="text-xs font-semibold mb-1 block dark:text-gray-300">Amount *</label>
                <input id="rent-amount" type="number" placeholder="0.00" step="0.01" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-white rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500" required /></div>
              <div><label className="text-xs font-semibold mb-1 block dark:text-gray-300">Due Date *</label>
                <input id="rent-due-date" type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-white rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500" required /></div>
              <div><label className="text-xs font-semibold mb-1 block dark:text-gray-300">Payment Method</label>
                <select id="rent-method" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-white rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500">
                  <option value="">Select method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                </select></div>
              <div><label className="text-xs font-semibold mb-1 block dark:text-gray-300">Notes</label>
                <textarea id="rent-notes" placeholder="Additional notes" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-white rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500" rows="3"></textarea></div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 shadow-lg hover:shadow-orange-500/25 transition-all duration-300">Record Payment</Button>
            </form>
            </div>
          </SheetContent>
        </Sheet>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-100 dark:text-green-200 text-xs font-semibold uppercase mb-1 tracking-wider">Collected</p>
                  <p className="text-3xl font-bold">${(stats.totalCollected / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-green-200 dark:text-green-300 mt-2">This period</p>
                </div>
                <CheckCircle className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-orange-100 dark:text-orange-200 text-xs font-semibold uppercase mb-1 tracking-wider">Pending</p>
                  <p className="text-3xl font-bold">${(stats.totalPending / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-orange-200 dark:text-orange-300 mt-2">Due soon</p>
                </div>
                <Clock className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-red-100 dark:text-red-200 text-xs font-semibold uppercase mb-1 tracking-wider">Overdue</p>
                  <p className="text-3xl font-bold">${(stats.totalOverdue / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-red-200 dark:text-red-300 mt-2">{overDuePayments.length} payments</p>
                </div>
                <AlertTriangle className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 dark:text-blue-200 text-xs font-semibold uppercase mb-1 tracking-wider">Collection Rate</p>
                  <p className="text-3xl font-bold">{stats.collectionRate.toFixed(0)}%</p>
                  <p className="text-xs text-blue-200 dark:text-blue-300 mt-2">On-time payments</p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Upcoming Payments */}
          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            <CardHeader className="relative p-6 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm"><Calendar className="w-5 h-5" /></div>
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-transparent">
              <div className="max-h-96 overflow-y-auto">
                {upcomingPayments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No upcoming payments</p>
                  </div>
                ) : (
                  upcomingPayments.map((payment) => (
                    <div key={payment.id} className="p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{payment.tenant_name}</p>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 text-xs border-0 shadow-sm">Due Soon</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{payment.property_address || 'Property'}</p>
                      <div className="flex justify-between items-end">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{new Date(payment.due_date).toLocaleDateString()}</p>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">${payment.amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Alerts */}
          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            <CardHeader className="relative p-6 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm"><AlertTriangle className="w-5 h-5" /></div>
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-transparent">
              <div className="max-h-96 overflow-y-auto">
                {overDuePayments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50 text-emerald-500" />
                    <p className="text-sm font-medium">No overdue payments</p>
                  </div>
                ) : (
                  overDuePayments.map((payment) => (
                    <div key={payment.id} className="p-4 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{payment.tenant_name}</p>
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 text-xs border-0 shadow-sm">OVERDUE</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{payment.property_address || 'Property'}</p>
                      <div className="flex justify-between items-end">
                        <p className="text-xs font-medium text-red-600/70 dark:text-red-400/70 bg-red-100/50 dark:bg-red-900/30 px-2 py-0.5 rounded">{new Date(payment.due_date).toLocaleDateString()}</p>
                        <span className="text-sm font-extrabold text-red-600 dark:text-red-400">${payment.amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            <CardHeader className="relative p-6 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm"><CheckCircle className="w-5 h-5" /></div>
                Recent
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-transparent">
              <div className="max-h-96 overflow-y-auto">
                {payments.filter(p => p.status === 'paid').slice(0, 5).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No recent payments</p>
                  </div>
                ) : (
                  payments.filter(p => p.status === 'paid').slice(0, 5).map((payment) => (
                    <div key={payment.id} className="p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{payment.tenant_name}</p>
                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400 text-xs border-0 shadow-sm">Paid</Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 truncate bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit capitalize">{payment.payment_method?.replace('_', ' ') || 'Bank Transfer'}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">${payment.amount?.toLocaleString()}</span>
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{new Date(payment.payment_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Payments Table */}
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
          <CardHeader className="relative p-6 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              All Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-transparent">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Property</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Paid Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map((payment, idx) => (
                    <tr
                      key={payment.id}
                      onClick={() => setSelectedPayment(payment)}
                      className={`border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-100 rounded-full"><User className="w-4 h-4 text-indigo-600" /></div>
                          <p className="font-semibold text-gray-900 text-sm">{payment.tenant_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Home className="w-4 h-4" /> {payment.property_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-bold text-indigo-600">${payment.amount?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{payment.due_date}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{payment.payment_date || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{payment.payment_method || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusConfig[payment.status]?.badge}>{payment.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Details Sheet */}
        <Sheet open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle>Payment Details</SheetTitle>
            </SheetHeader>
            {selectedPayment && (
              <div className="space-y-6 mt-6">
                <div className={`p-4 rounded-lg border-l-4 ${statusConfig[selectedPayment.status]?.bg}`}>
                  <p className={`text-sm font-bold ${statusConfig[selectedPayment.status]?.color}`}>
                    {selectedPayment.status.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Tenant</p>
                    <p className="text-lg font-bold text-gray-900">{selectedPayment.tenant_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Amount</p>
                    <p className="text-3xl font-bold text-indigo-600">${selectedPayment.amount?.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Due Date</p>
                      <p className="text-sm text-gray-900">{selectedPayment.due_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Payment Date</p>
                      <p className="text-sm text-gray-900">{selectedPayment.payment_date || 'Pending'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Payment Method</p>
                    <p className="text-sm text-gray-900">{selectedPayment.payment_method || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
