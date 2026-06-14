import { useTranslation} from "react-i18next";
import { useState} from 'react';
import {
 User, Search, Plus, Edit2, Trash2, X, Phone, Mail,
 CheckCircle2, AlertCircle, Clock, ShieldOff, Truck, BadgeCheck
} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Link} from 'react-router-dom';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle} from '@/components/ui/sheet';
import { MoreVertical, Eye, FileSignature} from 'lucide-react';
import { useContracts} from '@/hooks/integrations/useContracts';
import { useCompanyId} from '@/hooks/useCompanyId';

const STATUS_COLORS = {
 'Active': 'bg-slate-100 text-primary/90 dark:bg-primary/30 dark:text-primary/70',
 'On Trip': 'bg-orange-100 text-orange-700 dark:bg-primary/30 dark:text-primary/70',
 'Off Duty': 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
 'Suspended': 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
};

const STATUSES = ['Active', 'On Trip', 'Off Duty', 'Suspended'];

const EMPTY_FORM = {
 driverName: '',
 driverId: '',
 licenseNumber: '',
 licenseExpiry: '',
 phone: '',
 email: '',
 vehicleAssigned: '',
 totalTrips: '0',
 status: 'active',
};

function generateDriverId() {
 return `DRV-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

export default function Drivers() {
 const { t} = useTranslation();
 const { data: dbRecords = [], isLoading} = useIndustryRecords('driver');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();
 const companyId = useCompanyId();
 const { sendForSignature, isSending} = useContracts();

 const drivers = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Active',
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
 setFormData({ ...EMPTY_FORM, driverId: generateDriverId()});
 setShowModal(true);
};

 const openEdit = (driver) => {
 setEditTarget(driver);
 setFormData({
 driverName: driver.driverName || '',
 driverId: driver.driverId || '',
 licenseNumber: driver.licenseNumber || '',
 licenseExpiry: driver.licenseExpiry || '',
 phone: driver.phone || '',
 email: driver.email || '',
 vehicleAssigned: driver.vehicleAssigned || '',
 totalTrips: driver.totalTrips || '0',
 status: driver.status || 'Active',
});
 setShowModal(true);
};

 const closeModal = () => {
 setShowModal(false);
 setEditTarget(null);
 setFormData(EMPTY_FORM);
};

 const handleSave = () => {
 if (!formData.driverName.trim() || !formData.phone.trim()) {
 return toast.error('Driver name and phone are required.');
}

 mutateRecord.mutate({
 id: editTarget?.id,
 recordType: 'driver',
 payload: { ...formData},
 status: formData.status,
 searchText: `${formData.driverName} ${formData.driverId} ${formData.vehicleAssigned}`,
}, {
 onSuccess: () => {
 toast.success(editTarget ? 'Driver updated!' : 'Driver added!');
 closeModal();
},
 onError: (err) => toast.error('Failed: ' + err.message),
});
};

 const handleUpdateStatus = (driver, newStatus) => {
 const { id, status, ...rest} = driver;
 mutateRecord.mutate({
 id: driver.id,
 recordType: 'driver',
 payload: rest,
 status: newStatus,
 searchText: `${driver.driverName} ${driver.driverId} ${driver.vehicleAssigned}`,
}, {
 onSuccess: () => toast.success(`Status set to ${newStatus}`),
 onError: (err) => toast.error('Failed: ' + err.message),
});
};

 const handleDelete = () => {
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'driver'}, {
 onSuccess: () => { toast.success('Driver removed!'); setDeleteTargetId(null);},
 onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null);},
});
};

 const filtered = drivers.filter(d =>
 d.driverName?.toLowerCase().includes(search.toLowerCase()) ||
 d.driverId?.toLowerCase().includes(search.toLowerCase()) ||
 d.vehicleAssigned?.toLowerCase().includes(search.toLowerCase())
 );

 const total = drivers.length;
 const active = drivers.filter(d => d.status === 'Active').length;
 const onTrip = drivers.filter(d => d.status === 'On Trip').length;
 const suspended = drivers.filter(d => d.status === 'Suspended').length;

 const stats = [
 { label: 'Total Drivers', value: total, icon: User, color: 'bg-slate-100 text-primary', border: 'border-primary/20'},
 { label: 'Active', value: active, icon: CheckCircle2, color: 'bg-slate-100 text-primary', border: 'border-primary/20'},
 { label: 'On Trip', value: onTrip, icon: Truck, color: 'bg-slate-100 text-primary', border: 'border-primary/20'},
 { label: 'Suspended', value: suspended, icon: ShieldOff, color: 'bg-red-100 text-red-600', border: 'border-red-200'},
 ];

 const statusIcons = {
 'Active': <CheckCircle2 className="w-3 h-3" />,
 'On Trip': <Truck className="w-3 h-3" />,
 'Off Duty': <Clock className="w-3 h-3" />,
 'Suspended': <ShieldOff className="w-3 h-3" />,
};

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">{t("driver_management", "Driver Management")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t(
 "manage_and_monitor_all_registe",
 "Manage and monitor all registered drivers"
 )}</p>
 </div>
 <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Plus className="w-4 h-4" /> {t("add_driver", "Add Driver")}
 </Button>
 </div>
 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map(s => {
 return (
 <div key={s.label} className={`stat-card-premium bg-card rounded-xl border ${s.border} p-4 flex items-center gap-3`}>
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
 <s.icon className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
 <p className="text-xs text-muted-foreground">{s.label}</p>
 </div>
 </div>
 );
})}
 </div>
 {/* Table */}
 <div className="bg-card rounded-xl border border-border overflow-hidden">
 <div className="p-4 border-b border-border bg-muted/40">
 <div className="relative max-w-sm w-full">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input
 placeholder="Search name, driver ID, vehicle..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="pl-9 bg-card"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 {isLoading ? (
 <div className="py-16 text-center text-muted-foreground">{t("loading_drivers", "Loading drivers...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-16 text-center text-muted-foreground">
 <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">{t("no_drivers_found", "No drivers found.")}</p>
 <p className="text-xs mt-1">{t(
 "click_add_driver_to_register_y",
 "Click \"Add Driver\" to register your first driver."
 )}</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-muted/30 border-b border-border">
 <tr>
 {['Driver', 'License', 'Contact', 'Vehicle Assigned', 'Total Trips', 'Status', 'Actions'].map(h => {
 return (
 <th key={h} className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider first:pl-6 last:text-right last:pr-6">
 {h}
 </th>
 );
})}
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(driver => {
 return (
 <tr key={driver.id} className="hover:bg-muted/30 transition-colors">
 <td className="px-5 py-4 pl-6">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-primary/30 flex items-center justify-center text-primary font-bold text-sm">
 {driver.driverName?.charAt(0)?.toUpperCase() || 'D'}
 </div>
 <div>
 <div className="font-semibold text-card-foreground">{driver.driverName}</div>
 <div className="text-xs text-muted-foreground font-mono">{driver.driverId}</div>
 </div>
 </div>
 </td>
 <td className="px-5 py-4">
 <div className="flex items-center gap-1 text-card-foreground text-xs">
 <BadgeCheck className="w-3.5 h-3.5 text-primary" />
 {driver.licenseNumber || '—'}
 </div>
 <div className="text-xs text-muted-foreground mt-0.5">
 {t("exp", "Exp:")} {driver.licenseExpiry || '—'}
 </div>
 </td>
 <td className="px-5 py-4">
 <div className="flex items-center gap-1 text-xs text-muted-foreground">
 <Phone className="w-3 h-3" /> {driver.phone || '—'}
 </div>
 <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
 <Mail className="w-3 h-3" /> {driver.email || '—'}
 </div>
 </td>
 <td className="px-5 py-4 font-medium text-card-foreground">
 {driver.vehicleAssigned ? (
 <Link to="/logistics/fleet" className="text-primary hover:underline">
 {driver.vehicleAssigned}
 </Link>
 ) : (
 <span className="text-muted-foreground italic">{t("unassigned", "Unassigned")}</span>
 )}
 </td>
 <td className="px-5 py-4 text-center font-bold text-card-foreground">
 {driver.totalTrips || 0}
 </td>
 <td className="px-5 py-4">
 <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[driver.status] || 'bg-muted text-muted-foreground'}`}>
 {statusIcons[driver.status]}
 {driver.status}
 </span>
 </td>
 <td className="px-5 py-4 pr-6">
 <div className="flex items-center justify-end gap-1.5">
 {driver.status === 'Active' && (
 <Button onClick={() => handleUpdateStatus(driver, 'On Trip')} size="sm"
 className="h-7 text-xs bg-primary hover:bg-primary/90 text-white gap-1">
 <Truck className="w-3 h-3" /> {t("dispatch", "Dispatch")}
 </Button>
 )}
 {driver.status === 'On Trip' && (
 <Button onClick={() => handleUpdateStatus(driver, 'Active')} size="sm"
 className="h-7 text-xs bg-primary hover:bg-primary/90 text-white gap-1">
 <CheckCircle2 className="w-3 h-3" /> {t("return", "Return")}
 </Button>
 )}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewTarget(driver)}>
 <Eye className="w-4 h-4 mr-2" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => {
 const signerEmail = prompt("Enter driver's email for contract signature:", driver.email || "");
 if (signerEmail) {
 sendForSignature({ companyId, provider: 'docusign', documentName: `Driver_Agreement_${driver.driverName}`, signerEmail, signerName: driver.driverName});
}
}}>
 <FileSignature className="w-4 h-4 mr-2" /> {t("send_contract", "Send Contract")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(driver)}>
 <Edit2 className="w-4 h-4 mr-2" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(driver.id)} className="text-red-600">
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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-5 border border-border max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
 <User className="w-5 h-5 text-primary" />
 {editTarget ? 'Edit Driver' : 'Add Driver'}
 </h2>
 <button onClick={closeModal} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("driver_name", "Driver Name")}</label>
 <Input value={formData.driverName} onChange={e => setFormData({ ...formData, driverName: e.target.value})}
 className="mt-1" placeholder="Full name" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("driver_id", "Driver ID")}</label>
 <Input value={formData.driverId} onChange={e => setFormData({ ...formData, driverId: e.target.value})}
 className="mt-1" placeholder="DRV-XXXX" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("license_number", "License Number")}</label>
 <Input value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value})}
 className="mt-1" placeholder="e.g. GH-0123456" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("license_expiry", "License Expiry")}</label>
 <Input type="date" value={formData.licenseExpiry} onChange={e => setFormData({ ...formData, licenseExpiry: e.target.value})}
 className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("phone", "Phone")}</label>
 <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value})}
 className="mt-1" placeholder="+233 XX XXX XXXX" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("email", "Email")}</label>
 <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value})}
 className="mt-1" placeholder="driver@email.com" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("vehicle_assigned", "Vehicle Assigned")}</label>
 <Input value={formData.vehicleAssigned} onChange={e => setFormData({ ...formData, vehicleAssigned: e.target.value})}
 className="mt-1" placeholder="Plate # or vehicle name" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("total_trips", "Total Trips")}</label>
 <Input type="number" value={formData.totalTrips} onChange={e => setFormData({ ...formData, totalTrips: e.target.value})}
 className="mt-1" placeholder="0" />
 </div>
 <div className="col-span-2">
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("status", "Status")}</label>
 <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary">
 {STATUSES.map(s => {
 return <option key={s}>{s}</option>;
})}
 </select>
 </div>
 </div>

 <div className="flex gap-3 pt-1">
 <Button variant="outline" className="flex-1" onClick={closeModal}>{t("cancel", "Cancel")}</Button>
 <Button onClick={handleSave} disabled={mutateRecord.isPending}
 className="flex-1 bg-primary hover:bg-primary/90 text-white">
 {mutateRecord.isPending ? 'Saving...' : editTarget ? 'Update Driver' : 'Add Driver'}
 </Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDelete}
 title="Remove Driver"
 message="Are you sure you want to remove this driver? This action cannot be undone."
 />
 <Sheet open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("driver_details", "Driver Details")}</SheetTitle>
 </SheetHeader>
 {viewTarget && (
 <div className="mt-6 space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <div className="text-xs text-muted-foreground">{t("driver_name", "Driver Name")}</div>
 <div className="font-medium text-foreground">{viewTarget.driverName}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("driver_id", "Driver ID")}</div>
 <div className="font-mono text-foreground">{viewTarget.driverId}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("license_number", "License Number")}</div>
 <div className="font-medium text-foreground">{viewTarget.licenseNumber || '—'}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("license_expiry", "License Expiry")}</div>
 <div className="font-medium text-foreground">{viewTarget.licenseExpiry || '—'}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("phone", "Phone")}</div>
 <div className="font-medium text-foreground">{viewTarget.phone || '—'}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("email", "Email")}</div>
 <div className="font-medium text-foreground">{viewTarget.email || '—'}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("vehicle_assigned", "Vehicle Assigned")}</div>
 <div className="font-medium text-foreground">
 {viewTarget.vehicleAssigned ? (
 <Link to="/logistics/fleet" className="text-primary hover:underline">
 {viewTarget.vehicleAssigned}
 </Link>
 ) : (
 '—'
 )}
 </div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("total_trips", "Total Trips")}</div>
 <div className="font-medium text-foreground">{viewTarget.totalTrips || '0'}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("status", "Status")}</div>
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
