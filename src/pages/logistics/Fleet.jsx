import { useState } from 'react';
import {
  Truck, Search, Plus, Edit2, Trash2, X, Car, Wrench,
  CheckCircle2, AlertCircle, ToggleLeft, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MoreVertical, Eye } from 'lucide-react';

const STATUS_COLORS = {
  'Available':      'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  'On Route':       'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  'Maintenance':    'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  'Decommissioned': 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
};

const VEHICLE_TYPES = ['Truck', 'Van', 'Motorcycle', 'Container'];
const FUEL_TYPES = ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG'];
const STATUSES = ['Available', 'On Route', 'Maintenance', 'Decommissioned'];

const EMPTY_FORM = {
  plateNumber: '',
  vehicleType: 'Truck',
  make: '',
  model: '',
  year: '',
  capacity: '',
  currentDriver: '',
  status: 'Available',
  fuelType: 'Diesel',
  lastServiceDate: '',
};

export default function Fleet() {
  const { data: dbRecords = [], isLoading } = useIndustryRecords('vehicle');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const vehicles = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Available',
    ...r.data,
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const openAdd = () => {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (vehicle) => {
    setEditTarget(vehicle);
    setFormData({
      plateNumber: vehicle.plateNumber || '',
      vehicleType: vehicle.vehicleType || 'Truck',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      capacity: vehicle.capacity || '',
      currentDriver: vehicle.currentDriver || '',
      status: vehicle.status || 'Available',
      fuelType: vehicle.fuelType || 'Diesel',
      lastServiceDate: vehicle.lastServiceDate || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!formData.plateNumber.trim() || !formData.make.trim() || !formData.model.trim()) {
      return toast.error('Plate number, make, and model are required.');
    }

    mutateRecord.mutate({
      id: editTarget?.id,
      recordType: 'vehicle',
      payload: { ...formData },
      status: formData.status,
      searchText: `${formData.plateNumber} ${formData.vehicleType} ${formData.make} ${formData.model}`,
    }, {
      onSuccess: () => {
        toast.success(editTarget ? 'Vehicle updated!' : 'Vehicle added!');
        closeModal();
      },
      onError: (err) => toast.error('Failed: ' + err.message),
    });
  };

  const handleUpdateStatus = (vehicle, newStatus) => {
    const { id, status, ...rest } = vehicle;
    mutateRecord.mutate({
      id: vehicle.id,
      recordType: 'vehicle',
      payload: rest,
      status: newStatus,
      searchText: `${vehicle.plateNumber} ${vehicle.vehicleType} ${vehicle.make} ${vehicle.model}`,
    }, {
      onSuccess: () => toast.success(`Vehicle status set to ${newStatus}`),
      onError: (err) => toast.error('Failed: ' + err.message),
    });
  };

  const handleDelete = () => {
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'vehicle' }, {
      onSuccess: () => { toast.success('Vehicle removed!'); setDeleteTargetId(null); },
      onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null); },
    });
  };

  const filtered = vehicles.filter(v =>
    v.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicleType?.toLowerCase().includes(search.toLowerCase()) ||
    v.make?.toLowerCase().includes(search.toLowerCase()) ||
    v.currentDriver?.toLowerCase().includes(search.toLowerCase())
  );

  const total = vehicles.length;
  const available = vehicles.filter(v => v.status === 'Available').length;
  const onRoute = vehicles.filter(v => v.status === 'On Route').length;
  const maintenance = vehicles.filter(v => v.status === 'Maintenance').length;

  const stats = [
    { label: 'Total Vehicles', value: total, icon: Truck, color: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
    { label: 'Available', value: available, icon: CheckCircle2, color: 'bg-green-100 text-green-600', border: 'border-green-200' },
    { label: 'On Route', value: onRoute, icon: Car, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
    { label: 'In Maintenance', value: maintenance, icon: Wrench, color: 'bg-amber-100 text-amber-600', border: 'border-amber-200' },
  ];

  const typeIcons = { Truck: '🚛', Van: '🚐', Motorcycle: '🏍️', Container: '📦' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Fleet Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and manage your vehicle fleet</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`stat-card-premium bg-card rounded-xl border ${s.border} p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/40">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search plate, type, make, driver..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">Loading fleet data...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No vehicles found.</p>
              <p className="text-xs mt-1">Click "Add Vehicle" to register your first vehicle.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  {['Vehicle', 'Make / Model', 'Year', 'Capacity', 'Fuel', 'Last Service', 'Current Driver', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider first:pl-6 last:text-right last:pr-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeIcons[v.vehicleType] || '🚗'}</span>
                        <div>
                          <div className="font-mono font-bold text-blue-600">{v.plateNumber}</div>
                          <div className="text-xs text-muted-foreground">{v.vehicleType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-card-foreground">{v.make} {v.model}</td>
                    <td className="px-5 py-4 text-muted-foreground">{v.year || '—'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{v.capacity ? `${v.capacity} tons` : '—'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{v.fuelType}</td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {v.lastServiceDate || 'N/A'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-card-foreground">
                      {v.currentDriver ? (
                        <Link to="/logistics/drivers" className="text-primary hover:underline">
                          {v.currentDriver}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[v.status] || 'bg-muted text-muted-foreground'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status === 'Available' && (
                          <Button onClick={() => handleUpdateStatus(v, 'On Route')} size="sm"
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1">
                            <Truck className="w-3 h-3" /> Dispatch
                          </Button>
                        )}
                        {v.status === 'On Route' && (
                          <Button onClick={() => handleUpdateStatus(v, 'Available')} size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Return
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewTarget(v)}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(v)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTargetId(v.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                {editTarget ? 'Edit Vehicle' : 'Add Vehicle'}
              </h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Plate Number</label>
                <Input value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                  className="mt-1" placeholder="e.g. GR-1234-24" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Vehicle Type</label>
                <select value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Make</label>
                <Input value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })}
                  className="mt-1" placeholder="e.g. Mercedes-Benz" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Model</label>
                <Input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })}
                  className="mt-1" placeholder="e.g. Actros" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Year</label>
                <Input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })}
                  className="mt-1" placeholder="e.g. 2021" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Capacity (tons)</label>
                <Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                  className="mt-1" placeholder="e.g. 20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Fuel Type</label>
                <select value={formData.fuelType} onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Last Service Date</label>
                <Input type="date" value={formData.lastServiceDate} onChange={e => setFormData({ ...formData, lastServiceDate: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Current Driver</label>
                <Input value={formData.currentDriver} onChange={e => setFormData({ ...formData, currentDriver: e.target.value })}
                  className="mt-1" placeholder="Driver name (optional)" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave} disabled={mutateRecord.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {mutateRecord.isPending ? 'Saving...' : editTarget ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Remove Vehicle"
        message="Are you sure you want to remove this vehicle from the fleet? This action cannot be undone."
      />

      <Sheet open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Vehicle Details</SheetTitle>
          </SheetHeader>
          {viewTarget && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Plate Number</div>
                  <div className="font-mono text-foreground font-bold text-blue-600">{viewTarget.plateNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Vehicle Type</div>
                  <div className="font-medium text-foreground">{viewTarget.vehicleType}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Make</div>
                  <div className="font-medium text-foreground">{viewTarget.make}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Model</div>
                  <div className="font-medium text-foreground">{viewTarget.model}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Year</div>
                  <div className="font-medium text-foreground">{viewTarget.year || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Capacity (tons)</div>
                  <div className="font-medium text-foreground">{viewTarget.capacity ? `${viewTarget.capacity} tons` : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Fuel Type</div>
                  <div className="font-medium text-foreground">{viewTarget.fuelType}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last Service Date</div>
                  <div className="font-medium text-foreground">{viewTarget.lastServiceDate || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current Driver</div>
                  <div className="font-medium text-foreground">
                    {viewTarget.currentDriver ? (
                      <Link to="/logistics/drivers" className="text-primary hover:underline">
                        {viewTarget.currentDriver}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium text-foreground">{viewTarget.status}</div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
