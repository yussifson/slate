import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BedDouble, Search, Plus, Home, MoreVertical, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

export default function Hostel() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: records = [], isLoading } = useIndustryRecords('hostel');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    name: '', type: 'Boys', warden: '', capacity: '', rooms: ''
  });

  const hostels = records.map(r => ({
    id: r.id,
    ...r.data
  }));

  const filtered = hostels.filter(h =>
    h.name?.toLowerCase().includes(search.toLowerCase()) || 
    h.warden?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.name || !formData.capacity) return toast.error("Name and capacity required");
    
    const payload = {
      name: formData.name,
      type: formData.type,
      warden: formData.warden,
      capacity: formData.capacity,
      rooms: formData.rooms,
      status: 'Active'
    };

    if (editingId) {
      mutateRecord.mutate({
        id: editingId, recordType: 'hostel', payload, status: 'active',
        searchText: `${formData.name} ${formData.warden} ${formData.type}`
      }, {
        onSuccess: () => { toast.success("Hostel updated"); setShowModal(false); setEditingId(null); }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'hostel', payload, status: 'active',
        searchText: `${formData.name} ${formData.warden} ${formData.type}`
      }, {
        onSuccess: () => { toast.success("Hostel saved"); setShowModal(false); }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("hostel_dormitory", "Hostel & Dormitory")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_dormitories", "Manage boarding houses, capacity, and wardens")}</p>
        </div>
        <Button onClick={() => { setFormData({name: '', type: 'Boys', warden: '', capacity: '', rooms: ''}); setShowModal(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4" /> {t("add_hostel", "Add Hostel")}
        </Button>
      </div>
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search hostels or wardens..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading", "Loading...")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
          <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_hostels", "No hostels found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(h => (
            <div key={h.id} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingId(h.id);
                      setFormData({ name: h.name, type: h.type, warden: h.warden, capacity: h.capacity, rooms: h.rooms });
                      setShowModal(true);
                    }}>{t("edit", "Edit")}</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 font-medium" onClick={() => {
                      if (window.confirm("Are you sure?")) deleteRecord.mutate({ id: h.id, recordType: 'hostel' });
                    }}>{t("delete", "Delete")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-card-foreground text-lg line-clamp-1" title={h.name}>{h.name}</h3>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">{h.type} Hostel</p>
                
                <div className="w-full space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-emerald-500" /> Cap:</span>
                    <span className="font-semibold text-foreground">{h.capacity} beds</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <span className="flex items-center gap-2"><BedDouble className="w-3.5 h-3.5 text-emerald-500" /> Rooms:</span>
                    <span className="font-semibold text-foreground">{h.rooms || 'N/A'}</span>
                  </div>
                  <div className="pt-2 border-t border-border mt-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Warden</p>
                    <p className="text-sm font-medium text-foreground truncate">{h.warden || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-sm w-full max-w-md p-6 space-y-4 border border-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Hostel' : 'Add Hostel'}</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("hostel_name", "Hostel Name")}</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1" placeholder="Lincoln House" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("type", "Type")}</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option>Boys</option>
                    <option>Girls</option>
                    <option>Co-ed</option>
                  </select>
                </div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("capacity", "Total Capacity")}</label><Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="mt-1" placeholder="120" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("rooms", "Total Rooms")}</label><Input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} className="mt-1" placeholder="30" /></div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("warden", "Warden Name")}</label><Input value={formData.warden} onChange={e => setFormData({...formData, warden: e.target.value})} className="mt-1" /></div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
                {mutateRecord.isPending ? 'Saving...' : 'Save Hostel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
