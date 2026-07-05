import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
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
  'seller': 'bg-primary/10 text-primary/40 dark:bg-primary/20 dark:text-primary/40',
  'tenant': 'bg-primary/10 text-primary/40 dark:bg-primary/20 dark:text-primary/40',
  'landlord': 'bg-primary/10 text-primary/40 dark:bg-primary/20 dark:text-primary/40',
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
  const [view, setView] = useViewPreference('re_clients', 'grid');
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

  const ClientCard = ({ client }) => (
    <div className="group bg-card/60 backdrop-blur-md border border-border/40 rounded-3xl p-6 hover:shadow-2xl hover:border-primary/50 transition-all relative overflow-hidden flex flex-col h-full hover:-translate-y-1">
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-tl-[5rem] pointer-events-none z-0 transition-colors duration-500 group-hover:bg-primary/20" />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1 pr-12">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{client.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {client.city || 'Location not set'}
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => handleEdit(client)}
          className="h-8 w-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-primary hover:text-white text-primary transition-colors border-0 shadow-sm"
          title="Edit Client"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={() => handleDelete(client.id)}
          className="h-8 w-8 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-sm hover:bg-red-500 text-red-600 hover:text-white transition-colors border-0 shadow-sm"
          title="Delete Client"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3 text-sm mb-6 flex-1 relative z-10">
        {client.email && (
          <div className="flex items-center gap-3 text-muted-foreground group/link">
            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/30/30 flex items-center justify-center text-primary dark:text-primary/80 group-hover/link:bg-primary group-hover/link:text-white transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <a href={`mailto:${client.email}`} className="font-medium text-foreground/80 group-hover/link:text-primary transition-colors truncate">
              {client.email}
            </a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-3 text-muted-foreground group/link">
            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/30/30 flex items-center justify-center text-primary dark:text-primary/80 group-hover/link:bg-primary group-hover/link:text-white transition-colors">
              <Phone className="w-4 h-4" />
            </div>
            <a href={`tel:${client.phone}`} className="font-medium text-foreground/80 group-hover/link:text-primary transition-colors">
              {client.phone}
            </a>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between relative z-10">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors[client.type] || 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'}`}>
          {client.type.toUpperCase()}
        </span>
        {client.budget > 0 && (
          <span className="font-extrabold text-primary dark:text-primary/80">
            ${Number(client.budget).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-2">Manage your buyers, sellers, tenants, and landlords effectively.</p>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list']} />
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); }}
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Client
            </Button>
          </div>
        </div>

        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm gap-4 flex-wrap">
          <div className="relative flex-1 flex items-center min-w-[200px]">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Input
              placeholder="Search clients by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-base flex-1"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 border-0 bg-transparent shadow-none focus:ring-0 font-medium">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
              <SelectItem value="landlord">Landlord</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl border-border">No clients found.</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-foreground">Name</th>
                    <th className="p-4 font-semibold text-foreground">Contact</th>
                    <th className="p-4 font-semibold text-foreground">Type</th>
                    <th className="p-4 font-semibold text-foreground text-right">Budget</th>
                    <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredClients.map(client => (
                    <tr key={client.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {client.city || 'Location not set'}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {client.phone && <span className="text-foreground/80 flex items-center gap-1.5"><Phone className="w-3 h-3 text-muted-foreground" /> {client.phone}</span>}
                          {client.email && <span className="text-muted-foreground text-xs flex items-center gap-1.5"><Mail className="w-3 h-3" /> {client.email}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[client.type] || 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'}`}>
                          {client.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-primary dark:text-primary/80">
                        {client.budget > 0 ? `$${Number(client.budget).toLocaleString()}` : '-'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/5 text-primary dark:hover:bg-primary/30/30" onClick={() => handleEdit(client)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30" onClick={() => handleDelete(client.id)}>
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
        )}
      </div>

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
