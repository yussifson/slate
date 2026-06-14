import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Bed, Search, Plus, Trash2} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Link} from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { MoreVertical, FileText, Edit, Activity} from 'lucide-react';

export default function Rooms() {
 const { t} = useTranslation();
 // Supabase Real-time Sync Hooks
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('room');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 // Map database records
 const rooms = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editTargetId, setEditTargetId] = useState(null);
 const [viewDetailsId, setViewDetailsId] = useState(null);

 // Form State
 const [formData, setFormData] = useState({
 roomNumber: '',
 type: 'Standard',
 rate: 150,
 floor: '1st Floor',
 amenities: 'Wifi, Tv'
});

 const handleEdit = (room) => {
 setEditTargetId(room.id);
 setFormData({
 roomNumber: room.roomNumber,
 type: room.type,
 rate: room.rate,
 floor: room.floor,
 amenities: room.amenities ? room.amenities.join(', ') : ''
});
 setShowModal(true);
};

 // Generic Save Handler for real DB persistence
 const handleSaveToDb = () => {
 if (!formData.roomNumber.trim()) return toast.error("Please enter room number");

 const payload = {
 roomNumber: formData.roomNumber,
 type: formData.type,
 rate: parseFloat(formData.rate) || 150,
 floor: formData.floor,
 amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean)
};

 mutateRecord.mutate({
 id: editTargetId || undefined,
 recordType: 'room',
 payload,
 status: 'Available',
 searchText: `${formData.roomNumber} ${formData.type}`
}, {
 onSuccess: () => {
 toast.success('Room configured successfully!');
 setShowModal(false);
 setEditTargetId(null);
 setFormData({
 roomNumber: '',
 type: 'Standard',
 rate: 150,
 floor: '1st Floor',
 amenities: 'Wifi, Tv'
});
},
 onError: (err) => {
 toast.error('Failed to configure room: ' + err.message);
}
});
};

 // Generic Delete Handler for real DB persistence
 const handleDeleteFromDb = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'room'}, {
 onSuccess: () => {
 toast.success('Room deleted successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to delete room: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const filtered = rooms.filter(room =>
 room.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
 room.type?.toLowerCase().includes(search.toLowerCase())
 );

 if (isDbLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t("loading_room_data", "Loading room data...")}</div>;

 return (
 <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(68,49,153,0.08) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">{t("room_management", "Room Management")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t(
 "configure_rooms_pricing_and_am",
 "Configure rooms, pricing, and amenities"
 )}</p>
 </div>
 <Button onClick={() => { setEditTargetId(null); setShowModal(true); setFormData({ roomNumber: '', type: 'Standard', rate: 150, floor: '1st Floor', amenities: 'Wifi, Tv'});}} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Plus className="w-4 h-4" /> {t("add_room", "Add Room")}
 </Button>
 </div>
 <div className="bg-card rounded-xl border border-primary/40 overflow-hidden">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search room number or type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("room_number", "Room Number")}</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("type_floor", "Type & Floor")}</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("rate_night", "Rate/Night")}</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("amenities", "Amenities")}</th>
 <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(room => {
 return (
 <tr key={room.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-bold text-card-foreground text-lg flex items-center gap-2">
 <Bed className={`w-5 h-5 ${room.status === 'Maintenance' ? 'text-red-500' : 'text-primary'}`}/> 
 {room.roomNumber}
 </td>
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground">{room.type}</p>
 <p className="text-xs text-muted-foreground">{room.floor}</p>
 </td>
 <td className="px-6 py-4 font-bold text-card-foreground">${room.rate}</td>
 <td className="px-6 py-4">
 {room.status === 'Maintenance' ? (
 <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider animate-pulse">
 <Activity className="w-3 h-3 mr-1" /> {t("maintenance_alert", "Maintenance Alert")}
 </span>
 ) : (
 <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${room.status === 'Available' ? 'bg-slate-100 text-primary/90' : 'bg-slate-100 text-primary/90'}`}>
 {room.status}
 </span>
 )}
 </td>
 <td className="px-6 py-4">
 <div className="flex gap-1.5 flex-wrap">
 {room.amenities?.map(a => {
 return (<span key={a} className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-[10px] font-bold uppercase">{a}</span>);
})}
 </div>
 </td>
 <td className="px-6 py-4 text-right flex justify-end gap-2">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 <MoreVertical className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewDetailsId(room.id)}>
 <FileText className="w-4 h-4 mr-2" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleEdit(room)}>
 <Edit className="w-4 h-4 mr-2" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => {
 mutateRecord.mutate({ id: room.id, recordType: 'room', payload: room, status: room.status === 'Maintenance' ? 'Available' : 'Maintenance'})
}}>
 <Activity className="w-4 h-4 mr-2" /> {t("toggle_maintenance", "Toggle Maintenance")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(room.id)} className="text-red-600">
 <Trash2 className="w-4 h-4 mr-2" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 {filtered.length === 0 && (
 <div className="text-center py-12 text-muted-foreground">
 <Bed className="w-10 h-10 mx-auto mb-3 opacity-30" />
 <p>{t(
 "no_rooms_configured_click_add_",
 "No rooms configured. Click \"Add Room\" to populate list."
 )}</p>
 </div>
 )}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4">
 <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
 {editTargetId ? <Edit className="w-5 h-5 text-primary"/> : <Plus className="w-5 h-5 text-primary"/>}
 {editTargetId ? 'Edit Room Configuration' : 'Configure New Room'}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("room_number", "Room Number")}</label>
 <Input value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value})} className="mt-1" placeholder="e.g. 101" />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("room_type", "Room Type")}</label>
 <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option>{t("standard", "Standard")}</option>
 <option>{t("deluxe", "Deluxe")}</option>
 <option>{t("suite", "Suite")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("rate_per_night", "Rate per Night ($)")}</label>
 <Input type="number" value={formData.rate} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("floor", "Floor")}</label>
 <select value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option>{t("1st_floor", "1st Floor")}</option>
 <option>{t("2nd_floor", "2nd Floor")}</option>
 <option>{t("3rd_floor", "3rd Floor")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("amenities_comma_separated", "Amenities (Comma separated)")}</label>
 <Input value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value})} className="mt-1" placeholder="e.g. Wifi, Tv, AC, Coffee" />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb}>{t("save_room", "Save Room")}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteFromDb}
 title="Delete Room Configuration"
 message="Are you sure you want to delete this room configuration? It will be removed permanently from active hotel management."
 />
 {/* View Details Sheet */}
 <Sheet open={viewDetailsId !== null} onOpenChange={(isOpen) => !isOpen && setViewDetailsId(null)}>
 <SheetContent className="overflow-y-auto">
 {viewDetailsId && (() => {
 const room = rooms.find(r => r.id === viewDetailsId);
 if (!room) return null;
 return (
 <>
 <SheetHeader className="mb-6">
 <SheetTitle className="text-2xl flex items-center gap-2">
 <Bed className="w-6 h-6 text-primary" />
 {t("room", "Room")} {room.roomNumber} {t("details", "Details")}
 </SheetTitle>
 <SheetDescription>
 {t("complete_information_for_room", "Complete information for room")} {room.roomNumber}
 </SheetDescription>
 </SheetHeader>
 <div className="space-y-6">
 <div>
 <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t("basic_info", "Basic Info")}</h3>
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-muted/50 p-3 rounded-lg">
 <p className="text-xs text-muted-foreground mb-1">{t("type", "Type")}</p>
 <p className="font-semibold text-foreground">{room.type}</p>
 </div>
 <div className="bg-muted/50 p-3 rounded-lg">
 <p className="text-xs text-muted-foreground mb-1">{t("floor", "Floor")}</p>
 <p className="font-semibold text-foreground">{room.floor}</p>
 </div>
 <div className="bg-muted/50 p-3 rounded-lg">
 <p className="text-xs text-muted-foreground mb-1">{t("rate_per_night", "Rate per Night")}</p>
 <p className="font-semibold text-primary">${room.rate}</p>
 </div>
 <div className="bg-muted/50 p-3 rounded-lg">
 <p className="text-xs text-muted-foreground mb-1">{t("status", "Status")}</p>
 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-primary/90">
 <Activity className="w-3 h-3 mr-1" /> {room.status}
 </span>
 </div>
 </div>
 </div>
 <div>
 <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t("amenities", "Amenities")}</h3>
 <div className="flex flex-wrap gap-2">
 {room.amenities?.map(a => {
 return (<span key={a} className="bg-slate-100 text-primary/80 px-3 py-1 rounded-md text-xs font-bold uppercase">{a}</span>);
})}
 {(!room.amenities || room.amenities.length === 0) && (
 <p className="text-sm text-muted-foreground">{t("no_amenities_listed", "No amenities listed.")}</p>
 )}
 </div>
 </div>
 <div className="pt-4 flex gap-2">
 <Button onClick={() => { setViewDetailsId(null); handleEdit(room);}} className="flex-1 bg-primary hover:bg-primary/90 text-white">
 <Edit className="w-4 h-4 mr-2" /> {t("edit_room", "Edit Room")}
 </Button>
 </div>
 </div>
 </>
 );
})()}
 </SheetContent>
 </Sheet>
 </div>
 );
}

