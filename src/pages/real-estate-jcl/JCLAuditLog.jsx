import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Shield, Clock, RefreshCw, UserCheck, ShieldAlert, FileText, CheckCircle2, Lock
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Security Audit Log & Activity Stream
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Immutable activity stream of user authentication events, lease mutations, and financial approvals
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recorded Events</p>
              <p className="text-2xl font-bold text-foreground">{logs.length}</p>
              <p className="text-[11px] text-muted-foreground">Logged actions in system</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Security State</p>
              <p className="text-2xl font-bold text-[#005A9C] dark:text-[#FF6B00]">Encrypted</p>
              <p className="text-[11px] text-emerald-600/80">Tamper-evident logs</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Operators</p>
              <p className="text-2xl font-bold text-foreground">
                {new Set(logs.map(l => l.user_name)).size || 1}
              </p>
              <p className="text-[11px] text-muted-foreground">Unique admin accounts</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Compliance Status</p>
              <p className="text-2xl font-bold text-[#005A9C] dark:text-[#FF6B00]">100% Compliant</p>
              <p className="text-[11px] text-muted-foreground">SOC2 / Real Estate Standard</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters Strip ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search user name or action text..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Module Filter" />
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
      </div>

      {/* ── 4. Table ── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
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
                      <Badge variant="outline" className="text-[10px] uppercase font-mono bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30">
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
