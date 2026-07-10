import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/shared/PageHeader";
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { Plus, Search, MapPin, Package, Clock, Phone, User, CheckCircle, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const STATUS_COLORS = {
  pending: "bg-orange-100 text-orange-700",
  assigned: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-700"
};

export default function Pickups() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '', contact_phone: '', pickup_address: '', 
    pickup_date: new Date().toISOString().split('T')[0], pickup_time: '', 
    package_details: '', weight_lbs: '', assigned_driver_id: ''
  });

  const { data: pickups = [], isLoading } = useQuery({
    queryKey: ['logistics_pickups', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM logistics_pickups WHERE company_id = ? ORDER BY pickup_date DESC, created_at DESC', 
        [companyId]
      );
      return res.rows._array || Array.from(res.rows);
    },
    enabled: !!companyId
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['logistics_drivers', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        "SELECT id, name FROM univ_hr_employees WHERE company_id = ? AND role = 'driver'", 
        [companyId]
      );
      return res.rows._array || Array.from(res.rows);
    },
    enabled: !!companyId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const newId = crypto.randomUUID();
      await powerSync.execute(
        `INSERT INTO logistics_pickups (
          id, company_id, created_at, updated_at, created_by, client_name, contact_phone, 
          pickup_address, pickup_date, pickup_time, package_details, weight_lbs, status, assigned_driver_id
        ) VALUES (
          ?, ?, datetime('now'), datetime('now'), ?, ?, ?, 
          ?, ?, ?, ?, ?, ?, ?
        )`,
        [
          newId, companyId, user?.id, data.client_name, data.contact_phone,
          data.pickup_address, data.pickup_date, data.pickup_time, data.package_details,
          parseFloat(data.weight_lbs) || null, data.assigned_driver_id && data.assigned_driver_id !== 'unassigned' ? 'assigned' : 'pending', data.assigned_driver_id !== 'unassigned' ? data.assigned_driver_id : null
        ]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['logistics_pickups', companyId]);
      setIsAddOpen(false);
      setFormData({
        client_name: '', contact_phone: '', pickup_address: '', 
        pickup_date: new Date().toISOString().split('T')[0], pickup_time: '', 
        package_details: '', weight_lbs: '', assigned_driver_id: ''
      });
      toast({ title: "Pickup Scheduled Successfully" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute('UPDATE logistics_pickups SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['logistics_pickups', companyId]);
      toast({ title: "Status Updated" });
    }
  });

  if (isLoading) return <OrbitLoader />;

  const filteredPickups = pickups.filter(p => 
    p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-card/50 h-full p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <PageHeader 
          title="Pickups Management" 
          description="Schedule, assign, and track freight pickups."
          actions={
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Pickup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Schedule New Pickup</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client Name</label>
                    <Input value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Phone</label>
                    <Input value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Pickup Address</label>
                    <Input value={formData.pickup_address} onChange={e => setFormData({...formData, pickup_address: e.target.value})} placeholder="Full address" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input type="date" value={formData.pickup_date} onChange={e => setFormData({...formData, pickup_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Window</label>
                    <Input type="time" value={formData.pickup_time} onChange={e => setFormData({...formData, pickup_time: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Package Details</label>
                    <Input value={formData.package_details} onChange={e => setFormData({...formData, package_details: e.target.value})} placeholder="e.g. 2 Pallets, fragile" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (lbs)</label>
                    <Input type="number" value={formData.weight_lbs} onChange={e => setFormData({...formData, weight_lbs: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Assign Driver (Optional)</label>
                    <Select value={formData.assigned_driver_id} onValueChange={v => setFormData({...formData, assigned_driver_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                        {drivers.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.client_name || !formData.pickup_address || createMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                    {createMutation.isPending ? "Scheduling..." : "Schedule"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Clock className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending Pickups</p>
              <h4 className="text-2xl font-bold">{pickups.filter(p => p.status === 'pending').length}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Truck className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Assigned (Active)</p>
              <h4 className="text-2xl font-bold">{pickups.filter(p => p.status === 'assigned').length}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Completed</p>
              <h4 className="text-2xl font-bold">{pickups.filter(p => p.status === 'completed').length}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Package className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Pickups</p>
              <h4 className="text-2xl font-bold">{pickups.length}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-black/9 dark:border-white/8 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-card/50">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search pickups..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white dark:bg-card border-black/9 dark:border-white/8 rounded-xl h-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/50 border-b border-black/9 dark:border-white/8">
                <tr>
                  <th className="px-6 py-4 font-medium">Client / Contact</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                  <th className="px-6 py-4 font-medium">Driver</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/9 dark:divide-white/8">
                {filteredPickups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No pickups found</p>
                      <p className="text-sm">Schedule a new pickup to get started.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPickups.map((pickup) => (
                    <tr key={pickup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {pickup.client_name}
                        </div>
                        {pickup.contact_phone && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {pickup.contact_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        <div className="flex items-start gap-2" title={pickup.pickup_address}>
                          <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span className="truncate">{pickup.pickup_address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div className="font-medium">{pickup.pickup_date}</div>
                        <div className="text-xs">{pickup.pickup_time || 'Any time'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div>{pickup.package_details || 'N/A'}</div>
                        {pickup.weight_lbs > 0 && <div className="text-xs font-medium">{pickup.weight_lbs} lbs</div>}
                      </td>
                      <td className="px-6 py-4">
                        {pickup.assigned_driver_id ? (
                          <div className="flex items-center gap-2 text-sm font-medium">
                             <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                               {(drivers.find(d => d.id === pickup.assigned_driver_id)?.name || 'Dr').charAt(0)}
                             </div>
                             {drivers.find(d => d.id === pickup.assigned_driver_id)?.name || 'Unknown Driver'}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${STATUS_COLORS[pickup.status]} font-medium border-0 hover:bg-transparent`}>
                          {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Select 
                          value={pickup.status} 
                          onValueChange={(val) => updateStatusMutation.mutate({ id: pickup.id, status: val })}
                        >
                          <SelectTrigger className="w-[120px] ml-auto h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
