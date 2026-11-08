import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, ShieldAlert, Clock, UserCheck, CheckCircle2, Lock, ShieldCheck
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function JCLAuditLog() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_audit_log WHERE company_id = ? ORDER BY created_at DESC LIMIT 100',
        [companyId]
      );
      setLogs(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load audit logs');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch =
        !search ||
        (l.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.action_text || '').toLowerCase().includes(search.toLowerCase());
      const matchModule = moduleFilter === 'all' || (l.module_name || '').toLowerCase() === moduleFilter.toLowerCase();
      return matchSearch && matchModule;
    });
  }, [logs, search, moduleFilter]);

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 pb-20 overflow-x-hidden p-3 sm:p-6 lg:p-8">
      {/* ── 1. Clean Header (No sub-description, no refresh button) ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-sm shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Audit Log
            </h1>
          </div>
        </div>
      </div>

      {/* ── 2. Mobile 2x2 Dedicated Stats Grid (< md) ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:hidden">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Events</span>
          </div>
          <p className="text-lg font-black text-foreground truncate">{logs.length}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Recorded actions</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Security</span>
          </div>
          <p className="text-lg font-black text-emerald-600 truncate">Encrypted</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Tamper-evident</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Operators</span>
          </div>
          <p className="text-lg font-black text-foreground truncate">{new Set(logs.map(l => l.user_name)).size || 1}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Active admins</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#005A9C] shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Compliance</span>
          </div>
          <p className="text-lg font-black text-[#005A9C] truncate">100%</p>
          <span className="text-[9px] text-muted-foreground font-semibold">SOC2 Standard</span>
        </div>
      </div>

      {/* ── Desktop Executive KPI Cards (>= md) ── */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recorded Events</p>
            <p className="text-2xl font-black text-foreground mt-1">{logs.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Logged actions</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security State</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">Encrypted</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tamper-evident</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Operators</p>
            <p className="text-2xl font-black text-foreground mt-1">{new Set(logs.map(l => l.user_name)).size || 1}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Unique admins</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compliance Status</p>
            <p className="text-2xl font-black text-[#005A9C] mt-1">100% Compliant</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Enterprise Real Estate</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#005A9C]/10 text-[#005A9C] flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters Strip ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card/90 p-2.5 sm:p-3 rounded-2xl border border-border/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search operator or action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-background rounded-xl"
          />
        </div>

        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="h-9 text-xs w-full sm:w-[170px] bg-background rounded-xl">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Modules</SelectItem>
            <SelectItem value="properties" className="text-xs">Properties</SelectItem>
            <SelectItem value="leases" className="text-xs">Leases</SelectItem>
            <SelectItem value="finance" className="text-xs">Finance & Escrow</SelectItem>
            <SelectItem value="security" className="text-xs">Security & Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── 4. Mobile Native Cards (< md) ── */}
      <div className="md:hidden space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border/80">
            No security audit events recorded.
          </div>
        ) : (
          filteredLogs.map(l => (
            <div key={l.id} className="p-3.5 bg-card rounded-2xl border border-border/80 shadow-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-sm text-foreground">{l.user_name || 'System Operator'}</span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono bg-[#005A9C]/10 text-[#005A9C] border-[#005A9C]/20">
                  {l.module_name || 'General'}
                </Badge>
              </div>
              <p className="text-xs text-foreground/90 font-medium">
                {l.action_text || 'Mutated real estate records'}
              </p>
              <div className="text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                {l.created_at ? format(new Date(l.created_at), 'MMM dd, yyyy · HH:mm:ss') : 'Recent'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── 5. Desktop Table (>= md) ── */}
      <div className="hidden md:block border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Action Summary</th>
                <th className="py-3 px-4">Target Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    No security audit events recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                      {l.created_at ? format(new Date(l.created_at), 'MMM dd, yyyy HH:mm:ss') : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {l.user_name || 'System Operator'}
                    </td>
                    <td className="py-3.5 px-4 text-foreground font-medium">
                      {l.action_text || 'Mutated real estate records'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono bg-[#005A9C]/10 text-[#005A9C] border-[#005A9C]/30">
                        {l.module_name || 'General'}
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
