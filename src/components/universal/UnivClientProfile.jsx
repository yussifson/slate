import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Edit, Trash2, Phone, Mail, MapPin, DollarSign,
  Building2, Calendar, Clock, CheckCircle2, AlertCircle, FileText,
  Search, Filter, ChevronRight, ArrowUpRight, ShieldCheck, Sparkles,
  Layers, Wallet, Compass, Home, Receipt, UserCheck, Eye, Save
} from 'lucide-react';
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from '@/api/supabaseClient';
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
import { formatCurrency } from '@/lib/constants';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function UnivClientProfile() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [leases, setLeases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
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
    notes: ''
  });

  const fetchAllData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [clientRes, parcelRes, allocRes, leaseRes, txnRes, invRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_land_parcels WHERE company_id = ?', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_land_allocations WHERE company_id = ?', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ?', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ?', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_invoices WHERE company_id = ?', [companyId]).catch(() => ({ rows: [] }))
      ]);

      setClients(clientRes.rows?._array || Array.from(clientRes.rows || []));
      setParcels(parcelRes.rows?._array || Array.from(parcelRes.rows || []));
      setAllocations(allocRes.rows?._array || Array.from(allocRes.rows || []));
      setLeases(leaseRes.rows?._array || Array.from(leaseRes.rows || []));
      setTransactions(txnRes.rows?._array || Array.from(txnRes.rows || []));
      setInvoices(invRes.rows?._array || Array.from(invRes.rows || []));
    } catch (e) {
      console.error('[UnivClientProfile] Fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    if (companyId) {
      const ch = supabase.channel(`univ_clients_profile_${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_re_clients', filter: `company_id=eq.${companyId}` }, fetchAllData)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
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

  const getClientDossier = (client) => {
    if (!client) return { clientAllocations: [], clientLeases: [], clientTxns: [], totalInvoiced: 0, totalPaid: 0, balance: 0 };

    const clientAllocations = allocations.filter(a =>
      a.client_id === client.id ||
      a.customer_name?.toLowerCase() === client.name?.toLowerCase() ||
      a.customer_email?.toLowerCase() === client.email?.toLowerCase()
    );

    const clientLeases = leases.filter(l =>
      l.tenant_id === client.id ||
      l.tenant_name?.toLowerCase() === client.name?.toLowerCase()
    );

    const clientTxns = transactions.filter(t =>
      t.buyer_id === client.id ||
      t.buyer_name?.toLowerCase() === client.name?.toLowerCase() ||
      t.seller_name?.toLowerCase() === client.name?.toLowerCase()
    );

    const clientInvs = invoices.filter(inv =>
      inv.customer_id === client.id ||
      inv.customer_name?.toLowerCase() === client.name?.toLowerCase()
    );

    const totalInvoiced = clientInvs.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
    const totalPaid = clientInvs.reduce((s, i) => s + (Number(i.amount_paid) || 0), 0);
    const balance = totalInvoiced - totalPaid;

    return { clientAllocations, clientLeases, clientTxns, totalInvoiced, totalPaid, balance };
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '', email: '', phone: '', type: 'buyer',
      address: '', city: '', state: '', budget: '', notes: ''
    });
    setShowEditDrawer(true);
  };

  const handleOpenEdit = (client) => {
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
      notes: client.notes || ''
    });
    setShowEditDrawer(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Client name is required');

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
        toast.success('Client updated');
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
        toast.success('New client registered');
      }

      setShowEditDrawer(false);
      setEditingId(null);
      fetchAllData();
    } catch (err) {
      console.error('[UnivClientProfile] Save error:', err);
      toast.error('Failed to save client profile');
    }
  };

  const handleDeleteClient = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this client record?')) return;
    try {
      await powerSync.execute('DELETE FROM univ_re_clients WHERE id = ?', [id]);
      toast.success('Client removed');
      if (selectedClient?.id === id) setSelectedClient(null);
      fetchAllData();
    } catch (err) {
      console.error('[UnivClientProfile] Delete error:', err);
      toast.error('Failed to delete client');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-h-[80vh] p-4 md:p-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">360° Client Dossier & Profiles</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Universal Module
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive customer records with unified land allocations, lease agreements, deals, and financial status.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add New Client
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, email, phone..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Client Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buyer">Land / Property Buyer</SelectItem>
              <SelectItem value="investor">Corporate Investor</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
              <SelectItem value="landlord">Landlord / Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Clock className="w-5 h-5 animate-spin mr-2" /> Loading client profiles...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed border-border text-center">
          <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold">No Clients Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            No customer profiles match your search criteria. Register a client to begin tracking relationships.
          </p>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add First Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const dossier = getClientDossier(client);

            return (
              <Card
                key={client.id}
                className="group hover:border-primary/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
                onClick={() => setSelectedClient(client)}
              >
                <div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                          {client.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                            {client.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] capitalize mt-1">
                            {client.type || 'Buyer'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {client.email && (
                        <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> {client.email}</p>
                      )}
                      {client.phone && (
                        <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> {client.phone}</p>
                      )}
                      {client.city && (
                        <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {[client.city, client.state].filter(Boolean).join(', ')}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-muted/40 p-2.5 rounded-lg border border-border/50">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Allocations</span>
                        <span className="font-bold text-foreground">{dossier.clientAllocations.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Leases</span>
                        <span className="font-bold text-foreground">{dossier.clientLeases.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Deals</span>
                        <span className="font-bold text-foreground">{dossier.clientTxns.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-border mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Budget: <strong className="text-foreground">{formatCurrency(client.budget || 0)}</strong></span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(client)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={(e) => handleDeleteClient(client.id, e)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 360° Profile Sheet Details */}
      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedClient && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                    {selectedClient.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selectedClient.name}</SheetTitle>
                    <SheetDescription className="capitalize">
                      {selectedClient.type || 'Buyer'} Profile • {selectedClient.city || 'National'}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="py-4 space-y-6">
                {/* Quick Info Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-muted/50 p-3 rounded-xl border border-border">
                  <div>
                    <span className="text-muted-foreground block">Email:</span>
                    <span className="font-medium truncate">{selectedClient.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Phone:</span>
                    <span className="font-medium">{selectedClient.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Budget:</span>
                    <span className="font-bold text-primary">{formatCurrency(selectedClient.budget || 0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Location:</span>
                    <span className="font-medium">{selectedClient.city || 'Ghana'}</span>
                  </div>
                </div>

                {/* 360 Dossier Tabs */}
                <Tabs defaultValue="land" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="land">Land Allocations</TabsTrigger>
                    <TabsTrigger value="leases">Leases</TabsTrigger>
                    <TabsTrigger value="deals">Transactions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="land" className="space-y-3 pt-3">
                    {getClientDossier(selectedClient).clientAllocations.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-4 text-center">No land parcel allocations on record for this customer.</p>
                    ) : (
                      getClientDossier(selectedClient).clientAllocations.map(alloc => (
                        <div key={alloc.id} className="p-3 bg-card border border-border rounded-lg text-xs space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>Plot Allocation</span>
                            <Badge variant="outline">{alloc.allocation_status}</Badge>
                          </div>
                          <p className="text-muted-foreground">Terms: {alloc.payment_terms} • Deposit: {formatCurrency(alloc.deposit_amount || 0)}</p>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="leases" className="space-y-3 pt-3">
                    {getClientDossier(selectedClient).clientLeases.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-4 text-center">No active leases on record for this customer.</p>
                    ) : (
                      getClientDossier(selectedClient).clientLeases.map(lease => (
                        <div key={lease.id} className="p-3 bg-card border border-border rounded-lg text-xs space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>{lease.property_title || 'Unit Lease'}</span>
                            <Badge variant="outline">{lease.status}</Badge>
                          </div>
                          <p className="text-muted-foreground">Rent: {formatCurrency(lease.monthly_rent || 0)}/mo • {lease.start_date} to {lease.end_date}</p>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="deals" className="space-y-3 pt-3">
                    {getClientDossier(selectedClient).clientTxns.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-4 text-center">No closed transactions on record for this customer.</p>
                    ) : (
                      getClientDossier(selectedClient).clientTxns.map(txn => (
                        <div key={txn.id} className="p-3 bg-card border border-border rounded-lg text-xs space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>{txn.property_title || 'Sale Deal'}</span>
                            <span className="font-bold text-primary">{formatCurrency(txn.sale_price || txn.amount || 0)}</span>
                          </div>
                          <p className="text-muted-foreground">Closed on: {txn.closing_date || 'Recent'}</p>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Drawer */}
      <Sheet open={showEditDrawer} onOpenChange={setShowEditDrawer}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle>{editingId ? 'Edit Client Profile' : 'Add New Client Profile'}</SheetTitle>
            <SheetDescription>Enter buyer, tenant, or corporate client details.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveClient} className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label>Client Full Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Legal Name or Entity"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@domain.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+233..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Client Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Land / Property Buyer</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Budget ($)</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
              <Input
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="State / Region"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <textarea
                className="w-full h-20 p-2 text-sm bg-background border border-border rounded-md"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Client requirements, preferences..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowEditDrawer(false)}>Cancel</Button>
              <Button type="submit"><Save className="w-4 h-4 mr-1.5" /> Save Client</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
