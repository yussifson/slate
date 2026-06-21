import React from 'react';
import { useQuery } from "@powersync/react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Activity, Beaker, Bed, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function BloodBank() {
  const companyId = useCompanyId();
  const { data: inventory = [], isLoading: loadingInventory } = useQuery("SELECT * FROM univ_blood_bank WHERE company_id = ?", [companyId]);
  const { data: requests = [], isLoading: loadingRequests } = useQuery("SELECT * FROM univ_blood_requests WHERE company_id = ? ORDER BY created_at DESC", [companyId]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-black/9 dark:border-white/8 flex justify-between items-center bg-muted/20">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Beaker className="w-5 h-5 text-red-500" />
              Blood Inventory
            </h2>
          </div>
          <div className="p-4">
            {loadingInventory ? (
              <p className="text-sm text-muted-foreground">Loading inventory...</p>
            ) : inventory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inventory records found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {inventory.map((item) => (
                  <div key={item.id} className="p-3 border-[0.5px] border-black/9 dark:border-white/8 rounded-lg text-center flex flex-col items-center justify-center bg-background">
                    <span className="text-2xl font-bold text-red-600 mb-1">{item.blood_type}</span>
                    <span className="text-sm font-medium">{item.units_available} Units</span>
                    {item.is_abnormal || item.units_available < 5 ? (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full mt-2 font-semibold tracking-wide uppercase">Low Stock</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mt-2 font-semibold tracking-wide uppercase">Optimal</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-black/9 dark:border-white/8 flex justify-between items-center bg-muted/20">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Crossmatch Requests
            </h2>
          </div>
          <div className="p-0 max-h-[400px] overflow-y-auto">
            {loadingRequests ? (
              <p className="text-sm text-muted-foreground p-4">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No pending requests.</p>
            ) : (
              <div className="divide-y divide-black/9 dark:divide-white/8">
                {requests.map((req) => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{req.patient_name || 'Unknown Patient'}</span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-semibold border border-black/9 dark:border-white/8">
                          Type: {req.requested_blood_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5"/> Rm {req.room_number || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {req.units_requested} Units</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {req.urgency === 'stat' || req.urgency === 'urgent' ? (
                        <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" /> STAT
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Routine
                        </span>
                      )}
                      {req.no_show_risk_score > 70 && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Risk: High
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
