import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { Pill, Receipt, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

export default function PharmacyCustomerPortal() {
  const { user } = useAuth();

  const { data: customer } = useQuery({
    queryKey: ['pharmacy-customer', user?.email],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM pharmacy_customers WHERE email = ? AND company_id = ? LIMIT 1`,
        [user?.email, user?.company_id]
      );
      return rows?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['pharmacy-portal-prescriptions', customer?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM pharmacy_prescriptions WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10`,
        [customer?.id]
      );
      return rows || [];
    },
    enabled: !!customer?.id,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['pharmacy-portal-purchases', customer?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM pharmacy_sales WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10`,
        [customer?.id]
      );
      return rows || [];
    },
    enabled: !!customer?.id,
  });

  const statusColor = (s) => ({
    dispensed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-blue-100 text-blue-700',
    expired: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center">
          <Pill className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Prescriptions</h1>
          <p className="text-muted-foreground text-sm">View your prescription history and purchase records.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Pill} label="Active Prescriptions" value={prescriptions.filter(p => p.status === 'pending' || p.status === 'ready').length} color="bg-green-100 text-green-700" />
        <StatCard icon={CheckCircle} label="Dispensed" value={prescriptions.filter(p => p.status === 'dispensed').length} color="bg-blue-100 text-blue-700" />
        <StatCard icon={Receipt} label="Purchase History" value={purchases.length} color="bg-purple-100 text-purple-700" />
      </div>

      {/* Prescriptions */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><Pill className="w-4 h-4 text-primary" /> Prescriptions</h2>
        </div>
        {prescriptions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No prescriptions found.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {prescriptions.map(p => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.drug_name || p.medication || 'Prescription'}</p>
                  <p className="text-xs text-muted-foreground">Dr. {p.prescribing_doctor || p.doctor || '—'}</p>
                  <p className="text-xs text-muted-foreground">{p.created_at ? format(new Date(p.created_at), 'dd MMM yyyy') : ''}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={`text-xs ${statusColor(p.status)}`}>{p.status || 'pending'}</Badge>
                  {p.refills_remaining !== undefined && (
                    <p className="text-xs text-muted-foreground">Refills: {p.refills_remaining}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase History */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" /> Purchase History</h2>
        </div>
        {purchases.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No purchases recorded.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {purchases.map(s => (
              <div key={s.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Purchase #{s.receipt_number || s.id?.slice(0,8)}</p>
                  <p className="text-xs text-muted-foreground">{s.created_at ? format(new Date(s.created_at), 'dd MMM yyyy, h:mm a') : ''}</p>
                </div>
                <p className="font-bold text-sm">{s.total ? `GHS ${Number(s.total).toLocaleString()}` : '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
