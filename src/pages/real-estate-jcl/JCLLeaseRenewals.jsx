import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, RefreshCw, Plus, CheckCircle2, Clock, AlertTriangle, ArrowUpRight,
  Search, Edit, Trash2, Eye, Grid, List, Sparkles, Building2, User, Phone, FileCheck, DollarSign
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { useVideo } from '@/lib/VideoContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/constants';
import { toast } from 'react-hot-toast';
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
  proposal_sent: { label: 'Proposal Sent', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  in_negotiation: { label: 'In Negotiation', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  accepted: { label: 'Renewal Approved', badge: 'bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30' },
  declined: { label: 'Notice Given / Expired', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' }
};

export default function JCLLeaseRenewals() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const { joinRoom } = useVideo();

  const [renewals, setRenewals] = useState([]);
  const [leases, setLeases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sheets & Modals
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorRenewal, setInspectorRenewal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    leaseId: '',
    tenantName: '',
    propertyAddress: '',
    currentRent: 2500,
    proposedRent: 2750,
    expirationDate: format(new Date(new Date().setMonth(new Date().getMonth() + 2)), 'yyyy-MM-dd'),
    newTermMonths: 12,
    status: 'proposal_sent',
    notes: ''
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [renRes, leaseRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_lease_renewals WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY property_address ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      const renList = renRes.rows._array || Array.from(renRes.rows || []);
      const leaseList = leaseRes.rows._array || Array.from(leaseRes.rows || []);

      setRenewals(renList);
      setLeases(leaseList);
    } catch (_err) {
      toast.error('Failed to load lease renewals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = renewals.length;
    const pending = renewals.filter(r => (r.status || 'proposal_sent') === 'proposal_sent' || r.status === 'in_negotiation').length;
    const approved = renewals.filter(r => r.status === 'accepted').length;
    const avgIncrease = renewals.length > 0
      ? renewals.reduce((acc, r) => acc + ((Number(r.proposed_rent || 0) - Number(r.current_rent || 0))), 0) / renewals.length
      : 0;

    return { total, pending, approved, avgIncrease };
  }, [renewals]);

  // Filtering
  const filteredRenewals = useMemo(() => {
    return renewals.filter(r => {
      const matchSearch =
        !search ||
        (r.tenant_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.property_address || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || (r.status || 'proposal_sent') === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [renewals, search, statusFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      leaseId: '',
      tenantName: '',
      propertyAddress: '',
      currentRent: 2500,
      proposedRent: 2750,
      expirationDate: format(new Date(new Date().setMonth(new Date().getMonth() + 2)), 'yyyy-MM-dd'),
      newTermMonths: 12,
      status: 'proposal_sent',
      notes: ''
    });
    setShowFormSheet(true);
  };

  const handleOpenEdit = (r) => {
    setEditingId(r.id);
    setFormData({
      leaseId: r.lease_id || '',
      tenantName: r.tenant_name || '',
      propertyAddress: r.property_address || '',
      currentRent: r.current_rent || 0,
      proposedRent: r.proposed_rent || 0,
      expirationDate: r.expiration_date || '',
      newTermMonths: r.new_term_months || 12,
      status: r.status || 'proposal_sent',
      notes: r.notes || ''
    });
    setShowFormSheet(true);
  };

  const handleSaveRenewal = async (e) => {
    e.preventDefault();
    if (!formData.tenantName || !formData.propertyAddress) {
      toast.error('Tenant name and property address are required');
      return;
    }

    try {
      const now = new Date().toISOString();

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_lease_renewals SET
            lease_id = ?, tenant_name = ?, property_address = ?, current_rent = ?,
            proposed_rent = ?, expiration_date = ?, new_term_months = ?, status = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.leaseId || null, formData.tenantName, formData.propertyAddress,
            Number(formData.currentRent) || 0, Number(formData.proposedRent) || 0,
            formData.expirationDate, Number(formData.newTermMonths) || 12,
            formData.status, formData.notes || null, editingId, companyId
          ]
        );
        toast.success('Lease renewal proposal updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_lease_renewals (
            id, created_at, company_id, lease_id, tenant_name, property_address,
            current_rent, proposed_rent, expiration_date, new_term_months, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId, formData.leaseId || null, formData.tenantName,
            formData.propertyAddress, Number(formData.currentRent) || 0,
            Number(formData.proposedRent) || 0, formData.expirationDate,
            Number(formData.newTermMonths) || 12, formData.status, formData.notes || null
          ]
        );
        toast.success('Lease renewal proposal created');
      }

      setShowFormSheet(false);
      fetchData();
      if (inspectorRenewal && inspectorRenewal.id === editingId) {
        setInspectorRenewal(prev => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error('Failed to save renewal proposal');
    }
  };

  const handleDeleteRenewal = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_lease_renewals WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success('Renewal proposal deleted');
      setDeleteTarget(null);
      if (inspectorRenewal?.id === deleteTarget.id) setInspectorRenewal(null);
      fetchData();
    } catch (_err) {
      toast.error('Failed to delete renewal');
    }
  };

  // Launch direct audio/video conference call with tenant
  const handleStartCallWithTenant = (tenantName) => {
    const roomName = `tenant-renewal-${companyId.slice(0, 6)}-${generateUUID().slice(0, 6)}`;
    const url = `https://meet.ffmuc.net/${roomName}`;
    joinRoom(url);
    toast.success(`Starting live renewal video consultation for ${tenantName}`);
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Lease Renewals & Expiry Hub
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated expiration countdowns, rent adjustment proposals, and direct tenant consultation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 px-4 text-xs font-bold gap-1.5 bg-[#005A9C] hover:bg-[#00477D] text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Renewal Proposal
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Renewals</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">In active renewal cycle</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
              <p className="text-[11px] text-amber-600/80">Negotiations & sent offers</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved Renewals</p>
              <p className="text-2xl font-bold text-[#005A9C] dark:text-[#FF6B00]">{stats.approved}</p>
              <p className="text-[11px] text-emerald-600/80">Contracts extended</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Rent Increase</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.avgIncrease, 'USD')}
              </p>
              <p className="text-[11px] text-[#005A9C] dark:text-[#FF6B00] flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> Lift per renewal
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters & Controls Strip ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tenant name or property address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="proposal_sent" className="text-xs">Proposal Sent</SelectItem>
              <SelectItem value="in_negotiation" className="text-xs">In Negotiation</SelectItem>
              <SelectItem value="accepted" className="text-xs">Approved</SelectItem>
              <SelectItem value="declined" className="text-xs">Notice Given / Expired</SelectItem>
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
      {filteredRenewals.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
          <FileCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No renewal proposals found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No active lease expiration proposals match your search criteria.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="mt-4 text-xs bg-[#005A9C] hover:bg-[#00477D] text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Proposal
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRenewals.map(r => {
            const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.proposal_sent;
            const bannerColor = 'from-emerald-800 via-emerald-700 to-emerald-600';
            const delta = (r.proposed_rent || 0) - (r.current_rent || 0);
            const daysLeft = r.expiration_date ? differenceInDays(new Date(r.expiration_date), new Date()) : null;

            return (
              <div
                key={r.id}
                onClick={() => setInspectorRenewal(r)}
                className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {/* Header Banner */}
                <div className={cn("relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br", bannerColor)}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                  <div className="flex items-start justify-between relative z-10">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                      Renewal Proposal
                    </span>
                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      {st.label}
                    </span>
                  </div>

                  <div className="flex items-end justify-between relative z-10">
                    <div>
                      <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest mb-0.5">Proposed Rent</p>
                      <p className="text-2xl font-extrabold text-white tracking-tight">
                        {formatCurrency(r.proposed_rent, 'USD')} <span className="text-xs font-medium text-white/80">/mo</span>
                      </p>
                    </div>
                    {daysLeft !== null && (
                      <span className={cn(
                        "text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-sm",
                        daysLeft < 30 ? "bg-amber-400 text-slate-900" : "bg-white/20 text-white"
                      )}>
                        {daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {r.property_address || 'Prime Tenancy Property'}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                      <User className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="truncate">Tenant: <strong className="text-foreground">{r.tenant_name || 'Assigned Tenant'}</strong></span>
                    </div>
                  </div>

                  {/* Rent Adjust Comparison Strip */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center font-mono">
                    <div>
                      <span className="text-[9px] uppercase text-muted-foreground block mb-0.5">Current Rate</span>
                      <span className="text-xs font-bold text-muted-foreground">{formatCurrency(r.current_rent, 'USD')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-[#005A9C] dark:text-[#FF6B00] block mb-0.5">Proposed Rate</span>
                      <span className="text-xs font-extrabold text-[#005A9C] dark:text-[#FF6B00]">{formatCurrency(r.proposed_rent, 'USD')}</span>
                    </div>
                  </div>

                  {/* Rent Delta Badge */}
                  {delta !== 0 && (
                    <div className="flex items-center justify-between text-[11px] px-3 py-1 rounded-lg bg-[#005A9C]/10 border border-[#005A9C]/20">
                      <span className="text-muted-foreground font-medium">Monthly Adjustment</span>
                      <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        {delta > 0 ? `+${formatCurrency(delta, 'USD')} (+${Math.round((delta / (r.current_rent || 1)) * 100)}%)` : formatCurrency(delta, 'USD')}
                      </span>
                    </div>
                  )}

                  {/* Footer Strip with Working Call Trigger */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] font-semibold gap-1.5 border-[#005A9C]/30 text-emerald-700 dark:text-emerald-400 hover:bg-[#005A9C]/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCallWithTenant(r.tenant_name);
                      }}
                    >
                      <Phone className="h-3 w-3" /> Call Tenant
                    </Button>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600" onClick={() => setInspectorRenewal(r)} title="Inspect">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(r)} title="Edit">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => setDeleteTarget(r)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High Density Table View */
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Property Address</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Current Rent</th>
                  <th className="py-3 px-4">Proposed Rent</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRenewals.map(r => {
                  const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.proposal_sent;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setInspectorRenewal(r)}
                    >
                      <td className="py-3.5 px-4 font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {r.property_address || 'Property Address'}
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-medium">
                        {r.tenant_name || 'Tenant'}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {formatCurrency(r.current_rent, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-[#005A9C] dark:text-[#FF6B00]">
                        {formatCurrency(r.proposed_rent, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {r.expiration_date || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-bold border", st.badge)}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 border-[#005A9C]/30 text-emerald-600"
                            onClick={() => handleStartCallWithTenant(r.tenant_name)}
                          >
                            <Phone className="h-3 w-3" /> Call
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setInspectorRenewal(r)}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(r)}
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600"
                            onClick={() => setDeleteTarget(r)}
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

      {/* ── 5. Form Sheet ── */}
      <Sheet open={showFormSheet} onOpenChange={setShowFormSheet}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingId ? 'Edit Renewal Proposal' : 'Create Lease Renewal Proposal'}</SheetTitle>
            <SheetDescription>Propose rent adjustments and set new lease terms</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveRenewal} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Select Existing Lease (Optional)</Label>
              <Select
                value={formData.leaseId}
                onValueChange={val => {
                  const sel = leases.find(l => l.id === val);
                  if (sel) {
                    setFormData({
                      ...formData,
                      leaseId: sel.id,
                      tenantName: sel.tenant_name || '',
                      propertyAddress: sel.property_address || '',
                      currentRent: sel.monthly_rent || 0,
                      proposedRent: Math.round((sel.monthly_rent || 0) * 1.08)
                    });
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue placeholder="Pick a active lease..." />
                </SelectTrigger>
                <SelectContent>
                  {leases.map(l => (
                    <SelectItem key={l.id} value={l.id} className="text-xs">
                      {l.tenant_name} — {l.property_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Tenant Name</Label>
              <Input
                value={formData.tenantName}
                onChange={e => setFormData({ ...formData, tenantName: e.target.value })}
                className="h-9 text-xs mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Property Address</Label>
              <Input
                value={formData.propertyAddress}
                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                className="h-9 text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Current Rent ($)</Label>
                <Input
                  type="number"
                  value={formData.currentRent}
                  onChange={e => setFormData({ ...formData, currentRent: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Proposed Rent ($)</Label>
                <Input
                  type="number"
                  value={formData.proposedRent}
                  onChange={e => setFormData({ ...formData, proposedRent: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Current Lease Expiry</Label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={v => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="h-9 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposal_sent" className="text-xs">Proposal Sent</SelectItem>
                    <SelectItem value="in_negotiation" className="text-xs">In Negotiation</SelectItem>
                    <SelectItem value="accepted" className="text-xs">Approved</SelectItem>
                    <SelectItem value="declined" className="text-xs">Declined / Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Negotiation Notes & Special Clauses</Label>
              <Input
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="h-9 text-xs mt-1"
                placeholder="Include maintenance upgrades or tenant incentives..."
              />
            </div>

            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white mt-2">
              Save Proposal
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── 6. Slide-Over Inspector Drawer ── */}
      <Sheet open={!!inspectorRenewal} onOpenChange={open => !open && setInspectorRenewal(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          {inspectorRenewal && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                    Tenancy Renewal
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium border gap-1.5", (STATUS_CONFIG[inspectorRenewal.status] || STATUS_CONFIG.proposal_sent).badge)}
                  >
                    {(STATUS_CONFIG[inspectorRenewal.status] || STATUS_CONFIG.proposal_sent).label}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground mt-2">
                  {inspectorRenewal.tenant_name}
                </SheetTitle>
                <SheetDescription className="text-xs flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {inspectorRenewal.property_address}
                </SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-6 flex-1">
                {/* Proposed Rent Strip */}
                <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-[#005A9C]/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Proposed Monthly Rent</p>
                    <p className="text-2xl font-black text-[#005A9C] dark:text-[#FF6B00]">
                      {formatCurrency(inspectorRenewal.proposed_rent, 'USD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Current Rent</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(inspectorRenewal.current_rent, 'USD')}</p>
                  </div>
                </div>

                {/* Direct Action Trigger Call */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tenant Consultation</h4>
                  <p className="text-xs text-muted-foreground">Connect with the tenant in a live audio/video session to review terms.</p>
                  <Button
                    onClick={() => handleStartCallWithTenant(inspectorRenewal.tenant_name)}
                    className="w-full h-9 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white gap-2"
                  >
                    <Phone className="h-4 w-4" /> Start Live Consultation Call
                  </Button>
                </div>

                {/* Notes */}
                {inspectorRenewal.notes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes & Terms</h4>
                    <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed">
                      {inspectorRenewal.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Renewal Proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the renewal proposal for {deleteTarget?.tenant_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRenewal} className="bg-rose-600 hover:bg-rose-700 text-white">
              Delete Proposal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
