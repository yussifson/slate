import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Search, Plus, Edit, Trash2, DollarSign, Calendar } from 'lucide-react';
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

const statusColors = {
  'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-500/30',
  'accepted': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 dark:border-green-500/30',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500/30',
  'expired': 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-500/30',
};

export default function Offers() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    propertyAddress: '',
    buyerName: '',
    offerAmount: 0,
    earnestMoney: 0,
    contingencies: '',
    expirationDate: '',
    agentName: '',
    notes: '',
    status: 'pending',
  });

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setOffers(data);
      } catch (e) {
        console.error('[Offers] Fetch failed:', e);
        toast.error('Failed to load offers');
      }
      setIsLoading(false);
    };

    if (companyId) fetchOffers();
  }, [companyId]);

  useEffect(() => {
    let filtered = offers;
    if (search) {
      filtered = filtered.filter(o =>
        o.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        o.buyer_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    setFilteredOffers(filtered);
  }, [offers, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.propertyAddress || !formData.buyerName || !formData.offerAmount || !formData.expirationDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingId) {
        await RealEstateAPI.updateOffer(companyId, editingId, formData, user.id);
        toast.success('Offer updated successfully');
      } else {
        await RealEstateAPI.createOffer(companyId, formData, user.id);
        toast.success('Offer created successfully');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        propertyAddress: '', buyerName: '', offerAmount: 0, earnestMoney: 0,
        contingencies: '', expirationDate: '', agentName: '', notes: '', status: 'pending',
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setOffers(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[Offers] Submit failed:', e);
      toast.error('Failed to save offer');
    }
  };

  const handleEdit = (offer) => {
    setFormData({
      propertyAddress: offer.property_address || '',
      buyerName: offer.buyer_name || '',
      offerAmount: offer.offer_amount || 0,
      earnestMoney: offer.earnest_money || 0,
      contingencies: offer.contingencies || '',
      expirationDate: offer.expiration_date || '',
      agentName: offer.agent_name || '',
      notes: offer.notes || '',
      status: offer.status || 'pending',
    });
    setEditingId(offer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await RealEstateAPI.deleteOffer(companyId, id, user.id);
      toast.success('Offer deleted successfully');
      setOffers(prev => prev.filter(o => o.id !== id));
    } catch (e) {
      console.error('[Offers] Delete failed:', e);
      toast.error('Failed to delete offer');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Offers</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">Track and manage property negotiations</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ propertyAddress: '', buyerName: '', offerAmount: 0, earnestMoney: 0, contingencies: '', expirationDate: '', agentName: '', notes: '', status: 'pending' }); }} className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <Plus className="w-5 h-5" /> New Offer
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 backdrop-blur-xl shadow-sm">
        <div className="flex-1 w-full relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input placeholder="Search by property, buyer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20 transition-all rounded-xl h-11" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20 transition-all">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOffers.map(offer => (
          <Card key={offer.id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 line-clamp-1">{offer.property_address || 'No address'}</CardTitle>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-sm">
                      {(offer.buyer_name || '?')[0].toUpperCase()}
                    </div>
                    {offer.buyer_name || 'No buyer'}
                  </div>
                </div>
                <Badge className={`${statusColors[offer.status] || 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300'} px-2.5 py-0.5 shadow-sm font-medium border-0 capitalize`}>{offer.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
              <div className="flex flex-col mb-5 pb-5 border-b border-slate-100 dark:border-slate-800/50">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mb-1">Offer Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  ${Number(offer.offer_amount || 0).toLocaleString()}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Earnest Money</p>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    {Number(offer.earnest_money || 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Expires</p>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {offer.expiration_date ? new Date(offer.expiration_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 mt-auto border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button size="sm" variant="outline" onClick={() => handleEdit(offer)} className="flex-1 transition-colors dark:hover:bg-white/5 dark:border-white/10">
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(offer.id)} className="text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <TrendingUp className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Offers Found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">It looks like you don't have any active offers at the moment. Create your first offer to start tracking!</p>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ propertyAddress: '', buyerName: '', offerAmount: 0, earnestMoney: 0, contingencies: '', expirationDate: '', agentName: '', notes: '', status: 'pending' }); }} className="gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4" /> Create New Offer
          </Button>
        </Card>
      )}

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto border-l-slate-200 dark:border-l-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-sm font-bold">{editingId ? 'Edit Offer' : 'Create New Offer'}</SheetTitle>
            <SheetDescription className="text-slate-500 dark:text-slate-400">Fill in the offer details below</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Property Address <span className="text-red-500">*</span></label>
              <Input className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30" value={formData.propertyAddress} onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Buyer Name <span className="text-red-500">*</span></label>
              <Input className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30" value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Offer Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input className="pl-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30" type="number" step="0.01" value={formData.offerAmount} onChange={(e) => setFormData({ ...formData, offerAmount: parseFloat(e.target.value) })} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Earnest Money</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input className="pl-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30" type="number" step="0.01" value={formData.earnestMoney} onChange={(e) => setFormData({ ...formData, earnestMoney: parseFloat(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Expiration Date <span className="text-red-500">*</span></label>
              <Input className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30" type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Agent Name</label>
              <Input className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30" value={formData.agentName} onChange={(e) => setFormData({ ...formData, agentName: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-200 dark:border-slate-800">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contingencies</label>
              <textarea value={formData.contingencies} onChange={(e) => setFormData({ ...formData, contingencies: e.target.value })} className="w-full p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600" rows="2" placeholder="e.g., Home inspection, financing, appraisal" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600" rows="2" placeholder="Additional details..." />
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-transform">
                {editingId ? 'Update' : 'Create'} Offer
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
