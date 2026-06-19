import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BedDouble, Search, Plus, Home, MoreVertical, Users, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="space-y-8 font-dmsans p-4 md:p-8 bg-[#f4fdf8] min-h-screen text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase tracking-[-0.02em] tracking-[0.04em]">{t("hostel_dormitory", "Campus Map")}</h1>
          <p className="text-emerald-700 font-medium text-lg mt-1">{t("manage_dormitories", "Visual block/room allocation map")}</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => { setFormData({name: '', type: 'Boys', warden: '', capacity: '', rooms: ''}); setShowModal(true); }} className="gap-2 bg-emerald-500/10 hover:bg-emerald-600 text-white rounded-none border-2 border-emerald-900 font-semibold px-6 py-6 text-lg transition-colors">
            <Plus className="w-6 h-6" /> {t("add_hostel", "New Block")}
          </Button>
        </motion.div>
      </div>
      
      <div className="border-2 border-emerald-900 bg-emerald-50 p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-16 h-16 bg-emerald-200 border-2 border-emerald-900 flex items-center justify-center text-emerald-900 shrink-0">
          <MapPin className="w-8 h-8" />
        </div>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700" />
          <Input placeholder="Search blocks or wardens..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 bg-white border-2 border-emerald-900 rounded-none h-16 text-xl font-medium focus-visible:ring-0 focus-visible:border-emerald-600 placeholder:text-emerald-300 w-full hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-emerald-600 font-semibold text-xl uppercase animate-pulse tracking-[0.04em]">{t("loading", "Loading Map...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-emerald-300 bg-emerald-50/50">
          <BedDouble className="w-16 h-16 mx-auto mb-4 text-emerald-200" />
          <p className="font-black text-2xl text-emerald-800 uppercase tracking-[-0.02em] tracking-[0.04em]">{t("no_hostels", "No Blocks Found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filtered.map((h, i) => (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={h.id} className="bg-white border-2 border-emerald-900 p-6 group relative hover:bg-emerald-50 transition-colors flex flex-col justify-between min-h-[250px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <div className="absolute top-4 right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 p-0 border-2 border-transparent group-hover:border-emerald-900 group-hover:bg-emerald-200 rounded-none transition-all">
                        <MoreVertical className="h-5 w-5 text-emerald-900" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 border-2 border-emerald-900 rounded-none p-0 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <DropdownMenuItem className="font-semibold cursor-pointer rounded-none focus:bg-emerald-100 focus:text-emerald-900 p-3" onClick={() => {
                        setEditingId(h.id);
                        setFormData({ name: h.name, type: h.type, warden: h.warden, capacity: h.capacity, rooms: h.rooms });
                        setShowModal(true);
                      }}>{t("edit", "Edit Block")}</DropdownMenuItem>
                      <DropdownMenuItem className="font-semibold cursor-pointer rounded-none focus:bg-red-100 focus:text-red-900 text-red-600 p-3" onClick={() => {
                        if (window.confirm("Delete this block?")) deleteRecord.mutate({ id: h.id, recordType: 'hostel' });
                      }}>{t("delete", "Demolish")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div>
                  <div className={`w-16 h-16 border-2 border-emerald-900 flex items-center justify-center mb-6 ${h.type === 'Boys' ? 'bg-blue-200 text-blue-900' : h.type === 'Girls' ? 'bg-pink-200 text-pink-900' : 'bg-purple-200 text-purple-900'}`}>
                    <Home className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-emerald-900 text-2xl mb-1 uppercase tracking-tight tracking-[-0.02em] tracking-[0.04em]" title={h.name}>{h.name}</h3>
                  <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-6 tracking-[0.04em]">{h.type} Block</p>
                </div>
                
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center justify-between text-sm bg-emerald-100 border-2 border-emerald-900 p-3">
                    <span className="flex items-center gap-2 font-semibold text-emerald-900"><Users className="w-4 h-4" /> Capacity</span>
                    <span className="font-black text-emerald-900 text-lg">{h.capacity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-emerald-100 border-2 border-emerald-900 p-3">
                    <span className="flex items-center gap-2 font-semibold text-emerald-900"><BedDouble className="w-4 h-4" /> Rooms</span>
                    <span className="font-black text-emerald-900 text-lg">{h.rooms || 'N/A'}</span>
                  </div>
                  <div className="pt-4 border-t-2 border-emerald-900/20">
                    <p className="text-xs text-emerald-700 uppercase font-black tracking-widest mb-1 tracking-[0.04em]">Warden</p>
                    <p className="text-base font-semibold text-emerald-900 truncate">{h.warden || 'Unassigned'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border-4 border-emerald-900 w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-2xl font-black text-emerald-900 mb-6 uppercase tracking-tight tracking-[-0.02em] tracking-[0.04em]">{editingId ? 'Edit Block' : 'Add Block'}</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("hostel_name", "Block Name")}</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-emerald-50" placeholder="e.g. Alpha Block" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("type", "Type")}</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-14 border-2 border-emerald-900 bg-emerald-50 px-4 font-semibold text-emerald-900 focus:outline-none focus:border-emerald-500 rounded-none appearance-none">
                    <option>Boys</option>
                    <option>Girls</option>
                    <option>Co-ed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("capacity", "Total Beds")}</label>
                  <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-emerald-50" placeholder="120" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("rooms", "Total Rooms")}</label>
                  <Input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-emerald-50" placeholder="30" />
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("warden", "Warden Name")}</label>
                  <Input value={formData.warden} onChange={e => setFormData({...formData, warden: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-emerald-50" placeholder="John Doe" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-8">
              <Button variant="outline" className="flex-1 h-14 border-2 border-emerald-900 text-emerald-900 font-black uppercase tracking-widest rounded-none hover:bg-emerald-100 tracking-[0.04em]" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-900 font-black uppercase tracking-widest rounded-none transition-colors tracking-[0.04em]" onClick={handleSave}>
                {mutateRecord.isPending ? 'Saving...' : 'Deploy Block'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
