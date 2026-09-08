import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Search, Plus, Edit, Trash2, MapPin, DollarSign, Home, BedDouble, Bath, Square, ArrowRight } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { REPageHeader } from '@/components/real-estate/RealEstateViewKit';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
import GenericKanban from '@/components/views/GenericKanban';

const statusColors = {
  'active': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  'pending': 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  'sold': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
};

export default function Properties() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useViewPreference('re_properties', 'grid');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    propertyType: 'residential',
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: 0,
    price: 0,
    yearBuilt: new Date().getFullYear(),
    description: '',
    features: [],
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setProperties(data);
      } catch (e) {
        console.error('[Properties] Fetch failed:', e);
        toast.error('Failed to load properties');
      }
      setIsLoading(false);
    };

    if (companyId) fetchProperties();
  }, [companyId]);

  useEffect(() => {
    let filtered = properties;
    if (search) {
      filtered = filtered.filter(p =>
        p.address?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    setFilteredProperties(filtered);
  }, [properties, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateProperty(companyId, editingId, formData, user.id);
        toast.success('Property updated successfully');
      } else {
        await RealEstateAPI.createProperty(companyId, formData, user.id);
        toast.success('Property created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        propertyType: 'residential',
        bedrooms: 0,
        bathrooms: 0,
        squareFeet: 0,
        price: 0,
        yearBuilt: new Date().getFullYear(),
        description: '',
        features: [],
      });
      
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setProperties(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[Properties] Submit failed:', e);
      toast.error('Failed to save property');
    }
  };

  const handleEdit = (property) => {
    setFormData({
      address: property.address || '',
      city: property.city || '',
      state: property.state || '',
      country: property.country || '',
      zipCode: property.zip_code || '',
      propertyType: property.property_type || 'residential',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      squareFeet: property.square_feet || 0,
      price: property.price || 0,
      yearBuilt: property.year_built || new Date().getFullYear(),
      description: property.description || '',
      features: property.features ? JSON.parse(property.features) : [],
    });
    setEditingId(property.id);
    setShowForm(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const PropertyCard = ({ property }) => {
    const priceSqft = property.square_feet > 0 ? (property.price / property.square_feet).toFixed(1) : null;

    return (
      <div
        onClick={() => handleEdit(property)}
        className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
      >
        {/* Colour Banner Header */}
        <div className={cn(
          "relative h-28 flex flex-col justify-between p-4 overflow-hidden",
          property.status === 'active' ? 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500' :
          property.status === 'pending' ? 'bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400' :
          property.status === 'sold' ? 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500' :
          'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400'
        )}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="flex items-start justify-between relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
              {property.property_type || 'Residential'}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {property.status || 'Active'}
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Listing Price</p>
            <p className="text-2xl font-extrabold text-white tracking-tight">
              ${parseFloat(property.price || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div>
            <h3 className="font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
              {property.address}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="truncate">{[property.city, property.state, property.zip_code].filter(Boolean).join(', ') || 'Prime Location'}</span>
            </div>
          </div>

          {/* 3-Spec Blueprint Strip */}
          <div className="grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
            <div className="flex flex-col items-center py-2.5 gap-0.5">
              <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{property.bedrooms ?? '—'}</span>
              <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Beds</span>
            </div>
            <div className="flex flex-col items-center py-2.5 gap-0.5">
              <Bath className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{property.bathrooms ?? '—'}</span>
              <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Baths</span>
            </div>
            <div className="flex flex-col items-center py-2.5 gap-0.5">
              <Square className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{property.square_feet ? property.square_feet.toLocaleString() : '—'}</span>
              <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Sq Ft</span>
            </div>
          </div>

          {priceSqft && (
            <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-muted-foreground font-medium">Price / sq ft</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">${priceSqft}</span>
            </div>
          )}

          <div className="pt-2 border-t border-border/50 flex items-center justify-between mt-auto">
            <span className="text-[11px] font-medium text-muted-foreground">
              Year Built: <strong className="text-foreground">{property.year_built || 'N/A'}</strong>
            </span>
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                onClick={() => handleEdit(property)}
                title="Edit Property"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this property?')) {
                    try {
                      await RealEstateAPI.deleteProperty(companyId, property.id, user.id);
                      const res = await powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
                      setProperties(res.rows._array || Array.from(res.rows));
                      toast.success('Property deleted');
                    } catch (e) {
                      toast.error(e.message);
                    }
                  }
                }}
                title="Delete Property"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">Properties</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage and track your property listings</p>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list', 'kanban']} />
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); }}
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0 h-9 sm:h-10 text-xs sm:text-sm px-3.5 sm:px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Property
            </Button>
          </div>
        </div>

        <Card className="p-3 sm:p-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl sm:rounded-3xl shadow-sm gap-3 sm:gap-4">
          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mr-2 shrink-0" />
            <Input
              placeholder="Search by address, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-sm sm:text-base flex-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 border-t sm:border-t-0 border-border/40 sm:border-l pt-2.5 sm:pt-0 sm:pl-4 bg-transparent shadow-none focus:ring-0 font-medium h-9 text-xs sm:text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl border-border">No properties found.</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : view === 'list' ? (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-foreground">Address</th>
                    <th className="p-4 font-semibold text-foreground">Details</th>
                    <th className="p-4 font-semibold text-foreground">Price</th>
                    <th className="p-4 font-semibold text-foreground">Status</th>
                    <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredProperties.map(property => (
                    <tr key={property.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-foreground">{property.address}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {property.city}, {property.state}
                        </p>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {property.bedrooms} Beds • {property.bathrooms} Baths • {property.square_feet} sqft
                      </td>
                      <td className="p-4 font-bold text-primary dark:text-primary/80">
                        ${Number(property.price).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          property.status === 'active' ? 'bg-primary/10 text-primary/40 dark:bg-primary/30/30 dark:text-primary/80' :
                          property.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-slate-100 text-slate-800 dark:bg-card/30 dark:text-muted-foreground'
                        }`}>
                          {property.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/5 text-primary dark:hover:bg-primary/30/30" onClick={() => handleEdit(property)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30" onClick={async () => {
                            if(window.confirm('Are you sure you want to delete this property?')) {
                              try {
                                await RealEstateAPI.deleteProperty(companyId, property.id, user.id);
                                const res = await powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
                                setProperties(res.rows._array || Array.from(res.rows));
                                toast.success('Property deleted');
                              } catch (e) {
                                toast.error(e.message);
                              }
                            }
                          }}>
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
            data={filteredProperties}
            statusKey="status"
            titleKey="address"
            boardKey="re_properties_board"
            defaultStages={Object.keys(statusColors).map(s => s.charAt(0).toUpperCase() + s.slice(1))}
            onStatusChange={async (id, newStatus) => {
              const propertyToUpdate = properties.find(p => p.id === id);
              if (propertyToUpdate) {
                await handleEdit({ ...propertyToUpdate, status: newStatus });
              }
            }}
            onEdit={(item) => handleEdit(item)}
            onDelete={async (id) => {
              if(window.confirm('Are you sure you want to delete this property?')) {
                try {
                  await RealEstateAPI.deleteProperty(companyId, id, user.id);
                  const res = await powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
                  setProperties(res.rows._array || Array.from(res.rows));
                  toast.success('Property deleted');
                } catch (e) {
                  toast.error(e.message);
                }
              }
            }}
          />
        ) : null}
      </div>

      {/* Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Property' : 'Add New Property'}</SheetTitle>
            <SheetDescription>Fill in the property details below</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-6 pb-28 sm:pb-6">
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">ZIP Code</label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.propertyType} onValueChange={(value) => setFormData({ ...formData, propertyType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm font-medium">Beds</label>
                <Input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Baths</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Year Built</label>
                <Input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Square Feet</label>
              <Input
                type="number"
                value={formData.squareFeet}
                onChange={(e) => setFormData({ ...formData, squareFeet: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows="3"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Property
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
