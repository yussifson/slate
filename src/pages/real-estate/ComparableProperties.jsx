import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Plus, Edit, Trash2, Search, TrendingUp, DollarSign, MapPin, Calendar } from 'lucide-react';
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

export default function ComparableProperties() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [comparables, setComparables] = useState([]);
  const [filteredComps, setFilteredComps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [similarityFilter, setSimilarityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    salePrice: 0,
    pricePerSqft: 0,
    bedrooms: 0,
    bathrooms: 0,
    yearBuilt: new Date().getFullYear(),
    squareFootage: 0,
    daysOnMarket: 0,
    saleDate: new Date().toISOString().split('T')[0],
    similarityScore: 0.75,
    notes: '',
  });

  // Fetch comparable properties
  useEffect(() => {
    const fetchComps = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_comparable_properties WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setComparables(data);
      } catch (e) {
        console.error('[ComparableProperties] Fetch failed:', e);
        toast.error('Failed to load comparable properties');
      }
      setIsLoading(false);
    };

    if (companyId) fetchComps();
  }, [companyId]);

  // Filter comparable properties
  useEffect(() => {
    let filtered = comparables;
    if (search) {
      filtered = filtered.filter(c =>
        c.comparable_address?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (similarityFilter !== 'all') {
      const [min, max] = similarityFilter.split('-').map(v => parseFloat(v));
      filtered = filtered.filter(c => c.similarity_score >= min && c.similarity_score <= max);
    }
    setFilteredComps(filtered);
  }, [comparables, search, similarityFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateComparableProperty(companyId, editingId, formData, user.id);
        toast.success('Comparable property updated successfully');
      } else {
        await RealEstateAPI.createComparableProperty(companyId, formData, user.id);
        toast.success('Comparable property created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        address: '',
        salePrice: 0,
        pricePerSqft: 0,
        bedrooms: 0,
        bathrooms: 0,
        yearBuilt: new Date().getFullYear(),
        squareFootage: 0,
        daysOnMarket: 0,
        saleDate: new Date().toISOString().split('T')[0],
        similarityScore: 0.75,
        notes: '',
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_comparable_properties WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setComparables(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[ComparableProperties] Submit failed:', e);
      toast.error('Failed to save comparable property');
    }
  };

  const handleEdit = (comp) => {
    setFormData({
      address: comp.comparable_address || '',
      salePrice: comp.price || 0,
      pricePerSqft: comp.price_per_sqft || 0,
      bedrooms: comp.bedrooms || 0,
      bathrooms: comp.bathrooms || 0,
      yearBuilt: comp.year_built || new Date().getFullYear(),
      squareFootage: comp.square_footage || 0,
      daysOnMarket: comp.days_on_market || 0,
      saleDate: comp.sale_date ? new Date(comp.sale_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      similarityScore: comp.similarity_score || 0.75,
      notes: comp.notes || '',
    });
    setEditingId(comp.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this comparable property?')) return;
    try {
      await RealEstateAPI.deleteComparableProperty(companyId, id, user.id);
      toast.success('Comparable property deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_comparable_properties WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setComparables(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[ComparableProperties] Delete failed:', e);
      toast.error('Failed to delete comparable property');
    }
  };

  // KPI calculations
  const totalComps = comparables.length;
  const avgPrice = comparables.length > 0
    ? (comparables.reduce((sum, c) => sum + (c.price || 0), 0) / comparables.length).toLocaleString('en-US', { minimumFractionDigits: 0 })
    : 0;
  const avgSimilarity = comparables.length > 0
    ? (comparables.reduce((sum, c) => sum + (c.similarity_score || 0), 0) / comparables.length * 100).toFixed(0)
    : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comparable Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare properties for valuation and market analysis</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          address: '',
          salePrice: 0,
          pricePerSqft: 0,
          bedrooms: 0,
          bathrooms: 0,
          yearBuilt: new Date().getFullYear(),
          squareFootage: 0,
          daysOnMarket: 0,
          saleDate: new Date().toISOString().split('T')[0],
          similarityScore: 0.75,
          notes: '',
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Comparable
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Home className="w-4 h-4" />
              Total Comparables
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{totalComps}</div>
            <p className="text-xs text-muted-foreground mt-1">Properties in analysis</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Average Price
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">${avgPrice}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all comps</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Similarity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{avgSimilarity}%</div>
            <p className="text-xs text-muted-foreground mt-1">Match score</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={similarityFilter} onValueChange={setSimilarityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Similarity</SelectItem>
            <SelectItem value="0.8-1">80-100%</SelectItem>
            <SelectItem value="0.6-0.79">60-79%</SelectItem>
            <SelectItem value="0.4-0.59">40-59%</SelectItem>
            <SelectItem value="0-0.39">Below 40%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comparables Table */}
      <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Address</th>
                <th className="text-right py-3 px-4 font-medium">Sale Price</th>
                <th className="text-right py-3 px-4 font-medium">Price/SqFt</th>
                <th className="text-center py-3 px-4 font-medium">Bed/Bath</th>
                <th className="text-center py-3 px-4 font-medium">Year</th>
                <th className="text-center py-3 px-4 font-medium">Similarity</th>
                <th className="text-center py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComps.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted-foreground">No comparable properties found</td>
                </tr>
              ) : (
                filteredComps.map(comp => (
                  <tr key={comp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{comp.comparable_address}</td>
                    <td className="py-3 px-4 text-right font-bold">${(comp.price || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">${(comp.price_per_sqft || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">{comp.bedrooms}/{comp.bathrooms}</td>
                    <td className="py-3 px-4 text-center">{comp.year_built}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={
                        (comp.similarity_score || 0) >= 0.8 ? 'default' : 
                        (comp.similarity_score || 0) >= 0.6 ? 'secondary' : 
                        'outline'
                      }>
                        {((comp.similarity_score || 0) * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(comp)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(comp.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comparable Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Comparable Property' : 'Add Comparable Property'}</SheetTitle>
            <SheetDescription>Add a property for valuation comparison</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Sale Price ($)</label>
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price/SqFt ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pricePerSqft}
                  onChange={(e) => setFormData({ ...formData, pricePerSqft: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Bedrooms</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bathrooms</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Year Built</label>
                <Input
                  type="number"
                  min="1900"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Square Footage</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({ ...formData, squareFootage: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Days on Market</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.daysOnMarket}
                  onChange={(e) => setFormData({ ...formData, daysOnMarket: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sale Date</label>
                <Input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Similarity Score (0-1)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.similarityScore}
                onChange={(e) => setFormData({ ...formData, similarityScore: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                className="w-full p-2 border rounded text-sm"
                rows="3"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Add'} Comparable
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
