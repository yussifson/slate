import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, Clock, AlertCircle, RefreshCw, Plus, Search, Shield, Eye
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  signed: { label: 'Fully Signed & Executed', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  sent: { label: 'Sent to Signers', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  draft: { label: 'Draft Pending', badge: 'bg-slate-500/10 text-slate-700 border-slate-300', dot: 'bg-slate-400' }
};

export default function JCLESignatures() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [signatures, setSignatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_esignatures WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setSignatures(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load e-signatures');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              E-Signatures & Document Execution
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cryptographic signature pipeline, signer tracking, and audit verification certificates
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Signers</th>
                <th className="py-3 px-4">Sent Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {signatures.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No active signature requests.
                  </td>
                </tr>
              ) : (
                signatures.map(s => {
                  const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.sent;
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">{s.document_title || 'Contract Document'}</td>
                      <td className="py-3.5 px-4 text-foreground">{s.signer_names || 'Signers'}</td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{s.sent_date || 'Recent'}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border gap-1", st.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
