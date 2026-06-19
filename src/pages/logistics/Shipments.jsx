import { useTranslation} from "react-i18next";
import { useState} from 'react';
import {
 PackageOpen, Search, Plus, MapPin, Truck, CheckCircle2, Clock,
 Trash2, AlertCircle, Edit2, X, Package, ArrowRight
} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Link} from 'react-router-dom';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle} from '@/components/ui/sheet';
import { MoreVertical, Eye} from 'lucide-react';
import { useNotifications} from "@/hooks/integrations/useNotifications";
import { useCompanyId} from "@/hooks/useCompanyId";
import { MessageSquare, Bell} from "lucide-react";

const STATUS_COLORS = {
 'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
 'In Transit': 'bg-orange-100 text-orange-700 dark:bg-primary/30 dark:text-primary/70',
 'Delivered': 'bg-slate-100 text-primary/90 dark:bg-primary/30 dark:text-primary/70',
 'Failed': 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'};

const CARRIERS = ['DHL', 'FedEx', 'UPS', 'USPS', 'Local Courier', 'In-House'];
const STATUSES = ['Pending', 'In Transit', 'Delivered', 'Failed'];

const EMPTY_FORM = {
 trackingNumber: '',
 origin: '',
 destination: '',
 carrier: 'DHL',
 weight: '',
 estimatedDelivery: '',
 customer: '',
 notes: '',
 status: 'Pending'};

function generateTrackingNumber() {
 return `SHIP-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

export default function Shipments() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { notifyTeam} = useNotifications();
 const { data: dbRecords = [], isLoading} = useIndustryRecords('shipment');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const shipments = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Pending',
 ...r.data}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [editTarget, setEditTarget] = useState(null);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [viewTarget, setViewTarget] = useState(null);
 const [formData, setFormData] = useState(EMPTY_FORM);

 const openAdd = () => {
 setEditTarget(null);
 setFormData({ ...EMPTY_FORM, trackingNumber: generateTrackingNumber()});
 setShowModal(true);
};

 const openEdit = (ship) => {
 setEditTarget(ship);
 setFormData({
 trackingNumber: ship.trackingNumber || '',
 origin: ship.origin || '',
 destination: ship.destination || '',
 carrier: ship.carrier || 'DHL',
 weight: ship.weight || '',
 estimatedDelivery: ship.estimatedDelivery || '',
 customer: ship.customer || '',
 notes: ship.notes || '',
 status: ship.status || 'Pending'});
 setShowModal(true);
};

 const closeModal = () => {
 setShowModal(false);
 setEditTarget(null);
 setFormData(EMPTY_FORM);
};

 const handleSave = () => {
 if (!formData.origin.trim() || !formData.destination.trim() || !formData.customer.trim()) {
 return toast.error('Origin, destination, and customer are required.');
}

 const payload = { ...formData};

 mutateRecord.mutate({
 id: editTarget?.id,
 recordType: 'shipment',
 payload,
 status: formData.status,
 searchText: `${formData.trackingNumber} ${formData.destination} ${formData.customer}`}, {
 onSuccess: () => {
 toast.success(editTarget ? 'Shipment updated!' : 'Shipment created!');
 closeModal();
},
 onError: (err) => toast.error('Failed: ' + err.message)});
};

 const handleUpdateStatus = (ship, newStatus) => {
 const { id, status, ...rest} = ship;
 mutateRecord.mutate({
 id: ship.id,
 recordType: 'shipment',
 payload: rest,
 status: newStatus,
 searchText: `${ship.trackingNumber} ${ship.destination} ${ship.customer}`}, {
 onSuccess: () => toast.success(`Status updated to ${newStatus}`),
 onError: (err) => toast.error('Failed: ' + err.message)});
};

 const handleDelete = () => {
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'shipment'}, {
 onSuccess: () => { toast.success('Shipment deleted!'); setDeleteTargetId(null);},
 onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null);}});
};

 const filtered = shipments.filter(s =>
 s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
 s.destination?.toLowerCase().includes(search.toLowerCase()) ||
 s.customer?.toLowerCase().includes(search.toLowerCase())
 );

 const total = shipments.length;
 const inTransit = shipments.filter(s => s.status === 'In Transit').length;
 const delivered = shipments.filter(s => s.status === 'Delivered').length;
 const pending = shipments.filter(s => s.status === 'Pending').length;

 const stats = [
 { label: 'Total Shipments', value: total, icon: Package, color: 'bg-orange-100 text-orange-600', border: 'border-orange-200'},
 { label: 'In Transit', value: inTransit, icon: Truck, color: 'bg-slate-100 text-primary', border: 'border-primary/20'},
 { label: 'Delivered', value: delivered, icon: CheckCircle2, color: 'bg-slate-100 text-primary', border: 'border-primary/20'},
 { label: 'Pending', value: pending, icon: Clock, color: 'bg-amber-100 text-amber-600', border: 'border-amber-200'},
 ];

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("shipment_tracking", "Shipment Tracking")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_and_track_all_cargo_shi", "Manage and track all cargo shipments")}</p>
 </div>
 <Button onClick={openAdd} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
 <Plus className="w-4 h-4" /> {t("add_shipment", "Add Shipment")}
 </Button>
 </div>
 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map(s => {
 return (
 <div key={s.label} className={`stat-card-premium bg-card rounded-xl border ${s.border} p-4 flex items-center gap-3`}>
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
 <s.icon className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{s.value}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{s.label}</p>
 </div>
 </div>
 );
})}
 </div>
 {/* Table */}
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/40 flex items-center justify-between gap-4">
 <div className="relative max-w-sm w-full">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input
 placeholder="Search tracking #, destination, customer..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 {isLoading ? (
 <div className="py-16 text-center text-[#71717a] dark:text-gray-400">{t("loading_shipments", "Loading shipments...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-16 text-center text-[#71717a] dark:text-gray-400">
 <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">{t("no_shipments_found", "No shipments found.")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t("click_add_shipment_to_get_star", "Click \"Add Shipment\" to get started.")}</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-muted/30 border-b border-primary/40">
 <tr>
 {['Tracking #', 'Route', 'Customer', 'Carrier / Weight', 'Est. Delivery', 'Status', 'Actions'].map(h => {
 return (
 <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider first:pl-6 last:text-right last:pr-6 tracking-[0.04em]">
 {h}
 </th>
 );
})}
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(ship => {
 return (
 <tr key={ship.id} className="hover:bg-muted/30 transition-colors">
 <td className="px-5 py-4 pl-6">
 <span className="font-mono font-semibold text-orange-600">{ship.trackingNumber}</span>
 </td>
 <td className="px-5 py-4">
 <div className="flex items-center gap-2.5 text-card-foreground font-medium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <MapPin className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400 shrink-0" />
 <span className="truncate max-w-[80px]">{ship.origin}</span>
 <ArrowRight className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400 shrink-0" />
 <span className="truncate max-w-[80px]">{ship.destination}</span>
 </div>
 </td>
 <td className="px-5 py-4 font-medium text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Link to="/clients" className="text-primary hover:underline">
 {ship.customer}
 </Link>
 </td>
 <td className="px-5 py-4 text-[#71717a] dark:text-gray-400">
 <div className="text-xs tracking-[0.04em]">{ship.carrier}</div>
 <div className="text-xs font-medium tracking-[0.04em]">{ship.weight ? `${ship.weight} kg` : '—'}</div>
 </td>
 <td className="px-5 py-4 text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">
 {ship.estimatedDelivery || '—'}
 </td>
 <td className="px-5 py-4">
 <div className="flex flex-col gap-2 w-32">
 <div className="flex items-center justify-between relative z-0">
 <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -z-10 translate-y-[-50%]"></div>
 <div className={`absolute top-1/2 left-0 h-0.5 -z-10 translate-y-[-50%] transition-all ${ship.status === 'Pending' ? 'w-0' : ship.status === 'In Transit' ? 'w-1/2 bg-blue-500/10' : ship.status === 'Delivered' ? 'w-full bg-emerald-500/10' : 'w-full bg-red-500/10'}`}></div>
 <div className={`w-3 h-3 rounded-full border-2 ${ship.status === 'Pending' ? 'border-amber-500 bg-amber-500' : ship.status === 'Failed' ? 'border-red-500 bg-red-500/10' : 'border-primary bg-primary'}`}></div>
 <div className={`w-3 h-3 rounded-full border-2 ${ship.status === 'Pending' ? 'border-muted bg-background' : ship.status === 'In Transit' ? 'border-blue-500 bg-background' : ship.status === 'Delivered' ? 'border-primary bg-primary' : 'border-red-500 bg-red-500/10'}`}></div>
 <div className={`w-3 h-3 rounded-full border-2 ${ship.status === 'Delivered' ? 'border-emerald-500 bg-emerald-500/10' : ship.status === 'Failed' ? 'border-red-500 bg-red-500/10' : 'border-muted bg-background'}`}></div>
 </div>
 <div className="flex justify-between text-[9px] font-semibold uppercase text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">
 <span className={ship.status === 'Pending' ? 'text-amber-600' : ''}>Pend</span>
 <span className={ship.status === 'In Transit' ? 'text-blue-600' : ''}>Transit</span>
 <span className={ship.status === 'Delivered' ? 'text-emerald-600' : ship.status === 'Failed' ? 'text-red-600' : ''}>{ship.status === 'Failed' ? 'Fail' : 'Deliv'}</span>
 </div>
 {ship.status === 'In Transit' && ship.estimatedDelivery && new Date(ship.estimatedDelivery) < new Date(new Date().setHours(0,0,0,0)) && (
 <span className="text-[9px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-2 w-fit mt-1">
 <AlertCircle className="w-3 h-3"/> SLA Delayed
 </span>
 )}
 </div>
 </td>
 <td className="px-5 py-4 pr-6">
 <div className="flex items-center justify-end gap-2.5">
 {ship.status === 'Pending' && (
 <Button onClick={() => handleUpdateStatus(ship, 'In Transit')} size="sm"
 className="h-7 text-xs bg-primary hover:bg-primary/90 text-white gap-2 tracking-[0.04em]">
 <Truck className="w-3 h-3" /> {t("dispatch", "Dispatch")}
 </Button>
 )}
 {ship.status === 'In Transit' && (
 <Button onClick={() => handleUpdateStatus(ship, 'Delivered')} size="sm"
 className="h-7 text-xs bg-primary hover:bg-primary/90 text-white gap-2 tracking-[0.04em]">
 <CheckCircle2 className="w-3 h-3" /> {t("deliver", "Deliver")}
 </Button>
 )}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewTarget(ship)}>
 <Eye className="w-4 h-4 mr-2" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(ship)}>
 <Edit2 className="w-4 h-4 mr-2" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(ship.id)} className="text-red-600">
 <Trash2 className="w-4 h-4 mr-2" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 )}
 </div>
 </div>
 {/* Add/Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Package className="w-5 h-5 text-orange-600" />
 {editTarget ? 'Edit Shipment' : 'Add Shipment'}
 </h2>
 <button onClick={closeModal} className="text-[#71717a] dark:text-gray-400 hover:text-foreground p-1 rounded-full hover:bg-muted">
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("tracking_number", "Tracking Number")}</label>
 <Input value={formData.trackingNumber} onChange={e => setFormData({ ...formData, trackingNumber: e.target.value})}
 className="mt-1" placeholder="SHIP-XXXX" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("customer", "Customer")}</label>
 <Input value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value})}
 className="mt-1" placeholder="Customer name" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("origin", "Origin")}</label>
 <Input value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value})}
 className="mt-1" placeholder="e.g. Lagos Port" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("destination", "Destination")}</label>
 <Input value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value})}
 className="mt-1" placeholder="e.g. Accra Hub" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("carrier", "Carrier")}</label>
 <select value={formData.carrier} onChange={e => setFormData({ ...formData, carrier: e.target.value})}
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {CARRIERS.map(c => {
 return <option key={c}>{c}</option>;
})}
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("weight_kg", "Weight (kg)")}</label>
 <Input type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value})}
 className="mt-1" placeholder="e.g. 25.5" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("est_delivery_date", "Est. Delivery Date")}</label>
 <Input type="date" value={formData.estimatedDelivery} onChange={e => setFormData({ ...formData, estimatedDelivery: e.target.value})}
 className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</label>
 <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value})}
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {STATUSES.map(s => {
 return <option key={s}>{s}</option>;
})}
 </select>
 </div>
 <div className="col-span-2">
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("notes", "Notes")}</label>
 <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value})}
 rows={2} placeholder="Optional notes..."
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>

 <div className="flex gap-3 pt-1">
 <Button variant="outline" className="flex-1" onClick={closeModal}>{t("cancel", "Cancel")}</Button>
 <Button onClick={handleSave} disabled={mutateRecord.isPending}
 className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
 {mutateRecord.isPending ? 'Saving...' : editTarget ? 'Update Shipment' : 'Create Shipment'}
 </Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDelete}
 title="Delete Shipment"
 message="Are you sure you want to delete this shipment? This action cannot be undone."
 />
 <Sheet open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("shipment_details", "Shipment Details")}</SheetTitle>
 </SheetHeader>
 {viewTarget && (
 <div className="mt-6 space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("tracking_number", "Tracking Number")}</div>
 <div className="font-mono text-foreground font-semibold text-orange-600">{viewTarget.trackingNumber}</div>
 </div>
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("customer", "Customer")}</div>
 <div className="font-medium text-foreground">
 <Link to="/clients" className="text-primary hover:underline">
 {viewTarget.customer}
 </Link>
 </div>
 </div>
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("origin", "Origin")}</div>
 <div className="font-medium text-foreground">{viewTarget.origin}</div>
 </div>
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("destination", "Destination")}</div>
 <div className="font-medium text-foreground">{viewTarget.destination}</div>
 </div>
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("carrier", "Carrier")}</div>
 <div className="font-medium text-foreground">{viewTarget.carrier}</div>
 </div>
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("weight_kg", "Weight (kg)")}</div>
 <div className="font-medium text-foreground">{viewTarget.weight || '—'}</div>
 </div>
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("estimated_delivery", "Estimated Delivery")}</div>
 <div className="font-medium text-foreground">{viewTarget.estimatedDelivery || '—'}</div>
 </div>
 <div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("status", "Status")}</div>
 <div className="font-medium text-foreground">{viewTarget.status}</div>
 </div>
 <div className="col-span-2">
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("notes", "Notes")}</div>
 <div className="font-medium text-foreground whitespace-pre-wrap">{viewTarget.notes || '—'}</div>
 </div>
 </div>
 </div>
 )}
 </SheetContent>
 </Sheet>
 </div>
 );
}
