import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { Building2, Wallet, Wrench, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';

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

export default function LandlordPortal() {
  const { user } = useAuth();

  const { data: properties = [] } = useQuery({
    queryKey: ['portal-landlord-props', user?.email],
    queryFn: async () => {
      const props = await powerSync.getAll(
        `SELECT * FROM real_estate_properties WHERE company_id = ? AND owner_email = ?`,
        [user?.company_id, user?.email]
      ) || [];
      if (props.length === 0) return [];
      
      const propIds = props.map(p => `'${p.id}'`).join(',');
      const leases = await powerSync.getAll(`SELECT * FROM real_estate_leases WHERE property_id IN (${propIds})`) || [];
      
      return props.map(p => ({
        ...p,
        leases: leases.filter(l => l.property_id === p.id)
      }));
    },
    enabled: !!user?.email,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['portal-landlord-maintenance', user?.email],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT m.*, p.address as property_address 
         FROM real_estate_maintenance m
         LEFT JOIN real_estate_properties p ON m.property_id = p.id
         WHERE m.company_id = ? 
         ORDER BY m.created_at DESC LIMIT 10`,
        [user?.company_id]
      ) || [];
      return rows.map(r => ({ ...r, property: { address: r.property_address } }));
    },
    enabled: !!user?.company_id,
  });

  const statusColor = (s) => ({
    open: 'bg-primary/10 text-primary/90',
    in_progress: 'bg-orange-100 text-orange-700',
    resolved: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Landlord Portal</h1>
        <p className="text-muted-foreground text-sm">Monitor your properties, tenant payments, and maintenance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Properties" value={properties.length} color="bg-primary/10 text-primary" />
        <StatCard icon={Users} label="Active Tenants" value={properties.reduce((a, p) => a + (p.leases?.filter(l => l.status === 'active').length || 0), 0)} color="bg-green-100 text-green-700" />
        <StatCard icon={Wrench} label="Open Maintenance" value={maintenance.filter(m => m.status === 'open' || m.status === 'in_progress').length} color="bg-orange-100 text-orange-700" />
        <StatCard icon={Wallet} label="Properties Vacant" value={properties.filter(p => !p.leases?.some(l => l.status === 'active')).length} color="bg-primary/10 text-primary/90" />
      </div>

      {/* Properties Overview */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> My Properties</h2>
        </div>
        {properties.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No properties linked to your account yet.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {properties.map(prop => {
              const activeLease = prop.leases?.find(l => l.status === 'active');
              return (
                <div key={prop.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{prop.address || prop.title || 'Property'}</p>
                    <p className="text-xs text-muted-foreground">{prop.property_type || 'Residential'}</p>
                    {activeLease && <p className="text-xs text-muted-foreground mt-1">Tenant: {activeLease.tenant_name || activeLease.tenant_email || '—'}</p>}
                  </div>
                  <div className="text-right">
                    {activeLease ? (
                      <>
                        <p className="font-bold text-sm">{activeLease.monthly_rent ? `GHS ${Number(activeLease.monthly_rent).toLocaleString()}/mo` : '—'}</p>
                        <Badge className="text-xs bg-green-100 text-green-700">Occupied</Badge>
                      </>
                    ) : (
                      <Badge className="text-xs bg-gray-100 text-gray-600">Vacant</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Maintenance Requests */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Maintenance Requests</h2>
        </div>
        {maintenance.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No maintenance requests.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {maintenance.map(m => (
              <div key={m.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{m.title || m.issue_type || 'Maintenance'}</p>
                  <p className="text-xs text-muted-foreground">{m.property?.address || ''}</p>
                  <p className="text-xs text-muted-foreground">{m.created_at ? format(new Date(m.created_at), 'dd MMM yyyy') : ''}</p>
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
