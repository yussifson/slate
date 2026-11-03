import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock, Plus, Edit, Trash2, Search, DollarSign, CheckCircle2, Clock, AlertCircle,
  RefreshCw, Shield, Building2, Eye, User, FileText
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
  held: { label: 'Funds Held in Escrow', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  released: { label: 'Released / Closing Finalized', badge: 'bg-[#006065]/10 text-emerald-700 dark:text-emerald-400 border-[#006065]/30', dot: 'bg-emerald-500' },
  refunded: { label: 'Refunded / Contract Terminated', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30', dot: 'bg-rose-500' },
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
  const [inspectorEscrow, setInspectorEscrow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    return escrows.filter(e => {
      const matchSearch = !search ||
        e.escrow_agent_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        e.buyer_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.release_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [escrows, search, statusFilter]);

  const handleSaveEscrow = async (e) => {
    e.preventDefault();
    if (!formData.escrowAmount || !formData.propertyAddress) {
      toast.error('Escrow amount and property address are required');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_escrow_accounts SET
            escrow_type = ?, escrow_amount = ?, buyer_name = ?, seller_name = ?,
            property_id = ?, property_address = ?, escrow_agent_name = ?,
            escrow_agent_company = ?, release_date = ?, release_conditions = ?, release_status = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.escrowType, Number(formData.escrowAmount) || 0,
            formData.buyerName || null, formData.sellerName || null,
            formData.propertyId || null, formData.propertyAddress,
            formData.escrowAgentName || null, formData.escrowAgentCompany || null,
            formData.releaseDate || null, formData.releaseConditions || null,
            formData.releaseStatus || 'held', editingId, companyId
          ]
        );
        toast.success('Escrow record updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_escrow_accounts (
            id, created_at, company_id, escrow_type, escrow_amount, buyer_name,
            seller_name, property_id, property_address, escrow_agent_name,
            escrow_agent_company, release_date, release_conditions, release_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId, formData.escrowType, Number(formData.escrowAmount) || 0,
            formData.buyerName || null, formData.sellerName || null,
            formData.propertyId || null, formData.propertyAddress,
            formData.escrowAgentName || null, formData.escrowAgentCompany || null,
            formData.releaseDate || null, formData.releaseConditions || null,
            formData.releaseStatus || 'held'
          ]
        );
        toast.success('Earnest escrow account registered');
      }

      setShowForm(false);
      fetchEscrowsData();
    } catch (_err) {
      toast.error('Failed to save escrow account');
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
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#006065] to-[#004e52] flex items-center justify-center text-white shadow-md shadow-[#006065]/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Earnest Money & Escrow Vault
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Closing deposits, third-party escrow agent holds, and automated disbursement conditions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEscrowsData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

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
            className="h-9 px-4 text-xs font-semibold bg-[#006065] hover:bg-[#004e52] text-white shadow-md shadow-[#006065]/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Escrow Account
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
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

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Released at Closing</p>
              <p className="text-2xl font-bold text-[#006065] dark:text-[#fad503]">
                {formatCurrency(stats.totalReleased, 'USD')}
              </p>
              <p className="text-[11px] text-emerald-600/80">Successfully disbursed</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#006065]/10 text-[#006065] dark:text-[#fad503] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
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

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
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

      {/* ── 3. Filters & List ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, buyer, escrow agent..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
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

      {/* ── 4. Escrow Table View ── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
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
                      <td className="py-3.5 px-4 font-bold text-[#006065] dark:text-[#fad503] font-mono text-sm">
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
                        <Badge variant="outline" className={cn("text-[10px] font-medium border gap-1", st.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Select
                          value={item.release_status}
                          onValueChange={v => handleStatusChange(item.id, v)}
                        >
                          <SelectTrigger className="h-7 text-[10px] w-[110px] ml-auto">
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
        <SheetContent className="sm:max-w-md overflow-y-auto">
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
                className="h-9 text-xs mt-1"
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
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Seller Name</Label>
                <Input
                  value={formData.sellerName}
                  onChange={e => setFormData({ ...formData, sellerName: e.target.value })}
                  placeholder="Seller full name"
                  className="h-9 text-xs mt-1"
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
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Target Release Date</Label>
                <Input
                  type="date"
                  value={formData.releaseDate}
                  onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Escrow Agent / Title Company</Label>
              <Input
                value={formData.escrowAgentName}
                onChange={e => setFormData({ ...formData, escrowAgentName: e.target.value })}
                placeholder="First American Title / John Doe Agent"
                className="h-9 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Release Conditions</Label>
              <Input
                value={formData.releaseConditions}
                onChange={e => setFormData({ ...formData, releaseConditions: e.target.value })}
                placeholder="Clear title, signed closing disclosure"
                className="h-9 text-xs mt-1"
              />
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#006065] hover:bg-[#004e52] text-white mt-2">
              Establish Escrow
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
