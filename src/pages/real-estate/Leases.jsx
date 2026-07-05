import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Search, Plus, Calendar, DollarSign, AlertCircle, Edit, Trash2 } from 'lucide-react';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
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
  const [view, setView] = useViewPreference('re_leases', 'grid');
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

  const LeaseCard = ({ lease }) => {
    const status = getLeaseStatus(lease);
    const badgeColors = {
      'active': 'bg-primary/10 text-primary/40 dark:bg-primary/30/40 dark:text-primary/80',
      'expiring-soon': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
      'expired': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    };
    
    return (
      <div className="group bg-card/60 backdrop-blur-md border border-border/40 rounded-3xl p-6 hover:shadow-2xl hover:border-primary/50 transition-all relative overflow-hidden flex flex-col h-full hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-bl-[3rem] border-b border-l border-primary/20 pointer-events-none z-0 transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-tl-[5rem] pointer-events-none z-0 transition-colors duration-500 group-hover:bg-primary/20" />
        
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex-1 pr-12">
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{lease.property_address || 'No address'}</h3>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                {(lease.tenant_name || '?')[0].toUpperCase()}
              </span>
              {lease.tenant_name || 'No tenant'}
            </p>
          </div>
        </div>

        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => handleEdit(lease)}
            className="h-8 w-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-primary hover:text-white text-primary transition-colors border-0 shadow-sm"
            title="Edit Lease"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => handleDelete(lease.id)}
            className="h-8 w-8 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-sm hover:bg-red-500 text-red-600 hover:text-white transition-colors border-0 shadow-sm"
            title="Delete Lease"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm flex-1 bg-muted/20 p-4 rounded-2xl border border-border/30 mt-2 relative z-10">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Start Date</p>
            <p className="font-medium text-foreground">{new Date(lease.start_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">End Date</p>
            <p className="font-medium text-foreground">{new Date(lease.end_date).toLocaleDateString()}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Monthly Rent</p>
            <p className="font-bold text-primary dark:text-primary/80 text-lg">${Number(lease.monthly_rent || 0).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mt-auto relative z-10">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeColors[status]}`}>
            {status.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Leases</h1>
            <p className="text-muted-foreground mt-2">Manage rental agreements and tenants</p>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list']} />
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); }}
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Lease
            </Button>
          </div>
        </div>

        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm gap-4 flex-wrap">
          <div className="relative flex-1 flex items-center min-w-[200px]">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Input
              placeholder="Search by property, tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-base flex-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-0 bg-transparent shadow-none focus:ring-0 font-medium">
              <SelectValue placeholder="All Leases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leases</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading leases...</div>
        ) : filteredLeases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl border-border">No leases found.</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLeases.map(lease => (
              <LeaseCard key={lease.id} lease={lease} />
            ))}
          </div>
        ) : (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-foreground">Property</th>
                    <th className="p-4 font-semibold text-foreground">Tenant</th>
                    <th className="p-4 font-semibold text-foreground">Dates</th>
                    <th className="p-4 font-semibold text-foreground">Rent</th>
                    <th className="p-4 font-semibold text-foreground">Status</th>
                    <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredLeases.map(lease => {
                    const status = getLeaseStatus(lease);
                    const badgeColors = {
                      'active': 'bg-primary/10 text-primary/40 dark:bg-primary/30/40 dark:text-primary/80',
                      'expiring-soon': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
                      'expired': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
                    };
                    return (
                      <tr key={lease.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-bold text-foreground">{lease.property_address || 'No address'}</td>
                        <td className="p-4 text-muted-foreground">{lease.tenant_name || 'No tenant'}</td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-bold text-primary dark:text-primary/80">
                          ${Number(lease.monthly_rent || 0).toLocaleString()}/mo
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeColors[status]}`}>
                            {status.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/5 text-primary dark:hover:bg-primary/30/30" onClick={() => handleEdit(lease)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30" onClick={() => handleDelete(lease.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

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
