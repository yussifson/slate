import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Bus, Search, Plus, MapPin, MoreHorizontal, Users, Navigation, Phone, Clock, Map } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function Transport() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: records = [], isLoading } = useIndustryRecords('school_transport');
  const { data: students = [] } = useIndustryRecords('school_student');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({ route_name: '', vehicle: '', driver_name: '', driver_phone: '', capacity: '', morning_departure: '', afternoon_return: '', stops: '' });

  const routes = records.map(r => ({ id: r.id, ...r.data }));
  const getStudentCount = (routeName) => students.filter(s => s.data.transport_route === routeName).length;
  const filtered = routes.filter(r => r.route_name?.toLowerCase().includes(search.toLowerCase()) || r.driver_name?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!formData.route_name || !formData.vehicle) return toast.error("Route and vehicle required");
    const payload = { route_name: formData.route_name, vehicle: formData.vehicle, driver_name: formData.driver_name, driver_phone: formData.driver_phone, capacity: parseInt(formData.capacity) || 0, current_occupancy: getStudentCount(formData.route_name), morning_departure: formData.morning_departure, afternoon_return: formData.afternoon_return, stops: formData.stops, status: 'Active' };
    if (editingId) {
      mutateRecord.mutate({ id: editingId, recordType: 'school_transport', payload, status: 'active', searchText: `${formData.route_name} ${formData.driver_name} ${formData.vehicle}` }, { onSuccess: () => { toast.success("Route updated"); setShowModal(false); setEditingId(null); } });
    } else {
      mutateRecord.mutate({ recordType: 'school_transport', payload, status: 'active', searchText: `${formData.route_name} ${formData.driver_name} ${formData.vehicle}` }, { onSuccess: () => { toast.success("Route saved"); setShowModal(false); } });
    }
  };

  const totalStudents = routes.reduce((sum, r) => sum + getStudentCount(r.route_name), 0);

  return (
    <SchoolPageShell
      title="Transport Fleet"
      subtitle="Manage routes, vehicles, and student assignments"
      breadcrumb={['School', 'Transport']}
      actions={
        <Button onClick={() => { setFormData({ route_name: '', vehicle: '', driver_name: '', driver_phone: '', capacity: '', morning_departure: '', afternoon_return: '', stops: '' }); setEditingId(null); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Route
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Active Routes', value: routes.length, icon: Navigation, color: 'bg-indigo-500/10 text-indigo-600' },
          { label: 'Students Assigned', value: totalStudents, icon: Users, color: 'bg-sky-500/10 text-sky-600' },
          { label: 'Total Vehicles', value: routes.length, icon: Bus, color: 'bg-amber-500/10 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-5 h-5" /></div>
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
          <Input placeholder="Search routes or drivers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
        </div>
      </div>

      {/* Route Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading routes...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
          <Map className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No routes found</p>
          <button onClick={() => setShowModal(true)} className="text-sm text-indigo-600 hover:underline mt-2">Add your first route →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((r, i) => {
            const studentCount = getStudentCount(r.route_name);
            const capacity = parseInt(r.capacity) || 1;
            const fillPct = Math.min(100, Math.round((studentCount / capacity) * 100));
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bus className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{r.route_name}</h3>
                        <p className="text-xs text-muted-foreground">{r.vehicle}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => { setEditingId(r.id); setFormData({ route_name: r.route_name, vehicle: r.vehicle, driver_name: r.driver_name, driver_phone: r.driver_phone, capacity: r.capacity, morning_departure: r.morning_departure, afternoon_return: r.afternoon_return, stops: r.stops }); setShowModal(true); }}>Edit Route</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (window.confirm("Delete this route?")) deleteRecord.mutate({ id: r.id, recordType: 'school_transport' }); }}>Delete Route</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3 bg-muted/20 rounded-xl p-4 border border-border/50">
                    {/* Occupancy */}
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-medium mb-1.5">
                          <span className="text-muted-foreground">{studentCount} students</span>
                          <span className={`font-semibold ${fillPct > 90 ? 'text-rose-600' : 'text-foreground'}`}>{fillPct}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${fillPct > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${fillPct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{r.capacity} cap</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground">Driver</p>
                        <p className="text-sm font-semibold text-foreground">{r.driver_name || 'Unassigned'}</p>
                        {r.driver_phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{r.driver_phone}</p>}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Schedule</p>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" />{r.morning_departure} – {r.afternoon_return}</p>
                      </div>
                    </div>
                    
                    {r.stops && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Stops</p>
                        <p className="text-xs text-foreground">{r.stops}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 flex-shrink-0">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Route' : 'Add Route'}</h2>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4 flex-1">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route Name *</label>
                <Input value={formData.route_name} onChange={e => setFormData({...formData, route_name: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. Route A - Accra Central" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicle *</label>
                <Input value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} className="mt-1.5 h-10" placeholder="Bus GH-1234-20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Capacity</label>
                <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="mt-1.5 h-10" placeholder="40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver Name</label>
                <Input value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} className="mt-1.5 h-10" placeholder="Driver Name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver Phone</label>
                <Input value={formData.driver_phone} onChange={e => setFormData({...formData, driver_phone: e.target.value})} className="mt-1.5 h-10" placeholder="+233..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Morning Departure</label>
                <Input value={formData.morning_departure} onChange={e => setFormData({...formData, morning_departure: e.target.value})} className="mt-1.5 h-10" placeholder="06:30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Afternoon Return</label>
                <Input value={formData.afternoon_return} onChange={e => setFormData({...formData, afternoon_return: e.target.value})} className="mt-1.5 h-10" placeholder="15:30" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stops</label>
                <Input value={formData.stops} onChange={e => setFormData({...formData, stops: e.target.value})} className="mt-1.5 h-10" placeholder="Stop 1, Stop 2..." />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave}>{mutateRecord.isPending ? 'Saving...' : 'Save Route'}</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </SchoolPageShell>
  );
}
