import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Users, TrendingUp, Home, Calendar, DollarSign,
  AlertCircle, BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight,
  Eye, FileText, Wrench, MapPin, Sparkles, ChevronRight, Briefcase,
  Wallet, Clock, Scale, Compass, CheckCircle2, AlertTriangle, Layers,
  ListTodo, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, isAfter } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { formatCurrency } from '@/lib/constants';

const PIE_COLORS = ['#10b981', '#f59e0b', '#6366f1', '#0284c7', '#ef4444'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function JCLDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [leases, setLeases] = useState([]);
  const [offers, setOffers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [propRes, clientRes, leadRes, viewRes, txnRes, leaseRes, offerRes, projRes, taskRes, compRes] = await Promise.all([
          powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_re_leads WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_projects WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM tasks WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM companies WHERE id = ? LIMIT 1', [companyId]).catch(() => ({ rows: [] })),
        ]);

        if (active) {
          setProperties(propRes.rows._array || Array.from(propRes.rows || []));
          setClients(clientRes.rows._array || Array.from(clientRes.rows || []));
          setLeads(leadRes.rows._array || Array.from(leadRes.rows || []));
          setViewings(viewRes.rows._array || Array.from(viewRes.rows || []));
          setTransactions(txnRes.rows._array || Array.from(txnRes.rows || []));
          setLeases(leaseRes.rows._array || Array.from(leaseRes.rows || []));
          setOffers(offerRes.rows._array || Array.from(offerRes.rows || []));
          setProjects(projRes.rows._array || Array.from(projRes.rows || []));
          setTasks(taskRes.rows._array || Array.from(taskRes.rows || []));
          if (compRes.rows?._array?.length > 0) {
            setCompany(compRes.rows._array[0]);
          }
        }
      } catch (e) {
        console.error('[JCLDashboard] Data fetch failed:', e);
      }
      setIsLoading(false);
    };

    if (companyId) fetchData();
    return () => { active = false; };
  }, [companyId]);

  // Land & Property breakdown
  const landParcels = properties.filter(p => p.property_type === 'land' || p.property_type === 'parcel');
  const builtProperties = properties.filter(p => p.property_type !== 'land' && p.property_type !== 'parcel');
  const activeLandAllocations = landParcels.filter(p => p.status === 'allocated' || p.status === 'reserved').length;
  const availableLand = landParcels.filter(p => p.status === 'available').length;

  const totalVolume = transactions
    .filter(t => t.status === 'closed' || t.status === 'completed' || t.status === 'paid')
    .reduce((s, t) => s + (Number(t.sale_price || t.price || t.amount) || 0), 0);

  const activeLeases = leases.filter(l => l.status === 'active').length;
  const pendingOffers = offers.filter(o => o.status === 'pending').length;

  const statusData = [
    { name: 'Available', value: properties.filter(p => p.status === 'available' || p.status === 'listed' || p.status === 'active').length || 1 },
    { name: 'Reserved', value: properties.filter(p => p.status === 'reserved').length || 0 },
    { name: 'Allocated', value: properties.filter(p => p.status === 'allocated').length || 0 },
    { name: 'Under Deal', value: properties.filter(p => p.status === 'pending' || p.status === 'under_contract').length || 0 },
    { name: 'Sold / Closed', value: properties.filter(p => p.status === 'sold' || p.status === 'closed').length || 0 },
  ];

  const upcomingViewings = viewings
    .filter(v => (v.viewing_date || v.date) && isAfter(new Date(v.viewing_date || v.date), new Date()))
    .slice(0, 5);

  const pendingAllocations = landParcels.filter(p => {
    let meta = {};
    try { if (p.features) meta = JSON.parse(p.features); } catch(e) {}
    return meta.allocation?.allocationStatus === 'active_reserved' || meta.allocation?.allocationStatus === 'pending_approval';
  }).slice(0, 4);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: t('dashboard_refreshed', "Dashboard refreshed") });
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 pb-28">
      {/* ── JCL Royal Group: Isolation Banner ── */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500/40 px-4 py-3.5 shadow-sm">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 dark:bg-amber-500/20">
          <span className="text-lg leading-none">🔐</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
              JCL Royal Group — Custom Vertical Operational
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-200 dark:bg-amber-800/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-900 dark:text-amber-200 uppercase">
              real_estate_jcl
            </span>
          </div>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
            Dedicated Land Management, CRM Pipelines, Cross-Module Timeline & Financial Controls for <strong>{company?.name || 'JCL Royal Group'}</strong>.
          </p>
        </div>
      </div>

      {/* ── Executive Hero Card ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-600 via-emerald-700 to-teal-800 p-5 sm:p-8 text-white shadow-xl border border-white/10">
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate leading-tight">
                  {company?.name || 'JCL Royal Group'} Command Center
                </h1>
                <p className="text-amber-100 text-xs sm:text-sm font-medium truncate">
                  Welcome back, {user?.full_name?.split(' ')[0] || 'Executive'} 👋
                </p>
              </div>
            </div>
            <p className="text-amber-200/90 text-xs font-medium pl-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/real-estate/land">
              <Button size="sm" className="bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold gap-1 shadow-sm">
                <Compass className="w-3.5 h-3.5" /> Land Management
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md gap-1.5 h-9 text-xs rounded-xl"
            >
              {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── Key Metrics KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="rounded-2xl border bg-card/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Land Parcels</span>
              <Compass className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">{landParcels.length}</span>
              <span className="text-xs font-medium text-emerald-600">({availableLand} available)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Allocations</span>
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{activeLandAllocations}</span>
              <span className="text-xs font-medium text-muted-foreground">in progress</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Clients</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">{clients.length}</span>
              <span className="text-xs font-medium text-muted-foreground">({leads.length} leads)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Closed Sales Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalVolume, 'USD')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Dashboard Sections Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left 2 Columns: Portfolio Status & Projects Progress ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Portfolio Status Breakdown */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Land & Property Portfolio Pipeline
                </span>
                <span className="text-xs font-normal text-muted-foreground">{properties.length} Total Assets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {statusData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="font-bold text-muted-foreground">{item.value} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development Projects & Milestone Status */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Development Projects & Engineering Progress
                </span>
                <Link to="/tasks" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-normal">
                  View Tasks <ArrowUpRight className="w-3 h-3" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {projects.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs bg-muted/20 rounded-xl border border-dashed">
                  <Briefcase className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                  <p>No active construction / development projects created yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 3).map((proj) => (
                    <div key={proj.id} className="p-3 bg-muted/20 rounded-xl border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{proj.name || proj.title}</span>
                        <Badge variant="outline" className="text-[10px]">{proj.status || 'Active'}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                        <span>Budget: {proj.budget ? formatCurrency(proj.budget, 'USD') : 'Open'}</span>
                        <span>Manager: {proj.manager_name || 'Assigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Action Required & Pending Items ── */}
        <div className="space-y-5">
          {/* Action Required Widget */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2 text-xs">
              {pendingAllocations.length > 0 ? (
                pendingAllocations.map((p) => {
                  let meta = {};
                  try { if (p.features) meta = JSON.parse(p.features); } catch(e) {}
                  return (
                    <div key={p.id} className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                        <span className="truncate">{meta.parcelName || p.address}</span>
                        <Badge className="bg-amber-500 text-white text-[9px] uppercase">
                          {meta.allocation?.allocationStatus || 'Pending'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-amber-800 dark:text-amber-300">
                        Allocated to: <strong>{meta.allocation?.customerName}</strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-70" />
                  <p>All allocations and deals are up to date.</p>
                </div>
              )}

              {/* Upcoming Viewings Mini-List */}
              <div className="pt-2 border-t space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                  Upcoming Viewings & Tours
                </span>
                {upcomingViewings.length > 0 ? (
                  upcomingViewings.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                      <div>
                        <div className="font-semibold text-foreground truncate">{v.property_address || 'Property'}</div>
                        <div className="text-[10px] text-muted-foreground">{v.client_name || 'Client'}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{v.viewing_date || 'Upcoming'}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">No tours scheduled today.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Department Nav */}
          <Card className="rounded-2xl border shadow-sm p-4 space-y-2">
            <span className="text-xs font-bold text-foreground block">Quick Department Nav</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/real-estate/land" className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-600" /> Land Management
              </Link>
              <Link to="/real-estate/clients" className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Customers
              </Link>
              <Link to="/real-estate/crm-leads" className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> CRM Leads
              </Link>
              <Link to="/real-estate/properties" className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-indigo-600" /> Properties
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
