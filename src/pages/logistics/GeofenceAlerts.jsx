import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { MapPin, BellRing, Smartphone, Plus, Activity, Settings2, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { usePowerSync } from '@powersync/react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';

export default function GeofenceAlerts() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const { user } = useAuth();
  const companyId = user?.app_metadata?.company_id || '00000000-0000-0000-0000-000000000000';
  
  const [isCreating, setIsCreating] = useState(false);
  const [newFence, setNewFence] = useState({ name: '', radius: '', phone: '' });

  // Fetch Geofences
  const { data: geofences, refetch: refetchFences } = useQuery({
    queryKey: ['logistics_geofences', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM logistics_geofences WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      return res.rows?._array || [];
    }
  });
  
  // Fetch Logs
  const { data: logs } = useQuery({
    queryKey: ['logistics_geofence_logs', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM logistics_geofence_logs WHERE company_id = ? ORDER BY created_at DESC LIMIT 50',
        [companyId]
      );
      return res.rows?._array || [];
    }
  });

  const handleSimulate = async (fence) => {
    try {
      const logId = crypto.randomUUID();
      const eventMsg = `Truck 99 entered ${fence.name} ${fence.radius_meters}m radius.`;
      
      await powerSync.execute(
        `INSERT INTO logistics_geofence_logs (id, company_id, geofence_id, vehicle_id, event, sent_to) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [logId, companyId, fence.id, 'Truck-99', eventMsg, fence.alert_phone_numbers]
      );

      // Also trigger a unified offline-first notification
      await powerSync.execute(
        `INSERT INTO univ_notifications (id, company_id, created_at, title, message, type, read) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), companyId, new Date().toISOString(), "Geofence Triggered", eventMsg, "warning", 0]
      );
      
      toast({ title: "Simulation Triggered", description: `Alert sent to ${fence.alert_phone_numbers}.`, variant: "default" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to trigger simulation.", variant: "destructive" });
    }
  };

  const handleCreateFence = async () => {
    if (!newFence.name || !newFence.radius || !newFence.phone) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    
    try {
      setIsCreating(true);
      const fenceId = crypto.randomUUID();
      
      await powerSync.execute(
        `INSERT INTO logistics_geofences (id, company_id, name, latitude, longitude, radius_meters, active, alert_phone_numbers) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fenceId, companyId, newFence.name, 5.6037, -0.1870, parseInt(newFence.radius), 1, newFence.phone] // hardcoded lat/long for demo
      );
      
      toast({ title: "Geofence Created", description: `${newFence.name} is now active.`, variant: "default" });
      setNewFence({ name: '', radius: '', phone: '' });
      refetchFences();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to create geofence.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <BellRing className="w-6 h-6 text-primary" />
            {t("geofence_alerts", "Geofence Automated Alerts")}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1">
            {t("geofence_description", "Draw virtual boundaries around locations. When a truck enters the radius, an automated SMS or WhatsApp is sent to the receiving party.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm min-h-[400px] relative overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            {/* Simulated Map Background */}
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cGF0aCBkPSJNMjAgMEwwIDBaTTAgMjBMMjAgMjBaIiBzdHJva2U9InJnYmEoMCwgMCwgMCwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <MapPin className="w-5 h-5 text-primary" />
                Active Fences
              </h2>
            </div>

            <div className="relative z-10 space-y-4">
              {/* New Fence Form inline */}
              <div className="bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl p-4 flex flex-col sm:flex-row items-end gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm mb-6">
                <div className="flex-1 space-y-1">
                   <label className="text-xs font-semibold tracking-[0.04em]">Location Name</label>
                   <Input placeholder="e.g. Tema Port" value={newFence.name} onChange={e => setNewFence({...newFence, name: e.target.value})} />
                </div>
                <div className="w-full sm:w-24 space-y-1">
                   <label className="text-xs font-semibold tracking-[0.04em]">Radius (m)</label>
                   <Input placeholder="5000" type="number" value={newFence.radius} onChange={e => setNewFence({...newFence, radius: e.target.value})} />
                </div>
                <div className="flex-1 space-y-1">
                   <label className="text-xs font-semibold tracking-[0.04em]">Alert Phone (SMS/WhatsApp)</label>
                   <Input placeholder="+233..." value={newFence.phone} onChange={e => setNewFence({...newFence, phone: e.target.value})} />
                </div>
                <Button onClick={handleCreateFence} disabled={isCreating} className="gap-2">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
                </Button>
              </div>

              {geofences?.map(gf => (
                <div key={gf.id} className="bg-background/90 backdrop-blur-sm border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-md-xl p-4 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md-full bg-primary/10 flex items-center justify-center border-[0.5px] border-black/9 dark:border-white/8 border-primary/30">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{gf.name}</h3>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">Alert triggered at {gf.radius_meters}m radius</p>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2 tracking-[0.04em]">
                        <Smartphone className="w-3 h-3" /> SMS/WhatsApp to {gf.alert_phone_numbers}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSimulate(gf)} title="Simulate Entry">
                      <Activity className="w-4 h-4 text-primary mr-1" /> Simulate
                    </Button>
                  </div>
                </div>
              ))}
              {geofences?.length === 0 && (
                 <div className="text-center p-8 bg-background/80 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-[0.5px] border-black/9 dark:border-white/8 text-[#71717a] dark:text-gray-400">
                    No active geofences. Create one above.
                 </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm h-[600px] flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <Activity className="w-5 h-5 text-primary" />
              Recent Trigger Logs
            </h2>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {logs?.map((log) => (
                <div key={log.id} className="border-l-2 border-primary/50 pl-4 py-1 relative">
                  <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-md-full bg-primary ring-4 ring-background"></div>
                  <p className="text-xs text-[#71717a] dark:text-gray-400 font-semibold mb-1 tracking-[0.04em]">
                    {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                  <p className="text-sm text-foreground">{log.event}</p>
                  <p className="text-xs text-primary mt-1 flex items-center gap-2 tracking-[0.04em]">
                    <CheckCircle className="w-3 h-3" /> Notified {log.sent_to}
                  </p>
                </div>
              ))}
              {logs?.length === 0 && (
                 <p className="text-sm text-[#71717a] dark:text-gray-400 italic mt-4 text-center">No logs recorded yet. Simulate an entry to test.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
