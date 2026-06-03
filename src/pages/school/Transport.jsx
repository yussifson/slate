import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Bus, Search, Plus, Map, MoreVertical, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("transport_fleet", "Transport & Fleet")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_school_buses", "Manage school bus routes, drivers, and capacity")}</p>
        </div>
        <Button onClick={() => { setFormData({route: '', vehicle: '', driver: '', capacity: '', schedule: ''}); setShowModal(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> {t("add_route", "Add Route")}
        </Button>
      </div>
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search routes or drivers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading", "Loading...")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
          <Bus className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_routes", "No transport routes found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(r => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingId(r.id);
                      setFormData({ route: r.route, vehicle: r.vehicle, driver: r.driver, capacity: r.capacity, schedule: r.schedule });
                      setShowModal(true);
                    }}>{t("edit", "Edit")}</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 font-medium" onClick={() => {
                      if (window.confirm("Are you sure?")) deleteRecord.mutate({ id: r.id, recordType: 'transport' });
                    }}>{t("delete", "Delete")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center mb-4">
                  <Map className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-card-foreground text-lg line-clamp-1" title={r.route}>{r.route}</h3>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">{r.vehicle}</p>
                
                <div className="w-full space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-blue-500" /> <span className="truncate">Driver: {r.driver || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <Bus className="w-3.5 h-3.5 text-blue-500" /> <span className="truncate">Cap: {r.capacity || '0'} students</span>
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
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Route' : 'Add Route'}</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("route_name", "Route Name/Path")}</label><Input value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} className="mt-1" placeholder="Downtown - North Campus" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("vehicle", "Vehicle ID / Plate")}</label><Input value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} className="mt-1" placeholder="BUS-001" /></div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("capacity", "Capacity")}</label><Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="mt-1" placeholder="45" /></div>
              </div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("driver", "Driver Name")}</label><Input value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("schedule", "Schedule Details")}</label><Input value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className="mt-1" placeholder="Morning: 6:30AM, Afternoon: 3:30PM" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
                {mutateRecord.isPending ? 'Saving...' : 'Save Route'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
