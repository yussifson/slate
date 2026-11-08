import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock, Plus, Edit, Trash2, Search, DollarSign, CheckCircle2, Clock, AlertCircle,
  Shield, Building2, Eye, User, FileText
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
  held: { label: 'Funds Held in Escrow', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  released: { label: 'Released / Finalized', badge: 'bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30', dot: 'bg-emerald-500' },
  refunded: { label: 'Refunded / Terminated', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30', dot: 'bg-rose-500' },
  disputed: { label: 'Disputed Hold', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30', dot: 'bg-purple-500' }
};

export default function JCLEscrowAccounts() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [escrows, setEscrows] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sheet / Modal State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    escrowType: 'earnest_money',
    escrowAmount: 15000,
    buyerName: '',
    sellerName: '',
    propertyId: '',
    propertyAddress: '',
    escrowAgentName: '',
    escrowAgentCompany: '',
    releaseDate: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
    releaseConditions: 'Satisfactory home inspection & title search clearance',
    releaseStatus: 'held',
  });

  const fetchEscrowsData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [escRes, propRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_escrow_accounts WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      setEscrows(escRes.rows._array || Array.from(escRes.rows || []));
      setProperties(propRes.rows._array || Array.from(propRes.rows || []));
    } catch (_err) {
      toast.error('Failed to load escrow accounts');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEscrowsData();
  }, [companyId]);

  // Statistics
  const stats = useMemo(() => {
    const totalHeld = escrows.filter(e => e.release_status === 'held').reduce((sum, e) => sum + (Number(e.escrow_amount) || 0), 0);
    const totalReleased = escrows.filter(e => e.release_status === 'released').reduce((sum, e) => sum + (Number(e.escrow_amount) || 0), 0);
    const totalCount = escrows.length;
    const activeCount = escrows.filter(e => e.release_status === 'held').length;

    return { totalHeld, totalReleased, totalCount, activeCount };
  }, [escrows]);

  const filteredEscrows = useMemo(() => {
    return escrows.filter(item => {
      const matchSearch = !search ||
        item.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        item.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.seller_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.escrow_agent_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || item.release_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [escrows, search, statusFilter]);

  const handleSaveEscrow = async (e) => {
    e.preventDefault();
    if (!formData.propertyAddress || !formData.escrowAmount) {
      toast.error('Property address and escrow amount are required');
      return;
    }

    try {
      const newId = editingId || generateUUID();
      const now = new Date().toISOString();

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_escrow_accounts SET
            escrow_type = ?, escrow_amount = ?, buyer_name = ?, seller_name = ?,
            property_id = ?, property_address = ?, escrow_agent_name = ?,
            escrow_agent_company = ?, release_date = ?, release_conditions = ?,
            release_status = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.escrowType, Number(formData.escrowAmount) || 0, formData.buyerName, formData.sellerName,
            formData.propertyId || null, formData.propertyAddress, formData.escrowAgentName,
            formData.escrowAgentCompany, formData.releaseDate, formData.releaseConditions,
            formData.releaseStatus, editingId, companyId
          ]
        );
        toast.success('Escrow record updated');
      } else {
        await powerSync.execute(
          `INSERT INTO univ_re_escrow_accounts (
            id, created_at, company_id, escrow_type, escrow_amount, buyer_name, seller_name,
            property_id, property_address, escrow_agent_name, escrow_agent_company,
            release_date, release_conditions, release_status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId, formData.escrowType, Number(formData.escrowAmount) || 0,
            formData.buyerName, formData.sellerName, formData.propertyId || null,
            formData.propertyAddress, formData.escrowAgentName, formData.escrowAgentCompany,
            formData.releaseDate, formData.releaseConditions, formData.releaseStatus, user?.id || null
          ]
        );
        toast.success('Escrow record logged');
      }

      setShowForm(false);
      setEditingId(null);
      fetchEscrowsData();
    } catch (_err) {
      toast.error('Failed to save escrow record');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_re_escrow_accounts SET release_status = ? WHERE id = ? AND company_id = ?`,
        [newStatus, id, companyId]
      );
      toast.success(`Escrow status changed to ${newStatus}`);
      fetchEscrowsData();
    } catch (_err) {
      toast.error('Failed to update escrow status');
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans overflow-x-hidden">
      {/* ── 1. Header (Clean mobile native header, no sub-description, no refresh button) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
            Escrow Accounts
          </h1>
        </div>

        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              escrowType: 'earnest_money', escrowAmount: 15000, buyerName: '', sellerName: '',
              propertyId: properties[0]?.id || '', propertyAddress: properties[0]?.address || '',
              escrowAgentName: '', escrowAgentCompany: '', releaseDate: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
              releaseConditions: 'Satisfactory home inspection & title clearance', releaseStatus: 'held'
            });
            setShowForm(true);
          }}
          size="sm"
          className="w-full sm:w-auto h-9 px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-sm rounded-xl gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Escrow</span>
        </Button>
      </div>

      {/* ── 2. Dedicated Mobile 2x2 Stats Grid (< md) & Desktop Row (>= md) ── */}
      <div className="grid grid-cols-2 md:hidden gap-2.5">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Held Funds</span>
          </div>
          <p className="text-sm font-black text-amber-600 truncate">{formatCurrency(stats.totalHeld, 'USD')}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">{stats.activeCount} active holds</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Released</span>
          </div>
          <p className="text-sm font-black text-[#005A9C] truncate">{formatCurrency(stats.totalReleased, 'USD')}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Disbursed</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Vaults</span>
          </div>
          <p className="text-sm font-black text-foreground truncate">{stats.totalCount}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Total records</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <DollarSign className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Deposit</span>
          </div>
          <p className="text-sm font-black text-foreground truncate">
            {formatCurrency(stats.totalCount > 0 ? (stats.totalHeld + stats.totalReleased) / stats.totalCount : 0, 'USD')}
          </p>
          <span className="text-[9px] text-muted-foreground font-semibold">Per deal</span>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Held Funds</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(stats.totalHeld, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">{stats.activeCount} active earnest holds</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Released at Closing</p>
              <p className="text-2xl font-bold text-[#005A9C] dark:text-[#FF6B00]">
                {formatCurrency(stats.totalReleased, 'USD')}
              </p>
              <p className="text-[11px] text-emerald-600/80">Successfully disbursed</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Escrow Vaults</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalCount}</p>
              <p className="text-[11px] text-muted-foreground">Deal escrow records</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Earnest Deposit</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalCount > 0 ? (stats.totalHeld + stats.totalReleased) / stats.totalCount : 0, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Per deal security</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card border border-border/80 p-2.5 sm:p-3 rounded-2xl shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search escrows by property, buyer, agent..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 sm:pl-9 h-9 text-xs bg-background rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] sm:w-[170px] bg-background rounded-xl shrink-0">
              <SelectValue placeholder="Escrow Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="held" className="text-xs">Held in Escrow</SelectItem>
              <SelectItem value="released" className="text-xs">Released</SelectItem>
              <SelectItem value="refunded" className="text-xs">Refunded</SelectItem>
              <SelectItem value="disputed" className="text-xs">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 4. Mobile Escrow Cards (< md) ── */}
      <div className="md:hidden space-y-2.5">
        {filteredEscrows.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
            No escrow accounts found.
          </div>
        ) : (
          filteredEscrows.map(item => {
            const st = STATUS_CONFIG[item.release_status] || STATUS_CONFIG.held;
            return (
              <div key={item.id} className="bg-card border border-border/80 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-foreground truncate">{item.property_address || 'Property Deal'}</h3>
                    <p className="text-[10px] text-muted-foreground">Buyer: {item.buyer_name || 'N/A'} • Seller: {item.seller_name || 'N/A'}</p>
                  </div>
                  <span className="font-bold font-mono text-sm text-[#005A9C] shrink-0">
                    {formatCurrency(item.escrow_amount, 'USD')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground truncate">
                    <span>{item.escrow_agent_name || 'Title Escrow Co'}</span>
                    {item.release_date && <span className="ml-1 font-mono">({item.release_date})</span>}
                  </div>
                  <Select
                    value={item.release_status}
                    onValueChange={v => handleStatusChange(item.id, v)}
                  >
                    <SelectTrigger className="h-7 text-[10px] w-[100px] rounded-lg shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="held" className="text-xs">Hold</SelectItem>
                      <SelectItem value="released" className="text-xs">Release</SelectItem>
                      <SelectItem value="refunded" className="text-xs">Refund</SelectItem>
                      <SelectItem value="disputed" className="text-xs">Dispute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 5. Desktop Escrow Table (>= md) ── */}
      <div className="hidden md:block border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4">Property / Deal</th>
                <th className="py-3 px-4">Buyer / Seller</th>
                <th className="py-3 px-4">Escrow Amount</th>
                <th className="py-3 px-4">Escrow Agent</th>
                <th className="py-3 px-4">Release Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEscrows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No escrow accounts found.
                  </td>
                </tr>
              ) : (
                filteredEscrows.map(item => {
                  const st = STATUS_CONFIG[item.release_status] || STATUS_CONFIG.held;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.property_address || 'Property Transaction'}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        <div>B: {item.buyer_name || 'N/A'}</div>
                        <div className="text-[10px] text-muted-foreground">S: {item.seller_name || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#005A9C] dark:text-[#FF6B00] font-mono text-sm">
                        {formatCurrency(item.escrow_amount, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div>{item.escrow_agent_name || 'Title Escrow Co'}</div>
                        <div className="text-[10px]">{item.escrow_agent_company}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {item.release_date || 'Target Close'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border gap-1 rounded-lg", st.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Select
                          value={item.release_status}
                          onValueChange={v => handleStatusChange(item.id, v)}
                        >
                          <SelectTrigger className="h-7 text-[10px] w-[110px] ml-auto rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="held" className="text-xs">Hold</SelectItem>
                            <SelectItem value="released" className="text-xs">Release</SelectItem>
                            <SelectItem value="refunded" className="text-xs">Refund</SelectItem>
                            <SelectItem value="disputed" className="text-xs">Dispute</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Form Sheet ── */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] p-4 sm:p-6">
          <SheetHeader className="mb-4">
            <SheetTitle>Register Earnest Escrow</SheetTitle>
            <SheetDescription>Log earnest deposit and third-party escrow parameters</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveEscrow} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Property Address</Label>
              <Input
                value={formData.propertyAddress}
                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                placeholder="e.g. 742 Evergreen Terrace"
                className="h-9 text-xs mt-1 rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Buyer Name</Label>
                <Input
                  value={formData.buyerName}
                  onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                  placeholder="Buyer full name"
                  className="h-9 text-xs mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Seller Name</Label>
                <Input
                  value={formData.sellerName}
                  onChange={e => setFormData({ ...formData, sellerName: e.target.value })}
                  placeholder="Seller full name"
                  className="h-9 text-xs mt-1 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Escrow Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.escrowAmount}
                  onChange={e => setFormData({ ...formData, escrowAmount: e.target.value })}
                  className="h-9 text-xs mt-1 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Target Release Date</Label>
                <Input
                  type="date"
                  value={formData.releaseDate}
                  onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                  className="h-9 text-xs mt-1 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Escrow Officer Name</Label>
                <Input
                  value={formData.escrowAgentName}
                  onChange={e => setFormData({ ...formData, escrowAgentName: e.target.value })}
                  placeholder="Officer name"
                  className="h-9 text-xs mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Escrow Company</Label>
                <Input
                  value={formData.escrowAgentCompany}
                  onChange={e => setFormData({ ...formData, escrowAgentCompany: e.target.value })}
                  placeholder="Company / Agency"
                  className="h-9 text-xs mt-1 rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Release Conditions</Label>
              <Input
                value={formData.releaseConditions}
                onChange={e => setFormData({ ...formData, releaseConditions: e.target.value })}
                placeholder="Disbursement prerequisites..."
                className="h-9 text-xs mt-1 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white mt-2 rounded-xl">
              Save Escrow Vault
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
