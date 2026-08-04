import React, { useState } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Search, Trash2, Edit2, Users, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

export default function Hostel() {
  const companyId = useCompanyId();
  const { data: hostels = [], isLoading } = useIndustryRecords('school_hostel');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    room_number: '',
    block: 'Block A',
    type: 'Dormitory',
    capacity: 20,
    occupancy: 0,
    gender: 'Male',
    house_parent: '',
    amenities: 'Beds, Storage, Fan',
    status: 'Available'
  });

  const filteredRecords = hostels.filter(record => {
    const d = record.data;
    if (!d) return false;
    return d.room_number?.toLowerCase().includes(search.toLowerCase()) || 
           d.block?.toLowerCase().includes(search.toLowerCase());
  });

  const openModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        room_number: record.data.room_number || '',
        block: record.data.block || 'Block A',
        type: record.data.type || 'Dormitory',
        capacity: Number(record.data.capacity) || 20,
        occupancy: Number(record.data.occupancy) || 0,
        gender: record.data.gender || 'Male',
        house_parent: record.data.house_parent || '',
        amenities: record.data.amenities || 'Beds, Storage, Fan',
        status: record.data.status || 'Available'
      });
    } else {
      setEditingId(null);
      setFormData({
        room_number: '',
        block: 'Block A',
        type: 'Dormitory',
        capacity: 20,
        occupancy: 0,
        gender: 'Male',
        house_parent: '',
        amenities: 'Beds, Storage, Fan',
        status: 'Available'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.room_number) {
      toast.error('Room number is required');
      return;
    }

    // Auto update status based on occupancy
    let newStatus = formData.status;
    if (formData.occupancy >= formData.capacity) {
      newStatus = 'Full';
    } else if (newStatus === 'Full' && formData.occupancy < formData.capacity) {
      newStatus = 'Available';
    }

    try {
      await saveRecord({
        id: editingId,
        recordType: 'school_hostel',
        payload: { ...formData, status: newStatus },
        searchText: `${formData.room_number} ${formData.block} ${formData.gender}`,
        status: newStatus
      });
      toast.success('Room saved successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save room');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await deleteRecord({ id, recordType: 'school_hostel' });
        toast.success('Room deleted');
      } catch (error) {
        toast.error('Failed to delete room');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Full': return 'bg-red-100 text-red-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading hostel rooms...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hostel Management</h1>
          <p className="text-gray-600">Manage rooms, dormitories, and capacity.</p>
        </div>
        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search rooms or blocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500 border border-gray-200">
          No hostel rooms found. Click "Add Room" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => {
            const data = record.data;
            const occupancyPercentage = (data.occupancy / data.capacity) * 100;
            return (
              <div key={record.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Home className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{data.room_number}</h3>
                      <p className="text-xs text-gray-500">{data.block} • {data.type}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}>
                    {data.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Users className="h-4 w-4" /> Occupancy
                      </span>
                      <span className="font-medium">{data.occupancy} / {data.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${occupancyPercentage >= 100 ? 'bg-red-500' : occupancyPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="block text-xs text-gray-500">Gender</span>
                      <span className="font-medium text-gray-800">{data.gender}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="block text-xs text-gray-500">House Parent</span>
                      <span className="font-medium text-gray-800 truncate" title={data.house_parent}>{data.house_parent || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openModal(record)}>
                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="e.g. A101"
                />
              </div>
              <div className="space-y-2">
                <Label>Block</Label>
                <Select value={formData.block} onValueChange={(v) => setFormData({ ...formData, block: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Block A">Block A</SelectItem>
                    <SelectItem value="Block B">Block B</SelectItem>
                    <SelectItem value="Block C">Block C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dormitory">Dormitory</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Semi-private">Semi-private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Occupancy</Label>
                <Input
                  type="number"
                  min="0"
                  max={formData.capacity}
                  value={formData.occupancy}
                  onChange={(e) => setFormData({ ...formData, occupancy: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>House Parent</Label>
                <Input
                  value={formData.house_parent}
                  onChange={(e) => setFormData({ ...formData, house_parent: e.target.value })}
                  placeholder="e.g. Mrs. Adjoa"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Full">Full</SelectItem>
                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amenities</Label>
              <Input
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="Beds, Storage, Fan..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
