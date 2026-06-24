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
  'active': 'bg-green-100 text-green-800',
  'pending': 'bg-orange-100 text-orange-800',
  'sold': 'bg-gray-100 text-gray-800',
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your property listings</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Property
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, city..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProperties.map(property => (
          <Card key={property.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {property.city || 'Unknown'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{property.address}</p>
                </div>
                <Badge className={statusColors[property.status]}>{property.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Beds</p>
                  <p className="font-bold">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Baths</p>
                  <p className="font-bold">{property.bathrooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sq Ft</p>
                  <p className="font-bold">{Number(property.square_feet).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-lg">${Number(property.price).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(property)}
                  className="flex-1"
                >
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

      {filteredProperties.length === 0 && (
        <Card className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No properties found. Create your first property!</p>
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
                className="w-full p-2 border rounded text-sm"
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
