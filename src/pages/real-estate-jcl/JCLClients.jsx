import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Plus, Edit, Trash2, Search, Mail, Phone, MapPin,
  DollarSign, Compass, Home,
  ChevronRight, RefreshCw, List,
  Grid, Download, MoreVertical, Eye
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import CustomerTimeline from './CustomerTimeline';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const getInitialsBg = (name = '') => {
  const code = (name.charCodeAt(0) || 65) + (name.charCodeAt(1) || 66);
  const colors = [
    'bg-[#005A9C] text-white',
    'bg-blue-600 text-white',
    'bg-indigo-600 text-white',
    'bg-amber-600 text-white',
    'bg-teal-600 text-white',
    'bg-purple-600 text-white',
    'bg-rose-600 text-white',
  ];
  return colors[code % colors.length];
};

const getInitials = (name = '') => {
  if (!name) return 'CL';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function ClientDistributionDonut({ buyers, investors, tenants, sellers, total }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  
  const buyerPct = total > 0 ? buyers / total : 0;
  const invPct = total > 0 ? investors / total : 0;
  const tenantPct = total > 0 ? tenants / total : 0;
  const sellerPct = total > 0 ? sellers / total : 0;

  const buyerDash = buyerPct * circumference;
  const invDash = invPct * circumference;
  const tenantDash = tenantPct * circumference;
  const sellerDash = sellerPct * circumference;

  const buyerOffset = 0;
  const invOffset = -buyerDash;
  const tenantOffset = invOffset - invDash;
  const sellerOffset = tenantOffset - tenantDash;

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-card/90 backdrop-blur-xl rounded-[22px] border border-border/80 shadow-sm">
      <div className="relative w-28 h-28 shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} className="stroke-muted/30" strokeWidth="12" fill="none" />
          {buyerPct > 0 && (
            <circle cx="70" cy="70" r={radius} className="stroke-emerald-500 transition-all duration-700" 
              strokeWidth="12" fill="none" strokeDasharray={`${buyerDash} ${circumference}`} strokeDashoffset={buyerOffset} />
          )}
          {invPct > 0 && (
            <circle cx="70" cy="70" r={radius} className="stroke-blue-500 transition-all duration-700" 
              strokeWidth="12" fill="none" strokeDasharray={`${invDash} ${circumference}`} strokeDashoffset={invOffset} />
          )}
          {tenantPct > 0 && (
            <circle cx="70" cy="70" r={radius} className="stroke-amber-500 transition-all duration-700" 
              strokeWidth="12" fill="none" strokeDasharray={`${tenantDash} ${circumference}`} strokeDashoffset={tenantOffset} />
          )}
          {sellerPct > 0 && (
            <circle cx="70" cy="70" r={radius} className="stroke-purple-500 transition-all duration-700" 
              strokeWidth="12" fill="none" strokeDasharray={`${sellerDash} ${circumference}`} strokeDashoffset={sellerOffset} />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-foreground">{total}</span>
          <span className="text-[8px] font-bold text-muted-foreground uppercase">Clients</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-semibold flex-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Buyers ({buyers})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Investors ({investors})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Tenants ({tenants})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-muted-foreground">Sellers ({sellers})</span>
        </div>
      </div>
    </div>
  );
}

export default function JCLClients() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [clients, setClients] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [leases, setLeases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Selected client for detail sheet / edit
  const [selectedClient, setSelectedClient] = useState(null);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'buyer',
    address: '',
    city: '',
    state: '',
    budget: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [clientRes, propRes, leaseRes, txnRes] = await Promise.all([
        powerSync.execute(`SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC`, [companyId]),
        powerSync.execute(`SELECT * FROM univ_re_properties WHERE company_id = ?`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_leases WHERE company_id = ?`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_transactions WHERE company_id = ?`, [companyId]).catch(() => ({ rows: [] })),
      ]);

      setClients(clientRes.rows._array || Array.from(clientRes.rows || []));
      setParcels(propRes.rows._array || Array.from(propRes.rows || []));
      setLeases(leaseRes.rows._array || Array.from(leaseRes.rows || []));
      setTransactions(txnRes.rows._array || Array.from(txnRes.rows || []));
    } catch (_e) {
      toast.error('Failed to load client records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel(`univ_re_clients_${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_re_clients', filter: `company_id=eq.${companyId}` }, fetchData)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Customer records synchronized');
    }, 400);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Name,Email,Phone,Type,City,Budget,Date Registered\n"
      + clients.map(c => `"${c.name || ''}","${c.email || ''}","${c.phone || ''}","${c.type || 'buyer'}","${c.city || ''}","${c.budget || 0}","${c.created_at || ''}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jcl_clients_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customer list exported to CSV');
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = search === '' ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || c.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [clients, search, typeFilter]);

  // Compute linked items for a specific client
  const getClientLinkedData = (client) => {
    if (!client) return { allocations: [], clientLeases: [], clientTxns: [] };

    // 1. Land Allocations
    const allocations = parcels.filter(p => {
      let meta = {};
      try { if (p.features) meta = JSON.parse(p.features); } catch(_e) {}
      return meta.allocation?.customerId === client.id ||
        (meta.allocation?.customerName && meta.allocation.customerName.toLowerCase() === client.name.toLowerCase());
    }).map(p => {
      let meta = {};
      try { if (p.features) meta = JSON.parse(p.features); } catch(_e) {}
      return { parcel: p, meta };
    });

    // 2. Leases
    const clientLeases = leases.filter(l => l.tenant_id === client.id || l.tenant_name?.toLowerCase() === client.name?.toLowerCase());

    // 3. Transactions
    const clientTxns = transactions.filter(t => t.buyer_name?.toLowerCase() === client.name?.toLowerCase() || t.seller_name?.toLowerCase() === client.name?.toLowerCase());

    return { allocations, clientLeases, clientTxns };
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = clients.length;
    const buyers = clients.filter(c => c.type === 'buyer').length;
    const investors = clients.filter(c => c.type === 'investor').length;
    const tenants = clients.filter(c => c.type === 'tenant' || c.type === 'renter').length;
    const sellers = clients.filter(c => c.type === 'seller').length;
    const totalBudget = clients.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);

    return { total, buyers, investors, tenants, sellers, totalBudget };
  }, [clients]);

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_clients SET
            name = ?, email = ?, phone = ?, type = ?,
            address = ?, city = ?, state = ?,
            budget = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.name, formData.email, formData.phone, formData.type,
            formData.address, formData.city, formData.state,
            Number(formData.budget) || 0, formData.notes,
            editingId, companyId
          ]
        );
        toast.success('Customer profile updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_clients (
            id, created_at, company_id, name, email, phone, type,
            address, city, state, budget, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId,
            formData.name, formData.email, formData.phone, formData.type,
            formData.address, formData.city, formData.state,
            Number(formData.budget) || 0, formData.notes
          ]
        );
        toast.success('Customer profile registered');
      }

      setShowFormDrawer(false);
      setEditingId(null);
      fetchData();
    } catch (_err) {
      toast.error('Failed to save client profile');
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await powerSync.execute(`DELETE FROM univ_re_clients WHERE id = ? AND company_id = ?`, [id, companyId]);
      toast.success('Customer record deleted');
      setDeleteId(null);
      if (selectedClient?.id === id) setSelectedClient(null);
      fetchData();
    } catch (_err) {
      toast.error('Failed to delete client');
    }
  };

  const openEditDrawer = (client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      type: client.type || 'buyer',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      budget: client.budget || '',
      notes: client.notes || '',
    });
    setShowFormDrawer(true);
  };

  return (
    <div className="space-y-6 pb-12 font-sans min-h-screen p-4 sm:p-6 lg:p-8 relative bg-background">
      
      {/* ── Top Header & Breadcrumbs Row ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Client Directory ({clients.length})
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registered customer accounts, land parcel allocations, and omnichannel timeline history
          </p>
        </div>

        <div className="flex items-center gap-3 text-[13px] font-semibold text-muted-foreground">
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground">Clients</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 bg-card border-border text-foreground shadow-sm rounded-xl hover:bg-muted font-bold text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 w-9 bg-card border-border text-foreground shadow-sm rounded-xl hover:bg-muted"
            title="Refresh Customers"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Strip & Donut Gauge (Law Management System Style) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: 2 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
          <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Registered Clients</span>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">{metrics.total}</div>
                <p className="text-[11px] text-muted-foreground font-semibold">{metrics.buyers + metrics.investors} Active Investors & Buyers</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-[#005A9C] dark:text-[#FF6B00] border border-[#005A9C]/20 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Registered Purchasing Power</span>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">{formatCurrency(metrics.totalBudget, 'USD')}</div>
                <p className="text-[11px] text-muted-foreground font-semibold">Active Client Investment Capital</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-blue-500/5 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-inner">
                <DollarSign className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Client Distribution Donut Gauge */}
        <ClientDistributionDonut
          buyers={metrics.buyers}
          investors={metrics.investors}
          tenants={metrics.tenants}
          sellers={metrics.sellers}
          total={metrics.total}
        />
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full space-y-4">
        {/* ── Search, Filters & Action Hub Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card/90 backdrop-blur-xl p-3 sm:p-4 rounded-[20px] border border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client by name, email, city..."
                className="pl-9 h-10 rounded-xl bg-background text-xs border-border/80"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 w-44 rounded-xl text-xs font-medium bg-background border-border/80">
                <SelectValue placeholder="Customer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer Types ({clients.length})</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="investor">Investors</SelectItem>
                <SelectItem value="tenant">Tenants & Lessees</SelectItem>
                <SelectItem value="seller">Property Owners / Sellers</SelectItem>
                <SelectItem value="corporate">Corporate Accounts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <TabsList className="bg-muted/60 p-1 rounded-xl h-10 border border-border/60">
              <TabsTrigger value="grid" className="rounded-lg text-xs font-bold gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Grid className="w-3.5 h-3.5" /> Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-lg text-xs font-bold gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <List className="w-3.5 h-3.5" /> List
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '', email: '', phone: '', type: 'buyer',
                  address: '', city: '', state: '', budget: '', notes: '',
                });
                setShowFormDrawer(true);
              }}
              className="bg-[#005A9C] hover:bg-[#00477D] text-white font-bold text-xs rounded-xl h-10 px-4 gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Register Client
            </Button>
          </div>
        </div>

        {/* ── Tab Content: Grid View ── */}
        <TabsContent value="grid" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-72 bg-muted rounded-[26px]" />)}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-20 bg-card/60 backdrop-blur-xl rounded-[28px] border border-dashed border-border/80 p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#005A9C]/10 text-emerald-600 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 opacity-75" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">No customer records found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {search || typeFilter !== 'all'
                    ? 'No clients match your active search filters.'
                    : 'Register your first customer profile to start linking land parcels, tenancies, and timeline logs.'}
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', email: '', phone: '', type: 'buyer', address: '', city: '', state: '', budget: '', notes: '' });
                  setShowFormDrawer(true);
                }}
                className="bg-[#005A9C] hover:bg-[#00477D] text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Register Client
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClients.map((client) => {
                const initials = getInitials(client.name);
                const avatarColor = getInitialsBg(client.name);
                const { allocations, clientLeases, clientTxns } = getClientLinkedData(client);

                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group relative"
                  >
                    <div className="p-5 pb-4 space-y-3.5">
                      {/* Card Top: Avatar & Name */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform", avatarColor)}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-[15px] text-foreground group-hover:text-emerald-600 transition-colors truncate">
                              {client.name}
                            </h3>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 h-4 bg-muted/40 capitalize mt-0.5">
                              {client.type || 'Buyer'}
                            </Badge>
                          </div>
                        </div>

                        <Badge className="bg-[#005A9C]/15 text-[#005A9C] dark:bg-[#FF6B00]/15 dark:text-[#FF6B00] font-extrabold text-[10px] uppercase border-emerald-200">
                          Active
                        </Badge>
                      </div>

                      {/* Contact Info Strip */}
                      <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/30 p-3 rounded-2xl border border-border/50">
                        {client.phone && (
                          <div className="flex items-center gap-2 truncate">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate font-medium">{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate font-medium">{client.email}</span>
                          </div>
                        )}
                        {client.city && (
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate font-medium">{client.city}{client.state ? `, ${client.state}` : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Linked Assets Summary */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 bg-muted/20 rounded-xl border border-border/40">
                          <span className="text-[9px] font-black uppercase text-muted-foreground block">Plots Held</span>
                          <span className="font-black text-amber-600 text-xs">{allocations.length}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-xl border border-border/40">
                          <span className="text-[9px] font-black uppercase text-muted-foreground block">Leases</span>
                          <span className="font-black text-blue-600 text-xs">{clientLeases.length}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-xl border border-border/40">
                          <span className="text-[9px] font-black uppercase text-muted-foreground block">Closed Deals</span>
                          <span className="font-black text-emerald-600 text-xs">{clientTxns.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 px-5 border-t border-border/70 bg-muted/15 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block">Investment Budget</span>
                        <span className="text-base font-black text-foreground">
                          {client.budget ? formatCurrency(client.budget, 'USD') : 'Open'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          onClick={() => setSelectedClient(client)}
                          className="text-xs h-8 px-3 font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-sm gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEditDrawer(client)}
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                          title="Edit Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => setSelectedClient(client)}>
                              <Eye className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> View Timeline & Holdings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDrawer(client)}>
                              <Edit className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => setDeleteId(client.id)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab Content: Executive Data Table List View ── */}
        <TabsContent value="list" className="mt-0">
          <div className="bg-card/90 backdrop-blur-xl rounded-[24px] border border-border/80 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 uppercase tracking-wider text-muted-foreground font-extrabold border-b border-border/80 text-[10px]">
                  <tr>
                    <th className="p-4 pl-5">Client Profile</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Account Type</th>
                    <th className="p-4">Capital Budget</th>
                    <th className="p-4">Linked Holdings</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredClients.map((client) => {
                    const initials = getInitials(client.name);
                    const avatarColor = getInitialsBg(client.name);
                    const { allocations, clientLeases } = getClientLinkedData(client);

                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        <td className="p-4 pl-5">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm", avatarColor)}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-extrabold text-foreground text-[13px] group-hover:text-emerald-600 transition-colors">
                                {client.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {client.city}{client.state ? `, ${client.state}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-muted-foreground">
                          <div className="space-y-0.5">
                            {client.email && <div className="font-medium text-foreground">{client.email}</div>}
                            {client.phone && <div className="text-[11px]">{client.phone}</div>}
                          </div>
                        </td>

                        <td className="p-4">
                          <Badge variant="outline" className="text-[10px] capitalize font-bold bg-muted/40">
                            {client.type || 'Buyer'}
                          </Badge>
                        </td>

                        <td className="p-4 font-black text-foreground text-sm">
                          {client.budget ? formatCurrency(client.budget, 'USD') : '—'}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {allocations.length > 0 && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 text-[10px] font-bold">
                                {allocations.length} Plots
                              </Badge>
                            )}
                            {clientLeases.length > 0 && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 text-[10px] font-bold">
                                {clientLeases.length} Leases
                              </Badge>
                            )}
                            {allocations.length === 0 && clientLeases.length === 0 && (
                              <span className="text-muted-foreground/60 italic text-[11px]">No active holdings</span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <Badge className="bg-[#005A9C]/15 text-[#005A9C] dark:bg-[#FF6B00]/15 dark:text-[#FF6B00] font-bold text-[10px] uppercase">
                            Active
                          </Badge>
                        </td>

                        <td className="p-4 pr-5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="xs"
                            onClick={() => setSelectedClient(client)}
                            className="text-[11px] h-7 px-2.5 font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl"
                          >
                            Inspect
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => openEditDrawer(client)}
                            className="h-7 w-7 p-0 rounded-xl text-muted-foreground"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDeleteId(client.id)}
                            className="h-7 w-7 p-0 rounded-xl text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Slide-Over Customer Profile & Timeline Drawer ── */}
      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-6 pb-28 space-y-6">
          {selectedClient && (() => {
            const { allocations, clientLeases, clientTxns } = getClientLinkedData(selectedClient);

            return (
              <>
                <SheetHeader className="pb-4 border-b border-border/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow", getInitialsBg(selectedClient.name))}>
                        {getInitials(selectedClient.name)}
                      </div>
                      <div>
                        <SheetTitle className="text-xl font-extrabold text-foreground">
                          {selectedClient.name}
                        </SheetTitle>
                        <SheetDescription className="text-xs flex items-center gap-2 mt-0.5">
                          <span className="capitalize">{selectedClient.type || 'Buyer'} Profile</span>
                          <span>•</span>
                          <span>{selectedClient.city || 'Accra'}{selectedClient.state ? `, ${selectedClient.state}` : ''}</span>
                        </SheetDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDrawer(selectedClient)}
                        className="font-bold text-xs rounded-xl h-8 gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Profile
                      </Button>
                    </div>
                  </div>
                </SheetHeader>

                {/* Tabs: Overview, Land Allocations, Leases/Deals, Timeline */}
                <Tabs defaultValue="overview" className="w-full space-y-4">
                  <TabsList className="grid grid-cols-4 w-full rounded-xl bg-muted/60 p-1 border border-border/60">
                    <TabsTrigger value="overview" className="text-xs font-bold rounded-lg">Overview</TabsTrigger>
                    <TabsTrigger value="allocations" className="text-xs font-bold rounded-lg">Plots ({allocations.length})</TabsTrigger>
                    <TabsTrigger value="leases" className="text-xs font-bold rounded-lg">Deals ({clientLeases.length + clientTxns.length})</TabsTrigger>
                    <TabsTrigger value="timeline" className="text-xs font-bold rounded-lg">Timeline</TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Profile Overview */}
                  <TabsContent value="overview" className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/60">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Investment Budget</span>
                        <span className="text-xl font-black text-foreground">
                          {selectedClient.budget ? formatCurrency(selectedClient.budget, 'USD') : 'Open Budget'}
                        </span>
                      </div>
                      <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/60">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Account Status</span>
                        <span className="text-xl font-black text-emerald-600">Active Member</span>
                      </div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border/80 p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Specifications</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Email Address</span>
                          <span className="font-bold text-foreground">{selectedClient.email || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Phone Contact</span>
                          <span className="font-bold text-foreground">{selectedClient.phone || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Physical Address</span>
                          <span className="font-bold text-foreground">{selectedClient.address || 'Unset'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Region / City</span>
                          <span className="font-bold text-foreground">{selectedClient.city || 'Accra'}, {selectedClient.state || 'GH'}</span>
                        </div>
                      </div>

                      {selectedClient.notes && (
                        <div className="pt-2 border-t border-border/60">
                          <span className="text-muted-foreground block text-[10px] mb-1">Account Notes</span>
                          <p className="text-xs text-foreground font-medium">{selectedClient.notes}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 2: Land Allocations */}
                  <TabsContent value="allocations" className="space-y-3 pt-1">
                    {allocations.length > 0 ? (
                      allocations.map(({ parcel, meta }) => (
                        <div key={parcel.id} className="p-4 bg-card rounded-2xl border border-indigo-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">{meta.parcelName || parcel.address}</span>
                            <Badge className="bg-indigo-600 text-white text-[10px] font-bold uppercase">
                              {meta.allocation?.allocationStatus || 'Allocated'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>Plot: <span className="font-bold text-foreground">{meta.plotNumber || 'N/A'}</span></div>
                            <div>Acres: <span className="font-bold text-amber-600">{meta.lotSizeAcres || parcel.lot_size || '0'} ac</span></div>
                            <div>Deposit: <span className="font-bold text-emerald-600">{formatCurrency(meta.allocation?.depositAmount, 'USD')}</span></div>
                            <div>Expiry: <span className="font-bold text-foreground">{meta.allocation?.expiryDate || 'N/A'}</span></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed p-6 space-y-2">
                        <Compass className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                        <p className="text-xs font-bold text-foreground">No Land Parcels Allocated</p>
                        <p className="text-[11px] text-muted-foreground">This customer does not currently hold an active parcel allocation.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 3: Leases & Deals */}
                  <TabsContent value="leases" className="space-y-3 pt-1">
                    {clientLeases.length > 0 || clientTxns.length > 0 ? (
                      <div className="space-y-3">
                        {clientLeases.map(l => (
                          <div key={l.id} className="p-3.5 bg-card rounded-2xl border border-border/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-foreground">Tenancy: {l.property_address || 'Unit'}</span>
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 text-[9px] uppercase font-bold">{l.status || 'Active'}</Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Rent: <span className="font-bold text-foreground">{formatCurrency(l.monthly_rent, 'USD')}/month</span> • Term: {l.start_date} to {l.end_date}
                            </div>
                          </div>
                        ))}
                        {clientTxns.map(t => (
                          <div key={t.id} className="p-3.5 bg-card rounded-2xl border border-border/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-foreground">Sale Transaction: {t.property_address || 'Property'}</span>
                              <Badge className="bg-[#005A9C]/15 text-[#005A9C] dark:bg-[#FF6B00]/15 dark:text-[#FF6B00] text-[9px] uppercase font-bold">{t.status || 'Closed'}</Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Closing Price: <span className="font-bold text-foreground">{formatCurrency(t.sale_price, 'USD')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed p-6 space-y-2">
                        <Home className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                        <p className="text-xs font-bold text-foreground">No Active Leases or Deals</p>
                        <p className="text-[11px] text-muted-foreground">Tenancy agreements and closed sales will appear here.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 4: Customer Timeline */}
                  <TabsContent value="timeline" className="space-y-4 pt-1">
                    <CustomerTimeline customerId={selectedClient.id} compact={true} />
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Slide-Over Client Form Drawer (Create / Edit) ── */}
      <Sheet open={showFormDrawer} onOpenChange={setShowFormDrawer}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6 pb-28">
          <SheetHeader className="pb-4 border-b border-border/80">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Customer Profile' : 'Register New Client Profile'}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Record identity, purchasing power, and physical location coordinates.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveClient} className="space-y-4 mt-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold">Full Legal / Business Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Nana Kwame Addo"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="kwame@example.com"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+233 24 000 0000"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">Customer Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="seller">Seller / Landlord</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">Capital Budget ($)</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="250000"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">Street Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Airport Hills Plot 24"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Accra"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">State / Region</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Greater Accra"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">Client Background & Requirements</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="High-net-worth commercial land purchaser..."
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFormDrawer(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl font-bold text-xs"
              >
                {editingId ? 'Update Client' : 'Register Client'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Dialog: Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Customer Profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action will delete the customer profile from the directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteClient(deleteId)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
            >
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
