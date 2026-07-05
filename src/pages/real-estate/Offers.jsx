import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Search, Plus, Edit, Trash2, DollarSign, Calendar, FileText } from 'lucide-react';
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
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
import GenericKanban from '@/components/views/GenericKanban';

const statusColors = {
  'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400',
  'accepted': 'bg-primary/10 text-primary/40 dark:bg-primary/30/40 dark:text-primary/80',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  'expired': 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400',
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
  const [view, setView] = useViewPreference('re_offers', 'grid');
  
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
    fetchOffers();
  }, [companyId]);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      const data = res.rows._array || Array.from(res.rows);
      setOffers(data);
    } catch (e) {
      console.error('[Offers] Fetch failed:', e);
      toast.error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  };

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
      fetchOffers();
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
      fetchOffers();
    } catch (e) {
      console.error('[Offers] Delete failed:', e);
      toast.error('Failed to delete offer');
    }
  };

  const handleStatusChange = async (offerId, newStatus) => {
    try {
      await powerSync.execute(
        'UPDATE univ_re_offers SET status = ?, updated_at = ? WHERE id = ? AND company_id = ?',
        [newStatus, new Date().toISOString(), offerId, companyId]
      );
      toast.success(`Offer marked as ${newStatus}`);
      fetchOffers();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading offers...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Offers</h1>
            <p className="text-muted-foreground mt-2">Track and manage property negotiations</p>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list', 'kanban']} />
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); setFormData({ propertyAddress: '', buyerName: '', offerAmount: 0, earnestMoney: 0, contingencies: '', expirationDate: '', agentName: '', notes: '', status: 'pending' }); }}
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> New Offer
            </Button>
          </div>
        </div>

        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm flex-wrap gap-4">
          <div className="relative flex-1 flex items-center min-w-[200px]">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Input
              placeholder="Search by property, buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-base flex-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-0 bg-transparent shadow-none focus:ring-0 font-medium">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {filteredOffers.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-border">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Offers Found</h3>
            <p className="text-muted-foreground mb-6">Create your first offer to start tracking negotiations.</p>
            <Button onClick={() => setShowForm(true)} className="bg-primary text-white hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Create Offer
            </Button>
          </div>
        ) : view === 'list' ? (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-foreground">Property</th>
                    <th className="p-4 font-semibold text-foreground">Buyer</th>
                    <th className="p-4 font-semibold text-foreground">Offer Amount</th>
                    <th className="p-4 font-semibold text-foreground">Expires</th>
                    <th className="p-4 font-semibold text-foreground">Status</th>
                    <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredOffers.map(offer => (
                    <tr key={offer.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="line-clamp-1">{offer.property_address}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{offer.buyer_name}</td>
                      <td className="p-4 font-bold text-primary dark:text-primary/80">
                        ${Number(offer.offer_amount || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {offer.expiration_date ? new Date(offer.expiration_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${statusColors[offer.status] || 'bg-muted'}`}>
                          {offer.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(offer)} className="h-8 w-8 hover:bg-primary/5 text-primary dark:hover:bg-primary/30/30">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(offer.id)} className="h-8 w-8 hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : view === 'kanban' ? (
          <GenericKanban
            data={filteredOffers}
            statusKey="status"
            titleKey="property_address"
            boardKey="re_offers"
            defaultStages={['pending', 'accepted', 'rejected', 'expired']}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map(offer => (
              <Card key={offer.id} className="p-6 border border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 transition-all rounded-3xl relative overflow-hidden group flex flex-col">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-bl-3xl border-b border-l border-primary/20 pointer-events-none z-0 transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/10 rounded-tl-[4rem] pointer-events-none z-0 transition-colors duration-500 group-hover:bg-primary/20" />
                <div className="absolute top-0 right-0 p-6 flex justify-end w-full">
                  <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm ${statusColors[offer.status] || 'bg-muted'}`}>
                    {offer.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4 pr-24">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/30/30 flex items-center justify-center text-primary dark:text-primary/80 shrink-0">
                    {(offer.buyer_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{offer.property_address}</h3>
                    <p className="text-xs text-muted-foreground">{offer.buyer_name}</p>
                  </div>
                </div>

                <div className="flex flex-col mb-4 pb-4 border-b border-border/50">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Offer Amount</p>
                  <p className="text-2xl font-bold text-primary dark:text-primary/80 tracking-tight">
                    ${Number(offer.offer_amount || 0).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-2xl flex-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Earnest Money</p>
                    <p className="font-medium text-foreground">
                      ${Number(offer.earnest_money || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Expires</p>
                    <p className="font-medium text-foreground">
                      {offer.expiration_date ? new Date(offer.expiration_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(offer)} className="text-primary hover:bg-primary/5 dark:hover:bg-primary/30/20">
                    <Edit className="w-4 h-4 mr-1.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(offer.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent className="w-full max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Edit Offer' : 'Create New Offer'}</SheetTitle>
              <SheetDescription>Fill in the offer details below</SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="text-sm font-medium text-foreground">Property Address *</label>
                <Input className="mt-1" value={formData.propertyAddress} onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Buyer Name *</label>
                <Input className="mt-1" value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Offer Amount *</label>
                  <Input type="number" step="0.01" className="mt-1" value={formData.offerAmount} onChange={(e) => setFormData({ ...formData, offerAmount: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Earnest Money</label>
                  <Input type="number" step="0.01" className="mt-1" value={formData.earnestMoney} onChange={(e) => setFormData({ ...formData, earnestMoney: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Expiration Date *</label>
                <Input type="date" className="mt-1" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Agent Name</label>
                <Input className="mt-1" value={formData.agentName} onChange={(e) => setFormData({ ...formData, agentName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="mt-1">
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
                <label className="text-sm font-medium text-foreground">Contingencies</label>
                <Input className="mt-1" value={formData.contingencies} onChange={(e) => setFormData({ ...formData, contingencies: e.target.value })} placeholder="e.g., Home inspection" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Notes</label>
                <Input className="mt-1" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-6 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-teal-600 text-white">{editingId ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

      </div>
    </div>
  );
}
