import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Truck, Search, Plus, MapPin, Activity, CheckCircle2, PhoneCall, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function AmbulanceDispatch() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: dispatches = [], isLoading } = useQuery({
    queryKey: ['univ_ambulance_dispatch', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM univ_ambulance_dispatch 
         WHERE company_id = ?
         ORDER BY dispatch_time DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_name: '',
    paramedic_name: '',
    destination: '',
    emergency_type: 'Trauma',
    notes: ''
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_ambulance_dispatch (id, created_at, company_id, vehicle_id, driver_name, paramedic_name, dispatch_time, destination, emergency_type, status, notes)
         VALUES (uuid(), datetime('now'), ?, ?, ?, ?, datetime('now'), ?, ?, 'Dispatched', ?)`,
        [companyId, payload.vehicle_id, payload.driver_name, payload.paramedic_name, payload.destination, payload.emergency_type, payload.notes]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_ambulance_dispatch']);
      toast.success('Ambulance dispatched successfully!');
      setShowModal(false);
      setFormData({ vehicle_id: '', driver_name: '', paramedic_name: '', destination: '', emergency_type: 'Trauma', notes: '' });
    },
    onError: (err) => toast.error('Failed to dispatch: ' + err.message)
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute("UPDATE univ_ambulance_dispatch SET status = ? WHERE id = ?", [status, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_ambulance_dispatch']);
      toast.success('Status updated');
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute("DELETE FROM univ_ambulance_dispatch WHERE id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_ambulance_dispatch']);
      toast.success('Dispatch record deleted');
    }
  });

  const filtered = dispatches.filter(d =>
    d.destination?.toLowerCase().includes(search.toLowerCase()) ||
    d.vehicle_id?.toLowerCase().includes(search.toLowerCase()) ||
    d.emergency_type?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Returned': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'On Scene': return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
      case 'Dispatched': return 'bg-red-100 text-red-700 border-red-200 animate-pulse';
      case 'Transporting': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-[#71717a]">Loading Dispatch Data...</div>;

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{t("ambulance_dispatch", "Ambulance Dispatch")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_ambulance", "Manage emergency fleet routing and paramedic teams")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-md">
          <PhoneCall className="w-4 h-4 animate-pulse" /> {t("new_dispatch", "New Dispatch")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Active Dispatches</h3>
            <Truck className="w-5 h-5 text-red-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {dispatches.filter(d => ['Dispatched', 'On Scene', 'Transporting'].includes(d.status)).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">On Scene</h3>
            <Activity className="w-5 h-5 text-amber-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {dispatches.filter(d => d.status === 'On Scene').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Transporting</h3>
            <Truck className="w-5 h-5 text-blue-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {dispatches.filter(d => d.status === 'Transporting').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Returned Today</h3>
            <CheckCircle2 className="w-5 h-5 text-slate-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-slate-600 mt-2">
            {dispatches.filter(d => d.status === 'Returned' && d.dispatch_time.startsWith(new Date().toISOString().split('T')[0])).length}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-muted/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search destination, vehicle..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-black/9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Destination</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Emergency</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Fleet & Crew</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#71717a]">
                    {new Date(d.dispatch_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 font-semibold text-card-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" /> {d.destination}
                  </td>
                  <td className="px-6 py-4 font-bold text-red-700 dark:text-red-400">{d.emergency_type}</td>
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-card-foreground">{d.vehicle_id}</p>
                    <p className="text-xs text-[#71717a]">Driver: {d.driver_name} | Medic: {d.paramedic_name}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {d.status === 'Dispatched' && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: d.id, status: 'On Scene' })} className="text-amber-600 font-medium">Mark On Scene</DropdownMenuItem>
                        )}
                        {d.status === 'On Scene' && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: d.id, status: 'Transporting' })} className="text-blue-600 font-medium">Mark Transporting</DropdownMenuItem>
                        )}
                        {d.status === 'Transporting' && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: d.id, status: 'Returned' })} className="text-emerald-600 font-medium">Mark Returned</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => { if(window.confirm('Delete record?')) deleteRecord.mutate(d.id); }} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center py-10 text-[#71717a]">No dispatches found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-white/10">
            <h2 className="text-xl font-bold text-card-foreground">New Dispatch Event</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] uppercase">Destination / Location</label>
                <Input placeholder="e.g. 123 Main St, Appt 4" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value})} className="mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] uppercase">Emergency Type</label>
                <select value={formData.emergency_type} onChange={e => setFormData({ ...formData, emergency_type: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm font-bold text-red-600">
                  <option value="Trauma">Trauma</option>
                  <option value="Cardiac Arrest">Cardiac Arrest</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Accident">Accident</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Vehicle (Ambulance ID)</label>
                <Input placeholder="AMB-01" value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value})} className="mt-1 font-mono uppercase" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Driver Name</label>
                <Input placeholder="John Doe" value={formData.driver_name} onChange={e => setFormData({ ...formData, driver_name: e.target.value})} className="mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] uppercase">Lead Paramedic Name</label>
                <Input placeholder="Jane Smith" value={formData.paramedic_name} onChange={e => setFormData({ ...formData, paramedic_name: e.target.value})} className="mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] uppercase">Initial Notes / Caller Info</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm" placeholder="Caller reported..." />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md" onClick={() => mutateRecord.mutate(formData)} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Dispatching...' : 'Dispatch Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
