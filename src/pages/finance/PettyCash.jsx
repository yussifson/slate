import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  Download, Printer, Filter, Calendar, FileText, CheckCircle2,
  DollarSign, AlertCircle, Trash2, Search
} from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Office Supplies',
  'Transport & Fuel',
  'Client Refreshments',
  'Repairs & Maintenance',
  'Utilities & Data',
  'Courier & Logistics',
  'Field Allowances',
  'Miscellaneous'
];

function fmt(n) {
  return 'GH₵ ' + (Number(n) || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 });
}

export default function PettyCash() {
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // all, expense, replenishment
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    transaction_type: 'expense', // expense | replenishment
    description: '',
    category: 'Office Supplies',
    amount: '',
    paid_to: '',
    receipt_ref: '',
    notes: '',
  });

  const loadData = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('petty_cash')
        .select('*')
        .eq('company_id', companyId)
        .order('transaction_date', { ascending: false });

      if (!error && data) {
        setEntries(data);
      } else {
        const stored = localStorage.getItem(`jcl_petty_cash_${companyId}`);
        if (stored) {
          try { setEntries(JSON.parse(stored)); } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Petty cash load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  // Compute running balance & stats
  const stats = useMemo(() => {
    let totalReplenished = 0;
    let totalSpent = 0;

    entries.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.transaction_type === 'replenishment') {
        totalReplenished += amt;
      } else {
        totalSpent += amt;
      }
    });

    const currentBalance = totalReplenished - totalSpent;
    return { totalReplenished, totalSpent, currentBalance };
  }, [entries]);

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      toast.error('Please enter description and amount');
      return;
    }

    try {
      const amt = Number(formData.amount);
      const newBal = formData.transaction_type === 'replenishment' 
        ? stats.currentBalance + amt 
        : stats.currentBalance - amt;

      const payload = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'pc_' + Date.now(),
        company_id: companyId,
        transaction_date: formData.transaction_date,
        transaction_type: formData.transaction_type,
        description: formData.description,
        category: formData.transaction_type === 'replenishment' ? 'Float Replenishment' : formData.category,
        amount: amt,
        paid_to: formData.paid_to || '',
        receipt_ref: formData.receipt_ref || '',
        balance_after: newBal,
        recorded_by: user?.email || user?.id,
        notes: formData.notes || '',
        created_at: new Date().toISOString()
      };

      await supabase.from('petty_cash').insert([payload]);

      const updated = [payload, ...entries];
      localStorage.setItem(`jcl_petty_cash_${companyId}`, JSON.stringify(updated));
      setEntries(updated);

      toast.success(formData.transaction_type === 'replenishment' ? 'Petty cash float replenished!' : 'Petty cash expense recorded!');
      setShowModal(false);
      setFormData({
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        transaction_type: 'expense',
        description: '',
        category: 'Office Supplies',
        amount: '',
        paid_to: '',
        receipt_ref: '',
        notes: '',
      });
    } catch (err) {
      toast.error('Failed to save petty cash transaction');
      console.error(err);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      if (typeFilter !== 'all' && item.transaction_type !== typeFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (item.description || '').toLowerCase().includes(q) ||
               (item.paid_to || '').toLowerCase().includes(q) ||
               (item.receipt_ref || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [entries, typeFilter, categoryFilter, search]);

  const handleExportCSV = () => {
    if (entries.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    const headers = ['Date', 'Type', 'Description', 'Category', 'Paid To / Received From', 'Amount (GHS)', 'Receipt Ref', 'Recorded By'];
    const rows = entries.map(e => [
      e.transaction_date,
      e.transaction_type,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.category,
      `"${(e.paid_to || '').replace(/"/g, '""')}"`,
      e.amount,
      e.receipt_ref || '',
      e.recorded_by || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jcl_petty_cash_ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Petty cash ledger exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Section Header ── */}
      <div className="flex items-center justify-between gap-3 min-w-0 border-b pb-4 border-border/80">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2 truncate">
            <Wallet className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="truncate">Petty Cash Float & Ledger</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
            Imprest disbursements, office expense vouchers, and safe replenishments
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs h-9 px-3 font-bold rounded-xl gap-1 shrink-0">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">Export</span>
          </Button>
          <Button 
            onClick={() => setShowModal(true)} 
            size="sm" 
            className="text-xs h-9 px-3 sm:px-4 font-bold bg-[#005A9C] hover:bg-[#00477D] text-white gap-1.5 shadow-sm rounded-xl shrink-0 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Cash Balance</span>
              <p className={cn("text-2xl font-black", stats.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {fmt(stats.currentBalance)}
              </p>
              <p className="text-[11px] text-muted-foreground">Imprest in safe</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Float Replenished</span>
              <p className="text-2xl font-black text-indigo-600">{fmt(stats.totalReplenished)}</p>
              <p className="text-[11px] text-muted-foreground">Cash injections</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Cash Disbursed</span>
              <p className="text-2xl font-black text-rose-600">{fmt(stats.totalSpent)}</p>
              <p className="text-[11px] text-muted-foreground">Vouchers redeemed</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search description, recipient, voucher #..." 
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses Only</SelectItem>
              <SelectItem value="replenishment">Replenishment</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-xs w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 4. Transactions Table ── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Paid To / Recipient</th>
                <th className="py-3 px-4">Receipt Ref</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No petty cash records found. Click <strong>New Entry</strong> to record float disbursement.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(item => {
                  const isReplenish = item.transaction_type === 'replenishment';
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-foreground font-medium whitespace-nowrap">
                        {item.transaction_date}
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            isReplenish 
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300"
                          )}
                        >
                          {isReplenish ? '+ Replenish' : '- Expense'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">
                        {item.paid_to || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {item.receipt_ref || '—'}
                      </td>
                      <td className={cn("py-3 px-4 text-right font-bold whitespace-nowrap", isReplenish ? "text-emerald-600" : "text-rose-600")}>
                        {isReplenish ? `+ ${fmt(item.amount)}` : `- ${fmt(item.amount)}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {item.balance_after ? fmt(item.balance_after) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Add Transaction Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              <span>Record Petty Cash Entry</span>
            </DialogTitle>
            <DialogDescription>
              Disburse cash with voucher tracking or replenish the company petty float.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEntry} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Entry Type</Label>
              <Select 
                value={formData.transaction_type} 
                onValueChange={v => setFormData({ ...formData, transaction_type: v })}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Cash Expense (Disbursement)</SelectItem>
                  <SelectItem value="replenishment">Float Replenishment (Cash-in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Amount (GH₵) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-1 h-9 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Description / Purpose *</Label>
              <Input
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Fuel for Site Inspection vehicle, A4 printer sheets"
                className="mt-1 h-9 text-xs"
              />
            </div>

            {formData.transaction_type === 'expense' && (
              <div>
                <Label className="text-xs font-semibold">Expense Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={v => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Paid To (Recipient)</Label>
                <Input
                  value={formData.paid_to}
                  onChange={e => setFormData({ ...formData, paid_to: e.target.value })}
                  placeholder="e.g. Driver / Total Station"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Receipt / Voucher #</Label>
                <Input
                  value={formData.receipt_ref}
                  onChange={e => setFormData({ ...formData, receipt_ref: e.target.value })}
                  placeholder="e.g. REC-9921"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white font-semibold">
                Post Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
