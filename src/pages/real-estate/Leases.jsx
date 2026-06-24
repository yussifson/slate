import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Search, Plus, Calendar, DollarSign, AlertCircle } from 'lucide-react';
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

export default function Leases() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [leases, setLeases] = useState([]);
  const [filteredLeases, setFilteredLeases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    propertyId: '',
    propertyAddress: '',
    tenantId: '',
    tenantName: '',
    landlordId: '',
    landlordName: '',
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    securityDeposit: 0,
    terms: [],
  });

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setLeases(data);
      } catch (e) {
        console.error('[Leases] Fetch failed:', e);
        toast.error('Failed to load leases');
      }
      setIsLoading(false);
    };

    if (companyId) fetchLeases();
  }, [companyId]);

  useEffect(() => {
    let filtered = leases;
    if (search) {
      filtered = filtered.filter(l =>
        l.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        l.tenant_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    setFilteredLeases(filtered);
  }, [leases, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await RealEstateAPI.createLease(companyId, formData, user.id);
      toast.success('Lease created successfully');
      setShowForm(false);
      setFormData({
        propertyId: '',
        propertyAddress: '',
        tenantId: '',
        tenantName: '',
        landlordId: '',
        landlordName: '',
        startDate: '',
        endDate: '',
        monthlyRent: 0,
        securityDeposit: 0,
        terms: [],
      });
      
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC',
        [companyId]
      );
      setLeases(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[Leases] Submit failed:', e);
      toast.error('Failed to save lease');
    }
  };

  const getLeaseStatus = (lease) => {
    const today = new Date();
    const endDate = new Date(lease.end_date);
    const daysRemaining = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining < 30) return 'expiring-soon';
    return lease.status;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leases</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage rental agreements and tenants</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Lease
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, tenant..."
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
            <SelectItem value="all">All Leases</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leases Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium">Property</th>
              <th className="text-left p-3 font-medium">Tenant</th>
              <th className="text-left p-3 font-medium">Rent</th>
              <th className="text-left p-3 font-medium">Start Date</th>
              <th className="text-left p-3 font-medium">End Date</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeases.map(lease => {
              const status = getLeaseStatus(lease);
              const statusColors = {
                'active': 'bg-green-100 text-green-800',
                'expiring-soon': 'bg-orange-100 text-orange-800',
                'expired': 'bg-orange-100 text-orange-800',
              };
              
              return (
                <tr key={lease.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{lease.property_address}</td>
                  <td className="p-3">{lease.tenant_name}</td>
                  <td className="p-3 font-bold text-green-600">${Number(lease.monthly_rent).toLocaleString()}/mo</td>
                  <td className="p-3">{new Date(lease.start_date).toLocaleDateString()}</td>
                  <td className="p-3">{new Date(lease.end_date).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Badge className={statusColors[status]}>
                      {status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredLeases.length === 0 && (
        <Card className="text-center py-12">
          <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No leases found. Create your first lease!</p>
        </Card>
      )}

      {/* Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Lease</SheetTitle>
            <SheetDescription>Create a new rental agreement</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Property Address</label>
              <Input
                value={formData.propertyAddress}
                onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tenant Name</label>
              <Input
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Monthly Rent</label>
                <Input
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Security Deposit</label>
                <Input
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Lease
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
