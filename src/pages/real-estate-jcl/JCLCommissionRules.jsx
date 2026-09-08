import React, { useState, useEffect } from 'react';
import {
  Percent, Plus, Edit, Trash2, RefreshCw, Award
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function JCLCommissionRules() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_commission_rules WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRules(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load commission rules');
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
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Commission Policy Tiers & Rules
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Graduated brokerage split tiers, sales target thresholds, and agent commission structures
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
                <th className="py-3 px-4">Tier Name</th>
                <th className="py-3 px-4">Min Target Volume</th>
                <th className="py-3 px-4">Agent Split %</th>
                <th className="py-3 px-4">Brokerage Fee %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No custom commission tiers configured. Standard 70/30 split active.
                  </td>
                </tr>
              ) : (
                rules.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{r.rule_name || 'Standard Tier'}</td>
                    <td className="py-3.5 px-4 font-mono">${(r.min_volume || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.agent_split || 70}%</td>
                    <td className="py-3.5 px-4 font-mono">{100 - (r.agent_split || 70)}%</td>
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
