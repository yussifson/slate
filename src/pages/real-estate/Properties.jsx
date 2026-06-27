import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Search, Plus, Edit, Trash2, MapPin, DollarSign, Home } from 'lucide-react';
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
  'active': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
  'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400',
  'sold': 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400',
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

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Properties</h1>
          <p className="text-base text-muted-foreground mt-1 font-medium">Manage and track your property listings</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="gap-2 shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> Add Property
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap bg-card/50 p-4 rounded-xl shadow-sm border border-border/50 dark:border-white/5 dark:bg-slate-900/40 backdrop-blur-md transition-all duration-300">
        <div className="flex-1 min-w-64">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by address, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary transition-colors"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-background/50 backdrop-blur-sm border-muted-foreground/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProperties.map(property => (
          <Card key={property.id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
            <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 pr-4">
                  <CardTitle className="text-xl font-extrabold flex items-center gap-2 group-hover:text-primary transition-colors tracking-tight">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                      <MapPin className="w-4 h-4" />
                    </div>
                    {property.city || 'Unknown'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-1 font-medium">{property.address}</p>
                </div>
                <Badge variant="secondary" className={`${statusColors[property.status]} shadow-sm border-0 font-bold px-3 py-1 uppercase tracking-wider text-[10px] rounded-full`}>{property.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col mb-4">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mb-1">Beds</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{property.bedrooms}</p>
                </div>
                <div className="flex flex-col mb-4">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mb-1">Baths</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{property.bathrooms}</p>
                </div>
                <div className="flex flex-col mb-4">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mb-1">Sq Ft</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{Number(property.square_feet).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex-1" />

              <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/50 dark:border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Asking Price</span>
                  <div className="flex items-center gap-1">
                    <span className="font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                      ${Number(property.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(property)}
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-muted/50 rounded-full dark:bg-slate-800/50 ring-1 ring-border/50">
              <Building2 className="w-10 h-10 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight">No properties found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">Get started by creating your first property listing. It only takes a few minutes.</p>
            </div>
            <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="mt-4 shadow-md hover:shadow-lg transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
          </div>
        </Card>
      )}

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
