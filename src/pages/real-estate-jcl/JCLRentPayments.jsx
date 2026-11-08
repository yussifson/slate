import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, Calendar, Home, User, AlertTriangle, CheckCircle2, Clock, TrendingUp, Plus, Search, Eye, Edit, Trash2, Building2, Phone
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
  paid: { label: 'Paid in Full', badge: 'bg-[#005A9C]/15 text-[#005A9C] dark:bg-[#FF6B00]/15 dark:text-[#FF6B00] border-emerald-200', dot: 'bg-emerald-500' },
  pending: { label: 'Payment Pending', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200', dot: 'bg-amber-500' },
  overdue: { label: 'Overdue Arrears', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200', dot: 'bg-rose-500' },
};

export default function JCLRentPayments() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tenantName: '',
    propertyAddress: '',
    amount: 2500,
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending',
    paymentMethod: 'Bank Transfer'
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [payRes, leaseRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_rent_payments WHERE company_id = ? ORDER BY due_date DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY property_address ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      setPayments(payRes.rows._array || Array.from(payRes.rows || []));
      setLeases(leaseRes.rows._array || Array.from(leaseRes.rows || []));
    } catch (_err) {
      toast.error('Failed to load rent payments');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const stats = useMemo(() => {
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return { totalCollected, totalPending, totalOverdue, totalCount: payments.length };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchSearch = !search ||
        (p.tenant_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.property_address || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || (p.status || 'pending') === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_re_rent_payments SET status = ? WHERE id = ? AND company_id = ?`,
        [newStatus, id, companyId]
      );
      toast.success('Rent status updated');
      fetchData();
    } catch (_err) {
      toast.error('Failed to update status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.tenantName || !formData.propertyAddress) {
      toast.error('Tenant Name and Property Address are required');
      return;
    }

    try {
      const newId = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_rent_payments (
          id, created_at, company_id, tenant_name, property_address,
          amount, due_date, status, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId, now, companyId, formData.tenantName, formData.propertyAddress,
          Number(formData.amount) || 0, formData.dueDate, formData.status, formData.paymentMethod
        ]
      );

      toast.success('Rent payment recorded');
      setShowForm(false);
      fetchData();
    } catch (_err) {
      toast.error('Failed to record rent payment');
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans overflow-x-hidden">
      {/* ── 1. Header (Clean mobile native header, no sub-description, no refresh button) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
            Rent Payments
          </h1>
        </div>

        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          className="w-full sm:w-auto h-9 px-4 text-xs font-bold gap-1.5 bg-[#005A9C] hover:bg-[#00477D] text-white shadow-sm rounded-xl"
        >
          <Plus className="h-4 w-4" /> Record Rent Entry
        </Button>
      </div>

      {/* ── 2. Dedicated Mobile 2x2 Stats Grid (< md) & Desktop Row (>= md) ── */}
      <div className="grid grid-cols-2 md:hidden gap-2.5">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Collected</span>
          </div>
          <p className="text-sm font-black text-emerald-600 truncate">{formatCurrency(stats.totalCollected, 'USD')}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Received rent</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-sm font-black text-amber-600 truncate">{formatCurrency(stats.totalPending, 'USD')}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Awaiting payment</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Arrears</span>
          </div>
          <p className="text-sm font-black text-rose-600 truncate">{formatCurrency(stats.totalOverdue, 'USD')}</p>
          <span className="text-[9px] text-rose-500 font-semibold">Action required</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CreditCard className="w-3.5 h-3.5 text-[#005A9C]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Payments</span>
          </div>
          <p className="text-sm font-black text-foreground truncate">{stats.totalCount}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Total records</span>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Collected Rent Roll</p>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{formatCurrency(stats.totalCollected, 'USD')}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">Received this period</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#005A9C]/10 text-[#005A9C] flex items-center justify-center border border-[#005A9C]/20 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending Collection</p>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{formatCurrency(stats.totalPending, 'USD')}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">Awaiting tenant payment</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Overdue Arrears</p>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{formatCurrency(stats.totalOverdue, 'USD')}</p>
              <p className="text-[11px] text-rose-500 font-semibold">Action required</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card border border-border/80 p-2.5 sm:p-3 rounded-2xl shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tenant name or property..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 sm:pl-9 h-9 text-xs bg-background rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] sm:w-[170px] bg-background border-border/80 rounded-xl shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Payments</SelectItem>
              <SelectItem value="paid" className="text-xs">Paid in Full</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="overdue" className="text-xs">Overdue Arrears</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 4. Mobile Cards (< md) ── */}
      <div className="md:hidden space-y-2.5">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
            No rent payment records found.
          </div>
        ) : (
          filteredPayments.map(p => {
            const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
            return (
              <div key={p.id} className="bg-card border border-border/80 rounded-2xl p-3.5 space-y-2 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">{p.tenant_name || 'Tenant'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.property_address || 'Property'}</p>
                  </div>
                  <span className="font-bold font-mono text-sm text-foreground shrink-0">
                    {formatCurrency(p.amount, 'USD')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                  <span className="font-mono text-[10px] text-muted-foreground">Due: {p.due_date || 'N/A'}</span>
                  <Select value={p.status} onValueChange={v => handleStatusChange(p.id, v)}>
                    <SelectTrigger className="h-7 text-[10px] font-bold w-[110px] bg-background rounded-lg shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid" className="text-xs">Mark Paid</SelectItem>
                      <SelectItem value="pending" className="text-xs">Mark Pending</SelectItem>
                      <SelectItem value="overdue" className="text-xs">Mark Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 5. Full Width Desktop Table (>= md) ── */}
      <div className="hidden md:block bg-card rounded-2xl border border-border/80 overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 uppercase tracking-wider text-muted-foreground font-extrabold border-b border-border/80 text-[10px]">
              <tr>
                <th className="p-3.5 pl-4">Tenant Name</th>
                <th className="p-3.5">Property Address</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No rent payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors group">
                      <td className="p-3.5 pl-4 font-bold text-foreground text-xs">{p.tenant_name || 'Tenant'}</td>
                      <td className="p-3.5 text-muted-foreground">{p.property_address || 'Unit Address'}</td>
                      <td className="p-3.5 font-mono text-muted-foreground font-semibold">{p.due_date || 'N/A'}</td>
                      <td className="p-3.5 font-black text-foreground text-xs">{formatCurrency(p.amount, 'USD')}</td>
                      <td className="p-3.5">
                        <Badge variant="outline" className={cn("text-[10px] font-bold border gap-1.5 py-0.5 px-2.5 rounded-lg", st.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </Badge>
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <Select value={p.status} onValueChange={v => handleStatusChange(p.id, v)}>
                          <SelectTrigger className="h-7 text-[10px] font-bold w-[110px] ml-auto bg-background rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid" className="text-xs">Mark Paid</SelectItem>
                            <SelectItem value="pending" className="text-xs">Mark Pending</SelectItem>
                            <SelectItem value="overdue" className="text-xs">Mark Overdue</SelectItem>
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

      {/* Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] p-4 sm:p-6">
          <SheetHeader className="mb-4">
            <SheetTitle>Record Rent Collection</SheetTitle>
            <SheetDescription>Log tenant rent roll payment details</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Select Lease (Optional)</Label>
              <Select
                value=""
                onValueChange={val => {
                  const sel = leases.find(l => l.id === val);
                  if (sel) {
                    setFormData({
                      ...formData,
                      tenantName: sel.tenant_name || '',
                      propertyAddress: sel.property_address || '',
                      amount: sel.monthly_rent || 2500
                    });
                  }
                }}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs mt-1">
                  <SelectValue placeholder="Pick active lease..." />
                </SelectTrigger>
                <SelectContent>
                  {leases.map(l => (
                    <SelectItem key={l.id} value={l.id} className="text-xs">{l.tenant_name} — {l.property_address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Tenant Name *</Label>
              <Input
                value={formData.tenantName}
                onChange={e => setFormData({ ...formData, tenantName: e.target.value })}
                className="h-9 rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Property Address *</Label>
              <Input
                value={formData.propertyAddress}
                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                className="h-9 rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-9 rounded-xl text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white mt-2">
              Record Rent Payment
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
