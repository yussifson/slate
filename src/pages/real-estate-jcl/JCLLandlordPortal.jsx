import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { Building2, Wallet, Wrench, Users, TrendingUp, CheckCircle2, Clock, DollarSign, Home, RefreshCw, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function JCLLandlordPortal() {
  const { user } = useAuth();

  const { data: properties = [], isLoading: isLoadingProps } = useQuery({
    queryKey: ['portal-jcl-landlord-props', user?.email],
    queryFn: async () => {
      const props = await powerSync.getAll(
        `SELECT * FROM univ_re_properties WHERE company_id = ? AND owner_email = ?`,
        [user?.company_id, user?.email]
      ) || [];
      if (props.length === 0) return [];

      const propIds = props.map(p => `'${p.id}'`).join(',');
      const leases = await powerSync.getAll(`SELECT * FROM univ_re_leases WHERE property_id IN (${propIds})`) || [];

      return props.map(p => ({
        ...p,
        leases: leases.filter(l => l.property_id === p.id)
      }));
    },
    enabled: !!user?.email && !!user?.company_id,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['portal-jcl-landlord-maintenance', user?.company_id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT m.*, p.address as property_address 
         FROM univ_re_maintenance m
         LEFT JOIN univ_re_properties p ON m.property_id = p.id
         WHERE m.company_id = ? 
         ORDER BY m.created_at DESC LIMIT 10`,
        [user?.company_id]
      ) || [];
      return rows.map(r => ({ ...r, property: { address: r.property_address } }));
    },
    enabled: !!user?.company_id,
  });

  const activeTenantsCount = properties.reduce((sum, p) => sum + (p.leases?.filter(l => l.status === 'active').length || 0), 0);
  const totalMonthlyRentRoll = properties.reduce((sum, p) => {
    const activeLease = p.leases?.find(l => l.status === 'active');
    return sum + (activeLease?.monthly_rent || 0);
  }, 0);
  const openMaintenanceCount = maintenance.filter(m => m.status === 'open' || m.status === 'in_progress').length;
  const vacantCount = properties.filter(p => !p.leases?.some(l => l.status === 'active')).length;

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white border border-[#005A9C]/20 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#005A9C]/20 border border-[#005A9C]/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Building2 className="h-3.5 w-3.5" /> Property Owner & Landlord Command Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Landlord Portfolio Dashboard
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Track asset performance, active monthly rent rolls, occupancy rates, and ongoing maintenance expenditures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-[#005A9C]/20 text-emerald-300 border-emerald-500/40 text-xs px-3 py-1.5 font-mono">
              Owner: {user?.email}
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owned Assets</p>
            <p className="text-3xl font-extrabold text-foreground">{properties.length}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Registered properties</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
            <Home className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Rent Roll</p>
            <p className="text-2xl font-extrabold text-[#005A9C] dark:text-[#FF6B00] font-mono tracking-tight">
              {formatCurrency(totalMonthlyRentRoll, 'USD')}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Active recurring rent</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <DollarSign className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Tenants</p>
            <p className="text-3xl font-extrabold text-foreground">{activeTenantsCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Occupied units</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vacant / Open</p>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{vacantCount}</p>
            <p className="text-[11px] text-amber-600/80 font-medium">Units available</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wallet className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties Overview */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" /> Managed Assets Overview
            </h3>
            <span className="text-xs font-semibold text-muted-foreground">{properties.length} Units</span>
          </div>

          {properties.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No real estate properties listed under owner account {user?.email}.
            </div>
          ) : (
            <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-muted/20">
              {properties.map(p => {
                const activeLease = p.leases?.find(l => l.status === 'active');
                return (
                  <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-card transition-colors">
                    <div>
                      <p className="text-xs font-bold text-foreground">{p.address || p.title || 'Property Unit'}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{p.property_type || 'Residential'}</p>
                      {activeLease && (
                        <p className="text-[10px] text-[#005A9C] dark:text-[#FF6B00] font-medium mt-0.5">
                          Tenant: {activeLease.tenant_name || activeLease.tenant_email || 'Active'}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {activeLease ? (
                        <>
                          <span className="text-xs font-extrabold text-[#005A9C] dark:text-[#FF6B00] font-mono block">
                            {formatCurrency(activeLease.monthly_rent || 0, 'USD')}/mo
                          </span>
                          <Badge className="bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30 text-[9px] uppercase font-bold mt-1">
                            Occupied
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">
                          Vacant
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Maintenance Activity */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4 text-emerald-600" /> Property Maintenance Requests
            </h3>
            <span className="text-xs font-semibold text-amber-600">{openMaintenanceCount} Open</span>
          </div>

          {maintenance.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No active maintenance tickets logged for your portfolio.
            </div>
          ) : (
            <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-muted/20">
              {maintenance.map(m => (
                <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-card transition-colors">
                  <div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{m.title || m.issue_type || 'Work Order'}</p>
                    <p className="text-[10px] text-muted-foreground">{m.property?.address || 'Property Asset'}</p>
                  </div>
                  <Badge className={cn(
                    "text-[9px] uppercase font-bold",
                    m.status === 'resolved' ? 'bg-[#005A9C]/10 text-emerald-700 border-[#005A9C]/30' :
                    m.status === 'in_progress' ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' :
                    'bg-slate-500/10 text-slate-700 border-slate-500/30'
                  )}>
                    {m.status || 'open'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
