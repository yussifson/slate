import React from 'react';
import { useQuery } from "@powersync/react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Activity, ShieldAlert, AlertTriangle, ShieldCheck, Thermometer } from "lucide-react";

export default function InfectionControl() {
  const companyId = useCompanyId();
  const { data: logs = [], isLoading } = useQuery("SELECT * FROM univ_infection_logs WHERE company_id = ? ORDER BY date_reported DESC", [companyId]);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/9 dark:border-white/8 flex justify-between items-center bg-muted/20">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Infection Control & Tracking
          </h2>
          <div className="flex gap-2">
            <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Active Alerts
            </span>
          </div>
        </div>
        <div className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-4">Loading infection logs...</p>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mb-3 opacity-80" />
              <p className="font-medium text-foreground">No Infections Reported</p>
              <p className="text-sm mt-1">All hospital zones are currently clear.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/9 dark:divide-white/8">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Thermometer className="w-4 h-4 text-amber-500" />
                        {log.infection_type || 'Unknown Infection'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded font-semibold text-muted-foreground border border-black/9 dark:border-white/8">
                        {log.department || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                      <span>Patient: {log.patient_name || 'N/A'}</span>
                      <span>•</span>
                      <span>Reported: {log.date_reported ? new Date(log.date_reported).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {log.is_abnormal || log.severity === 'high' ? (
                      <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5" /> High Risk
                      </span>
                    ) : log.severity === 'medium' ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 uppercase tracking-wider">
                        <Activity className="w-3.5 h-3.5" /> Moderate
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        Monitoring
                      </span>
                    )}

                    {log.denial_risk_score > 0 && (
                      <div className="flex flex-col items-end border-l border-black/9 dark:border-white/8 pl-4">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Denial Risk</span>
                        <span className={`text-sm font-bold ${log.denial_risk_score > 70 ? 'text-red-600' : 'text-amber-600'}`}>
                          {log.denial_risk_score}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
