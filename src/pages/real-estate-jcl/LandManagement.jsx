import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass, Plus, Edit, Trash2, Search, DollarSign, Layers,
  CheckCircle2, Clock, MapPin, Users,
  ChevronRight, RefreshCw, LayoutGrid, List,
  Grid, UserCheck, Download, MoreVertical,
  ShieldCheck, Eye, Sparkles
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PortalAwareItem } from '@/lib/kanbanPortal.jsx';
import { usePowerSync } from '@powersync/react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Helper UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STATUS_COLUMNS = [
  { id: 'available', title: 'Available For Sale', dot: 'bg-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' },
  { id: 'reserved', title: 'Reserved / In Review', dot: 'bg-amber-500', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' },
  { id: 'allocated', title: 'Allocated To Buyer', dot: 'bg-indigo-500', badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' },
  { id: 'sold', title: 'Sold / Transferred', dot: 'bg-blue-500', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' },
];

const statusConfig = {
  'available': {
    label: 'Available For Sale',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
  },
  'reserved': {
    label: 'Reserved / Review',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
  },
  'allocated': {
    label: 'Allocated To Buyer',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
  },
  'sold': {
    label: 'Sold / Transferred',
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
  ownershipInterests: [],
  allocation: null,
  documents: [],
};

// ── Dedicated Self-Contained Land Kanban Component ──
function LandKanbanBoardComponent({ parcels, onUpdateStatus, onParcelClick, onOpenAllocation, onOpenDrawer, onDelete }) {
  const [optimisticParcels, setOptimisticParcels] = useState(parcels);

  useEffect(() => {
    setOptimisticParcels(parcels);
  }, [parcels]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const parcelId = draggableId;

    // Immediately update local optimistic state
    setOptimisticParcels(prev => prev.map(p => String(p.id) === String(parcelId) ? { ...p, status: newStatus } : p));

    // Propagate to PowerSync
    onUpdateStatus(parcelId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar items-start min-h-[600px]">
        {STATUS_COLUMNS.map(col => {
          const columnParcels = optimisticParcels.filter(p => {
            const s = (p.status || 'available').toLowerCase();
            if (col.id === 'available') {
              return s === 'available' || !STATUS_COLUMNS.some(c => c.id === s);
            }
            return s === col.id;
          });

          const totalVal = columnParcels.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
          const totalAcres = columnParcels.reduce((acc, p) => acc + (Number(p.lotSizeAcres) || 0), 0);

          return (
            <div key={col.id} className="flex flex-col w-[340px] shrink-0">
              {/* Column Header */}
              <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[18px] p-3.5 mb-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                  <div>
                    <h3 className="font-bold text-xs text-foreground tracking-tight">{col.title}</h3>
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      {columnParcels.length} Plots • {totalAcres.toFixed(1)} ac • {formatCurrency(totalVal, 'USD')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-extrabold h-5 px-1.5 bg-muted/40">
                  {columnParcels.length}
                </Badge>
              </div>

              {/* Droppable Stage Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 flex flex-col gap-3 min-h-[400px] p-1.5 rounded-[20px] transition-colors border border-transparent",
                      snapshot.isDraggingOver && "bg-muted/40 border-dashed border-amber-500/30"
                    )}
                  >
                    {columnParcels.map((parcel, index) => (
                      <Draggable key={String(parcel.id)} draggableId={String(parcel.id)} index={index}>
                        {(providedDraggable, snapshotDraggable) => (
                          <PortalAwareItem provided={providedDraggable} snapshot={snapshotDraggable}>
                            <div
                              onClick={() => onParcelClick(parcel)}
                              className={cn(
                                "p-4 bg-card/95 backdrop-blur-md rounded-[20px] border border-border/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-amber-500/40 transition-all cursor-pointer group space-y-3",
                                snapshotDraggable.isDragging && "shadow-2xl border-amber-500 ring-2 ring-amber-500/30 rotate-1 z-50 bg-card"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-[13px] text-foreground truncate group-hover:text-amber-600 transition-colors">
                                    {parcel.parcelName}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                    <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span className="truncate">{parcel.address}, {parcel.city}</span>
                                  </p>
                                </div>

                                <Badge variant="outline" className="text-[9px] font-extrabold uppercase py-0 h-4 bg-muted/40 shrink-0">
                                  {parcel.plotNumber || 'Plot'}
                                </Badge>
                              </div>

                              {/* Acreage & Financial Strip */}
                              <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-xl text-xs border border-border/40 font-bold">
                                <span className="text-amber-600">{parcel.lotSizeAcres || 0} Acres</span>
                                <span className="text-foreground">{formatCurrency(parcel.price, 'USD')}</span>
                              </div>

                              {/* Active Allocation Pill */}
                              {parcel.allocation?.customerName ? (
                                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/30 p-2 text-[11px] space-y-0.5">
                                  <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-bold">
                                    <span className="truncate">👤 {parcel.allocation.customerName}</span>
                                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-indigo-200 dark:bg-indigo-800">
                                      {parcel.allocation.allocationStatus}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Exp: {parcel.allocation.expiryDate}
                                  </div>
                                </div>
                              ) : null}

                              {/* Card Footer Actions */}
                              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                <span className="capitalize font-semibold">{parcel.zoning} • {parcel.titleType}</span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => onOpenAllocation(parcel)}
                                    className="text-[10px] h-6 px-2 font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-lg"
                                  >
                                    <UserCheck className="w-2.5 h-2.5 mr-1" /> Allocate
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => onOpenDrawer(parcel)}
                                    className="h-6 w-6 p-0 rounded-lg text-muted-foreground"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => onDelete(parcel.id)}
                                    className="h-6 w-6 p-0 rounded-lg text-rose-500 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </PortalAwareItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

export default function LandManagement() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [parcels, setParcels] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoningFilter, setZoningFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'board' | 'list'
  
  // Drawers & Modals
  const [showParcelDrawer, setShowParcelDrawer] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [inspectorParcel, setInspectorParcel] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
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

  // Fetch Parcels
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
        } catch (_err) {
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
    } catch (_e) {
      toast.error('Failed to load land parcel records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchParcels();
      const channel = supabase.channel(`univ_re_land_${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_re_properties', filter: `company_id=eq.${companyId}` }, fetchParcels)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchParcels();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Land records synchronized');
    }, 400);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Parcel Name,Plot Number,Cadastral Ref,Location,City,State,Acres,Zoning,Title Type,Price,Status,Allocated To\n"
      + parcels.map(p => `"${p.parcelName || ''}","${p.plotNumber || ''}","${p.cadastralRef || ''}","${p.address || ''}","${p.city || ''}","${p.state || ''}","${p.lotSizeAcres || 0}","${p.zoning || ''}","${p.titleType || ''}","${p.price || 0}","${p.status || ''}","${p.allocation?.customerName || 'None'}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jcl_land_parcels_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Land inventory exported to CSV');
  };

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

  // Update Status in PowerSync
  const handleUpdateStatus = async (parcelId, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_re_properties SET status = ?, last_updated = ? WHERE id = ? AND company_id = ?`,
        [newStatus, new Date().toISOString(), parcelId, companyId]
      );
      fetchParcels();
    } catch (_err) {
      toast.error('Failed to update parcel status');
      fetchParcels();
    }
  };

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
            id,
            company_id,
            created_at,
            address,
            city,
            state,
            country,
            zip_code,
            price,
            status,
            property_type,
            lot_size,
            square_feet,
            agent_name,
            description,
            features,
            last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            companyId,
            now,
            formData.address,
            formData.city,
            formData.state,
            formData.country,
            formData.zipCode,
            Number(formData.price) || 0,
            formData.status,
            'land',
            Number(formData.lotSizeAcres) || 0,
            Number(formData.squareFeet) || 0,
            formData.agentName || user?.full_name || 'Admin',
            formData.description,
            metaJson,
            now
          ]
        );
        toast.success('Land parcel registered');
      }

      setShowParcelDrawer(false);
      fetchParcels();
      if (inspectorParcel && inspectorParcel.id === editingId) {
        setInspectorParcel(null);
      }
    } catch (_err) {
      toast.error('Failed to save land parcel');
    }
  };

  const handleDeleteParcel = async (id) => {
    try {
      await powerSync.execute(`DELETE FROM univ_re_properties WHERE id = ? AND company_id = ?`, [id, companyId]);
      toast.success('Land parcel record deleted');
      setDeleteId(null);
      if (inspectorParcel?.id === id) setInspectorParcel(null);
      fetchParcels();
    } catch (_err) {
      toast.error('Failed to delete parcel');
    }
  };

  const handleOpenAllocation = (parcel) => {
    setSelectedParcel(parcel);
    if (parcel.allocation) {
      setAllocationForm({
        customerId: parcel.allocation.customerId || '',
        customerName: parcel.allocation.customerName || '',
        customerEmail: parcel.allocation.customerEmail || '',
        customerPhone: parcel.allocation.customerPhone || '',
        allocationDate: parcel.allocation.allocationDate || new Date().toISOString().split('T')[0],
        expiryDate: parcel.allocation.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        depositAmount: parcel.allocation.depositAmount || '',
        totalAgreedPrice: parcel.allocation.totalAgreedPrice || parcel.price || '',
        paymentTerms: parcel.allocation.paymentTerms || 'outright',
        allocationStatus: parcel.allocation.allocationStatus || 'active_reserved',
        notes: parcel.allocation.notes || '',
      });
    } else {
      setAllocationForm({
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        allocationDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        depositAmount: '',
        totalAgreedPrice: parcel.price || '',
        paymentTerms: 'outright',
        allocationStatus: 'active_reserved',
        notes: '',
      });
    }
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
        try { meta = JSON.parse(res.rows._array[0].features); } catch(_e) {}
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
      if (inspectorParcel?.id === selectedParcel.id) {
        setInspectorParcel({
          ...inspectorParcel,
          status: newStatus,
          allocation: meta.allocation
        });
      }
    } catch (_err) {
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
    <div className="space-y-6 pb-12 font-sans min-h-screen p-4 sm:p-6 lg:p-8 relative bg-background">
      
      {/* ── Top Header & Breadcrumbs Row ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Land Management ({parcels.length})
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cadastral boundary tracking, co-ownership equity, and prospect parcel allocations
          </p>
        </div>

        <div className="flex items-center gap-3 text-[13px] font-semibold text-muted-foreground">
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground">Land Management</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 bg-card border-border text-foreground shadow-sm rounded-xl hover:bg-muted font-bold text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 w-9 bg-card border-border text-foreground shadow-sm rounded-xl hover:bg-muted"
            title="Refresh Land Records"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Strip (Law Management System Glass Design) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Parcels</span>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">{metrics.totalParcels}</div>
              <p className="text-[11px] text-muted-foreground font-semibold">{metrics.totalAcres.toFixed(1)} Total Acres</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Available For Sale</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">{metrics.available}</div>
              <p className="text-[11px] text-muted-foreground font-semibold">Ready for allocation</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Allocated / Reserved</span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">{metrics.allocated}</div>
              <p className="text-[11px] text-muted-foreground font-semibold">{metrics.sold} Parcels Closed Sold</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-indigo-500/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Portfolio Valuation</span>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">{formatCurrency(metrics.totalValue, 'USD')}</div>
              <p className="text-[11px] text-muted-foreground font-semibold">Active Land Asset Value</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-blue-500/5 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-inner">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full space-y-4">
        {/* ── Search, Filters & Action Hub Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card/90 backdrop-blur-xl p-3 sm:p-4 rounded-[20px] border border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parcel, plot #, cadastral, city..."
                className="pl-9 h-10 rounded-xl bg-background text-xs border-border/80"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-44 rounded-xl text-xs font-medium bg-background border-border/80">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses ({parcels.length})</SelectItem>
                <SelectItem value="available">Available For Sale</SelectItem>
                <SelectItem value="reserved">Reserved / In Review</SelectItem>
                <SelectItem value="allocated">Allocated To Buyer</SelectItem>
                <SelectItem value="sold">Sold / Transferred</SelectItem>
                <SelectItem value="disputed">Under Review</SelectItem>
              </SelectContent>
            </Select>

            <Select value={zoningFilter} onValueChange={setZoningFilter}>
              <SelectTrigger className="h-10 w-40 rounded-xl text-xs font-medium bg-background border-border/80">
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

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <TabsList className="bg-muted/60 p-1 rounded-xl h-10 border border-border/60">
              <TabsTrigger value="grid" className="rounded-lg text-xs font-bold gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Grid className="w-3.5 h-3.5" /> Grid
              </TabsTrigger>
              <TabsTrigger value="board" className="rounded-lg text-xs font-bold gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <LayoutGrid className="w-3.5 h-3.5" /> Board
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-lg text-xs font-bold gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <List className="w-3.5 h-3.5" /> List
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => handleOpenDrawer()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Land Parcel
            </Button>
          </div>
        </div>

        {/* ── Tab Content: Modern Luxury Grid Card View ── */}
        <TabsContent value="grid" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-80 bg-muted rounded-[26px]" />)}
            </div>
          ) : filteredParcels.length === 0 ? (
            <div className="text-center py-20 bg-card/60 backdrop-blur-xl rounded-[28px] border border-dashed border-border/80 p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8 opacity-75" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">No land parcels found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {search || statusFilter !== 'all' || zoningFilter !== 'all'
                    ? 'No records match your active search filters.'
                    : 'Register your first land parcel or cadastral plot to begin managing allocations.'}
                </p>
              </div>
              <Button
                onClick={() => handleOpenDrawer()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Land Parcel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredParcels.map((parcel) => (
                <div
                  key={parcel.id}
                  onClick={() => setInspectorParcel(parcel)}
                  className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group relative"
                >
                  {/* Card Visual Header Banner */}
                  <div className="p-5 pb-4 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-[15px] text-foreground group-hover:text-amber-600 transition-colors line-clamp-1">
                            {parcel.parcelName}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{parcel.address}, {parcel.city}</span>
                          </p>
                        </div>
                      </div>

                      <Badge className={cn("text-[10px] font-extrabold uppercase shrink-0 border py-0.5 px-2", statusConfig[parcel.status]?.color || statusConfig['available'].color)}>
                        {statusConfig[parcel.status]?.label || parcel.status}
                      </Badge>
                    </div>

                    {/* Cadastral & Spec Pill Strip */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {parcel.plotNumber && (
                        <Badge variant="outline" className="text-[10px] font-black uppercase bg-muted/40 border-border/80">
                          Plot {parcel.plotNumber}
                        </Badge>
                      )}
                      {parcel.cadastralRef && (
                        <Badge variant="outline" className="text-[10px] font-mono font-bold bg-muted/40 text-muted-foreground border-border/80">
                          CAD: {parcel.cadastralRef}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200">
                        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> {parcel.titleType}
                      </Badge>
                    </div>

                    {/* 3-Column Structured Stats Matrix */}
                    <div className="grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-2xl border border-border/60 text-center">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground block text-[9px] font-black uppercase tracking-wider">Lot Area</span>
                        <span className="font-black text-amber-600 text-xs">{parcel.lotSizeAcres || 0} Acres</span>
                      </div>
                      <div className="space-y-0.5 border-x border-border/60">
                        <span className="text-muted-foreground block text-[9px] font-black uppercase tracking-wider">Zoning</span>
                        <span className="font-bold capitalize text-foreground text-xs">{parcel.zoning}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground block text-[9px] font-black uppercase tracking-wider">Terrain</span>
                        <span className="font-bold capitalize text-foreground text-xs">{parcel.topography}</span>
                      </div>
                    </div>

                    {/* Active Allocation or Ownership Highlight */}
                    {parcel.allocation?.customerName ? (
                      <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/70 dark:bg-indigo-950/40 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-bold">
                          <span className="flex items-center gap-1.5 truncate">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="truncate">{parcel.allocation.customerName}</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200 font-black uppercase">
                            {parcel.allocation.allocationStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-indigo-200/50">
                          <span>Deposit: {parcel.allocation.depositAmount ? formatCurrency(parcel.allocation.depositAmount, 'USD') : '$0'}</span>
                          <span>Exp: {parcel.allocation.expiryDate}</span>
                        </div>
                      </div>
                    ) : parcel.ownershipInterests?.length > 0 ? (
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-2.5 text-xs">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">
                          Co-Ownership ({parcel.ownershipInterests.length} Stakeholders):
                        </span>
                        <p className="font-medium text-foreground truncate text-[11px]">
                          {parcel.ownershipInterests.map(o => `${o.ownerName} (${o.percentage}%)`).join(', ')}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-2.5 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" /> Unallocated Plot
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">Available for assignment</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Valuation & Action Bar */}
                  <div className="p-4 px-5 border-t border-border/70 bg-muted/15 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block">Asking Valuation</span>
                      <span className="text-lg font-black text-foreground">
                        {formatCurrency(parcel.price, 'USD')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={() => handleOpenAllocation(parcel)}
                        className="text-xs h-8 px-3 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Allocate
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleOpenDrawer(parcel)}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                        title="Edit Record"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => setInspectorParcel(parcel)}>
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Inspect Parcel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDrawer(parcel)}>
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Parcel
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => setDeleteId(parcel.id)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Parcel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab Content: Dedicated Drag-and-Drop Kanban Board ── */}
        <TabsContent value="board" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted rounded-[24px]" />)}
            </div>
          ) : (
            <LandKanbanBoardComponent
              parcels={filteredParcels}
              onUpdateStatus={handleUpdateStatus}
              onParcelClick={(p) => setInspectorParcel(p)}
              onOpenAllocation={handleOpenAllocation}
              onOpenDrawer={handleOpenDrawer}
              onDelete={(id) => setDeleteId(id)}
            />
          )}
        </TabsContent>

        {/* ── Tab Content: Executive Premium List View ── */}
        <TabsContent value="list" className="mt-0">
          <div className="bg-card/90 backdrop-blur-xl rounded-[24px] border border-border/80 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 uppercase tracking-wider text-muted-foreground font-extrabold border-b border-border/80 text-[10px]">
                  <tr>
                    <th className="p-4 pl-5">Parcel & Plot Specification</th>
                    <th className="p-4">Geographic Location</th>
                    <th className="p-4">Acreage & Zoning</th>
                    <th className="p-4">Legal Title</th>
                    <th className="p-4">Valuation & Rate</th>
                    <th className="p-4">Market Status</th>
                    <th className="p-4">Active Allocation</th>
                    <th className="p-4 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredParcels.map((p) => {
                    const pricePerAcre = p.lotSizeAcres && Number(p.lotSizeAcres) > 0 ? (Number(p.price) / Number(p.lotSizeAcres)) : 0;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setInspectorParcel(p)}
                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        {/* 1. Parcel & Plot Specification */}
                        <td className="p-4 pl-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
                              <Compass className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-foreground text-[13px] group-hover:text-amber-600 transition-colors">
                                {p.parcelName}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {p.plotNumber && (
                                  <Badge variant="outline" className="text-[9px] font-black uppercase py-0 h-4 bg-muted/40 border-border/60">
                                    Plot: {p.plotNumber}
                                  </Badge>
                                )}
                                {p.cadastralRef && (
                                  <span className="text-[10px] text-muted-foreground font-mono font-medium">
                                    CAD: {p.cadastralRef}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Geographic Location */}
                        <td className="p-4">
                          <div className="space-y-0.5 text-muted-foreground">
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[180px]">{p.address}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground ml-4">
                              {p.city}{p.state ? `, ${p.state}` : ''}
                            </div>
                          </div>
                        </td>

                        {/* 3. Acreage & Zoning */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="font-black text-amber-600 text-sm">
                              {p.lotSizeAcres || 0} <span className="text-[10px] font-semibold uppercase text-muted-foreground">Acres</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] capitalize font-bold bg-muted/30">
                              {p.zoning}
                            </Badge>
                          </div>
                        </td>

                        {/* 4. Legal Title */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <Badge variant="outline" className="text-[10px] font-extrabold uppercase bg-card">
                              {p.titleType}
                            </Badge>
                          </div>
                        </td>

                        {/* 5. Valuation & Rate */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-foreground text-sm">
                              {formatCurrency(p.price, 'USD')}
                            </div>
                            {pricePerAcre > 0 && (
                              <div className="text-[10px] text-muted-foreground font-semibold">
                                {formatCurrency(pricePerAcre, 'USD')} / ac
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 6. Market Status */}
                        <td className="p-4">
                          <Badge className={cn("text-[10px] font-bold uppercase border shadow-none", statusConfig[p.status]?.color || statusConfig['available'].color)}>
                            {statusConfig[p.status]?.label || p.status}
                          </Badge>
                        </td>

                        {/* 7. Active Allocation */}
                        <td className="p-4 text-muted-foreground">
                          {p.allocation?.customerName ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-foreground text-xs flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                {p.allocation.customerName}
                              </div>
                              <div className="text-[10px] text-indigo-600 font-semibold flex items-center gap-2">
                                <span>Deposit: {p.allocation.depositAmount ? formatCurrency(p.allocation.depositAmount, 'USD') : '$0'}</span>
                                <span>•</span>
                                <span>Exp: {p.allocation.expiryDate}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-[11px]">Unallocated Plot</span>
                          )}
                        </td>

                        {/* 8. Actions */}
                        <td className="p-4 pr-5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleOpenAllocation(p)}
                            className="text-[11px] h-7 px-2.5 font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl"
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Allocate
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-muted-foreground hover:text-foreground">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem onClick={() => setInspectorParcel(p)}>
                                <Eye className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Inspect Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDrawer(p)}>
                                <Edit className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Edit Parcel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenAllocation(p)}>
                                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Allocate to Prospect
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => setDeleteId(p.id)}>
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Parcel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Slide-Over Parcel Inspector Drawer ── */}
      <Sheet open={!!inspectorParcel} onOpenChange={(open) => !open && setInspectorParcel(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 pb-28 space-y-6">
          {inspectorParcel && (
            <>
              <SheetHeader className="pb-4 border-b border-border/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <SheetTitle className="text-xl font-extrabold text-foreground">
                      {inspectorParcel.parcelName}
                    </SheetTitle>
                    <SheetDescription className="text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      {inspectorParcel.address}, {inspectorParcel.city}, {inspectorParcel.state}
                    </SheetDescription>
                  </div>
                  <Badge className={cn("text-[10px] font-bold uppercase border", statusConfig[inspectorParcel.status]?.color || statusConfig['available'].color)}>
                    {statusConfig[inspectorParcel.status]?.label || inspectorParcel.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <Button
                    size="sm"
                    onClick={() => handleOpenAllocation(inspectorParcel)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-8 gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Allocate Plot
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDrawer(inspectorParcel)}
                    className="font-bold text-xs rounded-xl h-8 gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Record
                  </Button>
                </div>
              </SheetHeader>

              {/* Inspector Content Tabs */}
              <Tabs defaultValue="overview" className="w-full space-y-4">
                <TabsList className="grid grid-cols-3 w-full rounded-xl bg-muted/60 p-1 border border-border/60">
                  <TabsTrigger value="overview" className="text-xs font-bold rounded-lg">Overview</TabsTrigger>
                  <TabsTrigger value="co_ownership" className="text-xs font-bold rounded-lg">Co-Ownership</TabsTrigger>
                  <TabsTrigger value="allocation_details" className="text-xs font-bold rounded-lg">Allocation</TabsTrigger>
                </TabsList>

                {/* Tab: Overview */}
                <TabsContent value="overview" className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/40 rounded-2xl border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Asking Price</span>
                      <span className="text-lg font-extrabold text-foreground">{formatCurrency(inspectorParcel.price, 'USD')}</span>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-2xl border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Parcel Acreage</span>
                      <span className="text-lg font-extrabold text-amber-600">{inspectorParcel.lotSizeAcres || 0} Acres</span>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border/80 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cadastral Specifications</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Plot Reference</span>
                        <span className="font-bold text-foreground">{inspectorParcel.plotNumber || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Cadastral Survey Number</span>
                        <span className="font-bold text-foreground">{inspectorParcel.cadastralRef || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Zoning Classification</span>
                        <span className="font-bold capitalize text-foreground">{inspectorParcel.zoning}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Topography</span>
                        <span className="font-bold capitalize text-foreground">{inspectorParcel.topography}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Title Document</span>
                        <span className="font-bold text-foreground">{inspectorParcel.titleType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Assigned Agent</span>
                        <span className="font-bold text-foreground">{inspectorParcel.agentName || 'Unassigned'}</span>
                      </div>
                    </div>

                    {inspectorParcel.description && (
                      <div className="pt-2 border-t border-border/60">
                        <span className="text-muted-foreground block text-[10px] mb-1">Description</span>
                        <p className="text-xs text-foreground font-medium">{inspectorParcel.description}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Co-Ownership */}
                <TabsContent value="co_ownership" className="space-y-4 pt-1">
                  {inspectorParcel.ownershipInterests?.length > 0 ? (
                    <div className="space-y-3">
                      {inspectorParcel.ownershipInterests.map((owner, idx) => (
                        <div key={idx} className="p-3.5 bg-card rounded-2xl border border-border/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">{owner.ownerName}</span>
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-extrabold text-[10px]">
                              {owner.percentage}% Equity
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>Interest: <span className="font-bold text-foreground">{owner.interestType || 'Freehold'}</span></div>
                            <div>Deed Ref: <span className="font-bold text-foreground">{owner.deedRef || 'N/A'}</span></div>
                            {owner.phone && <div>Phone: <span className="font-bold text-foreground">{owner.phone}</span></div>}
                            {owner.email && <div>Email: <span className="font-bold text-foreground">{owner.email}</span></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed p-6 space-y-2">
                      <Users className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-xs font-bold text-foreground">Single Owner Entity</p>
                      <p className="text-[11px] text-muted-foreground">This plot is held at 100% interest by the parent enterprise.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Allocation */}
                <TabsContent value="allocation_details" className="space-y-4 pt-1">
                  {inspectorParcel.allocation?.customerName ? (
                    <div className="bg-card rounded-2xl border border-indigo-200/80 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-foreground">{inspectorParcel.allocation.customerName}</span>
                        <Badge className="bg-indigo-600 text-white font-bold text-[10px] uppercase">
                          {inspectorParcel.allocation.allocationStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Email: <span className="font-bold text-foreground">{inspectorParcel.allocation.customerEmail || 'N/A'}</span></div>
                        <div>Phone: <span className="font-bold text-foreground">{inspectorParcel.allocation.customerPhone || 'N/A'}</span></div>
                        <div>Allocated Date: <span className="font-bold text-foreground">{inspectorParcel.allocation.allocationDate}</span></div>
                        <div>Expiry Date: <span className="font-bold text-foreground">{inspectorParcel.allocation.expiryDate}</span></div>
                        <div>Deposit Paid: <span className="font-bold text-emerald-600">{formatCurrency(inspectorParcel.allocation.depositAmount, 'USD')}</span></div>
                        <div>Payment Terms: <span className="font-bold text-foreground">{inspectorParcel.allocation.paymentTerms}</span></div>
                      </div>
                      {inspectorParcel.allocation.notes && (
                        <div className="pt-2 border-t border-border/60 text-xs">
                          <span className="text-muted-foreground block text-[10px]">Conditions / Notes</span>
                          <p className="font-medium text-foreground">{inspectorParcel.allocation.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed p-6 space-y-2">
                      <UserCheck className="w-8 h-8 mx-auto text-indigo-500 opacity-50" />
                      <p className="text-xs font-bold text-foreground">No Active Allocation</p>
                      <p className="text-[11px] text-muted-foreground">This plot is available for assignment to a prospect or buyer.</p>
                      <Button
                        size="sm"
                        onClick={() => handleOpenAllocation(inspectorParcel)}
                        className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                      >
                        Allocate Now
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Slide-Over Parcel Form Drawer (Create / Edit) ── */}
      <Sheet open={showParcelDrawer} onOpenChange={setShowParcelDrawer}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 pb-28">
          <SheetHeader className="pb-4 border-b border-border/80">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Land Parcel Record' : 'Register New Land Parcel'}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Cadastral specifications, co-ownership interests, legal titles & documentation
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveParcel} className="space-y-5 mt-4 text-xs">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-3 w-full rounded-xl bg-muted/60 p-1 border border-border/60">
                <TabsTrigger value="basic" className="font-bold text-xs rounded-lg">Parcel Specs</TabsTrigger>
                <TabsTrigger value="ownership" className="font-bold text-xs rounded-lg">Co-Ownership</TabsTrigger>
                <TabsTrigger value="allocation" className="font-bold text-xs rounded-lg">Allocation</TabsTrigger>
              </TabsList>

              {/* ── Tab 1: Basic Specifications ── */}
              <TabsContent value="basic" className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label className="font-bold">Parcel Title / Name *</Label>
                  <Input
                    required
                    value={formData.parcelName}
                    onChange={(e) => setFormData({ ...formData, parcelName: e.target.value })}
                    placeholder="e.g. Royal Crest Sector 4, Plot 12"
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-bold">Plot Number</Label>
                    <Input
                      value={formData.plotNumber}
                      onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                      placeholder="e.g. PL-4029"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold">Cadastral / Survey Ref</Label>
                    <Input
                      value={formData.cadastralRef}
                      onChange={(e) => setFormData({ ...formData, cadastralRef: e.target.value })}
                      placeholder="e.g. CAD/GH/2026/088"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold">Location / Address *</Label>
                  <Input
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Airport Hills Residential Scheme"
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-bold">City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Accra"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold">State / Region</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Greater Accra"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold">Country</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Ghana"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-bold">Area (Acres)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.lotSizeAcres}
                      onChange={(e) => setFormData({ ...formData, lotSizeAcres: e.target.value })}
                      placeholder="e.g. 2.5"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold">Asking Price ($)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="250000"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-bold">Zoning Type</Label>
                    <Select value={formData.zoning} onValueChange={(v) => setFormData({ ...formData, zoning: v })}>
                      <SelectTrigger className="rounded-xl text-xs h-10">
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
                    <Label className="font-bold">Topography</Label>
                    <Select value={formData.topography} onValueChange={(v) => setFormData({ ...formData, topography: v })}>
                      <SelectTrigger className="rounded-xl text-xs h-10">
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
                    <Label className="font-bold">Title Type</Label>
                    <Select value={formData.titleType} onValueChange={(v) => setFormData({ ...formData, titleType: v })}>
                      <SelectTrigger className="rounded-xl text-xs h-10">
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
                  <Label className="font-bold">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="rounded-xl text-xs h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available For Sale</SelectItem>
                      <SelectItem value="reserved">Reserved / In Review</SelectItem>
                      <SelectItem value="allocated">Allocated To Buyer</SelectItem>
                      <SelectItem value="sold">Sold / Transferred</SelectItem>
                      <SelectItem value="disputed">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* ── Tab 2: Co-Ownership ── */}
              <TabsContent value="ownership" className="space-y-4 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">Ownership & Beneficial Interests</h4>
                    <p className="text-[11px] text-muted-foreground">Record co-owners, equity percentages, and title references.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addOwnershipInterest}
                    className="rounded-xl text-xs h-8 gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Owner
                  </Button>
                </div>

                {formData.ownershipInterests.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-border/80 text-center text-muted-foreground">
                    <Users className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                    <p className="text-xs font-semibold">No co-owners added. Default entity holds 100% interest.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.ownershipInterests.map((interest, idx) => (
                      <div key={idx} className="p-3 bg-muted/40 rounded-2xl border border-border/60 space-y-2 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeOwnershipInterest(idx)}
                          className="absolute right-2 top-2 h-6 w-6 p-0 text-rose-500 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold">Owner / Entity Name</Label>
                            <Input
                              value={interest.ownerName}
                              onChange={(e) => updateOwnershipInterest(idx, 'ownerName', e.target.value)}
                              placeholder="e.g. JCL Asset Holding Corp"
                              className="h-8 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold">Interest %</Label>
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
                            <Label className="text-[10px] font-bold">Interest Type</Label>
                            <Input
                              value={interest.interestType}
                              onChange={(e) => updateOwnershipInterest(idx, 'interestType', e.target.value)}
                              placeholder="Freehold / Beneficial"
                              className="h-8 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold">Deed / Registration #</Label>
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
                  <h4 className="font-bold text-foreground text-sm">Active Prospect Allocation</h4>
                  <p className="text-[11px] text-muted-foreground">Pre-sale parcel allocation details for this plot.</p>
                </div>

                {formData.allocation?.customerName ? (
                  <div className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">{formData.allocation.customerName}</span>
                      <Badge className="bg-indigo-600 text-white text-[10px] font-bold">{formData.allocation.allocationStatus}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>Email: {formData.allocation.customerEmail || 'N/A'}</div>
                      <div>Phone: {formData.allocation.customerPhone || 'N/A'}</div>
                      <div>Allocated: {formData.allocation.allocationDate}</div>
                      <div>Expires: {formData.allocation.expiryDate}</div>
                      <div>Deposit: {formatCurrency(formData.allocation.depositAmount, 'USD')}</div>
                      <div>Terms: {formData.allocation.paymentTerms}</div>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() => setFormData({ ...formData, allocation: null, status: 'available' })}
                      className="mt-2 h-7 text-[11px] rounded-lg font-bold"
                    >
                      Clear Allocation
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-border/80 text-center text-muted-foreground">
                    <UserCheck className="w-6 h-6 mx-auto mb-1.5 opacity-50 text-indigo-500" />
                    <p className="text-xs font-semibold">No active allocation on this parcel.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowParcelDrawer(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs"
              >
                {editingId ? 'Update Parcel' : 'Save Land Parcel'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Dialog: Quick Land Allocation Modal ── */}
      <Dialog open={showAllocationModal} onOpenChange={setShowAllocationModal}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
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
                <Label className="font-bold">Select Existing Client (Optional)</Label>
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
                  <SelectTrigger className="rounded-xl text-xs h-10">
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
              <Label className="font-bold">Prospect / Buyer Full Name *</Label>
              <Input
                required
                value={allocationForm.customerName}
                onChange={(e) => setAllocationForm({ ...allocationForm, customerName: e.target.value })}
                placeholder="e.g. Chief Kwame Mensah"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="font-bold">Contact Email</Label>
                <Input
                  type="email"
                  value={allocationForm.customerEmail}
                  onChange={(e) => setAllocationForm({ ...allocationForm, customerEmail: e.target.value })}
                  placeholder="kwame@example.com"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-bold">Phone Number</Label>
                <Input
                  value={allocationForm.customerPhone}
                  onChange={(e) => setAllocationForm({ ...allocationForm, customerPhone: e.target.value })}
                  placeholder="+233 24 000 0000"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="font-bold">Allocation Date</Label>
                <Input
                  type="date"
                  value={allocationForm.allocationDate}
                  onChange={(e) => setAllocationForm({ ...allocationForm, allocationDate: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Expiry / Deadline</Label>
                <Input
                  type="date"
                  value={allocationForm.expiryDate}
                  onChange={(e) => setAllocationForm({ ...allocationForm, expiryDate: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="font-bold">Deposit Paid ($)</Label>
                <Input
                  type="number"
                  value={allocationForm.depositAmount}
                  onChange={(e) => setAllocationForm({ ...allocationForm, depositAmount: e.target.value })}
                  placeholder="25000"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-bold">Payment Terms</Label>
                <Select
                  value={allocationForm.paymentTerms}
                  onValueChange={(v) => setAllocationForm({ ...allocationForm, paymentTerms: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs h-10">
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
              <Label className="font-bold">Allocation Stage</Label>
              <Select
                value={allocationForm.allocationStatus}
                onValueChange={(v) => setAllocationForm({ ...allocationForm, allocationStatus: v })}
              >
                <SelectTrigger className="rounded-xl text-xs h-10">
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
              <Label className="font-bold">Notes & Conditions</Label>
              <Input
                value={allocationForm.notes}
                onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                placeholder="Survey plan handoff conditions, deed drafting, etc."
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAllocationModal(false)}
              className="rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAllocation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
            >
              Confirm Land Allocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Land Parcel Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action will permanently remove this land parcel and its allocation history from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteParcel(deleteId)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
