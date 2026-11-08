import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Plus, Search, Edit, Trash2, TrendingUp, Clock, CheckCircle2, 
  AlertCircle, MessageSquare, RefreshCw, Eye, List, ArrowRight
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
  accepted: { label: 'Offer Accepted', badge: 'bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30', dot: 'bg-emerald-500' },
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

  const handleStatusChange = async (id, status) => {
    try {
      await powerSync.execute(
        'UPDATE univ_re_counter_offers SET status = ? WHERE id = ? AND company_id = ?',
        [status, id, companyId]
      );
      toast.success('Counter offer status updated');
      fetchData();
    } catch (_err) {
      toast.error('Failed to update counter offer');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const now = new Date().toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_counter_offers SET
            property_address = ?, buyer_name = ?, original_price = ?,
            counter_price = ?, earnest_money = ?, contingencies = ?,
            expiration_date = ?, notes = ?, status = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.propertyAddress, formData.buyerName, Number(formData.originalPrice) || 0,
            Number(formData.counterPrice) || 0, Number(formData.earnestMoney) || 0, formData.contingencies,
            formData.expirationDate, formData.notes, formData.status,
            editingId, companyId
          ]
        );
        toast.success('Counter offer revised');
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
            formData.propertyAddress, formData.buyerName, Number(formData.originalPrice) || 0,
            Number(formData.counterPrice) || 0, Number(formData.earnestMoney) || 0,
            formData.contingencies, formData.expirationDate, formData.notes, formData.status
          ]
        );
        toast.success('Counter offer generated');
      }
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (_err) {
      toast.error('Failed to submit counter offer');
    }
  };

  const handleDelete = async (id) => {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_counter_offers WHERE id = ? AND company_id = ?',
        [id, companyId]
      );
      toast.success('Counter offer removed');
      fetchData();
    } catch (_err) {
      toast.error('Failed to delete counter offer');
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Counter Offers & Negotiations
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seller counter proposals, buyer price revisions, and contingency adjustments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({
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
              setShowForm(true);
            }}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-md shadow-[#005A9C]/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Counter Offer
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Response</p>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-[11px] text-muted-foreground">Awaiting buyer decision</p>
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
              <p className="text-2xl font-bold text-[#005A9C] dark:text-[#FF6B00]">{stats.accepted}</p>
              <p className="text-[11px] text-emerald-600/80">Converted to binding deal</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
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

      {/* ── 3. Filters ── */}
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

      {/* ── 4. Main Body: Clean Data Table List View ── */}
      {filteredCounterOffers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
          <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No counter offers found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No counter proposals match your search filters.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Property Address</th>
                  <th className="py-3 px-4">Buyer / Prospect</th>
                  <th className="py-3 px-4">Original Offer</th>
                  <th className="py-3 px-4">Counter Price</th>
                  <th className="py-3 px-4">Delta (Difference)</th>
                  <th className="py-3 px-4">Earnest Deposit</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCounterOffers.map(item => {
                  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                  const delta = (item.counter_price || 0) - (item.original_price || 0);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setInspectorOffer(item)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                        {item.property_address || 'Property Counter Proposal'}
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-medium">
                        {item.buyer_name || 'Prospect'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground line-through">
                        {formatCurrency(item.original_price, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#005A9C] dark:text-[#FF6B00]">
                        {formatCurrency(item.counter_price, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {delta !== 0 ? (
                          <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded", delta > 0 ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" : "text-rose-700 bg-rose-50")}>
                            {delta > 0 ? `+${formatCurrency(delta, 'USD')}` : formatCurrency(delta, 'USD')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {formatCurrency(item.earnest_money, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {item.expiration_date || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                        <Select value={item.status} onValueChange={v => handleStatusChange(item.id, v)}>
                          <SelectTrigger className={cn("h-7 text-[10px] w-[125px] font-medium border", st.badge)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                            <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
                            <SelectItem value="rejected" className="text-xs">Declined</SelectItem>
                            <SelectItem value="expired" className="text-xs">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingId(item.id);
                              setFormData({
                                originalOfferId: item.original_offer_id || '',
                                propertyAddress: item.property_address || '',
                                buyerName: item.buyer_name || '',
                                originalPrice: item.original_price || 0,
                                counterPrice: item.counter_price || 0,
                                earnestMoney: item.earnest_money || 0,
                                contingencies: item.contingencies || '',
                                expirationDate: item.expiration_date || '',
                                notes: item.notes || '',
                                status: item.status || 'pending',
                              });
                              setShowForm(true);
                            }}
                            title="Edit Counter"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
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

      {/* ── Form Sheet ── */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingId ? 'Edit Counter Offer' : 'Generate Counter Offer'}</SheetTitle>
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
            <div>
              <Label className="text-xs">Buyer Name</Label>
              <Input
                value={formData.buyerName}
                onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                className="h-9 text-xs mt-1"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Earnest Money ($)</Label>
                <Input
                  type="number"
                  value={formData.earnestMoney}
                  onChange={e => setFormData({ ...formData, earnestMoney: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Expiration Date</Label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="h-9 text-xs mt-1">
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
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white">
              {editingId ? 'Update Counter Offer' : 'Save Counter Offer'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
