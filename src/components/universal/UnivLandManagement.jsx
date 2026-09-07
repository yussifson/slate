import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Plus, Edit, Trash2, Search, DollarSign, Layers,
  FileText, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  ChevronRight, Calendar, ArrowUpRight, Filter, Download, UserCheck,
  Compass, Landmark, Building2, Grid, List, Eye, Save, X
} from 'lucide-react';
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const statusConfig = {
  'available': {
    label: 'Available',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
  },
  'reserved': {
    label: 'Reserved',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
  },
  'allocated': {
    label: 'Allocated',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
  },
  'sold': {
    label: 'Sold',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
  },
  'disputed': {
    label: 'Under Review',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
  }
};

const initialFormData = {
  parcel_name: '',
  plot_number: '',
  cadastral_ref: '',
  address: '',
  city: '',
  state: '',
  country: 'Ghana',
  zip_code: '',
  lot_size_acres: '',
  square_feet: '',
  zoning: 'residential',
  topography: 'flat',
  title_type: 'C_of_O',
  price: '',
  status: 'available',
  description: '',
  agent_name: '',
  documents: []
};

export default function UnivLandManagement() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [parcels, setParcels] = useState([]);
  const [ownershipList, setOwnershipList] = useState([]);
  const [allocationsList, setAllocationsList] = useState([]);
  const [surveysList, setSurveysList] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoningFilter, setZoningFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'kanban'

  // Modals & Drawers
  const [showParcelDrawer, setShowParcelDrawer] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  // Allocation Form State
  const [allocationForm, setAllocationForm] = useState({
    client_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    allocation_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    deposit_amount: '',
    total_agreed_price: '',
    payment_terms: 'outright',
    allocation_status: 'active_reserved',
    notes: ''
  });

  // Ownership Form State
  const [ownershipForm, setOwnershipForm] = useState({
    owner_name: '',
    percentage: 100,
    interest_type: 'Freehold',
    deed_ref: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Survey Form State
  const [surveyForm, setSurveyForm] = useState({
    survey_number: '',
    surveyor_name: '',
    survey_date: new Date().toISOString().split('T')[0],
    boundary_coordinates: '[]',
    plan_url: '',
    status: 'approved',
    notes: ''
  });

  // Fetch all land structured records
  const fetchAllData = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const [parcelRes, ownerRes, allocRes, surveyRes, clientRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_land_parcels WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_land_ownership WHERE company_id = ?', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_land_allocations WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_land_surveys WHERE company_id = ?', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      setParcels(parcelRes.rows?._array || Array.from(parcelRes.rows || []));
      setOwnershipList(ownerRes.rows?._array || Array.from(ownerRes.rows || []));
      setAllocationsList(allocRes.rows?._array || Array.from(allocRes.rows || []));
      setSurveysList(surveyRes.rows?._array || Array.from(surveyRes.rows || []));
      setClients(clientRes.rows?._array || Array.from(clientRes.rows || []));
    } catch (err) {
      console.error('[UnivLandManagement] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    if (companyId) {
      const ch = supabase.channel(`univ_land_${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_land_parcels', filter: `company_id=eq.${companyId}` }, fetchAllData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_land_allocations', filter: `company_id=eq.${companyId}` }, fetchAllData)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [companyId]);

  // Filtered Parcels
  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const matchSearch = search === '' ||
        p.parcel_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.plot_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.cadastral_ref?.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchZoning = zoningFilter === 'all' || p.zoning === zoningFilter;

      return matchSearch && matchStatus && matchZoning;
    });
  }, [parcels, search, statusFilter, zoningFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = parcels.length;
    const available = parcels.filter(p => p.status === 'available').length;
    const allocated = parcels.filter(p => p.status === 'allocated').length;
    const reserved = parcels.filter(p => p.status === 'reserved').length;
    const totalAcreage = parcels.reduce((acc, p) => acc + (parseFloat(p.lot_size_acres) || 0), 0);
    const totalValuation = parcels.reduce((acc, p) => acc + (parseFloat(p.price) || 0), 0);

    return { total, available, allocated, reserved, totalAcreage, totalValuation };
  }, [parcels]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowParcelDrawer(true);
  };

  const handleOpenEdit = (parcel) => {
    setEditingId(parcel.id);
    let docs = [];
    try {
      docs = typeof parcel.documents === 'string' ? JSON.parse(parcel.documents) : (parcel.documents || []);
    } catch (e) {}

    setFormData({
      parcel_name: parcel.parcel_name || '',
      plot_number: parcel.plot_number || '',
      cadastral_ref: parcel.cadastral_ref || '',
      address: parcel.address || '',
      city: parcel.city || '',
      state: parcel.state || '',
      country: parcel.country || 'Ghana',
      zip_code: parcel.zip_code || '',
      lot_size_acres: parcel.lot_size_acres || '',
      square_feet: parcel.square_feet || '',
      zoning: parcel.zoning || 'residential',
      topography: parcel.topography || 'flat',
      title_type: parcel.title_type || 'C_of_O',
      price: parcel.price || '',
      status: parcel.status || 'available',
      description: parcel.description || '',
      agent_name: parcel.agent_name || '',
      documents: docs
    });
    setShowParcelDrawer(true);
  };

  const handleSaveParcel = async (e) => {
    e.preventDefault();
    if (!formData.parcel_name.trim()) return toast.error('Parcel name is required');

    const payload = {
      company_id: companyId,
      parcel_name: formData.parcel_name,
      plot_number: formData.plot_number,
      cadastral_ref: formData.cadastral_ref,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      zip_code: formData.zip_code,
      lot_size_acres: parseFloat(formData.lot_size_acres) || 0,
      square_feet: parseFloat(formData.square_feet) || 0,
      zoning: formData.zoning,
      topography: formData.topography,
      title_type: formData.title_type,
      price: parseFloat(formData.price) || 0,
      status: formData.status,
      description: formData.description,
      agent_name: formData.agent_name,
      documents: JSON.stringify(formData.documents || []),
      updated_at: new Date().toISOString()
    };

    try {
      if (editingId) {
        const keys = Object.keys(payload);
        const vals = Object.values(payload);
        await powerSync.execute(
          `UPDATE univ_land_parcels SET ${keys.map(k => k + ' = ?').join(', ')} WHERE id = ?`,
          [...vals, editingId]
        );
        toast.success('Parcel updated successfully');
      } else {
        const id = generateUUID();
        const fullPayload = { id, created_at: new Date().toISOString(), ...payload };
        const keys = Object.keys(fullPayload);
        const vals = Object.values(fullPayload);
        await powerSync.execute(
          `INSERT INTO univ_land_parcels (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
          vals
        );
        toast.success('New parcel registered');
      }
      setShowParcelDrawer(false);
      fetchAllData();
    } catch (err) {
      console.error('[UnivLandManagement] Save parcel error:', err);
      toast.error('Failed to save land parcel');
    }
  };

  const handleDeleteParcel = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this land parcel record?')) return;
    try {
      await powerSync.execute('DELETE FROM univ_land_parcels WHERE id = ?', [id]);
      toast.success('Parcel removed');
      if (selectedParcel?.id === id) setSelectedParcel(null);
      fetchAllData();
    } catch (err) {
      console.error('[UnivLandManagement] Delete error:', err);
      toast.error('Failed to delete parcel');
    }
  };

  // Allocation Handler
  const handleSaveAllocation = async (e) => {
    e.preventDefault();
    if (!selectedParcel) return;
    if (!allocationForm.customer_name.trim()) return toast.error('Customer name is required');

    try {
      const allocId = generateUUID();
      const allocPayload = {
        id: allocId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: companyId,
        parcel_id: selectedParcel.id,
        client_id: allocationForm.client_id || null,
        customer_name: allocationForm.customer_name,
        customer_email: allocationForm.customer_email,
        customer_phone: allocationForm.customer_phone,
        allocation_date: allocationForm.allocation_date,
        expiry_date: allocationForm.expiry_date,
        deposit_amount: parseFloat(allocationForm.deposit_amount) || 0,
        total_agreed_price: parseFloat(allocationForm.total_agreed_price) || (selectedParcel.price || 0),
        payment_terms: allocationForm.payment_terms,
        allocation_status: allocationForm.allocation_status,
        notes: allocationForm.notes
      };

      const keys = Object.keys(allocPayload);
      const vals = Object.values(allocPayload);
      await powerSync.execute(
        `INSERT INTO univ_land_allocations (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
        vals
      );

      // Update parcel status to allocated/reserved
      const newStatus = allocationForm.allocation_status.includes('reserved') ? 'reserved' : 'allocated';
      await powerSync.execute(
        'UPDATE univ_land_parcels SET status = ?, updated_at = ? WHERE id = ?',
        [newStatus, new Date().toISOString(), selectedParcel.id]
      );

      toast.success('Allocation recorded successfully');
      setShowAllocationModal(false);
      fetchAllData();
    } catch (err) {
      console.error('[UnivLandManagement] Allocation error:', err);
      toast.error('Failed to save allocation');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-h-[80vh] p-4 md:p-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Land & Survey Management</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Universal Module
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage cadastral parcels, land ownership, boundary surveys, and client plot allocations.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-2.5"
            >
              <Grid className="w-4 h-4 mr-1.5" /> Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-2.5"
            >
              <List className="w-4 h-4 mr-1.5" /> Table
            </Button>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Register Land Parcel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Parcels
            </CardTitle>
            <Layers className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.totalAcreage.toFixed(1)} Total Acres</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Land
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.available}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for Allocation</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Allocated / Reserved
            </CardTitle>
            <Clock className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {metrics.allocated + metrics.reserved}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.allocated} Confirmed, {metrics.reserved} Pending</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Portfolio Valuation
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalValuation)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Estimated Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search parcels, plot #, cadastral ref..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="allocated">Allocated</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="disputed">Under Review</SelectItem>
            </SelectContent>
          </Select>

          <Select value={zoningFilter} onValueChange={setZoningFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Zoning" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zonings</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="mixed_use">Mixed Use</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Clock className="w-5 h-5 animate-spin mr-2" /> Loading land management records...
        </div>
      ) : filteredParcels.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed border-border text-center">
          <Compass className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold">No Land Parcels Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            No parcels match your search filters. Add a new cadastral parcel to begin tracking land assets.
          </p>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Register First Parcel
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParcels.map((parcel) => {
            const st = statusConfig[parcel.status] || statusConfig.available;
            const parcelAlloc = allocationsList.find(a => a.parcel_id === parcel.id);
            const parcelOwners = ownershipList.filter(o => o.parcel_id === parcel.id);

            return (
              <Card
                key={parcel.id}
                className="group hover:border-primary/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
                onClick={() => { setSelectedParcel(parcel); }}
              >
                <div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                          {parcel.parcel_name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {[parcel.address, parcel.city, parcel.country].filter(Boolean).join(', ') || 'No address'}
                        </p>
                      </div>
                      <Badge className={`text-xs border ${st.color}`}>
                        {st.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-2.5 rounded-lg">
                      <div>
                        <span className="text-muted-foreground">Plot / Cadastral:</span>
                        <p className="font-medium text-foreground">{parcel.plot_number || parcel.cadastral_ref || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Acreage:</span>
                        <p className="font-medium text-foreground">{parcel.lot_size_acres || 0} Acres</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Zoning:</span>
                        <p className="font-medium capitalize text-foreground">{parcel.zoning || 'Residential'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Title Type:</span>
                        <p className="font-medium text-foreground">{parcel.title_type || 'C_of_O'}</p>
                      </div>
                    </div>

                    {parcelAlloc && (
                      <div className="p-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900/50 text-xs">
                        <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-medium">
                          <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Allocated to:</span>
                          <span>{parcelAlloc.customer_name}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-border mt-2 flex items-center justify-between text-sm">
                  <div className="font-bold text-primary text-base">
                    {formatCurrency(parcel.price)}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setSelectedParcel(parcel);
                        setShowAllocationModal(true);
                      }}
                    >
                      Allocate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenEdit(parcel)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteParcel(parcel.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b border-border">
                <tr>
                  <th className="px-4 py-3">Parcel Name</th>
                  <th className="px-4 py-3">Cadastral / Plot</th>
                  <th className="px-4 py-3">Acreage</th>
                  <th className="px-4 py-3">Zoning</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredParcels.map(parcel => {
                  const st = statusConfig[parcel.status] || statusConfig.available;
                  return (
                    <tr
                      key={parcel.id}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => setSelectedParcel(parcel)}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {parcel.parcel_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{parcel.plot_number || parcel.cadastral_ref || '—'}</td>
                      <td className="px-4 py-3">{parcel.lot_size_acres || 0} Ac</td>
                      <td className="px-4 py-3 capitalize">{parcel.zoning || 'Residential'}</td>
                      <td className="px-4 py-3">{parcel.title_type || 'C_of_O'}</td>
                      <td className="px-4 py-3 font-bold text-primary">{formatCurrency(parcel.price)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border ${st.color}`}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleOpenEdit(parcel)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={(e) => handleDeleteParcel(parcel.id, e)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Parcel Create / Edit Drawer */}
      <Sheet open={showParcelDrawer} onOpenChange={setShowParcelDrawer}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle>{editingId ? 'Edit Land Parcel' : 'Register New Land Parcel'}</SheetTitle>
            <SheetDescription>
              Enter cadastral references, zoning, title deed information, and valuation.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveParcel} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parcel / Estate Name *</Label>
              <Input
                value={formData.parcel_name}
                onChange={e => setFormData({ ...formData, parcel_name: e.target.value })}
                placeholder="e.g. Royal Heights Phase II"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Plot Number</Label>
                <Input
                  value={formData.plot_number}
                  onChange={e => setFormData({ ...formData, plot_number: e.target.value })}
                  placeholder="e.g. Plot 42-B"
                />
              </div>
              <div className="space-y-2">
                <Label>Cadastral Survey Ref</Label>
                <Input
                  value={formData.cadastral_ref}
                  onChange={e => setFormData({ ...formData, cadastral_ref: e.target.value })}
                  placeholder="e.g. CAD/GA/2026/891"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lot Size (Acres)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.lot_size_acres}
                  onChange={e => setFormData({ ...formData, lot_size_acres: e.target.value })}
                  placeholder="e.g. 2.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Valuation / Asking Price ($)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 150000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Zoning Type</Label>
                <Select
                  value={formData.zoning}
                  onValueChange={v => setFormData({ ...formData, zoning: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="mixed_use">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title / Deed Type</Label>
                <Select
                  value={formData.title_type}
                  onValueChange={v => setFormData({ ...formData, title_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C_of_O">Certificate of Occupancy (C of O)</SelectItem>
                    <SelectItem value="Governors_Consent">Governor's Consent</SelectItem>
                    <SelectItem value="Freehold_Deed">Freehold Title Deed</SelectItem>
                    <SelectItem value="Customary_Grant">Customary Land Grant</SelectItem>
                    <SelectItem value="Gazette">Government Gazette</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={v => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="allocated">Allocated</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="disputed">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Agent / Land Officer</Label>
                <Input
                  value={formData.agent_name}
                  onChange={e => setFormData({ ...formData, agent_name: e.target.value })}
                  placeholder="Assigned Officer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address / Location Details</Label>
              <Input
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street or Landmark"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="City / Region"
              />
              <Input
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="State / District"
              />
              <Input
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
              />
            </div>

            <div className="space-y-2">
              <Label>Description / Survey Notes</Label>
              <textarea
                className="w-full h-20 p-2 text-sm bg-background border border-border rounded-md"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Boundary topography, soil condition, road access..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowParcelDrawer(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-1.5" /> Save Parcel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Allocation Modal */}
      <Dialog open={showAllocationModal} onOpenChange={setShowAllocationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate Land Plot</DialogTitle>
            <DialogDescription>
              Assign <strong>{selectedParcel?.parcel_name}</strong> ({selectedParcel?.plot_number || 'Plot'}) to a client.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAllocation} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Select Client / Buyer</Label>
              <Select
                value={allocationForm.client_id}
                onChange={e => {
                  const cl = clients.find(c => c.id === e);
                  setAllocationForm({
                    ...allocationForm,
                    client_id: e,
                    customer_name: cl?.name || allocationForm.customer_name,
                    customer_email: cl?.email || allocationForm.customer_email,
                    customer_phone: cl?.phone || allocationForm.customer_phone
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Pick registered client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.email || c.phone || 'No contact'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input
                value={allocationForm.customer_name}
                onChange={e => setAllocationForm({ ...allocationForm, customer_name: e.target.value })}
                placeholder="Full Legal Name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={allocationForm.customer_email}
                  onChange={e => setAllocationForm({ ...allocationForm, customer_email: e.target.value })}
                  placeholder="email@domain.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={allocationForm.customer_phone}
                  onChange={e => setAllocationForm({ ...allocationForm, customer_phone: e.target.value })}
                  placeholder="+233..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Deposit Paid ($)</Label>
                <Input
                  type="number"
                  value={allocationForm.deposit_amount}
                  onChange={e => setAllocationForm({ ...allocationForm, deposit_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Total Agreed Price ($)</Label>
                <Input
                  type="number"
                  value={allocationForm.total_agreed_price}
                  onChange={e => setAllocationForm({ ...allocationForm, total_agreed_price: e.target.value })}
                  placeholder={selectedParcel?.price || '0.00'}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Terms</Label>
              <Select
                value={allocationForm.payment_terms}
                onValueChange={v => setAllocationForm({ ...allocationForm, payment_terms: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outright">Outright 100% Payment</SelectItem>
                  <SelectItem value="installment_3m">3-Month Installment</SelectItem>
                  <SelectItem value="installment_6m">6-Month Installment</SelectItem>
                  <SelectItem value="installment_12m">12-Month Mortgage / Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowAllocationModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm Allocation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
