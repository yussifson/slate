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
import { REPageHeader } from '@/components/real-estate/RealEstateViewKit';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';

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

  const PropertyCard = ({ property }) => (
    <div className="group bg-card/40 backdrop-blur-md border border-border/60 rounded-[2rem] p-6 hover:shadow-2xl hover:border-primary/50 transition-all duration-300 relative overflow-hidden flex flex-col h-full hover:-translate-y-1">
      {/* Real Estate Specific Decoration */}
      <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-500 group-hover:scale-110">
        <Building2 className="w-48 h-48 text-primary" />
      </div>
      
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className="flex-1 pr-12">
          <Badge className={`mb-3 uppercase tracking-wider text-[10px] font-extrabold border ${statusColors[property.status?.toLowerCase()] || statusColors.active}`}>
            {property.status || 'Active'}
          </Badge>
          <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">{property.address}</h3>
          <p className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary/60" /> {property.city}, {property.state} {property.zip_code}
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => handleEdit(property)}
          className="h-8 w-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-primary hover:text-white text-primary transition-colors border-0 shadow-sm"
          title="Edit Property"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={async () => {
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
          }}
          className="h-8 w-8 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-sm hover:bg-red-500 text-red-600 hover:text-white transition-colors border-0 shadow-sm"
          title="Delete Property"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 flex-1 relative z-10">
        <div className="bg-primary/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-primary/10">
          <BedDouble className="w-5 h-5 text-primary mb-1.5" />
          <p className="font-bold text-lg leading-none">{property.bedrooms}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1">Beds</p>
        </div>
        <div className="bg-primary/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-primary/10">
          <Bath className="w-5 h-5 text-primary mb-1.5" />
          <p className="font-bold text-lg leading-none">{property.bathrooms}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1">Baths</p>
        </div>
        <div className="bg-primary/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-primary/10">
          <Square className="w-5 h-5 text-primary mb-1.5" />
          <p className="font-bold text-lg leading-none">{property.square_feet?.toLocaleString() || 0}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1">Sq Ft</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">List Price</p>
          <p className="font-black text-2xl text-primary flex items-center">
            ${parseFloat(property.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <Badge variant="outline" className="bg-background font-bold uppercase text-[10px] px-3 py-1 border-border/50 text-foreground">
          {property.property_type}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Properties</h1>
            <p className="text-muted-foreground mt-2">Manage and track your property listings</p>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list']} />
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); }}
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
          </div>
        </div>

        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm gap-4 flex-wrap">
          <div className="relative flex-1 flex items-center min-w-[200px]">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Input
              placeholder="Search by address, city..."
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
        ) : (
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
                          'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
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
        )}
      </div>

      {/* Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Property' : 'Add New Property'}</SheetTitle>
            <SheetDescription>Fill in the property details below</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
