import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Plus, Edit, Trash2, Search, DollarSign, Calendar, CheckCircle2, Clock } from 'lucide-react';
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

export default function LeaseRenewals() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [renewals, setRenewals] = useState([]);
  const [filteredRenewals, setFilteredRenewals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    leaseId: '',
    tenantId: '',
    propertyId: '',
    renewalOfferDate: new Date().toISOString().split('T')[0],
    responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    newRentAmount: 0,
    rentIncreasePercentage: 0,
    renewalTermMonths: 12,
    renewalStatus: 'pending',
    tenantResponseDate: '',
    tenantResponse: '',
    renewalTermStartDate: '',
  });

  // Fetch lease renewals
  useEffect(() => {
    const fetchRenewals = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_lease_renewals WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setRenewals(data);
      } catch (e) {
        console.error('[LeaseRenewals] Fetch failed:', e);
        toast.error('Failed to load lease renewals');
      }
      setIsLoading(false);
    };

    if (companyId) fetchRenewals();
  }, [companyId]);

  // Filter renewals
  useEffect(() => {
    let filtered = renewals;
    if (search) {
      filtered = filtered.filter(r =>
        r.lease_id?.toLowerCase().includes(search.toLowerCase()) ||
        r.tenant_id?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.renewal_status === statusFilter);
    }
    setFilteredRenewals(filtered);
  }, [renewals, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateLeaseRenewal(companyId, editingId, formData, user.id);
        toast.success('Lease renewal updated successfully');
      } else {
        await RealEstateAPI.createLeaseRenewal(companyId, formData, user.id);
        toast.success('Lease renewal created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        leaseId: '',
        tenantId: '',
        propertyId: '',
        renewalOfferDate: new Date().toISOString().split('T')[0],
        responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        newRentAmount: 0,
        rentIncreasePercentage: 0,
        renewalTermMonths: 12,
        renewalStatus: 'pending',
        tenantResponseDate: '',
        tenantResponse: '',
        renewalTermStartDate: '',
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_lease_renewals WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRenewals(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[LeaseRenewals] Submit failed:', e);
      toast.error('Failed to save lease renewal');
    }
  };

  const handleEdit = (renewal) => {
    setFormData({
      leaseId: renewal.lease_id || '',
      tenantId: renewal.tenant_id || '',
      propertyId: renewal.property_id || '',
      renewalOfferDate: renewal.renewal_offer_date ? new Date(renewal.renewal_offer_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      responseDeadline: renewal.response_deadline ? new Date(renewal.response_deadline).toISOString().split('T')[0] : '',
      newRentAmount: renewal.new_rent_amount || 0,
      rentIncreasePercentage: renewal.rent_increase_percentage || 0,
      renewalTermMonths: renewal.renewal_term_months || 12,
      renewalStatus: renewal.renewal_status || 'pending',
      tenantResponseDate: renewal.tenant_response_date ? new Date(renewal.tenant_response_date).toISOString().split('T')[0] : '',
      tenantResponse: renewal.tenant_response || '',
      renewalTermStartDate: renewal.renewal_term_start_date ? new Date(renewal.renewal_term_start_date).toISOString().split('T')[0] : '',
    });
    setEditingId(renewal.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lease renewal?')) return;
    try {
      await RealEstateAPI.deleteLeaseRenewal(companyId, id, user.id);
      toast.success('Lease renewal deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_lease_renewals WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRenewals(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[LeaseRenewals] Delete failed:', e);
      toast.error('Failed to delete lease renewal');
    }
  };

  // KPI calculations
  const totalRenewals = renewals.length;
  const pendingRenewals = renewals.filter(r => r.renewal_status === 'pending').length;
  const acceptedRenewals = renewals.filter(r => r.renewal_status === 'accepted').length;
  const totalIncomeIncrease = renewals.reduce((sum, r) => sum + (r.rent_increase_percentage || 0), 0);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-primary/10 text-primary/40';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lease Renewals</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage lease renewal offers and track tenant responses</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          leaseId: '',
          tenantId: '',
          propertyId: '',
          renewalOfferDate: new Date().toISOString().split('T')[0],
          responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          newRentAmount: 0,
          rentIncreasePercentage: 0,
          renewalTermMonths: 12,
          renewalStatus: 'pending',
          tenantResponseDate: '',
          tenantResponse: '',
          renewalTermStartDate: '',
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Renewal
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Total Renewals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{totalRenewals}</div>
            <p className="text-xs text-muted-foreground mt-1">Active renewals</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{pendingRenewals}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold text-green-600 dark:text-green-400">{acceptedRenewals}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed renewals</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Avg Increase
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold text-green-600 dark:text-green-400">{(totalIncomeIncrease / Math.max(totalRenewals, 1)).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Rent increase</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by lease ID or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Renewals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRenewals.map(renewal => (
          <Card key={renewal.id} className="relative group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-bl-3xl border-b border-l border-primary/20 pointer-events-none z-0 transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/10 rounded-tl-[4rem] pointer-events-none z-0 transition-colors duration-500 group-hover:bg-primary/20" />
            <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {renewal.lease_id?.substring(0, 20)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Tenant: {renewal.tenant_id?.substring(0, 20)}</p>
                </div>
                <Badge className={getStatusColor(renewal.renewal_status)}>
                  {renewal.renewal_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium text-muted-foreground">New Rent Amount</p>
                <p className="text-sm font-bold text-primary dark:text-primary/80">${(renewal.new_rent_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                {renewal.rent_increase_percentage && (
                  <p className="text-sm text-primary mt-1">+{renewal.rent_increase_percentage}% increase</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-muted-foreground mb-1">Offer Date</p>
                  <p className="font-medium">{renewal.renewal_offer_date ? new Date(renewal.renewal_offer_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-muted-foreground mb-1">Deadline</p>
                  <p className="font-medium">{renewal.response_deadline ? new Date(renewal.response_deadline).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Term</p>
                  <p className="font-medium">{renewal.renewal_term_months} months</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Property</p>
                  <p className="font-medium">{renewal.property_id?.substring(0, 15)}</p>
                </div>
              </div>

              {renewal.tenant_response && (
                <div className="flex flex-col gap-1 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-muted-foreground mb-1">Tenant Response</p>
                  <p className="text-sm">{renewal.tenant_response}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(renewal)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(renewal.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRenewals.length === 0 && (
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No lease renewals found. Create your first renewal!</p>
        </Card>
      )}

      {/* Renewal Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Lease Renewal' : 'Create Lease Renewal'}</SheetTitle>
            <SheetDescription>Manage lease renewal offers and terms</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Lease ID</label>
              <Input
                value={formData.leaseId}
                onChange={(e) => setFormData({ ...formData, leaseId: e.target.value })}
                placeholder="e.g., LEASE-123"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Tenant ID</label>
                <Input
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  placeholder="Tenant ID"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Property ID</label>
                <Input
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  placeholder="Property ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Offer Date</label>
                <Input
                  type="date"
                  value={formData.renewalOfferDate}
                  onChange={(e) => setFormData({ ...formData, renewalOfferDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Response Deadline</label>
                <Input
                  type="date"
                  value={formData.responseDeadline}
                  onChange={(e) => setFormData({ ...formData, responseDeadline: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">New Rent Amount ($)</label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.newRentAmount}
                  onChange={(e) => setFormData({ ...formData, newRentAmount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Increase %</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.rentIncreasePercentage}
                  onChange={(e) => setFormData({ ...formData, rentIncreasePercentage: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Term (Months)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.renewalTermMonths}
                  onChange={(e) => setFormData({ ...formData, renewalTermMonths: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.renewalStatus} onValueChange={(value) => setFormData({ ...formData, renewalStatus: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Tenant Response (Optional)</label>
              <textarea
                value={formData.tenantResponse}
                onChange={(e) => setFormData({ ...formData, tenantResponse: e.target.value })}
                placeholder="Tenant feedback or response..."
                className="w-full p-2 border rounded text-sm"
                rows="2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Term Start Date (Optional)</label>
              <Input
                type="date"
                value={formData.renewalTermStartDate}
                onChange={(e) => setFormData({ ...formData, renewalTermStartDate: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Renewal
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
