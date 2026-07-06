import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Plus, Edit, Trash2, Search, MessageCircle, TrendingUp, Clock, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
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

export default function CounterOffers() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [counterOffers, setCounterOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useViewPreference('re_counteroffers', 'grid');
const [formData, setFormData] = useState({
    originalOfferId: '',
    counterPrice: 0,
    counterAmount: 0,
    earnestMoney: 0,
    contingencies: '',
    expirationDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    notes: '',
    status: 'pending',
  });

  // Fetch counter offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_counter_offers WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setCounterOffers(data);
      } catch (e) {
        console.error('[CounterOffers] Fetch failed:', e);
        toast.error('Failed to load counter offers');
      }
      setIsLoading(false);
    };

    if (companyId) fetchOffers();
  }, [companyId]);

  // Filter counter offers
  useEffect(() => {
    let filtered = counterOffers;
    if (search) {
      filtered = filtered.filter(o =>
        o.original_offer_id?.toLowerCase().includes(search.toLowerCase()) ||
        o.property_address?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.counter_offer_status === statusFilter);
    }
    setFilteredOffers(filtered);
  }, [counterOffers, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateCounterOffer(companyId, editingId, formData, user.id);
        toast.success('Counter offer updated successfully');
      } else {
        await RealEstateAPI.createCounterOffer(companyId, formData, user.id);
        toast.success('Counter offer created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        originalOfferId: '',
        counterPrice: 0,
        counterAmount: 0,
        earnestMoney: 0,
        contingencies: '',
        expirationDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        notes: '',
        status: 'pending',
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_counter_offers WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setCounterOffers(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[CounterOffers] Submit failed:', e);
      toast.error('Failed to save counter offer');
    }
  };

  const handleEdit = (offer) => {
    setFormData({
      originalOfferId: offer.original_offer_id || '',
      counterPrice: offer.counter_price || 0,
      counterAmount: offer.counter_price || 0,
      earnestMoney: offer.earnest_money_change || 0,
      contingencies: offer.contingencies || '',
      expirationDate: offer.closing_date ? new Date(offer.closing_date).toISOString().split('T')[0] : new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
      notes: offer.additional_terms || '',
      status: offer.counter_offer_status || 'pending',
    });
    setEditingId(offer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this counter offer?')) return;
    try {
      await RealEstateAPI.deleteCounterOffer(companyId, id, user.id);
      toast.success('Counter offer deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_counter_offers WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setCounterOffers(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[CounterOffers] Delete failed:', e);
      toast.error('Failed to delete counter offer');
    }
  };

  // KPI calculations
  const totalCounters = counterOffers.length;
  const pendingCounters = counterOffers.filter(o => o.counter_offer_status === 'pending').length;
  const acceptedCounters = counterOffers.filter(o => o.counter_offer_status === 'accepted').length;
  const totalValue = counterOffers.reduce((sum, o) => sum + (o.counter_price || 0), 0);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-primary/10 text-primary/40';
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
          <h1 className="text-3xl font-bold text-foreground">Counter Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage offer negotiations and counter-offers</p>
        </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list']} />
            <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          originalOfferId: '',
          counterPrice: 0,
          counterAmount: 0,
          earnestMoney: 0,
          contingencies: '',
          expirationDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
          notes: '',
          status: 'pending',
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Counter
        </Button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Total Counters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{totalCounters}</div>
            <p className="text-xs text-muted-foreground mt-1">Negotiations in progress</p>
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
            <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{pendingCounters}</div>
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
            <div className="text-sm font-bold text-green-600 dark:text-green-400">{acceptedCounters}</div>
            <p className="text-xs text-muted-foreground mt-1">Agreed terms</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">${(totalValue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground mt-1">In negotiations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by offer ID, address..."
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
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Counter Offers Table */}
      <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Original Offer</th>
                <th className="text-left py-3 px-4 font-medium">Property</th>
                <th className="text-right py-3 px-4 font-medium">Counter Price</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Expires</th>
                <th className="text-center py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted-foreground">
                    No counter offers found. Create your first counter offer!
                  </td>
                </tr>
              ) : (
                filteredOffers.map(offer => {
                  const isExpired = offer.closing_date && new Date(offer.closing_date) < new Date();
                  return (
                    <tr key={offer.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{offer.original_offer_id}</td>
                      <td className="py-3 px-4 text-sm">{offer.property_address || offer.original_offer_id}</td>
                      <td className="py-3 px-4 text-right font-bold">${(offer.counter_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(isExpired ? 'expired' : offer.counter_offer_status)}>
                          {isExpired ? 'Expired' : offer.counter_offer_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {offer.closing_date ? new Date(offer.closing_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(offer)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(offer.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Counter Offer Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Counter Offer' : 'Create Counter Offer'}</SheetTitle>
            <SheetDescription>Propose terms for offer negotiation</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Original Offer ID</label>
              <Input
                value={formData.originalOfferId}
                onChange={(e) => setFormData({ ...formData, originalOfferId: e.target.value })}
                placeholder="Reference to original offer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Counter Price ($)</label>
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.counterPrice}
                  onChange={(e) => setFormData({ ...formData, counterPrice: parseFloat(e.target.value) })}
                  placeholder="e.g., 450000"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Earnest Money ($)</label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={formData.earnestMoney}
                  onChange={(e) => setFormData({ ...formData, earnestMoney: parseFloat(e.target.value) })}
                  placeholder="e.g., 5000"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Contingencies</label>
              <textarea
                value={formData.contingencies}
                onChange={(e) => setFormData({ ...formData, contingencies: e.target.value })}
                placeholder="e.g., Inspection, appraisal, financing..."
                className="w-full p-2 border rounded text-sm"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Expiration Date</label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details for this counter offer..."
                className="w-full p-2 border rounded text-sm"
                rows="3"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Counter Offer
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
