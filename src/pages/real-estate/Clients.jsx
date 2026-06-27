import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, DollarSign } from 'lucide-react';
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

const typeColors = {
  'buyer': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
  'seller': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  'tenant': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  'landlord': 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
};

export default function Clients() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'buyer',
    address: '',
    city: '',
    state: '',
    country: '',
    budget: 0,
    preferences: [],
    notes: '',
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setClients(data);
      } catch (e) {
        console.error('[Clients] Fetch failed:', e);
        toast.error('Failed to load clients');
      }
      setIsLoading(false);
    };

    if (companyId) fetchClients();
  }, [companyId]);

  useEffect(() => {
    let filtered = clients;
    if (search) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }
    setFilteredClients(filtered);
  }, [clients, search, typeFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateClient(companyId, editingId, formData, user.id);
        toast.success('Client updated successfully');
      } else {
        await RealEstateAPI.createClient(companyId, formData, user.id);
        toast.success('Client created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        type: 'buyer',
        address: '',
        city: '',
        state: '',
        country: '',
        budget: 0,
        preferences: [],
        notes: '',
      });
      
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setClients(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[Clients] Submit failed:', e);
      toast.error('Failed to save client');
    }
  };

  const handleEdit = (client) => {
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      type: client.type || 'buyer',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country || '',
      budget: client.budget || 0,
      preferences: client.preferences ? (typeof client.preferences === 'string' ? JSON.parse(client.preferences) : client.preferences) : [],
      notes: client.notes || '',
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await RealEstateAPI.deleteClient(companyId, id, user.id);
      toast.success('Client deleted successfully');
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error('[Clients] Delete failed:', e);
      toast.error('Failed to delete client');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-muted-foreground font-medium">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Clients</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Manage your buyers, sellers, tenants, and landlords effectively.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 rounded-full px-6">
          <Plus className="w-5 h-5" /> Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300">
        <div className="flex-1">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search clients by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-transparent border-slate-200 dark:border-white/10 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all duration-300 h-11"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-transparent border-slate-200 dark:border-white/10 focus:ring-1 focus:ring-primary/50 h-11 transition-all duration-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-900 dark:border-white/10">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="landlord">Landlord</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <Card key={client.id} className="group overflow-hidden border-transparent shadow-sm hover:shadow-xl hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/50 bg-white/70 backdrop-blur-md transition-all duration-300 ease-in-out flex flex-col">
            <div className={`h-1.5 w-full ${
              client.type === 'buyer' ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
              client.type === 'seller' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
              client.type === 'tenant' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
              'bg-gradient-to-r from-purple-400 to-pink-500'
            }`} />
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{client.name}</CardTitle>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{client.city || 'Location not set'}</p>
                </div>
                <Badge className={`${typeColors[client.type]} px-2.5 py-0.5 shadow-sm font-medium border-0 capitalize`}>{client.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col pt-0">
              <div className="space-y-3 flex-1 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                {client.email && (
                  <div className="flex items-center gap-3 text-sm group/link">
                    <div className="p-1.5 rounded-md bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 group-hover/link:text-primary transition-colors shadow-sm border border-slate-100 dark:border-slate-800">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <a href={`mailto:${client.email}`} className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors truncate font-medium">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm group/link">
                    <div className="p-1.5 rounded-md bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 group-hover/link:text-primary transition-colors shadow-sm border border-slate-100 dark:border-slate-800">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <a href={`tel:${client.phone}`} className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                      {client.phone}
                    </a>
                  </div>
                )}
              </div>

              {client.budget > 0 && (
                <div className="flex items-center justify-between gap-3 text-sm pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Budget</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">${Number(client.budget).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button size="sm" variant="outline" className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => handleEdit(client)}>
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors" onClick={() => handleDelete(client.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="text-center py-20 border-dashed border-2 dark:border-white/10 dark:bg-slate-900/30 bg-slate-50/50 transition-all duration-300 col-span-full">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Users className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No clients found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">You don't have any clients matching your criteria. Try adjusting your filters or add a new client.</p>
          <Button onClick={() => { setShowForm(true); setEditingId(null); }} variant="outline" className="gap-2 rounded-full dark:border-white/10 dark:hover:bg-white/5 transition-all">
            <Plus className="w-4 h-4" /> Add Your First Client
          </Button>
        </Card>
      )}

      {/* Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Client' : 'Add New Client'}</SheetTitle>
            <SheetDescription>Fill in the client details below</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Client Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Budget</label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 border rounded-md text-sm bg-transparent border-slate-200 dark:border-white/10 focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-300 dark:bg-slate-900/50"
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Client
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
