import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { Home, CreditCard, Wrench, FileText, Calendar, CheckCircle2, Clock, AlertCircle, Plus, Sparkles, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function JCLTenantPortal() {
  const { user } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({ title: '', issue_type: 'plumbing', description: '', priority: 'medium' });

  const { data: lease, isLoading: isLoadingLease } = useQuery({
    queryKey: ['portal-jcl-lease', user?.email],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT l.*, p.address as property_address, p.property_type, p.city, p.state
         FROM univ_re_leases l
         LEFT JOIN univ_re_properties p ON l.property_id = p.id
         WHERE l.tenant_email = ? AND l.company_id = ? LIMIT 1`,
        [user?.email, user?.company_id]
      );
      if (rows && rows.length > 0) {
        const item = rows[0];
        item.property = { address: item.property_address, property_type: item.property_type, city: item.city, state: item.state };
        return item;
      }
      return null;
    },
    enabled: !!user?.email,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['portal-jcl-rent-payments', lease?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM univ_re_rent_payments WHERE lease_id = ? ORDER BY payment_date DESC LIMIT 10`,
        [lease?.id]
      );
      return rows || [];
    },
    enabled: !!lease?.id,
  });

  const { data: maintenance = [], refetch: refetchMaintenance } = useQuery({
    queryKey: ['portal-jcl-maintenance', lease?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM univ_re_maintenance WHERE lease_id = ? ORDER BY created_at DESC LIMIT 10`,
        [lease?.id]
      );
      return rows || [];
    },
    enabled: !!lease?.id,
  });

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    try {
      const newId = crypto.randomUUID();
      await powerSync.execute(
        `INSERT INTO univ_re_maintenance (id, company_id, lease_id, property_id, title, issue_type, description, priority, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
        [newId, user?.company_id, lease?.id, lease?.property_id, requestData.title, requestData.issue_type, requestData.description, requestData.priority, new Date().toISOString()]
      );
      toast.success('Maintenance request submitted');
      setShowRequestForm(false);
      setRequestData({ title: '', issue_type: 'plumbing', description: '', priority: 'medium' });
      refetchMaintenance();
    } catch (_err) {
      toast.error('Failed to submit request');
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'resolved':
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase">Paid / Resolved</Badge>;
      case 'pending':
      case 'in_progress':
        return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase">In Progress</Badge>;
      case 'overdue':
        return <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase">Overdue</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold uppercase">{status || 'Open'}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white border border-emerald-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Resident Tenant Self-Service Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome Back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Track lease contract terms, view payment history ledger, and submit property maintenance requests directly to management.
            </p>
          </div>

          <Button
            onClick={() => setShowRequestForm(true)}
            disabled={!lease}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-emerald-950/40 gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" /> Request Maintenance
          </Button>
        </div>
      </div>

      {/* Lease Details */}
      {lease ? (
        <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-foreground">{lease.property?.address || 'Residential Unit'}</h2>
                <p className="text-xs text-muted-foreground">
                  {[lease.property?.city, lease.property?.state].filter(Boolean).join(', ') || 'Leased Property'}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold uppercase">
              {lease.status || 'Active Lease'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/30 border border-border/60">
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">Lease Start</span>
              <span className="text-xs font-bold text-foreground">{lease.start_date ? format(new Date(lease.start_date), 'dd MMM yyyy') : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">Lease Expiry</span>
              <span className="text-xs font-bold text-foreground">{lease.end_date ? format(new Date(lease.end_date), 'dd MMM yyyy') : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">Monthly Rent</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(lease.monthly_rent || 0, 'USD')}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">Deposit Held</span>
              <span className="text-xs font-bold text-foreground font-mono">{formatCurrency(lease.security_deposit || 0, 'USD')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-border text-center bg-card">
          <Home className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">No Active Lease Linked</p>
          <p className="text-xs text-muted-foreground mt-1">Your property manager has not linked an active lease agreement to {user?.email}.</p>
        </div>
      )}

      {/* 2-Column Ledger & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rent Payments Ledger */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" /> Rent Payment Ledger
            </h3>
            <span className="text-xs font-semibold text-muted-foreground">{payments.length} Payments</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No rent payment records logged yet.
            </div>
          ) : (
            <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-muted/20">
              {payments.map(p => (
                <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-card transition-colors">
                  <div>
                    <p className="text-xs font-bold text-foreground">{p.period || (p.payment_date ? format(new Date(p.payment_date), 'MMMM yyyy') : 'Rent Payment')}</p>
                    <p className="text-[10px] text-muted-foreground">{p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : 'Pending'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold font-mono text-foreground">{formatCurrency(p.amount || 0, 'USD')}</span>
                    {statusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Requests */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4 text-emerald-600" /> Maintenance Tickets
            </h3>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 gap-1" onClick={() => setShowRequestForm(true)}>
              <Plus className="h-3.5 w-3.5" /> New Ticket
            </Button>
          </div>

          {maintenance.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No active maintenance tickets requested.
            </div>
          ) : (
            <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-muted/20">
              {maintenance.map(m => (
                <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-card transition-colors">
                  <div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{m.title || m.issue_type || 'Maintenance Ticket'}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{m.description || 'No description provided'}</p>
                  </div>
                  {statusBadge(m.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Maintenance Drawer */}
      <Sheet open={showRequestForm} onOpenChange={setShowRequestForm}>
        <SheetContent className="w-full max-w-md sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">Request Maintenance Service</SheetTitle>
            <SheetDescription className="text-xs">Submit a work order ticket to your property management team.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateMaintenance} className="space-y-4 mt-6">
            <div>
              <Label className="text-xs font-semibold">Issue Title *</Label>
              <Input
                placeholder="e.g. Leaking kitchen faucet"
                value={requestData.title}
                onChange={e => setRequestData({ ...requestData, title: e.target.value })}
                required
                className="h-9 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Issue Category</Label>
              <select
                value={requestData.issue_type}
                onChange={e => setRequestData({ ...requestData, issue_type: e.target.value })}
                className="w-full h-9 text-xs border border-border rounded-lg px-3 bg-background mt-1"
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC / Heating & Air</option>
                <option value="appliance">Appliance Repair</option>
                <option value="structural">Structural / Windows</option>
                <option value="other">Other Maintenance</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Detailed Description</Label>
              <Textarea
                placeholder="Describe the issue, location in the property, and preferred repair times..."
                value={requestData.description}
                onChange={e => setRequestData({ ...requestData, description: e.target.value })}
                className="text-xs mt-1 h-24"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9">
                Submit Service Ticket
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)} className="h-9 text-xs">
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
