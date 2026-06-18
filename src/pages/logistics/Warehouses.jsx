import { useTranslation} from "react-i18next";
import { useState} from 'react';
import {
 Warehouse, Search, Plus, Edit2, Trash2, X,
 MapPin, Phone, User, BarChart3, Package, CheckCircle2, XCircle, Tag
} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast } from '@/components/ui/use-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Link} from 'react-router-dom';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle} from '@/components/ui/sheet';
import { MoreVertical, Eye} from 'lucide-react';

const STATUS_COLORS = {
 'Active': 'bg-slate-100 text-primary/90 dark:bg-primary/30 dark:text-primary/70',
 'Inactive': 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
};

const EMPTY_FORM = {
 warehouseName: '',
 code: '',
 location: '',
 capacity: '',
 usedCapacity: '',
 manager: '',
 phone: '',
 categories: '',
 status: 'active',
};

function generateCode() {
 return `WH-${String(Math.floor(10 + Math.random() * 90))}`;
}

function getCapacityColor(pct) {
 if (pct >= 90) return 'bg-red-500';
 if (pct >= 70) return 'bg-amber-500';
 return 'bg-primary';
}

function getCapacityLabelColor(pct) {
 if (pct >= 90) return 'text-red-600';
 if (pct >= 70) return 'text-amber-600';
 return 'text-primary';
}

export default function Warehouses() {
 const { t} = useTranslation();
 const { data: dbRecords = [], isLoading} = useIndustryRecords('warehouse');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const warehouses = dbRecords.map(r => ({
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
 setFormData({ ...EMPTY_FORM, code: generateCode()});
 setShowModal(true);
};

 const openEdit = (wh) => {
 setEditTarget(wh);
 setFormData({
 warehouseName: wh.warehouseName || '',
 code: wh.code || '',
 location: wh.location || '',
 capacity: wh.capacity || '',
 usedCapacity: wh.usedCapacity || '',
 manager: wh.manager || '',
 phone: wh.phone || '',
 categories: wh.categories || '',
 status: wh.status || 'Active',
});
 setShowModal(true);
};

 const closeModal = () => {
 setShowModal(false);
 setEditTarget(null);
 setFormData(EMPTY_FORM);
};

 const handleSave = () => {
    if (!formData.warehouseName.trim() || !formData.location.trim()) {
      return toast({ title: "Error", description: "Warehouse name and location are required.", variant: "destructive" });
    }
    if (formData.capacity && formData.usedCapacity && Number(formData.usedCapacity) > Number(formData.capacity)) {
      return toast({ title: "Error", description: "Used capacity cannot exceed total capacity.", variant: "destructive" });
    }

 mutateRecord.mutate({
 id: editTarget?.id,
 recordType: 'warehouse',
 payload: { ...formData},
 status: formData.status,
 searchText: `${formData.warehouseName} ${formData.code} ${formData.location}`,
}, {
 onSuccess: () => {
      toast({ title: "Success", description: editTarget ? 'Warehouse updated!' : 'Warehouse added!', variant: "default" });
      closeModal();
},
 onError: (err) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
});
};

 const handleDelete = () => {
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'warehouse' }, {
      onSuccess: () => { toast({ title: "Success", description: "Warehouse removed!", variant: "default" }); setDeleteTargetId(null); },
      onError: (err) => { toast({ title: "Failed", description: err.message, variant: "destructive" }); setDeleteTargetId(null); },
    });
};

 const filtered = warehouses.filter(w =>
 w.warehouseName?.toLowerCase().includes(search.toLowerCase()) ||
 w.code?.toLowerCase().includes(search.toLowerCase()) ||
 w.location?.toLowerCase().includes(search.toLowerCase())
 );

 const total = warehouses.length;
 const activeCount = warehouses.filter(w => w.status === 'Active').length;
 const totalCap = warehouses.reduce((sum, w) => sum + (Number(w.capacity) || 0), 0);
 const usedCap = warehouses.reduce((sum, w) => sum + (Number(w.usedCapacity) || 0), 0);
 const usedPct = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;

 const stats = [
 { label: 'Total Warehouses', value: total, icon: Warehouse, color: 'bg-slate-100 text-primary', border: 'border-primary/20'},
 { label: 'Total Capacity', value: `${totalCap.toLocaleString()} units`, icon: Package, color: 'bg-slate-100 text-primary', border: 'border-primary/20'},
 { label: 'Used Capacity', value: `${usedPct}%`, icon: BarChart3, color: usedPct >= 90 ? 'bg-red-100 text-red-600' : usedPct >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-primary', border: usedPct >= 90 ? 'border-red-200' : usedPct >= 70 ? 'border-amber-200' : 'border-primary/20'},
 { label: 'Active', value: activeCount, icon: CheckCircle2, color: 'bg-slate-100 text-primary', border: 'border-primary/20'},
 ];

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">{t("warehouse_management", "Warehouse Management")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t(
 "monitor_capacity_and_manage_wa",
 "Monitor capacity and manage warehouse locations"
 )}</p>
 </div>
 <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Plus className="w-4 h-4" /> {t("add_warehouse", "Add Warehouse")}
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
 <p className="text-xl font-bold text-card-foreground leading-tight">{s.value}</p>
 <p className="text-xs text-muted-foreground">{s.label}</p>
 </div>
 </div>
 );
})}
 </div>
 {/* Search */}
 <div className="relative max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input
 placeholder="Search name, code, location..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="pl-9 bg-card"
 />
 </div>
 {/* Cards Grid */}
 {isLoading ? (
 <div className="py-16 text-center text-muted-foreground">{t("loading_warehouses", "Loading warehouses...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-16 text-center text-muted-foreground bg-card rounded-xl border border-primary/40">
 <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">{t("no_warehouses_found", "No warehouses found.")}</p>
 <p className="text-xs mt-1">{t(
 "click_add_warehouse_to_registe",
 "Click \"Add Warehouse\" to register your first warehouse."
 )}</p>
 <Button onClick={openAdd} className="mt-4 gap-2 bg-primary hover:bg-primary/90 text-white" size="sm">
 <Plus className="w-3.5 h-3.5" /> {t("add_warehouse", "Add Warehouse")}
 </Button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {filtered.map(wh => {
 const cap = Number(wh.capacity) || 0;
 const used = Number(wh.usedCapacity) || 0;
 const pct = cap > 0 ? Math.min(Math.round((used / cap) * 100), 100) : 0;
 const cats = wh.categories ? wh.categories.split(',').map(c => c.trim()).filter(Boolean) : [];

 return (
 <div key={wh.id} className="bg-card rounded-xl border border-primary/40 transition- p-5 space-y-4">
 {/* Card Header */}
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/30 flex items-center justify-center text-primary">
 <Warehouse className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-card-foreground text-sm leading-tight">{wh.warehouseName}</h3>
 <span className="font-mono text-xs text-primary font-semibold">{wh.code}</span>
 </div>
 </div>
 <div className="flex items-center gap-1.5">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[wh.status] || 'bg-muted'}`}>
 {wh.status}
 </span>
 </div>
 </div>
 {/* Capacity Progress */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">{t("capacity_used", "Capacity Used")}</span>
 <span className={`font-bold ${getCapacityLabelColor(pct)}`}>{pct}%</span>
 </div>
 <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-500 ${getCapacityColor(pct)}`}
 style={{ width: `${pct}%`}}
 />
 </div>
 <div className="flex justify-between text-xs text-muted-foreground">
 <span>{used.toLocaleString()} {t("used", "used")}</span>
 <span>{cap.toLocaleString()} {t("total", "total")}</span>
 </div>
 </div>
 {/* Info Grid */}
 <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
 <div className="flex items-center gap-1.5">
 <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
 <span className="truncate">{wh.location || '—'}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <User className="w-3.5 h-3.5 shrink-0 text-primary" />
 <span>
 {wh.manager ? (
 <Link to="/team" className="text-primary hover:underline">
 {wh.manager}
 </Link>
 ) : (
 'No manager assigned'
 )}
 </span>
 </div>
 <div className="flex items-center gap-1.5">
 <Phone className="w-3.5 h-3.5 shrink-0 text-primary" />
 <span>{wh.phone || '—'}</span>
 </div>
 </div>
 {/* Categories */}
 {cats.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {cats.map(cat => {
 return (
 <span key={cat} className="inline-flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 text-primary/90 dark:text-primary/70 px-2 py-0.5 rounded-full font-medium border border-primary/20 dark:border-primary/80">
 <Tag className="w-2.5 h-2.5" /> {cat}
 </span>
 );
})}
 </div>
 )}
 {/* Actions */}
 <div className="flex justify-end pt-1 border-t border-primary/40 mt-auto">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewTarget(wh)}>
 <Eye className="w-4 h-4 mr-2" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(wh)}>
 <Edit2 className="w-4 h-4 mr-2" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(wh.id)} className="text-red-600">
 <Trash2 className="w-4 h-4 mr-2" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 );
})}
 </div>
 )}
 {/* Add/Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-5 border border-primary/40 max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
 <Warehouse className="w-5 h-5 text-primary" />
 {editTarget ? 'Edit Warehouse' : 'Add Warehouse'}
 </h2>
 <button onClick={closeModal} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("warehouse_name", "Warehouse Name")}</label>
 <Input value={formData.warehouseName} onChange={e => setFormData({ ...formData, warehouseName: e.target.value})}
 className="mt-1" placeholder="e.g. Central Hub A" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("code", "Code")}</label>
 <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value})}
 className="mt-1" placeholder="WH-XX" />
 </div>
 <div className="col-span-2">
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("location_address", "Location / Address")}</label>
 <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value})}
 className="mt-1" placeholder="e.g. Tema Industrial Area, Ghana" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("total_capacity_units", "Total Capacity (units)")}</label>
 <Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value})}
 className="mt-1" placeholder="e.g. 5000" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("used_capacity_units", "Used Capacity (units)")}</label>
 <Input type="number" value={formData.usedCapacity} onChange={e => setFormData({ ...formData, usedCapacity: e.target.value})}
 className="mt-1" placeholder="e.g. 2400" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("manager", "Manager")}</label>
 <Input value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value})}
 className="mt-1" placeholder="Manager name" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("phone", "Phone")}</label>
 <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value})}
 className="mt-1" placeholder="+233 XX XXX XXXX" />
 </div>
 <div className="col-span-2">
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("categories", "Categories")}</label>
 <Input value={formData.categories} onChange={e => setFormData({ ...formData, categories: e.target.value})}
 className="mt-1" placeholder="e.g. Electronics, Furniture, Perishables" />
 <p className="text-xs text-muted-foreground mt-1">{t(
 "separate_multiple_categories_w",
 "Separate multiple categories with commas."
 )}</p>
 </div>
 <div className="col-span-2">
 <label className="text-xs font-semibold text-muted-foreground uppercase">{t("status", "Status")}</label>
 <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value})}
 className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary">
 <option>{t("active", "Active")}</option>
 <option>{t("inactive", "Inactive")}</option>
 </select>
 </div>
 </div>

 <div className="flex gap-3 pt-1">
 <Button variant="outline" className="flex-1" onClick={closeModal}>{t("cancel", "Cancel")}</Button>
 <Button onClick={handleSave} disabled={mutateRecord.isPending}
 className="flex-1 bg-primary hover:bg-primary/90 text-white">
 {mutateRecord.isPending ? 'Saving...' : editTarget ? 'Update Warehouse' : 'Add Warehouse'}
 </Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDelete}
 title="Remove Warehouse"
 message="Are you sure you want to remove this warehouse? All associated data will be lost. This action cannot be undone."
 />
 <Sheet open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("warehouse_details", "Warehouse Details")}</SheetTitle>
 </SheetHeader>
 {viewTarget && (
 <div className="mt-6 space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <div className="text-xs text-muted-foreground">{t("warehouse_name", "Warehouse Name")}</div>
 <div className="font-medium text-foreground">{viewTarget.warehouseName}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("code", "Code")}</div>
 <div className="font-mono text-primary font-semibold">{viewTarget.code}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("status", "Status")}</div>
 <div className="font-medium text-foreground">{viewTarget.status}</div>
 </div>
 <div className="col-span-2">
 <div className="text-xs text-muted-foreground">{t("location", "Location")}</div>
 <div className="font-medium text-foreground">{viewTarget.location || '—'}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("capacity_units", "Capacity (units)")}</div>
 <div className="font-medium text-foreground">{viewTarget.capacity || '—'}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("used_capacity", "Used Capacity")}</div>
 <div className="font-medium text-foreground">{viewTarget.usedCapacity || '0'}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("manager", "Manager")}</div>
 <div className="font-medium text-foreground">
 {viewTarget.manager ? (
 <Link to="/team" className="text-primary hover:underline">
 {viewTarget.manager}
 </Link>
 ) : (
 '—'
 )}
 </div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("phone", "Phone")}</div>
 <div className="font-medium text-foreground">{viewTarget.phone || '—'}</div>
 </div>
 <div className="col-span-2">
 <div className="text-xs text-muted-foreground">{t("categories", "Categories")}</div>
 <div className="font-medium text-foreground">{viewTarget.categories || '—'}</div>
 </div>
 </div>
 </div>
 )}
 </SheetContent>
 </Sheet>
 </div>
 );
}
