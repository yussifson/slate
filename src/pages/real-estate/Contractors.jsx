import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Hammer, Plus, Edit, Trash2, Search, MapPin, Phone, Mail, Star } from 'lucide-react';
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

export default function Contractors() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [contractors, setContractors] = useState([]);
  const [filteredContractors, setFilteredContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    contractorName: '',
    contractorType: 'plumber',
    email: '',
    phone: '',
    city: '',
    state: '',
    zipCode: '',
    isLicensed: false,
    isInsured: false,
    licenseName: '',
    hourlyRate: 0,
    totalJobsCompleted: 0,
    averageRating: 0,
  });

  // Fetch contractors
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_contractors WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setContractors(data);
      } catch (e) {
        console.error('[Contractors] Fetch failed:', e);
        toast.error('Failed to load contractors');
      }
      setIsLoading(false);
    };

    if (companyId) fetchContractors();
  }, [companyId]);

  // Filter contractors
  useEffect(() => {
    let filtered = contractors;
    if (search) {
      filtered = filtered.filter(c =>
        c.contractor_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.contractor_type === typeFilter);
    }
    setFilteredContractors(filtered);
  }, [contractors, search, typeFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateContractor(companyId, editingId, formData, user.id);
        toast.success('Contractor updated successfully');
      } else {
        await RealEstateAPI.createContractor(companyId, formData, user.id);
        toast.success('Contractor added successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        contractorName: '',
        contractorType: 'plumber',
        email: '',
        phone: '',
        city: '',
        state: '',
        zipCode: '',
        isLicensed: false,
        isInsured: false,
        licenseName: '',
        hourlyRate: 0,
        totalJobsCompleted: 0,
        averageRating: 0,
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_contractors WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setContractors(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[Contractors] Submit failed:', e);
      toast.error('Failed to save contractor');
    }
  };

  const handleEdit = (c) => {
    setFormData({
      contractorName: c.contractor_name || '',
      contractorType: c.contractor_type || 'plumber',
      email: c.email || '',
      phone: c.phone || '',
      city: c.city || '',
      state: c.state || '',
      zipCode: c.zip_code || '',
      isLicensed: c.is_licensed || false,
      isInsured: c.is_insured || false,
      licenseName: c.license_name || '',
      hourlyRate: c.hourly_rate || 0,
      totalJobsCompleted: c.total_jobs_completed || 0,
      averageRating: c.average_rating || 0,
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contractor?')) return;
    try {
      await RealEstateAPI.deleteContractor(companyId, id, user.id);
      toast.success('Contractor deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_contractors WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setContractors(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[Contractors] Delete failed:', e);
      toast.error('Failed to delete contractor');
    }
  };

  // KPI calculations
  const totalContractors = contractors.length;
  const licensed = contractors.filter(c => c.is_licensed).length;
  const avgRating = contractors.length > 0
    ? (contractors.reduce((sum, c) => sum + (c.average_rating || 0), 0) / contractors.length).toFixed(1)
    : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contractors & Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage approved contractors and service providers</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          contractorName: '',
          contractorType: 'plumber',
          email: '',
          phone: '',
          city: '',
          state: '',
          zipCode: '',
          isLicensed: false,
          isInsured: false,
          licenseName: '',
          hourlyRate: 0,
          totalJobsCompleted: 0,
          averageRating: 0,
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Contractor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              Total Contractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContractors}</div>
            <p className="text-xs text-muted-foreground mt-1">In your network</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Badge className="w-4 h-4" />
              Licensed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{licensed}</div>
            <p className="text-xs text-muted-foreground mt-1">{((licensed / totalContractors) * 100 || 0).toFixed(0)}% licensed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{avgRating} ⭐</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 5</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="plumber">Plumber</SelectItem>
            <SelectItem value="electrician">Electrician</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="painter">Painter</SelectItem>
            <SelectItem value="carpenter">Carpenter</SelectItem>
            <SelectItem value="roofer">Roofer</SelectItem>
            <SelectItem value="landscaper">Landscaper</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContractors.map(c => (
          <Card key={c.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hammer className="w-4 h-4" />
                    {c.contractor_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{c.contractor_type}</p>
                </div>
                {c.average_rating && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-500">{c.average_rating} ⭐</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${c.phone}`} className="font-medium">{c.phone}</a>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{c.city}, {c.state} {c.zip_code}</span>
              </div>

              <div className="flex gap-2 flex-wrap pt-2 border-t">
                {c.is_licensed && <Badge variant="outline" className="bg-green-50">Licensed</Badge>}
                {c.is_insured && <Badge variant="outline" className="bg-blue-50">Insured</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-2 rounded">
                <div><span className="text-muted-foreground">Rate:</span> <span className="font-medium">${c.hourly_rate}/hr</span></div>
                <div><span className="text-muted-foreground">Jobs:</span> <span className="font-medium">{c.total_jobs_completed}</span></div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(c)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(c.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContractors.length === 0 && (
        <Card className="text-center py-12">
          <Hammer className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No contractors found. Add your first contractor!</p>
        </Card>
      )}

      {/* Contractor Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Contractor' : 'Add Contractor'}</SheetTitle>
            <SheetDescription>Manage contractor information and qualifications</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Contractor Name</label>
              <Input
                value={formData.contractorName}
                onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.contractorType} onValueChange={(value) => setFormData({ ...formData, contractorType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumber">Plumber</SelectItem>
                  <SelectItem value="electrician">Electrician</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="painter">Painter</SelectItem>
                  <SelectItem value="carpenter">Carpenter</SelectItem>
                  <SelectItem value="roofer">Roofer</SelectItem>
                  <SelectItem value="landscaper">Landscaper</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="ST"
                  maxLength="2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Zip</label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Hourly Rate ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Jobs Completed</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.totalJobsCompleted}
                  onChange={(e) => setFormData({ ...formData, totalJobsCompleted: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isLicensed}
                  onChange={(e) => setFormData({ ...formData, isLicensed: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium">Licensed</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isInsured}
                  onChange={(e) => setFormData({ ...formData, isInsured: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium">Insured</label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Average Rating (0-5)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.averageRating}
                onChange={(e) => setFormData({ ...formData, averageRating: parseFloat(e.target.value) })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Add'} Contractor
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
