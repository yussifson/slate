import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { usePowerSync } from '@powersync/react';
import { useQuery } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { MapPin, Truck, Calendar, User, MessageSquare } from "lucide-react";
import DriverChatModal from '@/components/logistics/DriverChatModal';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function DispatchBoard() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  
  const [selectedLoadForChat, setSelectedLoadForChat] = useState(null);

  // Fetch Assigned Loads
  const { data: loads } = useQuery({
    queryKey: ['logistics_dispatch_loads', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        `SELECT l.*, m.vehicle_id, m.status as match_status, f.vehicle_name 
         FROM logistics_loads l
         LEFT JOIN logistics_load_matches m ON m.load_id = l.id AND m.status = 'assigned'
         LEFT JOIN univ_fleet f ON m.vehicle_id = f.id
         WHERE l.company_id = ? AND l.status IN ('assigned', 'in_transit', 'delivered')
         ORDER BY l.created_at DESC`, 
        [companyId]
      );
      return res.rows?._array || [];
    }
  });

  const updateLoadStatus = async (loadId, status) => {
    try {
      await powerSync.execute(
        `UPDATE logistics_loads SET status = ? WHERE id = ?`,
        [status, loadId]
      );
      toast.success(`Load status updated to ${status}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-card-foreground flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary" />
          {t("dispatch_board", "Dispatch Board")}
        </h1>
        <p className="text-[#71717a] dark:text-gray-400 mt-1">
          {t("dispatch_board_desc", "Manage assigned loads, track in-transit status, and communicate with drivers.")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['assigned', 'in_transit', 'delivered'].map(statusGroup => (
          <div key={statusGroup} className="space-y-4">
            <h2 className="font-semibold text-lg uppercase tracking-wider bg-muted/50 p-2 rounded-lg text-center border">
              {statusGroup.replace('_', ' ')}
            </h2>
            
            <div className="space-y-4">
              {loads?.filter(l => l.status === statusGroup).map(load => (
                <div key={load.id} className="bg-card border rounded-xl p-4 shadow-sm relative hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {load.origin} → {load.destination}
                    </h3>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Driver: {load.vehicle_name || 'Pending...'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Created: {new Date(load.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setSelectedLoadForChat(load)} className="flex-1 gap-2">
                      <MessageSquare className="w-4 h-4" /> Chat
                    </Button>
                    
                    {statusGroup === 'assigned' && (
                      <Button size="sm" onClick={() => updateLoadStatus(load.id, 'in_transit')} className="flex-1">
                        Start Transit
                      </Button>
                    )}
                    {statusGroup === 'in_transit' && (
                      <Button size="sm" onClick={() => updateLoadStatus(load.id, 'delivered')} className="flex-1">
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {loads?.filter(l => l.status === statusGroup).length === 0 && (
                <div className="text-center p-6 border border-dashed rounded-xl text-muted-foreground text-sm">
                  No loads in this status.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <DriverChatModal 
        open={!!selectedLoadForChat} 
        onOpenChange={(o) => !o && setSelectedLoadForChat(null)}
        loadId={selectedLoadForChat?.id}
        driverName={selectedLoadForChat?.vehicle_name}
        vehicleId={selectedLoadForChat?.vehicle_id}
      />
    </div>
  );
}
