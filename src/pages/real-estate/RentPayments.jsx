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
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const statusConfig = {
  pending: { color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', icon: Clock },
  paid: { color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', icon: CheckCircle },
  overdue: { color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  partial: { color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', icon: Clock }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg"><CreditCard className="w-7 h-7 text-indigo-600" /></div>
              Rent Collection
            </h1>
            <p className="text-gray-600 mt-1">Track and manage tenant rent payments</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
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
              <div><label className="text-xs font-semibold mb-1 block">Lease ID</label>
                <input id="rent-lease-id" type="text" placeholder="Lease ID" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Property ID</label>
                <input id="rent-property-id" type="text" placeholder="Property ID" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Tenant ID</label>
                <input id="rent-tenant-id" type="text" placeholder="Tenant ID" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Tenant Name *</label>
                <input id="rent-tenant-name" type="text" placeholder="Tenant Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
              <div><label className="text-xs font-semibold mb-1 block">Amount *</label>
                <input id="rent-amount" type="number" placeholder="0.00" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
              <div><label className="text-xs font-semibold mb-1 block">Due Date *</label>
                <input id="rent-due-date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
              <div><label className="text-xs font-semibold mb-1 block">Payment Method</label>
                <select id="rent-method" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Select method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                </select></div>
              <div><label className="text-xs font-semibold mb-1 block">Notes</label>
                <textarea id="rent-notes" placeholder="Additional notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="3"></textarea></div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Record Payment</Button>
            </form>
            </div>
          </SheetContent>
        </Sheet>

        {/* Financial Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-100 text-xs font-semibold uppercase mb-1">Collected</p>
                  <p className="text-3xl font-bold">${(stats.totalCollected / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-green-200 mt-2">This period</p>
                </div>
                <CheckCircle className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-semibold uppercase mb-1">Pending</p>
                  <p className="text-3xl font-bold">${(stats.totalPending / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-blue-200 mt-2">Due soon</p>
                </div>
                <Clock className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-red-100 text-xs font-semibold uppercase mb-1">Overdue</p>
                  <p className="text-3xl font-bold">${(stats.totalOverdue / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-red-200 mt-2">{overDuePayments.length} payments</p>
                </div>
                <AlertTriangle className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-semibold uppercase mb-1">Collection Rate</p>
                  <p className="text-3xl font-bold">{stats.collectionRate.toFixed(0)}%</p>
                  <p className="text-xs text-purple-200 mt-2">On-time payments</p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Upcoming Payments */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {upcomingPayments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming payments</p>
                  </div>
                ) : (
                  upcomingPayments.map((payment) => (
                    <div key={payment.id} className="p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900 text-sm">{payment.tenant_name}</p>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Due Soon</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{payment.property_address || 'Property'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-indigo-600">${payment.amount?.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">{payment.due_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Alerts */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {overDuePayments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-green-500" />
                    <p className="text-sm">No overdue payments</p>
                  </div>
                ) : (
                  overDuePayments.map((payment) => (
                    <div key={payment.id} className="p-4 border-b border-red-100 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900 text-sm">{payment.tenant_name}</p>
                        <Badge className="bg-red-200 text-red-900 text-xs">OVERDUE</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{payment.property_address || 'Property'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-red-600">${payment.amount?.toLocaleString()}</span>
                        <span className="text-xs text-red-600 font-semibold">Due {payment.due_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {payments.filter(p => p.status === 'paid').slice(0, 5).length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent payments</p>
                  </div>
                ) : (
                  payments.filter(p => p.status === 'paid').slice(0, 5).map((payment) => (
                    <div key={payment.id} className="p-4 border-b border-gray-100 hover:bg-green-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900 text-sm">{payment.tenant_name}</p>
                        <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{payment.payment_method || 'Bank Transfer'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-green-600">${payment.amount?.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">{payment.payment_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Payments Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              All Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
