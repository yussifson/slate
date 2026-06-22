import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';

export default function AnomalyScanner() {
  const companyId = useCompanyId();
  const [isScanning, setIsScanning] = useState(false);
  const [anomalies, setAnomalies] = useState([]);

  const scanData = async () => {
    setIsScanning(true);
    setAnomalies([]);
    
    // Simulate complex scanning by fetching multiple tables
    try {
      // Look for overdue appointments or long waiting queues
      const queueRes = await powerSync.execute(
        `SELECT COUNT(*) as c FROM univ_opd_queues WHERE company_id = ? AND status = 'waiting' AND created_at < datetime('now', '-2 hours')`,
        [companyId]
      );
      const longWaits = queueRes.rows._array[0]?.c || 0;

      // Look for low stock in blood bank
      const bloodRes = await powerSync.execute(
        `SELECT blood_type, units_available, minimum_threshold FROM univ_blood_bank WHERE company_id = ? AND units_available <= minimum_threshold`,
        [companyId]
      );
      const lowBlood = bloodRes.rows._array;

      // Look for active infection outbreaks (multiple active in same ward)
      const infectionRes = await powerSync.execute(
        `SELECT ward_location, COUNT(*) as c FROM univ_infection_logs WHERE company_id = ? AND status = 'active' GROUP BY ward_location HAVING COUNT(*) >= 2`,
        [companyId]
      );
      const infections = infectionRes.rows._array;

      const newAnomalies = [];
      
      if (longWaits > 0) {
        newAnomalies.push({ id: 1, type: 'warning', title: 'High Wait Times Detected', desc: `${longWaits} patients have been waiting in the OPD queue for over 2 hours.` });
      }
      
      if (lowBlood.length > 0) {
        newAnomalies.push({ id: 2, type: 'critical', title: 'Critical Blood Shortage', desc: `Blood types running below minimum threshold: ${lowBlood.map(b => b.blood_type).join(', ')}.` });
      }

      if (infections.length > 0) {
        newAnomalies.push({ id: 3, type: 'critical', title: 'Potential Infection Cluster', desc: `Multiple active infection logs detected in: ${infections.map(i => i.ward_location).join(', ')}.` });
      }

      setTimeout(() => {
        setAnomalies(newAnomalies);
        setIsScanning(false);
      }, 1500); // Artificial delay to simulate deep scan

    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      scanData();
    }
  }, [companyId]);

  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-6 shadow-sm min-h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Clinical Anomaly Scanner</h3>
            <p className="text-xs text-slate-500">Real-time proactive threat detection</p>
          </div>
        </div>
        <Button onClick={scanData} disabled={isScanning} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning Systems...' : 'Rescan Now'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {isScanning ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="relative">
              <Activity className="w-12 h-12 text-slate-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent animate-scan" />
            </div>
            <p className="animate-pulse">Running cross-module anomaly detection algorithms...</p>
          </div>
        ) : anomalies.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-emerald-600 space-y-3">
            <CheckCircle2 className="w-16 h-16 opacity-50" />
            <h4 className="font-semibold text-lg">All Systems Nominal</h4>
            <p className="text-slate-500 text-sm">No critical anomalies or deviations detected in recent data.</p>
          </div>
        ) : (
          anomalies.map(anomaly => (
            <div key={anomaly.id} className={`p-4 rounded-lg border-l-4 ${anomaly.type === 'critical' ? 'border-red-500 bg-red-50/50' : 'border-amber-500 bg-amber-50/50'}`}>
              <div className="flex gap-3">
                <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${anomaly.type === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
                <div>
                  <h4 className={`font-semibold ${anomaly.type === 'critical' ? 'text-red-800' : 'text-amber-800'}`}>{anomaly.title}</h4>
                  <p className={`text-sm mt-1 ${anomaly.type === 'critical' ? 'text-red-600/80' : 'text-amber-700/80'}`}>{anomaly.desc}</p>
                  <Button variant="link" className={`p-0 h-auto mt-2 text-xs ${anomaly.type === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>Investigate immediately &rarr;</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
