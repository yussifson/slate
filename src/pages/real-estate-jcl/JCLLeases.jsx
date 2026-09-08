import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, DollarSign, Plus, Search,
  Edit, Trash2, AlertCircle, RefreshCw, Eye,
  Grid, List, Sparkles, Building2
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STATUS_CONFIG = {
  active: { label: 'Active Tenancy', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  pending: { label: 'Pending Signature', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  expired: { label: 'Expired', badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30' },
  terminated: { label: 'Terminated', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' }
};

export default function JCLLeases() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sheets & Modals
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorLease, setInspectorLease] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: '',
    propertyAddress: '',
    tenantId: '',
    tenantName: '',
    landlordName: 'JCL Properties',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
    monthlyRent: 2500,
    securityDeposit: 5000,
    status: 'active',
    agentName: user?.user_metadata?.full_name || 'Assigned Broker',
    terms: '12-Month standard residential tenancy agreement'
  });

  const fetchLeasesData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [leaseRes, propRes, clientRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      const leaseList = leaseRes.rows._array || Array.from(leaseRes.rows || []);
      const propList = propRes.rows._array || Array.from(propRes.rows || []);
      const clientList = clientRes.rows._array || Array.from(clientRes.rows || []);

      setLeases(leaseList);
      setProperties(propList);
      setClients(clientList);
    } catch (_err) {
      toast.error('Failed to load leases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeasesData();
  }, [companyId]);

  // Statistics
  const stats = useMemo(() => {
    const total = leases.length;
    const activeLeases = leases.filter(l => l.status === 'active');
    const monthlyRentRoll = activeLeases.reduce((sum, l) => sum + (Number(l.monthly_rent) || 0), 0);
    const annualRentRoll = monthlyRentRoll * 12;

    const expiringSoon = activeLeases.filter(l => {
      if (!l.end_date) return false;
      const diff = differenceInDays(new Date(l.end_date), new Date());
      return diff >= 0 && diff <= 60;
    }).length;

    return { total, activeCount: activeLeases.length, monthlyRentRoll, annualRentRoll, expiringSoon };
  }, [leases]);

  // Filtered Leases
  const filteredLeases = useMemo(() => {
    return leases.filter(l => {
      const matchSearch = !search ||
        l.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        l.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.agent_name?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || l.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [leases, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      propertyId: properties[0]?.id || '',
      propertyAddress: properties[0]?.address || '',
      tenantId: clients[0]?.id || '',
      tenantName: clients[0]?.name || '',
      landlordName: 'JCL Properties',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
      monthlyRent: 2500,
      securityDeposit: 5000,
      status: 'active',
      agentName: user?.user_metadata?.full_name || 'Assigned Broker',
      terms: '12-Month standard residential tenancy agreement'
    });
    setShowFormSheet(true);
  };

  const handleOpenEdit = (l) => {
    setEditingId(l.id);
    setFormData({
      propertyId: l.property_id || '',
      propertyAddress: l.property_address || '',
      tenantId: l.tenant_id || '',
      tenantName: l.tenant_name || '',
      landlordName: l.landlord_name || 'JCL Properties',
      startDate: l.start_date || '',
      endDate: l.end_date || '',
      monthlyRent: l.monthly_rent || 0,
      securityDeposit: l.security_deposit || 0,
      status: l.status || 'active',
      agentName: l.agent_name || '',
      terms: l.terms || ''
    });
    setShowFormSheet(true);
  };

  const handleSaveLease = async (e) => {
    e.preventDefault();
    if (!formData.propertyAddress || !formData.tenantName) {
      toast.error('Property address and tenant name are required');
      return;
    }

    try {
      const now = new Date().toISOString();

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_leases SET
            property_id = ?, property_address = ?, tenant_id = ?, tenant_name = ?,
            landlord_name = ?, start_date = ?, end_date = ?, monthly_rent = ?,
            security_deposit = ?, status = ?, terms = ?, agent_name = ?, updated_at = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.propertyId || null, formData.propertyAddress,
            formData.tenantId || null, formData.tenantName,
            formData.landlordName || null, formData.startDate,
            formData.endDate, Number(formData.monthlyRent) || 0,
            Number(formData.securityDeposit) || 0, formData.status,
            formData.terms || null, formData.agentName || null,
            now, editingId, companyId
          ]
        );
        toast.success('Lease agreement updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_leases (
            id, created_at, company_id, property_id, property_address,
            tenant_id, tenant_name, landlord_name, start_date, end_date,
            monthly_rent, security_deposit, status, terms, agent_id, agent_name, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId,
            formData.propertyId || null, formData.propertyAddress,
            formData.tenantId || null, formData.tenantName,
            formData.landlordName || null, formData.startDate,
            formData.endDate, Number(formData.monthlyRent) || 0,
            Number(formData.securityDeposit) || 0, formData.status,
            formData.terms || null, user?.id || null, formData.agentName || null,
            now
          ]
        );
        toast.success('Lease agreement executed');
      }

      setShowFormSheet(false);
      fetchLeasesData();
      if (inspectorLease && inspectorLease.id === editingId) {
        setInspectorLease(prev => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error('Failed to save lease');
    }
  };

  const handleDeleteLease = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_leases WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success('Lease record removed');
      setDeleteTarget(null);
      if (inspectorLease?.id === deleteTarget.id) setInspectorLease(null);
      fetchLeasesData();
    } catch (_err) {
      toast.error('Failed to delete lease');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Tenancy Leases & Agreements
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Residential & commercial lease agreements, rent roll schedules, and expiry tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeasesData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Lease Agreement
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Leases</p>
              <p className="text-2xl font-bold text-foreground">{stats.activeCount}</p>
              <p className="text-[11px] text-muted-foreground">Occupied rental units</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Rent Roll</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {formatCurrency(stats.monthlyRentRoll, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Recurring monthly revenue</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Annualized Roll</p>
              <p className="text-2xl font-bold text-foreground truncate">
                {formatCurrency(stats.annualRentRoll, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Total contracted value</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiring in 60d</p>
              <p className={cn("text-2xl font-bold", stats.expiringSoon > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                {stats.expiringSoon}
              </p>
              <p className="text-[11px] text-muted-foreground">Upcoming renewals</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters & View Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, tenant, agent..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="active" className="text-xs">Active Tenancies</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending Signatures</SelectItem>
              <SelectItem value="expired" className="text-xs">Expired</SelectItem>
              <SelectItem value="terminated" className="text-xs">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'grid' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="Grid View"
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'list' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="List View"
          >
            <List className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Body: Grid or List ── */}
      {filteredLeases.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No leases found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No lease agreements match your filters.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Lease
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeases.map(lease => {
            const st = STATUS_CONFIG[lease.status] || STATUS_CONFIG.active;

            return (
                <div
                  key={lease.id}
                  onClick={() => setInspectorLease(lease)}
                  className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  {/* Colour Banner Header */}
                  <div className={cn(
                    "relative h-28 flex flex-col justify-between p-4 overflow-hidden",
                    lease.status === 'active' ? 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500' :
                    lease.status === 'pending' ? 'bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400' :
                    lease.status === 'expired' ? 'bg-gradient-to-br from-rose-700 via-rose-600 to-pink-500' :
                    'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400'
                  )}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="flex items-start justify-between relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                        Tenancy Agreement
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {st.label}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Monthly Rent</p>
                      <p className="text-2xl font-extrabold text-white tracking-tight">
                        {formatCurrency(lease.monthly_rent, 'USD')}<span className="text-xs font-normal opacity-80">/mo</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <h3 className="font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {lease.property_address}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Tenant: <strong className="text-foreground">{lease.tenant_name}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-muted-foreground block mb-0.5">Start Date</span>
                        <span className="font-bold text-foreground">{lease.start_date || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-semibold text-muted-foreground block mb-0.5">End Date</span>
                        <span className="font-bold text-foreground">{lease.end_date || 'Ongoing'}</span>
                      </div>
                    </div>

                    {lease.security_deposit > 0 && (
                      <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-muted-foreground font-medium">Security Deposit</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(lease.security_deposit, 'USD')}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[8px] font-extrabold shrink-0">
                          {(lease.agent_name || 'A')[0].toUpperCase()}
                        </div>
                        <span className="truncate font-medium">{lease.agent_name || 'Assigned Agent'}</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                          onClick={() => setInspectorLease(lease)}
                          title="Inspect Lease"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(lease)}
                          title="Edit Lease"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => setDeleteTarget(lease)}
                          title="Delete Lease"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Property Address</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Monthly Rent</th>
                  <th className="py-3 px-4">Security Deposit</th>
                  <th className="py-3 px-4">Lease Term</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeases.map(lease => {
                  const st = STATUS_CONFIG[lease.status] || STATUS_CONFIG.active;
                  return (
                    <tr
                      key={lease.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setInspectorLease(lease)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                        {lease.property_address}
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-medium">{lease.tenant_name}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(lease.monthly_rent, 'USD')}/mo
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {formatCurrency(lease.security_deposit, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono">
                        {lease.start_date} ~ {lease.end_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border", st.badge)}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{lease.agent_name || 'Assigned'}</td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setInspectorLease(lease)}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(lease)}
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600"
                            onClick={() => setDeleteTarget(lease)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Slide-Over Inspector ── */}
      <Sheet open={!!inspectorLease} onOpenChange={open => !open && setInspectorLease(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          {inspectorLease && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                    Lease Contract
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium border",
                      (STATUS_CONFIG[inspectorLease.status] || STATUS_CONFIG.active).badge
                    )}
                  >
                    {(STATUS_CONFIG[inspectorLease.status] || STATUS_CONFIG.active).label}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground mt-2">
                  {inspectorLease.property_address}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Tenant: <strong className="text-foreground">{inspectorLease.tenant_name}</strong>
                </SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-6 flex-1">
                <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Monthly Rent</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(inspectorLease.monthly_rent, 'USD')}/mo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Security Deposit</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(inspectorLease.security_deposit, 'USD')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                    <p className="text-[10px] uppercase text-muted-foreground">Tenancy Period</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{inspectorLease.start_date} ~ {inspectorLease.end_date}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                    <p className="text-[10px] uppercase text-muted-foreground">Assigned Broker</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{inspectorLease.agent_name || 'Assigned'}</p>
                  </div>
                </div>

                {inspectorLease.terms && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contract Terms</h4>
                    <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed">
                      {inspectorLease.terms}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(inspectorLease)}
                  className="text-xs gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Lease
                </Button>

                <Button
                  size="sm"
                  onClick={() => setInspectorLease(null)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 6. Create / Edit Lease Modal ── */}
      <Sheet open={showFormSheet} onOpenChange={setShowFormSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          <SheetHeader className="p-6 border-b border-border bg-muted/20">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Lease Agreement' : 'New Tenancy Lease Agreement'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Execute a lease agreement, set monthly rent and security deposits
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveLease} className="p-6 space-y-4 flex-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Property Address *</Label>
              <Input
                required
                placeholder="e.g. 104 Oceanfront Boulevard, Unit 4B"
                value={formData.propertyAddress}
                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tenant Name *</Label>
                <Input
                  required
                  placeholder="e.g. David Sterling"
                  value={formData.tenantName}
                  onChange={e => setFormData({ ...formData, tenantName: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Landlord / Entity</Label>
                <Input
                  placeholder="e.g. JCL Properties"
                  value={formData.landlordName}
                  onChange={e => setFormData({ ...formData, landlordName: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Monthly Rent ($) *</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.monthlyRent}
                  onChange={e => setFormData({ ...formData, monthlyRent: e.target.value })}
                  className="text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Security Deposit ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.securityDeposit}
                  onChange={e => setFormData({ ...formData, securityDeposit: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Start Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">End Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Lease Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={val => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">Active Tenancy</SelectItem>
                    <SelectItem value="pending" className="text-xs">Pending Signature</SelectItem>
                    <SelectItem value="expired" className="text-xs">Expired</SelectItem>
                    <SelectItem value="terminated" className="text-xs">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assigned Agent</Label>
                <Input
                  placeholder="e.g. Marcus Vance"
                  value={formData.agentName}
                  onChange={e => setFormData({ ...formData, agentName: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Terms & Special Conditions</Label>
              <textarea
                rows={3}
                placeholder="Renewal terms, utilities inclusion, pet policies..."
                value={formData.terms}
                onChange={e => setFormData({ ...formData, terms: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFormSheet(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
              >
                {editingId ? 'Save Changes' : 'Execute Lease'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── 7. Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Lease Agreement?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete the lease for <strong className="text-foreground">{deleteTarget?.property_address}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLease}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
