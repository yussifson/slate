import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { MapPin, BellRing, Smartphone, Plus, Activity, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

export default function GeofenceAlerts() {
  const { t } = useTranslation();
  
  const [geofences, setGeofences] = useState([
    { id: 1, name: "Main Warehouse (Tema)", radius: "5km", active: true, phone: "+233 55 123 4567" },
    { id: 2, name: "Port of Takoradi", radius: "2km", active: true, phone: "+233 24 987 6543" },
  ]);
  
  const [logs, setLogs] = useState([
    { id: 101, time: "10 mins ago", event: "Truck 42 entered Main Warehouse (Tema) 5km radius.", sentTo: "+233 55 123 4567" },
    { id: 102, time: "1 hour ago", event: "Truck 18 entered Port of Takoradi 2km radius.", sentTo: "+233 24 987 6543" },
  ]);

  const handleSimulate = () => {
    toast({ title: "Simulation Triggered", description: "Truck 99 is entering Geofence. Sending WhatsApp/SMS to +233 55 123 4567.", variant: "default" });
    setLogs(prev => [
      { id: Date.now(), time: "Just now", event: "Truck 99 entered Main Warehouse (Tema) 5km radius.", sentTo: "+233 55 123 4567" },
      ...prev
    ]);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <BellRing className="w-6 h-6 text-primary" />
            {t("geofence_alerts", "Geofence Automated Alerts")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("geofence_description", "Draw virtual boundaries around locations. When a truck enters the radius, an automated SMS or WhatsApp is sent to the receiving party.")}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Geofence
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm min-h-[400px] relative overflow-hidden">
            {/* Simulated Map Background */}
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cGF0aCBkPSJNMjAgMEwwIDBaTTAgMjBMMjAgMjBaIiBzdHJva2U9InJnYmEoMCwgMCwgMCwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Active Fences
              </h2>
            </div>

            <div className="relative z-10 space-y-4">
              {geofences.map(gf => (
                <div key={gf.id} className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{gf.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Alert triggered at {gf.radius} radius</p>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> SMS/WhatsApp to {gf.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleSimulate} title="Simulate Entry">
                      <Activity className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Settings2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Trigger Logs
            </h2>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {logs.map((log) => (
                <div key={log.id} className="border-l-2 border-primary/50 pl-4 py-1 relative">
                  <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-primary ring-4 ring-background"></div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">{log.time}</p>
                  <p className="text-sm text-foreground">{log.event}</p>
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Notified {log.sentTo}
                  </p>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
// Placeholder CheckCircle to prevent import errors if missed
function CheckCircle(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
