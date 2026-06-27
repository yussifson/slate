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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lease?')) return;
    try {
      await RealEstateAPI.deleteLease(companyId, id, user.id);
      toast.success('Lease deleted successfully');
      setLeases(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      console.error('[Leases] Delete failed:', e);
      toast.error('Failed to delete lease');
    }
  };

  const handleEdit = (lease) => {
    setFormData({
      propertyAddress: lease.property_address || '',
      tenantName: lease.tenant_name || '',
      monthlyRent: lease.monthly_rent || 0,
      securityDeposit: lease.security_deposit || 0,
      startDate: lease.start_date || '',
      endDate: lease.end_date || '',
      paymentDay: lease.payment_day || 1,
      notes: lease.notes || '',
    });
    setEditingId(lease.id);
    setShowForm(true);
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
      <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
        <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
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

      {/* Leases Grid */}
      {filteredLeases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLeases.map(lease => {
            const status = getLeaseStatus(lease);
            const statusColors = {
              'active': 'from-emerald-400 to-green-500',
              'expiring-soon': 'from-amber-400 to-orange-500',
              'expired': 'from-red-400 to-rose-500',
            };
            const badgeColors = {
              'active': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
              'expiring-soon': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
              'expired': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
            };
            
            return (
              <Card key={lease.id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
                <div className={`h-1.5 w-full bg-gradient-to-r ${statusColors[status]}`} />
                <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 line-clamp-1">{lease.property_address || 'No address'}</CardTitle>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
                          {(lease.tenant_name || '?')[0].toUpperCase()}
                        </div>
                        {lease.tenant_name || 'No tenant'}
                      </div>
                    </div>
                    <Badge className={`${badgeColors[status]} px-2.5 py-0.5 shadow-sm font-medium border-0 capitalize whitespace-nowrap`}>
                      {status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Monthly Rent</p>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                      ${Number(lease.monthly_rent || 0).toLocaleString()}
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-500 ml-1">/mo</span>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Start Date</p>
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(lease.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">End Date</p>
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(lease.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 mt-auto border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(lease)} className="flex-1 transition-colors dark:hover:bg-white/5 dark:border-white/10">
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(lease.id)} className="text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredLeases.length === 0 && !isLoading && (
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
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
