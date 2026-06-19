import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Bus, Search, Plus, Map, MoreVertical, Users, MapPin, Navigation } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Transport() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: records = [], isLoading } = useIndustryRecords('transport');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    route: '', vehicle: '', driver: '', capacity: '', schedule: ''
  });

  const routes = records.map(r => ({
    id: r.id,
    ...r.data
  }));

  const filtered = routes.filter(r =>
    r.route?.toLowerCase().includes(search.toLowerCase()) || 
    r.driver?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.route || !formData.vehicle) return toast.error("Route and vehicle required");
    
    const payload = {
      route: formData.route,
      vehicle: formData.vehicle,
      driver: formData.driver,
      capacity: formData.capacity,
      schedule: formData.schedule,
      status: 'Active'
    };

    if (editingId) {
      mutateRecord.mutate({
        id: editingId, recordType: 'transport', payload, status: 'active',
        searchText: `${formData.route} ${formData.driver} ${formData.vehicle}`
      }, {
        onSuccess: () => { toast.success("Route updated"); setShowModal(false); setEditingId(null); }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'transport', payload, status: 'active',
        searchText: `${formData.route} ${formData.driver} ${formData.vehicle}`
      }, {
        onSuccess: () => { toast.success("Route saved"); setShowModal(false); }
      });
    }
  };

  return (
    <div className="space-y-8 font-dmsans p-4 md:p-8 bg-[#f4fdf8] min-h-screen text-slate-900 relative overflow-hidden">
      {/* Decorative map lines background */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase flex items-center gap-3 tracking-[-0.02em] tracking-[0.04em]">
            <Navigation className="w-10 h-10 text-emerald-600" />
            {t("transport_fleet", "Fleet Control")}
          </h1>
          <p className="text-emerald-700 font-medium text-lg mt-1">{t("manage_school_buses", "Map-inspired route & driver assignments")}</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => { setFormData({route: '', vehicle: '', driver: '', capacity: '', schedule: ''}); setShowModal(true); }} className="gap-2 bg-emerald-500/10 hover:bg-emerald-600 text-white rounded-md-none border-2 border-emerald-900 font-semibold px-6 py-6 text-lg transition-all hover:translate-y-[2px] hover:translate-x-[2px]">
            <Plus className="w-6 h-6" /> {t("add_route", "Dispatch Route")}
          </Button>
        </motion.div>
      </div>
      
      <div className="border-2 border-emerald-900 bg-white p-4 flex flex-col md:flex-row gap-4 items-center relative z-10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="w-16 h-16 bg-amber-300 border-2 border-emerald-900 flex items-center justify-center text-emerald-900 shrink-0">
          <Bus className="w-8 h-8" />
        </div>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700" />
          <Input placeholder="Search routes or drivers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 bg-emerald-50 border-2 border-emerald-900 rounded-md-none h-16 text-xl font-medium focus-visible:ring-0 focus-visible:border-emerald-600 placeholder:text-emerald-400 w-full" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-emerald-600 font-semibold text-xl uppercase animate-pulse relative z-10 tracking-[0.04em]">{t("loading", "Locating Fleet...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-emerald-900 bg-emerald-100 relative z-10">
          <Map className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
          <p className="font-black text-2xl text-emerald-900 uppercase tracking-[-0.02em] tracking-[0.04em]">{t("no_routes", "No Routes Active")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10 mt-8">
          <AnimatePresence>
            {filtered.map((r, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={r.id} className="bg-amber-100 border-2 border-emerald-900 p-6 group relative transition-all flex flex-col justify-between min-h-[280px] hover:translate-y-[4px] hover:translate-x-[4px]">
                <div className="absolute top-4 right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 p-0 border-2 border-transparent group-hover:border-emerald-900 group-hover:bg-amber-200 rounded-md-none transition-all">
                        <MoreVertical className="h-5 w-5 text-emerald-900" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-2 border-emerald-900 rounded-md-none p-0 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <DropdownMenuItem className="font-semibold cursor-pointer rounded-md-none focus:bg-emerald-100 focus:text-emerald-900 p-3" onClick={() => {
                        setEditingId(r.id);
                        setFormData({ route: r.route, vehicle: r.vehicle, driver: r.driver, capacity: r.capacity, schedule: r.schedule });
                        setShowModal(true);
                      }}>{t("edit", "Modify Route")}</DropdownMenuItem>
                      <DropdownMenuItem className="font-semibold cursor-pointer rounded-md-none focus:bg-red-100 focus:text-red-900 text-red-600 p-3" onClick={() => {
                        if (window.confirm("Cancel this route?")) deleteRecord.mutate({ id: r.id, recordType: 'transport' });
                      }}>{t("delete", "Terminate Route")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div>
                  <div className="w-16 h-16 border-2 border-emerald-900 bg-white flex items-center justify-center mb-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <MapPin className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="font-black text-emerald-900 text-2xl mb-1 uppercase tracking-tight leading-tight tracking-[-0.02em] tracking-[0.04em]" title={r.route}>{r.route}</h3>
                  <div className="inline-block bg-emerald-900 text-white px-3 py-1 text-xs font-black uppercase tracking-widest mt-2 border-2 border-emerald-900 tracking-[0.04em]">
                    {r.vehicle || 'NO PLATE'}
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-3 bg-white border-2 border-emerald-900 p-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="bg-emerald-100 p-1 border-2 border-emerald-900"><Users className="w-4 h-4 text-emerald-900" /></div>
                    <div className="truncate flex-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none tracking-[0.04em]">Driver</p>
                      <p className="font-semibold text-emerald-900 truncate">{r.driver || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white border-2 border-emerald-900 p-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="bg-amber-200 p-1 border-2 border-emerald-900"><Bus className="w-4 h-4 text-emerald-900" /></div>
                    <div className="truncate flex-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none tracking-[0.04em]">Capacity</p>
                      <p className="font-semibold text-emerald-900">{r.capacity || '0'} <span className="text-xs tracking-[0.04em]">PAX</span></p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-amber-50 border-4 border-emerald-900 w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black text-emerald-900 mb-6 uppercase tracking-tight flex items-center gap-3 tracking-[-0.02em] tracking-[0.04em]">
              <Navigation className="w-8 h-8" />
              {editingId ? 'Edit Route' : 'Dispatch Route'}
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("route_name", "Path / Waypoints")}</label>
                <Input value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-md-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" placeholder="Downtown - North Campus" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("vehicle", "Plate Number")}</label>
                  <Input value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-md-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-white uppercase tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" placeholder="BUS-001" />
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("capacity", "Max PAX")}</label>
                  <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-md-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" placeholder="45" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("driver", "Assigned Pilot")}</label>
                <Input value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-md-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" placeholder="Driver Name" />
              </div>
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("schedule", "Timeline")}</label>
                <Input value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-md-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" placeholder="Morn: 6:30AM, Aft: 3:30PM" />
              </div>
            </div>
            
            <div className="flex gap-4 pt-8">
              <Button variant="outline" className="flex-1 h-14 border-2 border-emerald-900 bg-white text-emerald-900 font-black uppercase tracking-widest rounded-md-none hover:bg-emerald-100 tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" onClick={() => setShowModal(false)}>{t("cancel", "Abort")}</Button>
              <Button className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-900 font-black uppercase tracking-widest rounded-md-none transition-colors tracking-[0.04em]" onClick={handleSave}>
                {mutateRecord.isPending ? 'Syncing...' : 'Deploy'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
