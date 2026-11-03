import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Plus, Search, Edit, Trash2, TrendingUp, Clock, CheckCircle2, AlertCircle, MessageSquare, RefreshCw
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
  pending: { label: 'Pending Response', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  accepted: { label: 'Offer Accepted', badge: 'bg-[#006065]/10 text-emerald-700 dark:text-emerald-400 border-[#006065]/30', dot: 'bg-emerald-500' },
  rejected: { label: 'Counter Declined', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30', dot: 'bg-rose-500' },
  expired: { label: 'Offer Expired', badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30', dot: 'bg-slate-400' }
};

export default function JCLCounterOffers() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [counterOffers, setCounterOffers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorOffer, setInspectorOffer] = useState(null);

  const [formData, setFormData] = useState({
    originalOfferId: '',
    propertyAddress: '',
    buyerName: '',
    originalPrice: 450000,
    counterPrice: 475000,
    earnestMoney: 15000,
    contingencies: '7-day inspection waiver, pre-approval letter attached',
    expirationDate: format(new Date(Date.now() + 5 * 86400000), 'yyyy-MM-dd'),
    notes: '',
    status: 'pending',
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [counterRes, offerRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_counter_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId])
      ]);

      setCounterOffers(counterRes.rows._array || Array.from(counterRes.rows || []));
      setOffers(offerRes.rows._array || Array.from(offerRes.rows || []));
    } catch (_err) {
      toast.error('Failed to load counter offers');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const stats = useMemo(() => {
    const total = counterOffers.length;
    const pending = counterOffers.filter(o => o.status === 'pending').length;
    const accepted = counterOffers.filter(o => o.status === 'accepted').length;
    const totalVolume = counterOffers.reduce((sum, o) => sum + (Number(o.counter_price) || 0), 0);

    return { total, pending, accepted, totalVolume };
  }, [counterOffers]);

  const filteredCounterOffers = useMemo(() => {
    return counterOffers.filter(o => {
      const matchSearch = !search ||
        o.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        o.buyer_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [counterOffers, search, statusFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.counterPrice || !formData.propertyAddress) {
      toast.error('Counter price and property address are required');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_counter_offers SET
            counter_price = ?, earnest_money = ?, contingencies = ?,
            expiration_date = ?, notes = ?, status = ?
          WHERE id = ? AND company_id = ?`,
          [
            Number(formData.counterPrice) || 0, Number(formData.earnestMoney) || 0,
            formData.contingencies || null, formData.expirationDate || null,
            formData.notes || null, formData.status || 'pending',
            editingId, companyId
          ]
        );
        toast.success('Counter offer updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_counter_offers (
            id, created_at, company_id, original_offer_id, property_address,
            buyer_name, original_price, counter_price, earnest_money,
            contingencies, expiration_date, notes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId, formData.originalOfferId || null,
            formData.propertyAddress, formData.buyerName || null,
            Number(formData.originalPrice) || 0, Number(formData.counterPrice) || 0,
            Number(formData.earnestMoney) || 0, formData.contingencies || null,
            formData.expirationDate || null, formData.notes || null, formData.status || 'pending'
          ]
        );
        toast.success('Counter offer sent');
      }

      setShowForm(false);
      fetchData();
    } catch (_err) {
      toast.error('Failed to save counter offer');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_re_counter_offers SET status = ? WHERE id = ? AND company_id = ?`,
        [newStatus, id, companyId]
      );
      toast.success(`Counter offer marked as ${newStatus}`);
      fetchData();
    } catch (_err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#006065] to-[#004e52] flex items-center justify-center text-white shadow-md shadow-[#006065]/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Counter Offers & Price Negotiation Matrix
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Side-by-side offer diffing, counter-price adjustments, and seller response workflow
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({
                originalOfferId: offers[0]?.id || '', propertyAddress: offers[0]?.property_address || '',
                buyerName: offers[0]?.buyer_name || '', originalPrice: offers[0]?.offer_amount || 450000,
                counterPrice: (offers[0]?.offer_amount || 450000) + 15000, earnestMoney: 15000,
                contingencies: '7-day inspection waiver, pre-approval letter attached',
                expirationDate: format(new Date(Date.now() + 5 * 86400000), 'yyyy-MM-dd'), notes: '', status: 'pending'
              });
              setShowForm(true);
            }}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-[#006065] hover:bg-[#004e52] text-white shadow-md shadow-[#006065]/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Counter Offer
          </Button>
        </div>
      </div>

      {/* ── KPI Hero Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Negotiations</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
              <p className="text-[11px] text-muted-foreground">Awaiting buyer response</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accepted Counters</p>
              <p className="text-2xl font-bold text-[#006065] dark:text-[#fad503]">{stats.accepted}</p>
              <p className="text-[11px] text-emerald-600/80">Converted to binding deal</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#006065]/10 text-[#006065] dark:text-[#fad503] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Countered Volume</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalVolume, 'USD')}</p>
              <p className="text-[11px] text-muted-foreground">Total counter valuations</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Counter Logs</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">Negotiation records</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, buyer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
              <SelectItem value="rejected" className="text-xs">Declined</SelectItem>
              <SelectItem value="expired" className="text-xs">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Counter Offers Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCounterOffers.map(item => {
          const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
          const delta = (item.counter_price || 0) - (item.original_price || 0);
          const bannerColor = 'from-emerald-800 via-emerald-700 to-emerald-600';

          const buyerInitials = (item.buyer_name || 'B').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

          return (
            <div
              key={item.id}
              className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Gradient Banner Header */}
              <div className={cn("relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br", bannerColor)}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="flex items-start justify-between relative z-10">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                    Counter Proposal
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    {st.label}
                  </span>
                </div>

                <div className="relative z-10">
                  <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest mb-0.5">Counter Price</p>
                  <p className="text-2xl font-extrabold text-white tracking-tight">
                    {formatCurrency(item.counter_price, 'USD')}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {item.property_address || 'Property Counter Proposal'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Buyer: <strong className="text-foreground">{item.buyer_name || 'Prospect'}</strong></p>
                </div>

                {/* Side-by-Side Comparison Box */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/30 border border-border/60 text-center font-mono">
                  <div>
                    <span className="text-[9px] uppercase text-muted-foreground block mb-0.5">Original Offer</span>
                    <span className="text-xs font-bold text-muted-foreground line-through">{formatCurrency(item.original_price, 'USD')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-[#006065] dark:text-[#fad503] block mb-0.5">Counter Price</span>
                    <span className="text-sm font-extrabold text-[#006065] dark:text-[#fad503]">{formatCurrency(item.counter_price, 'USD')}</span>
                  </div>
                </div>

                {delta !== 0 && (
                  <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-[#006065]/10 border border-[#006065]/20">
                    <span className="text-muted-foreground font-medium">Price Delta</span>
                    <span className="font-bold font-mono text-[#006065] dark:text-[#fad503]">
                      {delta > 0 ? `+${formatCurrency(delta, 'USD')}` : formatCurrency(delta, 'USD')}
                    </span>
                  </div>
                )}

                {/* Footer Strip */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[9px] font-extrabold shrink-0">
                      {buyerInitials}
                    </div>
                    <span className="truncate font-mono text-[10px]">Exp: {item.expiration_date || 'N/A'}</span>
                  </div>

                  <Select value={item.status} onValueChange={v => handleStatusChange(item.id, v)}>
                    <SelectTrigger className="h-7 text-[10px] w-[120px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                      <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
                      <SelectItem value="rejected" className="text-xs">Declined</SelectItem>
                      <SelectItem value="expired" className="text-xs">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Form Sheet ── */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Generate Counter Offer</SheetTitle>
            <SheetDescription>Adjust seller counter price and contingency conditions</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Property Address</Label>
              <Input
                value={formData.propertyAddress}
                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                className="h-9 text-xs mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Original Offer ($)</Label>
                <Input
                  type="number"
                  value={formData.originalPrice}
                  onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Seller Counter ($)</Label>
                <Input
                  type="number"
                  value={formData.counterPrice}
                  onChange={e => setFormData({ ...formData, counterPrice: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Contingencies & Special Conditions</Label>
              <Input
                value={formData.contingencies}
                onChange={e => setFormData({ ...formData, contingencies: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#006065] hover:bg-[#004e52] text-white mt-2">
              Send Counter Offer
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
