import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Edit, Trash2, Search, DollarSign, Clock, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

export default function PaymentSchedules() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [automationFilter, setAutomationFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    leaseId: '',
    paymentAmount: 0,
    paymentDueDate: 1,
    gracePeriodDays: 5,
    lateFeesType: 'percentage',
    lateFeeAmount: 0,
    lateFeePercentage: 5,
    paymentMethod: 'bank_transfer',
    autoDebitEnabled: false,
    autoDebitDay: 1,
    reminderDaysBefore: 5,
    isActive: true,
  });

  // Fetch schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_payment_schedules WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setSchedules(data);
      } catch (e) {
        console.error('[PaymentSchedules] Fetch failed:', e);
        toast.error('Failed to load payment schedules');
      }
      setIsLoading(false);
    };

    if (companyId) fetchSchedules();
  }, [companyId]);

  // Filter schedules
  useEffect(() => {
    let filtered = schedules;
    if (search) {
      filtered = filtered.filter(s =>
        s.lease_id?.toLowerCase().includes(search.toLowerCase()) ||
        s.tenant_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (automationFilter !== 'all') {
      filtered = filtered.filter(s => automationFilter === 'auto_debit' ? s.auto_debit_enabled : !s.auto_debit_enabled);
    }
    setFilteredSchedules(filtered);
  }, [schedules, search, automationFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updatePaymentSchedule(companyId, editingId, formData, user.id);
        toast.success('Payment schedule updated successfully');
      } else {
        await RealEstateAPI.createPaymentSchedule(companyId, formData, user.id);
        toast.success('Payment schedule created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        leaseId: '',
        paymentAmount: 0,
        paymentDueDate: 1,
        gracePeriodDays: 5,
        lateFeesType: 'percentage',
        lateFeeAmount: 0,
        lateFeePercentage: 5,
        paymentMethod: 'bank_transfer',
        autoDebitEnabled: false,
        autoDebitDay: 1,
        reminderDaysBefore: 5,
        isActive: true,
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_payment_schedules WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setSchedules(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[PaymentSchedules] Submit failed:', e);
      toast.error('Failed to save payment schedule');
    }
  };

  const handleEdit = (schedule) => {
    setFormData({
      leaseId: schedule.lease_id || '',
      paymentAmount: schedule.payment_amount || 0,
      paymentDueDate: schedule.payment_due_date || 1,
      gracePeriodDays: schedule.grace_period_days || 5,
      lateFeesType: schedule.late_fee_type || 'percentage',
      lateFeeAmount: schedule.late_fee_amount || 0,
      lateFeePercentage: schedule.late_fee_percentage || 5,
      paymentMethod: schedule.payment_method || 'bank_transfer',
      autoDebitEnabled: schedule.auto_debit_enabled !== false,
      autoDebitDay: schedule.auto_debit_day || 1,
      reminderDaysBefore: schedule.reminder_days_before || 5,
      isActive: schedule.is_active !== false,
    });
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment schedule?')) return;
    try {
      await RealEstateAPI.deletePaymentSchedule(companyId, id, user.id);
      toast.success('Payment schedule deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_payment_schedules WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setSchedules(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[PaymentSchedules] Delete failed:', e);
      toast.error('Failed to delete payment schedule');
    }
  };

  // KPI calculations
  const totalSchedules = schedules.length;
  const automatedSchedules = schedules.filter(s => s.auto_debit_enabled).length;
  const totalMonthlyAmount = schedules.reduce((sum, s) => sum + (s.payment_amount || 0), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Schedules</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure and manage rent payment schedules</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          leaseId: '',
          paymentAmount: 0,
          paymentDueDate: 1,
          gracePeriodDays: 5,
          lateFeesType: 'percentage',
          lateFeeAmount: 0,
          lateFeePercentage: 5,
          paymentMethod: 'bank_transfer',
          autoDebitEnabled: false,
          autoDebitDay: 1,
          reminderDaysBefore: 5,
          isActive: true,
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Schedule
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchedules}</div>
            <p className="text-xs text-muted-foreground mt-1">Active payment plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Automated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{automatedSchedules}</div>
            <p className="text-xs text-muted-foreground mt-1">Auto-debit enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalMonthlyAmount / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground mt-1">Total rent collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by lease ID, tenant name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={automationFilter} onValueChange={setAutomationFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schedules</SelectItem>
            <SelectItem value="auto_debit">Auto-Debit Enabled</SelectItem>
            <SelectItem value="manual">Manual Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schedules Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Lease ID</th>
                <th className="text-right py-3 px-4 font-medium">Payment Amount</th>
                <th className="text-left py-3 px-4 font-medium">Due Day</th>
                <th className="text-left py-3 px-4 font-medium">Method</th>
                <th className="text-left py-3 px-4 font-medium">Auto-Debit</th>
                <th className="text-left py-3 px-4 font-medium">Grace Period</th>
                <th className="text-center py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted-foreground">
                    No payment schedules found. Create your first schedule!
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => (
                  <tr key={schedule.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-xs">{schedule.lease_id?.substring(0, 12)}...</td>
                    <td className="py-3 px-4 text-right font-bold">${(schedule.payment_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4">Day {schedule.payment_due_date}</td>
                    <td className="py-3 px-4 text-sm capitalize">{schedule.payment_method?.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <Badge variant={schedule.auto_debit_enabled ? 'default' : 'secondary'}>
                        {schedule.auto_debit_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{schedule.grace_period_days} days</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(schedule)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(schedule.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Schedule Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Payment Schedule' : 'Create Payment Schedule'}</SheetTitle>
            <SheetDescription>Set up recurring payment terms</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Lease ID</label>
              <Input
                value={formData.leaseId}
                onChange={(e) => setFormData({ ...formData, leaseId: e.target.value })}
                placeholder="Reference to lease"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Payment Amount ($)</label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) })}
                  placeholder="e.g., 2500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Day (1-31)</label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData({ ...formData, paymentDueDate: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Grace Period (days)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.gracePeriodDays}
                  onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 p-3 bg-blue-50 rounded">
              <label className="text-sm font-medium">Late Fee Configuration</label>
              <Select value={formData.lateFeesType} onValueChange={(value) => setFormData({ ...formData, lateFeesType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat Amount</SelectItem>
                </SelectContent>
              </Select>
              {formData.lateFeesType === 'percentage' ? (
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.lateFeePercentage}
                  onChange={(e) => setFormData({ ...formData, lateFeePercentage: parseFloat(e.target.value) })}
                  placeholder="e.g., 5%"
                />
              ) : (
                <Input
                  type="number"
                  step="10"
                  min="0"
                  value={formData.lateFeeAmount}
                  onChange={(e) => setFormData({ ...formData, lateFeeAmount: parseFloat(e.target.value) })}
                  placeholder="e.g., $50"
                />
              )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 rounded">
              <input
                type="checkbox"
                id="autoDebit"
                checked={formData.autoDebitEnabled}
                onChange={(e) => setFormData({ ...formData, autoDebitEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="autoDebit" className="text-sm font-medium cursor-pointer">
                Enable automatic debit
              </label>
            </div>

            {formData.autoDebitEnabled && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Auto-Debit Day</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.autoDebitDay}
                    onChange={(e) => setFormData({ ...formData, autoDebitDay: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reminder (days before)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.reminderDaysBefore}
                    onChange={(e) => setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Schedule is active
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Schedule
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
