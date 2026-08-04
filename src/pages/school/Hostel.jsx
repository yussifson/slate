import React, { useState } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Search, Trash2, Edit2, Users, Home, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const statusConfig = {
  Available: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
  Full: { cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20', dot: 'bg-rose-500' },
  'Under Maintenance': { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', dot: 'bg-amber-500' },
};

export default function Hostel() {
  const companyId = useCompanyId();
  const { data: hostels = [], isLoading } = useIndustryRecords('school_hostel');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ room_number: '', block: 'Block A', type: 'Dormitory', capacity: 20, occupancy: 0, gender: 'Male', house_parent: '', amenities: 'Beds, Storage, Fan', status: 'Available' });

  const filteredRecords = hostels.filter(record => {
    const d = record.data;
    if (!d) return false;
    return d.room_number?.toLowerCase().includes(search.toLowerCase()) || d.block?.toLowerCase().includes(search.toLowerCase());
  });

  const openModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({ room_number: record.data.room_number || '', block: record.data.block || 'Block A', type: record.data.type || 'Dormitory', capacity: Number(record.data.capacity) || 20, occupancy: Number(record.data.occupancy) || 0, gender: record.data.gender || 'Male', house_parent: record.data.house_parent || '', amenities: record.data.amenities || 'Beds, Storage, Fan', status: record.data.status || 'Available' });
    } else {
      setEditingId(null);
      setFormData({ room_number: '', block: 'Block A', type: 'Dormitory', capacity: 20, occupancy: 0, gender: 'Male', house_parent: '', amenities: 'Beds, Storage, Fan', status: 'Available' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.room_number) { toast.error('Room number is required'); return; }
    let newStatus = formData.status;
    if (formData.occupancy >= formData.capacity) newStatus = 'Full';
    else if (newStatus === 'Full' && formData.occupancy < formData.capacity) newStatus = 'Available';
    try {
      await saveRecord({ id: editingId, recordType: 'school_hostel', payload: { ...formData, status: newStatus }, searchText: `${formData.room_number} ${formData.block} ${formData.gender}`, status: newStatus });
      toast.success('Room saved');
      setIsModalOpen(false);
    } catch (error) { toast.error('Failed to save room'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this room?')) {
      try { await deleteRecord({ id, recordType: 'school_hostel' }); toast.success('Room deleted'); }
      catch (error) { toast.error('Failed to delete room'); }
    }
  };

  const stats = {
    total: hostels.length,
    available: hostels.filter(h => h.data?.status === 'Available').length,
    totalCapacity: hostels.reduce((sum, h) => sum + Number(h.data?.capacity || 0), 0),
    totalOccupied: hostels.reduce((sum, h) => sum + Number(h.data?.occupancy || 0), 0),
  };

  return (
    <SchoolPageShell
      title="Hostel Management"
      subtitle="Manage rooms, dormitories, and occupancy"
      breadcrumb={['School', 'Hostel']}
      actions={
        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Room
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Rooms', value: stats.total, color: 'bg-indigo-500/10 text-indigo-600' },
          { label: 'Available', value: stats.available, color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Total Capacity', value: stats.totalCapacity, color: 'bg-sky-500/10 text-sky-600' },
          { label: 'Occupied', value: stats.totalOccupied, color: 'bg-amber-500/10 text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Home className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search rooms or blocks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
        </div>
      </div>

      {/* Room Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading rooms...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
          <Home className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No rooms found</p>
          <button onClick={() => openModal()} className="text-sm text-indigo-600 hover:underline mt-2">Add your first room →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredRecords.map(record => {
            const d = record.data;
            const occupancyPct = Math.min(100, Math.round((d.occupancy / d.capacity) * 100));
            const cfg = statusConfig[d.status] || statusConfig.Available;
            return (
              <motion.div key={record.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center"><Home className="w-5 h-5 text-indigo-600" /></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>{d.status}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => openModal(record)}><Edit2 className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(record.id)} className="text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{d.room_number}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.block} · {d.type} · {d.gender}</p>
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Occupancy</span>
                      <span className={`font-semibold ${occupancyPct >= 100 ? 'text-rose-600' : 'text-foreground'}`}>{d.occupancy} / {d.capacity}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${occupancyPct >= 100 ? 'bg-rose-500' : occupancyPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${occupancyPct}%` }} />
                    </div>
                    {d.house_parent && <p className="text-xs text-muted-foreground">👤 {d.house_parent}</p>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Room' : 'Add New Room'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Room Number *</Label><Input value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} placeholder="e.g. A101" className="h-10" /></div>
              <div className="space-y-2"><Label>Block</Label>
                <Select value={formData.block} onValueChange={v => setFormData({...formData, block: v})}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Block A">Block A</SelectItem><SelectItem value="Block B">Block B</SelectItem><SelectItem value="Block C">Block C</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Room Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Dormitory">Dormitory</SelectItem><SelectItem value="Private">Private</SelectItem><SelectItem value="Semi-private">Semi-private</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Gender</Label>
                <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Mixed">Mixed</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="h-10" /></div>
              <div className="space-y-2"><Label>Current Occupancy</Label><Input type="number" min="0" max={formData.capacity} value={formData.occupancy} onChange={e => setFormData({...formData, occupancy: Number(e.target.value)})} className="h-10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>House Parent</Label><Input value={formData.house_parent} onChange={e => setFormData({...formData, house_parent: e.target.value})} placeholder="e.g. Mrs. Adjoa" className="h-10" /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Full">Full</SelectItem><SelectItem value="Under Maintenance">Under Maintenance</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Amenities</Label><Input value={formData.amenities} onChange={e => setFormData({...formData, amenities: e.target.value})} placeholder="Beds, Storage, Fan..." className="h-10" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
