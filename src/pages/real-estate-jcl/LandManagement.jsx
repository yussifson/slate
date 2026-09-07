import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Plus, Edit, Trash2, Search, DollarSign, Layers,
  FileText, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  ChevronRight, Calendar, ArrowUpRight, Filter, Download, UserCheck,
  Compass, Landmark, Building2
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
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
import { REPageHeader } from '@/components/real-estate/RealEstateViewKit';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
import GenericKanban from '@/components/views/GenericKanban';
import { formatCurrency } from '@/lib/constants';

// Helper UUID generator
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
  parcelName: '',
  plotNumber: '',
  cadastralRef: '',
  address: '',
  city: '',
  state: '',
  country: 'Ghana',
  zipCode: '',
  lotSizeAcres: '',
  squareFeet: '',
  zoning: 'residential',
  topography: 'flat',
  titleType: 'C_of_O',
  price: '',
  status: 'available',
  description: '',
  agentName: '',
  ownershipInterests: [], // [{ ownerName, percentage, interestType, deedRef, phone, email }]
  allocation: null, // { customerName, customerEmail, customerPhone, allocationDate, expiryDate, depositAmount, paymentTerms, allocationStatus, notes }
  documents: [], // [{ docName, docType, url, uploadDate }]
};

export default function LandManagement() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [parcels, setParcels] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoningFilter, setZoningFilter] = useState('all');
  const [view, setView] = useViewPreference('jcl_land_management', 'grid');
  
  // Drawers & Modals
  const [showParcelDrawer, setShowParcelDrawer] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  // Allocation Quick Form
  const [allocationForm, setAllocationForm] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    allocationDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    depositAmount: '',
    totalAgreedPrice: '',
    paymentTerms: 'outright',
    allocationStatus: 'active_reserved',
    notes: '',
  });

  // Fetch Parcels (stored with property_type='land' or structured land JSON)
  const fetchParcels = async () => {
    try {
      setIsLoading(true);
      const [propRes, clientRes] = await Promise.all([
        powerSync.execute(
          `SELECT * FROM univ_re_properties WHERE company_id = ? AND (property_type = 'land' OR property_type = 'parcel') ORDER BY created_at DESC`,
          [companyId]
        ),
        powerSync.execute(
          `SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC`,
          [companyId]
        )
      ]);

      const rawParcels = propRes.rows._array || Array.from(propRes.rows || []);
      const parsedParcels = rawParcels.map(p => {
        let meta = {};
        try {
          if (p.features) {
            meta = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
          }
        } catch (err) {
          meta = {};
        }

        return {
          id: p.id,
          created_at: p.created_at,
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          country: p.country || '',
          zipCode: p.zip_code || '',
          price: p.price || 0,
          status: p.status || 'available',
          description: p.description || '',
          agentName: p.agent_name || '',
          squareFeet: p.square_feet || 0,
          lotSizeAcres: p.lot_size || meta.lotSizeAcres || 0,
          parcelName: meta.parcelName || p.address || 'Unnamed Parcel',
          plotNumber: meta.plotNumber || '',
          cadastralRef: meta.cadastralRef || '',
          zoning: meta.zoning || 'residential',
          topography: meta.topography || 'flat',
          titleType: meta.titleType || 'C_of_O',
          ownershipInterests: meta.ownershipInterests || [],
          allocation: meta.allocation || null,
          documents: meta.documents || [],
        };
      });

      setParcels(parsedParcels);
      setClients(clientRes.rows._array || Array.from(clientRes.rows || []));
    } catch (e) {
      console.error('[LandManagement] Fetch failed:', e);
      toast.error('Failed to load land parcel records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchParcels();
  }, [companyId]);

  // Filtered Parcels
  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const matchSearch = search === '' ||
        p.parcelName?.toLowerCase().includes(search.toLowerCase()) ||
        p.plotNumber?.toLowerCase().includes(search.toLowerCase()) ||
        p.cadastralRef?.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchZoning = zoningFilter === 'all' || p.zoning === zoningFilter;

      return matchSearch && matchStatus && matchZoning;
    });
  }, [parcels, search, statusFilter, zoningFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalParcels = parcels.length;
    const available = parcels.filter(p => p.status === 'available').length;
    const allocated = parcels.filter(p => p.status === 'allocated' || p.status === 'reserved').length;
    const sold = parcels.filter(p => p.status === 'sold').length;
    const totalAcres = parcels.reduce((sum, p) => sum + (Number(p.lotSizeAcres) || 0), 0);
    const totalValue = parcels.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    return { totalParcels, available, allocated, sold, totalAcres, totalValue };
  }, [parcels]);

  // Open Drawer for Create/Edit
  const handleOpenDrawer = (parcel = null) => {
    if (parcel) {
      setEditingId(parcel.id);
      setFormData({
        parcelName: parcel.parcelName,
        plotNumber: parcel.plotNumber,
        cadastralRef: parcel.cadastralRef,
        address: parcel.address,
        city: parcel.city,
        state: parcel.state,
        country: parcel.country || 'Ghana',
        zipCode: parcel.zipCode,
        lotSizeAcres: parcel.lotSizeAcres,
        squareFeet: parcel.squareFeet,
        zoning: parcel.zoning,
        topography: parcel.topography,
        titleType: parcel.titleType,
        price: parcel.price,
        status: parcel.status,
        description: parcel.description,
        agentName: parcel.agentName,
        ownershipInterests: parcel.ownershipInterests || [],
        allocation: parcel.allocation || null,
        documents: parcel.documents || [],
      });
    } else {
      setEditingId(null);
      setFormData({ ...initialFormData });
    }
    setShowParcelDrawer(true);
  };

  // Save Parcel
  const handleSaveParcel = async (e) => {
    e.preventDefault();
    if (!formData.parcelName || !formData.address) {
      toast.error('Parcel name and location address are required');
      return;
    }

    try {
      const metaData = {
        parcelName: formData.parcelName,
        plotNumber: formData.plotNumber,
        cadastralRef: formData.cadastralRef,
        zoning: formData.zoning,
        topography: formData.topography,
        titleType: formData.titleType,
        lotSizeAcres: formData.lotSizeAcres,
        ownershipInterests: formData.ownershipInterests,
        allocation: formData.allocation,
        documents: formData.documents,
      };

      const metaJson = JSON.stringify(metaData);
      const now = new Date().toISOString();

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_properties SET
            address = ?,
            city = ?,
            state = ?,
            country = ?,
            zip_code = ?,
            price = ?,
            status = ?,
            lot_size = ?,
            square_feet = ?,
            agent_name = ?,
            description = ?,
            features = ?,
            last_updated = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.address,
            formData.city,
            formData.state,
            formData.country,
            formData.zipCode,
            Number(formData.price) || 0,
            formData.status,
            Number(formData.lotSizeAcres) || 0,
            Number(formData.squareFeet) || 0,
            formData.agentName || user?.full_name || 'Admin',
            formData.description,
            metaJson,
            now,
            editingId,
            companyId
          ]
        );
        toast.success('Land parcel updated successfully');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_properties (
            id, created_at, company_id, address, city, state, country, zip_code,
            property_type, price, status, lot_size, square_feet, agent_name,
            description, features, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            now,
            companyId,
            formData.address,
            formData.city,
            formData.state,
            formData.country,
            formData.zipCode,
            'land',
            Number(formData.price) || 0,
            formData.status,
            Number(formData.lotSizeAcres) || 0,
            Number(formData.squareFeet) || 0,
            formData.agentName || user?.full_name || 'Admin',
            formData.description,
            metaJson,
            now
          ]
        );
        toast.success('Land parcel created successfully');
      }

      setShowParcelDrawer(false);
      fetchParcels();
    } catch (err) {
      console.error('[LandManagement] Save error:', err);
      toast.error('Failed to save land parcel');
    }
  };

  // Delete Parcel
  const handleDeleteParcel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this land parcel?')) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_properties WHERE id = ? AND company_id = ?`,
        [id, companyId]
      );
      toast.success('Parcel deleted');
      fetchParcels();
    } catch (err) {
      console.error('[LandManagement] Delete error:', err);
      toast.error('Failed to delete parcel');
    }
  };

  // Handle Quick Land Allocation
  const handleOpenAllocation = (parcel) => {
    setSelectedParcel(parcel);
    setAllocationForm({
      customerId: parcel.allocation?.customerId || '',
      customerName: parcel.allocation?.customerName || '',
      customerEmail: parcel.allocation?.customerEmail || '',
      customerPhone: parcel.allocation?.customerPhone || '',
      allocationDate: parcel.allocation?.allocationDate || new Date().toISOString().split('T')[0],
      expiryDate: parcel.allocation?.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      depositAmount: parcel.allocation?.depositAmount || '',
      totalAgreedPrice: parcel.allocation?.totalAgreedPrice || parcel.price || '',
      paymentTerms: parcel.allocation?.paymentTerms || 'outright',
      allocationStatus: parcel.allocation?.allocationStatus || 'active_reserved',
      notes: parcel.allocation?.notes || '',
    });
    setShowAllocationModal(true);
  };

  const handleSaveAllocation = async () => {
    if (!selectedParcel) return;
    if (!allocationForm.customerName) {
      toast.error('Customer name is required for allocation');
      return;
    }

    try {
      let meta = {};
      const res = await powerSync.execute(
        `SELECT features FROM univ_re_properties WHERE id = ? AND company_id = ?`,
        [selectedParcel.id, companyId]
      );
      if (res.rows?._array?.length > 0 && res.rows._array[0].features) {
        try { meta = JSON.parse(res.rows._array[0].features); } catch(e) {}
      }

      meta.allocation = {
        ...allocationForm,
        allocatedAt: new Date().toISOString(),
        allocatedBy: user?.full_name || 'Admin',
      };

      const newStatus = allocationForm.allocationStatus === 'formalized_contract' ? 'sold' : 'allocated';

      await powerSync.execute(
        `UPDATE univ_re_properties SET
          status = ?,
          features = ?,
          last_updated = ?
        WHERE id = ? AND company_id = ?`,
        [newStatus, JSON.stringify(meta), new Date().toISOString(), selectedParcel.id, companyId]
      );

      toast.success(`Parcel allocated to ${allocationForm.customerName}`);
      setShowAllocationModal(false);
      fetchParcels();
    } catch (err) {
      console.error('[LandManagement] Allocation save error:', err);
      toast.error('Failed to record allocation');
    }
  };

  // Ownership Interest Sub-item Helpers
  const addOwnershipInterest = () => {
    setFormData(prev => ({
      ...prev,
      ownershipInterests: [
        ...prev.ownershipInterests,
        { ownerName: '', percentage: 100, interestType: 'freehold', deedRef: '', phone: '', email: '' }
      ]
    }));
  };

  const updateOwnershipInterest = (index, field, value) => {
    setFormData(prev => {
      const list = [...prev.ownershipInterests];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, ownershipInterests: list };
    });
  };

  const removeOwnershipInterest = (index) => {
    setFormData(prev => ({
      ...prev,
      ownershipInterests: prev.ownershipInterests.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-28">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Land Management
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300">
                  JCL Department Module
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Parcels, Cadastral Records, Co-Ownership Interests & Prospect Allocations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ViewToggle view={view} onViewChange={setView} />
          <Button
            onClick={() => handleOpenDrawer()}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Land Parcel
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="rounded-2xl border bg-card/50 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Parcels</span>
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">{metrics.totalParcels}</span>
              <span className="text-xs font-medium text-muted-foreground">({metrics.totalAcres.toFixed(1)} Acres)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/50 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.available}</span>
              <span className="text-xs font-medium text-muted-foreground">ready for allocation</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/50 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allocated / Reserved</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.allocated}</span>
              <span className="text-xs font-medium text-muted-foreground">in progress</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/50 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio Land Value</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold">{formatCurrency(metrics.totalValue, 'USD')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parcel, plot #, cadastral, city..."
            className="pl-9 h-10 rounded-xl bg-background text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-36 rounded-xl text-xs font-medium">
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
            <SelectTrigger className="h-10 w-36 rounded-xl text-xs font-medium">
              <SelectValue placeholder="Zoning" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zonings</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="mixed">Mixed Use</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Main Parcels Views ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-muted rounded-2xl" />)}
        </div>
      ) : filteredParcels.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed">
          <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-foreground">No land parcels found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Add your first land parcel or cadastral plot to begin managing allocations.'}
          </p>
          <Button
            onClick={() => handleOpenDrawer()}
            className="mt-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Parcel
          </Button>
        </div>
      ) : view === 'kanban' ? (
        <GenericKanban
          items={filteredParcels}
          columns={[
            { id: 'available', title: 'Available' },
            { id: 'reserved', title: 'Reserved' },
            { id: 'allocated', title: 'Allocated' },
            { id: 'sold', title: 'Sold' },
          ]}
          onStatusChange={async (id, newStatus) => {
            try {
              await powerSync.execute(
                `UPDATE univ_re_properties SET status = ?, last_updated = ? WHERE id = ? AND company_id = ?`,
                [newStatus, new Date().toISOString(), id, companyId]
              );
              fetchParcels();
            } catch(e) {
              toast.error('Status update failed');
            }
          }}
          renderCard={(parcel) => (
            <div className="p-3.5 space-y-2.5 bg-card rounded-xl border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-sm text-foreground line-clamp-1">{parcel.parcelName}</span>
                <Badge className={statusConfig[parcel.status]?.color || ''}>
                  {statusConfig[parcel.status]?.label || parcel.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{parcel.address}, {parcel.city}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t font-semibold">
                <span className="text-amber-600">{parcel.lotSizeAcres || 0} Acres</span>
                <span>{formatCurrency(parcel.price, 'USD')}</span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleOpenAllocation(parcel)}
                  className="w-full text-[11px] h-7 gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <UserCheck className="w-3 h-3" /> Allocate
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleOpenDrawer(parcel)}
                  className="h-7 w-7 p-0"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        />
      ) : view === 'list' ? (
        <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 uppercase tracking-wider text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="p-3.5">Parcel / Plot</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Size / Zoning</th>
                  <th className="p-3.5">Title Type</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Allocation</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredParcels.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-semibold text-foreground">
                      <div>{p.parcelName}</div>
                      {p.plotNumber && <div className="text-[10px] text-muted-foreground">Plot: {p.plotNumber}</div>}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      <div>{p.address}</div>
                      <div className="text-[10px]">{p.city}, {p.state}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground">{p.lotSizeAcres || 0} Acres</div>
                      <div className="text-[10px] capitalize text-muted-foreground">{p.zoning}</div>
                    </td>
                    <td className="p-3.5 font-medium">
                      <Badge variant="outline" className="text-[10px] uppercase">{p.titleType}</Badge>
                    </td>
                    <td className="p-3.5 font-bold text-foreground">
                      {formatCurrency(p.price, 'USD')}
                    </td>
                    <td className="p-3.5">
                      <Badge className={statusConfig[p.status]?.color || ''}>
                        {statusConfig[p.status]?.label || p.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {p.allocation?.customerName ? (
                        <div>
                          <span className="font-semibold text-foreground block">{p.allocation.customerName}</span>
                          <span className="text-[10px] text-indigo-600">Exp: {p.allocation.expiryDate}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Unallocated</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenAllocation(p)}
                        className="text-[11px] h-7 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        <UserCheck className="w-3 h-3 mr-1" /> Allocate
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleOpenDrawer(p)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleDeleteParcel(p.id)}
                        className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParcels.map((p) => (
            <Card key={p.id} className="rounded-2xl border hover:shadow-md transition-all bg-card flex flex-col overflow-hidden">
              <div className="p-5 flex-1 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-foreground tracking-tight line-clamp-1">{p.parcelName}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{p.address}, {p.city}</span>
                    </p>
                  </div>
                  <Badge className={statusConfig[p.status]?.color || ''}>
                    {statusConfig[p.status]?.label || p.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Plot / Cadastral</span>
                    <span className="font-semibold text-foreground">{p.plotNumber || p.cadastralRef || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Total Area</span>
                    <span className="font-semibold text-amber-600">{p.lotSizeAcres || 0} Acres</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Zoning</span>
                    <span className="font-semibold capitalize text-foreground">{p.zoning}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Title Type</span>
                    <span className="font-semibold text-foreground">{p.titleType}</span>
                  </div>
                </div>

                {/* Allocation Box */}
                {p.allocation?.customerName ? (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 text-xs">
                    <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-semibold">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Allocated To:
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold uppercase">
                        {p.allocation.allocationStatus}
                      </span>
                    </div>
                    <div className="font-bold text-foreground mt-0.5">{p.allocation.customerName}</div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                      <span>Deposit: {p.allocation.depositAmount ? formatCurrency(p.allocation.depositAmount, 'USD') : 'None'}</span>
                      <span>Expires: {p.allocation.expiryDate}</span>
                    </div>
                  </div>
                ) : p.ownershipInterests?.length > 0 ? (
                  <div className="rounded-xl border bg-muted/20 p-2 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Co-Owners ({p.ownershipInterests.length}):
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {p.ownershipInterests.map(o => `${o.ownerName} (${o.percentage}%)`).join(', ')}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="p-4 border-t bg-muted/10 flex items-center justify-between mt-auto">
                <span className="text-base font-bold text-foreground">
                  {formatCurrency(p.price, 'USD')}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAllocation(p)}
                    className="text-xs h-8 px-2.5 font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1 rounded-xl"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Allocate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDrawer(p)}
                    className="h-8 w-8 p-0 rounded-xl"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteParcel(p.id)}
                    className="h-8 w-8 p-0 rounded-xl text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Slide-Over Parcel Drawer (Create / Edit) ── */}
      <Sheet open={showParcelDrawer} onOpenChange={setShowParcelDrawer}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 pb-28">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-lg font-bold">
              {editingId ? 'Edit Land Parcel Record' : 'Register New Land Parcel'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Cadastral specifications, co-ownership interests, legal titles & documentation
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveParcel} className="space-y-5 mt-4 text-xs">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-3 w-full rounded-xl">
                <TabsTrigger value="basic">Parcel Specs</TabsTrigger>
                <TabsTrigger value="ownership">Ownership</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
              </TabsList>

              {/* ── Tab 1: Basic Specifications ── */}
              <TabsContent value="basic" className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>Parcel Title / Name *</Label>
                  <Input
                    required
                    value={formData.parcelName}
                    onChange={(e) => setFormData({ ...formData, parcelName: e.target.value })}
                    placeholder="e.g. Royal Crest Sector 4, Plot 12"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Plot Number</Label>
                    <Input
                      value={formData.plotNumber}
                      onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                      placeholder="e.g. PL-4029"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cadastral / Survey Ref</Label>
                    <Input
                      value={formData.cadastralRef}
                      onChange={(e) => setFormData({ ...formData, cadastralRef: e.target.value })}
                      placeholder="e.g. CAD/GH/2026/088"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Location / Address *</Label>
                  <Input
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Airport Hills Residential Scheme"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Accra"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State / Region</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Greater Accra"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Ghana"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Area (Acres)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.lotSizeAcres}
                      onChange={(e) => setFormData({ ...formData, lotSizeAcres: e.target.value })}
                      placeholder="e.g. 2.5"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Asking Price ($)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="250000"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Zoning Type</Label>
                    <Select value={formData.zoning} onValueChange={(v) => setFormData({ ...formData, zoning: v })}>
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="agricultural">Agricultural</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="mixed">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Topography</Label>
                    <Select value={formData.topography} onValueChange={(v) => setFormData({ ...formData, topography: v })}>
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat / Level</SelectItem>
                        <SelectItem value="sloped">Sloped / Hillside</SelectItem>
                        <SelectItem value="waterfront">Waterfront</SelectItem>
                        <SelectItem value="forested">Forested / Wooded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Title Type</Label>
                    <Select value={formData.titleType} onValueChange={(v) => setFormData({ ...formData, titleType: v })}>
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C_of_O">Certificate of Occupancy</SelectItem>
                        <SelectItem value="Freehold">Freehold Title</SelectItem>
                        <SelectItem value="Leasehold">Leasehold Title</SelectItem>
                        <SelectItem value="Gazette">Gazette / Excision</SelectItem>
                        <SelectItem value="Deed_Assignment">Deed of Assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="allocated">Allocated</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="disputed">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* ── Tab 2: Co-Ownership & Beneficial Interests ── */}
              <TabsContent value="ownership" className="space-y-4 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Ownership & Beneficial Interests</h4>
                    <p className="text-[11px] text-muted-foreground">Record co-owners, equity percentages, and title references.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addOwnershipInterest}
                    className="rounded-xl text-xs h-8 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Owner
                  </Button>
                </div>

                {formData.ownershipInterests.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground">
                    <Users className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                    <p className="text-xs">No co-owners added. Default entity holds 100% interest.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.ownershipInterests.map((interest, idx) => (
                      <div key={idx} className="p-3 bg-muted/40 rounded-xl border space-y-2 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeOwnershipInterest(idx)}
                          className="absolute right-2 top-2 h-6 w-6 p-0 text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Owner / Entity Name</Label>
                            <Input
                              value={interest.ownerName}
                              onChange={(e) => updateOwnershipInterest(idx, 'ownerName', e.target.value)}
                              placeholder="e.g. JCL Asset Holding Corp"
                              className="h-8 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Interest %</Label>
                            <Input
                              type="number"
                              value={interest.percentage}
                              onChange={(e) => updateOwnershipInterest(idx, 'percentage', e.target.value)}
                              placeholder="50"
                              className="h-8 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Interest Type</Label>
                            <Input
                              value={interest.interestType}
                              onChange={(e) => updateOwnershipInterest(idx, 'interestType', e.target.value)}
                              placeholder="Freehold / Beneficial"
                              className="h-8 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Deed / Registration #</Label>
                            <Input
                              value={interest.deedRef}
                              onChange={(e) => updateOwnershipInterest(idx, 'deedRef', e.target.value)}
                              placeholder="REG-99382"
                              className="h-8 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Tab 3: Land Allocation Info ── */}
              <TabsContent value="allocation" className="space-y-4 pt-3">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Active Prospect Allocation</h4>
                  <p className="text-[11px] text-muted-foreground">Pre-sale parcel allocation details for this plot.</p>
                </div>

                {formData.allocation?.customerName ? (
                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">{formData.allocation.customerName}</span>
                      <Badge className="bg-indigo-600 text-white text-[10px]">{formData.allocation.allocationStatus}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>Email: {formData.allocation.customerEmail || 'N/A'}</div>
                      <div>Phone: {formData.allocation.customerPhone || 'N/A'}</div>
                      <div>Allocated: {formData.allocation.allocationDate}</div>
                      <div>Expires: {formData.allocation.expiryDate}</div>
                      <div>Deposit: {formatCurrency(formData.allocation.depositAmount, 'USD')}</div>
                      <div>Terms: {formData.allocation.paymentTerms}</div>
                    </div>
                    {formData.allocation.notes && (
                      <p className="text-[11px] italic text-muted-foreground border-t pt-1 mt-1">
                        Notes: {formData.allocation.notes}
                      </p>
                    )}
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() => setFormData({ ...formData, allocation: null, status: 'available' })}
                      className="mt-2 h-7 text-[11px] rounded-lg"
                    >
                      Clear Allocation
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground">
                    <UserCheck className="w-6 h-6 mx-auto mb-1.5 opacity-50 text-indigo-500" />
                    <p className="text-xs">No active allocation on this parcel.</p>
                    <p className="text-[10px] mt-0.5">Use the "Allocate" button on the parcel card to allocate to a prospect.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="pt-4 border-t flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowParcelDrawer(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
              >
                {editingId ? 'Update Parcel' : 'Save Land Parcel'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Dialog: Quick Land Allocation Modal ── */}
      <Dialog open={showAllocationModal} onOpenChange={setShowAllocationModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Allocate Parcel: {selectedParcel?.parcelName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign this plot to a prospect or buyer before formal purchase closing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {clients.length > 0 && (
              <div className="space-y-1">
                <Label>Select Existing Client (Optional)</Label>
                <Select
                  value={allocationForm.customerId}
                  onValueChange={(cid) => {
                    const found = clients.find(c => c.id === cid);
                    if (found) {
                      setAllocationForm(prev => ({
                        ...prev,
                        customerId: found.id,
                        customerName: found.name,
                        customerEmail: found.email || '',
                        customerPhone: found.phone || ''
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder="Pick a registered client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.type || 'client'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label>Prospect / Buyer Full Name *</Label>
              <Input
                required
                value={allocationForm.customerName}
                onChange={(e) => setAllocationForm({ ...allocationForm, customerName: e.target.value })}
                placeholder="e.g. Chief Kwame Mensah"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={allocationForm.customerEmail}
                  onChange={(e) => setAllocationForm({ ...allocationForm, customerEmail: e.target.value })}
                  placeholder="kwame@example.com"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input
                  value={allocationForm.customerPhone}
                  onChange={(e) => setAllocationForm({ ...allocationForm, customerPhone: e.target.value })}
                  placeholder="+233 24 000 0000"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Allocation Date</Label>
                <Input
                  type="date"
                  value={allocationForm.allocationDate}
                  onChange={(e) => setAllocationForm({ ...allocationForm, allocationDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry / Reservation Deadline</Label>
                <Input
                  type="date"
                  value={allocationForm.expiryDate}
                  onChange={(e) => setAllocationForm({ ...allocationForm, expiryDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Deposit Paid ($)</Label>
                <Input
                  type="number"
                  value={allocationForm.depositAmount}
                  onChange={(e) => setAllocationForm({ ...allocationForm, depositAmount: e.target.value })}
                  placeholder="25000"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>Payment Terms</Label>
                <Select
                  value={allocationForm.paymentTerms}
                  onValueChange={(v) => setAllocationForm({ ...allocationForm, paymentTerms: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outright">Outright 100%</SelectItem>
                    <SelectItem value="instalments_6m">6-Month Installments</SelectItem>
                    <SelectItem value="instalments_12m">12-Month Installments</SelectItem>
                    <SelectItem value="custom">Custom Milestone Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Allocation Stage</Label>
              <Select
                value={allocationForm.allocationStatus}
                onValueChange={(v) => setAllocationForm({ ...allocationForm, allocationStatus: v })}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_reserved">Active Reservation (Deposit Placed)</SelectItem>
                  <SelectItem value="pending_approval">Pending Board / Chief Approval</SelectItem>
                  <SelectItem value="formalized_contract">Formal Contract Signed</SelectItem>
                  <SelectItem value="lapsed_cancelled">Lapsed / Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Notes & Conditions</Label>
              <Input
                value={allocationForm.notes}
                onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                placeholder="Survey plan handoff conditions, deed drafting, etc."
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAllocationModal(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAllocation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              Confirm Land Allocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
