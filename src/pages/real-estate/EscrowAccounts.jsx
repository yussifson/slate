import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Plus, Edit, Trash2, Search, DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';

export default function EscrowAccounts() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [escrowAccounts, setEscrowAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useViewPreference('re_escrowaccounts', 'grid');
const [formData, setFormData] = useState({
    escrowType: 'earnest_money',
    escrowAmount: 0,
    buyerId: '',
    sellerId: '',
    propertyId: '',
    escrowAgentName: '',
    escrowAgentCompany: '',
    escrowAgentEmail: '',
    escrowAgentPhone: '',
    releaseDate: '',
    releaseConditions: '',
    releaseStatus: 'held',
  });

  // Fetch escrow accounts
  useEffect(() => {
    const fetchEscrows = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_escrow_accounts WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setEscrowAccounts(data);
      } catch (e) {
        console.error('[EscrowAccounts] Fetch failed:', e);
        toast.error('Failed to load escrow accounts');
      }
      setIsLoading(false);
    };

    if (companyId) fetchEscrows();
  }, [companyId]);

  // Filter escrow accounts
  useEffect(() => {
    let filtered = escrowAccounts;
    if (search) {
      filtered = filtered.filter(e =>
        e.escrow_agent_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.property_id?.toLowerCase().includes(search.toLowerCase()) ||
        e.buyer_id?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.release_status === statusFilter);
    }
    setFilteredAccounts(filtered);
  }, [escrowAccounts, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateEscrowAccount(companyId, editingId, formData, user.id);
        toast.success('Escrow account updated successfully');
      } else {
        await RealEstateAPI.createEscrowAccount(companyId, formData, user.id);
        toast.success('Escrow account created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        escrowType: 'earnest_money',
        escrowAmount: 0,
        buyerId: '',
        sellerId: '',
        propertyId: '',
        escrowAgentName: '',
        escrowAgentCompany: '',
        escrowAgentEmail: '',
        escrowAgentPhone: '',
        releaseDate: '',
        releaseConditions: '',
        releaseStatus: 'held',
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_escrow_accounts WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setEscrowAccounts(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[EscrowAccounts] Submit failed:', e);
      toast.error('Failed to save escrow account');
    }
  };

  const handleEdit = (account) => {
    setFormData({
      escrowType: account.escrow_type || 'earnest_money',
      escrowAmount: account.escrow_amount || 0,
      buyerId: account.buyer_id || '',
      sellerId: account.seller_id || '',
      propertyId: account.property_id || '',
      escrowAgentName: account.escrow_agent_name || '',
      escrowAgentCompany: account.escrow_agent_company || '',
      escrowAgentEmail: account.escrow_agent_email || '',
      escrowAgentPhone: account.escrow_agent_phone || '',
      releaseDate: account.release_date ? new Date(account.release_date).toISOString().split('T')[0] : '',
      releaseConditions: account.release_conditions || '',
      releaseStatus: account.release_status || 'held',
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this escrow account?')) return;
    try {
      await RealEstateAPI.deleteEscrowAccount(companyId, id, user.id);
      toast.success('Escrow account deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_escrow_accounts WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setEscrowAccounts(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[EscrowAccounts] Delete failed:', e);
      toast.error('Failed to delete escrow account');
    }
  };

  // KPI calculations
  const totalEscrow = escrowAccounts.reduce((sum, e) => sum + (e.escrow_amount || 0), 0);
  const heldEscrow = escrowAccounts.filter(e => e.release_status === 'held').length;
  const releasedEscrow = escrowAccounts.filter(e => e.release_status === 'released').length;

  const getStatusColor = (status) => {
    switch(status) {
      case 'held': return 'bg-primary/10 text-primary/40';
      case 'released': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'disputed': return 'bg-red-100 text-red-800';
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
          <h1 className="text-3xl font-bold text-foreground">Escrow Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage escrow holdings and releases for transactions</p>
        </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list']} />
            <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          escrowType: 'earnest_money',
          escrowAmount: 0,
          buyerId: '',
          sellerId: '',
          propertyId: '',
          escrowAgentName: '',
          escrowAgentCompany: '',
          escrowAgentEmail: '',
          escrowAgentPhone: '',
          releaseDate: '',
          releaseConditions: '',
          releaseStatus: 'held',
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Escrow
        </Button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-background border border-slate-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-border/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total in Escrow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">${(totalEscrow / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground mt-1">Total holdings</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-background border border-slate-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-border/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Held Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold text-primary dark:text-primary/80">{heldEscrow}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently held</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-background border border-slate-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-border/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Released
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold text-green-600 dark:text-green-400">{releasedEscrow}</div>
            <p className="text-xs text-muted-foreground mt-1">Funds released</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-background border border-slate-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-border/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{escrowAccounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active escrows</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by agent name, property, buyer..."
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
            <SelectItem value="held">Held</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Escrow Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAccounts.map(account => (
          <Card key={account.id} className="relative group bg-white dark:bg-background border border-slate-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
                                <div className="absolute top-0 right-0 border-t-[80px] border-r-[80px] border-t-transparent border-r-primary/10 pointer-events-none group-hover:border-r-primary/20 transition-colors duration-500 z-0" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-[4rem] pointer-events-none z-0 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
                <div className="absolute top-0 right-0 border-t-[80px] border-r-[80px] border-t-transparent border-r-primary/10 pointer-events-none group-hover:border-r-primary/20 transition-colors duration-500 z-0" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-[4rem] pointer-events-none z-0 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
<CardHeader className="relative p-4 border-b border-slate-100 dark:border-border/50 bg-transparent overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {account.property_id}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{account.escrow_type?.replace('_', ' ')}</p>
                </div>
                <Badge className={getStatusColor(account.release_status)}>
                  {account.release_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-secondary/50 rounded-lg border border-slate-100 dark:border-border">
                <p className="text-xs font-medium text-muted-foreground">Escrow Amount</p>
                <p className="text-sm font-bold text-primary dark:text-primary/80">${(account.escrow_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Buyer</p>
                  <p className="font-medium">{account.buyer_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seller</p>
                  <p className="font-medium">{account.seller_id}</p>
                </div>
              </div>

              <div className="border rounded p-2 bg-gray-50">
                <p className="text-xs font-medium text-muted-foreground">Escrow Agent</p>
                <p className="font-medium text-sm">{account.escrow_agent_name}</p>
                <p className="text-xs text-muted-foreground">{account.escrow_agent_company}</p>
              </div>

              {account.release_date && (
                <div className="flex flex-col gap-1 p-2.5 bg-slate-50 dark:bg-secondary/50 rounded-lg border border-slate-100 dark:border-border">
                  <p className="text-xs font-medium text-muted-foreground">Release Date</p>
                  <p className="font-medium">{new Date(account.release_date).toLocaleDateString()}</p>
                </div>
              )}

              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(account)} className="h-7 w-7 text-primary hover:bg-primary/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Edit">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(account.id)} className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <Card className="bg-white dark:bg-background border border-slate-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No escrow accounts found. Create your first escrow!</p>
        </Card>
      )}

      {/* Escrow Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Escrow Account' : 'Create Escrow Account'}</SheetTitle>
            <SheetDescription>Manage escrow holdings for transaction</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Escrow Type</label>
                <Select value={formData.escrowType} onValueChange={(value) => setFormData({ ...formData, escrowType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earnest_money">Earnest Money</SelectItem>
                    <SelectItem value="down_payment">Down Payment</SelectItem>
                    <SelectItem value="closing_costs">Closing Costs</SelectItem>
                    <SelectItem value="repair_escrow">Repair Escrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Release Status</label>
                <Select value={formData.releaseStatus} onValueChange={(value) => setFormData({ ...formData, releaseStatus: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="held">Held</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Escrow Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.escrowAmount}
                onChange={(e) => setFormData({ ...formData, escrowAmount: parseFloat(e.target.value) })}
                placeholder="e.g., 25000"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Buyer ID</label>
                <Input
                  value={formData.buyerId}
                  onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                  placeholder="e.g., BUYER001"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Seller ID</label>
                <Input
                  value={formData.sellerId}
                  onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                  placeholder="e.g., SELLER001"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Property ID</label>
              <Input
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                placeholder="e.g., PROP-123456"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Escrow Agent Name</label>
              <Input
                value={formData.escrowAgentName}
                onChange={(e) => setFormData({ ...formData, escrowAgentName: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Escrow Agent Company</label>
              <Input
                value={formData.escrowAgentCompany}
                onChange={(e) => setFormData({ ...formData, escrowAgentCompany: e.target.value })}
                placeholder="Company name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.escrowAgentEmail}
                  onChange={(e) => setFormData({ ...formData, escrowAgentEmail: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.escrowAgentPhone}
                  onChange={(e) => setFormData({ ...formData, escrowAgentPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Release Date</label>
              <Input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Release Conditions</label>
              <textarea
                value={formData.releaseConditions}
                onChange={(e) => setFormData({ ...formData, releaseConditions: e.target.value })}
                placeholder="Conditions for escrow release..."
                className="w-full p-2 border rounded text-sm"
                rows="3"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Escrow
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
