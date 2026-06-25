import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Bed, Search, Plus, Trash2, CheckSquare, Layers, FileText, Edit, Activity, MoreVertical, Wifi, AirVent, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import HotelKPICard from '@/components/hotel/HotelKPICard';
import BentoGrid from '@/components/shared/BentoGrid';
import DashboardSectionHeader from '@/components/shared/DashboardSectionHeader';

export default function RoomsNew() {
  const { t } = useTranslation();
  
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('room');
  const { data: dbFloors = [] } = useIndustryRecords('floor');
  
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const rooms = dbRecords.map(r => ({ ...r.data, id: r.id, status: r.status || 'Active' }));
  const savedFloors = dbFloors.map(f => ({ ...f.data, id: f.id }));
  const availableFloors = savedFloors.length > 0 ? savedFloors : [
    { name: '1st Floor' },
    { name: '2nd Floor' },
    { name: '3rd Floor' }
  ];

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'Standard',
    rate: 150,
    floor: availableFloors[0]?.name || '1st Floor',
    amenities: 'Wifi, TV'
  });

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
          amenities: 'Wifi, TV'
        });
      }
    });
  };

  const filteredRooms = rooms.filter(r =>
    r.roomNumber?.includes(search) ||
    r.type?.toLowerCase().includes(search.toLowerCase())
  );

  const roomTypes = [...new Set(rooms.map(r => r.type))];
  const avgRate = rooms.length > 0 ? (rooms.reduce((sum, r) => sum + (r.rate || 0), 0) / rooms.length).toFixed(0) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  return (
    <motion.div 
      className="min-h-screen pb-12"
      style={{ 
        background: "linear-gradient(135deg, rgba(194, 12, 50, 0.03) 0%, rgba(255, 255, 255, 0) 100%)" 
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex justify-between items-end gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--hotel-primary))] to-[hsl(var(--hotel-secondary))] bg-clip-text text-transparent tracking-tight mb-2">
              Room Inventory
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Configure and manage all guest rooms</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-[hsl(var(--hotel-primary))] hover:bg-[hsl(var(--hotel-primary)_/_0.9)] text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Room
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <BentoGrid>
          <HotelKPICard
            title="Total Rooms"
            value={rooms.length}
            subtext="Property inventory"
            icon={<Bed className="w-5 h-5" />}
            color="burgundy"
          />
          <HotelKPICard
            title="Room Types"
            value={roomTypes.length}
            subtext="Categories"
            icon={<Layers className="w-5 h-5" />}
            color="rose"
          />
          <HotelKPICard
            title="Average Rate"
            value={`$${avgRate}`}
            subtext="Per night"
            icon={<CheckSquare className="w-5 h-5" />}
            color="accent"
          />
          <HotelKPICard
            title="Floors"
            value={availableFloors.length}
            subtext="Property floors"
            icon={<Layers className="w-5 h-5" />}
            color="gold"
          />
        </BentoGrid>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search rooms by number or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2.5"
          />
        </div>
      </motion.div>

      {/* Rooms Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredRooms.map((room, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-2xl font-bold text-[hsl(var(--hotel-primary))]">#{room.roomNumber}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{room.type} • {room.floor}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditTargetId(room.id); setFormData(room); setShowModal(true); }}>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Rate</span>
                <span className="font-bold text-[hsl(var(--hotel-primary))]">${room.rate}/night</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {room.amenities?.slice(0, 3).map((amenity, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Add/Edit Room Modal */}
      {showModal && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2 className="text-xl font-bold mb-6 text-[hsl(var(--hotel-primary))]">
              {editTargetId ? 'Edit Room' : 'Add New Room'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Room Number</label>
                <Input
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="101"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option>Standard</option>
                    <option>Deluxe</option>
                    <option>Suite</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Rate</label>
                  <Input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="150"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Floor</label>
                <select
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {availableFloors.map(f => (
                    <option key={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Amenities</label>
                <Input
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, TV, AC"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-[hsl(var(--hotel-primary))] hover:bg-[hsl(var(--hotel-primary)_/_0.9)] text-white"
                onClick={handleSaveToDb}
              >
                Save Room
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
