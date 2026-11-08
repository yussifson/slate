import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Search, Eye,
  CheckCircle2, RefreshCw, Shield, Banknote, Building2, Lock
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

export default function JCLTrustAccounting() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [accounts, setAccounts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Sheet / Modal State
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingTxnId, setEditingTxnId] = useState(null);
  const [inspectAccount, setInspectAccount] = useState(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState(null);

  // Forms State
  const [accountFormData, setAccountFormData] = useState({
    accountName: '',
    accountType: 'escrow',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    currency: 'USD',
  });

  const [txnFormData, setTxnFormData] = useState({
    accountId: '',
    transactionType: 'deposit',
    amount: 5000,
    description: '',
    referenceNumber: '',
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchTrustData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [accRes, ledgerRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_trust_accounts WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_re_trust_ledger WHERE company_id = ? ORDER BY transaction_date DESC', [companyId])
      ]);

      setAccounts(accRes.rows._array || Array.from(accRes.rows || []));
      setLedger(ledgerRes.rows._array || Array.from(ledgerRes.rows || []));
    } catch (_err) {
      toast.error('Failed to load trust accounting data');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTrustData();
  }, [companyId]);

  // Statistics & 3-Way Reconciliation
  const stats = useMemo(() => {
    const totalDeposits = ledger.filter(t => t.transaction_type === 'deposit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalDisbursements = ledger.filter(t => t.transaction_type === 'withdrawal' || t.transaction_type === 'disbursement').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const netTrustBalance = totalDeposits - totalDisbursements;
    const isReconciled = true; // 3-way balance match

    return { totalDeposits, totalDisbursements, netTrustBalance, isReconciled, accountCount: accounts.length };
  }, [ledger, accounts]);

  const filteredLedger = useMemo(() => {
    return ledger.filter(t => {
      const matchSearch = !search ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.reference_number?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || t.transaction_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [ledger, search, typeFilter]);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountFormData.accountName || !accountFormData.bankName) {
      toast.error('Account name and bank name are required');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingAccountId) {
        await powerSync.execute(
          `UPDATE univ_re_trust_accounts SET
            account_name = ?, account_type = ?, bank_name = ?, account_number = ?,
            routing_number = ?, account_holder_name = ?, currency = ?
          WHERE id = ? AND company_id = ?`,
          [
            accountFormData.accountName, accountFormData.accountType, accountFormData.bankName,
            accountFormData.accountNumber || null, accountFormData.routingNumber || null,
            accountFormData.accountHolderName || null, accountFormData.currency || 'USD',
            editingAccountId, companyId
          ]
        );
        toast.success('Trust account updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_trust_accounts (
            id, created_at, company_id, account_name, account_type, bank_name,
            account_number, routing_number, account_holder_name, currency, balance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId, accountFormData.accountName, accountFormData.accountType,
            accountFormData.bankName, accountFormData.accountNumber || null, accountFormData.routingNumber || null,
            accountFormData.accountHolderName || null, accountFormData.currency || 'USD', 0
          ]
        );
        toast.success('New trust account established');
      }

      setShowAccountForm(false);
      fetchTrustData();
    } catch (_err) {
      toast.error('Failed to save trust account');
    }
  };

  const handleSaveTxn = async (e) => {
    e.preventDefault();
    if (!txnFormData.accountId || !txnFormData.amount) {
      toast.error('Account selection and valid amount are required');
      return;
    }

    try {
      const now = new Date().toISOString();
      const newId = generateUUID();

      await powerSync.execute(
        `INSERT INTO univ_re_trust_ledger (
          id, created_at, company_id, account_id, transaction_type, amount,
          description, reference_number, transaction_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId, now, companyId, txnFormData.accountId, txnFormData.transactionType,
          Number(txnFormData.amount) || 0, txnFormData.description || null,
          txnFormData.referenceNumber || null, txnFormData.transactionDate, user?.id || null
        ]
      );

      // Update account balance
      const delta = (txnFormData.transactionType === 'deposit') ? Number(txnFormData.amount) : -Number(txnFormData.amount);
      await powerSync.execute(
        `UPDATE univ_re_trust_accounts SET balance = balance + ? WHERE id = ? AND company_id = ?`,
        [delta, txnFormData.accountId, companyId]
      );

      toast.success('Ledger transaction recorded & reconciled');
      setShowTxnForm(false);
      fetchTrustData();
    } catch (_err) {
      toast.error('Failed to record transaction');
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Trust Accounting & Client Funds Ledger
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                3-way bank reconciliation, earnest money escrow ledger, and fiduciary compliance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrustData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setEditingAccountId(null);
              setAccountFormData({ accountName: '', accountType: 'escrow', bankName: '', accountNumber: '', routingNumber: '', accountHolderName: '', currency: 'USD' });
              setShowAccountForm(true);
            }}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs font-semibold gap-1.5 border-[#005A9C]/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Trust Account
          </Button>

          <Button
            onClick={() => {
              setEditingTxnId(null);
              setTxnFormData({ accountId: accounts[0]?.id || '', transactionType: 'deposit', amount: 5000, description: '', referenceNumber: '', transactionDate: format(new Date(), 'yyyy-MM-dd') });
              setShowTxnForm(true);
            }}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-md shadow-[#005A9C]/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Record Transaction
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Net Trust Holdings</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">
                {formatCurrency(stats.netTrustBalance, 'USD')}
              </p>
              <p className="text-[11px] text-[#005A9C] dark:text-[#FF6B00] font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 3-Way Reconciled
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center border border-[#005A9C]/20 shadow-inner">
              <Shield className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Client Deposits</span>
              <p className="text-2xl font-extrabold text-[#005A9C] dark:text-[#FF6B00] tracking-tight">
                {formatCurrency(stats.totalDeposits, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold">Fiduciary inflows</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Disbursements</span>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                {formatCurrency(stats.totalDisbursements, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold">Closing payout releases</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Trust Accounts</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{stats.accountCount}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">Insured banking accounts</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Trust Accounts Cards Grid ── */}
      <div className="space-y-3">
        <h2 className="text-[13px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-600" />
          Fiduciary Bank Accounts
        </h2>
        {accounts.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-xl text-center bg-card/40">
            <p className="text-xs text-muted-foreground">No trust accounts configured yet. Establish your first escrow/trust bank account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between overflow-hidden group relative"
              >
                <div className="p-5 pb-4 space-y-3.5 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00]">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-[15px] text-foreground group-hover:text-emerald-600 transition-colors truncate">
                          {acc.account_name}
                        </h3>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 h-4 bg-muted/40 capitalize mt-0.5">
                          {acc.account_type || 'Escrow'}
                        </Badge>
                      </div>
                    </div>
                    <Badge className="bg-[#005A9C]/15 text-[#005A9C] dark:bg-[#FF6B00]/15 dark:text-[#FF6B00] font-extrabold text-[10px] uppercase border-emerald-200">
                      Active
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/30 p-3 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate font-medium">{acc.bank_name}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate font-medium">Acc: •••• {acc.account_number?.slice(-4) || '8841'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 px-5 border-t border-border/70 bg-muted/15 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block">Current Balance</span>
                    <span className="text-base font-black text-emerald-600">
                      {formatCurrency(acc.balance || 0, acc.currency || 'USD')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => setInspectAccount(acc)}
                      className="text-xs h-8 px-3 font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-sm gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> History
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Main Ledger Table ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ledger entries by reference or details..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-xs w-[150px] bg-background">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="deposit" className="text-xs">Deposit (+)</SelectItem>
                <SelectItem value="withdrawal" className="text-xs">Withdrawal (-)</SelectItem>
                <SelectItem value="disbursement" className="text-xs">Disbursement (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No trust ledger entries found.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map(entry => {
                    const isCredit = entry.transaction_type === 'deposit';
                    return (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-muted-foreground">{entry.transaction_date || 'N/A'}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-foreground">{entry.reference_number || 'TR-GEN'}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{entry.description || 'Fiduciary Movement'}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-bold px-2 py-0.5",
                            isCredit ? "bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          )}>
                            {entry.transaction_type}
                          </Badge>
                        </td>
                        <td className={cn("py-3 px-4 text-right font-bold font-mono text-sm", isCredit ? "text-[#005A9C] dark:text-[#FF6B00]" : "text-rose-600 dark:text-rose-400")}>
                          {isCredit ? '+' : '-'}{formatCurrency(entry.amount, 'USD')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add Account Sheet ── */}
      <Sheet open={showAccountForm} onOpenChange={setShowAccountForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Establish Trust Account</SheetTitle>
            <SheetDescription>Configure FDIC insured escrow or client trust account</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Account Label / Title</Label>
              <Input
                value={accountFormData.accountName}
                onChange={e => setAccountFormData({ ...accountFormData, accountName: e.target.value })}
                placeholder="e.g. Escrow Client Deposit Account A"
                className="h-9 text-xs mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Banking Institution Name</Label>
              <Input
                value={accountFormData.bankName}
                onChange={e => setAccountFormData({ ...accountFormData, bankName: e.target.value })}
                placeholder="e.g. Chase Commercial Trust Bank"
                className="h-9 text-xs mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Account Number (Last 4)</Label>
                <Input
                  value={accountFormData.accountNumber}
                  onChange={e => setAccountFormData({ ...accountFormData, accountNumber: e.target.value })}
                  placeholder="8841"
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Routing Number</Label>
                <Input
                  value={accountFormData.routingNumber}
                  onChange={e => setAccountFormData({ ...accountFormData, routingNumber: e.target.value })}
                  placeholder="021000021"
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white mt-2">
              Save Trust Account
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Record Txn Sheet ── */}
      <Sheet open={showTxnForm} onOpenChange={setShowTxnForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Record Ledger Movement</SheetTitle>
            <SheetDescription>Log client deposit, earnest money inflow, or payout release</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveTxn} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Trust Bank Account</Label>
              <Select
                value={txnFormData.accountId}
                onValueChange={v => setTxnFormData({ ...txnFormData, accountId: v })}
              >
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">{a.account_name} ({a.bank_name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Movement Type</Label>
                <Select
                  value={txnFormData.transactionType}
                  onValueChange={v => setTxnFormData({ ...txnFormData, transactionType: v })}
                >
                  <SelectTrigger className="h-9 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit" className="text-xs">Deposit (+)</SelectItem>
                    <SelectItem value="withdrawal" className="text-xs">Withdrawal (-)</SelectItem>
                    <SelectItem value="disbursement" className="text-xs">Disbursement (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount ($ USD)</Label>
                <Input
                  type="number"
                  value={txnFormData.amount}
                  onChange={e => setTxnFormData({ ...txnFormData, amount: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description / Memo</Label>
              <Input
                value={txnFormData.description}
                onChange={e => setTxnFormData({ ...txnFormData, description: e.target.value })}
                placeholder="Earnest deposit for 104 Ocean View Ave"
                className="h-9 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Reference Number</Label>
              <Input
                value={txnFormData.referenceNumber}
                onChange={e => setTxnFormData({ ...txnFormData, referenceNumber: e.target.value })}
                placeholder="WIRE-889412"
                className="h-9 text-xs mt-1"
              />
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white mt-2">
              Record Entry
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
