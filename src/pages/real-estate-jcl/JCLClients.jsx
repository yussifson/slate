import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Edit, Trash2, Search, Mail, Phone, MapPin,
  DollarSign, FileText, Compass, Home, Calendar, Clock,
  ChevronRight, ArrowUpRight, ShieldCheck, CheckCircle2, UserCheck
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';
import { formatCurrency } from '@/lib/constants';
import CustomerTimeline from './CustomerTimeline';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function JCLClients() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [clients, setClients] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [leases, setLeases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useViewPreference('jcl_clients', 'grid');

  // Selected client for detail sheet / edit
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      const [clientRes, propRes, leaseRes, txnRes, invRes] = await Promise.all([
        powerSync.execute(`SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC`, [companyId]),
        powerSync.execute(`SELECT * FROM univ_re_properties WHERE company_id = ?`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_leases WHERE company_id = ?`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_transactions WHERE company_id = ?`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_invoices WHERE company_id = ?`, [companyId]).catch(() => ({ rows: [] })),
      ]);

      setClients(clientRes.rows._array || Array.from(clientRes.rows || []));
      setParcels(propRes.rows._array || Array.from(propRes.rows || []));
      setLeases(leaseRes.rows._array || Array.from(leaseRes.rows || []));
      setTransactions(txnRes.rows._array || Array.from(txnRes.rows || []));
      setInvoices(invRes.rows._array || Array.from(invRes.rows || []));
    } catch (e) {
      console.error('[JCLClients] Fetch error:', e);
      toast.error('Failed to load client records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchData();
  }, [companyId]);

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
    if (!client) return { allocations: [], clientLeases: [], clientTxns: [], totalInvoiced: 0, totalPaid: 0, balance: 0 };

    // 1. Land Allocations
    const allocations = parcels.filter(p => {
      let meta = {};
      try { if (p.features) meta = JSON.parse(p.features); } catch(e) {}
      return meta.allocation?.customerId === client.id ||
        (meta.allocation?.customerName && meta.allocation.customerName.toLowerCase() === client.name.toLowerCase());
    }).map(p => {
      let meta = {};
      try { if (p.features) meta = JSON.parse(p.features); } catch(e) {}
      return { parcel: p, meta };
    });

    // 2. Leases
    const clientLeases = leases.filter(l => l.tenant_id === client.id || l.tenant_name?.toLowerCase() === client.name?.toLowerCase());

    // 3. Transactions
    const clientTxns = transactions.filter(t => t.buyer_name?.toLowerCase() === client.name?.toLowerCase() || t.seller_name?.toLowerCase() === client.name?.toLowerCase());

    // 4. Financial Balance (Mock / Invoices rollup)
    const clientInvs = invoices.filter(inv => inv.customer_name?.toLowerCase() === client.name?.toLowerCase() || inv.client_id === client.id);
    const totalInvoiced = clientInvs.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
    const totalPaid = clientInvs.reduce((s, i) => s + (Number(i.amount_paid) || 0), 0);
    const balance = totalInvoiced - totalPaid;

    return { allocations, clientLeases, clientTxns, totalInvoiced, totalPaid, balance };
  };

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
            address = ?, city = ?, state = ?, budget = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.name, formData.email, formData.phone, formData.type,
            formData.address, formData.city, formData.state,
            Number(formData.budget) || 0, formData.notes,
            editingId, companyId
          ]
        );
        toast.success('Customer updated');
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
        toast.success('Customer added');
      }

      setShowEditDrawer(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('[JCLClients] Save error:', err);
      toast.error('Failed to save customer record');
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Delete this customer record?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_re_clients WHERE id = ? AND company_id = ?`, [id, companyId]);
      toast.success('Customer deleted');
      fetchData();
    } catch(e) {
      toast.error('Delete failed');
    }
  };

  const openClientDetail = (client) => {
    setSelectedClient(client);
    setShowDetailSheet(true);
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
    setShowEditDrawer(true);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-28">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Customer Management
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300">
                  JCL Unified CRM
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Customer profiles, land allocations, property agreements, financial balances & activity history
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ViewToggle view={view} onViewChange={setView} />
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', email: '', phone: '', type: 'buyer', address: '', city: '', state: '', budget: '', notes: '' });
              setShowEditDrawer(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name, email, phone..."
            className="pl-9 h-10 rounded-xl bg-background text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 w-40 rounded-xl text-xs font-medium">
              <SelectValue placeholder="Customer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customer Types</SelectItem>
              <SelectItem value="buyer">Land / Property Buyer</SelectItem>
              <SelectItem value="investor">Estate Investor</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
              <SelectItem value="landlord">Landlord / Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Grid / List Display ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-muted rounded-2xl" />)}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <h4 className="text-base font-semibold text-foreground">No customers found</h4>
          <p className="text-xs text-muted-foreground mt-1">Register a new customer or convert a lead from CRM Leads.</p>
        </div>
      ) : view === 'list' ? (
        <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 uppercase tracking-wider text-muted-foreground font-semibold border-b">
              <tr>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Budget</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5 font-bold text-foreground">
                    <button onClick={() => openClientDetail(c)} className="hover:text-blue-600 text-left">
                      {c.name}
                    </button>
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    <div>{c.email}</div>
                    <div className="text-[10px]">{c.phone}</div>
                  </td>
                  <td className="p-3.5">
                    <Badge variant="outline" className="capitalize text-[10px]">{c.type || 'buyer'}</Badge>
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    {c.city || 'N/A'}, {c.state || ''}
                  </td>
                  <td className="p-3.5 font-bold text-foreground">
                    {c.budget ? formatCurrency(c.budget, 'USD') : 'Flexible'}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => openClientDetail(c)}
                      className="text-[11px] h-7 px-2 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      View Profile
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => openEditDrawer(c)} className="h-7 w-7 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const linked = getClientLinkedData(client);
            return (
              <Card key={client.id} className="rounded-2xl border bg-card hover:shadow-md transition-all flex flex-col">
                <div className="p-5 flex-1 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-foreground tracking-tight hover:text-blue-600 cursor-pointer" onClick={() => openClientDetail(client)}>
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] capitalize bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200">
                          {client.type || 'Buyer'}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{client.city || 'Ghana'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{client.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{client.phone || 'No phone'}</span>
                    </div>
                  </div>

                  {/* Linked Portfolios Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200">
                      <span className="text-[10px] uppercase font-semibold text-amber-800 dark:text-amber-300 block">Land Alloc</span>
                      <span className="font-bold text-amber-900 dark:text-amber-200">{linked.allocations.length}</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-xl border border-blue-200">
                      <span className="text-[10px] uppercase font-semibold text-blue-800 dark:text-blue-300 block">Deals</span>
                      <span className="font-bold text-blue-900 dark:text-blue-200">{linked.clientTxns.length}</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-300 block">Balance</span>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">{formatCurrency(linked.balance, 'USD')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t bg-muted/10 flex items-center justify-between mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openClientDetail(client)}
                    className="text-xs h-8 px-2.5 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 gap-1 rounded-xl"
                  >
                    View 360° Profile <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEditDrawer(client)} className="h-8 w-8 p-0 rounded-xl">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteClient(client.id)} className="h-8 w-8 p-0 rounded-xl text-rose-500 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Slide-Over 360° Customer Profile Sheet ── */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-6 pb-28">
          {selectedClient && (() => {
            const linked = getClientLinkedData(selectedClient);
            return (
              <div className="space-y-6">
                <SheetHeader className="pb-4 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <SheetTitle className="text-xl font-bold flex items-center gap-2">
                        {selectedClient.name}
                        <Badge variant="outline" className="capitalize text-xs bg-blue-50 text-blue-700 border-blue-300">
                          {selectedClient.type || 'Buyer'}
                        </Badge>
                      </SheetTitle>
                      <SheetDescription className="text-xs mt-0.5">
                        {selectedClient.email} • {selectedClient.phone} • {selectedClient.city || 'Ghana'}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <Tabs defaultValue="timeline" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full rounded-xl text-xs">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="land">Land ({linked.allocations.length})</TabsTrigger>
                    <TabsTrigger value="deals">Deals ({linked.clientTxns.length})</TabsTrigger>
                    <TabsTrigger value="finance">Finance</TabsTrigger>
                  </TabsList>

                  {/* ── Tab 1: Interaction Timeline ── */}
                  <TabsContent value="timeline" className="pt-4">
                    <CustomerTimeline customerId={selectedClient.id} compact={true} />
                  </TabsContent>

                  {/* ── Tab 2: Land Allocations ── */}
                  <TabsContent value="land" className="space-y-3 pt-4 text-xs">
                    {linked.allocations.length === 0 ? (
                      <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
                        <Compass className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <p>No land parcels allocated to this customer yet.</p>
                      </div>
                    ) : (
                      linked.allocations.map(({ parcel, meta }, idx) => (
                        <Card key={idx} className="rounded-xl border p-3.5 space-y-2">
                          <div className="flex items-center justify-between font-bold">
                            <span>{meta.parcelName || parcel.address}</span>
                            <Badge className="bg-amber-500 text-white text-[10px]">{meta.allocation?.allocationStatus || 'Allocated'}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                            <div>Plot: {meta.plotNumber || 'N/A'}</div>
                            <div>Area: {meta.lotSizeAcres || parcel.lot_size || ''} Acres</div>
                            <div>Deposit: {formatCurrency(meta.allocation?.depositAmount, 'USD')}</div>
                            <div>Terms: {meta.allocation?.paymentTerms || 'Standard'}</div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* ── Tab 3: Deals & Agreements ── */}
                  <TabsContent value="deals" className="space-y-3 pt-4 text-xs">
                    {linked.clientTxns.length === 0 ? (
                      <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
                        <DollarSign className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <p>No closed or active sales pipeline deals.</p>
                      </div>
                    ) : (
                      linked.clientTxns.map((txn, idx) => (
                        <Card key={idx} className="rounded-xl border p-3.5 space-y-2">
                          <div className="flex items-center justify-between font-bold">
                            <span>{txn.property_address || 'Property Deal'}</span>
                            <Badge className="bg-indigo-600 text-white text-[10px]">{txn.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Price: {formatCurrency(txn.sale_price, 'USD')}</span>
                            <span>Closing: {txn.closing_date}</span>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* ── Tab 4: Financial Summary & Balance ── */}
                  <TabsContent value="finance" className="space-y-4 pt-4 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/40 p-3 rounded-xl border">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Invoiced</span>
                        <span className="text-sm font-bold text-foreground">{formatCurrency(linked.totalInvoiced, 'USD')}</span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200">
                        <span className="text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-300 block">Paid</span>
                        <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">{formatCurrency(linked.totalPaid, 'USD')}</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200">
                        <span className="text-[10px] uppercase font-semibold text-blue-800 dark:text-blue-300 block">Balance Due</span>
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-200">{formatCurrency(linked.balance, 'USD')}</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Slide-Over Form: Add/Edit Customer ── */}
      <Sheet open={showEditDrawer} onOpenChange={setShowEditDrawer}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6 pb-28">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-lg font-bold">{editingId ? 'Edit Customer' : 'Add New Customer'}</SheetTitle>
            <SheetDescription className="text-xs">Contact, budget & customer profile settings</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveClient} className="space-y-4 mt-4 text-xs">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Nana Yaw Boateng"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nana@example.com"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+233 24 000 0000"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Customer Role</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Land / Property Buyer</SelectItem>
                    <SelectItem value="investor">Estate Investor</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="landlord">Landlord / Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Budget ($)</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="150000"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Address / Region</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Airport Hills, Accra"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes & Portfolio Requirements</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Interested in commercial plots & residential land in Sector 2..."
                className="rounded-xl"
              />
            </div>

            <div className="pt-4 border-t flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={() => setShowEditDrawer(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                {editingId ? 'Update Customer' : 'Save Customer'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
