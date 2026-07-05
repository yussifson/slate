import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { Home, CreditCard, Wrench, FileText, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function TenantPortal() {
  const { user } = useAuth();

  const { data: lease } = useQuery({
    queryKey: ['portal-lease', user?.email],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT l.*, p.address as property_address, p.property_type
         FROM real_estate_leases l
         LEFT JOIN real_estate_properties p ON l.property_id = p.id
         WHERE l.tenant_email = ? AND l.company_id = ? LIMIT 1`,
        [user?.email, user?.company_id]
      );
      if (rows && rows.length > 0) {
        const lease = rows[0];
        lease.property = { address: lease.property_address, property_type: lease.property_type };
        return lease;
      }
      return null;
    },
    enabled: !!user?.email,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['portal-rent-payments', lease?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM real_estate_rent_payments WHERE lease_id = ? ORDER BY payment_date DESC LIMIT 10`,
        [lease?.id]
      );
      return rows || [];
    },
    enabled: !!lease?.id,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['portal-maintenance', lease?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM real_estate_maintenance WHERE lease_id = ? ORDER BY created_at DESC LIMIT 10`,
        [lease?.id]
      );
      return rows || [];
    },
    enabled: !!lease?.id,
  });

  const statusColor = (s) => ({
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    open: 'bg-primary/10 text-primary/90',
    resolved: 'bg-green-100 text-green-700',
    in_progress: 'bg-orange-100 text-orange-700',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenant Portal</h1>
        <p className="text-muted-foreground text-sm">Manage your lease, payments, and maintenance requests.</p>
      </div>

      {/* Lease Overview */}
      {lease ? (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{lease.property?.address || lease.property_address || 'Your Property'}</h2>
              <p className="text-sm text-muted-foreground">{lease.property?.property_type || 'Residential'}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div><p className="text-xs text-muted-foreground">Lease Start</p><p className="font-medium text-sm">{lease.start_date ? format(new Date(lease.start_date), 'dd MMM yyyy') : '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Lease End</p><p className="font-medium text-sm">{lease.end_date ? format(new Date(lease.end_date), 'dd MMM yyyy') : '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Monthly Rent</p><p className="font-medium text-sm">{lease.monthly_rent ? `GHS ${Number(lease.monthly_rent).toLocaleString()}` : '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge className="text-xs bg-green-100 text-green-700">{lease.status || 'Active'}</Badge></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 p-8 text-center text-muted-foreground">
          <Home className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No active lease found.</p>
          <p className="text-sm mt-1">Your lease information will appear here once linked by your property manager.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={CreditCard} label="Payments Made" value={payments.filter(p => p.status === 'paid').length} color="bg-green-100 text-green-700" />
        <StatCard icon={AlertCircle} label="Outstanding" value={payments.filter(p => p.status === 'pending' || p.status === 'overdue').length} color="bg-red-100 text-red-700" />
        <StatCard icon={Wrench} label="Maintenance Requests" value={maintenance.length} color="bg-primary/10 text-primary/90" />
      </div>

      {/* Payment History */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Rent Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No payment records found.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {payments.map(p => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.period || (p.payment_date ? format(new Date(p.payment_date), 'MMMM yyyy') : '—')}</p>
                  <p className="text-xs text-muted-foreground">{p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : 'Pending'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{p.amount ? `GHS ${Number(p.amount).toLocaleString()}` : '—'}</span>
                  <Badge className={`text-xs ${statusColor(p.status)}`}>{p.status || 'pending'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Requests */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Maintenance Requests</h2>
          <Button size="sm" variant="outline" className="text-xs">New Request</Button>
        </div>
        {maintenance.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No maintenance requests yet.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {maintenance.map(m => (
              <div key={m.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{m.title || m.issue_type || 'Maintenance Request'}</p>
                  <p className="text-xs text-muted-foreground">{m.description?.slice(0, 60) || ''}{m.description?.length > 60 ? '...' : ''}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.created_at ? format(new Date(m.created_at), 'dd MMM yyyy') : ''}</p>
                </div>
                <Badge className={`text-xs ${statusColor(m.status)}`}>{m.status || 'open'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
