import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Plus, Search, Edit,
  Trash2, CheckCircle2, AlertCircle, RefreshCw, Eye, Grid,
  List, Building2, XCircle, ArrowRight
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STATUS_CONFIG = {
  pending: { label: 'Under Consideration', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  accepted: { label: 'Offer Accepted', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  countered: { label: 'Counter-Offered', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  rejected: { label: 'Offer Declined', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' },
  expired: { label: 'Offer Expired', badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30' }
};

export default function JCLOffers() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [offers, setOffers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sheet / Modal State
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorOffer, setInspectorOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: '',
    propertyAddress: '',
    buyerId: '',
    buyerName: '',
    offerAmount: 450000,
    earnestMoney: 25000,
    contingencies: 'Financing (21 days), Appraisal, Home Inspection (10 days)',
    offerDate: format(new Date(), 'yyyy-MM-dd'),
    expirationDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: 'pending',
    agentName: user?.user_metadata?.full_name || 'Assigned Broker',
    notes: ''
  });

  const fetchOffersData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [offRes, propRes, clientRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      const offList = offRes.rows._array || Array.from(offRes.rows || []);
      const propList = propRes.rows._array || Array.from(propRes.rows || []);
      const clientList = clientRes.rows._array || Array.from(clientRes.rows || []);

      setOffers(offList);
      setProperties(propList);
      setClients(clientList);
    } catch (_err) {
      toast.error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersData();
  }, [companyId]);

  // Statistics
  const stats = useMemo(() => {
    const total = offers.length;
    const pending = offers.filter(o => o.status === 'pending').length;
    const accepted = offers.filter(o => o.status === 'accepted').length;
    const totalOfferedValue = offers.reduce((sum, o) => sum + (Number(o.offer_amount) || 0), 0);
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return { total, pending, accepted, totalOfferedValue, acceptanceRate };
  }, [offers]);

  // Filtered Offers
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchSearch = !search ||
        o.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        o.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.agent_name?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [offers, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      propertyId: properties[0]?.id || '',
      propertyAddress: properties[0]?.address || '',
      buyerId: clients[0]?.id || '',
      buyerName: clients[0]?.name || '',
      offerAmount: 450000,
      earnestMoney: 25000,
      contingencies: 'Financing (21 days), Appraisal, Home Inspection (10 days)',
      offerDate: format(new Date(), 'yyyy-MM-dd'),
      expirationDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status: 'pending',
      agentName: user?.user_metadata?.full_name || 'Assigned Broker',
      notes: ''
    });
    setShowFormSheet(true);
  };

  const handleOpenEdit = (o) => {
    setEditingId(o.id);
    setFormData({
      propertyId: o.property_id || '',
      propertyAddress: o.property_address || '',
      buyerId: o.buyer_id || '',
      buyerName: o.buyer_name || '',
      offerAmount: o.offer_amount || 0,
      earnestMoney: o.earnest_money || 0,
      contingencies: o.contingencies || '',
      offerDate: o.offer_date || '',
      expirationDate: o.expiration_date || '',
      status: o.status || 'pending',
      agentName: o.agent_name || '',
      notes: o.notes || ''
    });
    setShowFormSheet(true);
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!formData.propertyAddress || !formData.buyerName) {
      toast.error('Property address and buyer name are required');
      return;
    }

    try {
      const now = new Date().toISOString();

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_offers SET
            property_id = ?, property_address = ?, buyer_id = ?, buyer_name = ?,
            offer_amount = ?, earnest_money = ?, contingencies = ?, offer_date = ?,
            expiration_date = ?, status = ?, agent_name = ?, notes = ?, updated_at = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.propertyId || null, formData.propertyAddress,
            formData.buyerId || null, formData.buyerName,
            Number(formData.offerAmount) || 0, Number(formData.earnestMoney) || 0,
            formData.contingencies || null, formData.offerDate,
            formData.expirationDate || null, formData.status,
            formData.agentName || null, formData.notes || null,
            now, editingId, companyId
          ]
        );
        toast.success('Offer updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_offers (
            id, created_at, company_id, property_id, property_address,
            buyer_id, buyer_name, offer_amount, earnest_money, contingencies,
            offer_date, expiration_date, status, agent_id, agent_name, notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId,
            formData.propertyId || null, formData.propertyAddress,
            formData.buyerId || null, formData.buyerName,
            Number(formData.offerAmount) || 0, Number(formData.earnestMoney) || 0,
            formData.contingencies || null, formData.offerDate,
            formData.expirationDate || null, formData.status,
            user?.id || null, formData.agentName || null,
            formData.notes || null, now
          ]
        );
        toast.success('Purchase offer registered');
      }

      setShowFormSheet(false);
      fetchOffersData();
      if (inspectorOffer && inspectorOffer.id === editingId) {
        setInspectorOffer(prev => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error('Failed to save offer');
    }
  };

  const handleUpdateStatus = async (offerId, newStatus) => {
    try {
      const now = new Date().toISOString();
      await powerSync.execute(
        `UPDATE univ_re_offers SET status = ?, updated_at = ? WHERE id = ? AND company_id = ?`,
        [newStatus, now, offerId, companyId]
      );
      toast.success(`Offer marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      fetchOffersData();
      if (inspectorOffer && inspectorOffer.id === offerId) {
        setInspectorOffer(prev => ({ ...prev, status: newStatus }));
      }
    } catch (_err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteOffer = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_offers WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success('Offer removed');
      setDeleteTarget(null);
      if (inspectorOffer?.id === deleteTarget.id) setInspectorOffer(null);
      fetchOffersData();
    } catch (_err) {
      toast.error('Failed to delete offer');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Purchase Offers & Negotiations
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Purchase bids, earnest deposits, counter-offers, and buyer contingency tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOffersData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create Offer
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Offers</p>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-[11px] text-muted-foreground">In active review / counter</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accepted Offers</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.accepted}</p>
              <p className="text-[11px] text-emerald-600/80">{stats.acceptanceRate}% acceptance rate</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Offered Value</p>
              <p className="text-2xl font-bold text-foreground truncate">
                {formatCurrency(stats.totalOfferedValue, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Cumulative bid volume</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Offers Logged</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">Historical bid records</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters & View Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, buyer, agent..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Offer Statuses</SelectItem>
              <SelectItem value="pending" className="text-xs">Under Consideration</SelectItem>
              <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
              <SelectItem value="countered" className="text-xs">Countered</SelectItem>
              <SelectItem value="rejected" className="text-xs">Declined</SelectItem>
              <SelectItem value="expired" className="text-xs">Expired</SelectItem>
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
      {filteredOffers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
          <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No purchase offers found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No purchase bids match your search filters.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Offer
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map(offer => {
            const st = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;

            return (
                <div
                  key={offer.id}
                  onClick={() => setInspectorOffer(offer)}
                  className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  {/* Colour Banner Header */}
                  <div className={cn(
                    "relative h-28 flex flex-col justify-between p-4 overflow-hidden",
                    offer.status === 'accepted' ? 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500' :
                    offer.status === 'pending' ? 'bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400' :
                    offer.status === 'countered' ? 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500' :
                    'bg-gradient-to-br from-rose-700 via-rose-600 to-pink-500'
                  )}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="flex items-start justify-between relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                        Purchase Bid
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {st.label}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Offered Amount</p>
                      <p className="text-2xl font-extrabold text-white tracking-tight">
                        {formatCurrency(offer.offer_amount, 'USD')}
                      </p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <h3 className="font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {offer.property_address}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Buyer: <strong className="text-foreground">{offer.buyer_name}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-muted-foreground block mb-0.5">Offer Date</span>
                        <span className="font-bold text-foreground">{offer.offer_date || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-semibold text-muted-foreground block mb-0.5">Expiration</span>
                        <span className="font-bold text-foreground">{offer.expiration_date || 'N/A'}</span>
                      </div>
                    </div>

                    {offer.earnest_money > 0 && (
                      <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-muted-foreground font-medium">Earnest Money Deposit</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(offer.earnest_money, 'USD')}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[8px] font-extrabold shrink-0">
                          {(offer.agent_name || 'A')[0].toUpperCase()}
                        </div>
                        <span className="truncate font-medium">{offer.agent_name || 'Assigned Agent'}</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                          onClick={() => setInspectorOffer(offer)}
                          title="Inspect Offer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(offer)}
                          title="Edit Offer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => setDeleteTarget(offer)}
                          title="Delete Offer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Property Address</th>
                  <th className="py-3 px-4">Buyer Name</th>
                  <th className="py-3 px-4">Offered Price</th>
                  <th className="py-3 px-4">Earnest Deposit</th>
                  <th className="py-3 px-4">Offer Date</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOffers.map(offer => {
                  const st = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
                  return (
                    <tr
                      key={offer.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setInspectorOffer(offer)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                        {offer.property_address}
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-medium">{offer.buyer_name}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(offer.offer_amount, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {formatCurrency(offer.earnest_money, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{offer.offer_date}</td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{offer.expiration_date || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border", st.badge)}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setInspectorOffer(offer)}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(offer)}
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600"
                            onClick={() => setDeleteTarget(offer)}
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

      {/* ── 5. Slide-Over Inspector ── */}
      <Sheet open={!!inspectorOffer} onOpenChange={open => !open && setInspectorOffer(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          {inspectorOffer && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                    Offer Details
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium border",
                      (STATUS_CONFIG[inspectorOffer.status] || STATUS_CONFIG.pending).badge
                    )}
                  >
                    {(STATUS_CONFIG[inspectorOffer.status] || STATUS_CONFIG.pending).label}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground mt-2">
                  {inspectorOffer.property_address}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Buyer: <strong className="text-foreground">{inspectorOffer.buyer_name}</strong>
                </SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-6 flex-1">
                <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Offer Amount</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(inspectorOffer.offer_amount, 'USD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Earnest Money</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(inspectorOffer.earnest_money, 'USD')}</p>
                  </div>
                </div>

                {/* Status Quick-Actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Negotiation Status Actions</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      onClick={() => handleUpdateStatus(inspectorOffer.id, 'accepted')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Accept Offer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      onClick={() => handleUpdateStatus(inspectorOffer.id, 'countered')}
                    >
                      <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      Counter Offer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-rose-500/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => handleUpdateStatus(inspectorOffer.id, 'rejected')}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Decline Offer
                    </Button>
                  </div>
                </div>

                {inspectorOffer.contingencies && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contingencies & Terms</h4>
                    <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed">
                      {inspectorOffer.contingencies}
                    </p>
                  </div>
                )}

                {inspectorOffer.notes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</h4>
                    <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed">
                      {inspectorOffer.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(inspectorOffer)}
                  className="text-xs gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Offer
                </Button>

                <Button
                  size="sm"
                  onClick={() => setInspectorOffer(null)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 6. Create / Edit Offer Modal ── */}
      <Sheet open={showFormSheet} onOpenChange={setShowFormSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          <SheetHeader className="p-6 border-b border-border bg-muted/20">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Purchase Offer' : 'Register Purchase Offer'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Log purchase proposal, earnest money deposit, and expiration date
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveOffer} className="p-6 space-y-4 flex-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Property Address *</Label>
              <Input
                required
                placeholder="e.g. 104 Oceanfront Boulevard"
                value={formData.propertyAddress}
                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Buyer Name *</Label>
                <Input
                  required
                  placeholder="e.g. Jonathan Blake"
                  value={formData.buyerName}
                  onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assigned Agent</Label>
                <Input
                  placeholder="e.g. Marcus Vance"
                  value={formData.agentName}
                  onChange={e => setFormData({ ...formData, agentName: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Offer Amount ($) *</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.offerAmount}
                  onChange={e => setFormData({ ...formData, offerAmount: e.target.value })}
                  className="text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Earnest Money Deposit ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.earnestMoney}
                  onChange={e => setFormData({ ...formData, earnestMoney: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Offer Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.offerDate}
                  onChange={e => setFormData({ ...formData, offerDate: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Expiration Date</Label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Offer Status</Label>
              <Select
                value={formData.status}
                onValueChange={val => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="text-xs">Under Consideration</SelectItem>
                  <SelectItem value="accepted" className="text-xs">Offer Accepted</SelectItem>
                  <SelectItem value="countered" className="text-xs">Counter-Offered</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Offer Declined</SelectItem>
                  <SelectItem value="expired" className="text-xs">Offer Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Contingencies & Conditions</Label>
              <textarea
                rows={2}
                placeholder="Financing, appraisal, inspection timelines..."
                value={formData.contingencies}
                onChange={e => setFormData({ ...formData, contingencies: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notes</Label>
              <textarea
                rows={2}
                placeholder="Seller response deadline, lender pre-approval notes..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFormSheet(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
              >
                {editingId ? 'Save Changes' : 'Register Offer'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── 7. Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Offer Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete the offer for <strong className="text-foreground">{deleteTarget?.property_address}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOffer}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
