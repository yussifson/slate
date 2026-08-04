import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Bus, Search, Plus, Map, MoreVertical, Users, MapPin, Navigation, Phone, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';

export default function Transport() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: records = [], isLoading } = useIndustryRecords('school_transport');
  const { data: students = [] } = useIndustryRecords('school_student');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    route_name: '', vehicle: '', driver_name: '', driver_phone: '', capacity: '', morning_departure: '', afternoon_return: '', stops: ''
  });

  const routes = records.map(r => ({
    id: r.id,
    ...r.data
  }));

  const getStudentCount = (routeName) => {
    return students.filter(s => s.data.transport_route === routeName).length;
  };

  const filtered = routes.filter(r =>
    r.route_name?.toLowerCase().includes(search.toLowerCase()) || 
    r.driver_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.route_name || !formData.vehicle) return toast.error("Route and vehicle required");
    
    const payload = {
      route_name: formData.route_name,
      vehicle: formData.vehicle,
      driver_name: formData.driver_name,
      driver_phone: formData.driver_phone,
      capacity: parseInt(formData.capacity) || 0,
      current_occupancy: getStudentCount(formData.route_name),
      morning_departure: formData.morning_departure,
      afternoon_return: formData.afternoon_return,
      stops: formData.stops,
      status: 'Active'
    };

    if (editingId) {
      mutateRecord.mutate({
        id: editingId, recordType: 'school_transport', payload, status: 'active',
        searchText: `${formData.route_name} ${formData.driver_name} ${formData.vehicle}`
      }, {
        onSuccess: () => { toast.success("Route updated"); setShowModal(false); setEditingId(null); }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'school_transport', payload, status: 'active',
        searchText: `${formData.route_name} ${formData.driver_name} ${formData.vehicle}`
      }, {
        onSuccess: () => { toast.success("Route saved"); setShowModal(false); }
      });
    }
  };

  return (
    <div className="space-y-8 font-dmsans p-4 md:p-8 bg-[#f4fdf8] min-h-screen text-slate-900 relative overflow-hidden">
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
            <Navigation className="w-10 h-10 text-[#1E3A8A] dark:text-blue-400" />
            {t("transport_fleet", "Transport Fleet")}
          </h1>
          <p className="text-[#1E3A8A] dark:text-blue-400 font-medium text-lg mt-1">{t("manage_school_buses", "Manage routes and assign students")}</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => { setFormData({route_name: '', vehicle: '', driver_name: '', driver_phone: '', capacity: '', morning_departure: '', afternoon_return: '', stops: ''}); setShowModal(true); }} className="gap-2 bg-emerald-500/10 hover:bg-emerald-600 text-white rounded-none border-2 border-emerald-900 font-semibold px-6 py-6 text-lg transition-all hover:translate-y-[2px] hover:translate-x-[2px]">
            <Plus className="w-6 h-6" /> {t("add_route", "Add Route")}
          </Button>
        </motion.div>
      </div>
      
      <div className="border-2 border-emerald-900 bg-white p-4 flex flex-col md:flex-row gap-4 items-center relative z-10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="w-16 h-16 bg-amber-300 border-2 border-emerald-900 flex items-center justify-center text-emerald-900 shrink-0">
          <Bus className="w-8 h-8" />
        </div>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E3A8A] dark:text-blue-400" />
          <Input placeholder="Search routes or drivers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 bg-[#F0F4FF] dark:bg-blue-900/20 border-2 border-emerald-900 rounded-none h-16 text-xl font-medium focus-visible:ring-0 focus-visible:border-emerald-600 placeholder:text-emerald-400 w-full" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-[#1E3A8A] dark:text-blue-400 font-semibold text-xl uppercase animate-pulse relative z-10 tracking-[0.04em]">{t("loading", "Loading Routes...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-emerald-900 bg-emerald-100 relative z-10">
          <Map className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
          <p className="font-black text-2xl text-emerald-900 uppercase tracking-[-0.02em] tracking-[0.04em]">{t("no_routes", "No Routes Active")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 mt-8">
          <AnimatePresence>
            {filtered.map((r, i) => {
              const studentCount = getStudentCount(r.route_name);
              const capacity = parseInt(r.capacity) || 1;
              const fillPercentage = Math.min(100, Math.round((studentCount / capacity) * 100));

              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={r.id} className="bg-amber-100 border-2 border-emerald-900 p-6 group relative transition-all flex flex-col justify-between hover:translate-y-[4px] hover:translate-x-[4px]">
                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 p-0 border-2 border-transparent group-hover:border-emerald-900 group-hover:bg-amber-200 rounded-none transition-all">
                          <MoreVertical className="h-5 w-5 text-emerald-900" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 border-2 border-emerald-900 rounded-none p-0 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        <DropdownMenuItem className="font-semibold cursor-pointer rounded-none focus:bg-emerald-100 focus:text-emerald-900 p-3" onClick={() => {
                          setEditingId(r.id);
                          setFormData({ route_name: r.route_name, vehicle: r.vehicle, driver_name: r.driver_name, driver_phone: r.driver_phone, capacity: r.capacity, morning_departure: r.morning_departure, afternoon_return: r.afternoon_return, stops: r.stops });
                          setShowModal(true);
                        }}>{t("edit", "Edit Route")}</DropdownMenuItem>
                        <DropdownMenuItem className="font-semibold cursor-pointer rounded-none focus:bg-red-100 focus:text-red-900 text-red-600 p-3" onClick={() => {
                          if (window.confirm("Cancel this route?")) deleteRecord.mutate({ id: r.id, recordType: 'school_transport' });
                        }}>{t("delete", "Delete Route")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 border-2 border-emerald-900 bg-white flex items-center justify-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <MapPin className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-emerald-900 text-2xl mb-1 uppercase tracking-tight leading-tight tracking-[-0.02em] tracking-[0.04em]">{r.route_name}</h3>
                      <div className="inline-block bg-emerald-900 text-white px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-emerald-900 tracking-[0.04em]">
                        {r.vehicle || 'NO PLATE'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-4 bg-white border-2 border-emerald-900 p-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-900" />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{studentCount} Students Assigned</span>
                          <span>{r.capacity} PAX</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${fillPercentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${fillPercentage}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t-2 border-emerald-900 pt-4">
                      <div>
                        <p className="text-[10px] font-black text-[#1E3A8A] dark:text-blue-400 uppercase tracking-widest leading-none">Driver Info</p>
                        <p className="font-bold text-emerald-900">{r.driver_name || 'Unassigned'}</p>
                        {r.driver_phone && <p className="text-xs text-gray-600 flex items-center gap-1 mt-1"><Phone className="w-3 h-3"/> {r.driver_phone}</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#1E3A8A] dark:text-blue-400 uppercase tracking-widest leading-none">Schedule</p>
                        <p className="text-sm font-bold text-emerald-900 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {r.morning_departure} - {r.afternoon_return}</p>
                      </div>
                    </div>

                    <div className="border-t-2 border-emerald-900 pt-4">
                      <p className="text-[10px] font-black text-[#1E3A8A] dark:text-blue-400 uppercase tracking-widest leading-none mb-1">Stops</p>
                      <p className="text-sm font-medium text-emerald-900">{r.stops || 'No stops defined'}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-amber-50 border-4 border-emerald-900 w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black text-emerald-900 mb-6 uppercase tracking-tight flex items-center gap-3 tracking-[-0.02em] tracking-[0.04em]">
              <Navigation className="w-8 h-8" />
              {editingId ? 'Edit Route' : 'Add Route'}
            </h2>
            
            <div className="space-y-4 font-dmsans grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("route_name", "Route Name")}</label>
                <Input value={formData.route_name} onChange={e => setFormData({...formData, route_name: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none bg-white" placeholder="e.g. Route A - Accra Central" />
              </div>
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("vehicle", "Vehicle Details")}</label>
                <Input value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none bg-white" placeholder="Bus GH-1234-20" />
              </div>
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">{t("capacity", "Capacity")}</label>
                <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none bg-white" placeholder="40" />
              </div>
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">Driver Name</label>
                <Input value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none bg-white" placeholder="Driver Name" />
              </div>
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">Driver Phone</label>
                <Input value={formData.driver_phone} onChange={e => setFormData({...formData, driver_phone: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none bg-white" placeholder="+233..." />
              </div>
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">Morning Departure</label>
                <Input value={formData.morning_departure} onChange={e => setFormData({...formData, morning_departure: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none bg-white" placeholder="06:30" />
              </div>
              <div>
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">Afternoon Return</label>
                <Input value={formData.afternoon_return} onChange={e => setFormData({...formData, afternoon_return: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none bg-white" placeholder="15:30" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 block tracking-[0.04em]">Stops</label>
                <Input value={formData.stops} onChange={e => setFormData({...formData, stops: e.target.value})} className="h-14 font-semibold border-2 border-emerald-900 rounded-none bg-white" placeholder="Stop 1, Stop 2..." />
              </div>
            </div>
            
            <div className="flex gap-4 pt-8">
              <Button variant="outline" className="flex-1 h-14 border-2 border-emerald-900 bg-white text-emerald-900 font-black uppercase tracking-widest rounded-none" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 h-14 bg-[#1E3A8A] text-white font-black uppercase tracking-widest rounded-none border-2 border-emerald-900" onClick={handleSave}>
                {mutateRecord.isPending ? 'Saving...' : 'Save Route'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
