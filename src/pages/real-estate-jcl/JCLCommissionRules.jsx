import React, { useState, useEffect } from 'react';
import {
  Percent, Plus, Edit, Trash2, Award, Shield, DollarSign
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';

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
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans overflow-x-hidden">
      {/* ── 1. Header (Clean mobile native header, no sub-description, no refresh button) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <Percent className="h-5 w-5" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
            Commission Rules
          </h1>
        </div>
      </div>

      {/* ── 2. Dedicated Mobile 2x2 Stats Grid (< md) & Desktop Row (>= md) ── */}
      <div className="grid grid-cols-2 md:hidden gap-2.5">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Award className="w-3.5 h-3.5 text-[#005A9C]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Policy Tiers</span>
          </div>
          <p className="text-sm font-black text-foreground truncate">{rules.length || 1}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Configured</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Percent className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Base Split</span>
          </div>
          <p className="text-sm font-black text-emerald-600 truncate">70% / 30%</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Agent / Firm</span>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commission Policy Tiers</div>
          <div className="text-2xl font-bold mt-1">{rules.length || 1} active</div>
        </div>
        <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base Policy Split</div>
          <div className="text-2xl font-bold mt-1 text-[#005A9C]">70% Agent / 30% Firm</div>
        </div>
      </div>

      {/* ── 3. Mobile Cards (< md) ── */}
      <div className="md:hidden space-y-2.5">
        {rules.length === 0 ? (
          <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-foreground">Standard Policy Tier</span>
              <Badge variant="outline" className="text-[9px] font-bold text-emerald-600 border-emerald-500/30">Active</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
              <span>Min Volume: $0</span>
              <span className="font-bold text-[#005A9C]">Split: 70% / 30%</span>
            </div>
          </div>
        ) : (
          rules.map(r => (
            <div key={r.id} className="bg-card border border-border/80 rounded-2xl p-3.5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">{r.rule_name || 'Tier'}</span>
                <Badge variant="outline" className="text-[9px] font-bold text-[#005A9C] border-[#005A9C]/30">{r.agent_split || 70}% Agent</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                <span>Min Volume: ${(r.min_volume || 0).toLocaleString()}</span>
                <span>Brokerage: {100 - (r.agent_split || 70)}%</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── 4. Desktop Table (>= md) ── */}
      <div className="hidden md:block border border-border rounded-2xl bg-card overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-extrabold text-[10px] uppercase">
                <th className="py-3 px-4">Tier Name</th>
                <th className="py-3 px-4">Min Target Volume</th>
                <th className="py-3 px-4">Agent Split %</th>
                <th className="py-3 px-4">Brokerage Fee %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rules.length === 0 ? (
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">Standard Policy Tier</td>
                  <td className="py-3.5 px-4 font-mono">$0</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#005A9C]">70%</td>
                  <td className="py-3.5 px-4 font-mono">30%</td>
                </tr>
              ) : (
                rules.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{r.rule_name || 'Standard Tier'}</td>
                    <td className="py-3.5 px-4 font-mono">${(r.min_volume || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#005A9C] dark:text-[#FF6B00]">{r.agent_split || 70}%</td>
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
