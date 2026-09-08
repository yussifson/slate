import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench, AlertTriangle, Clock, CheckCircle2, Home, User, Zap, Plus, Search, RefreshCw, DollarSign, Shield
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const PRIORITY_CONFIG = {
  critical: { label: 'Critical Urgent', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' },
  high: { label: 'High Priority', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  medium: { label: 'Standard Ticket', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  low: { label: 'Routine Maintenance', badge: 'bg-slate-500/10 text-slate-700 border-slate-300' }
};

const STATUS_CONFIG = {
  open: { label: 'Open Ticket', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  in_progress: { label: 'Work In Progress', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30', dot: 'bg-blue-500' },
  scheduled: { label: 'Contractor Scheduled', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30', dot: 'bg-purple-500' },
  completed: { label: 'Repair Resolved', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' }
};

export default function JCLMaintenance() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyAddress: '',
    unitNumber: 'Apt 4B',
    priority: 'high',
    status: 'open',
    estimatedCost: 250,
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_maintenance_requests WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRequests(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load maintenance requests');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const stats = useMemo(() => {
    const total = requests.length;
    const critical = requests.filter(r => r.priority === 'critical' || r.priority === 'high').length;
    const inProgress = requests.filter(r => r.status === 'in_progress' || r.status === 'scheduled').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const totalCost = requests.reduce((sum, r) => sum + (Number(r.estimated_cost) || 0), 0);

    return { total, critical, inProgress, completed, totalCost };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchSearch = !search ||
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.property_address?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_re_maintenance_requests SET status = ? WHERE id = ? AND company_id = ?`,
        [newStatus, id, companyId]
      );
      toast.success(`Work order status updated to ${newStatus}`);
      fetchData();
    } catch (_err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Maintenance Orders & Facility Repairs
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Work order dispatching, priority repair tickets, and vendor dispatch ledger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Maintenance Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Critical Tickets</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.critical}</p>
              <p className="text-[11px] text-muted-foreground">High priority issues</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work In Progress</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</p>
              <p className="text-[11px] text-muted-foreground">Contractor dispatched</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed Repairs</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
              <p className="text-[11px] text-emerald-600/80">Resolved tickets</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Repair Cost</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalCost, 'USD')}</p>
              <p className="text-[11px] text-muted-foreground">Budgeted expenditure</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4">Ticket / Issue</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Est. Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No maintenance tickets found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(r => {
                  const pr = PRIORITY_CONFIG[r.priority] || PRIORITY_CONFIG.medium;
                  const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.open;
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">{r.title || 'Facility Issue'}</td>
                      <td className="py-3.5 px-4 text-foreground">{r.property_address || 'Unit Address'}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase", pr.badge)}>
                          {pr.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">{formatCurrency(r.estimated_cost || 0, 'USD')}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border gap-1", st.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Select value={r.status} onValueChange={v => handleStatusChange(r.id, v)}>
                          <SelectTrigger className="h-7 text-[10px] w-[130px] ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open" className="text-xs">Open</SelectItem>
                            <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                            <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
                            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                          </SelectContent>
                        </Select>
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
