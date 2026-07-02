import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Bed, Search, Plus, Trash2, CheckSquare, Layers, FileText, Edit, Activity, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export default function Rooms() {
  const { t } = useTranslation();
  
  // Real-time Sync Hooks
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('room');
  const { data: dbFloors = [] } = useIndustryRecords('floor');
  
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  // Map database records
  const rooms = dbRecords.map(r => ({ ...r.data, id: r.id, status: r.status || 'Active' }));
  const savedFloors = dbFloors.map(f => ({ ...f.data, id: f.id }));
  // Fallback if no floors configured yet
  const availableFloors = savedFloors.length > 0 ? savedFloors : [
    { name: '1st Floor' },
    { name: '2nd Floor' },
    { name: '3rd Floor' }
  ];

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  // Floor Management State
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [floorForm, setFloorForm] = useState({ name: '' });
  const [editingFloorId, setEditingFloorId] = useState(null);

  // Room Form State
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'Standard',
    rate: 150,
    floor: availableFloors[0]?.name || '1st Floor',
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
      status: editTargetId ? rooms.find(r => r.id === editTargetId)?.status || 'Available' : 'Available',
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
          floor: availableFloors[0]?.name || '1st Floor',
          amenities: 'Wifi, Tv'
        });
      },
      onError: (err) => {
        toast.error('Failed to configure room: ' + err.message);
      }
    });
  };

  const handleDeleteFromDb = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'room' }, {
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

  const handleBulkMaintenance = () => {
    if (selectedRoomIds.length === 0) return toast.error("No rooms selected");
    
    selectedRoomIds.forEach(id => {
      const room = rooms.find(r => r.id === id);
      if (room) {
        const newStatus = room.status === 'Maintenance' ? 'Available' : 'Maintenance';
        const { id: _id, status: _status, ...cleanPayload } = room;
        mutateRecord.mutate({ 
          id: room.id, 
          recordType: 'room', 
          payload: cleanPayload, 
          status: newStatus,
          searchText: `${room.roomNumber} ${room.type}`
        });
      }
    });
    
    toast.success(`Toggled maintenance status for ${selectedRoomIds.length} rooms`);
    setSelectedRoomIds([]);
  };

  const toggleSelectRoom = (id) => {
    setSelectedRoomIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  // --- Floor Management Functions ---
  const handleSaveFloor = () => {
    if (!floorForm.name.trim()) return toast.error("Please enter floor name");
    mutateRecord.mutate({
      id: editingFloorId || undefined,
      recordType: 'floor',
      payload: { name: floorForm.name.trim() },
      status: 'Active',
      searchText: floorForm.name
    }, {
      onSuccess: () => {
        toast.success(editingFloorId ? 'Floor updated!' : 'Floor added!');
        setFloorForm({ name: '' });
        setEditingFloorId(null);
      }
    });
  };

  const handleDeleteFloor = (id) => {
    deleteRecord.mutate({ id, recordType: 'floor' }, {
      onSuccess: () => toast.success('Floor deleted successfully!')
    });
  };

  const filtered = rooms.filter(room =>
    room.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
    room.type?.toLowerCase().includes(search.toLowerCase())
  );

  if (isDbLoading) return <div className="flex items-center justify-center h-64 text-[#71717a] dark:text-gray-400">{t("loading_room_data", "Loading room data...")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-card-foreground tracking-tight mb-1">{t("room_management", "Room Management")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400">{t("configure_rooms_pricing_and_am", "Set up room inventory, pricing, floors, and amenities")}</p>
        </div>
        <div className="flex gap-2">
          {selectedRoomIds.length > 0 && (
            <Button onClick={handleBulkMaintenance} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <CheckSquare className="w-4 h-4" /> Toggle Maintenance ({selectedRoomIds.length})
            </Button>
          )}
          <Button onClick={() => setShowFloorModal(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
            <Layers className="w-4 h-4" /> Manage Floors
          </Button>
          <Button onClick={() => { setEditTargetId(null); setShowModal(true); setFormData({ roomNumber: '', type: 'Standard', rate: 150, floor: availableFloors[0]?.name || '1st Floor', amenities: 'Wifi, Tv' }); }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4" /> {t("add_room", "Add Room")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
            <Input placeholder="Search room number or type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b-2 border-primary/20">
              <tr>
                <th className="px-6 py-3 w-12">
                  <input type="checkbox" checked={selectedRoomIds.length === filtered.length && filtered.length > 0} onChange={() => setSelectedRoomIds(selectedRoomIds.length === filtered.length ? [] : filtered.map(r => r.id))} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"/>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.05em]">{t("room_number", "Room Number")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.05em]">{t("type_floor", "Type & Floor")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.05em]">{t("rate_night", "Rate/Night")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.05em]">{t("status", "Status")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.05em]">{t("amenities", "Amenities")}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.05em]">{t("action", "Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(room => {
                return (
                  <tr key={room.id} className="group hover:bg-muted/60 transition-all duration-150 border-b-[0.5px] border-border/40">
                    <td className="px-6 py-3.5">
                      <input type="checkbox" checked={selectedRoomIds.includes(room.id)} onChange={() => toggleSelectRoom(room.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"/>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-card-foreground text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                      <Bed className={`w-5 h-5 transition-colors ${room.status === 'Maintenance' ? 'text-red-500' : 'text-primary/70 group-hover:text-primary'}`}/> 
                      {room.roomNumber}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{room.type}</p>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{room.floor}</p>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-card-foreground tabular-nums group-hover:text-primary transition-colors">${room.rate}</td>
                    <td className="px-6 py-4">
                      {room.status === 'Maintenance' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 uppercase tracking-wider animate-pulse tracking-[0.04em]">
                          <Activity className="w-3 h-3 mr-1" /> {t("maintenance_alert", "Maintenance Alert")}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-primary/90`}>
                          {room.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2.5 flex-wrap">
                        {room.amenities?.map(a => {
                          return (<span key={a} className="bg-muted text-[#71717a] dark:text-gray-400 px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-[0.04em]">{a}</span>);
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
                            const { id: _id, status: _status, ...cleanPayload } = room;
                            mutateRecord.mutate({ 
                              id: room.id, 
                              recordType: 'room', 
                              payload: cleanPayload, 
                              status: room.status === 'Maintenance' ? 'Available' : 'Maintenance',
                              searchText: `${room.roomNumber} ${room.type}`
                            });
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
            <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
              <Bed className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t("no_rooms_configured_click_add_", "No rooms configured. Click \"Add Room\" to populate list.")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              {editTargetId ? <Edit className="w-5 h-5 text-primary"/> : <Plus className="w-5 h-5 text-primary"/>}
              {editTargetId ? 'Edit Room Configuration' : 'Configure New Room'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("room_number", "Room Number")}</label>
                <Input value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value})} className="mt-1" placeholder="e.g. 101" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("room_type", "Room Type")}</label>
                <Input 
                  list="room-types"
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value})} 
                  className="mt-1" 
                  placeholder="e.g. Ocean View Suite" 
                />
                <datalist id="room-types">
                  {Array.from(new Set(rooms.map(r => r.type).filter(Boolean))).map(t => (
                    <option key={t} value={t} />
                  ))}
                  <option value="Standard" />
                  <option value="Deluxe" />
                  <option value="Suite" />
                  <option value="Penthouse" />
                </datalist>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("rate_per_night", "Rate per Night ($)")}</label>
                <Input type="number" value={formData.rate} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("floor", "Floor")}</label>
                <select value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
                  {availableFloors.map(f => (
                    <option key={f.name || f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("amenities_comma_separated", "Amenities (Comma separated)")}</label>
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

      {/* Floor Management Modal */}
      {showFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-primary"/> Manage Floors</h2>
            <div className="flex gap-2">
              <Input 
                value={floorForm.name} 
                onChange={(e) => setFloorForm({name: e.target.value})} 
                placeholder="e.g. 4th Floor or VIP Level" 
                className="flex-1"
              />
              <Button onClick={handleSaveFloor} className="bg-primary hover:bg-primary/90 text-white">
                {editingFloorId ? 'Update' : 'Add'}
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto mt-4 space-y-2 border border-primary/20 p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
              {savedFloors.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground p-4">No custom floors saved yet. Using defaults.</p>
              ) : (
                savedFloors.map(f => (
                  <div key={f.id} className="flex justify-between items-center bg-card p-3 rounded-lg border border-primary/10 shadow-sm">
                    <span className="font-semibold text-sm">{f.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setFloorForm({name: f.name}); setEditingFloorId(f.id); }} className="h-8 w-8 p-0 text-blue-600">
                        <Edit className="w-4 h-4"/>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFloor(f.id)} className="h-8 w-8 p-0 text-red-600">
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowFloorModal(false); setFloorForm({name: ''}); setEditingFloorId(null); }}>Close</Button>
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
                  <SheetTitle className="text-2xl flex items-center gap-2 tracking-[-0.02em]">
                    <Bed className="w-6 h-6 text-primary" />
                    {t("room", "Room")} {room.roomNumber} {t("details", "Details")}
                  </SheetTitle>
                  <SheetDescription>
                    {t("complete_information_for_room", "Complete information for room")} {room.roomNumber}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 school-page-enter font-dmsans">
                  <div>
                    <h3 className="text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-2">{t("basic_info", "Basic Info")}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-3 rounded-xl">
                        <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("type", "Type")}</p>
                        <p className="font-semibold text-foreground">{room.type}</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-xl">
                        <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("floor", "Floor")}</p>
                        <p className="font-semibold text-foreground">{room.floor}</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-xl">
                        <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("rate_per_night", "Rate per Night")}</p>
                        <p className="font-semibold text-primary">${room.rate}</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-xl">
                        <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">{t("status", "Status")}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-primary/90 tracking-[0.04em]">
                          <Activity className="w-3 h-3 mr-1" /> {room.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-2">{t("amenities", "Amenities")}</h3>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities?.map(a => {
                        return (<span key={a} className="bg-slate-100 text-primary/80 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-[0.04em]">{a}</span>);
                      })}
                      {(!room.amenities || room.amenities.length === 0) && (
                        <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_amenities_listed", "No amenities listed.")}</p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Button onClick={() => { setViewDetailsId(null); handleEdit(room); }} className="flex-1 bg-primary hover:bg-primary/90 text-white">
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
