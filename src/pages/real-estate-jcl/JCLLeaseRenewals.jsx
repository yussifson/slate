import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, RefreshCw, Plus, CheckCircle2, Clock, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function JCLLeaseRenewals() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [renewals, setRenewals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_lease_renewals WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRenewals(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load lease renewals');
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
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Lease Renewals & Expiry Countdown
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated lease expiration alerts, rent increase proposals, and renewal contract generation
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
                <th className="py-3 px-4">Property / Tenant</th>
                <th className="py-3 px-4">Current Rent</th>
                <th className="py-3 px-4">Proposed Rent</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {renewals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No pending lease renewals.
                  </td>
                </tr>
              ) : (
                renewals.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{r.tenant_name || 'Tenant Lease'}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">{formatCurrency(r.current_rent || 0, 'USD')}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.proposed_rent || 0, 'USD')}</td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">{r.expiration_date || 'Upcoming'}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-700 border-amber-500/30">
                        {r.status || 'Proposal Sent'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
