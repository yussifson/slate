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
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const statusColors = {
  'pending': 'bg-orange-100 text-orange-800',
  'accepted': 'bg-green-100 text-green-800',
  'rejected': 'bg-orange-100 text-orange-800',
  'expired': 'bg-gray-100 text-gray-800',
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage property offers</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ propertyAddress: '', buyerName: '', offerAmount: 0, earnestMoney: 0, contingencies: '', expirationDate: '', agentName: '', notes: '', status: 'pending' }); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Offer
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by property, buyer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOffers.map(offer => (
          <Card key={offer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{offer.property_address || 'No address'}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{offer.buyer_name || 'No buyer'}</p>
                </div>
                <Badge className={statusColors[offer.status] || 'bg-gray-100 text-gray-800'}>{offer.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-bold">${Number(offer.offer_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span>Earnest: ${Number(offer.earnest_money || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm pt-2 border-t">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Expires: {offer.expiration_date ? new Date(offer.expiration_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(offer)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <Card className="text-center py-12">
          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No offers found. Create your first offer!</p>
        </Card>
      )}

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Offer' : 'Create New Offer'}</SheetTitle>
            <SheetDescription>Fill in the offer details below</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Property Address *</label>
              <Input value={formData.propertyAddress} onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })} required />
            </div>

            <div>
              <label className="text-sm font-medium">Buyer Name *</label>
              <Input value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Offer Amount *</label>
                <Input type="number" step="0.01" value={formData.offerAmount} onChange={(e) => setFormData({ ...formData, offerAmount: parseFloat(e.target.value) })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Earnest Money</label>
                <Input type="number" step="0.01" value={formData.earnestMoney} onChange={(e) => setFormData({ ...formData, earnestMoney: parseFloat(e.target.value) })} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Expiration Date *</label>
              <Input type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} required />
            </div>

            <div>
              <label className="text-sm font-medium">Agent Name</label>
              <Input value={formData.agentName} onChange={(e) => setFormData({ ...formData, agentName: e.target.value })} />
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

            <div>
              <label className="text-sm font-medium">Contingencies</label>
              <textarea value={formData.contingencies} onChange={(e) => setFormData({ ...formData, contingencies: e.target.value })} className="w-full p-2 border rounded text-sm" rows="2" placeholder="e.g., Home inspection, financing, appraisal" />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-2 border rounded text-sm" rows="2" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Offer
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
