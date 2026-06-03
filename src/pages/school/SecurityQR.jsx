import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, ShieldCheck, UserCheck, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

export default function SecurityQR() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const [qrKey, setQrKey] = useState(Date.now());

  const { data: logs = [] } = useQuery({
    queryKey: ['school_security_scan', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_security_scan', companyId);
      return all.filter(l => l.client_id === session?.user?.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    },
    enabled: !!companyId && !!session?.user?.id
  });

  const simulateScan = useMutation({
    mutationFn: () => {
      return base44.createEntity({
        company_id: companyId,
        case_type: 'school_security_scan',
        client_id: session?.user?.id,
        title: 'Gate Entry Scan',
        status: 'approved',
        data: { location: 'Main Gate', method: 'qr_code' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['school_security_scan', companyId]);
      toast.success("Security scan approved!");
      setQrKey(Date.now()); // rotate QR
    }
  });

  // Auto rotate QR every 60s for security
  useEffect(() => {
    const interval = setInterval(() => setQrKey(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="lg:w-1/3 flex flex-col gap-6">
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <QrCode className="w-10 h-10 text-slate-900 dark:text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2">Campus ID</h2>
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Active & Secure</p>
          
          <div className="bg-white p-6 rounded-3xl shadow-inner border-4 border-slate-100 mb-6 relative">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${session?.user?.id}-${qrKey}`} alt="Security QR" className="w-48 h-48" />
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Button onClick={() => setQrKey(Date.now())} variant="secondary" className="gap-2 rounded-full font-bold shadow-xl"><RefreshCw className="w-4 h-4" /> Rotate Key</Button>
            </div>
          </div>
          
          <div className="text-xs text-slate-400 font-medium">Auto-rotates every 60 seconds</div>
          
          {/* Debug Button for Testing */}
          <Button onClick={() => simulateScan.mutate()} disabled={simulateScan.isPending} variant="outline" className="mt-8 w-full border-dashed">
            [Test] Simulate Gate Scan
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-teal-900 rounded-[2.5rem] p-8 text-white shadow-xl border border-white/10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 blur-[80px] rounded-full pointer-events-none"></div>
          <h1 className="text-3xl font-black tracking-tight mb-2 relative z-10">Digital Security</h1>
          <p className="text-emerald-100 font-medium relative z-10">Your digital Campus ID is required for library access, dining halls, and main gate entry.</p>
        </div>

        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
          <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2"><Clock className="text-slate-400" /> Access Log</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {logs.length === 0 && <p className="text-center text-slate-500 py-8">No access logs found.</p>}
            {logs.map(log => (
              <div key={log.id} className="bg-white dark:bg-background p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{log.title}</div>
                    <div className="text-xs text-slate-500">{log.data?.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{log.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
