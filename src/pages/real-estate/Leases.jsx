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
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Leases</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage rental agreements and tenants</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out">
          <Plus className="w-4 h-4" /> Add Lease
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm dark:bg-slate-900/50 dark:border-white/10 shadow-sm transition-all duration-300 ease-in-out">
        <CardContent className="p-4 flex gap-4 flex-wrap items-center">
          <div className="flex-1 min-w-[240px]">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
              <Input
                placeholder="Search by property, tenant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-all duration-300"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-background/50 border-border/50 transition-all duration-300 hover:border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leases</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Leases Table */}
      {filteredLeases.length > 0 && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm dark:bg-slate-900/50 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="p-4 font-medium text-muted-foreground">Property</th>
                  <th className="p-4 font-medium text-muted-foreground">Tenant</th>
                  <th className="p-4 font-medium text-muted-foreground">Rent</th>
                  <th className="p-4 font-medium text-muted-foreground">Start Date</th>
                  <th className="p-4 font-medium text-muted-foreground">End Date</th>
                  <th className="p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLeases.map(lease => {
                  const status = getLeaseStatus(lease);
                  const statusColors = {
                    'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/30',
                    'expiring-soon': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/30',
                    'expired': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/30',
                  };
                  
                  return (
                    <tr key={lease.id} className="hover:bg-muted/30 transition-colors duration-200 group">
                      <td className="p-4">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">{lease.property_address}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                            {lease.tenant_name?.charAt(0) || '?'}
                          </div>
                          <span className="text-foreground">{lease.tenant_name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-foreground">
                        ${Number(lease.monthly_rent).toLocaleString()}<span className="text-muted-foreground font-normal text-xs">/mo</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(lease.start_date).toLocaleDateString()}</td>
                      <td className="p-4 text-muted-foreground">{new Date(lease.end_date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`border ${statusColors[status]}`}>
                          {status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filteredLeases.length === 0 && !isLoading && (
        <Card className="text-center py-16 border-dashed border-2 border-border/60 bg-background/50 backdrop-blur-sm dark:bg-slate-900/50 dark:border-white/10 hover:border-primary/50 hover:shadow-xl transition-all duration-300 ease-in-out">
          <CardContent>
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-110">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No leases found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {leases.length === 0 
                ? "Create your first lease to start tracking your rental agreements and tenants." 
                : "No leases match your current search filters."}
            </p>
            {leases.length === 0 && (
              <Button onClick={() => setShowForm(true)} className="gap-2 shadow-sm hover:shadow-md transition-all duration-300">
                <Plus className="w-4 h-4" /> Create First Lease
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l border-border/50 bg-background/95 backdrop-blur-md dark:bg-slate-900/95 dark:border-white/10 shadow-2xl transition-all duration-300">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold tracking-tight">Add New Lease</SheetTitle>
            <SheetDescription>Create a new rental agreement for your property.</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Property Address</label>
              <Input
                value={formData.propertyAddress}
                onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                required
                className="bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-all duration-300"
                placeholder="123 Main St"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tenant Name</label>
              <Input
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                required
                className="bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-all duration-300"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Start Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">End Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Monthly Rent</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) })}
                    className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Security Deposit</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: parseFloat(e.target.value) })}
                    className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 hover:bg-muted/50 transition-colors">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 shadow-sm hover:shadow-md transition-all duration-300">
                Create Lease
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
