import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Search, Plus, Edit, Trash2, MapPin, DollarSign,
  BedDouble, Bath, Square, Eye, Grid, List,
  Calendar, CheckCircle2, RefreshCw, Sparkles
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Property Types' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'villa', label: 'Luxury Villa' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'land', label: 'Land / Plot' },
];

const STATUS_CONFIG = {
  active: {
    label: 'Active Listing',
    badge: 'bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30',
    dot: 'bg-emerald-500',
  },
  pending: {
    label: 'Under Offer / Pending',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  sold: {
    label: 'Sold / Closed',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500',
  },
  off_market: {
    label: 'Off Market',
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  }
};

export default function JCLProperties() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [properties, setProperties] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sheet / Modals
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorProperty, setInspectorProperty] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    propertyType: 'residential',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    lotSize: 0,
    price: 350000,
    status: 'active',
    agentName: user?.user_metadata?.full_name || 'Assigned Broker',
    yearBuilt: new Date().getFullYear(),
    description: '',
  });

  const fetchPropertiesData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [propRes, viewRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      const propList = propRes.rows._array || Array.from(propRes.rows || []);
      const viewList = viewRes.rows._array || Array.from(viewRes.rows || []);

      setProperties(propList);
      setViewings(viewList);
    } catch (_err) {
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertiesData();
  }, [companyId]);

  // Statistics
  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter(p => p.status === 'active').length;
    const pending = properties.filter(p => p.status === 'pending').length;
    const sold = properties.filter(p => p.status === 'sold').length;
    const totalValuation = properties.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const avgPrice = total > 0 ? totalValuation / total : 0;

    return { total, active, pending, sold, totalValuation, avgPrice };
  }, [properties]);

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchSearch = !search ||
        p.address?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase()) ||
        p.state?.toLowerCase().includes(search.toLowerCase()) ||
        p.agent_name?.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || p.property_type === typeFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [properties, search, typeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      propertyType: 'residential',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1500,
      lotSize: 0,
      price: 350000,
      status: 'active',
      agentName: user?.user_metadata?.full_name || 'Assigned Broker',
      yearBuilt: new Date().getFullYear(),
      description: '',
    });
    setShowFormSheet(true);
  };

  const handleOpenEdit = (prop) => {
    setEditingId(prop.id);
    setFormData({
      address: prop.address || '',
      city: prop.city || '',
      state: prop.state || '',
      country: prop.country || '',
      zipCode: prop.zip_code || '',
      propertyType: prop.property_type || 'residential',
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      squareFeet: prop.square_feet || 0,
      lotSize: prop.lot_size || 0,
      price: prop.price || 0,
      status: prop.status || 'active',
      agentName: prop.agent_name || '',
      yearBuilt: prop.year_built || new Date().getFullYear(),
      description: prop.description || '',
    });
    setShowFormSheet(true);
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    if (!formData.address) {
      toast.error('Property address is required');
      return;
    }

    try {
      const now = new Date().toISOString();

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_properties SET
            address = ?, city = ?, state = ?, country = ?, zip_code = ?,
            property_type = ?, bedrooms = ?, bathrooms = ?, square_feet = ?,
            lot_size = ?, price = ?, status = ?, agent_name = ?, year_built = ?,
            description = ?, last_updated = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.address, formData.city || null, formData.state || null,
            formData.country || null, formData.zipCode || null,
            formData.propertyType, Number(formData.bedrooms) || 0,
            Number(formData.bathrooms) || 0, Number(formData.squareFeet) || 0,
            Number(formData.lotSize) || 0, Number(formData.price) || 0,
            formData.status, formData.agentName || null,
            Number(formData.yearBuilt) || null, formData.description || null,
            now, editingId, companyId
          ]
        );
        toast.success('Property updated successfully');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_properties (
            id, created_at, company_id, address, city, state, country, zip_code,
            property_type, bedrooms, bathrooms, square_feet, lot_size, price,
            status, agent_id, agent_name, year_built, description, listing_date, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId,
            formData.address, formData.city || null, formData.state || null,
            formData.country || null, formData.zipCode || null,
            formData.propertyType, Number(formData.bedrooms) || 0,
            Number(formData.bathrooms) || 0, Number(formData.squareFeet) || 0,
            Number(formData.lotSize) || 0, Number(formData.price) || 0,
            formData.status, user?.id || null, formData.agentName || null,
            Number(formData.yearBuilt) || null, formData.description || null,
            now, now
          ]
        );
        toast.success('Property created successfully');
      }

      setShowFormSheet(false);
      fetchPropertiesData();
      if (inspectorProperty && inspectorProperty.id === editingId) {
        setInspectorProperty(prev => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error('Failed to save property');
    }
  };

  const handleDeleteProperty = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_properties WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success('Property listing deleted');
      setDeleteTarget(null);
      if (inspectorProperty?.id === deleteTarget.id) {
        setInspectorProperty(null);
      }
      fetchPropertiesData();
    } catch (_err) {
      toast.error('Failed to delete property');
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Properties & Units Directory
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Executive portfolio inventory, unit specifications, valuations, and scheduled viewings
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPropertiesData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-md shadow-[#005A9C]/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Portfolio</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">Properties in database</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Listings</p>
              <p className="text-2xl font-bold text-[#005A9C] dark:text-[#FF6B00]">{stats.active}</p>
              <p className="text-[11px] text-emerald-600/80">Available for sale / lease</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sold / Under Offer</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending + stats.sold}</p>
              <p className="text-[11px] text-muted-foreground">{stats.pending} pending, {stats.sold} closed</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Asset Valuation</p>
              <p className="text-2xl font-bold text-foreground truncate">
                {formatCurrency(stats.totalValuation, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Avg {formatCurrency(stats.avgPrice, 'USD')}/unit</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters & View Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, city, agent..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[150px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="active" className="text-xs">Active</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="sold" className="text-xs">Sold</SelectItem>
              <SelectItem value="off_market" className="text-xs">Off Market</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'grid' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="Grid View"
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'list' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="List View"
          >
            <List className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Body: Grid or List ── */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No properties found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No property records match your search filters.'
              : 'Add your first property listing to begin tracking units and viewings.'}
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="mt-4 text-xs bg-[#005A9C] hover:bg-[#00477D] text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Property
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map(property => {
            const st = STATUS_CONFIG[property.status] || STATUS_CONFIG.active;
            const priceSqft = property.square_feet > 0 ? (property.price / property.square_feet).toFixed(1) : null;

            return (
                <div
                  key={property.id}
                  onClick={() => setInspectorProperty(property)}
                  className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  {/* Colour Banner Header */}
                  <div className="relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="flex items-start justify-between relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                        {property.property_type || 'Residential'}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {(STATUS_CONFIG[property.status] || STATUS_CONFIG.active).label}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Listing Price</p>
                      <p className="text-2xl font-extrabold text-white tracking-tight">
                        {formatCurrency(property.price, 'USD')}
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
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{[property.city, property.state, property.zip_code].filter(Boolean).join(', ') || 'Prime Location'}</span>
                      </div>
                    </div>

                    {/* 3-Spec Strip */}
                    <div className="grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
                      <div className="flex flex-col items-center py-2.5 gap-0.5">
                        <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">{property.bedrooms ?? '\u2014'}</span>
                        <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Beds</span>
                      </div>
                      <div className="flex flex-col items-center py-2.5 gap-0.5">
                        <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">{property.bathrooms ?? '\u2014'}</span>
                        <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Baths</span>
                      </div>
                      <div className="flex flex-col items-center py-2.5 gap-0.5">
                        <Square className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">{property.square_feet ? property.square_feet.toLocaleString() : '\u2014'}</span>
                        <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Sq Ft</span>
                      </div>
                    </div>

                    {priceSqft && (
                      <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-[#005A9C]/10 border border-[#005A9C]/20">
                        <span className="text-muted-foreground font-medium">Price / sq ft</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">${priceSqft}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[8px] font-extrabold shrink-0">
                          {(property.agent_name || 'A')[0].toUpperCase()}
                        </div>
                        <span className="truncate font-medium">{property.agent_name || 'Assigned Broker'}</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600" onClick={() => setInspectorProperty(property)} title="Inspect">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(property)} title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => setDeleteTarget(property)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      ) : (
        /* High Density Table View */
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Property Address</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Specs</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProperties.map(property => {
                  const st = STATUS_CONFIG[property.status] || STATUS_CONFIG.active;
                  return (
                    <tr
                      key={property.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setInspectorProperty(property)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {property.address}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {[property.city, property.state].filter(Boolean).join(', ') || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-foreground">
                        {property.property_type || 'Residential'}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="font-medium text-foreground">{property.bedrooms || 0}</span> bd |{' '}
                        <span className="font-medium text-foreground">{property.bathrooms || 0}</span> ba |{' '}
                        <span className="font-medium text-foreground">{property.square_feet?.toLocaleString() || 0}</span> sqft
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {formatCurrency(property.price, 'USD')}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border gap-1", st.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {property.agent_name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setInspectorProperty(property)}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(property)}
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600"
                            onClick={() => setDeleteTarget(property)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Slide-Over Property Inspector Drawer ── */}
      <Sheet open={!!inspectorProperty} onOpenChange={open => !open && setInspectorProperty(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          {inspectorProperty && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                    {inspectorProperty.property_type || 'Residential'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium border gap-1.5", (STATUS_CONFIG[inspectorProperty.status] || STATUS_CONFIG.active).badge)}
                  >
                    {(STATUS_CONFIG[inspectorProperty.status] || STATUS_CONFIG.active).label}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground mt-2">
                  {inspectorProperty.address}
                </SheetTitle>
                <SheetDescription className="text-xs flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {[inspectorProperty.city, inspectorProperty.state, inspectorProperty.zip_code, inspectorProperty.country].filter(Boolean).join(', ')}
                </SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-6 flex-1">
                {/* Price & Valuations Strip */}
                <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-[#005A9C]/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Listed Price</p>
                    <p className="text-2xl font-black text-[#005A9C] dark:text-[#FF6B00]">
                      {formatCurrency(inspectorProperty.price, 'USD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Year Built</p>
                    <p className="text-sm font-bold text-foreground">{inspectorProperty.year_built || 'Modern'}</p>
                  </div>
                </div>

                {/* Detailed Architectural Specs */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Architectural Specs</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border border-border/80 bg-card text-center">
                      <BedDouble className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[10px] text-muted-foreground uppercase">Bedrooms</p>
                      <p className="text-sm font-bold text-foreground">{inspectorProperty.bedrooms || '-'}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border/80 bg-card text-center">
                      <Bath className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[10px] text-muted-foreground uppercase">Bathrooms</p>
                      <p className="text-sm font-bold text-foreground">{inspectorProperty.bathrooms || '-'}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border/80 bg-card text-center">
                      <Square className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[10px] text-muted-foreground uppercase">Living Area</p>
                      <p className="text-sm font-bold text-foreground">{inspectorProperty.square_feet ? `${inspectorProperty.square_feet.toLocaleString()} sqft` : '-'}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border/80 bg-card text-center">
                      <Building2 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[10px] text-muted-foreground uppercase">Lot Size</p>
                      <p className="text-sm font-bold text-foreground">{inspectorProperty.lot_size ? `${inspectorProperty.lot_size} Ac` : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {inspectorProperty.description && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description & Highlights</h4>
                    <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed">
                      {inspectorProperty.description}
                    </p>
                  </div>
                )}

                {/* Scheduled Viewings for this property */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent & Upcoming Viewings</h4>
                    <Badge variant="outline" className="text-[10px]">
                      {viewings.filter(v => v.property_id === inspectorProperty.id).length} recorded
                    </Badge>
                  </div>

                  {viewings.filter(v => v.property_id === inspectorProperty.id).length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                      No inspection tours or viewings scheduled yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {viewings.filter(v => v.property_id === inspectorProperty.id).map(v => (
                        <div key={v.id} className="p-3 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-foreground">{v.client_name || 'Client Viewing'}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {v.viewing_date} {v.viewing_time && `at ${v.viewing_time}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {v.status || 'Scheduled'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleOpenEdit(inspectorProperty);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Property
                </Button>

                <Button
                  size="sm"
                  onClick={() => setInspectorProperty(null)}
                  className="text-xs bg-[#005A9C] hover:bg-[#00477D] text-white"
                >
                  Close Inspector
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 6. Create / Edit Property Modal Sheet ── */}
      <Sheet open={showFormSheet} onOpenChange={setShowFormSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          <SheetHeader className="p-6 border-b border-border bg-muted/20">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Property Listing' : 'Add New Property Listing'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Fill in the property details, architectural specifications, and pricing
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveProperty} className="p-6 space-y-4 flex-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Street Address *</Label>
              <Input
                required
                placeholder="e.g. 104 Oceanfront Boulevard, Suite 500"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">City</Label>
                <Input
                  placeholder="e.g. Miami"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">State / Province</Label>
                <Input
                  placeholder="e.g. FL"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={val => setFormData({ ...formData, propertyType: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential" className="text-xs">Residential</SelectItem>
                    <SelectItem value="commercial" className="text-xs">Commercial</SelectItem>
                    <SelectItem value="villa" className="text-xs">Luxury Villa</SelectItem>
                    <SelectItem value="penthouse" className="text-xs">Penthouse</SelectItem>
                    <SelectItem value="apartment" className="text-xs">Apartment</SelectItem>
                    <SelectItem value="land" className="text-xs">Land / Plot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Listing Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={val => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">Active Listing</SelectItem>
                    <SelectItem value="pending" className="text-xs">Under Offer / Pending</SelectItem>
                    <SelectItem value="sold" className="text-xs">Sold / Closed</SelectItem>
                    <SelectItem value="off_market" className="text-xs">Off Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bedrooms</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={e => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bathrooms</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={e => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sq Ft</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.squareFeet}
                  onChange={e => setFormData({ ...formData, squareFeet: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Year Built</Label>
                <Input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={e => setFormData({ ...formData, yearBuilt: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Listing Price ($) *</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assigned Agent</Label>
                <Input
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.agentName}
                  onChange={e => setFormData({ ...formData, agentName: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description & Features</Label>
              <textarea
                rows={3}
                placeholder="Key highlights, amenities, parking, views..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFormSheet(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-[#005A9C] hover:bg-[#00477D] text-white font-semibold shadow-md shadow-[#005A9C]/20"
              >
                {editingId ? 'Save Changes' : 'Create Listing'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── 7. Delete Confirmation Alert ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Property Listing?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete <strong className="text-foreground">{deleteTarget?.address}</strong>? This action will remove the listing and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
